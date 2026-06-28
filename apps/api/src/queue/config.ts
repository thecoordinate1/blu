import { Queue, QueueOptions } from 'bullmq';
import { Redis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { env } from '../lib/env.js';

export const MESSAGE_QUEUE_NAME = 'whatsapp-message-processing';

let redisConnection: Redis;

try {
  const isLocalDev = env.NODE_ENV === 'development' && (env.REDIS_URL.includes('localhost') || env.REDIS_URL.includes('127.0.0.1'));
  if (isLocalDev) {
    console.log('[redis] Using ioredis-mock for local development');
    redisConnection = new (RedisMock as any)({
      maxRetriesPerRequest: null,
    });
  } else {
    redisConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }
  
  redisConnection.on('error', (err) => {
    console.error('[redis] Connection error:', err);
  });
} catch (err) {
  console.error('[redis] Initial connection failed:', err);
  throw err;
}

export { redisConnection };

const queueOptions: QueueOptions = {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const messageQueue = new Queue(MESSAGE_QUEUE_NAME, queueOptions);
