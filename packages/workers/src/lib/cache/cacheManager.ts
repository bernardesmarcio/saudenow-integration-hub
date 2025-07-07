import { redis } from '../../config/redis';
import { cacheLogger } from '../logger';

export class CacheManager {
  /**
   * Generic cache get
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      cacheLogger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Generic cache set with TTL
   */
  static async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      cacheLogger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Delete cache key
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      cacheLogger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      cacheLogger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set key expiration
   */
  static async expire(key: string, ttl: number): Promise<void> {
    try {
      await redis.expire(key, ttl);
    } catch (error) {
      cacheLogger.error(`Error setting expiration for key ${key}:`, error);
    }
  }

  /**
   * Increment counter
   */
  static async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      cacheLogger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get TTL for key
   */
  static async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      cacheLogger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Lock mechanism for distributed processing
   */
  static async acquireLock(
    key: string,
    ttl: number = 60
  ): Promise<boolean> {
    try {
      const lockKey = `lock:${key}`;
      const result = await redis.set(lockKey, '1', 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      cacheLogger.error(`Error acquiring lock for ${key}:`, error);
      return false;
    }
  }

  /**
   * Release lock
   */
  static async releaseLock(key: string): Promise<void> {
    try {
      const lockKey = `lock:${key}`;
      await redis.del(lockKey);
    } catch (error) {
      cacheLogger.error(`Error releasing lock for ${key}:`, error);
    }
  }

  /**
   * Clear all keys with pattern
   */
  static async clearPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      cacheLogger.error(`Error clearing pattern ${pattern}:`, error);
      return 0;
    }
  }
}