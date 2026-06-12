import { supabase } from '../supabase/client.js';
import { logAgentAction, updateAgentActionStatus } from '../supabase/queries.js';
import type { GeminiAction } from '../lib/types.js';
import { formatQueryResult } from './formatters.js';
import { notifyOwner } from '../whatsapp/sender.js';
import { getBusinessById } from '../supabase/queries.js';

interface ActionRouterResponse {
  success: boolean;
  replyOverride?: string;
  error?: string;
}

/**
 * Routes database actions requested by Gemini.
 * Enforces security gates:
 * - Direct read/create operations allowed
 * - Update/delete operations require business owner confirmation
 */
export async function handleAction(
  action: GeminiAction,
  businessId: string,
  conversationId: string
): Promise<ActionRouterResponse> {
  console.log(`[action-router] Routing action: ${action.operation} on table ${action.table}`);

  // Create pending log in agent_actions
  const dbAction = await logAgentAction({
    conversation_id: conversationId,
    business_id: businessId,
    action_type: `${action.type}:${action.operation}`,
    payload: { action },
    status: 'pending',
  });

  try {
    if (action.type === 'db_read') {
      // 1. READ ACTION
      // Run generic PostgREST select query scoped by business_id
      const { data, error } = await supabase
        .from(action.table)
        .select('*')
        .eq('business_id', businessId)
        .match(action.filters || {});

      if (error) throw error;

      await updateAgentActionStatus(dbAction.id, businessId, 'success');
      const formattedReply = formatQueryResult(action.table, data);

      return {
        success: true,
        replyOverride: formattedReply,
      };
    } else if (action.type === 'db_write') {
      // 2. WRITE ACTION
      if (action.operation === 'insert') {
        // Direct insert is allowed (e.g. creating a lead or ticketing record)
        const { data, error } = await supabase
          .from(action.table)
          .insert({
            ...action.data,
            business_id: businessId, // Force tenant isolation
          })
          .select('*')
          .single();

        if (error) throw error;

        await updateAgentActionStatus(dbAction.id, businessId, 'success');

        return {
          success: true,
          replyOverride: `Got it, I've created that record successfully. Reference ID: ${data.id || 'N/A'}.`,
        };
      } else if (action.operation === 'update' || action.operation === 'delete') {
        // Destructive operations require owner confirmation gate
        console.log('[action-router] Destructive action requested. Intercepting for owner confirmation.');

        await updateAgentActionStatus(dbAction.id, businessId, 'awaiting_confirm');

        const business = await getBusinessById(businessId);
        if (!business) {
          throw new Error('Business details not found for notification');
        }

        // Notify owner
        const operationText = action.operation === 'update' ? 'update a record in' : 'delete a record from';
        const confirmationMessage = `⚠️ [Action Confirmation Request]
Business: ${business.name}
The AI agent wants to ${operationText} the table "${action.table}".

Proposed Data/Filters:
${JSON.stringify(action.operation === 'update' ? action.data : action.filters, null, 2)}

Reply with:
"CONFIRM ${dbAction.id}" to execute.
"DENY ${dbAction.id}" to cancel.`;

        await notifyOwner(business, confirmationMessage);

        return {
          success: true,
          replyOverride: "I need to get approval from the business owner to finalize that change. I've sent them a confirmation request and will complete it as soon as they authorize it. Thanks for your patience!",
        };
      }
    }

    return { success: false, error: 'Unsupported action type or operation' };
  } catch (err) {
    console.error(`[action-router] Action execution failed for action ${dbAction.id}:`, err);
    await updateAgentActionStatus(dbAction.id, businessId, 'failed');
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
