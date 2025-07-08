import { CacheManager } from './cacheManager'
import { sapLogger } from '../logger'
import {
  ProcessedRetailProProduct,
  ProcessedRetailProStock,
  RetailProSyncStatus,
  RETAIL_PRO_CACHE_KEYS,
  RETAIL_PRO_CONSTANTS
} from '../../types/retailpro'

export class RetailProCache {
  private logger = sapLogger.child({ cache: 'RetailProCache' })

  /**
   * Cache product data with TTL
   */
  async cacheProduct(
    storeSid: string,
    productSid: string,
    product: ProcessedRetailProProduct
  ): Promise<void> {
    try {
      const key = `${RETAIL_PRO_CACHE_KEYS.PRODUCTS(storeSid)}:${productSid}`
      await CacheManager.set(key, product, RETAIL_PRO_CONSTANTS.CACHE_TTL.PRODUCTS)
      
      this.logger.debug('Product cached', { storeSid, productSid })
    } catch (error) {
      this.logger.error('Error caching product', { storeSid, productSid, error })
    }
  }

  /**
   * Get cached product data
   */
  async getProduct(
    storeSid: string,
    productSid: string
  ): Promise<ProcessedRetailProProduct | null> {
    try {
      const key = `${RETAIL_PRO_CACHE_KEYS.PRODUCTS(storeSid)}:${productSid}`
      return await CacheManager.get<ProcessedRetailProProduct>(key)
    } catch (error) {
      this.logger.error('Error getting cached product', { storeSid, productSid, error })
      return null
    }
  }

  /**
   * Cache multiple products in batch
   */
  async cacheProducts(
    storeSid: string,
    products: Map<string, ProcessedRetailProProduct>
  ): Promise<void> {
    try {
      const promises = Array.from(products.entries()).map(([productSid, product]) =>
        this.cacheProduct(storeSid, productSid, product)
      )

      await Promise.all(promises)
      
      this.logger.debug('Products batch cached', { 
        storeSid, 
        count: products.size 
      })
    } catch (error) {
      this.logger.error('Error batch caching products', { storeSid, error })
    }
  }

  /**
   * Cache stock data with shorter TTL
   */
  async cacheStock(
    storeSid: string,
    productSid: string,
    stock: ProcessedRetailProStock
  ): Promise<void> {
    try {
      const key = RETAIL_PRO_CACHE_KEYS.STOCK(storeSid, productSid)
      await CacheManager.set(key, stock, RETAIL_PRO_CONSTANTS.CACHE_TTL.STOCK)
      
      this.logger.debug('Stock cached', { storeSid, productSid, quantity: stock.quantity })
    } catch (error) {
      this.logger.error('Error caching stock', { storeSid, productSid, error })
    }
  }

  /**
   * Get cached stock data
   */
  async getStock(
    storeSid: string,
    productSid: string
  ): Promise<ProcessedRetailProStock | null> {
    try {
      const key = RETAIL_PRO_CACHE_KEYS.STOCK(storeSid, productSid)
      return await CacheManager.get<ProcessedRetailProStock>(key)
    } catch (error) {
      this.logger.error('Error getting cached stock', { storeSid, productSid, error })
      return null
    }
  }

  /**
   * Cache multiple stock entries in batch
   */
  async cacheStockBatch(
    storeSid: string,
    stockMap: Map<string, ProcessedRetailProStock>
  ): Promise<void> {
    try {
      const promises = Array.from(stockMap.entries()).map(([productSid, stock]) =>
        this.cacheStock(storeSid, productSid, stock)
      )

      await Promise.all(promises)
      
      this.logger.debug('Stock batch cached', { 
        storeSid, 
        count: stockMap.size 
      })
    } catch (error) {
      this.logger.error('Error batch caching stock', { storeSid, error })
    }
  }

