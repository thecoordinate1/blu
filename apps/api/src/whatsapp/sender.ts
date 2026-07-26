import { env } from '../lib/env.js';
import { saveMessage, logAgentAction } from '../supabase/queries.js';
import type { Business } from '../lib/types.js';
import { getSessionConfig } from './sessionManager.js';

// Cache credentials to avoid DB lookups on every message
// Format: businessId -> { phoneNumberId, accessToken, expiresAt }
interface CachedCredentials {
  phoneNumberId: string;
  accessToken: string;
  expiresAt: number;
}
const credentialsCache = new Map<string, CachedCredentials>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCredentials(businessId: string): Promise<{ phoneNumberId: string, accessToken: string } | null> {
  const cached = credentialsCache.get(businessId);
  if (cached && cached.expiresAt > Date.now()) {
    return { phoneNumberId: cached.phoneNumberId, accessToken: cached.accessToken };
  }

  const config = await getSessionConfig(businessId);
  if (config && config.wa_phone_number_id && config.wa_access_token) {
    credentialsCache.set(businessId, {
      phoneNumberId: config.wa_phone_number_id,
      accessToken: config.wa_access_token,
      expiresAt: Date.now() + CACHE_TTL_MS
    });
    return { phoneNumberId: config.wa_phone_number_id, accessToken: config.wa_access_token };
  }

  return null;
}

/**
 * Sends a WhatsApp message via the Cloud API.
 * Logs the outbound message in the `messages` table and logs the notify/send action in `agent_actions`.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  businessId: string,
  conversationId?: string
): Promise<boolean> {
  console.log(`[whatsapp] Sending text message to ${to}: "${body.substring(0, 60)}..."`);
  return sendMessageBase(businessId, to, {
    type: 'text',
    text: { body }
  }, body, null, conversationId);
}

/**
 * Sends a WhatsApp media message via the Cloud API.
 */
export async function sendWhatsAppMedia(
  to: string,
  mediaUrl: string,
  caption: string | undefined,
  businessId: string,
  conversationId?: string
): Promise<boolean> {
  console.log(`[whatsapp] Sending media message to ${to}: ${mediaUrl}`);
  
  // Try to determine media type from URL extension
  let type = 'document';
  const urlLower = mediaUrl.toLowerCase();
  if (urlLower.match(/\.(jpeg|jpg|png)$/)) {
    type = 'image';
  } else if (urlLower.match(/\.(mp4|3gp)$/)) {
    type = 'video';
  } else if (urlLower.match(/\.(mp3|ogg|wav)$/)) {
    type = 'audio';
  }

  const payload: any = {
    type
  };
  payload[type] = {
    link: mediaUrl,
    ...(caption && type !== 'audio' ? { caption } : {})
  };

  return sendMessageBase(businessId, to, payload, caption || `[Media: ${type}]`, mediaUrl, conversationId);
}

/**
 * Base function to send payload to Cloud API and log to DB
 */
async function sendMessageBase(
  businessId: string,
  to: string,
  messagePayload: any,
  logBody: string,
  logMediaUrl: string | null,
  conversationId?: string
): Promise<boolean> {
  try {
    let success = true;
    let messageId = `out_${Math.random().toString(36).substring(2, 11)}`;

    if (!env.GEMINI_MOCK) {
      const creds = await getCredentials(businessId);
      if (!creds) {
        console.error(`[whatsapp] No Cloud API credentials found for business ${businessId}`);
        success = false;
      } else {
        try {
          const cleanTo = to.replace('+', '').trim();
          const url = `https://graph.facebook.com/v19.0/${creds.phoneNumberId}/messages`;
          
          const body = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanTo,
            ...messagePayload
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${creds.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });

          if (!response.ok) {
            const errData = await response.json();
            console.error('[whatsapp] Cloud API sendMessage failed:', JSON.stringify(errData));
            success = false;
          } else {
            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
              messageId = data.messages[0].id;
            }
            console.log('[whatsapp] Successfully sent message via Cloud API');
          }
        } catch (err) {
          console.error('[whatsapp] Cloud API sendMessage exception:', err);
          success = false;
        }
      }
    } else {
      console.log('[whatsapp] API call skipped (GEMINI_MOCK)');
    }

    if (conversationId) {
      await saveMessage({
        conversation_id: conversationId,
        business_id: businessId,
        direction: 'outbound',
        role: 'assistant',
        body: logBody,
        media_url: logMediaUrl,
        wa_message_id: messageId,
      });

      await logAgentAction({
        conversation_id: conversationId,
        business_id: businessId,
        action_type: logMediaUrl ? 'send_media' : 'notify',
        payload: { to, body: logBody, media_url: logMediaUrl, provider_success: success },
        status: success ? 'success' : 'failed',
      });
    }

    return success;
  } catch (err) {
    console.error('[whatsapp] sendMessageBase failed:', err);
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
