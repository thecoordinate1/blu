import { Hono } from 'hono';
import { configureSession, verifySession, getSessionConfig, deleteSession, getConnectionEvents, clearConnectionEvents } from './sessionManager.js';
import { sendWhatsAppMessage, sendWhatsAppMedia } from './sender.js';
import { supabase } from '../supabase/client.js';

export const whatsappRoutes = new Hono();

// 1. Configure Cloud API session for tenant
whatsappRoutes.post('/sessions', async (c) => {
  try {
    const { businessId, phoneNumberId, accessToken, wabaId } = await c.req.json();
    if (!businessId || !phoneNumberId || !accessToken) {
      return c.json({ success: false, error: 'businessId, phoneNumberId, and accessToken are required' }, 400);
    }

    await configureSession(businessId, phoneNumberId, accessToken, wabaId);

    return c.json({ success: true, message: 'Cloud API session configured successfully' });

  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. Get session status
whatsappRoutes.get('/sessions/:businessId/status', async (c) => {
  try {
    const businessId = c.req.param('businessId');
    if (!businessId) {
      return c.json({ success: false, error: 'businessId is required' }, 400);
    }

    const config = await getSessionConfig(businessId);

    if (!config) {
      return c.json({
        success: true,
        status: 'disconnected',
        provider: 'cloud_api'
      });
    }

    return c.json({
      success: true,
      status: config.status || 'disconnected',
      provider: config.provider || 'cloud_api',
      phoneNumberId: config.wa_phone_number_id,
      wabaId: config.wa_business_account_id
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. Verify session
whatsappRoutes.post('/sessions/:businessId/verify', async (c) => {
  try {
    const businessId = c.req.param('businessId');
    if (!businessId) {
      return c.json({ success: false, error: 'businessId is required' }, 400);
    }

    const isValid = await verifySession(businessId);
    return c.json({ success: isValid, message: isValid ? 'Credentials are valid' : 'Invalid credentials' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. Logout/Delete session
whatsappRoutes.delete('/sessions/:businessId', async (c) => {
  try {
    const businessId = c.req.param('businessId');
    if (!businessId) {
      return c.json({ success: false, error: 'businessId is required' }, 400);
    }

    const success = await deleteSession(businessId);
    if (!success) {
      return c.json({ success: false, error: 'Failed to terminate session' }, 400);
    }

    return c.json({
      success: true,
      message: 'Session cleared successfully'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 5. Send text message
whatsappRoutes.post('/send/message', async (c) => {
  try {
    const { businessId, to, body, conversationId } = await c.req.json();
    if (!businessId || !to || !body) {
      return c.json({ success: false, error: 'businessId, to, and body are required' }, 400);
    }

    const success = await sendWhatsAppMessage(to, body, businessId, conversationId);
    if (!success) {
      return c.json({ success: false, error: 'Failed to send message' }, 500);
    }

    return c.json({ success: true, message: 'Message sent successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 6. Send media (image, video, document, audio)
whatsappRoutes.post('/send/media', async (c) => {
  try {
    const { businessId, to, mediaUrl, caption, conversationId } = await c.req.json();
    if (!businessId || !to || !mediaUrl) {
      return c.json({ success: false, error: 'businessId, to, and mediaUrl are required' }, 400);
    }

    const success = await sendWhatsAppMedia(to, mediaUrl, caption, businessId, conversationId);
    
    if (!success) {
      return c.json({ success: false, error: 'Failed to send media' }, 500);
    }

    return c.json({
      success: true,
      message: 'Media message sent successfully'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 7. Register a webhook URL
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

// 8. Get registered webhooks for a business
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

// 9. Delete a registered webhook
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

// ─── Debug / Diagnostics ───────────────────────────────────────────────────

// 10. Get connection events timeline for a business (debugging)
whatsappRoutes.get('/sessions/:businessId/events', async (c) => {
  const businessId = c.req.param('businessId');
  if (!businessId) {
    return c.json({ success: false, error: 'businessId is required' }, 400);
  }

  const events = getConnectionEvents(businessId);
  return c.json({
    success: true,
    businessId,
    totalEvents: events.length,
    events,
  });
});

// 11. Clear connection events for a business
whatsappRoutes.delete('/sessions/:businessId/events', async (c) => {
  const businessId = c.req.param('businessId');
  if (!businessId) {
    return c.json({ success: false, error: 'businessId is required' }, 400);
  }

  clearConnectionEvents(businessId);
  return c.json({ success: true, message: 'Connection events cleared' });
});
