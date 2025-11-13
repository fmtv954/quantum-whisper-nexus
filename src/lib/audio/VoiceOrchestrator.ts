/**
 * Voice Orchestrator - Coordinates LiveKit, Deepgram, and OpenAI
 * Handles the complete voice pipeline for real-time AI conversations
 */

import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteAudioTrack,
  RemoteParticipant,
} from 'livekit-client';

// ============= Audio Encoding Utilities =============

/**
 * Convert Float32Array PCM audio to Int16 PCM and encode as base64
 */
function encodeAudioChunk(float32Array: Float32Array): string {
  // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Convert to Uint8Array for base64 encoding
  const uint8Array = new Uint8Array(int16Array.buffer);
  
  // Convert to base64 in chunks to avoid stack overflow
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode(...Array.from(chunk));
  }
  
  return btoa(binary);
}

/**
 * Audio recorder for capturing microphone input
 */
class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    if (this.isRecording) {
      console.warn('AudioRecorder: Already recording');
      return;
    }

    try {
      console.log('AudioRecorder: Requesting microphone access...');
      
      // Request microphone access with optimal settings for voice
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000, // 24kHz for Deepgram
          channelCount: 1,   // Mono
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('AudioRecorder: Microphone access granted');
      
      // Create audio context with 24kHz sample rate
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      // Create source from microphone stream
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create processor for capturing audio chunks
      // Buffer size of 4096 samples = ~170ms at 24kHz
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      // Connect the audio graph
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.isRecording = true;
      console.log('AudioRecorder: Recording started');
    } catch (error) {
      console.error('AudioRecorder: Error starting recording:', error);
      throw error;
    }
  }

  stop() {
    console.log('AudioRecorder: Stopping recording...');
    this.isRecording = false;
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('AudioRecorder: Stopped track:', track.kind);
      });
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('AudioRecorder: Recording stopped');
  }

  isActive(): boolean {
    return this.isRecording;
  }
}

// ============= VoiceOrchestrator =============

