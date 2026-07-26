import { supabase } from '../supabase/client.js';

// ─── Connection Event Log ────────────────────────────────────────────────────
// In-memory ring buffer of lifecycle events per business for debugging
interface ConnectionEvent {
  timestamp: string;
  event: string;
  detail: string;
}

const MAX_EVENTS = 50;
const connectionEvents = new Map<string, ConnectionEvent[]>();

export function pushEvent(businessId: string, event: string, detail: string) {
  const ts = new Date().toISOString();
  const logLine = `[SessionManager][${ts}] ${event}: ${detail}`;
  console.log(logLine);

  if (!connectionEvents.has(businessId)) {
    connectionEvents.set(businessId, []);
  }
  const events = connectionEvents.get(businessId)!;
  events.push({ timestamp: ts, event, detail });
  // Keep only last MAX_EVENTS
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

/** Returns the recent connection events for a business (for debugging) */
export function getConnectionEvents(businessId: string): ConnectionEvent[] {
  return connectionEvents.get(businessId) || [];
}

/** Clears the event log for a business */
export function clearConnectionEvents(businessId: string): void {
  connectionEvents.delete(businessId);
}

/**
 * Configure WhatsApp Cloud API session credentials
 */
export async function configureSession(
  businessId: string,
  phoneNumberId: string,
  accessToken: string,
  wabaId?: string
): Promise<any> {
  pushEvent(businessId, 'CONFIGURE_SESSION', 'Saving Cloud API credentials');
  
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .upsert({
      business_id: businessId,
      provider: 'cloud_api',
      wa_phone_number_id: phoneNumberId,
      wa_access_token: accessToken,
      wa_business_account_id: wabaId,
      status: 'configured',
      updated_at: new Date().toISOString()
    }, { onConflict: 'business_id' })
    .select()
    .single();

  if (error) {
    pushEvent(businessId, 'CONFIGURE_ERROR', `Failed to save credentials: ${error.message}`);
    throw error;
  }

  return data;
}

/**
 * Verify Cloud API credentials by making a test call to the Graph API
 */
export async function verifySession(businessId: string): Promise<boolean> {
  pushEvent(businessId, 'VERIFY_SESSION', 'Testing Cloud API credentials against Graph API');
  
  const config = await getSessionConfig(businessId);
  if (!config || !config.wa_phone_number_id || !config.wa_access_token) {
    pushEvent(businessId, 'VERIFY_ERROR', 'No credentials found');
    return false;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${config.wa_phone_number_id}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.wa_access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errData = await response.json();
      pushEvent(businessId, 'VERIFY_FAILED', `Graph API error: ${JSON.stringify(errData)}`);
      return false;
    }

    pushEvent(businessId, 'VERIFY_SUCCESS', 'Credentials verified successfully');
    return true;
  } catch (err: any) {
    pushEvent(businessId, 'VERIFY_EXCEPTION', `Request failed: ${err.message}`);
    return false;
  }
}

/**
 * Retrieves the stored configuration for a business
 */
export async function getSessionConfig(businessId: string): Promise<any> {
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    console.error(`[SessionManager] getSessionConfig error for ${businessId}:`, error.message);
    return null;
  }
  return data;
}

/**
 * Deletes a session by clearing credentials
 */
export async function deleteSession(businessId: string): Promise<boolean> {
  pushEvent(businessId, 'DELETE_SESSION', 'Clearing Cloud API credentials');
  
  try {
    await supabase
      .from('whatsapp_sessions')
      .update({
        status: 'disconnected',
        wa_phone_number_id: null,
        wa_access_token: null,
        wa_business_account_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('business_id', businessId);

    return true;
  } catch (err: any) {
    pushEvent(businessId, 'DELETE_ERROR', `Failed to delete session: ${err.message}`);
    return false;
  }
}
