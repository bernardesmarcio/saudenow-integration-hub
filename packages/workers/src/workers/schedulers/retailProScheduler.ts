import * as cron from "node-cron";
import { retailProQueue } from "../../config/queues";
import { getLastSyncTimestamp } from "../../config/database";
import { workerLogger } from "../../lib/logger";
import { getQueueStats } from "../../config/queues";
import { alertManager } from "../../lib/monitoring/alertManager";
import { RetailProService } from "../../services/integrations/retailProService";
import { RETAIL_PRO_CONSTANTS } from "../../types/retailpro";

export class RetailProScheduler {
  private jobs: cron.ScheduledTask[] = [];
  private retailProService: RetailProService;
  private logger = workerLogger.child({ scheduler: "RetailProScheduler" });

  constructor() {
    this.retailProService = new RetailProService({
      baseUrl:
        process.env.RETAIL_PRO_BASE_URL ||
        "http://macserver-pdv.maconequi.local",
      timeout: RETAIL_PRO_CONSTANTS.DEFAULT_TIMEOUT,
      maxRetries: RETAIL_PRO_CONSTANTS.MAX_RETRIES,
      batchSize: RETAIL_PRO_CONSTANTS.DEFAULT_BATCH_SIZE,
      stores: {
        resende: {
          id: RETAIL_PRO_CONSTANTS.STORES.RESENDE.ID,
          name: RETAIL_PRO_CONSTANTS.STORES.RESENDE.NAME,
          sid: RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID,
          active: true,
        },
      },
    });
  }

  start(): void {
    this.logger.info("Starting Retail Pro schedulers...");

    // STOCK SYNC - HIGH PRIORITY (Every 15 minutes)
    const stockSyncJob = cron.schedule("*/15 * * * *", async () => {
      try {
        const storeSid = RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID;

        await retailProQueue.add(
          "retailpro-sync",
          {
            type: "stock_sync",
            store_sid: storeSid,
            options: {
              batch_size: 100,
              force: false,
            },
            metadata: {
              triggered_by: "scheduler",
              priority: "high",
            },
          },
          {
            priority: 15, // High priority for stock
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
          },
        );

        this.logger.info("Stock sync scheduled", { storeSid });
      } catch (error) {
        this.logger.error("Failed to schedule stock sync:", error);
      }
    });

    // INCREMENTAL SYNC (Every 2 hours)
    const incrementalSyncJob = cron.schedule("0 */2 * * *", async () => {
      try {
        const storeSid = RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID;
        const lastSync = await getLastSyncTimestamp(
          "retailpro",
          "incremental-sync",
        );

        await retailProQueue.add(
          "retailpro-sync",
          {
            type: "incremental_sync",
            store_sid: storeSid,
            options: {
              batch_size: 200,
              force: false,
            },
            metadata: {
              triggered_by: "scheduler",
              priority: "medium",
              last_sync: lastSync,
            },
          },
          {
            priority: 10,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 10000,
            },
          },
        );

        this.logger.info("Incremental sync scheduled", { storeSid, lastSync });
      } catch (error) {
        this.logger.error("Failed to schedule incremental sync:", error);
      }
    });

