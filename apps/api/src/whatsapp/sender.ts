import { env } from '../lib/env.js';
import { saveMessage, logAgentAction } from '../supabase/queries.js';
import type { Business } from '../lib/types.js';

/**
 * Sends a WhatsApp message via the WhatsApp API provider (waapi.app / Meta WABA).
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

    // Call waapi.app API if credentials are configured
    if (!env.GEMINI_MOCK && env.WAAPI_TOKEN && env.WAAPI_INSTANCE_ID) {
      try {
        const url = `https://waapi.app/api/v1/instances/${env.WAAPI_INSTANCE_ID}/client/action/send-message`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.WAAPI_TOKEN}`,
          },
          body: JSON.stringify({
            chatId: `${to.replace('+', '')}@c.us`,
            message: body,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[whatsapp] waapi.app returned error code ${res.status}:`, errText);
          success = false;
        } else {
          console.log('[whatsapp] Successfully sent message via waapi.app');
        }
      } catch (err) {
        console.error('[whatsapp] waapi.app API fetch failed:', err);
        success = false;
      }
    } else {
      console.log('[whatsapp] API call skipped (GEMINI_MOCK or missing waapi credentials)');
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
