// ──────────────────────────────────────────────
// Application-wide constants
// ──────────────────────────────────────────────

/**
 * Keywords that trigger immediate escalation to a human operator.
 * Checked case-insensitively against the inbound message body.
 */
export const ESCALATION_KEYWORDS: string[] = [
  'speak to a human',
  'talk to someone',
  'real person',
  'manager',
  'supervisor',
  'complaint',
  'urgent',
  'emergency',
  'legal',
  'lawyer',
  'sue',
  'refund',
  'cancel my account',
  'human agent',
  'operator',
];

/** Maximum retries for Gemini calls before falling back */
export const MAX_RETRIES = 3;

/** Responses below this confidence score trigger escalation */
export const CONFIDENCE_THRESHOLD = 0.6;

/** How many recent messages to include in the Gemini context window */
export const MAX_CONTEXT_MESSAGES = 6;

/** Consecutive unresolved turns before auto-escalation */
export const MAX_UNRESOLVED_TURNS = 3;

/**
 * Subscription tier limits — gates feature access and usage caps.
 * Values are monthly maximums; -1 means unlimited.
 */
export const SUBSCRIPTION_TIERS: Record<
  string,
  { maxMessages: number; maxConversations: number; aiEnabled: boolean }
> = {
  starter: {
    maxMessages: 500,
    maxConversations: 50,
    aiEnabled: true,
  },
  growth: {
    maxMessages: 5_000,
    maxConversations: 500,
    aiEnabled: true,
  },
  scale: {
    maxMessages: 50_000,
    maxConversations: 5_000,
    aiEnabled: true,
  },
  enterprise: {
    maxMessages: -1,
    maxConversations: -1,
    aiEnabled: true,
  },
};

/** BullMQ queue name for inbound message processing */
export const MESSAGE_QUEUE_NAME = 'blu-message-processing';
