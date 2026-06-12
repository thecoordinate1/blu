import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { env } from './lib/env.js';
import { whatsappWebhook } from './whatsapp/webhook.js';

const app = new Hono();

// Validate env variables on startup
console.log(`[server] Initializing Blu_bot API. Mode: ${env.NODE_ENV}`);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Mount WhatsApp webhook
app.route('/webhook/whatsapp', whatsappWebhook);

// Global error handler
app.onError((err, c) => {
  console.error('[server] Uncaught exception:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

// Start the server
const port = env.PORT || 3001;
console.log(`[server] Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
