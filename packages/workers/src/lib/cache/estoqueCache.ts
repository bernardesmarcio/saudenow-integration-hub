import { redis } from '../../config/redis';
import { cacheLogger } from '../logger';
import environment from '../../config/environment';

interface EstoqueData {
  produto_id: string;
  quantidade: number;
  deposito: string;
  ultima_atualizacao: string;
  critico?: boolean;
}

export class EstoqueCache {
  private prefix = 'estoque:';
  private criticalPrefix = 'estoque:critical:';
  private ttl = environment.cache.estoque; // 30 seconds default
  private criticalTtl = 15; // 15 seconds for critical items

  /**
   * Get stock data from cache
   */
  async get(produtoId: string): Promise<EstoqueData | null> {
    try {
      const key = `${this.prefix}${produtoId}`;
      const data = await redis.get(key);
      
      if (data) {
        cacheLogger.debug(`Cache hit for produto ${produtoId}`);
        return JSON.parse(data);
      }
      
      cacheLogger.debug(`Cache miss for produto ${produtoId}`);
      return null;
    } catch (error) {
      cacheLogger.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Get multiple stock data from cache
   */
  async getMultiple(produtoIds: string[]): Promise<Map<string, EstoqueData>> {
    const result = new Map<string, EstoqueData>();
    
    if (produtoIds.length === 0) return result;

    try {
      const keys = produtoIds.map(id => `${this.prefix}${id}`);
      const values = await redis.mget(...keys);

      values.forEach((value, index) => {
        if (value) {
          result.set(produtoIds[index], JSON.parse(value));
        }
      });

      cacheLogger.debug(`Cache multi-get: ${result.size}/${produtoIds.length} hits`);
    } catch (error) {
      cacheLogger.error('Error in multi-get from cache:', error);
    }

    return result;
  }

  /**
   * Set stock data in cache
   */
  async set(produtoId: string, estoque: EstoqueData): Promise<void> {
    try {
      const key = `${this.prefix}${produtoId}`;
      const ttl = estoque.critico ? this.criticalTtl : this.ttl;
      
      await redis.setex(key, ttl, JSON.stringify(estoque));
      
      // Also set in critical cache if stock is low
      if (estoque.quantidade <= 10) {
        await this.setCritical(produtoId, estoque);
      }
      
      cacheLogger.debug(`Cached produto ${produtoId} for ${ttl}s`);
    } catch (error) {
      cacheLogger.error('Error setting cache:', error);
    }
  }

  /**
   * Set multiple stock data in cache (batch operation)
   */
  async setMultiple(estoques: Map<string, EstoqueData>): Promise<void> {
    if (estoques.size === 0) return;

    const pipeline = redis.pipeline();

    for (const [produtoId, estoque] of estoques) {
      const key = `${this.prefix}${produtoId}`;
      const ttl = estoque.critico ? this.criticalTtl : this.ttl;
      
      pipeline.setex(key, ttl, JSON.stringify(estoque));
      
      if (estoque.quantidade <= 10) {
        const criticalKey = `${this.criticalPrefix}${produtoId}`;
        pipeline.setex(criticalKey, this.criticalTtl, JSON.stringify(estoque));
      }
    }

    try {
      await pipeline.exec();
      cacheLogger.debug(`Batch cached ${estoques.size} items`);
    } catch (error) {
      cacheLogger.error('Error in batch cache set:', error);
    }
  }

  /**
   * Set critical stock in special cache with shorter TTL
   */
  private async setCritical(produtoId: string, estoque: EstoqueData): Promise<void> {
    try {
      const key = `${this.criticalPrefix}${produtoId}`;
      await redis.setex(key, this.criticalTtl, JSON.stringify({
        ...estoque,
        critico: true,
      }));
    } catch (error) {
      cacheLogger.error('Error setting critical cache:', error);
    }
  }

  /**
   * Get all critical stock items
   */
  async getCriticalItems(): Promise<EstoqueData[]> {
    try {
      const pattern = `${this.criticalPrefix}*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length === 0) return [];
      
      const values = await redis.mget(...keys);
      
      return values
        .filter(v => v !== null)
        .map(v => JSON.parse(v as string));
    } catch (error) {
      cacheLogger.error('Error getting critical items:', error);
      return [];
    }
  }

  /**
   * Invalidate cache for a product
   */
  async invalidate(produtoId: string): Promise<void> {
    try {
      const keys = [
        `${this.prefix}${produtoId}`,
        `${this.criticalPrefix}${produtoId}`,
      ];
      
      await redis.del(...keys);
      cacheLogger.debug(`Invalidated cache for produto ${produtoId}`);
    } catch (error) {
      cacheLogger.error('Error invalidating cache:', error);
    }
  }

  /**
   * Invalidate multiple products from cache
   */
  async invalidateMultiple(produtoIds: string[]): Promise<void> {
    if (produtoIds.length === 0) return;

    try {
      const keys = produtoIds.flatMap(id => [
        `${this.prefix}${id}`,
        `${this.criticalPrefix}${id}`,
      ]);
      
      await redis.del(...keys);
      cacheLogger.debug(`Invalidated cache for ${produtoIds.length} products`);
    } catch (error) {
      cacheLogger.error('Error invalidating multiple caches:', error);
    }
  }

  /**
   * Preload popular products into cache
   */
  async preloadPopular(produtos: Array<{ id: string; estoque: EstoqueData }>): Promise<void> {
    const estoqueMap = new Map<string, EstoqueData>();
    
    produtos.forEach(({ id, estoque }) => {
      estoqueMap.set(id, estoque);
    });
    
    await this.setMultiple(estoqueMap);
    cacheLogger.info(`Preloaded ${produtos.length} popular products`);
  }

  /**
   * Clear all stock cache
   */
  async clearAll(): Promise<void> {
    try {
      const patterns = [
        `${this.prefix}*`,
        `${this.criticalPrefix}*`,
      ];
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
      
      cacheLogger.info('All stock cache cleared');
    } catch (error) {
      cacheLogger.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    criticalKeys: number;
    memoryUsage: string;
  }> {
    try {
      const [totalKeys, criticalKeys] = await Promise.all([
        redis.keys(`${this.prefix}*`).then(keys => keys.length),
        redis.keys(`${this.criticalPrefix}*`).then(keys => keys.length),
      ]);

      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        totalKeys,
        criticalKeys,
        memoryUsage,
      };
    } catch (error) {
      cacheLogger.error('Error getting cache stats:', error);
      return {
        totalKeys: 0,
        criticalKeys: 0,
        memoryUsage: 'error',
      };
    }
  }
}

// Export singleton instance
export const estoqueCache = new EstoqueCache();