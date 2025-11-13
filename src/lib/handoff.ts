/**
 * Handoff Management Helpers
 * 
 * Manages human handoff requests when AI needs to escalate to a human agent.
 * Supports real-time call handoffs and async follow-up tasks.
 */

import { supabase } from "@/integrations/supabase/client";
import { getCurrentAccountId } from "./data";

export interface HandoffRequest {
  id: string;
  account_id: string;
  campaign_id: string | null;
  call_id: string | null;
  lead_id: string | null;
  status: "pending" | "claimed" | "in_progress" | "resolved" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  reason: string | null;
  notes: string | null;
  claimed_at: string | null;
  resolved_at: string | null;
  assigned_to_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHandoffParams {
  accountId: string;
  campaignId?: string;
  callId?: string;
  leadId?: string;
  reason: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

/**
 * Create a new handoff request
 */
export async function createHandoffRequest(params: CreateHandoffParams): Promise<HandoffRequest> {
  const { data, error } = await supabase
    .from("handoff_requests")
    .insert({
      account_id: params.accountId,
      campaign_id: params.campaignId || null,
      call_id: params.callId || null,
      lead_id: params.leadId || null,
      reason: params.reason,
      priority: params.priority || "medium",
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating handoff request:", error);
    throw new Error(`Failed to create handoff request: ${error.message}`);
  }

  return data as HandoffRequest;
}

/**
 * Get all handoff requests for an account with optional filters
 */
export async function getHandoffRequestsForAccount(
  accountId: string,
  filters?: {
    status?: HandoffRequest["status"];
    assignedToMe?: boolean;
    userId?: string;
  }
): Promise<HandoffRequest[]> {
  let query = supabase
    .from("handoff_requests")
    .select(`
      *,
      campaign:campaigns(id, name),
      call:call_sessions(id, started_at, duration_ms),
      lead:leads(id, name, email, phone),
      assigned_agent:users(id, name, email)
    `)
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.assignedToMe && filters?.userId) {
    query = query.eq("assigned_to_user_id", filters.userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching handoff requests:", error);
    throw new Error(`Failed to fetch handoff requests: ${error.message}`);
  }

  return (data || []) as HandoffRequest[];
}

/**
 * Get a specific handoff request by ID
 */
export async function getHandoffRequestById(
  accountId: string,
  handoffId: string
): Promise<HandoffRequest | null> {
  const { data, error } = await supabase
    .from("handoff_requests")
    .select(`
      *,
      campaign:campaigns(id, name, description),
      call:call_sessions(id, started_at, ended_at, duration_ms, status),
      lead:leads(id, name, email, phone, intent_summary, status),
      assigned_agent:users(id, name, email, avatar_url)
    `)
    .eq("id", handoffId)
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching handoff request:", error);
    throw new Error(`Failed to fetch handoff request: ${error.message}`);
  }

  return data as HandoffRequest | null;
}

/**
 * Update handoff request status and related fields
 */
export async function updateHandoffStatus(
  accountId: string,
  handoffId: string,
  updates: {
    status?: HandoffRequest["status"];
    assignedToUserId?: string;
    claimedAt?: string;
    resolvedAt?: string;
    notes?: string;
  }
): Promise<HandoffRequest> {
  const updateData: any = {};

  if (updates.status) updateData.status = updates.status;
  if (updates.assignedToUserId !== undefined) updateData.assigned_to_user_id = updates.assignedToUserId;
  if (updates.claimedAt) updateData.claimed_at = updates.claimedAt;
  if (updates.resolvedAt) updateData.resolved_at = updates.resolvedAt;
  if (updates.notes) updateData.notes = updates.notes;

  const { data, error } = await supabase
    .from("handoff_requests")
    .update(updateData)
    .eq("id", handoffId)
    .eq("account_id", accountId)
    .select()
    .single();

  if (error) {
    console.error("Error updating handoff request:", error);
    throw new Error(`Failed to update handoff request: ${error.message}`);
  }

  return data as HandoffRequest;
}

/**
 * Accept/claim a handoff request (agent claims it)
 */
export async function claimHandoff(
  accountId: string,
  handoffId: string,
  agentUserId: string
): Promise<HandoffRequest> {
  return updateHandoffStatus(accountId, handoffId, {
    status: "claimed",
    assignedToUserId: agentUserId,
    claimedAt: new Date().toISOString(),
  });
}

/**
 * Mark handoff as in progress
 */
export async function startHandoff(
  accountId: string,
  handoffId: string
): Promise<HandoffRequest> {
  return updateHandoffStatus(accountId, handoffId, {
    status: "in_progress",
  });
}

/**
 * Complete/resolve a handoff request
 */
export async function resolveHandoff(
  accountId: string,
  handoffId: string,
  notes?: string
): Promise<HandoffRequest> {
  return updateHandoffStatus(accountId, handoffId, {
    status: "resolved",
    resolvedAt: new Date().toISOString(),
    notes,
  });
}

/**
 * Cancel a handoff request
 */
export async function cancelHandoff(
  accountId: string,
  handoffId: string,
  reason?: string
): Promise<HandoffRequest> {
  return updateHandoffStatus(accountId, handoffId, {
    status: "cancelled",
    notes: reason,
  });
}

/**
 * Get handoff statistics for dashboard
 */
export async function getHandoffStats(accountId: string): Promise<{
  pending: number;
  inProgress: number;
  resolvedToday: number;
  avgResponseTime: number | null;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: all, error } = await supabase
    .from("handoff_requests")
    .select("status, created_at, claimed_at")
    .eq("account_id", accountId);

  if (error) {
    console.error("Error fetching handoff stats:", error);
    return { pending: 0, inProgress: 0, resolvedToday: 0, avgResponseTime: null };
  }

  const pending = all.filter(h => h.status === "pending").length;
  const inProgress = all.filter(h => h.status === "in_progress" || h.status === "claimed").length;
  const resolvedToday = all.filter(
    h => h.status === "resolved" && new Date(h.created_at) >= today
  ).length;

  // Calculate average response time (from created to claimed)
  const claimedHandoffs = all.filter(h => h.claimed_at && h.created_at);
  const avgResponseTime = claimedHandoffs.length > 0
    ? claimedHandoffs.reduce((sum, h) => {
        const diff = new Date(h.claimed_at!).getTime() - new Date(h.created_at).getTime();
        return sum + diff;
      }, 0) / claimedHandoffs.length / 1000 / 60 // Convert to minutes
    : null;

  return {
    pending,
    inProgress,
    resolvedToday,
    avgResponseTime,
  };
}
