import { Job } from 'bull'
import { retailProQueue, criticalStockQueue, notificationQueue } from '../../config/queues'
import { RetailProService } from '../../services/integrations/retailProService'
import { supabase, Tables, logIntegration, batchUpsert } from '../../config/database'
import { CacheManager } from '../../lib/cache/cacheManager'
import { sapLogger } from '../../lib/logger'
import {
  RetailProSyncJob,
  RetailProSyncStatus,
  ProcessedRetailProProduct,
  ProcessedRetailProStock,
  RetailProProductEntity,
  RetailProEstoqueEntity,
  RETAIL_PRO_CONSTANTS,
  RETAIL_PRO_CACHE_KEYS
} from '../../types/retailpro'

interface RetailProJobData extends RetailProSyncJob {
  store_sid: string
  type: 'full_sync' | 'incremental_sync' | 'stock_sync' | 'product_sync'
  options: {
    batch_size?: number
    offset?: number
    limit?: number
    force?: boolean
  }
}

export class RetailProWorker {
  private retailProService: RetailProService
  private logger = sapLogger.child({ worker: 'RetailProWorker' })

  constructor() {
    this.retailProService = new RetailProService({
      baseUrl: process.env.RETAIL_PRO_BASE_URL || 'http://macserver-pdv.maconequi.local',
      timeout: RETAIL_PRO_CONSTANTS.DEFAULT_TIMEOUT,
      maxRetries: RETAIL_PRO_CONSTANTS.MAX_RETRIES,
      batchSize: RETAIL_PRO_CONSTANTS.DEFAULT_BATCH_SIZE,
      stores: {
        resende: RETAIL_PRO_CONSTANTS.STORES.RESENDE
      }
    })
  }

  async process(job: Job<RetailProJobData>) {
    const { type, store_sid, options } = job.data

    this.logger.info(`Processing RetailPro job: ${type}`, {
      jobId: job.id,
      store_sid,
      options
    })

    try {
      // Acquire distributed lock to prevent concurrent processing
      const lockAcquired = await this.retailProService.acquireSyncLock(store_sid, 600) // 10 minutes
      if (!lockAcquired) {
        this.logger.warn('Could not acquire sync lock, job will be retried', { store_sid, type })
        throw new Error('Sync lock not available')
      }

      // Update sync status
      await this.retailProService.updateSyncStatus(store_sid, {
        status: 'syncing'
      })

      let result: any
      switch (type) {
        case 'full_sync':
          result = await this.syncFullStore(store_sid, options)
          break

        case 'incremental_sync':
          result = await this.syncIncremental(store_sid, options)
          break

        case 'stock_sync':
          result = await this.syncStockOnly(store_sid, options)
          break

        case 'product_sync':
          result = await this.syncProductsOnly(store_sid, options)
          break

        default:
          throw new Error(`Unknown RetailPro job type: ${type}`)
      }

      // Update sync status on success
      await this.retailProService.updateSyncStatus(store_sid, {
        status: 'completed',
        last_product_sync: ['full_sync', 'incremental_sync', 'product_sync'].includes(type) ? new Date() : undefined,
        last_stock_sync: ['full_sync', 'incremental_sync', 'stock_sync'].includes(type) ? new Date() : undefined
      })

      this.logger.info(`RetailPro job ${type} completed successfully`, {
        jobId: job.id,
        store_sid,
        result
      })

      return result
    } catch (error: any) {
      this.logger.error(`RetailPro job ${type} failed:`, error)

      // Update sync status on error
      await this.retailProService.updateSyncStatus(store_sid, {
        status: 'error',
        errors: (await this.retailProService.getSyncStatus(store_sid)).errors + 1
      })

      await logIntegration('retailpro', `${type}-${store_sid}`, 'error', {
        error: error.message,
        store_sid,
        options
      }, error.message)

      throw error
    } finally {
      // Always release the lock
      await this.retailProService.releaseSyncLock(store_sid)
    }
  }

  /**
   * Full synchronization - products and stock
   */
  private async syncFullStore(store_sid: string, options: any): Promise<any> {
    this.logger.info('Starting full store sync', { store_sid })

    const startTime = Date.now()
    const stats = {
      products_processed: 0,
      products_created: 0,
      products_updated: 0,
      stock_processed: 0,
      stock_created: 0,
      stock_updated: 0,
      errors: 0
    }

    try {
      // Step 1: Sync all products
      const productResult = await this.syncAllProducts(store_sid, options)
      stats.products_processed = productResult.processed
      stats.products_created = productResult.created
      stats.products_updated = productResult.updated
      stats.errors += productResult.errors

      // Step 2: Sync stock for all products
      const stockResult = await this.syncAllStock(store_sid, options)
      stats.stock_processed = stockResult.processed
      stats.stock_created = stockResult.created
      stats.stock_updated = stockResult.updated
      stats.errors += stockResult.errors

      const duration = Date.now() - startTime

      this.logger.info('Full store sync completed', {
        store_sid,
        stats,
        duration
      })

      await logIntegration('retailpro', 'full-sync', 'success', {
        store_sid,
        stats,
        duration
      })

      return { type: 'full_sync', stats, duration }
    } catch (error) {
      this.logger.error('Full store sync failed', { store_sid, error })
      throw error
    }
  }

