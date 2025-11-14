/**
 * Server-side bridge that subscribes to a LiveKit room, forwards PCM audio to
 * the existing voice orchestrator WebSocket, and publishes synthesized speech
 * back into the room. This follows the "agent" pattern where all audio stays on
 * the backend.
 *
 * Dependencies (install in Node runtime):
 *   npm install @livekit/rtc-node livekit-server-sdk ws
 */

import {
  Room,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteAudioTrack,
  LocalAudioTrack,
  AudioSource,
  AudioFrame,
} from '@livekit/rtc-node';
import { AccessToken } from 'livekit-server-sdk';
import WebSocket from 'ws';

const isMainModule = (meta: ImportMeta) => {
  if (typeof process === 'undefined' || !process.argv || process.argv.length < 2) {
    return false;
  }
  const entryUrl = new URL(`file://${process.argv[1]}`);
  return entryUrl.href === meta.url;
};

const PCM_SAMPLE_RATE = 16000;
const PCM_CHANNELS = 1;

interface AgentConfig {
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  orchestratorUrl: string;
  campaignId: string;
  accountId: string;
  roomName: string;
  identity?: string;
}

interface OrchestratorMessage {
  type: string;
  callId?: string;
  audioData?: string;
  text?: string;
  speaker?: 'user' | 'assistant';
  isFinal?: boolean;
}

class OrchestratorConnection {
  private socket: WebSocket | null = null;
  private callId: string | null = null;
  private ready: boolean = false;

  constructor(private config: AgentConfig, private onTranscript: (text: string, speaker: string, isFinal?: boolean) => void, private onAudio: (audio: Buffer) => void) {}

  async connect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.terminate();
    }

    this.socket = new WebSocket(this.config.orchestratorUrl);

    this.socket.on('open', () => {
      this.ready = true;
      this.socket?.send(
        JSON.stringify({
          type: 'start_call',
          campaignId: this.config.campaignId,
          accountId: this.config.accountId,
          roomName: this.config.roomName,
        })
      );
    });

    this.socket.on('message', (event) => {
      const payload: OrchestratorMessage = JSON.parse(event.toString());
      switch (payload.type) {
        case 'call_started':
          this.callId = payload.callId ?? null;
          console.log('[Orchestrator] call started', this.callId);
          break;
        case 'transcript':
          if (payload.text) {
            this.onTranscript(payload.text, payload.speaker ?? 'user', payload.isFinal);
          }
          break;
        case 'audio_response':
          if (payload.audioData) {
            const audio = Buffer.from(payload.audioData, 'base64');
            this.onAudio(audio);
          }
          break;
        case 'call_ended':
          console.log('[Orchestrator] call ended');
          this.callId = null;
          break;
        case 'error':
          console.error('[Orchestrator] error message', payload.text);
          break;
        default:
          console.debug('[Orchestrator] event', payload);
      }
    });

    this.socket.on('close', (code, reason) => {
      this.ready = false;
      console.warn(`[Orchestrator] socket closed code=${code} reason=${reason.toString()}`);
      setTimeout(() => {
        this.connect().catch((error) => console.error('Failed to reconnect orchestrator', error));
      }, 1000);
    });

    this.socket.on('error', (error) => {
      console.error('[Orchestrator] socket error', error);
    });
  }

  sendAudioChunk(pcm: Buffer) {
    if (!this.ready || !this.callId || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: 'audio_chunk',
        callId: this.callId,
        audioData: pcm.toString('base64'),
      })
    );
  }

  async endCall() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.callId) return;
    this.socket.send(JSON.stringify({ type: 'end_call', callId: this.callId }));
  }
}

export class OrchestratorLiveKitAgent {
  private room: Room | null = null;
  private orchestrator: OrchestratorConnection;
  private audioSource: AudioSource | null = null;
  private publishedTrack: LocalAudioTrack | null = null;

