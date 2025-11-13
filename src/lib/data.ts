/**
 * Data fetching utilities for Quantum Voice AI Platform
 * Reusable functions for dashboard, campaigns, leads, etc.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Get the user's primary account ID from their memberships
 */
export async function getCurrentAccountId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!userData) return null;

    // Get first account membership (owner role preferred)
    const { data: membership } = await supabase
      .from('account_memberships')
      .select('account_id')
      .eq('user_id', userData.id)
      .order('role', { ascending: true })
      .limit(1)
      .maybeSingle();

    return membership?.account_id || null;
  } catch (error) {
    console.error('Error getting account ID:', error);
    return null;
  }
}

/**
 * Get the current user's ID from the users table
 */
export async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!userData) throw new Error("User profile not found");

  return userData.id;
}

export interface DashboardMetrics {
  activeCampaigns: number;
  totalCampaigns: number;
  callsToday: number;
  leadsToday: number;
  totalLeads: number;
  avgCallDurationToday: number | null; // in seconds
}

/**
 * Fetch dashboard metrics for the current account
 */
export async function getDashboardMetrics(accountId: string): Promise<DashboardMetrics> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    // Fetch campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('account_id', accountId);

    const totalCampaigns = campaigns?.length || 0;
    const activeCampaigns = campaigns?.filter(c => 
      c.status === 'active' || c.status === 'draft'
    ).length || 0;

    // Fetch calls today
    const { data: callsToday } = await supabase
      .from('call_sessions')
      .select('id, duration_ms')
      .eq('account_id', accountId)
      .gte('started_at', startOfToday.toISOString());

    const callsTodayCount = callsToday?.length || 0;

    // Calculate average call duration
    let avgCallDurationToday: number | null = null;
    if (callsToday && callsToday.length > 0) {
      const completedCalls = callsToday.filter(c => c.duration_ms && c.duration_ms > 0);
      if (completedCalls.length > 0) {
        const totalDuration = completedCalls.reduce((sum, c) => sum + (c.duration_ms || 0), 0);
        avgCallDurationToday = Math.round(totalDuration / completedCalls.length / 1000); // convert to seconds
      }
    }

    // Fetch leads today
    const { data: leadsToday } = await supabase
      .from('leads')
      .select('id')
      .eq('account_id', accountId)
      .gte('created_at', startOfToday.toISOString());

    const leadsTodayCount = leadsToday?.length || 0;

    // Fetch total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    return {
      activeCampaigns,
      totalCampaigns,
      callsToday: callsTodayCount,
      leadsToday: leadsTodayCount,
      totalLeads: totalLeads || 0,
      avgCallDurationToday,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      activeCampaigns: 0,
      totalCampaigns: 0,
      callsToday: 0,
      leadsToday: 0,
      totalLeads: 0,
      avgCallDurationToday: null,
    };
  }
}

export interface RecentCallActivity {
  id: string;
  started_at: string;
  status: string;
  duration_ms: number | null;
  campaign: {
    id: string;
    name: string;
  } | null;
  lead_id: string | null;
}

/**
 * Fetch recent call activity for the current account
 */
export async function getRecentCallActivity(accountId: string, limit = 10): Promise<RecentCallActivity[]> {
  try {
    const { data: calls, error } = await supabase
      .from('call_sessions')
      .select(`
        id,
        started_at,
        status,
        duration_ms,
        lead_id,
        campaign_id,
        campaigns (
          id,
          name
        )
      `)
      .eq('account_id', accountId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (calls || []).map(call => ({
      id: call.id,
      started_at: call.started_at,
      status: call.status,
      duration_ms: call.duration_ms,
      campaign: call.campaigns as any,
      lead_id: call.lead_id,
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
