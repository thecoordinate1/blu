import { Hono } from 'hono';
import { getOrCreateConversation, saveMessage } from '../supabase/queries.js';
import { messageQueue } from '../queue/config.js';

export const whatsappWebhook = new Hono();

/**
 * A testing endpoint to simulate incoming WhatsApp messages.
 * Handy for local testing via Curl/Postman without requiring an active WhatsApp connection.
 */
whatsappWebhook.post('/', async (c) => {
  try {
    const { from, body, businessId } = await c.req.json();
    if (!from || !body || !businessId) {
      return c.json({ error: 'Missing required fields: from, body, businessId' }, 400);
    }

    console.log(`[Webhook-Test] Received simulated message from ${from} for business ${businessId}`);

    // 1. Get or create conversation record
    const conversation = await getOrCreateConversation(businessId, from);

    // 2. Store inbound message in messages table
    const dbMessage = await saveMessage({
      conversation_id: conversation.id,
      business_id: businessId,
      direction: 'inbound',
      role: 'user',
      body,
      media_url: null,
      wa_message_id: `test_${Math.random().toString(36).substring(2, 11)}`,
    });

    // 3. Push job to BullMQ
    const jobData = {
      conversationId: conversation.id,
      businessId,
      messageId: dbMessage.id,
      contactWaId: from,
      messageBody: body,
      timestamp: Math.floor(Date.now() / 1000),
    };

    await messageQueue.add('process-message', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    return c.json({
      success: true,
      message: 'Simulated message queued successfully',
      messageId: dbMessage.id
    });
  } catch (err: any) {
    console.error('[Webhook-Test] Simulation failed:', err);
    return c.json({ error: err.message }, 500);
  }
});