export interface VoiceOrchestratorCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onTranscriptDelta?: (text: string, speaker: "user" | "assistant") => void;
  onError?: (error: Error) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export class VoiceOrchestrator {
  private room: Room | null = null;
  private ws: WebSocket | null = null;
  private callbacks: VoiceOrchestratorCallbacks;
  private isConnected = false;
  private callId: string | null = null;
  private audioContext: AudioContext | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(callbacks: VoiceOrchestratorCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(livekitUrl: string, token: string, campaignId: string, accountId: string) {
    try {
      console.log('[VoiceOrchestrator] Connecting via WebSocket...');
      
      // Connect to WebSocket endpoint
      const SUPABASE_PROJECT_ID = 'rwpndifkuwnohkzqmqoa';
      const wsUrl = `wss://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/voice-orchestrator`;
      
      this.ws = new WebSocket(wsUrl);

      // Set up WebSocket handlers
      this.ws.onopen = async () => {
        console.log('[VoiceOrchestrator] WebSocket connected');
        
        // Start call session
        this.ws!.send(JSON.stringify({
          type: 'start_call',
          campaignId,
          accountId,
        }));

        // Initialize and start audio recorder
        try {
          this.audioRecorder = new AudioRecorder((audioData) => {
            this.handleAudioChunk(audioData);
          });
          await this.audioRecorder.start();
          console.log('[VoiceOrchestrator] Audio recording started');
        } catch (error) {
          console.error('[VoiceOrchestrator] Failed to start audio recording:', error);
          this.callbacks.onError?.(new Error('Failed to access microphone. Please check permissions.'));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('[VoiceOrchestrator] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[VoiceOrchestrator] WebSocket error:', error);
        this.callbacks.onError?.(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = () => {
        console.log('[VoiceOrchestrator] WebSocket disconnected');
        this.isConnected = false;
        this.callbacks.onDisconnect?.();
        
        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[VoiceOrchestrator] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
            this.connect(livekitUrl, token, campaignId, accountId);
          }, 2000 * this.reconnectAttempts);
        }
      };

      // Initialize audio context
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

    } catch (error) {
      console.error('[VoiceOrchestrator] Connection error:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private handleWebSocketMessage(message: any) {
    console.log('[VoiceOrchestrator] Received:', message.type);

    switch (message.type) {
      case 'call_started':
        this.callId = message.callId;
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.callbacks.onConnect?.();
        console.log(`[VoiceOrchestrator] Call started: ${this.callId}`);
        break;

      case 'transcript':
        this.callbacks.onTranscriptDelta?.(message.text, message.speaker);
        break;

      case 'audio_response':
        this.playAudioResponse(message.audioData);
        break;

      case 'audio_received':
        // Audio chunk acknowledged
        break;

      case 'call_ended':
        this.isConnected = false;
        this.callbacks.onDisconnect?.();
        break;

      case 'error':
        console.error('[VoiceOrchestrator] Server error:', message.error);
        this.callbacks.onError?.(new Error(message.error));
        break;

      default:
        console.warn('[VoiceOrchestrator] Unknown message type:', message.type);
    }
  }

  // Removed: startCallSession now handled via WebSocket 'start_call' message

  private handleConnected() {
    console.log('[VoiceOrchestrator] Room connected');
  }

  private handleDisconnected() {
    console.log('[VoiceOrchestrator] Room disconnected');
    this.isConnected = false;
    this.callbacks.onDisconnect?.();
  }

  private handleTrackSubscribed(
    track: RemoteTrack,
    publication: any,
    participant: RemoteParticipant
  ) {
    console.log('[VoiceOrchestrator] Track subscribed:', track.kind);

    if (track.kind === Track.Kind.Audio) {
      const audioTrack = track as RemoteAudioTrack;
      const audioElement = audioTrack.attach();
      document.body.appendChild(audioElement);
      console.log('[VoiceOrchestrator] AI audio track playing');
    }
  }

  private handleTrackUnsubscribed(
    track: RemoteTrack,
    publication: any,
    participant: RemoteParticipant
  ) {
    console.log('[VoiceOrchestrator] Track unsubscribed:', track.kind);
    track.detach();
  }

  async sendMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    if (!this.callId) {
      throw new Error('Call session not started');
    }

    console.log('[VoiceOrchestrator] Sending text message:', text);

    try {
      this.ws.send(JSON.stringify({
        type: 'user_text',
        callId: this.callId,
        text,
      }));
    } catch (error) {
      console.error('[VoiceOrchestrator] Failed to send message:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private handleAudioChunk(audioData: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return; // Not ready to send
    }

    if (!this.callId) {
      return; // No active call
    }

    try {
      // Encode audio chunk to base64
      const encoded = encodeAudioChunk(audioData);
      
      // Send to backend
      this.ws.send(JSON.stringify({
        type: 'audio_chunk',
        callId: this.callId,
        audioData: encoded,
      }));
    } catch (error) {
      console.error('[VoiceOrchestrator] Error encoding audio chunk:', error);
    }
  }

  private async playAudioResponse(base64Audio: string) {
    try {
      const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const audioBuffer = await this.audioContext.decodeAudioData(audioBytes.buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      this.callbacks.onSpeakingChange?.(true);

      source.onended = () => {
        this.callbacks.onSpeakingChange?.(false);
      };

      source.start(0);
    } catch (error) {
      console.error('[VoiceOrchestrator] Failed to play audio:', error);
    }
  }

  disconnect() {
    console.log('[VoiceOrchestrator] Disconnecting...');
    
    // Stop audio recording
    if (this.audioRecorder) {
      this.audioRecorder.stop();
      this.audioRecorder = null;
    }

    // End call session via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.callId) {
      this.ws.send(JSON.stringify({
        type: 'end_call',
        callId: this.callId,
      }));
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }

    this.isConnected = false;
    this.callId = null;
    this.reconnectAttempts = 0;
  }

  getConnectionState(): boolean {
    return this.isConnected;
  }

  /**
   * Enable or disable microphone
   */
  setMicrophoneEnabled(enabled: boolean) {
    if (this.room) {
      this.room.localParticipant.setMicrophoneEnabled(enabled);
      console.log(`[VoiceOrchestrator] Microphone ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
}
