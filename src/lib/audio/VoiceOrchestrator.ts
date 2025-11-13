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
    this.callbacks.onConnectionStatus('disconnected');
  }

  getConnectionState(): string {
    return this.livekit?.getConnectionState() ?? 'disconnected';
  }
}
