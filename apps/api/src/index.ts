import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { env } from './lib/env.js';
import { whatsappWebhook } from './whatsapp/webhook.js';
import { whatsappRoutes } from './whatsapp/routes.js';
import { restoreSessions } from './whatsapp/sessionManager.js';

const app = new Hono();

// CORS — allow the dashboard to call the API
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

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
// Mount new Hono WhatsApp routes for gateway
app.route('/whatsapp', whatsappRoutes);

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

// Auto-restore active WhatsApp connections
restoreSessions().catch((err) => {
  console.error('[server] Failed to restore sessions during server boot:', err);
});

