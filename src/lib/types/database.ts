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
      /**
       * Multi-tenant business profiles. One per authenticated admin.
       * Provisioned through the onboarding flow or auto-created on signup.
       */
      businesses: {
        Row: {
          id: string
          name: string
          created_at: string
          /** WhatsApp Business number connected to this tenant */
          whatsapp_number: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          owner_id: string
          messages_used: number
          messages_limit: number
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
      /**
       * Customer conversation threads. Scoped per business.
       */
      conversations: {
        Row: {
          id: string
          business_id: string
          /** Customer WhatsApp number */
          customer_number: string
          status: 'active' | 'escalated' | 'resolved'
          last_message_at: string
          /** Rolling AI conversation summary */
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
        Update: {
          id?: string
          status?: 'active' | 'escalated' | 'resolved'
          last_message_at?: string
          summary?: string | null
          metadata?: Json | null
        }
      }
      /**
       * Individual messages within a conversation.
       */
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
        Update: {
          id?: string
          role?: 'user' | 'agent' | 'system'
          content?: string
          metadata?: Json | null
        }
      }
      /**
       * Payments tracked via the Lenco billing integration.
       */
      payments: {
        Row: {
          id: string
          business_id: string
          amount: number
          currency: string
          status: 'pending' | 'successful' | 'failed'
          provider: string
          payment_method: 'mtn' | 'airtel' | 'zamtel' | 'card'
          reference: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'successful' | 'failed'
          provider?: string
          payment_method: 'mtn' | 'airtel' | 'zamtel' | 'card'
          reference: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'successful' | 'failed'
          updated_at?: string
        }
      }
      /**
       * Full audit trail of every agent action. Required for compliance.
       */
      agent_actions: {
        Row: {
          id: string
          conversation_id: string
          business_id: string
          action_type: 'auto_reply' | 'escalation' | 'status_change' | 'payment'
          payload: Json
          status: 'pending' | 'success' | 'failed'
          executed_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          business_id: string
          action_type: 'auto_reply' | 'escalation' | 'status_change' | 'payment'
          payload: Json
          status?: 'pending' | 'success' | 'failed'
          executed_at?: string
        }
        Update: {
          status?: 'pending' | 'success' | 'failed'
        }
      }
      /**
       * WhatsApp sessions managed by whatsapp-web.js gateway.
       */
      whatsapp_sessions: {
        Row: {
          id: string
          business_id: string
          display_phone_number: string | null
          verified_name: string | null
          status: 'pending' | 'connected' | 'disconnected'
          quality_rating: string | null
          session_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          display_phone_number?: string | null
          verified_name?: string | null
          status?: 'pending' | 'connected' | 'disconnected'
          quality_rating?: string | null
          session_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_phone_number?: string | null
          verified_name?: string | null
          status?: 'pending' | 'connected' | 'disconnected'
          quality_rating?: string | null
          session_data?: Json | null
          updated_at?: string
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
