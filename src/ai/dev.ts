import { config } from 'dotenv';
config();

import '@/ai/flows/escalation-summary-flow.ts';
import '@/ai/flows/escalation-detection-flow.ts';
import '@/ai/flows/ai-agent-automatic-response-flow.ts';