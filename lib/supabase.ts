import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// These environment variables will be set in .env.local later
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single Supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Type definitions for user roles
export type UserRole = 'salesperson' | 'sales_manager' | 'admin';

// Type for scraped data
export type ScrapedContact = {
  id?: string;
  business_name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  social_media?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  created_at?: string;
  user_id?: string;
};

// Type for audit log entries
export type AuditLogEntry = {
  id?: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  timestamp?: string;
}; 