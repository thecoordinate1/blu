/**
 * Stub implementation of the Lenco billing integration.
 * In a future phase, this will communicate with Lenco's API for metering and handle webhooks.
 */

export async function checkSubscriptionLimit(businessId: string): Promise<boolean> {
  console.log(`[billing] Checking subscription limit for business ${businessId} - starter tier allows 500 convs/mo`);
  // Stub: Always allow in Phase 1
  return true;
}

export async function recordUsageEvent(businessId: string, eventType: string): Promise<void> {
  console.log(`[billing] Recording usage event "${eventType}" for business ${businessId}`);
}

export async function handleLencoWebhook(payload: Record<string, unknown>): Promise<void> {
  console.log('[billing] Received Lenco webhook event:', JSON.stringify(payload));
}
