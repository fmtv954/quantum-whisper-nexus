/**
 * Call Interface - Real-Time Voice AI
 * Phase 1: OpenAI Realtime API with WebRTC
 */

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Phone, PhoneOff, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChat } from "@/lib/audio/RealtimeChat";
import {
  createCallSession,
  endCallSession,
  recordTranscriptSegments,
  type CallSession,
} from "@/lib/calls";
import { getFlowForCampaign } from "@/lib/flows";
import { runFlowStep, type FlowContext } from "@/lib/flow-runtime";
import { playPhoneRing, startHoldMusic, stopHoldMusic } from "@/lib/audio/AudioEffects";
import { recordUsageEvent } from "@/lib/usage";

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
  const [isOnHold, setIsOnHold] = useState(false);
  
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  const flowContextRef = useRef<FlowContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptBufferRef = useRef<Array<{ speaker: "caller" | "ai_agent"; text: string }>>([]);
  const isOnHoldRef = useRef<boolean>(false);

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
      if (realtimeChatRef.current) {
        realtimeChatRef.current.disconnect();
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

  const handleStartCall = async () => {
    if (!campaignId) return;

    setIsConnecting(true);
    setIsRinging(true);
    
    try {
      console.log("[Call] Starting call session...");

      // Play phone ring (2 times, ~3 seconds)
      await playPhoneRing();
      setIsRinging(false);

      // Create call session in database
      const session = await createCallSession(campaignId);
      setCallSession(session);

      // Load flow for campaign
      const flow = await getFlowForCampaign(campaignId);
      if (!flow) {
        throw new Error("No flow configured for this campaign");
      }

      console.log("[Call] Flow loaded:", flow.name);

      // Initialize flow context
      const startNode = flow.definition.nodes.find(n => n.type === "start");
      if (!startNode) {
        throw new Error("Flow must have a start node");
      }

      flowContextRef.current = {
        flowDefinition: flow.definition,
        currentNodeId: startNode.id,
        conversationHistory: [],
        leadData: {},
      };

      // Build system prompt from flow
      const systemPrompt = buildSystemPromptFromFlow(flow.definition);

      // Initialize RealtimeChat
      const realtimeChat = new RealtimeChat({
        onConnect: () => {
          console.log("[Call] Connected to voice AI");
          setIsConnected(true);
          setIsConnecting(false);
          
          // Start with greeting from flow
          if (flowContextRef.current) {
            runFlowStep(flowContextRef.current).then(result => {
              const greeting: Message = {
                id: Date.now().toString(),
                speaker: "assistant",
                text: result.agentText,
                timestamp: new Date(),
              };
              setMessages([greeting]);
              
              // Buffer for DB
              transcriptBufferRef.current.push({
                speaker: "ai_agent",
                text: result.agentText,
              });

              // Update flow context
              if (result.nextNodeId) {
                flowContextRef.current!.currentNodeId = result.nextNodeId;
              }
              
              // Handle actions from flow
              if (result.actions.includes("PUT_ON_HOLD")) {
                setIsOnHold(true);
                startHoldMusic();
              }
            });
          }
        },
        onDisconnect: () => {
          console.log("[Call] Disconnected");
          setIsConnected(false);
          flushTranscriptBuffer();
        },
        onTranscriptDelta: (text, speaker) => {
          console.log(`[Call] Transcript delta: ${speaker} - ${text}`);
          
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.speaker === speaker) {
              // Append to existing message
              const updatedText = lastMsg.text + text;
              
              // Check if AI mentions putting on hold
              if (speaker === "assistant" && /please hold|hold for|one moment/i.test(updatedText) && !isOnHoldRef.current) {
                setTimeout(() => {
                  isOnHoldRef.current = true;
                  setIsOnHold(true);
                  startHoldMusic();
                }, 1000); // Start hold music 1 second after the hold phrase
              }
              
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, text: updatedText },
              ];
            } else {
              // New message
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  speaker,
                  text,
                  timestamp: new Date(),
                },
              ];
            }
          });
        },
        onSpeakingChange: (speaking) => {
          setIsSpeaking(speaking);
          
          // If AI starts speaking while on hold, stop hold music
          if (speaking && isOnHoldRef.current) {
            stopHoldMusic();
            isOnHoldRef.current = false;
            setIsOnHold(false);
          }
        },
        onError: (error) => {
          console.error("[Call] Error:", error);
          toast({
            title: "Call Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });

      await realtimeChat.init(systemPrompt, "alloy");
      realtimeChatRef.current = realtimeChat;

      console.log("[Call] Call started successfully");
    } catch (error) {
      console.error("Error starting call:", error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start call",
        variant: "destructive",
      });
    }
  };

  const handleEndCall = async () => {
    if (!callSession) return;

    try {
      console.log("[Call] Ending call...");

      // Stop hold music if playing
      stopHoldMusic();
      isOnHoldRef.current = false;
      setIsOnHold(false);

      // Disconnect realtime chat
      if (realtimeChatRef.current) {
        realtimeChatRef.current.disconnect();
        realtimeChatRef.current = null;
      }

      // Flush remaining transcripts
      await flushTranscriptBuffer();

      // End session in DB
      const { session } = await endCallSession(callSession.id, { createLead: true });

      // Track usage: OpenAI Realtime API cost
      if (session.duration_ms && campaign?.account_id) {
        const durationMinutes = Math.ceil(session.duration_ms / 60000);
        try {
          await recordUsageEvent({
            accountId: campaign.account_id,
            campaignId: campaignId,
            callId: session.id,
            provider: "openai",
            service: "realtime-api",
            unitType: "minutes",
            units: durationMinutes,
            unitCostUsd: 0.30, // $0.06 input + $0.24 output avg
            metadata: { model: "gpt-4o-realtime-preview-2024-12-17" },
          });
        } catch (error) {
          console.warn("Failed to record usage:", error);
        }
      }

      setCallSession(session);
      setIsConnected(false);

      toast({
        title: "Call Ended",
        description: `Duration: ${formatTime(Math.floor((session.duration_ms || 0) / 1000))}`,
      });

      console.log("[Call] Call ended successfully");
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
              {isOnHold && (
                <Badge variant="secondary" className="ml-auto">
                  On Hold
                </Badge>
              )}
              {isSpeaking && !isOnHold && !isRinging && (
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

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {!isCallActive && !isCallEnded && (
            <Button
              size="lg"
              onClick={handleStartCall}
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
            <Button
              size="lg"
              variant="destructive"
              onClick={handleEndCall}
              className="min-w-[200px]"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              End Call
            </Button>
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
    </div>
  );
}
