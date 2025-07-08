import { BaseIntegrationService, IntegrationConfig } from './baseIntegrationService'
import { CacheManager } from '../../lib/cache/cacheManager'
import { sapLogger } from '../../lib/logger'
import {
  RetailProConfig,
  RetailProProduct,
  RetailProInventoryQty,
  ProcessedRetailProProduct,
  ProcessedRetailProStock,
  RetailProApiResponse,
  RetailProProductQuery,
  RetailProStockQuery,
  RetailProBatchResult,
  RetailProBatchError,
  RetailProSyncStatus,
  RetailProError,
  RetailProTimeoutError,
  RetailProNotFoundError,
  RetailProRateLimitError,
  RETAIL_PRO_CACHE_KEYS,
  RETAIL_PRO_CONSTANTS
} from '../../types/retailpro'

export class RetailProService extends BaseIntegrationService {
  private config: RetailProConfig
  private logger = sapLogger.child({ service: 'RetailProService' })

  constructor(config: RetailProConfig) {
    const baseConfig: IntegrationConfig = {
      baseURL: config.baseUrl,
      timeout: config.timeout || RETAIL_PRO_CONSTANTS.DEFAULT_TIMEOUT,
      rateLimitPerMinute: 120 // Conservative rate limit for Retail Pro
    }

    super(baseConfig)
    this.config = config
  }

  /**
   * Get all products for a store with pagination
   */
  async getProducts(
    storeSid: string,
    options: RetailProProductQuery = {}
  ): Promise<RetailProApiResponse<RetailProProduct>> {
    try {
      const cacheKey = `${RETAIL_PRO_CACHE_KEYS.PRODUCTS(storeSid)}:${JSON.stringify(options)}`
      
      // Try cache first
      const cached = await CacheManager.get<RetailProApiResponse<RetailProProduct>>(cacheKey)
      if (cached) {
        this.logger.debug('Products cache hit', { storeSid, options })
        return cached
      }

      const queryParams = {
        cols: options.cols || 'sid,alu,description1,description2,vendor_name,sbsinventoryqtys',
        limit: options.limit || RETAIL_PRO_CONSTANTS.DEFAULT_BATCH_SIZE,
        offset: options.offset || 0,
        ...options
      }

      this.logger.info('Fetching products from Retail Pro', { storeSid, queryParams })

      const response = await this.get<RetailProProduct[]>('/v1/rest/inventory', {
        params: queryParams
      })

      const result: RetailProApiResponse<RetailProProduct> = {
        data: response || [],
        total: response?.length || 0,
        offset: queryParams.offset,
        limit: queryParams.limit
      }

      // Cache for 4 hours
      await CacheManager.set(cacheKey, result, RETAIL_PRO_CONSTANTS.CACHE_TTL.PRODUCTS)

      this.logger.info('Products fetched successfully', { 
        storeSid, 
        count: result.data.length,
        offset: result.offset,
        limit: result.limit
      })

      return result
    } catch (error) {
      this.logger.error('Error fetching products', { storeSid, error })
      throw this.handleError(error, storeSid)
    }
  }

  /**
   * Get stock information for a specific product in a store
   */
  async getProductStock(
    inventorySid: string,
    storeSid: string,
    options: RetailProStockQuery = {}
  ): Promise<RetailProInventoryQty | null> {
    try {
      const cacheKey = RETAIL_PRO_CACHE_KEYS.STOCK(storeSid, inventorySid)
      
      // Try cache first
      const cached = await CacheManager.get<RetailProInventoryQty>(cacheKey)
      if (cached) {
        this.logger.debug('Stock cache hit', { inventorySid, storeSid })
        return cached
      }

      const queryParams = {
        cols: options.cols || 'store_sid,store_name,quantity,minimum_quantity,po_ordered_quantity,po_received_quantity',
        ...options
      }

      this.logger.debug('Fetching stock from Retail Pro', { inventorySid, storeSid, queryParams })

      const response = await this.get<RetailProInventoryQty[]>(
        `/v1/rest/inventory/${inventorySid}/sbsinventoryqty/${storeSid}`,
        { params: queryParams }
      )

      const stock = response?.[0] || null

      // Cache for 5 minutes
      if (stock) {
        await CacheManager.set(cacheKey, stock, RETAIL_PRO_CONSTANTS.CACHE_TTL.STOCK)
      }

      this.logger.debug('Stock fetched successfully', { inventorySid, storeSid, hasStock: !!stock })

      return stock
    } catch (error) {
      this.logger.error('Error fetching stock', { inventorySid, storeSid, error })
      
      // For stock queries, we handle 404 as "no stock" instead of error
      if (error.response?.status === 404) {
        return null
      }
      
      throw this.handleError(error, storeSid, inventorySid)
    }
  }

