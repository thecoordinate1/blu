import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAction } from './actionRouter.js';
import { supabase } from '../supabase/client.js';
import * as queries from '../supabase/queries.js';
import * as sender from '../whatsapp/sender.js';
import * as formatters from './formatters.js';

// Mock supabase client
vi.mock('../supabase/client.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          match: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'new-row-id' }, error: null })),
        })),
      })),
    })),
  },
}));

vi.mock('../supabase/queries.js', () => ({
  logAgentAction: vi.fn(),
  updateAgentActionStatus: vi.fn(),
  getBusinessById: vi.fn(),
}));

vi.mock('./formatters.js', () => ({
  formatQueryResult: vi.fn(),
}));

vi.mock('../whatsapp/sender.js', () => ({
  notifyOwner: vi.fn(),
}));

describe('Action Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDbAction = { id: 'action-999', status: 'pending' };

  it('should handle db_read action correctly', async () => {
    vi.mocked(queries.logAgentAction).mockResolvedValue(mockDbAction as any);
    vi.mocked(formatters.formatQueryResult).mockReturnValue('Formatted products: TV, laptop');

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        match: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'TV' }],
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    } as any);

    const action = {
      type: 'db_read' as const,
      table: 'products',
      operation: 'select' as const,
      filters: { id: 1 },
      data: {},
    };

    const res = await handleAction(action, 'biz-123', 'conv-456');

    expect(queries.logAgentAction).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('products');
    expect(queries.updateAgentActionStatus).toHaveBeenCalledWith('action-999', 'biz-123', 'success');
    expect(res.success).toBe(true);
    expect(res.replyOverride).toBe('Formatted products: TV, laptop');
  });

  it('should handle direct insert db_write action correctly', async () => {
    vi.mocked(queries.logAgentAction).mockResolvedValue(mockDbAction as any);

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-order-id' },
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    } as any);

    const action = {
      type: 'db_write' as const,
      table: 'orders',
      operation: 'insert' as const,
      filters: {},
      data: { total: 150 },
    };

    const res = await handleAction(action, 'biz-123', 'conv-456');

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(insertMock).toHaveBeenCalledWith({
      total: 150,
      business_id: 'biz-123', // Ensure business_id injection
    });
    expect(queries.updateAgentActionStatus).toHaveBeenCalledWith('action-999', 'biz-123', 'success');
    expect(res.success).toBe(true);
    expect(res.replyOverride).toContain('new-order-id');
  });

  it('should require owner approval for updates/deletes and notify owner', async () => {
    vi.mocked(queries.logAgentAction).mockResolvedValue(mockDbAction as any);
    vi.mocked(queries.getBusinessById).mockResolvedValue({ id: 'biz-123', name: 'Acme' } as any);

    const action = {
      type: 'db_write' as const,
      table: 'orders',
      operation: 'update' as const,
      filters: { id: 'order-123' },
      data: { status: 'cancelled' },
    };

    const res = await handleAction(action, 'biz-123', 'conv-456');

    expect(queries.updateAgentActionStatus).toHaveBeenCalledWith('action-999', 'biz-123', 'awaiting_confirm');
    expect(sender.notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'biz-123' }),
      expect.stringContaining('CONFIRM action-999')
    );
    expect(res.success).toBe(true);
    expect(res.replyOverride).toContain('approval');
  });
});
