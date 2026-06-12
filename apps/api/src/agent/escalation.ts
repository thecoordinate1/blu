import { updateConversationStatus, logAgentAction } from '../supabase/queries.js';
import { sendWhatsAppMessage, notifyOwner } from '../whatsapp/sender.js';
import { ESCALATION_KEYWORDS } from '../lib/constants.js';
import { env } from '../lib/env.js';
import type { Conversation, Business } from '../lib/types.js';

/**
 * Checks if a message body matches any escalation keywords or triggers turn limits.
 */
export function checkEscalationTriggers(body: string, conversation: Conversation): boolean {
  const normalized = body.toLowerCase();
  
  // 1. Keyword check
  const hasKeyword = ESCALATION_KEYWORDS.some((kw) => normalized.includes(kw));
  if (hasKeyword) return true;

  // 2. Consecutive unresolved turns check (escalate if >= 3)
  const turns = conversation.agent_context?.unresolved_turns as number || 0;
  if (turns >= 3) return true;

  return false;
}

/**
 * Executes the escalation workflow: updates DB status, notifies the owner, and alerts the customer.
 */
export async function escalateConversation(
  conversation: Conversation,
  business: Business,
  reason: string
): Promise<void> {
  console.log(`[escalation] Escalating conversation ${conversation.id} (Reason: ${reason})`);

  try {
    // 1. Update status in database
    await updateConversationStatus(conversation.id, business.id, 'escalated', reason);

    // 2. Log agent action
    await logAgentAction({
      conversation_id: conversation.id,
      business_id: business.id,
      action_type: 'escalate',
      payload: { reason, previous_status: conversation.status },
      status: 'success',
    });

    // 3. Generate handoff summary
    // Typically uses a fast Gemini prompt. Here we generate a concise text.
    const lastSummary = conversation.agent_context?.summary || 'No recent summary.';
    const handoffSummary = `Customer is requesting support regarding an issue. Reason for handoff: ${reason}. Previous context summary: ${lastSummary}`;

    // 4. Notify the owner via primary WhatsApp number
    const handoffMessage = `🚨 *Escalation Alert — ${business.name}*
*Customer:* ${conversation.contact_wa_id}
*Reason:* ${reason}
*Summary:* ${handoffSummary}
*Dashboard Link:* ${env.APP_URL || 'https://app.blubot.com'}/app/conversations/${conversation.id}

Reply "RESOLVE" to close or "TAKE OVER" to silence notifications.`;

    await notifyOwner(business, handoffMessage);

    // 5. Send customer the holding message
    await sendWhatsAppMessage(
      conversation.contact_wa_id,
      "I'm connecting you with someone from our team who can help you better. They'll be with you shortly — thanks for your patience!",
      business.id,
      conversation.id
    );

    console.log(`[escalation] Handoff message sent for conversation ${conversation.id}`);
  } catch (err) {
    console.error(`[escalation] Failed to escalate conversation ${conversation.id}:`, err);
    throw err;
  }
}

