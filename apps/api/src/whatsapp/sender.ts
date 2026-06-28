import { env } from '../lib/env.js';
import { saveMessage, logAgentAction } from '../supabase/queries.js';
import type { Business } from '../lib/types.js';
import { getSession } from './sessionManager.js';

/**
 * Sends a WhatsApp message via the local self-hosted whatsapp-web.js gateway.
 * Logs the outbound message in the `messages` table and logs the notify/send action in `agent_actions`.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  businessId: string,
  conversationId?: string
): Promise<boolean> {
  console.log(`[whatsapp] Sending message to ${to}: "${body.substring(0, 60)}..."`);

  try {
    let success = true;

    // Call whatsapp-web.js client if not mocked
    if (!env.GEMINI_MOCK) {
      const client = getSession(businessId);
      if (!client) {
        console.error(`[whatsapp] No active session found for business ${businessId}`);
        success = false;
      } else {
        try {
          const chatId = `${to.replace('+', '').trim()}@c.us`;
          await client.sendMessage(chatId, body);
          console.log('[whatsapp] Successfully sent message via whatsapp-web.js');
        } catch (err) {
          console.error('[whatsapp] whatsapp-web.js sendMessage failed:', err);
          success = false;
        }
      }
    } else {
      console.log('[whatsapp] API call skipped (GEMINI_MOCK)');
    }

    // Always store the outbound message in database if conversationId is provided
    if (conversationId) {
      await saveMessage({
        conversation_id: conversationId,
        business_id: businessId,
        direction: 'outbound',
        role: 'assistant',
        body,
        media_url: null,
        wa_message_id: `out_${Math.random().toString(36).substring(2, 11)}`,
      });

      // Log the agent action
      await logAgentAction({
        conversation_id: conversationId,
        business_id: businessId,
        action_type: 'notify',
        payload: { to, body, provider_success: success },
        status: success ? 'success' : 'failed',
      });
    }

    return success;
  } catch (err) {
    console.error('[whatsapp] sendWhatsAppMessage failed:', err);
    return false;
  }
}

/**
 * Sends notifications to the business owner's primary number.
 */
export async function notifyOwner(business: Business, content: string): Promise<boolean> {
  console.log(`[whatsapp] Notifying owner of business "${business.name}" at ${business.primary_number}`);
  return sendWhatsAppMessage(business.primary_number, content, business.id);
}
