/**
 * Campaign management utilities
 * CRUD operations for campaigns with proper multi-tenant scoping
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getCurrentAccountId } from "./data";

type DbCampaign = Database['public']['Tables']['campaigns']['Row'];

export interface Campaign extends Omit<DbCampaign, 'metadata'> {
  metadata: Record<string, any> | null;
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  goal?: string;
  entry_type?: string;
}

/**
 * Get all campaigns for the current account
 */
export async function getCampaignsForAccount(accountId: string): Promise<Campaign[]> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Campaign[];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

/**
 * Get a single campaign by ID (scoped to account)
 */
export async function getCampaignById(
  accountId: string,
  campaignId: string
): Promise<Campaign | null> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('account_id', accountId)
      .eq('id', campaignId)
      .maybeSingle();

    if (error) throw error;
    return data as Campaign | null;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }
}

/**
 * Create a new campaign for the account
 */
export async function createCampaignForAccount(
  accountId: string,
  data: CreateCampaignData
): Promise<Campaign | null> {
  try {
    const metadata: Record<string, any> = {};
    if (data.goal) {
      metadata.goal = data.goal;
    }

    const insertData: Database['public']['Tables']['campaigns']['Insert'] = {
      account_id: accountId,
      name: data.name,
      description: data.description || null,
      status: 'draft',
      entry_type: (data.entry_type || 'web_widget') as any,
      metadata: metadata as any,
    };

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return campaign as Campaign;
  } catch (error) {
    console.error('Error creating campaign:', error);
    return null;
  }
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  accountId: string,
  campaignId: string,
  status: 'draft' | 'active' | 'paused' | 'archived'
): Promise<Campaign | null> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('account_id', accountId)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return null;
  }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(
  accountId: string,
  campaignId: string,
  updates: Partial<CreateCampaignData>
): Promise<Campaign | null> {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.entry_type !== undefined) updateData.entry_type = updates.entry_type;
    
    if (updates.goal !== undefined) {
      const { data: current } = await supabase
        .from('campaigns')
        .select('metadata')
        .eq('id', campaignId)
        .single();
      
      const currentMetadata = current?.metadata as Record<string, any> | null;
      updateData.metadata = {
        ...(currentMetadata || {}),
        goal: updates.goal,
      } as any;
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('account_id', accountId)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  } catch (error) {
    console.error('Error updating campaign:', error);
    return null;
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(
  accountId: string,
  campaignId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('account_id', accountId)
      .eq('id', campaignId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return false;
  }
}

/**
 * Get recent call sessions for a campaign
 */
export async function getRecentCallsForCampaign(
  campaignId: string,
  limit = 5
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('call_sessions')
      .select('id, started_at, status, duration_ms, lead_id')
      .eq('campaign_id', campaignId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching campaign calls:', error);
    return [];
  }
}
