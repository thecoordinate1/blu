import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { env } from '../lib/env.js';
import { MAX_RETRIES } from '../lib/constants.js';
import type { Business, Conversation, Message, GeminiResponse } from '../lib/types.js';
import { AgentIntent } from '../lib/types.js';
import { geminiResponseSchema, geminiGenerativeSchema } from './schema.js';
import { buildSystemPrompt, buildMessageHistory } from './prompts.js';

// ──────────────────────────────────────────────
// SDK client singleton
// ──────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const MODEL_NAME = 'gemini-2.0-flash';

// ──────────────────────────────────────────────
// Mock response for dev/test mode
// ──────────────────────────────────────────────

const MOCK_RESPONSE: GeminiResponse = {
  intent: AgentIntent.CHITCHAT,
  confidence: 0.95,
  action: {
    type: 'none',
    table: '',
    operation: 'none',
    filters: {},
    data: {},
  },
  entities: {},
  reply: 'Hello! I\'m Blu_bot running in mock mode. How can I help you today? 🤖',
  escalate: false,
  escalation_reason: null,
  summary_update: 'Customer greeted the assistant.',
};

// ──────────────────────────────────────────────
// Exponential backoff helper
// ──────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// Main generation function
// ──────────────────────────────────────────────

/**
 * Calls Gemini Flash 2.0 with structured JSON output, the business-specific
 * system prompt, and the recent conversation history.
 *
 * Includes:
 * - GEMINI_MOCK=true bypass for local dev
 * - Exponential-backoff retry (up to MAX_RETRIES)
 * - Zod validation of the response
 */
export async function generateAgentResponse(
  business: Business,
  conversation: Conversation,
  recentMessages: Message[]
): Promise<GeminiResponse> {
  // Short-circuit in mock mode to avoid burning API quota during dev
  if (env.GEMINI_MOCK) {
    console.log('[gemini] Mock mode enabled — returning hardcoded response');
    return MOCK_RESPONSE;
  }

  const systemPrompt = buildSystemPrompt(business);
  const history = buildMessageHistory(conversation, recentMessages);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: geminiGenerativeSchema,
          temperature: 0.4,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const chat = model.startChat({ history });

      // The last message in history is the user's latest — we send it
      // as the new turn if the history was consumed, otherwise use a
      // fallback prompt. In practice buildMessageHistory ensures the
      // last turn is always a user message that we've already included,
      // so we send a minimal prompt to trigger generation.
      const result = await chat.sendMessage(
        'Respond to the latest customer message above following the schema.'
      );

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);
      const validated = geminiResponseSchema.parse(parsed);

      console.log(
        `[gemini] Response generated (attempt ${attempt}): intent=${validated.intent}, confidence=${validated.confidence}`
      );

      return validated as GeminiResponse;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[gemini] Attempt ${attempt}/${MAX_RETRIES} failed:`,
        lastError.message
      );

      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const backoff = Math.pow(2, attempt - 1) * 1000;
        console.log(`[gemini] Retrying in ${backoff}ms...`);
        await sleep(backoff);
      }
    }
  }

  // All retries exhausted — return a safe fallback so the customer
  // isn't left hanging with no reply
  console.error('[gemini] All retries exhausted. Returning fallback response.');

  return {
    intent: AgentIntent.ESCALATE,
    confidence: 0,
    action: { type: 'none', table: '', operation: 'none', filters: {}, data: {} },
    entities: {},
    reply:
      "I'm sorry, I'm having trouble processing your request right now. Let me connect you with a team member who can help.",
    escalate: true,
    escalation_reason: `Gemini generation failed after ${MAX_RETRIES} attempts: ${lastError?.message ?? 'unknown error'}`,
    summary_update: null,
  };
}
