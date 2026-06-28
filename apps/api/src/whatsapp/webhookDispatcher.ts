import { supabase } from '../supabase/client.js';
import { createHmac } from 'crypto';

/**
 * Dispatches webhook events to all registered and active webhook URLs for a tenant/business.
 * If a secret is registered, it signs the JSON payload with HMAC-SHA256.
 */
export async function dispatchWebhookEvent(
  businessId: string,
  payload: {
    event: string;
    timestamp: string;
    sessionId: string;
    businessId: string;
    data: Record<string, any>;
  }
): Promise<void> {
  try {
    const { data: webhooks, error } = await supabase
      .from('whatsapp_webhooks')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (error) {
      console.error(`[WebhookDispatcher] Error fetching webhooks for ${businessId}:`, error.message);
      return;
    }

    if (!webhooks || webhooks.length === 0) {
      // No webhooks registered for this tenant
      return;
    }

    const jsonPayload = JSON.stringify(payload);

    console.log(`[WebhookDispatcher] Dispatching "${payload.event}" event to ${webhooks.length} webhooks for business ${businessId}`);

    for (const webhook of webhooks) {
      // Check if event is supported by this webhook configuration
      const isSubscribed = Array.isArray(webhook.events) 
        ? webhook.events.includes(payload.event) 
        : true; // Default to true if not specified

      if (!isSubscribed) {
        continue;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Blubot-Webhook-Dispatcher/1.0'
      };

      // Add HMAC-SHA256 signature if webhook secret is configured
      if (webhook.secret) {
        const signature = createHmac('sha256', webhook.secret)
          .update(jsonPayload)
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      // Execute non-blocking POST fetch
      fetch(webhook.url, {
        method: 'POST',
        headers,
        body: jsonPayload,
        // Set a reasonable timeout so we don't hang connections
        signal: AbortSignal.timeout(10000)
      })
      .then(async (res) => {
        if (!res.ok) {
          console.warn(`[WebhookDispatcher] Webhook returned status ${res.status} for URL ${webhook.url}`);
        }
      })
      .catch((err) => {
        console.error(`[WebhookDispatcher] Delivery failed for URL ${webhook.url}:`, err.message);
      });
    }
  } catch (err: any) {
    console.error(`[WebhookDispatcher] Unexpected dispatch error:`, err.message);
  }
}