  /**
   * Get stock for multiple products in batch
   */
  async getProductsStockBatch(
    inventorySids: string[],
    storeSid: string
  ): Promise<RetailProBatchResult<ProcessedRetailProStock>> {
    const batchSize = Math.min(inventorySids.length, this.config.batchSize || RETAIL_PRO_CONSTANTS.DEFAULT_BATCH_SIZE)
    const batches = this.chunkArray(inventorySids, batchSize)
    
    const results: ProcessedRetailProStock[] = []
    const errors: RetailProBatchError[] = []

    this.logger.info('Processing stock batch', { 
      storeSid, 
      totalProducts: inventorySids.length, 
      batchSize,
      batches: batches.length
    })

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      this.logger.debug(`Processing batch ${i + 1}/${batches.length}`, { batchSize: batch.length })

      // Process batch in parallel
      const batchPromises = batch.map(async (inventorySid) => {
        try {
          const stock = await this.getProductStock(inventorySid, storeSid)
          return this.processStock(stock, inventorySid, storeSid)
        } catch (error) {
          errors.push({
            sid: inventorySid,
            error: error.message,
            timestamp: new Date()
          })
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.filter(Boolean))

      // Rate limiting between batches
      if (i < batches.length - 1) {
        await this.delay(500) // 500ms between batches
      }
    }

    return {
      success: results,
      errors,
      total: inventorySids.length,
      processed: results.length + errors.length
    }
  }

  /**
   * Process and normalize a product
   */
  processProduct(product: RetailProProduct): ProcessedRetailProProduct {
    const description = [product.description1, product.description2]
      .filter(Boolean)
      .join(' ')
      .trim()

    return {
      sid: product.sid,
      alu: product.alu,
      description,
      brand: product.vendor_name || 'Sem marca',
      upc: product.upc,
      price: product.price,
      cost: product.cost,
      active: product.active !== false,
      created_at: product.created_at ? new Date(product.created_at) : new Date(),
      updated_at: product.updated_at ? new Date(product.updated_at) : new Date()
    }
  }

  /**
   * Process and normalize stock data
   */
  private processStock(
    stock: RetailProInventoryQty | null,
    inventorySid: string,
    storeSid: string
  ): ProcessedRetailProStock {
    if (!stock) {
      return {
        store_sid: storeSid,
        store_name: 'Loja não encontrada',
        quantity: 0,
        minimum_quantity: 0,
        po_ordered_quantity: 0,
        po_received_quantity: 0,
        status: 'no_data',
        last_updated: new Date()
      }
    }

    // Determine stock status
    let status: ProcessedRetailProStock['status'] = 'out_of_stock'
    if (stock.quantity > 0) {
      status = stock.quantity <= stock.minimum_quantity ? 'low_stock' : 'in_stock'
    }

    return {
      store_sid: stock.store_sid,
      store_name: stock.store_name,
      quantity: stock.quantity || 0,
      minimum_quantity: stock.minimum_quantity || 0,
      po_ordered_quantity: stock.po_ordered_quantity || 0,
      po_received_quantity: stock.po_received_quantity || 0,
      status,
      last_updated: new Date()
    }
  }

  /**
   * Get or create sync status for a store
   */
  async getSyncStatus(storeSid: string): Promise<RetailProSyncStatus> {
    const cacheKey = RETAIL_PRO_CACHE_KEYS.SYNC_STATUS(storeSid)
    
    const cached = await CacheManager.get<RetailProSyncStatus>(cacheKey)
    if (cached) {
      return cached
    }

    const defaultStatus: RetailProSyncStatus = {
      store_sid: storeSid,
      last_product_sync: null,
      last_stock_sync: null,
      products_synced: 0,
      stock_synced: 0,
      errors: 0,
      status: 'idle'
    }

    await CacheManager.set(cacheKey, defaultStatus, RETAIL_PRO_CONSTANTS.CACHE_TTL.SYNC_STATUS)
    return defaultStatus
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(
    storeSid: string,
    updates: Partial<RetailProSyncStatus>
  ): Promise<void> {
    const current = await this.getSyncStatus(storeSid)
    const updated = { ...current, ...updates }
    
    const cacheKey = RETAIL_PRO_CACHE_KEYS.SYNC_STATUS(storeSid)
    await CacheManager.set(cacheKey, updated, RETAIL_PRO_CONSTANTS.CACHE_TTL.SYNC_STATUS)
  }

  /**
   * Clear cache for a store
   */
  async clearStoreCache(storeSid: string): Promise<void> {
    const patterns = [
      `${RETAIL_PRO_CACHE_KEYS.PRODUCTS(storeSid)}*`,
      `${RETAIL_PRO_CACHE_KEYS.STOCK(storeSid, '*')}`,
      RETAIL_PRO_CACHE_KEYS.SYNC_STATUS(storeSid)
    ]

    for (const pattern of patterns) {
      await CacheManager.clearPattern(pattern)
    }

    this.logger.info('Store cache cleared', { storeSid })
  }

  /**
   * Acquire distributed lock for sync operations
   */
  async acquireSyncLock(storeSid: string, ttl: number = 300): Promise<boolean> {
    const lockKey = RETAIL_PRO_CACHE_KEYS.BATCH_LOCK(storeSid)
    return await CacheManager.acquireLock(lockKey, ttl)
  }

  /**
   * Release distributed lock
   */
  async releaseSyncLock(storeSid: string): Promise<void> {
    const lockKey = RETAIL_PRO_CACHE_KEYS.BATCH_LOCK(storeSid)
    await CacheManager.releaseLock(lockKey)
  }

  /**
   * Health check for Retail Pro service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch a small set of products to verify connectivity
      const testResponse = await this.get<RetailProProduct[]>('/v1/rest/inventory', {
        params: { limit: 1 },
        timeout: 10000
      })
      
      return Array.isArray(testResponse)
    } catch (error) {
      this.logger.error('Health check failed', { error })
      return false
    }
  }

  // Abstract method implementations
  protected transformToInternal(data: RetailProProduct): ProcessedRetailProProduct {
    return this.processProduct(data)
  }

  protected transformToExternal(data: ProcessedRetailProProduct): RetailProProduct {
    return {
      sid: data.sid,
      alu: data.alu,
      description1: data.description.split(' ')[0] || '',
      description2: data.description.split(' ').slice(1).join(' ') || '',
      vendor_name: data.brand,
      upc: data.upc,
      price: data.price,
      cost: data.cost,
      active: data.active,
      created_at: data.created_at.toISOString(),
      updated_at: data.updated_at.toISOString()
    }
  }

  // Helper methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private handleError(error: any, storeSid?: string, productSid?: string): RetailProError {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new RetailProTimeoutError(storeSid, productSid)
    }

    if (error.response?.status === 404) {
      return new RetailProNotFoundError('Resource', productSid || storeSid || 'unknown')
    }

    if (error.response?.status === 429) {
      return new RetailProRateLimitError(storeSid)
    }

    return new RetailProError(
      error.message || 'Erro desconhecido na integração Retail Pro',
      error.response?.status?.toString() || 'UNKNOWN',
      storeSid,
      productSid,
      error.response?.data
    )
  }
}