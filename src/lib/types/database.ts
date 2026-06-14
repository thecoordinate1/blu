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
       * Provisioned through the onboarding flow only.
       */
      businesses: {
        Row: {
          id: string
          name: string
          created_at: string
          /** WhatsApp ops number the agent answers on (e.g. +260971234567) */
          ops_number: string | null
          /** Owner's personal WhatsApp number for escalation notifications */
          primary_number: string | null
          /** Per-tenant Gemini persona config (name, tone, domain knowledge) */
          gemini_context: Json | null
          subscription_tier: 'starter' | 'growth' | 'enterprise'
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          ops_number?: string | null
          primary_number?: string | null
          gemini_context?: Json | null
          subscription_tier?: 'starter' | 'growth' | 'enterprise'
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          ops_number?: string | null
          primary_number?: string | null
          gemini_context?: Json | null
          subscription_tier?: 'starter' | 'growth' | 'enterprise'
        }
      }
      /**
       * Customer conversation threads. Scoped per business.
       */
      conversations: {
        Row: {
          id: string
          business_id: string
          /** Customer WhatsApp ID (phone number as sent by WABA) */
          contact_wa_id: string
          status: 'active' | 'escalated' | 'closed' | 'paused'
          last_message_at: string
          escalation_reason: string | null
          /** Rolling AI conversation summary, updated every 5 turns */
          agent_context: Json | null
        }
        Insert: {
          id?: string
          business_id: string
          contact_wa_id: string
          status?: 'active' | 'escalated' | 'closed' | 'paused'
          last_message_at?: string
          escalation_reason?: string | null
          agent_context?: Json | null
        }
        Update: {
          id?: string
          status?: 'active' | 'escalated' | 'closed' | 'paused'
          escalation_reason?: string | null
          agent_context?: Json | null
        }
      }
      /**
       * Individual messages within a conversation.
       */
      messages: {
        Row: {
          id: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          role: 'user' | 'agent' | 'human_agent'
          body: string
          media_url: string | null
          wa_message_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          role: 'user' | 'agent' | 'human_agent'
          body: string
          media_url?: string | null
          wa_message_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          direction?: 'inbound' | 'outbound'
          role?: 'user' | 'agent' | 'human_agent'
          body?: string
        }
      }
      /**
       * Full audit trail of every agent action. Required for compliance.
       */
      agent_actions: {
        Row: {
          id: string
          conversation_id: string
          action_type: 'query' | 'insert' | 'update' | 'delete' | 'escalate' | 'notify'
          payload: Json
          status: 'pending' | 'success' | 'failed'
          executed_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          action_type: 'query' | 'insert' | 'update' | 'delete' | 'escalate' | 'notify'
          payload: Json
          status?: 'pending' | 'success' | 'failed'
          executed_at?: string
        }
        Update: {
          status?: 'pending' | 'success' | 'failed'
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
