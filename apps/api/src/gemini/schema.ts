import { z } from 'zod';
import { SchemaType, type Schema } from '@google/generative-ai';

// ──────────────────────────────────────────────
// Zod schema — used for runtime validation of Gemini output
// ──────────────────────────────────────────────

export const geminiActionSchema = z.object({
  type: z.enum(['db_read', 'db_write', 'none']),
  table: z.string(),
  operation: z.enum(['select', 'insert', 'update', 'delete', 'none']),
  filters: z.record(z.unknown()).default({}),
  data: z.record(z.unknown()).default({}),
});

export const geminiResponseSchema = z.object({
  intent: z.enum([
    'query',
    'create',
    'update',
    'delete',
    'escalate',
    'clarify',
    'chitchat',
  ]),
  confidence: z.number().min(0).max(1),
  action: geminiActionSchema,
  entities: z.record(z.unknown()).default({}),
  reply: z.string(),
  escalate: z.boolean(),
  escalation_reason: z.string().nullable().default(null),
  summary_update: z.string().nullable().default(null),
});

export type GeminiResponseSchema = z.infer<typeof geminiResponseSchema>;

// ──────────────────────────────────────────────
// Google Generative AI SDK schema — used for controlled JSON generation
// ──────────────────────────────────────────────

export const geminiGenerativeSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    intent: {
      type: SchemaType.STRING,
      enum: ['query', 'create', 'update', 'delete', 'escalate', 'clarify', 'chitchat'],
      description: 'The classified intent of the user message',
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: 'Confidence score between 0 and 1',
    },
    action: {
      type: SchemaType.OBJECT,
      properties: {
        type: {
          type: SchemaType.STRING,
          enum: ['db_read', 'db_write', 'none'],
        },
        table: {
          type: SchemaType.STRING,
          description: 'Target database table name, or empty string if none',
        },
        operation: {
          type: SchemaType.STRING,
          enum: ['select', 'insert', 'update', 'delete', 'none'],
        },
        filters: {
          type: SchemaType.OBJECT,
          description: 'Filter criteria for the database operation',
          properties: {},
        },
        data: {
          type: SchemaType.OBJECT,
          description: 'Data payload for insert/update operations',
          properties: {},
        },
      },
      required: ['type', 'table', 'operation'],
    },
    entities: {
      type: SchemaType.OBJECT,
      description: 'Extracted entities from the user message',
      properties: {},
    },
    reply: {
      type: SchemaType.STRING,
      description: 'The natural language reply to send to the user',
    },
    escalate: {
      type: SchemaType.BOOLEAN,
      description: 'Whether this conversation should be escalated to a human',
    },
    escalation_reason: {
      type: SchemaType.STRING,
      description: 'Reason for escalation, null if not escalating',
      nullable: true,
    },
    summary_update: {
      type: SchemaType.STRING,
      description: 'Rolling summary update for the conversation context',
      nullable: true,
    },
  },
  required: [
    'intent',
    'confidence',
    'action',
    'entities',
    'reply',
    'escalate',
  ],
};
