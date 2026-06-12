import { createMessageWorker } from './queue/messageWorker.js';
import { redisConnection } from './queue/config.js';
import { env } from './lib/env.js';

console.log(`[worker] Starting BullMQ message processing worker in ${env.NODE_ENV} mode...`);

// Validate environment settings
try {
  const worker = createMessageWorker();
  console.log('[worker] Worker successfully listening for incoming jobs on Redis...');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[worker] Received ${signal}. Shutting down worker...`);
    
    try {
      await worker.close();
      await redisConnection.quit();
      console.log('[worker] Worker and Redis connections closed successfully. Exiting.');
      process.exit(0);
    } catch (err) {
      console.error('[worker] Error during worker shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

} catch (err) {
  console.error('[worker] Failed to start worker:', err);
  process.exit(1);
}
