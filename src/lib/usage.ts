/**
 * Usage & Cost Tracking
 * 
 * Records and retrieves usage events for cost monitoring and analytics.
 * Tracks LLM tokens, STT/TTS duration, LiveKit minutes, etc.
 */

import { supabase } from "@/integrations/supabase/client";

export interface UsageEvent {
  id: string;
  account_id: string;
  campaign_id: string | null;
  call_id: string | null;
  provider: string;
  service: string;
  unit_type: string;
  units: number;
  unit_cost_usd: number;
  total_cost_usd: number;
  metadata: any;
  occurred_at: string;
  created_at: string;
}

export interface RecordUsageParams {
  accountId: string;
  campaignId?: string;
  callId?: string;
  provider: string; // 'openai', 'deepgram', 'livekit'
  service: string; // 'llm', 'stt', 'tts', 'webrtc'
  unitType: string; // 'tokens', 'seconds', 'messages'
  units: number;
  unitCostUsd: number;
  metadata?: any;
}

/**
 * Record a usage event
 * 
 * Called from voice pipeline, LLM calls, etc. to track costs
 */
export async function recordUsageEvent(params: RecordUsageParams): Promise<UsageEvent> {
  const totalCostUsd = params.units * params.unitCostUsd;

  const { data, error } = await supabase
    .from("usage_events")
    .insert({
      account_id: params.accountId,
      campaign_id: params.campaignId || null,
      call_id: params.callId || null,
      provider: params.provider,
      service: params.service,
      unit_type: params.unitType,
      units: params.units,
      unit_cost_usd: params.unitCostUsd,
      total_cost_usd: totalCostUsd,
      metadata: params.metadata || {},
      occurred_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error recording usage event:", error);
    throw new Error(`Failed to record usage event: ${error.message}`);
  }

  return data as UsageEvent;
}

/**
 * Get usage events for an account within a date range
 */
export async function getUsageForAccount(
  accountId: string,
  options?: { from?: string; to?: string }
): Promise<UsageEvent[]> {
  let query = supabase
    .from("usage_events")
    .select("*")
    .eq("account_id", accountId)
    .order("occurred_at", { ascending: false });

  if (options?.from) {
    query = query.gte("occurred_at", options.from);
  }

  if (options?.to) {
    query = query.lte("occurred_at", options.to);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching usage events:", error);
    throw new Error(`Failed to fetch usage events: ${error.message}`);
  }

  return (data || []) as UsageEvent[];
}

/**
 * Get usage aggregated by campaign
 */
export async function getUsageByCampaign(
  accountId: string,
  options?: { from?: string; to?: string }
): Promise<Array<{ campaign_id: string; total_cost: number; total_units: number }>> {
  const events = await getUsageForAccount(accountId, options);

  const byCampaign = events.reduce((acc, event) => {
    if (!event.campaign_id) return acc;
    
    if (!acc[event.campaign_id]) {
      acc[event.campaign_id] = { campaign_id: event.campaign_id, total_cost: 0, total_units: 0 };
    }
    
    acc[event.campaign_id].total_cost += Number(event.total_cost_usd);
    acc[event.campaign_id].total_units += Number(event.units);
    
    return acc;
  }, {} as Record<string, { campaign_id: string; total_cost: number; total_units: number }>);

  return Object.values(byCampaign);
}

/**
 * Get cost breakdown by provider
 */
export async function getCostBreakdownByProvider(
  accountId: string,
  options?: { from?: string; to?: string }
): Promise<Array<{ provider: string; service: string; total_cost: number; total_units: number }>> {
  const events = await getUsageForAccount(accountId, options);

  const breakdown = events.reduce((acc, event) => {
    const key = `${event.provider}:${event.service}`;
    
    if (!acc[key]) {
      acc[key] = {
        provider: event.provider,
        service: event.service,
        total_cost: 0,
        total_units: 0,
      };
    }
    
    acc[key].total_cost += Number(event.total_cost_usd);
    acc[key].total_units += Number(event.units);
    
    return acc;
  }, {} as Record<string, { provider: string; service: string; total_cost: number; total_units: number }>);

  return Object.values(breakdown);
}
