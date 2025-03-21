export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'user' | 'admin' | 'sales_manager';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          role: UserRole
          name: string | null
          updated_at: string
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          role?: UserRole
          name?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          role?: UserRole
          name?: string | null
          updated_at?: string
        }
      }
      scraped_contacts: {
        Row: {
          id: string
          business_name: string
          business_type: string | null
          address: string | null
          office_hours: string | null
          website: string | null
          phone: string | null
          email: string | null
          rating: number | null
          review_count: number | null
          location: string
          keywords: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          business_name: string
          business_type?: string | null
          address?: string | null
          office_hours?: string | null
          website?: string | null
          phone?: string | null
          email?: string | null
          rating?: number | null
          review_count?: number | null
          location: string
          keywords: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          business_name?: string
          business_type?: string | null
          address?: string | null
          office_hours?: string | null
          website?: string | null
          phone?: string | null
          email?: string | null
          rating?: number | null
          review_count?: number | null
          location?: string
          keywords?: string
          created_at?: string
          user_id?: string
        }
      }
      search_history: {
        Row: {
          id: string
          user_id: string
          location: string
          keywords: string
          results_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          location: string
          keywords: string
          results_count: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          location?: string
          keywords?: string
          results_count?: number
          created_at?: string
        }
      }
      user_actions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          action: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          action: string
          metadata: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          action?: string
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 