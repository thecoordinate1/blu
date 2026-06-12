import { Hono } from 'hono';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../lib/env.js';
import { getBusinessByOpsNumber, getOrCreateConversation, saveMessage } from '../supabase/queries.js';
import { messageQueue } from '../queue/config.js';
import type { QueueJobData } from '../lib/types.js';

export const whatsappWebhook = new Hono();

// GET /webhook/whatsapp
// Handles Meta's webhook verification challenge (hub.mode, hub.challenge, hub.verify_token)
whatsappWebhook.get('/', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_SECRET) {
      console.log('[whatsapp] Webhook verified successfully!');
      return c.text(challenge || '');
    }
    console.error('[whatsapp] Webhook verification failed: token mismatch');
    return c.text('Forbidden', 403);
  }
  return c.text('Bad Request', 400);
});

// POST /webhook/whatsapp
// Handles incoming webhook notifications
whatsappWebhook.post('/', async (c) => {
  try {
    const rawBody = await c.req.text();
    const signature = c.req.header('X-Hub-Signature-256');

    // 1. HMAC Signature Verification (skip in dev if secret not configured, but enforce in production)
    if (env.NODE_ENV === 'production' || signature) {
      if (!signature) {
        console.error('[whatsapp] Webhook rejected: missing X-Hub-Signature-256 header');
        return c.text('Unauthorized', 401);
      }

      const hashParts = signature.split('=');
      const actualHash = hashParts[1] || signature;
      const expectedHash = createHmac('sha256', env.WHATSAPP_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const actualBuffer = Buffer.from(actualHash, 'hex');
      const expectedBuffer = Buffer.from(expectedHash, 'hex');

      if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
        console.error('[whatsapp] Webhook rejected: signature mismatch');
        return c.text('Unauthorized', 401);
      }
    }

    const payload = JSON.parse(rawBody);

    // Meta WABA / waapi.app structure check
    // We expect: entry[0].changes[0].value.messages[0]
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const msg = value?.messages?.[0];

    if (!msg) {
      // Could be status update, read receipt, etc. Ignore for conversation state machine, return 200.
      return c.text('OK');
    }

    const from = msg.from; // Customer's WhatsApp ID (e.g. +260971112222)
    const body = msg.text?.body || '';
    const type = msg.type;
    const timestamp = parseInt(msg.timestamp, 10) || Math.floor(Date.now() / 1000);
    const waMessageId = msg.id;

    // The destination phone number is in metadata (our ops number)
    const opsNumber = value.metadata?.display_phone_number || '';

    // 4. Identify business by ops_number
    const business = await getBusinessByOpsNumber(opsNumber);
    if (!business) {
      console.error(`[whatsapp] Business not found for ops_number: ${opsNumber}`);
      return c.text('OK'); // Return 200 so WhatsApp doesn't retry
    }

    // 5. Find or create conversation record
    const conversation = await getOrCreateConversation(business.id, from);

    // 6. Store inbound message in messages table
    const dbMessage = await saveMessage({
      conversation_id: conversation.id,
      business_id: business.id,
      direction: 'inbound',
      role: 'user',
      body: body || `[Media: ${type}]`,
      media_url: null, // Attachment handling stub
      wa_message_id: waMessageId,
    });

    // 7. Push job to BullMQ
    const jobData: QueueJobData = {
      conversationId: conversation.id,
      businessId: business.id,
      messageId: dbMessage.id,
      contactWaId: from,
      messageBody: body,
      timestamp,
    };

    await messageQueue.add('process-message', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    // 8. Return 200 immediately
    return c.text('OK');
  } catch (err) {
    console.error('[whatsapp] Webhook processing failed:', err);
    return c.text('Internal Server Error', 500);
  }
});
