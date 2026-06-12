import { AgentState, AgentIntent } from '../lib/types.js';
import { getBusinessById, getConversationById, getRecentMessages, updateConversationContext } from '../supabase/queries.js';
import { generateAgentResponse } from '../gemini/client.js';
import { handleAction } from './actionRouter.js';
import { sendWhatsAppMessage } from '../whatsapp/sender.js';
import { checkEscalationTriggers, escalateConversation } from './escalation.js';

/**
 * Runs the agent state machine for a specific inbound message.
 * IDLE → PARSING → REASONING → [DB_READ/DB_WRITE/ESCALATING] → RESPONDING → IDLE
 */
export async function processMessage(
  conversationId: string,
  businessId: string,
  messageId: string
): Promise<void> {
  console.log(`[state-machine] Processing message ${messageId} in conversation ${conversationId}`);

  // 1. Fetch conversation and business
  const conversation = await getConversationById(conversationId, businessId);
  if (!conversation) {
    console.error(`[state-machine] Conversation ${conversationId} not found`);
    return;
  }

  // Check state: If conversation is escalated, paused, or closed, do not reply
  if (conversation.status === 'escalated' || conversation.status === 'paused' || conversation.status === 'closed') {
    console.log(`[state-machine] Conversation status is ${conversation.status}. Aborting agent response.`);
    return;
  }

  const business = await getBusinessById(businessId);
  if (!business) {
    console.error(`[state-machine] Business ${businessId} not found`);
    return;
  }

  try {
    // 2. State: PARSING
    // In this phase we can run spelling checks, trim whitespaces, detect language etc.
    console.log('[state-machine] State: PARSING');
    const recentMessages = await getRecentMessages(conversationId, businessId);
    const latestMessage = recentMessages[recentMessages.length - 1];

    if (!latestMessage || latestMessage.id !== messageId) {
      console.warn('[state-machine] Message ID mismatch or no messages. Running anyway.');
    }

    // 3. Pre-flight Escalation Check
    // Check for negative customer keywords directly in the message text before hitting Gemini
    const bodyText = latestMessage?.body || '';
    const shouldEscalateImmediately = checkEscalationTriggers(bodyText, conversation);
    if (shouldEscalateImmediately) {
      console.log('[state-machine] Negative keywords or constraints hit in pre-flight. Escalating.');
      await escalateConversation(conversation, business, 'Customer message triggered direct escalation keyword or turn limits.');
      return;
    }

    // 4. State: REASONING
    console.log('[state-machine] State: REASONING');
    const geminiResult = await generateAgentResponse(business, conversation, recentMessages);

    // 5. Check if LLM requested escalation or confidence threshold is low
    if (geminiResult.escalate || geminiResult.confidence < 0.6) {
      console.log(`[state-machine] Gemini requested escalation. Reason: ${geminiResult.escalation_reason}`);
      await escalateConversation(
        conversation,
        business,
        geminiResult.escalation_reason || 'Low model confidence or explicit LLM escalation request.'
      );
      return;
    }

    // 6. State: DB_READ / DB_WRITE (Action Router)
    let replyContent = geminiResult.reply;

    if (geminiResult.action && geminiResult.action.type !== 'none') {
      console.log(`[state-machine] State: ${geminiResult.action.type === 'db_read' ? 'DB_READ' : 'DB_WRITE'}`);
      
      const actionResponse = await handleAction(geminiResult.action, business.id, conversation.id);
      
      if (actionResponse.success) {
        if (actionResponse.replyOverride) {
          replyContent = actionResponse.replyOverride;
        }
      } else {
        console.warn('[state-machine] Agent action failed. Falling back to default reply.');
        // Increment unresolved turns or retry count
      }
    }

    // Update conversation summary if Gemini returned a new rolling summary
    if (geminiResult.summary_update) {
      const updatedContext = {
        ...conversation.agent_context,
        summary: geminiResult.summary_update,
        unresolved_turns: 0, // Reset counter since we processed successfully
      };
      await updateConversationContext(conversationId, businessId, updatedContext);
    } else {
      // Increment unresolved turns for escalation detection (3+ consecutive unresolved turns)
      const turns = (conversation.agent_context.unresolved_turns as number || 0) + 1;
      await updateConversationContext(conversationId, businessId, {
        ...conversation.agent_context,
        unresolved_turns: turns,
      });
    }

    // 7. State: RESPONDING
    console.log('[state-machine] State: RESPONDING');
    const sendSuccess = await sendWhatsAppMessage(
      conversation.contact_wa_id,
      replyContent,
      businessId,
      conversationId
    );

    if (!sendSuccess) {
      console.error('[state-machine] Failed to send outbound WhatsApp reply');
    }
  } catch (err) {
    console.error('[state-machine] State machine execution failed:', err);
    // Graceful fallback response
    try {
      await sendWhatsAppMessage(
        conversation.contact_wa_id,
        "I'm sorry, I'm having a brief connection issue. Let me fetch someone to help you directly.",
        businessId,
        conversationId
      );
      await escalateConversation(conversation, business, `Runtime State Machine Error: ${err instanceof Error ? err.message : String(err)}`);
    } catch (fallbackErr) {
      console.error('[state-machine] Fallback response and escalation failed:', fallbackErr);
    }
  }
}
