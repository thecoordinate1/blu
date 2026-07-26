import { createClient } from '@supabase/supabase-js';

// ── Credential cache ─────────────────────────────────────────────────────────
interface CachedCreds {
  phoneNumberId: string;
  accessToken: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const credentialCache = new Map<string, CachedCreds>();

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Fetches Cloud API credentials for a business, with caching.
 */
async function getCredentials(businessId: string): Promise<CachedCreds | null> {
  const cached = credentialCache.get(businessId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  const { data, error } = await supabaseAdmin
    .from('whatsapp_sessions')
    .select('wa_phone_number_id, wa_access_token')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error || !data?.wa_phone_number_id || !data?.wa_access_token) {
    console.warn(`[WhatsAppSender] No Cloud API credentials found for business ${businessId}`);
    return null;
  }

  const creds: CachedCreds = {
    phoneNumberId: data.wa_phone_number_id,
    accessToken: data.wa_access_token,
    fetchedAt: Date.now(),
  };
  credentialCache.set(businessId, creds);
  return creds;
}

export class WhatsAppSender {
  /**
   * Sends a text message via the WhatsApp Cloud API.
   * Credentials are loaded per-business from the whatsapp_sessions table.
   */
  async send(to: string, message: string, businessId?: string) {
    // If no businessId, try legacy env-based approach
    if (!businessId) {
      const legacyToken = process.env.WHATSAPP_API_TOKEN;
      const legacyFrom = process.env.WHATSAPP_FROM_NUMBER;
      if (legacyToken && legacyFrom) {
        return this.sendViaGraphApi(legacyFrom, legacyToken, to, message);
      }
      console.warn('[WhatsAppSender] No businessId and no legacy env vars. Cannot send.');
      return null;
    }

    const creds = await getCredentials(businessId);
    if (!creds) {
      console.warn('[WhatsAppSender] Cannot send — no Cloud API credentials configured.');
      return null;
    }

    return this.sendViaGraphApi(creds.phoneNumberId, creds.accessToken, to, message);
  }

  private async sendViaGraphApi(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: string
  ) {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[WhatsAppSender] Failed to send WhatsApp message:', errorData);
      throw new Error(`WhatsApp Cloud API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

export const whatsappSender = new WhatsAppSender();
