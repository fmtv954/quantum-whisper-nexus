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
  
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  const flowContextRef = useRef<FlowContext | null>(null);
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartCall = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      const session = await createCallSession(campaignId);
      setCallSession(session);

      // Add initial greeting from agent
      const greeting =
        "Hello! Thanks for connecting. I'm your AI assistant. How can I help you today?";
      
      await appendTranscriptSegment(session.id, "ai_agent", greeting);
      
      setMessages([
        {
          id: "greeting",
          speaker: "ai_agent",
          text: greeting,
          timestamp: new Date(),
        },
      ]);

      toast({
        title: "Call started",
        description: "You're now connected (demo mode - text only)",
      });
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Error starting call",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !callSession || sending) return;

    const userText = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    try {
      // Add user message
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        speaker: "caller",
        text: userText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Save to database
      await appendTranscriptSegment(callSession.id, "caller", userText);

      // Generate AI response (stub)
      const aiResponse = generateStubAIResponse(userText);

      // Simulate brief delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Add AI message
      const aiMsg: Message = {
        id: `agent-${Date.now()}`,
        speaker: "ai_agent",
        text: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Save to database
      await appendTranscriptSegment(callSession.id, "ai_agent", aiResponse);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleEndCall = async () => {
    if (!callSession) return;

    try {
      setLoading(true);
      const { session, leadId } = await endCallSession(callSession.id, {
        createLead: true,
      });

      setCallSession(session);

      toast({
        title: "Call ended",
        description: leadId
          ? "A lead has been created from this call."
          : "Call completed successfully.",
      });

      // Show end call summary
      setTimeout(() => {
        if (leadId) {
          navigate(`/leads/${leadId}`);
        } else {
          navigate("/dashboard");
        }
      }, 2000);
    } catch (error) {
      console.error("Error ending call:", error);
      toast({
        title: "Error ending call",
        description: "Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (loading && !campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const isCallActive = callSession && callSession.status === "active";
  const isCallEnded = callSession && callSession.status === "completed";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{campaign.name}</h1>
              <p className="text-sm text-muted-foreground">
                {isCallActive && "Call in progress"}
                {isCallEnded && "Call ended"}
                {!callSession && "Ready to connect"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isCallActive && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
                </div>
              )}
              {isCallActive ? (
                <Badge variant="default" className="animate-pulse">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                  Connected
                </Badge>
              ) : isCallEnded ? (
                <Badge variant="secondary">Ended</Badge>
              ) : (
                <Badge variant="outline">Ready</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {!callSession ? (
          // Pre-call screen
          <Card>
            <CardHeader>
              <CardTitle>Start Your Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Demo Mode:</strong> This is a
                  text-based simulation. In production, you'll have a natural voice
                  conversation powered by AI.
                </p>
              </div>
              {campaign.description && (
                <p className="text-sm">{campaign.description}</p>
              )}
              <Button onClick={handleStartCall} disabled={loading} size="lg" className="w-full">
                <Phone className="mr-2 h-5 w-5" />
                Start Call
              </Button>
            </CardContent>
          </Card>
        ) : isCallEnded ? (
          // Post-call screen
          <Card>
            <CardHeader>
              <CardTitle>Call Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                  <Phone className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Thank you for calling!</h3>
                <p className="text-muted-foreground mb-4">
                  Duration: {formatTime(elapsedTime)}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  A lead has been created from this conversation. You'll be redirected
                  shortly...
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/leads">View Leads</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Active call screen
          <div className="space-y-4">
            {/* Transcript */}
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.speaker === "caller" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.speaker === "caller"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.speaker === "caller"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>

            {/* Input Area */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message... (simulating speech)"
                    disabled={sending}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !inputMessage.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Demo mode: Type to simulate speaking. Press Enter to send.
                </p>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex justify-center">
              <Button
                onClick={handleEndCall}
                variant="destructive"
                size="lg"
                disabled={loading}
              >
                <PhoneOff className="mr-2 h-5 w-5" />
                End Call
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