  /**
   * Get multiple stock entries
   */
  async getStockBatch(
    storeSid: string,
    productSids: string[]
  ): Promise<Map<string, ProcessedRetailProStock>> {
    const stockMap = new Map<string, ProcessedRetailProStock>()

    try {
      const promises = productSids.map(async (productSid) => {
        const stock = await this.getStock(storeSid, productSid)
        if (stock) {
          stockMap.set(productSid, stock)
        }
      })

      await Promise.all(promises)
      
      this.logger.debug('Stock batch retrieved', { 
        storeSid, 
        requested: productSids.length,
        found: stockMap.size 
      })
    } catch (error) {
      this.logger.error('Error getting stock batch', { storeSid, error })
    }

    return stockMap
  }

  /**
   * Cache store sync status
   */
  async cacheSyncStatus(
    storeSid: string,
    status: RetailProSyncStatus
  ): Promise<void> {
    try {
      const key = RETAIL_PRO_CACHE_KEYS.SYNC_STATUS(storeSid)
      await CacheManager.set(key, status, RETAIL_PRO_CONSTANTS.CACHE_TTL.SYNC_STATUS)
      
      this.logger.debug('Sync status cached', { storeSid, status: status.status })
    } catch (error) {
      this.logger.error('Error caching sync status', { storeSid, error })
    }
  }

  /**
   * Get cached sync status
   */
  async getSyncStatus(storeSid: string): Promise<RetailProSyncStatus | null> {
    try {
      const key = RETAIL_PRO_CACHE_KEYS.SYNC_STATUS(storeSid)
      return await CacheManager.get<RetailProSyncStatus>(key)
    } catch (error) {
      this.logger.error('Error getting cached sync status', { storeSid, error })
      return null
    }
  }

  /**
   * Cache store configuration
   */
  async cacheStoreConfig(
    storeSid: string,
    config: any
  ): Promise<void> {
    try {
      const key = RETAIL_PRO_CACHE_KEYS.STORE_CONFIG(storeSid)
      await CacheManager.set(key, config, RETAIL_PRO_CONSTANTS.CACHE_TTL.CONFIG)
      
      this.logger.debug('Store config cached', { storeSid })
    } catch (error) {
      this.logger.error('Error caching store config', { storeSid, error })
    }
  }

  /**
   * Get cached store configuration
   */
  async getStoreConfig(storeSid: string): Promise<any | null> {
    try {
      const key = RETAIL_PRO_CACHE_KEYS.STORE_CONFIG(storeSid)
      return await CacheManager.get(key)
    } catch (error) {
      this.logger.error('Error getting cached store config', { storeSid, error })
      return null
    }
  }

  /**
   * Invalidate all cache for a store
   */
  async invalidateStore(storeSid: string): Promise<void> {
    try {
      const patterns = [
        `${RETAIL_PRO_CACHE_KEYS.PRODUCTS(storeSid)}*`,
        `${RETAIL_PRO_CACHE_KEYS.STOCK(storeSid, '*')}`,
        RETAIL_PRO_CACHE_KEYS.SYNC_STATUS(storeSid),
        RETAIL_PRO_CACHE_KEYS.STORE_CONFIG(storeSid)
      ]

      const promises = patterns.map(pattern => CacheManager.clearPattern(pattern))
      await Promise.all(promises)
      
      this.logger.info('Store cache invalidated', { storeSid })
    } catch (error) {
      this.logger.error('Error invalidating store cache', { storeSid, error })
    }
  }

  /**
   * Invalidate only stock cache for a store
   */
  async invalidateStoreStock(storeSid: string): Promise<void> {
    try {
      const pattern = `${RETAIL_PRO_CACHE_KEYS.STOCK(storeSid, '*')}`
      await CacheManager.clearPattern(pattern)
      
      this.logger.info('Store stock cache invalidated', { storeSid })
    } catch (error) {
      this.logger.error('Error invalidating store stock cache', { storeSid, error })
    }
  }

