/**
 * LiveKit Manager - Handles WebRTC audio streaming via LiveKit
 * Uses 16kHz Opus codec as per architecture specification
 */

import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteAudioTrack,
  createLocalAudioTrack,
  AudioCaptureOptions,
  LocalAudioTrack,
} from 'livekit-client';

export interface LiveKitCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
  onAudioReceived: (track: RemoteAudioTrack) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
}

export class LiveKitManager {
  private room: Room | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private callbacks: LiveKitCallbacks;

  constructor(callbacks: LiveKitCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to LiveKit room with optimal audio settings
   * Uses 16kHz Opus codec for voice optimization
   */
  async connect(livekitUrl: string, token: string, roomName: string): Promise<void> {
    try {
      console.log('[LiveKit] Connecting to room:', roomName);

      // Create room instance
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Set up event listeners
      this.setupEventListeners();

      // Connect to room
      await this.room.connect(livekitUrl, token);
      console.log('[LiveKit] Connected to room');

      // Create and publish local audio track with 16kHz settings
      const audioOptions: AudioCaptureOptions = {
        channelCount: 1, // Mono
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        // @ts-ignore - LiveKit types may not expose all MediaTrackConstraints
        sampleRate: 16000, // 16kHz as per spec
      };

      this.localAudioTrack = await createLocalAudioTrack(audioOptions);
      await this.room.localParticipant.publishTrack(this.localAudioTrack);
      
      console.log('[LiveKit] Local audio track published (16kHz Opus)');
      this.callbacks.onConnected();

    } catch (error) {
      console.error('[LiveKit] Connection error:', error);
      this.callbacks.onError(error as Error);
      throw error;
    }
  }

  /**
   * Set up LiveKit event listeners for room state and remote tracks
   */
  private setupEventListeners() {
    if (!this.room) return;

    // Handle incoming audio tracks
    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      console.log('[LiveKit] Track subscribed:', track.kind);
      
      if (track.kind === Track.Kind.Audio) {
        const audioTrack = track as RemoteAudioTrack;
        this.callbacks.onAudioReceived(audioTrack);
        
        // Attach to audio element for playback
        const audioElement = audioTrack.attach();
        audioElement.play().catch(e => {
          console.error('[LiveKit] Audio playback error:', e);
        });
      }
    });

    // Handle disconnections
    this.room.on(RoomEvent.Disconnected, (reason?: any) => {
      console.log('[LiveKit] Disconnected:', reason);
      this.callbacks.onDisconnected();
    });

    // Handle connection quality changes
    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      console.log('[LiveKit] Connection quality:', quality, participant?.identity);
    });

    // Handle errors
    this.room.on(RoomEvent.MediaDevicesError, (error: Error) => {
      console.error('[LiveKit] Media devices error:', error);
      this.callbacks.onError(error);
    });

    // Handle reconnection attempts
    this.room.on(RoomEvent.Reconnecting, () => {
      console.log('[LiveKit] Reconnecting...');
    });

    this.room.on(RoomEvent.Reconnected, () => {
      console.log('[LiveKit] Reconnected successfully');
    });
  }

  /**
   * Toggle microphone mute state
   */
  async setMuted(muted: boolean): Promise<void> {
    if (!this.localAudioTrack) {
      console.warn('[LiveKit] No local audio track to mute/unmute');
      return;
    }

    if (muted) {
      await this.localAudioTrack.mute();
      console.log('[LiveKit] Microphone muted');
    } else {
      await this.localAudioTrack.unmute();
      console.log('[LiveKit] Microphone unmuted');
    }
  }

  /**
   * Check if microphone is currently muted
   */
  isMuted(): boolean {
    return this.localAudioTrack?.isMuted ?? true;
  }

  /**
   * Disconnect from LiveKit room and cleanup resources
   */
  async disconnect(): Promise<void> {
    console.log('[LiveKit] Disconnecting...');

    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack = null;
    }

    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }

    console.log('[LiveKit] Disconnected and cleaned up');
  }

  /**
   * Get current connection state
   */
  getConnectionState(): string {
    return this.room?.state ?? 'disconnected';
  }

  /**
   * Returns the underlying MediaStreamTrack for local microphone publishing
   */
  getLocalMediaStreamTrack(): MediaStreamTrack | null {
    return this.localAudioTrack?.mediaStreamTrack ?? null;
  }
}
