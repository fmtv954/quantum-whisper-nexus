/**
 * Analytics Aggregation Helpers
 * 
 * Provides aggregated metrics for analytics pages
 */

import { supabase } from "@/integrations/supabase/client";
import { getUsageForAccount, getCostBreakdownByProvider } from "./usage";

export interface GlobalAnalytics {
  totalCalls: number;
  totalLeads: number;
  conversionRate: number;
  avgCallDuration: number; // seconds
  handoffRate: number;
  totalCost: number;
  costPerLead: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  calls: number;
  leads: number;
  conversionRate: number;
  handoffs: number;
  avgCallDuration: number;
  cost: number;
  costPerLead: number;
}

export interface CostAnalytics {
  totalCost: number;
  llmCost: number;
  sttCost: number;
  ttsCost: number;
  livekitCost: number;
  breakdown: Array<{
    provider: string;
    service: string;
    total_cost: number;
    total_units: number;
  }>;
  byCampaign: Array<{
    campaignId: string;
    campaignName: string;
    calls: number;
    totalCost: number;
    costPerCall: number;
    costPerLead: number;
  }>;
}

/**
 * Get global analytics for account
 */
export async function getGlobalAnalytics(
  accountId: string,
  options?: { from?: string; to?: string }
): Promise<GlobalAnalytics> {
  const from = options?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to = options?.to || new Date().toISOString();

  // Fetch calls
  let callsQuery = supabase
    .from("call_sessions")
    .select("id, duration_ms, lead_id")
    .eq("account_id", accountId)
    .gte("started_at", from)
    .lte("started_at", to);

  const { data: calls, error: callsError } = await callsQuery;
  if (callsError) throw callsError;

  const totalCalls = calls?.length || 0;

  // Fetch leads
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id")
    .eq("account_id", accountId)
    .gte("created_at", from)
    .lte("created_at", to);

  if (leadsError) throw leadsError;

  const totalLeads = leads?.length || 0;

  // Fetch handoffs
  const { data: handoffs, error: handoffsError } = await supabase
    .from("handoff_requests")
    .select("id")
    .eq("account_id", accountId)
    .gte("created_at", from)
    .lte("created_at", to);

  if (handoffsError) throw handoffsError;

  const totalHandoffs = handoffs?.length || 0;

  // Calculate metrics
  const conversionRate = totalCalls > 0 ? (totalLeads / totalCalls) * 100 : 0;
  const handoffRate = totalCalls > 0 ? (totalHandoffs / totalCalls) * 100 : 0;

  const completedCalls = calls?.filter(c => c.duration_ms && c.duration_ms > 0) || [];
  const avgCallDuration = completedCalls.length > 0
    ? completedCalls.reduce((sum, c) => sum + (c.duration_ms || 0), 0) / completedCalls.length / 1000
    : 0;

  // Fetch usage/costs
  const usageEvents = await getUsageForAccount(accountId, { from, to });
  const totalCost = usageEvents.reduce((sum, e) => sum + Number(e.total_cost_usd), 0);
  const costPerLead = totalLeads > 0 ? totalCost / totalLeads : 0;

  return {
    totalCalls,
    totalLeads,
    conversionRate,
    avgCallDuration,
    handoffRate,
    totalCost,
    costPerLead,
  };
}

/**
 * Get per-campaign analytics
 */
export async function getCampaignAnalytics(
  accountId: string,
  options?: { from?: string; to?: string }
): Promise<CampaignAnalytics[]> {
  const from = options?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to = options?.to || new Date().toISOString();

  // Fetch all campaigns
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("account_id", accountId);

  if (campaignsError) throw campaignsError;

  // Fetch usage events
  const usageEvents = await getUsageForAccount(accountId, { from, to });

  const analytics: CampaignAnalytics[] = [];

  for (const campaign of campaigns || []) {
    // Fetch calls for campaign
    const { data: calls } = await supabase
      .from("call_sessions")
      .select("id, duration_ms, lead_id")
      .eq("account_id", accountId)
      .eq("campaign_id", campaign.id)
      .gte("started_at", from)
      .lte("started_at", to);

    const totalCalls = calls?.length || 0;

    // Fetch leads
    const { data: leads } = await supabase
      .from("leads")
      .select("id")
      .eq("account_id", accountId)
      .eq("campaign_id", campaign.id)
      .gte("created_at", from)
      .lte("created_at", to);

    const totalLeads = leads?.length || 0;

    // Fetch handoffs
    const { data: handoffs } = await supabase
      .from("handoff_requests")
      .select("id")
      .eq("account_id", accountId)
      .eq("campaign_id", campaign.id)
      .gte("created_at", from)
      .lte("created_at", to);

    const totalHandoffs = handoffs?.length || 0;

    // Calculate metrics
    const conversionRate = totalCalls > 0 ? (totalLeads / totalCalls) * 100 : 0;

    const completedCalls = calls?.filter(c => c.duration_ms && c.duration_ms > 0) || [];
    const avgCallDuration = completedCalls.length > 0
      ? completedCalls.reduce((sum, c) => sum + (c.duration_ms || 0), 0) / completedCalls.length / 1000
      : 0;

    // Calculate cost
    const campaignCost = usageEvents
      .filter(e => e.campaign_id === campaign.id)
      .reduce((sum, e) => sum + Number(e.total_cost_usd), 0);

    const costPerLead = totalLeads > 0 ? campaignCost / totalLeads : 0;

    analytics.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      calls: totalCalls,
      leads: totalLeads,
      conversionRate,
      handoffs: totalHandoffs,
      avgCallDuration,
      cost: campaignCost,
      costPerLead,
    });
  }

  return analytics;
}

/**
 * Get cost analytics with provider breakdown
 */
export async function getCostAnalytics(
  accountId: string,
  options?: { from?: string; to?: string }
): Promise<CostAnalytics> {
  const from = options?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to = options?.to || new Date().toISOString();

  // Get provider breakdown
  const breakdown = await getCostBreakdownByProvider(accountId, { from, to });

  const totalCost = breakdown.reduce((sum, b) => sum + b.total_cost, 0);
  const llmCost = breakdown.filter(b => b.service === "llm").reduce((sum, b) => sum + b.total_cost, 0);
  const sttCost = breakdown.filter(b => b.service === "stt").reduce((sum, b) => sum + b.total_cost, 0);
  const ttsCost = breakdown.filter(b => b.service === "tts").reduce((sum, b) => sum + b.total_cost, 0);
  const livekitCost = breakdown.filter(b => b.service === "webrtc").reduce((sum, b) => sum + b.total_cost, 0);

  // Get campaign analytics for cost per campaign
  const campaignAnalytics = await getCampaignAnalytics(accountId, { from, to });

  const byCampaign = campaignAnalytics.map(c => ({
    campaignId: c.campaignId,
    campaignName: c.campaignName,
    calls: c.calls,
    totalCost: c.cost,
    costPerCall: c.calls > 0 ? c.cost / c.calls : 0,
    costPerLead: c.costPerLead,
  }));

  return {
    totalCost,
    llmCost,
    sttCost,
    ttsCost,
    livekitCost,
    breakdown,
    byCampaign,
  };
}
