'use server';
/**
 * @fileOverview A Genkit flow for detecting customer frustration and low AI confidence to trigger human escalation.
 *
 * - escalationDetectionFlow - The Genkit flow that analyzes customer messages for sentiment and confidence.
 * - EscalationDetectionInput - The input type for the escalationDetectionFlow.
 * - EscalationDetectionOutput - The return type for the escalationDetectionFlow.
 * - escalationDetection - A wrapper function to call the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EscalationDetectionInputSchema = z.object({
  customerMessage: z.string().describe('The customer\'s message to be analyzed.')
});
export type EscalationDetectionInput = z.infer<typeof EscalationDetectionInputSchema>;

const EscalationDetectionOutputSchema = z.object({
  escalate: z.boolean().describe('True if escalation to a human agent is recommended, false otherwise.'),
  escalateReason: z.string().describe('The reason for escalation, if applicable. E.g., "Frustration detected", "Low AI confidence".'),
  frustrationDetected: z.boolean().describe('True if the customer message indicates frustration.'),
  llmConfidence: z.number().min(0).max(1).describe('A confidence score (0-1) from the LLM in its ability to handle the current message/situation. A score below 0.6 suggests low confidence.'),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'frustrated']).describe('The overall sentiment of the customer message.')
});
export type EscalationDetectionOutput = z.infer<typeof EscalationDetectionOutputSchema>;

const ESCALATION_THRESHOLD = 0.6; // As per the prompt requirements

const escalationDetectionPrompt = ai.definePrompt({
  name: 'escalationDetectionPrompt',
  input: {schema: EscalationDetectionInputSchema},
  output: {schema: EscalationDetectionOutputSchema},
  prompt: `You are an expert sentiment and confidence analysis AI for customer support.
Your task is to analyze a customer's message and determine if it indicates frustration or if your confidence in handling the situation is low, requiring escalation to a human agent.

Analyze the customer message carefully.
1. Determine the overall sentiment (positive, neutral, negative, frustrated).
2. Specifically identify if there are any signs of frustration (e.g., strong negative language, repeated complaints, demanding tone).
3. Assess your own confidence level (0-1) in understanding this message and being able to provide a satisfactory automated response. A low confidence score (e.g., below ${ESCALATION_THRESHOLD}) suggests the need for escalation.

Based on your analysis, set 'escalate' to true if frustration is detected OR if your 'llmConfidence' is below ${ESCALATION_THRESHOLD}.
Provide a clear 'escalateReason' if 'escalate' is true.

Customer Message: "{{{customerMessage}}}"`
});

const escalationDetectionFlow = ai.defineFlow(
  {
    name: 'escalationDetectionFlow',
    inputSchema: EscalationDetectionInputSchema,
    outputSchema: EscalationDetectionOutputSchema
  },
  async (input) => {
    const {output} = await escalationDetectionPrompt(input);

    if (!output) {
      throw new Error('Failed to get output from escalationDetectionPrompt.');
    }

    let escalate = output.escalate;
    let escalateReason = output.escalateReason;

    // Programmatic check to ensure escalation logic is consistently applied based on threshold.
    if (output.llmConfidence < ESCALATION_THRESHOLD && !escalate) {
        escalate = true;
        escalateReason = escalateReason ? `${escalateReason}, Low AI confidence (below ${ESCALATION_THRESHOLD})` : `Low AI confidence (below ${ESCALATION_THRESHOLD})`;
    }
    if (output.frustrationDetected && !escalate) {
        escalate = true;
        escalateReason = escalateReason ? `${escalateReason}, Frustration detected` : `Frustration detected`;
    }
    if (!escalate && escalateReason) { // Clear reason if no escalation after checks
        escalateReason = '';
    }

    return {
        ...output,
        escalate,
        escalateReason
    };
  }
);

export async function escalationDetection(input: EscalationDetectionInput): Promise<EscalationDetectionOutput> {
  return escalationDetectionFlow(input);
}
