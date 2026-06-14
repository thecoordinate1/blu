'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate a summary of an escalated conversation.
 *
 * - escalationHandoffSummary - A function that generates a summary of an escalated conversation.
 * - EscalationHandoffSummaryInput - The input type for the escalationHandoffSummary function.
 * - EscalationHandoffSummaryOutput - The return type for the escalationHandoffSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EscalationHandoffSummaryInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The full history of the customer conversation, as a string.'),
  escalationReason: z
    .string()
    .describe('The specific reason why the conversation was escalated.'),
});
export type EscalationHandoffSummaryInput = z.infer<typeof EscalationHandoffSummaryInputSchema>;

const EscalationHandoffSummaryOutputSchema = z.object({
  conversationSummary: z
    .string()
    .describe('A concise summary of the entire conversation history.'),
  escalationSummary: z
    .string()
    .describe('A summary explaining why the conversation was escalated.'),
});
export type EscalationHandoffSummaryOutput = z.infer<typeof EscalationHandoffSummaryOutputSchema>;

export async function escalationHandoffSummary(
  input: EscalationHandoffSummaryInput
): Promise<EscalationHandoffSummaryOutput> {
  return escalationHandoffSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'escalationHandoffSummaryPrompt',
  input: { schema: EscalationHandoffSummaryInputSchema },
  output: { schema: EscalationHandoffSummaryOutputSchema },
  prompt: `You are an AI assistant designed to summarize escalated customer conversations for human agents.
Your goal is to provide a clear and concise overview, so the human agent can quickly understand the context and the reason for escalation.

Based on the provided conversation history and the specific escalation reason, generate two summaries:
1. A summary of the entire conversation history.
2. A summary detailing the specific reason for escalation.

Conversation History:
---
{{{conversationHistory}}}
---

Escalation Reason:
---
{{{escalationReason}}}
---

Provide the summaries in the specified JSON format.
`,
});

const escalationHandoffSummaryFlow = ai.defineFlow(
  {
    name: 'escalationHandoffSummaryFlow',
    inputSchema: EscalationHandoffSummaryInputSchema,
    outputSchema: EscalationHandoffSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