  /**
   * Incremental synchronization - only changed data
   */
  private async syncIncremental(store_sid: string, options: any): Promise<any> {
    this.logger.info('Starting incremental sync', { store_sid })

    const syncStatus = await this.retailProService.getSyncStatus(store_sid)
    const lastSync = syncStatus.last_product_sync || syncStatus.last_stock_sync

    if (!lastSync) {
      this.logger.info('No previous sync found, performing full sync', { store_sid })
      return await this.syncFullStore(store_sid, options)
    }

    // For now, Retail Pro doesn't have delta endpoints, so we'll do a smart incremental
    // This could be optimized based on Retail Pro's capabilities
    const result = await this.syncStockOnly(store_sid, { ...options, force: true })

    this.logger.info('Incremental sync completed', { store_sid, result })
    return result
  }

  /**
   * Stock synchronization only
   */
  private async syncStockOnly(store_sid: string, options: any): Promise<any> {
    this.logger.info('Starting stock sync', { store_sid })

    const startTime = Date.now()
    const stats = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      critical_alerts: 0,
      zero_stock_alerts: 0
    }

    try {
      // Get all products that need stock sync
      const { data: products } = await supabase
        .from(Tables.PRODUTOS)
        .select('id, retail_id, sku, nome')
        .not('retail_id', 'is', null)
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      if (!products || products.length === 0) {
        this.logger.info('No products found for stock sync', { store_sid })
        return { type: 'stock_sync', stats, duration: Date.now() - startTime }
      }

      const productSids = products.map(p => p.retail_id)
      this.logger.info(`Processing stock for ${productSids.length} products`, { store_sid })

      // Process in batches
      const batchSize = options.batch_size || RETAIL_PRO_CONSTANTS.DEFAULT_BATCH_SIZE
      const batches = this.chunkArray(productSids, batchSize)

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        this.logger.debug(`Processing stock batch ${i + 1}/${batches.length}`, { 
          store_sid,
          batchSize: batch.length 
        })

        const batchResult = await this.retailProService.getProductsStockBatch(batch, store_sid)
        
        // Transform to database format
        const stockEntities = batchResult.success.map(stock => 
          this.transformStockToEntity(stock, products.find(p => p.retail_id === stock.store_sid))
        ).filter(Boolean)

        // Upsert to database
        if (stockEntities.length > 0) {
          const { success, failed } = await batchUpsert(
            Tables.ESTOQUE,
            stockEntities,
            ['produto_id', 'loja_sid'],
            50
          )

          stats.processed += batchResult.success.length
          stats.created += success
          stats.updated += success // For upsert, we count as updated
          stats.errors += failed + batchResult.errors.length
        }

        // Process critical stock alerts
        const criticalStock = batchResult.success.filter(stock => 
          stock.status === 'low_stock' || stock.status === 'out_of_stock'
        )
        
        if (criticalStock.length > 0) {
          await this.processCriticalStock(criticalStock, store_sid)
          stats.critical_alerts += criticalStock.length
        }

        // Process zero stock alerts
        const zeroStock = batchResult.success.filter(stock => 
          stock.status === 'out_of_stock' && stock.quantity === 0
        )
        
        if (zeroStock.length > 0) {
          await this.processZeroStock(zeroStock, store_sid)
          stats.zero_stock_alerts += zeroStock.length
        }

        // Update progress
        await this.retailProService.updateSyncStatus(store_sid, {
          stock_synced: stats.processed
        })

        // Rate limiting between batches
        if (i < batches.length - 1) {
          await this.delay(1000) // 1 second between batches
        }
      }

      const duration = Date.now() - startTime

      this.logger.info('Stock sync completed', {
        store_sid,
        stats,
        duration
      })

      await logIntegration('retailpro', 'stock-sync', 'success', {
        store_sid,
        stats,
        duration
      })

