import pkg from 'whatsapp-web.js';
const { Client, RemoteAuth } = pkg;
import { SupabaseAuthStore } from './supabaseStore.js';
import { supabase } from '../supabase/client.js';
import { getOrCreateConversation, saveMessage } from '../supabase/queries.js';
import { messageQueue } from '../queue/config.js';
import { dispatchWebhookEvent } from './webhookDispatcher.js';
import { handleIncomingMedia } from './mediaHandler.js';
import * as path from 'path';
import * as fs from 'fs';

// Active client instances keyed by businessId
const clients = new Map<string, any>();

// Lock set — prevents concurrent createSession calls for the same business
const initializing = new Set<string>();

// Max QR codes to generate before giving up (WhatsApp marks unused QRs as invalid)
const MAX_QR_ATTEMPTS = 5;

const supabaseStore = new SupabaseAuthStore();

/**
 * Initializes and starts a new WhatsApp client session for a business/tenant
 */
export async function createSession(businessId: string): Promise<any> {
  // Guard 1: already running
  if (clients.has(businessId)) {
    console.log(`[SessionManager] Session already exists for business ${businessId}`);
    return clients.get(businessId);
  }

  // Guard 2: concurrent init lock — only one Chrome spawn per business at a time
  if (initializing.has(businessId)) {
    console.log(`[SessionManager] Session already initializing for business ${businessId}, ignoring duplicate request`);
    return null;
  }

  initializing.add(businessId);
  console.log(`[SessionManager] Initializing session for business ${businessId}`);

  // Ensure directories exist
  const sessionDir = path.resolve(`.wwebjs_auth/session-wa_${businessId}`);
  await fs.promises.mkdir(sessionDir, { recursive: true });

  const client = new Client({
    authStrategy: new RemoteAuth({
      clientId: `wa_${businessId}`,
      store: supabaseStore,
      backupSyncIntervalMs: 120000 // Sync backup every 2 minutes
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  clients.set(businessId, client);

  // Track how many QR codes have been shown without being scanned
  let qrAttempts = 0;

  // 1. QR Code Event
  client.on('qr', async (qr) => {
    qrAttempts++;
    console.log(`[SessionManager] QR Code attempt ${qrAttempts}/${MAX_QR_ATTEMPTS} for business ${businessId}`);

    // Stop generating after too many unscanned QRs — destroy the session
    if (qrAttempts > MAX_QR_ATTEMPTS) {
      console.warn(`[SessionManager] Max QR attempts reached for ${businessId}. Aborting session.`);
      try {
        await supabase
          .from('whatsapp_sessions')
          .upsert({
            business_id: businessId,
            status: 'disconnected',
            qr_code: null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'business_id' });
      } catch (_) { /* best-effort */ }
      client.destroy().catch(() => {});
      clients.delete(businessId);
      initializing.delete(businessId);
      return;
    }

    try {
      await supabase
        .from('whatsapp_sessions')
        .upsert({
          business_id: businessId,
          status: 'qr_pending',
          qr_code: qr,
          updated_at: new Date().toISOString()
        }, { onConflict: 'business_id' });
    } catch (err: any) {
      console.error(`[SessionManager] Failed to save QR code for ${businessId}:`, err.message);
    }
  });

  // 2. Ready Event — session authenticated, release the init lock
  client.on('ready', async () => {
    const phoneNumber = client.info?.wid?.user || 'unknown';
    console.log(`[SessionManager] Client is ready for business ${businessId} (${phoneNumber})`);
    initializing.delete(businessId); // unlock — session is live

    try {
      await supabase
        .from('whatsapp_sessions')
        .upsert({
          business_id: businessId,
          status: 'connected',
          qr_code: null,
          phone_number: phoneNumber,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'business_id' });
    } catch (err: any) {
      console.error(`[SessionManager] Failed to update ready status for ${businessId}:`, err.message);
    }
  });

  // 3. Auth Failure Event — release lock so user can retry
  client.on('auth_failure', async (msg) => {
    console.error(`[SessionManager] Auth failure for business ${businessId}:`, msg);
    initializing.delete(businessId);
    clients.delete(businessId);
    try {
      await supabase
        .from('whatsapp_sessions')
        .upsert({
          business_id: businessId,
          status: 'disconnected',
          qr_code: null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'business_id' });
    } catch (err: any) {
      console.error(`[SessionManager] Failed to update auth_failure status for ${businessId}:`, err.message);
    }
  });

  // 4. Disconnected Event — release all locks
  client.on('disconnected', async (reason) => {
    console.log(`[SessionManager] Client disconnected for business ${businessId}:`, reason);
    initializing.delete(businessId);
    clients.delete(businessId);
    try {
      await supabase
        .from('whatsapp_sessions')
        .upsert({
          business_id: businessId,
          status: 'disconnected',
          qr_code: null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'business_id' });
    } catch (err: any) {
      console.error(`[SessionManager] Failed to update disconnected status for ${businessId}:`, err.message);
    }
  });

  // 5. Incoming Message Event
  client.on('message', async (message: any) => {
    try {
      // Ignore group chats and self-messages
      if (message.fromMe || message.from.endsWith('@g.us')) {
        return;
      }

      const from = message.from.split('@')[0];
      const body = message.body || '';
      console.log(`[SessionManager] Inbound message received from ${from} for business ${businessId}: "${body.substring(0, 30)}"`);

      // 1. Get or create conversation record
      const conversation = await getOrCreateConversation(businessId, from);

      // 1.5 Handle media if present
      let mediaUrl: string | null = null;
      if (message.hasMedia) {
        mediaUrl = await handleIncomingMedia(businessId, message);
      }

      // 2. Save message in Supabase
      const dbMessage = await saveMessage({
        conversation_id: conversation.id,
        business_id: businessId,
        direction: 'inbound',
        role: 'user',
        body: body || `[Media: ${message.type}]`,
        media_url: mediaUrl,
        wa_message_id: message.id.id,
      });

      // 3. Push to BullMQ queue for Genkit Agent State Machine processing
      const jobData = {
        conversationId: conversation.id,
        businessId,
        messageId: dbMessage.id,
        contactWaId: from,
        messageBody: body,
        timestamp: message.timestamp,
      };

      await messageQueue.add('process-message', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      // 4. Dispatch events to tenant webhook endpoints asynchronously
      dispatchWebhookEvent(businessId, {
        event: 'message',
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        sessionId: `wa_${businessId}`,
        businessId,
        data: {
          from,
          body,
          messageId: message.id.id,
          type: message.type
        }
      }).catch(err => {
        console.error(`[SessionManager] Webhook dispatch failed for business ${businessId}:`, err.message);
      });

    } catch (err: any) {
      console.error(`[SessionManager] Message processing error:`, err.message);
    }
  });

  // Initialize client — release the lock on fatal init error
  client.initialize().catch((err: any) => {
    console.error(`[SessionManager] Initialization failed for ${businessId}:`, err.message);
    initializing.delete(businessId);
    clients.delete(businessId);
  });

  return client;
}

/**
 * Retrieves the active WhatsApp client instance for a business
 */
export function getSession(businessId: string): any | null {
  return clients.get(businessId) || null;
}

/** Returns true if a session is currently being initialized (Chrome launching) */
export function isSessionInitializing(businessId: string): boolean {
  return initializing.has(businessId);
}

/**
 * Disconnects and deletes a WhatsApp session cleanly
 */
export async function deleteSession(businessId: string): Promise<boolean> {
  const client = clients.get(businessId);
  if (!client) {
    console.log(`[SessionManager] No active session found to delete for business ${businessId}`);
    return false;
  }

  console.log(`[SessionManager] Terminating session for business ${businessId}`);
  try {
    // 1. Destroy local client session
    await client.destroy();
    clients.delete(businessId);

    // 2. Delete remote zip from Supabase storage
    await supabaseStore.delete({ session: `wa_${businessId}` }).catch(() => {});

    // 3. Clear auth directory on filesystem
    const sessionDir = path.resolve(`.wwebjs_auth/session-wa_${businessId}`);
    if (fs.existsSync(sessionDir)) {
      await fs.promises.rm(sessionDir, { recursive: true, force: true }).catch(() => {});
    }

    // 4. Update session status in Supabase
    await supabase
      .from('whatsapp_sessions')
      .update({
        status: 'disconnected',
        qr_code: null,
        phone_number: null,
        updated_at: new Date().toISOString()
      })
      .eq('business_id', businessId);

    return true;
  } catch (err: any) {
    console.error(`[SessionManager] Delete session failed for ${businessId}:`, err.message);
    return false;
  }
}

/**
 * Restores all previously connected active sessions on system boot
 */
export async function restoreSessions(): Promise<void> {
  console.log('[SessionManager] Restoring active WhatsApp sessions...');
  try {
    const { data: activeSessions, error } = await supabase
      .from('whatsapp_sessions')
      .select('business_id')
      .eq('status', 'connected');

    if (error) {
      console.error('[SessionManager] Failed to fetch active sessions for restore:', error.message);
      return;
    }

    if (!activeSessions || activeSessions.length === 0) {
      console.log('[SessionManager] No active sessions found to restore.');
      return;
    }

    console.log(`[SessionManager] Found ${activeSessions.length} active sessions to restore.`);
    for (const session of activeSessions) {
      createSession(session.business_id).catch((err: any) => {
        console.error(`[SessionManager] Failed to restore session for ${session.business_id}:`, err.message);
      });
    }
  } catch (err: any) {
    console.error('[SessionManager] Unexpected error during session restore:', err.message);
  }
}
