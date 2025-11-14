/**
 * Example LiveKit voice agent that streams microphone audio to Deepgram, runs
 * lightweight business logic, and sends synthesized speech back to the room.
 *
 * This file is not bundled by the frontend build. To run it, install the
 * required dependencies in a Node environment:
 *
 *   npm install @livekit/rtc-node livekit-server-sdk ws
 *
 * Environment variables used:
 *   LIVEKIT_URL
 *   LIVEKIT_API_KEY
 *   LIVEKIT_API_SECRET
 *   DEEPGRAM_API_KEY
 *
 * The implementation assumes the remote audio track publishes 48kHz mono PCM
 * samples. If your LiveKit room uses Opus, decode to PCM before sending to
 * Deepgram or switch the `encoding` parameter accordingly.
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

const PCM_SAMPLE_RATE = 48000;
const PCM_CHANNELS = 1;

interface AgentConfig {
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  deepgramApiKey: string;
  roomName: string;
  identity?: string;
}

interface DeepgramResult {
  type: string;
  channel?: {
    alternatives?: Array<{
      transcript?: string;
    }>;
  };
  is_final?: boolean;
}

class DeepgramStream {
  private socket: WebSocket;
  private ready: boolean = false;
  private pending: Buffer[] = [];

  constructor(private apiKey: string, private sampleRate: number, private onTranscript: (text: string, isFinal: boolean) => void) {
    const url = new URL('wss://api.deepgram.com/v1/listen');
    url.searchParams.set('model', 'nova-2');
    url.searchParams.set('punctuate', 'true');
    url.searchParams.set('encoding', 'linear16');
    url.searchParams.set('sample_rate', String(sampleRate));
    url.searchParams.set('channels', String(PCM_CHANNELS));
    url.searchParams.set('interim_results', 'true');

    this.socket = new WebSocket(url.toString(), {
      headers: { Authorization: `Token ${apiKey}` },
    });

    this.socket.on('open', () => {
      this.ready = true;
      if (this.pending.length) {
        for (const chunk of this.pending.splice(0)) {
          this.socket.send(chunk);
        }
      }
    });

    this.socket.on('message', (data) => {
      try {
        const payload: DeepgramResult = JSON.parse(data.toString());
        if (payload.type !== 'Results') return;
        const transcript = payload.channel?.alternatives?.[0]?.transcript?.trim();
        if (!transcript) return;
        this.onTranscript(transcript, Boolean(payload.is_final));
      } catch (error) {
        console.error('[Deepgram] Failed to parse transcript message', error);
      }
    });

    this.socket.on('close', (code, reason) => {
      console.warn(`[Deepgram] stream closed (code=${code}, reason=${reason.toString()})`);
      this.ready = false;
    });

    this.socket.on('error', (error) => {
      console.error('[Deepgram] stream error', error);
    });
  }

  send(pcmChunk: Buffer) {
    if (this.ready) {
      this.socket.send(pcmChunk);
    } else {
      this.pending.push(pcmChunk);
      if (this.pending.length > 200) {
        this.pending.shift();
      }
    }
  }

  close() {
    this.ready = false;
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close();
    }
  }
}

class ParticipantSession {
  private deepgram: DeepgramStream | null = null;

  constructor(
    private readonly participant: RemoteParticipant,
    private readonly agent: LiveKitDeepgramAgent
  ) {}

  attachTrack(track: RemoteAudioTrack) {
    this.deepgram?.close();
    this.deepgram = new DeepgramStream(
      this.agent.config.deepgramApiKey,
      PCM_SAMPLE_RATE,
      async (text, isFinal) => {
        await this.agent.handleTranscript(this.participant, text, isFinal);
      }
    );

    track.on('data', (data: Buffer) => {
      this.deepgram?.send(data);
    });

    track.on('ended', () => {
      this.deepgram?.close();
      this.deepgram = null;
    });
  }

  stop() {
    this.deepgram?.close();
    this.deepgram = null;
  }
}

export class LiveKitDeepgramAgent {
  private room: Room | null = null;
  private sessions = new Map<string, ParticipantSession>();
  private audioSource: AudioSource | null = null;
  private publishedTrack: LocalAudioTrack | null = null;

  constructor(public readonly config: AgentConfig) {}

  async start() {
    const token = await this.createServerToken(this.config.roomName, this.config.identity ?? 'voice-agent');

    this.room = new Room();
    await this.room.connect(this.config.livekitUrl, token);

    this.room.on('participantConnected', (participant) => {
      this.watchParticipant(participant);
    });

    this.room.on('participantDisconnected', (participant) => {
      this.sessions.get(participant.sid)?.stop();
      this.sessions.delete(participant.sid);
    });

    // Handle already connected participants
    for (const participant of this.room.participants.values()) {
      this.watchParticipant(participant);
    }

    console.log(`[Agent] Connected to LiveKit room ${this.config.roomName}`);
  }

  private async createServerToken(roomName: string, identity: string) {
    const at = new AccessToken(this.config.livekitApiKey, this.config.livekitApiSecret, {
      identity,
    });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });
    return at.toJwt();
  }

  private watchParticipant(participant: RemoteParticipant) {
    const session = new ParticipantSession(participant, this);
    this.sessions.set(participant.sid, session);

    participant.on('trackSubscribed', (track, publication) => {
      if (track.kind === 'audio') {
        console.log(`[Agent] Subscribed to audio from ${participant.identity}`);
        session.attachTrack(track as RemoteAudioTrack);
      }
    });

    // For tracks already subscribed prior to the handler registration
    participant.tracks.forEach((publication: RemoteTrackPublication) => {
      if (publication.audioTrack) {
        session.attachTrack(publication.audioTrack as RemoteAudioTrack);
      }
    });
  }

  async handleTranscript(participant: RemoteParticipant, transcript: string, isFinal: boolean) {
    console.log(`[Agent] ${participant.identity} ${isFinal ? 'said' : 'is saying'}: ${transcript}`);

    if (!isFinal) return;

    const replyText = await this.generateReply(transcript);
    const pcmAudio = await this.textToSpeech(replyText);
    await this.publishPcmAudio(pcmAudio);
  }

  private async publishPcmAudio(pcm: Buffer) {
    if (!this.room) return;

    if (!this.audioSource || !this.publishedTrack) {
      this.audioSource = new AudioSource({ sampleRate: PCM_SAMPLE_RATE, numChannels: PCM_CHANNELS });
      this.publishedTrack = LocalAudioTrack.createAudioTrack('voice-agent-tts', this.audioSource);
      await this.room.localParticipant.publishTrack(this.publishedTrack);
    }

    const samplesPerChannel = pcm.length / 2; // 16-bit PCM
    const frame = new AudioFrame({
      data: pcm,
      sampleRate: PCM_SAMPLE_RATE,
      numChannels: PCM_CHANNELS,
      samplesPerChannel,
    });
    this.audioSource.captureFrame(frame);
  }

  private async generateReply(userText: string): Promise<string> {
    // Replace this with your own LLM/business logic integration.
    return `You said: ${userText}`;
  }

  private async textToSpeech(text: string): Promise<Buffer> {
    const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=linear16', {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.config.deepgramApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Deepgram TTS request failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

if (isMainModule(import.meta)) {
  const required = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'DEEPGRAM_API_KEY'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable ${key}`);
    }
  }

  const agent = new LiveKitDeepgramAgent({
    livekitUrl: process.env.LIVEKIT_URL!,
    livekitApiKey: process.env.LIVEKIT_API_KEY!,
    livekitApiSecret: process.env.LIVEKIT_API_SECRET!,
    deepgramApiKey: process.env.DEEPGRAM_API_KEY!,
    roomName: process.env.LIVEKIT_ROOM || 'demo-room',
    identity: process.env.LIVEKIT_IDENTITY,
  });

  agent
    .start()
    .catch((error) => {
      console.error('Failed to start LiveKit agent', error);
      process.exit(1);
    });
}
