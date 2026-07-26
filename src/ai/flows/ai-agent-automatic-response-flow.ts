'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'agent', 'system']),
  content: z.string()
});

const AIAgentAutomaticResponseInputSchema = z.object({
  customerMessage: z.string().describe("The user's latest incoming WhatsApp message."),
  conversationHistory: z.array(MessageSchema).optional().default([]).describe("Previous messages in this conversation session."),
  businessName: z.string().optional().default("Blu Business").describe("Name of the business tenant."),
  businessContext: z.string().optional().default("").describe("Business background, products, pricing, and persona context.")
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
  prompt: `You are an automated, human-like, and friendly customer support representative for {{businessName}}.
Your name is Blu_bot. You act as a knowledgeable team member of {{businessName}}.

{{#if businessContext}}
BUSINESS KNOWLEDGE & PRODUCTS:
{{{businessContext}}}
{{/if}}

RULES FOR YOUR RESPONSE:
- Keep your reply concise, clear, and tailored for WhatsApp messages.
- Be polite, helpful, and professional.
- Use currency in Zambian Kwacha (ZMW) when providing pricing.
- Do not make up facts outside the provided business knowledge.

CONVERSATION HISTORY:
{{#each conversationHistory}}
- {{role}}: {{content}}
{{/each}}

LATEST CUSTOMER MESSAGE: "{{{customerMessage}}}"

Provide your friendly response in the specified JSON format.
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
