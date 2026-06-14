'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'agent', 'system']),
  content: z.string()
});

const AIAgentAutomaticResponseInputSchema = z.object({
  customerMessage: z.string().describe("The user's latest incoming WhatsApp message."),
  conversationHistory: z.array(MessageSchema).optional().default([]).describe("Previous messages in this conversation session.")
});

export type AIAgentAutomaticResponseInput = z.infer<typeof AIAgentAutomaticResponseInputSchema>;

const AIAgentAutomaticResponseOutputSchema = z.object({
  reply: z.string().describe("The generated response reply to send back to the user.")
});

export type AIAgentAutomaticResponseOutput = z.infer<typeof AIAgentAutomaticResponseOutputSchema>;

const aiAgentAutomaticResponsePrompt = ai.definePrompt({
  name: 'aiAgentAutomaticResponsePrompt',
  input: { schema: AIAgentAutomaticResponseInputSchema },
  output: { schema: AIAgentAutomaticResponseOutputSchema },
  prompt: `You are an automated, friendly, and helpful AI customer support agent named Blu_bot.
Your goal is to answer the customer's questions clearly, politely, and concisely.

Here is the conversation history:
{{#each conversationHistory}}
- {{role}}: {{content}}
{{/each}}

Latest Customer Message: "{{{customerMessage}}}"

Provide your friendly response in the specified JSON format. Keep it concise enough for a WhatsApp message.
`
});

const aiAgentAutomaticResponseFlow = ai.defineFlow(
  {
    name: 'aiAgentAutomaticResponseFlow',
    inputSchema: AIAgentAutomaticResponseInputSchema,
    outputSchema: AIAgentAutomaticResponseOutputSchema
  },
  async (input) => {
    const { output } = await aiAgentAutomaticResponsePrompt(input);
    if (!output) {
      throw new Error('Failed to generate response from prompt');
    }
    return output;
  }
);

export async function aiAgentAutomaticResponse(
  input: AIAgentAutomaticResponseInput
): Promise<AIAgentAutomaticResponseOutput> {
  return aiAgentAutomaticResponseFlow(input);
}
