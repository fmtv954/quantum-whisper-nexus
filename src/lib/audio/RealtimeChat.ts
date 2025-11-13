/**
 * Realtime Chat with OpenAI Realtime API using WebRTC
 * Manages voice conversation with real-time AI responses
 */

import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, encodeAudioForAPI, decodeAudioFromAPI, AudioQueue } from "./RealtimeAudio";

export interface RealtimeChatCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onTranscriptDelta?: (text: string, speaker: "user" | "assistant") => void;
  onError?: (error: Error) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private callbacks: RealtimeChatCallbacks;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioQueue | null = null;
  private currentTranscript = "";

  constructor(callbacks: RealtimeChatCallbacks) {
    this.callbacks = callbacks;
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(systemPrompt: string, voice: string = "alloy") {
    try {
      console.log("[RealtimeChat] Initializing...");

      // Get ephemeral token from edge function
      const { data, error } = await supabase.functions.invoke("realtime-token", {
        body: { systemPrompt, voice },
      });

      if (error || !data?.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = data.client_secret.value;
      console.log("[RealtimeChat] Token received");

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = (e) => {
        console.log("[RealtimeChat] Remote audio track received");
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pc.addTrack(ms.getTracks()[0]);
      console.log("[RealtimeChat] Local audio track added");

      // Set up data channel for events
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", (e) => {
        this.handleDataChannelMessage(e.data);
      });

      this.dc.addEventListener("open", () => {
        console.log("[RealtimeChat] Data channel opened");
        this.callbacks.onConnect?.();
      });

      this.dc.addEventListener("close", () => {
        console.log("[RealtimeChat] Data channel closed");
        this.callbacks.onDisconnect?.();
      });

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };

      await this.pc.setRemoteDescription(answer);
      console.log("[RealtimeChat] WebRTC connection established");

      // Initialize audio context and queue
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

    } catch (error) {
      console.error("[RealtimeChat] Error initializing:", error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private handleDataChannelMessage(data: string) {
    try {
      const event = JSON.parse(data);
      
      switch (event.type) {
        case "session.created":
          console.log("[RealtimeChat] Session created");
          break;

        case "response.audio.delta":
          // Decode and queue audio for playback
          if (event.delta) {
            const audioData = decodeAudioFromAPI(event.delta);
            this.audioQueue?.addToQueue(audioData);
          }
          break;

        case "response.audio_transcript.delta":
          // Accumulate transcript
          this.currentTranscript += event.delta || "";
          this.callbacks.onTranscriptDelta?.(event.delta, "assistant");
          break;

        case "response.audio_transcript.done":
          // Final transcript
          if (event.transcript) {
            this.callbacks.onTranscriptDelta?.(event.transcript, "assistant");
          }
          this.currentTranscript = "";
          break;

        case "input_audio_buffer.speech_started":
          console.log("[RealtimeChat] User started speaking");
          this.callbacks.onSpeakingChange?.(false); // Agent stops
          break;

        case "input_audio_buffer.speech_stopped":
          console.log("[RealtimeChat] User stopped speaking");
          break;

        case "conversation.item.input_audio_transcription.completed":
          // User speech transcribed
          if (event.transcript) {
            this.callbacks.onTranscriptDelta?.(event.transcript, "user");
          }
          break;

        case "response.done":
          console.log("[RealtimeChat] Response complete");
          this.callbacks.onSpeakingChange?.(false);
          break;

        case "error":
          console.error("[RealtimeChat] Error from server:", event.error);
          this.callbacks.onError?.(new Error(event.error?.message || "Unknown error"));
          break;

        default:
          // Log other events for debugging
          if (event.type) {
            console.log(`[RealtimeChat] Event: ${event.type}`);
          }
      }
    } catch (error) {
      console.error("[RealtimeChat] Error parsing message:", error);
    }
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== "open") {
      throw new Error("Data channel not ready");
    }

    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text,
          },
        ],
      },
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({ type: "response.create" }));
  }

  disconnect() {
    console.log("[RealtimeChat] Disconnecting...");
    
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.audioQueue?.clear();
    this.audioContext?.close();
    
    this.recorder = null;
    this.dc = null;
    this.pc = null;
    this.audioQueue = null;
    this.audioContext = null;
  }
}
