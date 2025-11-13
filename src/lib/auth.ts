/**
 * Authentication utilities for Quantum Voice AI Platform
 * Handles signup, login, logout, and session management
 */

import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  companyName?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

/**
 * Sign up a new user and create their account + membership
 */
export async function signUp({ email, password, name, companyName }: SignUpData) {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Failed to create user");

    // 2. User profile and account are created via database trigger (handle_new_user)
    // 3. Wait briefly for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Create default account if companyName provided
    if (companyName && authData.user) {
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .insert({
          name: companyName,
          slug,
          plan: 'free',
          status: 'active',
        })
        .select()
        .single();

      if (!accountError && account) {
        // Get the user's profile ID
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authData.user.id)
          .single();

        if (userData) {
          // Create account membership
          await supabase.from('account_memberships').insert({
            account_id: account.id,
            user_id: userData.id,
            role: 'owner',
          });
        }
      }
    }

    return { user: authData.user, error: null };
  } catch (error: any) {
    return { user: null, error: { message: error.message, code: error.code } };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error: any) {
    return { 
      user: null, 
      session: null, 
      error: { message: error.message, code: error.code } 
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current user session
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Determine the post-login redirect URL
 * New users with no campaigns go to onboarding, existing users go to dashboard
 */
export async function getPostLoginRedirect(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return '/login';

    // Get user's profile
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) return '/onboarding/welcome';

    // Get user's account memberships
    const { data: memberships } = await supabase
      .from('account_memberships')
      .select('account_id')
      .eq('user_id', userData.id);

    if (!memberships || memberships.length === 0) {
      return '/onboarding/welcome';
    }

    // Check if any of their accounts have campaigns
    const accountIds = memberships.map(m => m.account_id);
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .in('account_id', accountIds)
      .limit(1);

    // If no campaigns exist, go to onboarding
    if (!campaigns || campaigns.length === 0) {
      return '/onboarding/welcome';
    }

    // Existing user with campaigns goes to dashboard
    return '/dashboard';
  } catch (error) {
    console.error('Error determining redirect:', error);
    return '/dashboard';
  }
}

/**
 * Request password reset email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: { message: error.message, code: error.code } };
  }
}
