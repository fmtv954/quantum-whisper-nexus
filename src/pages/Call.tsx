/**
 * Call Interface - Real-Time Voice AI
 * Phase 1: OpenAI Realtime API with WebRTC
 */

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, PhoneOff, Clock, Loader2, Send, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VoiceOrchestrator } from "@/lib/audio/VoiceOrchestrator";
import {
  createCallSession,
  endCallSession,
  recordTranscriptSegments,
  type CallSession,
} from "@/lib/calls";
import { createLeadForCall, linkLeadToCall } from "@/lib/leads";
import { playPhoneRing } from "@/lib/audio/AudioEffects";
import { recordUsageEvent } from "@/lib/usage";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";

interface Message {
  id: string;
  speaker: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export default function Call() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Lead capture state
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState<string | null>(null);
  const [leadName, setLeadName] = useState<string | null>(null);
  
  const voiceOrchestratorRef = useRef<VoiceOrchestrator | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptBufferRef = useRef<Array<{ speaker: "caller" | "ai_agent"; text: string }>>([]);

  // Load campaign info
  useEffect(() => {
    async function loadCampaign() {
      if (!campaignId) return;

      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("id, name, description, account_id")
          .eq("id", campaignId)
          .maybeSingle();

        if (error || !data) {
          toast({
            title: "Campaign not found",
            description: "This campaign link is not valid or has been disabled.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setCampaign(data);
      } catch (error) {
        console.error("Error loading campaign:", error);
        toast({
          title: "Error",
          description: "Failed to load campaign. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadCampaign();
  }, [campaignId, navigate, toast]);

  // Timer effect
  useEffect(() => {
    if (callSession && callSession.status === "in_progress") {
      timerRef.current = setInterval(() => {
        const start = new Date(callSession.started_at).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceOrchestratorRef.current) {
        voiceOrchestratorRef.current.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const flushTranscriptBuffer = async () => {
    if (transcriptBufferRef.current.length > 0 && callSession) {
      try {
        await recordTranscriptSegments(callSession.id, transcriptBufferRef.current);
        transcriptBufferRef.current = [];
      } catch (error) {
        console.error("Error flushing transcripts:", error);
      }
    }
  };

  const handleLeadCaptureSubmit = async (data: {
    email: string;
    name?: string;
    consent: boolean;
  }) => {
    if (!campaignId || !campaign) return;

    try {
      setIsConnecting(true);
      setIsRinging(true);

      // Generate consent ticket ID
      const consentTicketId = crypto.randomUUID();

      // Create lead record
      const lead = await createLeadForCall({
        accountId: campaign.account_id,
        campaignId,
        email: data.email,
        name: data.name,
        consentTicketId,
      });

      setLeadId(lead.id);
      setLeadEmail(data.email);
      setLeadName(data.name || null);
      setShowLeadCapture(false);

      console.log("[Call] Starting call with LiveKit (16kHz Opus)...");

      // Play phone ring
      await playPhoneRing();
      setIsRinging(false);

      // Create call session in database
      const session = await createCallSession(campaignId);
      setCallSession(session);

      // Link lead to call
      await linkLeadToCall(lead.id, session.id);

      // Get LiveKit token
      console.log("[Call] Fetching LiveKit token...");
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('livekit-token', {
        body: {
          campaignId,
          callSessionId: session.id,
        },
      });

      if (tokenError || !tokenData) {
        throw new Error('Failed to get LiveKit token');
      }

      const { token, url: livekitUrl, roomName } = tokenData;
      console.log("[Call] LiveKit token received, room:", roomName);

      // Initialize Voice Orchestrator with LiveKit (16kHz Opus)
      const orchestrator = new VoiceOrchestrator({
        onConnectionStatus: (status) => {
          console.log("[Call] Connection status:", status);
          if (status === "connected") {
            setIsConnected(true);
            setIsConnecting(false);
          } else if (status === "disconnected") {
            setIsConnected(false);
          }
        },
        onTranscript: (text, speaker, isFinal) => {
          console.log(`[Call] Transcript (${speaker}, final=${isFinal}):`, text);
          
          if (isFinal) {
            const message: Message = {
              id: crypto.randomUUID(),
              speaker: speaker === "user" ? "user" : "assistant",
              text,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, message]);

            // Buffer transcript for persistence
            transcriptBufferRef.current.push({
              speaker: speaker === "user" ? "caller" : "ai_agent",
              text,
            });
          }
        },
        onError: (error) => {
          console.error("[Call] Voice orchestrator error:", error);
          toast({
            title: "Connection Error",
            description: error.message,
            variant: "destructive",
          });
        },
        onSpeakingChange: (speaking) => {
          setIsSpeaking(speaking);
        },
      });

      voiceOrchestratorRef.current = orchestrator;

      // Connect with LiveKit WebRTC (16kHz Opus)
      console.log("[Call] Connecting to LiveKit WebRTC...");
      await orchestrator.connect(
        livekitUrl,
        token,
        campaign.id,
        campaign.account_id,
        roomName
      );

      console.log("[Call] Call started successfully with LiveKit WebRTC");
    } catch (error) {
      console.error("[Call] Error starting call:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start call",
        variant: "destructive",
      });
      setIsConnecting(false);
      setIsRinging(false);
    }
  };

  const handleStartCall = async () => {
    // Lead capture modal handles the actual call start
    setShowLeadCapture(true);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !voiceOrchestratorRef.current || isSending) return;

    const messageText = userInput.trim();
    setUserInput("");
    setIsSending(true);

    try {
      await voiceOrchestratorRef.current.sendMessage(messageText);
    } catch (error) {
      console.error("[Call] Error sending message:", error);
      toast({
        title: "Failed to Send",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleMute = async () => {
    if (voiceOrchestratorRef.current) {
      const newMutedState = !isMuted;
      await voiceOrchestratorRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const handleEndCall = async () => {
    if (!callSession) return;

    try {
      // Disconnect voice orchestrator
      if (voiceOrchestratorRef.current) {
        voiceOrchestratorRef.current.disconnect();
        voiceOrchestratorRef.current = null;
      }

      // Flush transcripts
      await flushTranscriptBuffer();

      // End call session in database (don't create lead since we already have one)
      const { session } = await endCallSession(callSession.id, { createLead: false });

      // Record usage for Deepgram STT, OpenAI LLM, Deepgram TTS, LiveKit
      const durationMinutes = elapsedTime / 60;
      
      // Estimate tokens based on message count (rough approximation)
      const totalTokens = messages.reduce((sum, msg) => sum + msg.text.length, 0);
      
      await recordUsageEvent({
        accountId: campaign?.account_id || "",
        campaignId: campaignId || "",
        callId: callSession.id,
        provider: "deepgram",
        service: "stt",
        unitType: "minutes",
        units: durationMinutes,
        unitCostUsd: 0.0077,
        metadata: { model: "nova-2" },
      });

      await recordUsageEvent({
        accountId: campaign?.account_id || "",
        campaignId: campaignId || "",
        callId: callSession.id,
        provider: "openai",
        service: "llm",
        unitType: "tokens",
        units: totalTokens,
        unitCostUsd: 0.00015,
        metadata: { model: "gpt-4o-mini" },
      });

      await recordUsageEvent({
        accountId: campaign?.account_id || "",
        campaignId: campaignId || "",
        callId: callSession.id,
        provider: "deepgram",
        service: "tts",
        unitType: "characters",
        units: messages.filter(m => m.speaker === "assistant").reduce((sum, m) => sum + m.text.length, 0),
        unitCostUsd: 0.000018,
        metadata: { voice: "aura-asteria-en" },
      });
      
      await recordUsageEvent({
        accountId: campaign?.account_id || "",
        campaignId: campaignId || "",
        callId: session.id,
        provider: "livekit",
        service: "webrtc",
        unitType: "minutes",
        units: durationMinutes,
        unitCostUsd: 0.0045,
        metadata: {},
      });

      console.log("[Call] Call ended and usage recorded");
      
      toast({
        title: "Call Ended",
        description: `Call duration: ${formatTime(elapsedTime)}`,
      });

      setCallSession(session);
      setIsConnected(false);
    } catch (error) {
      console.error("Error ending call:", error);
      toast({
        title: "Error",
        description: "Failed to end call properly",
        variant: "destructive",
      });
    }
  };

  const buildSystemPromptFromFlow = (flowDef: any): string => {
    const startNode = flowDef.nodes.find((n: any) => n.type === "start");
    const ragNode = flowDef.nodes.find((n: any) => n.type === "rag_answer");
    
    let prompt = "You are a helpful AI assistant conducting a voice conversation. ";
    
    if (ragNode?.system_prompt) {
      prompt += ragNode.system_prompt + " ";
    }
    
    if (ragNode?.tone) {
      prompt += `Maintain a ${ragNode.tone} tone. `;
    }
    
    prompt += "Keep your responses concise and conversational. ";
    prompt += "If the user wants to end the conversation, acknowledge it gracefully.";
    
    return prompt;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Campaign not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCallActive = callSession && callSession.status === "in_progress";
  const isCallEnded = callSession && callSession.status === "completed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isCallActive && (
                <div className="flex items-center gap-2 text-sm font-mono">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{formatTime(elapsedTime)}</span>
                </div>
              )}
              <Badge variant={isConnected ? "default" : isConnecting ? "secondary" : "outline"}>
                {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Ready"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col max-w-4xl">
        {/* Transcript Area */}
        <Card className="flex-1 mb-6 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Conversation
              {isRinging && (
                <Badge variant="secondary" className="ml-auto">
                  Ringing...
                </Badge>
              )}
              {isSpeaking && !isRinging && (
                <Badge variant="secondary" className="ml-auto">
                  AI Speaking
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-[400px] space-y-4">
            {messages.length === 0 && !isConnected && (
              <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Press Start Call to begin your voice conversation</p>
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.speaker === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.speaker === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {/* Text Input (for testing without voice) */}
        {isConnected && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex gap-2"
              >
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!userInput.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {!isCallActive && !isCallEnded && (
            <Button
              size="lg"
              onClick={() => setShowLeadCapture(true)}
              disabled={isConnecting}
              className="min-w-[200px]"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-5 w-5" />
                  Start Call
                </>
              )}
            </Button>
          )}

          {isCallActive && (
            <>
              <Button
                size="lg"
                variant={isMuted ? "secondary" : "outline"}
                onClick={handleToggleMute}
              >
                {isMuted ? (
                  <>
                    <MicOff className="mr-2 h-5 w-5" />
                    Unmute
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5" />
                    Mute
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={handleEndCall}
                className="min-w-[200px]"
              >
                <PhoneOff className="mr-2 h-5 w-5" />
                End Call
              </Button>
            </>
          )}

          {isCallEnded && (
            <div className="text-center space-y-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Call Ended
              </Badge>
              <div className="text-sm text-muted-foreground">
                Duration: {formatTime(Math.floor((callSession.duration_ms || 0) / 1000))}
              </div>
              <Button asChild variant="outline">
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={showLeadCapture}
        onSubmit={handleLeadCaptureSubmit}
        onCancel={() => setShowLeadCapture(false)}
        campaignName={campaign?.name || ""}
      />
    </div>
  );
}
