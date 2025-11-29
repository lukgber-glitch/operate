/**
 * Operate Workers - Background Job Processing
 */

import { Worker } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('🚀 Operate Workers starting...');
console.log(`📡 Connecting to Redis: ${REDIS_URL}`);

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on('connect', () => {
  console.log('✅ Redis connected');
});

connection.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// Email worker
const emailWorker = new Worker(
  'email',
  async (job) => {
    console.log(`📧 Processing email job: ${job.id}`);
    // Email processing logic here
    return { success: true };
  },
  { connection }
);

// Export worker
const exportWorker = new Worker(
  'export',
  async (job) => {
    console.log(`📦 Processing export job: ${job.id}`);
    // Export processing logic here
    return { success: true };
  },
  { connection }
);

// Classification worker
const classificationWorker = new Worker(
  'classification',
  async (job) => {
    console.log(`🤖 Processing classification job: ${job.id}`);
    // Classification processing logic here
    return { success: true };
  },
  { connection }
);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 Shutting down workers...');
  await emailWorker.close();
  await exportWorker.close();
  await classificationWorker.close();
  await connection.quit();
  process.exit(0);
});

console.log('✅ Workers initialized and listening for jobs');
