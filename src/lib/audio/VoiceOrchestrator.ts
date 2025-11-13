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

export interface VoiceOrchestratorCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onTranscriptDelta?: (text: string, speaker: "user" | "assistant") => void;
  onError?: (error: Error) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export class VoiceOrchestrator {
  private room: Room | null = null;
  private callbacks: VoiceOrchestratorCallbacks;
  private isConnected = false;
  private callId: string | null = null;
  private audioContext: AudioContext | null = null;

  constructor(callbacks: VoiceOrchestratorCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(livekitUrl: string, token: string, campaignId: string, accountId: string) {
    try {
      console.log('[VoiceOrchestrator] Connecting to LiveKit...');
      
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up event listeners
      this.room
        .on(RoomEvent.Connected, this.handleConnected.bind(this))
        .on(RoomEvent.Disconnected, this.handleDisconnected.bind(this))
        .on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed.bind(this))
        .on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed.bind(this));

      // Connect to room
      await this.room.connect(livekitUrl, token);

      // Enable microphone
      await this.room.localParticipant.setMicrophoneEnabled(true);

      // Start call session with backend orchestrator
      await this.startCallSession(campaignId, accountId);

      console.log('[VoiceOrchestrator] Connected successfully');
      this.isConnected = true;
      this.callbacks.onConnect?.();
    } catch (error) {
      console.error('[VoiceOrchestrator] Connection error:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async startCallSession(campaignId: string, accountId: string) {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'start_call',
          campaignId,
          context: { accountId },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start call session: ${response.status}`);
      }

      const { callId } = await response.json();
      this.callId = callId;
      console.log(`[VoiceOrchestrator] Call session started: ${callId}`);
    } catch (error) {
      console.error('[VoiceOrchestrator] Failed to start call session:', error);
      throw error;
    }
  }

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
    if (!this.callId) {
      throw new Error('Call session not started');
    }

    console.log('[VoiceOrchestrator] Sending text message:', text);

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user_text',
          callId: this.callId,
          text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const { response: aiResponse, audioResponse } = await response.json();
      
      // Notify callbacks
      this.callbacks.onTranscriptDelta?.(text, 'user');
      this.callbacks.onTranscriptDelta?.(aiResponse, 'assistant');

      // Play audio response
      if (audioResponse) {
        await this.playAudioResponse(audioResponse);
      }

      return aiResponse;
    } catch (error) {
      console.error('[VoiceOrchestrator] Failed to send message:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
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
    
    // End call session
    if (this.callId) {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      fetch(`${SUPABASE_URL}/functions/v1/voice-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'end_call',
          callId: this.callId,
        }),
      }).catch(error => {
        console.error('[VoiceOrchestrator] Failed to end call session:', error);
      });
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
