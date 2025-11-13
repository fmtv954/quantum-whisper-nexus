/**
 * Call session management helpers
 * Handles creating, updating, and querying call sessions and transcripts
 * 
 * NOTE: This is MVP text-based implementation. Future integrations:
 * - LiveKit WebRTC for real voice
 * - Deepgram STT/TTS for speech processing
 * - OpenAI/GPT for conversational AI
 * - RAG knowledge base lookups
 */

import { supabase } from "@/integrations/supabase/client";
import { getCurrentAccountId } from "./data";

export interface CallSession {
  id: string;
  account_id: string;
  campaign_id: string;
  flow_id: string | null;
  lead_id: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  external_session_id: string | null;
  cost_cents: number | null;
  metadata: any;
}

export interface TranscriptSegment {
  id: string;
  call_id: string;
  segment_index: number;
  speaker: "caller" | "ai_agent" | "human_agent" | "system";
  text: string;
  offset_ms: number;
  created_at: string;
  metadata: any;
}

export interface CallSessionWithTranscript extends CallSession {
  transcripts: TranscriptSegment[];
  campaign?: {
    id: string;
    name: string;
  };
}

/**
 * Create a new call session
 * TODO: Add consent tracking when implementing real calls
 */
export async function createCallSession(campaignId: string): Promise<CallSession> {
  // Verify campaign exists and get account_id
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, account_id, name")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError || !campaign) {
    throw new Error("Campaign not found or access denied");
  }

  // Create call session
  const { data, error } = await supabase
    .from("call_sessions")
    .insert([{
      account_id: campaign.account_id,
      campaign_id: campaignId,
      status: "active" as const,
      started_at: new Date().toISOString(),
      metadata: { mode: "text_demo" },
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating call session:", error);
    throw error;
  }

  return data as CallSession;
}

/**
 * End a call session and compute duration
 * TODO: Integrate lead capture logic with consent workflow
 */
export async function endCallSession(
  callId: string,
  options: { createLead?: boolean } = {}
): Promise<{ session: CallSession; leadId?: string }> {
  const now = new Date().toISOString();

  // Get the session
  const { data: session, error: fetchError } = await supabase
    .from("call_sessions")
    .select("*")
    .eq("id", callId)
    .maybeSingle();

  if (fetchError || !session) {
    throw new Error("Call session not found");
  }

  // Calculate duration
  const startTime = new Date(session.started_at).getTime();
  const endTime = new Date(now).getTime();
  const durationMs = endTime - startTime;

  // Update session
  const { data: updatedSession, error: updateError } = await supabase
    .from("call_sessions")
    .update({
      status: "completed",
      ended_at: now,
      duration_ms: durationMs,
    })
    .eq("id", callId)
    .select()
    .single();

  if (updateError) {
    console.error("Error ending call session:", updateError);
    throw updateError;
  }

  let leadId: string | undefined;

  // Optionally create a stub lead
  if (options.createLead && !session.lead_id) {
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        account_id: session.account_id,
        campaign_id: session.campaign_id,
        call_id: callId,
        status: "new",
        intent_summary: "Demo call completed in text mode (MVP)",
        metadata: { source: "text_demo_call" },
      })
      .select()
      .single();

    if (!leadError && lead) {
      leadId = lead.id;

      // Link lead back to session
      await supabase
        .from("call_sessions")
        .update({ lead_id: leadId })
        .eq("id", callId);
    }
  }

  return {
    session: updatedSession as CallSession,
    leadId,
  };
}

/**
 * Append a transcript segment
 * TODO: Add real-time streaming when integrating STT
 */
export async function appendTranscriptSegment(
  callId: string,
  speaker: "caller" | "ai_agent" | "human_agent" | "system",
  text: string
): Promise<TranscriptSegment> {
  // Get current segment count for this call
  const { data: existingSegments } = await supabase
    .from("call_transcripts")
    .select("segment_index")
    .eq("call_id", callId)
    .order("segment_index", { ascending: false })
    .limit(1);

  const nextIndex = existingSegments && existingSegments.length > 0 
    ? existingSegments[0].segment_index + 1 
    : 0;

  // Get call start time to calculate offset
  const { data: session } = await supabase
    .from("call_sessions")
    .select("started_at")
    .eq("id", callId)
    .single();

  const offsetMs = session
    ? new Date().getTime() - new Date(session.started_at).getTime()
    : 0;

  const { data, error } = await supabase
    .from("call_transcripts")
    .insert([{
      call_id: callId,
      segment_index: nextIndex,
      speaker,
      text,
      offset_ms: offsetMs,
      metadata: {},
    }])
    .select()
    .single();

  if (error) {
    console.error("Error appending transcript:", error);
    throw error;
  }

  return data as TranscriptSegment;
}

/**
 * Get call session with full transcript
 * Used for debugging and future call detail views
 */
export async function getCallSessionWithTranscript(
  callId: string
): Promise<CallSessionWithTranscript | null> {
  const { data: session, error: sessionError } = await supabase
    .from("call_sessions")
    .select(
      `
      *,
      campaign:campaigns(id, name)
    `
    )
    .eq("id", callId)
    .maybeSingle();

  if (sessionError || !session) {
    return null;
  }

  const { data: transcripts } = await supabase
    .from("call_transcripts")
    .select("*")
    .eq("call_id", callId)
    .order("segment_index", { ascending: true });

  return {
    ...session,
    transcripts: (transcripts || []) as TranscriptSegment[],
  } as CallSessionWithTranscript;
}

/**
 * Generate a stub AI response (MVP only)
 * TODO: Replace with real LLM + RAG pipeline
 */
export function generateStubAIResponse(userMessage: string): string {
  const responses = [
    "Thanks for your message. I'm currently in demo mode, but in production I'll use your campaign's knowledge base to provide accurate answers.",
    "I understand. In the full version, I'll be able to access your company's information and help you more effectively.",
    "Got it! Once we integrate the real AI pipeline, I'll be able to have natural conversations and capture your contact information.",
    "That's interesting. In production mode, I'll use voice recognition and respond naturally based on your campaign's conversation flow.",
  ];

  // Simple keyword-based logic for demo
  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.includes("help") || lowerMessage.includes("question")) {
    return "I'd love to help! In the full system, I'll be connected to your knowledge base and can answer specific questions about your products or services.";
  }
  if (lowerMessage.includes("contact") || lowerMessage.includes("email") || lowerMessage.includes("phone")) {
    return "I'd be happy to get your contact information! In production, I'll collect this through the proper consent workflow.";
  }

  return responses[Math.floor(Math.random() * responses.length)];
}
