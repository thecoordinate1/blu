export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          created_at: string
          whatsapp_number: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          whatsapp_number?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          whatsapp_number?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
        }
      }
      conversations: {
        Row: {
          id: string
          business_id: string
          customer_number: string
          status: 'active' | 'escalated' | 'resolved'
          last_message_at: string
          summary: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          business_id: string
          customer_number: string
          status?: 'active' | 'escalated' | 'resolved'
          last_message_at?: string
          summary?: string | null
          metadata?: Json | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          business_id: string
          role: 'user' | 'agent' | 'system'
          content: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          conversation_id: string
          business_id: string
          role: 'user' | 'agent' | 'system'
          content: string
          created_at?: string
          metadata?: Json | null
        }
      }
    }
  }
}
