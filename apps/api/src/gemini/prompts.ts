import type { Business, Conversation, Message } from '../lib/types.js';
import { ESCALATION_KEYWORDS, CONFIDENCE_THRESHOLD } from '../lib/constants.js';

/**
 * Builds the system prompt injected as the first message in every Gemini call.
 * Encodes the business persona, capabilities, tone, knowledge base,
 * and hard rules (escalation, safety, data access boundaries).
 */
export function buildSystemPrompt(business: Business): string {
  const ctx = business.gemini_context ?? {};

  const persona = ctx.persona ?? `A helpful AI assistant for ${business.name}`;
  const tone = ctx.tone ?? 'professional and friendly';
  const knowledgeBase = ctx.knowledge_base ?? 'No specific knowledge base configured.';
  const capabilities = (ctx.capabilities as string[] | undefined)?.join(', ') ?? 'general enquiries';

  return `
You are Blu_bot, an AI-powered WhatsApp business assistant for **${business.name}**.

## Persona
${persona}

## Tone & Style
- Communicate in a ${tone} tone.
- Keep responses concise — WhatsApp messages should be short and scannable.
- Use line breaks for readability. Avoid walls of text.
- Use emojis sparingly and only when they match the brand tone.

## Knowledge Base
${knowledgeBase}

## Capabilities
You can help with: ${capabilities}.

## Structured Output Rules
You MUST respond with a single JSON object matching the required schema.
- "intent": classify the user message as one of: query, create, update, delete, escalate, clarify, chitchat.
- "confidence": your confidence in the classification (0.0 to 1.0). If below ${CONFIDENCE_THRESHOLD}, set escalate to true.
- "action": describe any database action needed (type, table, operation, filters, data). Use type "none" if no DB action.
- "entities": extracted entities (names, dates, IDs, amounts, etc.).
- "reply": the natural-language message to send back to the customer via WhatsApp.
- "escalate": set to true if the conversation should be handed to a human.
- "escalation_reason": explain why escalation is needed (null if not escalating).
- "summary_update": a 1-2 sentence rolling summary of the conversation so far (null if no update).

## Escalation Rules
Escalate immediately if the user mentions any of these keywords or phrases:
${ESCALATION_KEYWORDS.map((kw) => `- "${kw}"`).join('\n')}

Also escalate if:
- You cannot confidently answer the query (confidence < ${CONFIDENCE_THRESHOLD}).
- The user expresses frustration or dissatisfaction repeatedly.
- The request involves sensitive operations you cannot safely handle.

## Safety & Boundaries
- Never fabricate data. If you don't know, say so and offer to escalate.
- Never share other customers' data.
- Never perform destructive operations (update/delete) without flagging for confirmation first.
- Do not discuss topics outside the business scope.
`.trim();
}

/**
 * Transforms DB message rows into Gemini-compatible content parts.
 * Includes the rolling conversation summary (if available) as a system-level
 * context message so the model has continuity beyond the 6-message window.
 */
export function buildMessageHistory(
  conversation: Conversation,
  recentMessages: Message[]
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // Inject rolling summary as the first "user" context turn if available
  const summary = conversation.agent_context?.summary;
  if (summary) {
    history.push({
      role: 'user',
      parts: [{ text: `[Conversation context / rolling summary]: ${summary}` }],
    });
    // Model acknowledges the context so turns stay balanced
    history.push({
      role: 'model',
      parts: [{ text: 'Understood, I have the conversation context.' }],
    });
  }

  for (const msg of recentMessages) {
    const role = msg.direction === 'inbound' ? 'user' : 'model';
    const text = msg.body ?? '[media message]';

    history.push({ role, parts: [{ text }] });
  }

  // Gemini requires the last turn to be "user" — if history ends with
  // a model turn we can safely drop it (edge case with status messages)
  if (history.length > 0 && history[history.length - 1].role === 'model') {
    history.pop();
  }

  return history;
}