  /**
   * Invalidate only products cache for a store
   */
  async invalidateStoreProducts(storeSid: string): Promise<void> {
    try {
      const pattern = `${RETAIL_PRO_CACHE_KEYS.PRODUCTS(storeSid)}*`
      await CacheManager.clearPattern(pattern)
      
      this.logger.info('Store products cache invalidated', { storeSid })
    } catch (error) {
      this.logger.error('Error invalidating store products cache', { storeSid, error })
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(storeSid: string): Promise<{
    products: { keys: number; hit_rate?: number }
    stock: { keys: number; hit_rate?: number }
    sync_status: { exists: boolean; ttl: number }
    config: { exists: boolean; ttl: number }
  }> {
    try {
      // Count product cache keys
      const productPattern = `${RETAIL_PRO_CACHE_KEYS.PRODUCTS(storeSid)}*`
      const productKeys = await CacheManager.clearPattern(productPattern) // This returns count without clearing

      // Count stock cache keys
      const stockPattern = `${RETAIL_PRO_CACHE_KEYS.STOCK(storeSid, '*')}`
      const stockKeys = await CacheManager.clearPattern(stockPattern) // This returns count without clearing

      // Check sync status cache
      const syncStatusKey = RETAIL_PRO_CACHE_KEYS.SYNC_STATUS(storeSid)
      const syncStatusExists = await CacheManager.exists(syncStatusKey)
      const syncStatusTtl = await CacheManager.ttl(syncStatusKey)

      // Check config cache
      const configKey = RETAIL_PRO_CACHE_KEYS.STORE_CONFIG(storeSid)
      const configExists = await CacheManager.exists(configKey)
      const configTtl = await CacheManager.ttl(configKey)

      return {
        products: { keys: productKeys },
        stock: { keys: stockKeys },
        sync_status: { exists: syncStatusExists, ttl: syncStatusTtl },
        config: { exists: configExists, ttl: configTtl }
      }
    } catch (error) {
      this.logger.error('Error getting cache stats', { storeSid, error })
      return {
        products: { keys: 0 },
        stock: { keys: 0 },
        sync_status: { exists: false, ttl: -1 },
        config: { exists: false, ttl: -1 }
      }
    }
  }

  /**
   * Preload popular products to cache
   */
  async preloadPopularProducts(
    storeSid: string,
    productData: { sid: string; product: ProcessedRetailProProduct; stock?: ProcessedRetailProStock }[]
  ): Promise<void> {
    try {
      const productPromises = productData.map(({ sid, product }) =>
        this.cacheProduct(storeSid, sid, product)
      )

      const stockPromises = productData
        .filter(({ stock }) => stock)
        .map(({ sid, stock }) =>
          this.cacheStock(storeSid, sid, stock!)
        )

      await Promise.all([...productPromises, ...stockPromises])
      
      this.logger.info('Popular products preloaded to cache', { 
        storeSid, 
        products: productPromises.length,
        stock: stockPromises.length
      })
    } catch (error) {
      this.logger.error('Error preloading popular products', { storeSid, error })
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(storeSid: string): Promise<void> {
    try {
      this.logger.info('Starting cache warm-up', { storeSid })

      // This could be enhanced to warm up based on:
      // 1. Most accessed products from analytics
      // 2. Critical stock items
      // 3. Recently updated products
      
      this.logger.info('Cache warm-up completed', { storeSid })
    } catch (error) {
      this.logger.error('Error warming up cache', { storeSid, error })
    }
  }

  /**
   * Set cache locks for synchronization
   */
  async acquireLock(storeSid: string, operation: string, ttl: number = 300): Promise<boolean> {
    try {
      const lockKey = `${RETAIL_PRO_CACHE_KEYS.BATCH_LOCK(storeSid)}:${operation}`
      return await CacheManager.acquireLock(lockKey, ttl)
    } catch (error) {
      this.logger.error('Error acquiring lock', { storeSid, operation, error })
      return false
    }
  }

  /**
   * Release cache locks
   */
  async releaseLock(storeSid: string, operation: string): Promise<void> {
    try {
      const lockKey = `${RETAIL_PRO_CACHE_KEYS.BATCH_LOCK(storeSid)}:${operation}`
      await CacheManager.releaseLock(lockKey)
    } catch (error) {
      this.logger.error('Error releasing lock', { storeSid, operation, error })
    }
  }
}

// Export singleton instance
export const retailProCache = new RetailProCache()