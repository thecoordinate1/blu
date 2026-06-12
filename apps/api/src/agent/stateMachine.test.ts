import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processMessage } from './stateMachine.js';
import * as queries from '../supabase/queries.js';
import * as geminiClient from '../gemini/client.js';
import * as actionRouter from './actionRouter.js';
import * as sender from '../whatsapp/sender.js';
import * as escalation from './escalation.js';
import { AgentIntent } from '../lib/types.js';

vi.mock('../supabase/queries.js', () => ({
  getConversationById: vi.fn(),
  getBusinessById: vi.fn(),
  getRecentMessages: vi.fn(),
  updateConversationContext: vi.fn(),
}));

vi.mock('../gemini/client.js', () => ({
  generateAgentResponse: vi.fn(),
}));

vi.mock('./actionRouter.js', () => ({
  handleAction: vi.fn(),
}));

vi.mock('../whatsapp/sender.js', () => ({
  sendWhatsAppMessage: vi.fn(),
}));

vi.mock('./escalation.js', () => ({
  checkEscalationTriggers: vi.fn(),
  escalateConversation: vi.fn(),
}));

describe('Agent State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBusiness = {
    id: 'biz-123',
    name: 'Acme Corp',
    ops_number: '+260971234567',
  };

  const mockConversation = {
    id: 'conv-456',
    business_id: 'biz-123',
    contact_wa_id: '+260979876543',
    status: 'active',
    agent_context: { unresolved_turns: 0 },
  };

  const mockMessage = {
    id: 'msg-789',
    conversation_id: 'conv-456',
    business_id: 'biz-123',
    body: 'How do I order?',
  };

  it('should abort if conversation status is not active', async () => {
    const pausedConversation = { ...mockConversation, status: 'paused' };
    vi.mocked(queries.getConversationById).mockResolvedValue(pausedConversation as any);

    await processMessage('conv-456', 'biz-123', 'msg-789');

    expect(queries.getBusinessById).not.toHaveBeenCalled();
    expect(geminiClient.generateAgentResponse).not.toHaveBeenCalled();
  });

  it('should escalate immediately if pre-flight escalation trigger is hit', async () => {
    vi.mocked(queries.getConversationById).mockResolvedValue(mockConversation as any);
    vi.mocked(queries.getBusinessById).mockResolvedValue(mockBusiness as any);
    vi.mocked(queries.getRecentMessages).mockResolvedValue([mockMessage] as any);
    vi.mocked(escalation.checkEscalationTriggers).mockReturnValue(true);

    await processMessage('conv-456', 'biz-123', 'msg-789');

    expect(escalation.escalateConversation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'conv-456' }),
      expect.objectContaining({ id: 'biz-123' }),
      expect.stringContaining('direct escalation')
    );
    expect(geminiClient.generateAgentResponse).not.toHaveBeenCalled();
  });

  it('should escalate if Gemini response request escalation or confidence is too low', async () => {
    vi.mocked(queries.getConversationById).mockResolvedValue(mockConversation as any);
    vi.mocked(queries.getBusinessById).mockResolvedValue(mockBusiness as any);
    vi.mocked(queries.getRecentMessages).mockResolvedValue([mockMessage] as any);
    vi.mocked(escalation.checkEscalationTriggers).mockReturnValue(false);

    const lowConfidenceResponse = {
      intent: AgentIntent.CHITCHAT,
      confidence: 0.4, // below 0.6 threshold
      action: { type: 'none', table: '', operation: 'none', filters: {}, data: {} },
      entities: {},
      reply: 'Ummm not sure...',
      escalate: false,
      escalation_reason: null,
      summary_update: null,
    };
    vi.mocked(geminiClient.generateAgentResponse).mockResolvedValue(lowConfidenceResponse as any);

    await processMessage('conv-456', 'biz-123', 'msg-789');

    expect(escalation.escalateConversation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'conv-456' }),
      expect.objectContaining({ id: 'biz-123' }),
      expect.stringContaining('Low model confidence')
    );
  });

  it('should route db actions and send reply on success', async () => {
    vi.mocked(queries.getConversationById).mockResolvedValue(mockConversation as any);
    vi.mocked(queries.getBusinessById).mockResolvedValue(mockBusiness as any);
    vi.mocked(queries.getRecentMessages).mockResolvedValue([mockMessage] as any);
    vi.mocked(escalation.checkEscalationTriggers).mockReturnValue(false);

    const dbReadResponse = {
      intent: AgentIntent.QUERY,
      confidence: 0.9,
      action: {
        type: 'db_read',
        table: 'products',
        operation: 'select',
        filters: { category: 'electronics' },
        data: {},
      },
      entities: {},
      reply: 'Here are the electronics products.',
      escalate: false,
      escalation_reason: null,
      summary_update: 'Customer requested electronic products.',
    };
    vi.mocked(geminiClient.generateAgentResponse).mockResolvedValue(dbReadResponse as any);

    const mockActionResponse = {
      success: true,
      replyOverride: 'We have: TV, Phone, and Laptop.',
    };
    vi.mocked(actionRouter.handleAction).mockResolvedValue(mockActionResponse as any);
    vi.mocked(sender.sendWhatsAppMessage).mockResolvedValue(true);

    await processMessage('conv-456', 'biz-123', 'msg-789');

    expect(actionRouter.handleAction).toHaveBeenCalledWith(
      dbReadResponse.action,
      'biz-123',
      'conv-456'
    );
    expect(queries.updateConversationContext).toHaveBeenCalledWith(
      'conv-456',
      'biz-123',
      expect.objectContaining({
        summary: 'Customer requested electronic products.',
        unresolved_turns: 0,
      })
    );
    expect(sender.sendWhatsAppMessage).toHaveBeenCalledWith(
      '+260979876543',
      'We have: TV, Phone, and Laptop.',
      'biz-123',
      'conv-456'
    );
  });
});
