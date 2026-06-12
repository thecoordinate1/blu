import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkEscalationTriggers, escalateConversation } from './escalation.js';
import * as queries from '../supabase/queries.js';
import * as sender from '../whatsapp/sender.js';

vi.mock('../supabase/queries.js', () => ({
  updateConversationStatus: vi.fn(),
  logAgentAction: vi.fn(),
}));

vi.mock('../whatsapp/sender.js', () => ({
  sendWhatsAppMessage: vi.fn(),
  notifyOwner: vi.fn(),
}));

vi.mock('../lib/env.js', () => ({
  env: {
    APP_URL: 'https://test.blubot.com',
  },
}));

describe('Escalation Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBusiness = {
    id: 'biz-123',
    name: 'Acme Corp',
    primary_number: '+260979876543',
  };

  const mockConversation = {
    id: 'conv-456',
    business_id: 'biz-123',
    contact_wa_id: '+260971112222',
    status: 'active',
    agent_context: { unresolved_turns: 0, summary: 'Client requested pricing info.' },
  };

  describe('checkEscalationTriggers', () => {
    it('should return true if body contains escalation keywords', () => {
      expect(checkEscalationTriggers('can I speak to a human please', mockConversation as any)).toBe(true);
      expect(checkEscalationTriggers('get me your manager', mockConversation as any)).toBe(true);
      expect(checkEscalationTriggers('I want to talk to a real person', mockConversation as any)).toBe(true);
    });

    it('should return true if unresolved turns are >= 3', () => {
      const highTurnsConv = {
        ...mockConversation,
        agent_context: { unresolved_turns: 3 },
      };
      expect(checkEscalationTriggers('hello', highTurnsConv as any)).toBe(true);
    });

    it('should return false if no keywords match and unresolved turns are < 3', () => {
      expect(checkEscalationTriggers('hello there', mockConversation as any)).toBe(false);
    });
  });

  describe('escalateConversation', () => {
    it('should execute full escalation flow', async () => {
      vi.mocked(queries.updateConversationStatus).mockResolvedValue(undefined);
      vi.mocked(queries.logAgentAction).mockResolvedValue({ id: 'action-777' } as any);
      vi.mocked(sender.notifyOwner).mockResolvedValue(true);
      vi.mocked(sender.sendWhatsAppMessage).mockResolvedValue(true);

      await escalateConversation(
        mockConversation as any,
        mockBusiness as any,
        'Explicit customer human request.'
      );

      // Verify DB updates
      expect(queries.updateConversationStatus).toHaveBeenCalledWith(
        'conv-456',
        'biz-123',
        'escalated',
        'Explicit customer human request.'
      );

      expect(queries.logAgentAction).toHaveBeenCalledWith({
        conversation_id: 'conv-456',
        business_id: 'biz-123',
        action_type: 'escalate',
        payload: {
          reason: 'Explicit customer human request.',
          previous_status: 'active',
        },
        status: 'success',
      });

      // Verify Owner alert
      expect(sender.notifyOwner).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Acme Corp' }),
        expect.stringContaining('Explicit customer human request.')
      );
      expect(sender.notifyOwner).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringContaining('https://test.blubot.com/app/conversations/conv-456')
      );

      // Verify holding message to customer
      expect(sender.sendWhatsAppMessage).toHaveBeenCalledWith(
        '+260971112222',
        expect.stringContaining('connecting you with someone'),
        'biz-123',
        'conv-456'
      );
    });
  });
});
