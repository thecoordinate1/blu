import { supabase } from './client.js';
import type {
  Business,
  Conversation,
  Message,
  AgentAction,
  MessageInsert,
  AgentActionInsert,
  AgentContext,
} from '../lib/types.js';
import { MAX_CONTEXT_MESSAGES } from '../lib/constants.js';

// ──────────────────────────────────────────────
// Business queries
// ──────────────────────────────────────────────

export async function getBusinessByOpsNumber(
  opsNumber: string
): Promise<Business | null> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('ops_number', opsNumber)
      .single();

    if (error) {
      // PGRST116 = no rows found — expected when number doesn't match any business
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Business;
  } catch (err) {
    console.error('[queries] getBusinessByOpsNumber failed:', err);
    throw err;
  }
}

export async function getBusinessById(
  businessId: string
): Promise<Business | null> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Business;
  } catch (err) {
    console.error('[queries] getBusinessById failed:', err);
    throw err;
  }
}

// ──────────────────────────────────────────────
// Conversation queries
// ──────────────────────────────────────────────

/**
 * Find the active conversation for a contact under this business,
 * or create a new one if none exists.
 */
export async function getOrCreateConversation(
  businessId: string,
  contactWaId: string
): Promise<Conversation> {
  try {
    // Look for an existing active conversation first
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .eq('contact_wa_id', contactWaId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;
    if (existing) return existing as Conversation;

    // No active conversation — create one
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        business_id: businessId,
        contact_wa_id: contactWaId,
        status: 'active',
        agent_context: {},
      })
      .select('*')
      .single();

    if (createError) throw createError;
    return created as Conversation;
  } catch (err) {
    console.error('[queries] getOrCreateConversation failed:', err);
    throw err;
  }
}

export async function getConversationById(
  conversationId: string,
  businessId: string
): Promise<Conversation | null> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('business_id', businessId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Conversation;
  } catch (err) {
    console.error('[queries] getConversationById failed:', err);
    throw err;
  }
}

// ──────────────────────────────────────────────
// Message queries
// ──────────────────────────────────────────────

export async function getRecentMessages(
  conversationId: string,
  businessId: string,
  limit: number = MAX_CONTEXT_MESSAGES
): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Return in chronological order for the LLM context window
    return (data as Message[]).reverse();
  } catch (err) {
    console.error('[queries] getRecentMessages failed:', err);
    throw err;
  }
}

export async function saveMessage(message: MessageInsert): Promise<Message> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select('*')
      .single();

    if (error) throw error;
    return data as Message;
  } catch (err) {
    console.error('[queries] saveMessage failed:', err);
    throw err;
  }
}

// ──────────────────────────────────────────────
// Conversation status/context updates
// ──────────────────────────────────────────────

export async function updateConversationStatus(
  conversationId: string,
  businessId: string,
  status: string,
  reason?: string
): Promise<void> {
  try {
    const update: Record<string, unknown> = {
      status,
      last_message_at: new Date().toISOString(),
    };

    if (reason) {
      update.escalation_reason = reason;
    }

    const { error } = await supabase
      .from('conversations')
      .update(update)
      .eq('id', conversationId)
      .eq('business_id', businessId);

    if (error) throw error;
  } catch (err) {
    console.error('[queries] updateConversationStatus failed:', err);
    throw err;
  }
}

export async function updateConversationContext(
  conversationId: string,
  businessId: string,
  context: AgentContext
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({
        agent_context: context,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('business_id', businessId);

    if (error) throw error;
  } catch (err) {
    console.error('[queries] updateConversationContext failed:', err);
    throw err;
  }
}

// ──────────────────────────────────────────────
// Agent action logging
// ──────────────────────────────────────────────

export async function logAgentAction(
  action: AgentActionInsert
): Promise<AgentAction> {
  try {
    const { data, error } = await supabase
      .from('agent_actions')
      .insert(action)
      .select('*')
      .single();

    if (error) throw error;
    return data as AgentAction;
  } catch (err) {
    console.error('[queries] logAgentAction failed:', err);
    throw err;
  }
}

export async function updateAgentActionStatus(
  actionId: string,
  businessId: string,
  status: string
): Promise<void> {
  try {
    const update: Record<string, unknown> = { status };

    // Mark execution timestamp when action completes or fails
    if (status === 'completed' || status === 'failed') {
      update.executed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('agent_actions')
      .update(update)
      .eq('id', actionId)
      .eq('business_id', businessId);

    if (error) throw error;
  } catch (err) {
    console.error('[queries] updateAgentActionStatus failed:', err);
    throw err;
  }
}
