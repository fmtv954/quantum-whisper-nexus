/**
 * Onboarding utilities for Quantum Voice AI Platform
 * Handles first-time user experience and campaign creation
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Check if user needs to go through onboarding
 * Returns true if user has no campaigns yet
 */
export async function needsOnboarding(): Promise<boolean> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get user's profile to find their accounts
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) return true;

    // Get user's account memberships
    const { data: memberships } = await supabase
      .from('account_memberships')
      .select('account_id')
      .eq('user_id', userData.id);

    if (!memberships || memberships.length === 0) return true;

    // Check if any of their accounts have campaigns
    const accountIds = memberships.map(m => m.account_id);
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id')
      .in('account_id', accountIds)
      .limit(1);

    if (error) throw error;

    // If no campaigns exist, needs onboarding
    return !campaigns || campaigns.length === 0;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Get the user's primary account ID
 */
export async function getPrimaryAccountId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) return null;

    // Get first account membership (owner role preferred)
    const { data: membership } = await supabase
      .from('account_memberships')
      .select('account_id')
      .eq('user_id', userData.id)
      .order('role', { ascending: true }) // owner comes first alphabetically
      .limit(1)
      .single();

    return membership?.account_id || null;
  } catch (error) {
    console.error('Error getting primary account:', error);
    return null;
  }
}

export interface CreateCampaignData {
  name: string;
  goal: string;
  entry_type?: 'qr_code' | 'web_widget' | 'both';
}

/**
 * Create a new campaign during onboarding
 */
export async function createFirstCampaign(data: CreateCampaignData) {
  try {
    const accountId = await getPrimaryAccountId();
    
    if (!accountId) {
      throw new Error('No account found for user');
    }

    // Map 'both' to 'web_widget' as primary, store preference in metadata
    const entryType = data.entry_type === 'both' ? 'web_widget' : (data.entry_type || 'web_widget');

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert([{
        account_id: accountId,
        name: data.name,
        status: 'draft',
        entry_type: entryType as 'qr_code' | 'web_widget',
        metadata: {
          goal: data.goal,
          onboarding_completed: true,
          supports_both_entry_types: data.entry_type === 'both',
        },
      }])
      .select()
      .single();

    if (error) throw error;

    return { campaign, error: null };
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return { campaign: null, error: { message: error.message } };
  }
}