    // PRODUCT SYNC (Every 6 hours)
    const productSyncJob = cron.schedule("0 */6 * * *", async () => {
      try {
        const storeSid = RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID;

        await retailProQueue.add(
          "retailpro-sync",
          {
            type: "product_sync",
            store_sid: storeSid,
            options: {
              batch_size: 500,
              force: false,
            },
            metadata: {
              triggered_by: "scheduler",
              priority: "medium",
            },
          },
          {
            priority: 8,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 15000,
            },
          },
        );

        this.logger.info("Product sync scheduled", { storeSid });
      } catch (error) {
        this.logger.error("Failed to schedule product sync:", error);
      }
    });

    // FULL SYNC (Daily at 3 AM - after SAP full sync)
    const fullSyncJob = cron.schedule("0 3 * * *", async () => {
      try {
        const storeSid = RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID;

        await retailProQueue.add(
          "retailpro-sync",
          {
            type: "full_sync",
            store_sid: storeSid,
            options: {
              batch_size: 500,
              force: true,
            },
            metadata: {
              triggered_by: "scheduler",
              priority: "medium",
            },
          },
          {
            priority: 5,
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 30000,
            },
            delay: 10000, // 10 second delay to ensure other systems are ready
          },
        );

        this.logger.info("Full sync scheduled", { storeSid });
      } catch (error) {
        this.logger.error("Failed to schedule full sync:", error);
      }
    });

    // HEALTH CHECK (Every 10 minutes)
    const healthCheckJob = cron.schedule("*/10 * * * *", async () => {
      try {
        const isHealthy = await this.retailProService.healthCheck();

        if (!isHealthy) {
          await alertManager.createHealthAlert("retailpro", "unhealthy", {
            message: "Retail Pro API is not responding",
            timestamp: new Date().toISOString(),
          });

          this.logger.warn("Retail Pro health check failed");
        } else {
          this.logger.debug("Retail Pro health check passed");
        }
      } catch (error) {
        this.logger.error("Health check failed:", error);
      }
    });

    // CACHE WARM-UP (Every 4 hours)
    const cacheWarmupJob = cron.schedule("0 */4 * * *", async () => {
      try {
        const storeSid = RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID;

        // Warm up cache with most accessed products
        await this.warmUpCache(storeSid);

        this.logger.info("Cache warm-up completed", { storeSid });
      } catch (error) {
        this.logger.error("Cache warm-up failed:", error);
      }
    });

    // CRITICAL STOCK MONITORING (Every 5 minutes)
    const criticalStockJob = cron.schedule("*/5 * * * *", async () => {
      try {
        await this.monitorCriticalStock();
      } catch (error) {
        this.logger.error("Critical stock monitoring failed:", error);
      }
    });

    // SYNC STATUS CLEANUP (Every hour)
    const statusCleanupJob = cron.schedule("0 * * * *", async () => {
      try {
        await this.cleanupSyncStatus();
      } catch (error) {
        this.logger.error("Sync status cleanup failed:", error);
      }
    });

    // METRICS COLLECTION (Every 30 minutes)
    const metricsJob = cron.schedule("*/30 * * * *", async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        this.logger.error("Metrics collection failed:", error);
      }
    });

    // QUEUE MONITORING (Every 5 minutes)
    const queueMonitoringJob = cron.schedule("*/5 * * * *", async () => {
      try {
        await this.monitorQueues();
      } catch (error) {
        this.logger.error("Queue monitoring failed:", error);
      }
    });

    // Store job references
    this.jobs = [
      stockSyncJob,
      incrementalSyncJob,
      productSyncJob,
      fullSyncJob,
      healthCheckJob,
      cacheWarmupJob,
      criticalStockJob,
      statusCleanupJob,
      metricsJob,
      queueMonitoringJob,
    ];

    // Start all jobs
    this.jobs.forEach((job) => job.start());

    this.logger.info(
      `${this.jobs.length} Retail Pro schedulers started successfully`,
    );
  }

  stop(): void {
    this.logger.info("Stopping Retail Pro schedulers...");

    this.jobs.forEach((job) => {
      if (job) {
        job.stop();
      }
    });

    this.jobs = [];
    this.logger.info("All Retail Pro schedulers stopped");
  }

  private async warmUpCache(storeSid: string): Promise<void> {
    try {
      // Get most frequently accessed products (this would come from analytics in real implementation)
      const popularProductSids = await this.getPopularProducts(storeSid);

      if (popularProductSids.length > 0) {
        // Preload products to cache
        const batchResult = await this.retailProService.getProductsStockBatch(
          popularProductSids.slice(0, 100), // Top 100 products
          storeSid,
        );

        this.logger.info("Cache warmed up", {
          storeSid,
          products: popularProductSids.length,
          cached: batchResult.success.length,
        });
      }
    } catch (error) {
      this.logger.error("Error warming up cache", { storeSid, error });
    }
  }

  private async getPopularProducts(_storeSid: string): Promise<string[]> {
    // In real implementation, this would query analytics data
    // For now, return mock data
    return Array.from(
      { length: 50 },
      (_, i) => `${(i + 1).toString().padStart(10, "0")}`,
    );
  }

  private async monitorCriticalStock(): Promise<void> {
    try {
      const storeSid = RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID;

      // This would query the database for critical stock items
      // For now, we'll implement basic monitoring

      const syncStatus = await this.retailProService.getSyncStatus(storeSid);

      if (syncStatus.errors > 10) {
        await alertManager.createSyncAlert("retailpro", "high_error_rate", {
          store_sid: storeSid,
          error_count: syncStatus.errors,
          message: `High error rate detected: ${syncStatus.errors} errors`,
        });
      }

      this.logger.debug("Critical stock monitoring completed", { storeSid });
    } catch (error) {
      this.logger.error("Error monitoring critical stock", { error });
    }
  }

  private async cleanupSyncStatus(): Promise<void> {
    try {
      // Clean up old sync status entries and reset error counters if needed
      const storeSid = RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID;

      // Reset error count if last error was more than 24 hours ago
      const syncStatus = await this.retailProService.getSyncStatus(storeSid);

      if (syncStatus.errors > 0) {
        const lastSync =
          syncStatus.last_stock_sync || syncStatus.last_product_sync;
        if (lastSync) {
          const hoursSinceLastSync =
            (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);

          if (hoursSinceLastSync > 24) {
            await this.retailProService.updateSyncStatus(storeSid, {
              errors: 0,
            });

            this.logger.info("Reset error count after 24 hours", { storeSid });
          }
        }
      }
    } catch (error) {
      this.logger.error("Error cleaning up sync status", { error });
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const storeSid = RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID;

      // Collect various metrics for monitoring
      const metrics = {
        sync_status: await this.retailProService.getSyncStatus(storeSid),
        circuit_breaker_stats: this.retailProService.getCircuitBreakerStats(),
        cache_stats: await this.getCacheStats(storeSid),
        timestamp: new Date().toISOString(),
      };

      // In real implementation, this would send metrics to monitoring system
      this.logger.debug("Metrics collected", { storeSid, metrics });
    } catch (error) {
      this.logger.error("Error collecting metrics", { error });
    }
  }

  private async getCacheStats(storeSid: string): Promise<any> {
    try {
      // This would integrate with the RetailProCache class
      return {
        hit_rate: 0.85, // Mock data
        miss_rate: 0.15,
        size: 1500,
        ttl_remaining: 3600,
      };
    } catch (error) {
      this.logger.error("Error getting cache stats", { storeSid, error });
      return {};
    }
  }

  private async monitorQueues(): Promise<void> {
    try {
      const stats = await getQueueStats();

      for (const [queueName, queueStats] of Object.entries(stats)) {
        const { waiting, active, failed } = queueStats as any;
        const backlog = waiting + active;

        // Alert on high backlog for Retail Pro queues
        if (queueName.includes("retailpro") && backlog > 500) {
          await alertManager.createQueueBacklogAlert(queueName, backlog);
        }

        // Alert on high failure rate
        if (failed > 50) {
          await alertManager.createQueueFailureAlert(queueName, failed);
        }

        // Log queue stats if concerning
        if (backlog > 100 || failed > 10) {
          this.logger.warn(`Queue ${queueName} stats`, queueStats);
        }
      }
    } catch (error) {
      this.logger.error("Queue monitoring error:", error);
    }
  }

  /**
   * Manually trigger a sync (for administrative purposes)
   */
  async triggerManualSync(
    type: "full_sync" | "incremental_sync" | "stock_sync" | "product_sync",
    priority: "low" | "medium" | "high" | "critical" = "medium",
  ): Promise<string> {
    try {
      const storeSid = RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID;

      const job = await retailProQueue.add(
        "retailpro-sync",
        {
          type,
          store_sid: storeSid,
          options: {
            batch_size: type === "full_sync" ? 500 : 200,
            force: true,
          },
          metadata: {
            triggered_by: "manual",
            priority,
          },
        },
        {
          priority:
            priority === "critical"
              ? 25
              : priority === "high"
                ? 20
                : priority === "medium"
                  ? 15
                  : 10,
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        },
      );

      this.logger.info("Manual sync triggered", {
        type,
        priority,
        storeSid,
        jobId: job.id,
      });

      return job.id?.toString() || "unknown";
    } catch (error) {
      this.logger.error("Failed to trigger manual sync", {
        type,
        priority,
        error,
      });
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    running: boolean;
    jobCount: number;
    jobs: Array<{
      name: string;
      running: boolean;
      nextRun?: Date;
    }>;
  } {
    const jobNames = [
      "Stock Sync (15min)",
      "Incremental Sync (2h)",
      "Product Sync (6h)",
      "Full Sync (Daily 3AM)",
      "Health Check (10min)",
      "Cache Warmup (4h)",
      "Critical Stock Monitor (5min)",
      "Status Cleanup (1h)",
      "Metrics Collection (30min)",
      "Queue Monitoring (5min)",
    ];

    return {
      running: this.jobs.length > 0,
      jobCount: this.jobs.length,
      jobs: this.jobs.map((job, index) => ({
        name: jobNames[index] || `Job ${index + 1}`,
        running: job.getStatus() === "scheduled",
      })),
    };
  }

  /**
   * Get next scheduled run times
   */
  getSchedule(): Array<{
    name: string;
    cron: string;
    description: string;
  }> {
    return [
      {
        name: "Stock Sync",
        cron: "*/15 * * * *",
        description: "Sincronização de estoque a cada 15 minutos",
      },
      {
        name: "Incremental Sync",
        cron: "0 */2 * * *",
        description: "Sincronização incremental a cada 2 horas",
      },
      {
        name: "Product Sync",
        cron: "0 */6 * * *",
        description: "Sincronização de produtos a cada 6 horas",
      },
      {
        name: "Full Sync",
        cron: "0 3 * * *",
        description: "Sincronização completa diariamente às 3h",
      },
      {
        name: "Health Check",
        cron: "*/10 * * * *",
        description: "Verificação de saúde a cada 10 minutos",
      },
    ];
  }
}
