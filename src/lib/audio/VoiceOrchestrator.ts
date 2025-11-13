/**
 * Voice Orchestrator - Coordinates LiveKit WebRTC, Deepgram STT, and OpenAI
 * Phase 1: Uses 16kHz Opus codec via LiveKit for optimal performance
 */

import { LiveKitManager } from './LiveKitManager';
import type { RemoteAudioTrack } from 'livekit-client';

export interface VoiceOrchestratorCallbacks {
  onConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
  onTranscript: (text: string, speaker: 'user' | 'assistant', isFinal: boolean) => void;
  onError: (error: Error) => void;
  onSpeakingChange: (speaking: boolean) => void;
}

export class VoiceOrchestrator {
  private ws: WebSocket | null = null;
  private livekit: LiveKitManager | null = null;
  private callbacks: VoiceOrchestratorCallbacks;
  private callId: string | null = null;
  private audioContext: AudioContext | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private isStreamingAudio = false;

  constructor(callbacks: VoiceOrchestratorCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to LiveKit WebRTC and voice orchestrator backend
   * Uses 16kHz Opus codec as per architecture specification
   */
  async connect(
    livekitUrl: string,
    token: string,
    campaignId: string,
    accountId: string,
    roomName: string
  ): Promise<void> {
    try {
      console.log('[VoiceOrchestrator] Connecting with LiveKit (16kHz Opus)...');
      this.callbacks.onConnectionStatus('connecting');

      // Initialize LiveKit connection with 16kHz Opus
      this.livekit = new LiveKitManager({
        onConnected: () => {
          console.log('[VoiceOrchestrator] LiveKit WebRTC connected (16kHz Opus)');
          this.callbacks.onConnectionStatus('connected');
        },
        onDisconnected: () => {
          console.log('[VoiceOrchestrator] LiveKit disconnected');
          this.callbacks.onConnectionStatus('disconnected');
        },
        onError: (error) => {
          console.error('[VoiceOrchestrator] LiveKit error:', error);
          this.callbacks.onError(error);
        },
        onAudioReceived: (track: RemoteAudioTrack) => {
          console.log('[VoiceOrchestrator] Received AI audio track from LiveKit');
        },
      });

      await this.livekit.connect(livekitUrl, token, roomName);

      // Connect to orchestrator backend via WebSocket for signaling
      const wsUrl = `${import.meta.env.VITE_SUPABASE_URL.replace('http', 'ws')}/functions/v1/voice-orchestrator`;
      
      console.log('[VoiceOrchestrator] Opening WebSocket for signaling');
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[VoiceOrchestrator] WebSocket signaling connected');

        const startMessage = {
          type: 'start_call',
          campaignId,
          accountId,
          roomName,
        };

        this.ws!.send(JSON.stringify(startMessage));

        this.startStreamingLocalAudio().catch((error) => {
          console.error('[VoiceOrchestrator] Failed to start audio streaming:', error);
        });
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        console.error('[VoiceOrchestrator] WebSocket error:', error);
        this.callbacks.onError(new Error('WebSocket signaling failed'));
      };

      this.ws.onclose = () => {
        console.log('[VoiceOrchestrator] WebSocket signaling closed');
        this.stopStreamingLocalAudio();
      };

    } catch (error) {
      console.error('[VoiceOrchestrator] Connection error:', error);
      this.callbacks.onError(error as Error);
      this.callbacks.onConnectionStatus('disconnected');
      throw error;
    }
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'call_started':
        this.callId = message.callId;
        break;

      case 'transcript':
        this.callbacks.onTranscript(
          message.text,
          message.speaker === 'user' ? 'user' : 'assistant',
          message.isFinal ?? true
        );
        break;

      case 'ai_speaking':
        this.callbacks.onSpeakingChange(message.speaking);
        break;

      case 'error':
        this.callbacks.onError(new Error(message.error));
        break;

      case 'audio_response':
        console.log('[VoiceOrchestrator] Received audio response payload (not yet streamed via LiveKit)');
        break;
    }
  }

  sendMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'user_text',
      text,
    }));
  }

  async setMuted(muted: boolean): Promise<void> {
    if (this.livekit) {
      await this.livekit.setMuted(muted);
    }
  }

  isMuted(): boolean {
    return this.livekit?.isMuted() ?? true;
  }

  async disconnect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end_call' }));
    }

    if (this.livekit) {
      await this.livekit.disconnect();
      this.livekit = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.callId = null;
    this.stopStreamingLocalAudio();
    this.callbacks.onConnectionStatus('disconnected');
  }

  getConnectionState(): string {
    return this.livekit?.getConnectionState() ?? 'disconnected';
  }

  private async startStreamingLocalAudio(): Promise<void> {
    if (this.isStreamingAudio) {
      return;
    }

    if (!this.livekit) {
      console.warn('[VoiceOrchestrator] Cannot stream audio without LiveKit connection');
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[VoiceOrchestrator] Cannot stream audio until WebSocket is open');
      return;
    }

    const mediaStreamTrack = this.livekit.getLocalMediaStreamTrack();
    if (!mediaStreamTrack) {
      console.warn('[VoiceOrchestrator] No local media stream track available for streaming');
      return;
    }

    const stream = new MediaStream([mediaStreamTrack]);
    const audioContextCtor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
      | typeof AudioContext
      | undefined;

    if (!audioContextCtor) {
      console.warn('[VoiceOrchestrator] AudioContext not supported in this browser');
      return;
    }

    try {
      this.audioContext = new audioContextCtor({ sampleRate: 16000 });
    } catch (error) {
      console.error('[VoiceOrchestrator] Failed to create AudioContext:', error);
      this.audioContext = new audioContextCtor();
    }

    if (!this.audioContext) {
      console.warn('[VoiceOrchestrator] Unable to initialise AudioContext');
      return;
    }

    this.audioSource = this.audioContext.createMediaStreamSource(stream);
    this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.audioProcessor.onaudioprocess = (event) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const floatData = event.inputBuffer.getChannelData(0);
      if (!floatData || floatData.length === 0) {
        return;
      }

      const pcm = VoiceOrchestrator.convertToPCM16(
        floatData,
        this.audioContext?.sampleRate ?? 48000,
        16000
      );

      if (!pcm || pcm.length === 0) {
        return;
      }

      const base64 = VoiceOrchestrator.bufferToBase64(pcm.buffer);

      try {
        this.ws.send(
          JSON.stringify({
            type: 'audio_chunk',
            audioData: base64,
          })
        );
      } catch (sendError) {
        console.error('[VoiceOrchestrator] Failed to send audio chunk:', sendError);
      }
    };

    this.audioSource.connect(this.audioProcessor);
    this.audioProcessor.connect(this.audioContext.destination);

    await this.audioContext.resume();
    this.isStreamingAudio = true;
    console.log('[VoiceOrchestrator] Started streaming microphone audio to orchestrator');
  }

  private stopStreamingLocalAudio(): void {
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor.onaudioprocess = null;
      this.audioProcessor = null;
    }

    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch((error) => {
        console.warn('[VoiceOrchestrator] Error closing AudioContext:', error);
      });
      this.audioContext = null;
    }

    if (this.isStreamingAudio) {
      console.log('[VoiceOrchestrator] Stopped streaming microphone audio');
    }

    this.isStreamingAudio = false;
  }

  private static convertToPCM16(buffer: Float32Array, inputSampleRate: number, targetSampleRate: number): Int16Array {
    if (targetSampleRate <= 0 || inputSampleRate <= 0) {
      return new Int16Array();
    }

    if (inputSampleRate <= targetSampleRate) {
      const pcmBuffer = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        const sample = Math.max(-1, Math.min(1, buffer[i]));
        pcmBuffer[i] = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
      }
      return pcmBuffer;
    }

    const sampleRateRatio = inputSampleRate / targetSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const start = Math.floor(i * sampleRateRatio);
      const end = Math.min(Math.floor((i + 1) * sampleRateRatio), buffer.length);
      let sum = 0;
      let count = 0;

      for (let j = start; j < end; j++) {
        sum += buffer[j];
        count++;
      }

      const average = count > 0 ? sum / count : 0;
      const clamped = Math.max(-1, Math.min(1, average));
      result[i] = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
    }

    return result;
  }

  private static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  }
}
