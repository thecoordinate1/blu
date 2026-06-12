import { describe, it, expect, vi, beforeEach } from 'vitest';
import { whatsappWebhook } from './webhook.js';
import { env } from '../lib/env.js';
import * as queries from '../supabase/queries.js';
import { messageQueue } from '../queue/config.js';
import { createHmac } from 'crypto';

// Mock env
vi.mock('../lib/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    WHATSAPP_WEBHOOK_SECRET: 'test-webhook-secret',
    GEMINI_API_KEY: 'test-gemini-key',
    PORT: 3001,
  },
}));

// Mock queries
vi.mock('../supabase/queries.js', () => ({
  getBusinessByOpsNumber: vi.fn(),
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

describe('WhatsApp Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /webhook/whatsapp', () => {
    it('should verify webhook subscription with correct token', async () => {
      const res = await whatsappWebhook.request(
        '/?hub.mode=subscribe&hub.verify_token=test-webhook-secret&hub.challenge=12345'
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toBe('12345');
    });

    it('should fail with 403 on incorrect token', async () => {
      const res = await whatsappWebhook.request(
        '/?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=12345'
      );
      expect(res.status).toBe(403);
      expect(await res.text()).toBe('Forbidden');
    });

    it('should fail with 400 on invalid payload', async () => {
      const res = await whatsappWebhook.request('/');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /webhook/whatsapp', () => {
    const validPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  display_phone_number: '+260971234567',
                },
                messages: [
                  {
                    from: '+260979876543',
                    id: 'wamid.HBgLMjYwOTc5ODc2NTQzFQIAERgSQjE4MkYzRTQ3QkE1NUIyN0E5AA==',
                    timestamp: '1718100000',
                    type: 'text',
                    text: {
                      body: 'Hello Blu_bot!',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    it('should reject requests with invalid HMAC signature', async () => {
      const bodyText = JSON.stringify(validPayload);
      const res = await whatsappWebhook.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': 'sha256=invalidhash',
        },
        body: bodyText,
      });

      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    });

    it('should process webhook when HMAC matches and trigger queue', async () => {
      const bodyText = JSON.stringify(validPayload);
      const signature = 'sha256=' + createHmac('sha256', 'test-webhook-secret')
        .update(bodyText)
        .digest('hex');

      const mockBusiness = { id: 'biz-123', name: 'Acme Corp', ops_number: '+260971234567' };
      const mockConversation = { id: 'conv-456', business_id: 'biz-123', contact_wa_id: '+260979876543' };
      const mockMessage = { id: 'msg-789', conversation_id: 'conv-456', body: 'Hello Blu_bot!' };

      vi.mocked(queries.getBusinessByOpsNumber).mockResolvedValue(mockBusiness as any);
      vi.mocked(queries.getOrCreateConversation).mockResolvedValue(mockConversation as any);
      vi.mocked(queries.saveMessage).mockResolvedValue(mockMessage as any);

      const res = await whatsappWebhook.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature,
        },
        body: bodyText,
      });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('OK');

      expect(queries.getBusinessByOpsNumber).toHaveBeenCalledWith('+260971234567');
      expect(queries.getOrCreateConversation).toHaveBeenCalledWith('biz-123', '+260979876543');
      expect(queries.saveMessage).toHaveBeenCalledWith({
        conversation_id: 'conv-456',
        business_id: 'biz-123',
        direction: 'inbound',
        role: 'user',
        body: 'Hello Blu_bot!',
        media_url: null,
        wa_message_id: 'wamid.HBgLMjYwOTc5ODc2NTQzFQIAERgSQjE4MkYzRTQ3QkE1NUIyN0E5AA==',
      });

      expect(messageQueue.add).toHaveBeenCalledWith(
        'process-message',
        {
          conversationId: 'conv-456',
          businessId: 'biz-123',
          messageId: 'msg-789',
          contactWaId: '+260979876543',
          messageBody: 'Hello Blu_bot!',
          timestamp: 1718100000,
        },
        expect.any(Object)
      );
    });
  });
});