      return { type: 'stock_sync', stats, duration }
    } catch (error) {
      this.logger.error('Stock sync failed', { store_sid, error })
      throw error
    }
  }

  /**
   * Product synchronization only
   */
  private async syncProductsOnly(store_sid: string, options: any): Promise<any> {
    this.logger.info('Starting product sync', { store_sid })

    const result = await this.syncAllProducts(store_sid, options)

    this.logger.info('Product sync completed', { store_sid, result })
    return { type: 'product_sync', ...result }
  }

  /**
   * Sync all products from Retail Pro
   */
  private async syncAllProducts(store_sid: string, options: any): Promise<any> {
    const stats = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0
    }

    const batchSize = options.batch_size || RETAIL_PRO_CONSTANTS.DEFAULT_BATCH_SIZE
    let offset = options.offset || 0
    let hasMore = true

    while (hasMore) {
      try {
        this.logger.debug(`Fetching products batch`, { store_sid, offset, batchSize })

        const response = await this.retailProService.getProducts(store_sid, {
          limit: batchSize,
          offset
        })

        if (!response.data || response.data.length === 0) {
          hasMore = false
          break
        }

        // Transform to database format
        const productEntities = response.data.map(product => 
          this.transformProductToEntity(product)
        )

        // Upsert to database
        const { success, failed } = await batchUpsert(
          Tables.PRODUTOS,
          productEntities,
          ['retail_id'],
          50
        )

        stats.processed += response.data.length
        stats.created += success
        stats.errors += failed

        // Update progress
        await this.retailProService.updateSyncStatus(store_sid, {
          products_synced: stats.processed
        })

        offset += batchSize
        
        // Check if we have more data
        hasMore = response.data.length === batchSize

        // Rate limiting
        if (hasMore) {
          await this.delay(500) // 500ms between batches
        }

      } catch (error) {
        this.logger.error('Error in product batch sync', { store_sid, offset, error })
        stats.errors++
        
        // Continue with next batch
        offset += batchSize
      }
    }

    return stats
  }

  /**
   * Sync all stock from Retail Pro
   */
  private async syncAllStock(store_sid: string, options: any): Promise<any> {
    // This would be called after syncAllProducts
    // For now, we'll use the existing syncStockOnly method
    return await this.syncStockOnly(store_sid, options)
  }

  /**
   * Transform Retail Pro product to database entity
   */
  private transformProductToEntity(product: any): RetailProProductEntity {
    return {
      id: crypto.randomUUID(),
      retail_id: product.sid,
      sku: product.alu,
      nome: [product.description1, product.description2].filter(Boolean).join(' ').trim(),
      descricao: product.description2 || null,
      categoria: 'Geral', // Default category
      marca: product.vendor_name || 'Sem marca',
      preco: product.price || null,
      custo: product.cost || null,
      upc: product.upc || null,
      ativo: product.active !== false,
      metadata: {
        retail_pro: {
          sid: product.sid,
          alu: product.alu,
          description1: product.description1,
          description2: product.description2,
          vendor_name: product.vendor_name,
          last_sync: new Date().toISOString()
        }
      },
      created_at: new Date(),
      updated_at: new Date()
    }
  }

  /**
   * Transform Retail Pro stock to database entity
   */
  private transformStockToEntity(stock: ProcessedRetailProStock, product?: any): RetailProEstoqueEntity | null {
    if (!product) {
      return null
    }

    return {
      id: crypto.randomUUID(),
      produto_id: product.id,
      loja_sid: stock.store_sid,
      loja_nome: stock.store_name,
      quantidade: stock.quantity,
      quantidade_minima: stock.minimum_quantity,
      quantidade_pedido: stock.po_ordered_quantity,
      quantidade_recebida: stock.po_received_quantity,
      status: this.mapStockStatus(stock.status),
      ultima_atualizacao: stock.last_updated,
      metadata: {
        retail_pro: {
          store_sid: stock.store_sid,
          last_sync: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Map stock status to database format
   */
  private mapStockStatus(status: string): 'disponivel' | 'indisponivel' | 'baixo_estoque' | 'sem_dados' {
    switch (status) {
      case 'in_stock':
        return 'disponivel'
      case 'out_of_stock':
        return 'indisponivel'
      case 'low_stock':
        return 'baixo_estoque'
      case 'no_data':
      default:
        return 'sem_dados'
    }
  }

  /**
   * Process critical stock alerts
   */
  private async processCriticalStock(criticalStock: ProcessedRetailProStock[], store_sid: string): Promise<void> {
    for (const stock of criticalStock) {
      await notificationQueue.add('retail-pro-critical-stock', {
        store_sid,
        store_name: stock.store_name,
        quantity: stock.quantity,
        minimum_quantity: stock.minimum_quantity,
        status: stock.status,
        timestamp: new Date().toISOString(),
        priority: 'HIGH'
      }, {
        priority: 20,
        attempts: 3,
        delay: 5000 // 5 second delay
      })
    }

    this.logger.warn(`Queued ${criticalStock.length} critical stock alerts`, { store_sid })
  }

  /**
   * Process zero stock alerts
   */
  private async processZeroStock(zeroStock: ProcessedRetailProStock[], store_sid: string): Promise<void> {
    for (const stock of zeroStock) {
      await criticalStockQueue.add('retail-pro-zero-stock', {
        store_sid,
        store_name: stock.store_name,
        quantity: stock.quantity,
        status: stock.status,
        timestamp: new Date().toISOString(),
        priority: 'CRITICAL'
      }, {
        priority: 30, // Highest priority
        attempts: 10,
        delay: 1000 // 1 second delay
      })
    }

    this.logger.error(`Queued ${zeroStock.length} ZERO STOCK alerts`, { store_sid })
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
}

// Setup queue configuration
const retailProQueue = require('../../config/queues').retailProQueue || 
  require('bull')('retailpro-sync', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    }
  })

// Register worker processors
retailProQueue.process('retailpro-sync', 2, async (job: Job<RetailProJobData>) => {
  const worker = new RetailProWorker()
  await worker.process(job)
})

export { RetailProWorker, retailProQueue }