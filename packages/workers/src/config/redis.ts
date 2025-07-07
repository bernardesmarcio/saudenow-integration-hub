import Redis from 'ioredis';
import { logger } from '../lib/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Main Redis connection
export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableOfflineQueue: false,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      logger.warn('Redis READONLY error, reconnecting...');
      return true;
    }
    return false;
  },
});

// Create new Redis connection for specific purposes
export const createRedisConnection = (purpose?: string) => {
  const connection = new Redis(redisUrl, {
    retryStrategy: (times) => Math.min(times * 100, 3000),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  if (purpose) {
    connection.on('connect', () => logger.info(`Redis connected for ${purpose}`));
    connection.on('error', (err) => logger.error(`Redis error for ${purpose}:`, err));
  }

  return connection;
};

// Event handlers for main connection
redis.on('connect', () => {
  logger.info('Redis main connection established');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// Health check
export const isRedisHealthy = async (): Promise<boolean> => {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeRedisConnections = async () => {
  try {
    await redis.quit();
    logger.info('Redis connections closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connections:', error);
    redis.disconnect();
  }
};