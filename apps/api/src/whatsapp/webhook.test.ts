import { describe, it, expect, vi, beforeEach } from 'vitest';
import { whatsappWebhook } from './webhook.js';
import * as queries from '../supabase/queries.js';
import { messageQueue } from '../queue/config.js';

// Mock env
vi.mock('../lib/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    GEMINI_API_KEY: 'test-gemini-key',
    PORT: 3001,
  },
}));

// Mock queries
vi.mock('../supabase/queries.js', () => ({
  getOrCreateConversation: vi.fn(),
  saveMessage: vi.fn(),
}));

// Mock message queue
vi.mock('../queue/config.js', () => ({
  messageQueue: {
    add: vi.fn(),
  },
  MESSAGE_QUEUE_NAME: 'whatsapp-message-processing',
}));

describe('WhatsApp Webhook Test Simulator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /webhook/whatsapp', () => {
    it('should queue a simulated message with valid payload', async () => {
      vi.mocked(queries.getOrCreateConversation).mockResolvedValue({
        id: 'test-convo-id',
        business_id: 'test-business-id',
        contact_wa_id: '260971234567',
        status: 'active',
        last_message_at: new Date().toISOString(),
        escalation_reason: null,
        agent_context: {},
        created_at: new Date().toISOString(),
      });

      vi.mocked(queries.saveMessage).mockResolvedValue({
        id: 'test-msg-id',
        conversation_id: 'test-convo-id',
        business_id: 'test-business-id',
        direction: 'inbound',
        role: 'user',
        body: 'Hello test message',
        media_url: null,
        wa_message_id: 'test_message_id',
        created_at: new Date().toISOString(),
      });

      const res = await whatsappWebhook.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: '260971234567',
          body: 'Hello test message',
          businessId: 'test-business-id',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.messageId).toBe('test-msg-id');

      expect(queries.getOrCreateConversation).toHaveBeenCalledWith('test-business-id', '260971234567');
      expect(queries.saveMessage).toHaveBeenCalled();
      expect(messageQueue.add).toHaveBeenCalledWith('process-message', expect.objectContaining({
        conversationId: 'test-convo-id',
        businessId: 'test-business-id',
        messageId: 'test-msg-id',
        contactWaId: '260971234567',
        messageBody: 'Hello test message',
      }), expect.any(Object));
    });

    it('should fail with 400 when from is missing', async () => {
      const res = await whatsappWebhook.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: 'Hello test message',
          businessId: 'test-business-id',
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Missing required fields');
    });

    it('should fail with 400 when body is missing', async () => {
      const res = await whatsappWebhook.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: '260971234567',
          businessId: 'test-business-id',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should fail with 400 when businessId is missing', async () => {
      const res = await whatsappWebhook.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: '260971234567',
          body: 'Hello',
        }),
      });

      expect(res.status).toBe(400);
    });
  });
});
