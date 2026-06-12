import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAgentResponse } from './client.js';
import { env } from '../lib/env.js';
import { AgentIntent } from '../lib/types.js';

// Mock env
vi.mock('../lib/env.js', () => ({
  env: {
    GEMINI_MOCK: true,
    GEMINI_API_KEY: 'test-api-key',
  },
}));

describe('Gemini client wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBusiness = {
    id: 'biz-123',
    name: 'Acme Corp',
    ops_number: '+260971234567',
    primary_number: '+260979876543',
    gemini_context: {},
    subscription_tier: 'starter',
    api_key: 'test-api-key',
    created_at: new Date().toISOString(),
  };

  const mockConversation = {
    id: 'conv-456',
    business_id: 'biz-123',
    contact_wa_id: '+260979876543',
    status: 'active',
    last_message_at: new Date().toISOString(),
    escalation_reason: null,
    agent_context: { unresolved_turns: 0 },
    created_at: new Date().toISOString(),
  };

  const mockMessages = [
    {
      id: 'msg-789',
      conversation_id: 'conv-456',
      business_id: 'biz-123',
      direction: 'inbound' as const,
      role: 'user' as const,
      body: 'Hello',
      media_url: null,
      wa_message_id: 'wa-1',
      created_at: new Date().toISOString(),
    },
  ];

  it('should return mock response immediately if GEMINI_MOCK is true', async () => {
    env.GEMINI_MOCK = true;
    const response = await generateAgentResponse(mockBusiness, mockConversation, mockMessages);

    expect(response.intent).toBe(AgentIntent.CHITCHAT);
    expect(response.confidence).toBe(0.95);
    expect(response.reply).toContain('mock mode');
  });
});
