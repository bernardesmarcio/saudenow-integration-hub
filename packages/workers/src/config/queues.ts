import Bull from 'bull';
import { createRedisConnection } from './redis';
import { queueLogger } from '../lib/logger';

interface QueueOptions {
  defaultJobOptions?: Bull.JobOptions;
  rateLimiter?: {
    max: number;
    duration: number;
    bounceBack?: boolean;
  };
}

const createQueue = (name: string, options: QueueOptions = {}) => {
  const queue = new Bull(name, {
    createClient: (type) => {
      const client = createRedisConnection(`${name}-${type}`);
      return client as any;
    },
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      ...options.defaultJobOptions,
    },
  });

  // Rate limiter setup
  if (options.rateLimiter) {
    // @ts-ignore - Bull types don't include limiter
    queue.limiter = options.rateLimiter;
  }

  // Event handlers
  queue.on('error', (error) => {
    queueLogger.error(`Queue ${name} error:`, error);
  });

  queue.on('waiting', (jobId) => {
    queueLogger.debug(`Job ${jobId} waiting in queue ${name}`);
  });

  queue.on('completed', (job) => {
    queueLogger.info(`Job ${job.id} completed in queue ${name}`);
  });

  queue.on('failed', (job, err) => {
    queueLogger.error(`Job ${job.id} failed in queue ${name}:`, err);
  });

  return queue;
};

// SAP Sync Queue - General purpose
export const sapSyncQueue = createQueue('sap-sync', {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 100,
    attempts: 3,
  },
  rateLimiter: {
    max: 100,
    duration: 60000, // 1 minute
  },
});

// SAP Estoque Queue - CRITICAL for real-time stock
export const sapEstoqueQueue = createQueue('sap-estoque', {
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 50,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1s delay
    },
    priority: 10, // Higher priority
  },
  rateLimiter: {
    max: 200, // Higher rate for stock updates
    duration: 60000,
    bounceBack: true,
  },
});

// Critical Stock Queue - ULTRA HIGH PRIORITY
export const criticalStockQueue = createQueue('critical-stock', {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 10,
    attempts: 10,
    backoff: {
      type: 'fixed',
      delay: 500, // Fixed 500ms delay
    },
    priority: 20, // Highest priority
  },
});

// Integration Queue - General integrations
export const integrationQueue = createQueue('integration', {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
  },
});

// Notification Queue - Alerts and notifications
export const notificationQueue = createQueue('notification', {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

// Queue monitoring
export const getQueueStats = async () => {
  const queues = {
    'sap-sync': sapSyncQueue,
    'sap-estoque': sapEstoqueQueue,
    'critical-stock': criticalStockQueue,
    'integration': integrationQueue,
    'notification': notificationQueue,
  };

  const stats: any = {};

  for (const [name, queue] of Object.entries(queues)) {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount(),
    ]);

    stats[name] = {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    };
  }

  return stats;
};

// Clean old jobs
export const cleanQueues = async () => {
  const queues = [
    sapSyncQueue,
    sapEstoqueQueue,
    criticalStockQueue,
    integrationQueue,
    notificationQueue,
  ];

  for (const queue of queues) {
    await queue.clean(24 * 3600 * 1000); // 24 hours
    await queue.clean(24 * 3600 * 1000, 'failed');
  }

  queueLogger.info('Queues cleaned successfully');
};

// Graceful shutdown
export const closeQueues = async () => {
  const queues = [
    sapSyncQueue,
    sapEstoqueQueue,
    criticalStockQueue,
    integrationQueue,
    notificationQueue,
  ];

  await Promise.all(queues.map((queue) => queue.close()));
  queueLogger.info('All queues closed gracefully');
};