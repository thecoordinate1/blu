// ──────────────────────────────────────────────
// Core domain types for Blu_bot
// ──────────────────────────────────────────────

export interface Business {
  id: string;
  name: string;
  ops_number: string;
  primary_number: string;
  gemini_context: GeminiContext;
  subscription_tier: string;
  api_key: string;
  created_at: string;
}

export interface GeminiContext {
  persona?: string;
  knowledge_base?: string;
  tone?: string;
  capabilities?: string[];
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  business_id: string;
  contact_wa_id: string;
  status: string;
  last_message_at: string;
  escalation_reason: string | null;
  agent_context: AgentContext;
  created_at: string;
}

export interface AgentContext {
  summary?: string;
  unresolved_turns?: number;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  conversation_id: string;
  business_id: string;
  direction: MessageDirection;
  role: MessageRole;
  body: string | null;
  media_url: string | null;
  wa_message_id: string | null;
  created_at: string;
}

export interface AgentAction {
  id: string;
  conversation_id: string;
  business_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  status: string;
  executed_at: string | null;
  created_at: string;
}

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

export enum AgentState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  REASONING = 'REASONING',
  DB_READ = 'DB_READ',
  DB_WRITE = 'DB_WRITE',
  AWAITING_CONFIRM = 'AWAITING_CONFIRM',
  ESCALATING = 'ESCALATING',
  RESPONDING = 'RESPONDING',
  PAUSED = 'PAUSED',
  FALLBACK = 'FALLBACK',
}

export enum AgentIntent {
  QUERY = 'query',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ESCALATE = 'escalate',
  CLARIFY = 'clarify',
  CHITCHAT = 'chitchat',
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageRole = 'user' | 'assistant' | 'system';

// ──────────────────────────────────────────────
// Gemini response shape
// ──────────────────────────────────────────────

export interface GeminiAction {
  type: 'db_read' | 'db_write' | 'none';
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'none';
  filters: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface GeminiResponse {
  intent: AgentIntent;
  confidence: number;
  action: GeminiAction;
  entities: Record<string, unknown>;
  reply: string;
  escalate: boolean;
  escalation_reason: string | null;
  summary_update: string | null;
}

// ──────────────────────────────────────────────
// WhatsApp webhook payload (simplified)
// ──────────────────────────────────────────────

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// ──────────────────────────────────────────────
// Queue job payload
// ──────────────────────────────────────────────

export interface QueueJobData {
  conversationId: string;
  businessId: string;
  messageId: string;
  contactWaId: string;
  messageBody: string;
  timestamp: number;
}

// ──────────────────────────────────────────────
// Insert payloads (omit auto-generated fields)
// ──────────────────────────────────────────────

export type MessageInsert = Omit<Message, 'id' | 'created_at'>;
export type AgentActionInsert = Omit<AgentAction, 'id' | 'created_at' | 'executed_at'>;
