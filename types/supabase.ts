export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          role: 'user' | 'admin' | 'sales_manager'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          role?: 'user' | 'admin' | 'sales_manager'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          role?: 'user' | 'admin' | 'sales_manager'
          created_at?: string
          updated_at?: string
        }
      }
      scraped_contacts: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          social_media: Json | null
          business_hours: Json | null
          rating: number | null
          review_count: number | null
          categories: string[] | null
          created_at: string
          location: string | null
          keywords: string | null
        }
        Insert: {
          id?: string
          user_id: string
          business_name?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          social_media?: Json | null
          business_hours?: Json | null
          rating?: number | null
          review_count?: number | null
          categories?: string[] | null
          created_at?: string
          location?: string | null
          keywords?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          social_media?: Json | null
          business_hours?: Json | null
          rating?: number | null
          review_count?: number | null
          categories?: string[] | null
          created_at?: string
          location?: string | null
          keywords?: string | null
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
      user_role: 'user' | 'admin' | 'sales_manager'
    }
  }
} 