  constructor(private readonly config: AgentConfig) {
    this.orchestrator = new OrchestratorConnection(
      config,
      (text, speaker, isFinal) => this.handleTranscript(text, speaker, isFinal),
      (audio) => this.publishAudio(audio)
    );
  }

  async start() {
    await this.orchestrator.connect();
    const token = await this.createServerToken(this.config.roomName, this.config.identity ?? 'voice-orchestrator-agent');

    this.room = new Room();
    await this.room.connect(this.config.livekitUrl, token);

    this.room.on('participantConnected', (participant) => {
      this.watchParticipant(participant);
    });

    this.room.on('participantDisconnected', () => {
      // No-op: orchestrator call continues until explicitly ended.
    });

    for (const participant of this.room.participants.values()) {
      this.watchParticipant(participant);
    }

    console.log(`[Agent] Connected to LiveKit room ${this.config.roomName}`);
  }

  private async createServerToken(roomName: string, identity: string) {
    const at = new AccessToken(this.config.livekitApiKey, this.config.livekitApiSecret, { identity });
    at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true });
    return at.toJwt();
  }

  private watchParticipant(participant: RemoteParticipant) {
    participant.on('trackSubscribed', (track) => {
      if (track.kind !== 'audio') return;
      this.streamTrack(track as RemoteAudioTrack);
    });

    participant.tracks.forEach((publication: RemoteTrackPublication) => {
      if (publication.audioTrack) {
        this.streamTrack(publication.audioTrack as RemoteAudioTrack);
      }
    });
  }

  private streamTrack(track: RemoteAudioTrack) {
    track.on('data', (data: Buffer) => {
      this.orchestrator.sendAudioChunk(data);
    });

    track.on('ended', () => {
      this.orchestrator.endCall().catch((error) => console.error('Failed to end orchestrator call', error));
    });
  }

  private handleTranscript(text: string, speaker: string, isFinal?: boolean) {
    const prefix = speaker === 'assistant' ? 'Assistant' : 'User';
    console.log(`[Orchestrator] ${prefix} ${isFinal ? 'said' : 'says'}: ${text}`);
  }

  private async publishAudio(audio: Buffer) {
    if (!this.room) return;

    if (!this.audioSource || !this.publishedTrack) {
      this.audioSource = new AudioSource({ sampleRate: PCM_SAMPLE_RATE, numChannels: PCM_CHANNELS });
      this.publishedTrack = LocalAudioTrack.createAudioTrack('voice-orchestrator-tts', this.audioSource);
      await this.room.localParticipant.publishTrack(this.publishedTrack);
    }

    const samplesPerChannel = audio.length / 2;
    const frame = new AudioFrame({
      data: audio,
      sampleRate: PCM_SAMPLE_RATE,
      numChannels: PCM_CHANNELS,
      samplesPerChannel,
    });
    this.audioSource.captureFrame(frame);
  }
}

if (isMainModule(import.meta)) {
  const required = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'VOICE_ORCHESTRATOR_URL', 'VOICE_ORCHESTRATOR_CAMPAIGN', 'VOICE_ORCHESTRATOR_ACCOUNT'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable ${key}`);
    }
  }

  const agent = new OrchestratorLiveKitAgent({
    livekitUrl: process.env.LIVEKIT_URL!,
    livekitApiKey: process.env.LIVEKIT_API_KEY!,
    livekitApiSecret: process.env.LIVEKIT_API_SECRET!,
    orchestratorUrl: process.env.VOICE_ORCHESTRATOR_URL!,
    campaignId: process.env.VOICE_ORCHESTRATOR_CAMPAIGN!,
    accountId: process.env.VOICE_ORCHESTRATOR_ACCOUNT!,
    roomName: process.env.LIVEKIT_ROOM || 'demo-room',
    identity: process.env.LIVEKIT_IDENTITY,
  });

  agent
    .start()
    .catch((error) => {
      console.error('Failed to start orchestrator LiveKit agent', error);
      process.exit(1);
    });
}
