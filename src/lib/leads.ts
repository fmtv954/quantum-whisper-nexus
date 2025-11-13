/**
 * Leads data access helpers
 * Handles fetching and updating lead records with proper account scoping
 */

import { supabase } from "@/integrations/supabase/client";
import { getCurrentAccountId } from "./data";

export interface Lead {
  id: string;
  account_id: string;
  campaign_id: string | null;
  call_id: string | null;
  email: string | null;
  phone: string | null;
  name: string | null;
  status: string;
  score: number | null;
  intent_summary: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  consent_ticket_id: string | null;
}

export interface LeadWithCampaign extends Lead {
  campaign?: {
    id: string;
    name: string;
  };
  call_session?: {
    id: string;
    started_at: string;
    duration_ms: number | null;
    status: string;
  };
}

export interface GetLeadsOptions {
  campaignId?: string;
}

/**
 * Fetch all leads for the current account
 */
export async function getLeadsForAccount(
  options: GetLeadsOptions = {}
): Promise<LeadWithCampaign[]> {
  const accountId = await getCurrentAccountId();

  let query = supabase
    .from("leads")
    .select(
      `
      *,
      campaign:campaigns(id, name),
      call_session:call_sessions(id, started_at, duration_ms, status)
    `
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (options.campaignId) {
    query = query.eq("campaign_id", options.campaignId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching leads:", error);
    throw error;
  }

  return (data as LeadWithCampaign[]) || [];
}

/**
 * Fetch a single lead by ID with campaign and call details
 */
export async function getLeadById(leadId: string): Promise<LeadWithCampaign | null> {
  const accountId = await getCurrentAccountId();

  const { data, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      campaign:campaigns(id, name),
      call_session:call_sessions(id, started_at, duration_ms, status)
    `
    )
    .eq("id", leadId)
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching lead:", error);
    throw error;
  }

  return data as LeadWithCampaign | null;
}

/**
 * Update lead status and notes
 */
export async function updateLeadStatusAndNotes(
  leadId: string,
  updates: { 
    status?: "new" | "qualified" | "unqualified" | "contacted" | "converted"; 
    notes?: string;
  }
): Promise<void> {
  const accountId = await getCurrentAccountId();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.status) updateData.status = updates.status;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  const { error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId)
    .eq("account_id", accountId);

  if (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
}

/**
 * Lead status options
 */
export const LEAD_STATUSES = [
  { value: "new" as const, label: "New", color: "bg-blue-500" },
  { value: "qualified" as const, label: "Qualified", color: "bg-green-500" },
  { value: "unqualified" as const, label: "Unqualified", color: "bg-gray-500" },
  { value: "contacted" as const, label: "Contacted", color: "bg-purple-500" },
  { value: "converted" as const, label: "Converted", color: "bg-emerald-500" },
] as const;

/**
 * Get status display info
 */
export function getStatusInfo(status: string) {
  return LEAD_STATUSES.find((s) => s.value === status) || LEAD_STATUSES[0];
}
