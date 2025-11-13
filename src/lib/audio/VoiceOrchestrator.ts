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

  constructor(callbacks: VoiceOrchestratorCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(livekitUrl: string, token: string) {
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

      console.log('[VoiceOrchestrator] Connected successfully');
      this.isConnected = true;
      this.callbacks.onConnect?.();
    } catch (error) {
      console.error('[VoiceOrchestrator] Connection error:', error);
      this.callbacks.onError?.(error as Error);
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
    if (!this.room || !this.isConnected) {
      throw new Error('Not connected to room');
    }

    console.log('[VoiceOrchestrator] Sending text message:', text);

    // Send text via data channel to backend orchestrator
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'text_input',
      text,
    }));

    await this.room.localParticipant.publishData(data, { reliable: true });
  }

  disconnect() {
    console.log('[VoiceOrchestrator] Disconnecting...');
    
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }

    this.isConnected = false;
  }

  getConnectionState(): boolean {
    return this.isConnected;
  }
}
