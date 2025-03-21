import { supabase } from './supabase';
import { UserRole } from './supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Sign up a new user
export const signUp = async (email: string, password: string, role: UserRole = 'salesperson') => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
        },
      },
    });

    if (error) {
      throw error;
    }

    // Log the signup action
    if (data.user) {
      await logUserAction(data.user.id, 'signup', { email });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { data: null, error };
  }
};

// Sign in an existing user
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Log the signin action
    if (data.user) {
      await logUserAction(data.user.id, 'signin', { email });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
};

// Sign out the currently signed in user
export const signOut = async () => {
  try {
    // Get the current user before signing out to log the action
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    // Log the signout action
    if (user) {
      await logUserAction(user.id, 'signout', { email: user.email });
    }

    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error };
  }
};

// Get the current user session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting session:', error);
    return { data: null, error };
  }
};

// Get user role from metadata
export const logUserAction = async (
  userId: string, 
  action: string, 
  metadata: Record<string, any>
) => {
  const supabase = createClientComponentClient();
  
  try {
    await supabase.from('user_actions').insert({
      user_id: userId,
      action,
      metadata
    });
  } catch (error) {
    console.error('Failed to log user action:', error);
  }
};

export const getUserRole = async (
  userId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<UserRole | null> => {
  try {
    // Use provided client or create a new one
    const supabase = supabaseClient || createClientComponentClient<Database>();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return profile?.role as UserRole || 'user';
  } catch (error) {
    console.error('Failed to get user role:', error);
    return null;
  }
};

// Get current user
export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
} 