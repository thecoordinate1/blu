import { Worker } from 'bullmq';
import { redisConnection, MESSAGE_QUEUE_NAME } from './config.js';
import { processMessage } from '../agent/stateMachine.js';
import type { QueueJobData } from '../lib/types.js';

export function createMessageWorker() {
  const worker = new Worker<QueueJobData>(
    MESSAGE_QUEUE_NAME,
    async (job) => {
      const { conversationId, businessId, messageId } = job.data;
      console.log(`[worker] Processing job ${job.id} for conversation ${conversationId}`);

      try {
        await processMessage(conversationId, businessId, messageId);
        console.log(`[worker] Finished job ${job.id} for conversation ${conversationId}`);
      } catch (err) {
        console.error(`[worker] Error in job ${job.id} processing:`, err);
        throw err; // Propagate to let BullMQ handle retry
      }
    },
    {
      connection: redisConnection as any,
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed with error:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[worker] Worker error event:', err);
  });

  return worker;
}
