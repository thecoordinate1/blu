import { Hono } from 'hono';
import { createSession, getSession, deleteSession, isSessionInitializing } from './sessionManager.js';
import { sendWhatsAppMessage } from './sender.js';
import { createOutgoingMedia } from './mediaHandler.js';
import { supabase } from '../supabase/client.js';
import { saveMessage, logAgentAction } from '../supabase/queries.js';

export const whatsappRoutes = new Hono();

// ─── Per-businessId rate limiter ─────────────────────────────────────────────
// Allows at most MAX_REQUESTS attempts within WINDOW_MS per business.
const RATE_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS   = 3;      // max 3 session-start attempts per minute

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(businessId: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(businessId);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    // Start a fresh window
    rateLimitMap.set(businessId, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((RATE_WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count++;
  return { allowed: true, retryAfterSec: 0 };
}

// Helper to format clean JID
function formatJid(phone: string): string {
  const clean = phone.replace('+', '').trim();
  return clean.includes('@') ? clean : `${clean}@c.us`;
}

// 1. Initialize session for tenant
whatsappRoutes.post('/sessions', async (c) => {
  try {
    const { businessId } = await c.req.json();
    if (!businessId) {
      return c.json({ success: false, error: 'businessId is required' }, 400);
    }

    // ── Rate limit check ───────────────────────────────────────────────────
    const { allowed, retryAfterSec } = checkRateLimit(businessId);
    if (!allowed) {
      return c.json(
        { success: false, error: `Too many requests. Please wait ${retryAfterSec}s before trying again.` },
        429
      );
    }

    // ── In-memory lock check (Chrome already launching) ────────────────────
    if (isSessionInitializing(businessId)) {
      return c.json(
        { success: false, error: 'Session is already being initialized. Please wait for the QR code.' },
        409
      );
    }

    // ── DB state check (already connected or qr pending) ──────────────────
    const { data: existing } = await supabase
      .from('whatsapp_sessions')
      .select('status')
      .eq('business_id', businessId)
      .maybeSingle();

    if (existing?.status === 'connected') {
      return c.json(
        { success: false, error: 'WhatsApp is already connected for this business.' },
        409
      );
    }

    if (existing?.status === 'qr_pending') {
      return c.json(
        { success: false, error: 'A QR code is already pending. Please scan it before requesting a new one.' },
        409
      );
    }

    // ── All clear — launch session asynchronously ──────────────────────────
    createSession(businessId).catch((err) => {
      console.error(`[Routes] Async createSession failed for ${businessId}:`, err.message);
    });

    return c.json({ success: true, message: 'Session initialization started' });

  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. Get session status and QR code
whatsappRoutes.get('/sessions/:businessId/status', async (c) => {
  try {
    const businessId = c.req.param('businessId');
    if (!businessId) {
      return c.json({ success: false, error: 'businessId is required' }, 400);
    }

    const { data: session, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    if (!session) {
      return c.json({
        success: true,
        status: 'disconnected',
        qrCode: null,
        phoneNumber: null
      });
    }

    return c.json({
      success: true,
      status: session.status || 'disconnected',
      qrCode: session.qr_code,
      phoneNumber: session.phone_number
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. Logout/Delete session
whatsappRoutes.delete('/sessions/:businessId', async (c) => {
  try {
    const businessId = c.req.param('businessId');
    if (!businessId) {
      return c.json({ success: false, error: 'businessId is required' }, 400);
    }

    const success = await deleteSession(businessId);
    if (!success) {
      return c.json({ success: false, error: 'Failed to terminate session or session not active' }, 400);
    }

    return c.json({
      success: true,
      message: 'Session logged out and terminated successfully'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. Send text message
whatsappRoutes.post('/send/message', async (c) => {
  try {
    const { businessId, to, body, conversationId } = await c.req.json();
    if (!businessId || !to || !body) {
      return c.json({ success: false, error: 'businessId, to, and body are required' }, 400);
    }

    const success = await sendWhatsAppMessage(to, body, businessId, conversationId);
    if (!success) {
      return c.json({ success: false, error: 'Failed to send message. Is session connected?' }, 500);
    }

    return c.json({ success: true, message: 'Message sent successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 5. Send media (image, video, document, audio)
whatsappRoutes.post('/send/media', async (c) => {
  try {
    const { businessId, to, mediaUrl, mediaBase64, mimetype, filename, caption, conversationId } = await c.req.json();
    if (!businessId || !to || (!mediaUrl && (!mediaBase64 || !mimetype))) {
      return c.json({ success: false, error: 'businessId, to, and either mediaUrl or base64+mimetype are required' }, 400);
    }

    const client = getSession(businessId);
    if (!client) {
      return c.json({ success: false, error: 'WhatsApp session not active for this business' }, 400);
    }

    // Convert source to MessageMedia object
    const media = await createOutgoingMedia({
      url: mediaUrl,
      base64: mediaBase64,
      mimetype,
      filename
    });

    const formattedTo = formatJid(to);
    const sentMessage = await client.sendMessage(formattedTo, media, { caption });

    // Store the outbound message in database if conversationId is provided
    if (conversationId) {
      await saveMessage({
        conversation_id: conversationId,
        business_id: businessId,
        direction: 'outbound',
        role: 'assistant',
        body: caption || `[Media: ${media.mimetype}]`,
        media_url: mediaUrl || null,
        wa_message_id: sentMessage.id.id
      });

      await logAgentAction({
        conversation_id: conversationId,
        business_id: businessId,
        action_type: 'send_media',
        payload: { to, media_url: mediaUrl, has_caption: !!caption },
        status: 'success'
      });
    }

    return c.json({
      success: true,
      message: 'Media message sent successfully',
      messageId: sentMessage.id.id
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 6. Register a webhook URL
whatsappRoutes.post('/webhooks', async (c) => {
  try {
    const { businessId, url, secret, events } = await c.req.json();
    if (!businessId || !url) {
      return c.json({ success: false, error: 'businessId and url are required' }, 400);
    }

    const { data, error } = await supabase
      .from('whatsapp_webhooks')
      .upsert({
        business_id: businessId,
        url,
        secret: secret || null,
        events: events || ['message', 'status'],
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'business_id,url' })
      .select('*')
      .single();

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Webhook registered successfully',
      webhook: data
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 7. Get registered webhooks for a business
whatsappRoutes.get('/webhooks/:businessId', async (c) => {
  try {
    const businessId = c.req.param('businessId');
    if (!businessId) {
      return c.json({ success: false, error: 'businessId is required' }, 400);
    }

    const { data, error } = await supabase
      .from('whatsapp_webhooks')
      .select('*')
      .eq('business_id', businessId);

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true, webhooks: data });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 8. Delete a registered webhook
whatsappRoutes.delete('/webhooks/:webhookId', async (c) => {
  try {
    const webhookId = c.req.param('webhookId');
    if (!webhookId) {
      return c.json({ success: false, error: 'webhookId is required' }, 400);
    }

    const { error } = await supabase
      .from('whatsapp_webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
