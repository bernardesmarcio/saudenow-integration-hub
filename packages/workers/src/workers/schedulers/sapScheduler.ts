import * as cron from "node-cron";
import {
  sapSyncQueue,
  sapEstoqueQueue,
  criticalStockQueue,
  integrationQueue,
  notificationQueue,
} from "../../config/queues";
import { getLastSyncTimestamp } from "../../config/database";
import { workerLogger } from "../../lib/logger";
import { getQueueStats } from "../../config/queues";
import { alertManager } from "../../lib/monitoring/alertManager";

export class SapScheduler {
  private jobs: cron.ScheduledTask[] = [];

  start(): void {
    workerLogger.info("Starting SAP schedulers...");

    // ESTOQUE REALTIME - CRITICAL (Every 2 minutes)
    const estoqueJob = cron.schedule("*/2 * * * *", async () => {
      try {
        const lastSync = await getLastSyncTimestamp(
          "sap",
          "sync-estoque-delta",
        );

        await sapEstoqueQueue.add(
          "sync-estoque-delta",
          {
            type: "sync-estoque-delta",
            lastSync,
          },
          {
            priority: 10, // High priority
            attempts: 5,
          },
        );

        workerLogger.info("Estoque delta sync scheduled", { lastSync });
      } catch (error) {
        workerLogger.error("Failed to schedule estoque delta sync:", error);
      }
    });

    // ESTOQUE CRÍTICO - ULTRA HIGH PRIORITY (Every 1 minute)
    const estoqueCriticoJob = cron.schedule("*/1 * * * *", async () => {
      try {
        await criticalStockQueue.add(
          "sync-estoque-criticos",
          {
            type: "sync-estoque-criticos",
            threshold: 10,
          },
          {
            priority: 20, // Highest priority
            attempts: 10,
          },
        );

        workerLogger.debug("Critical stock sync scheduled");
      } catch (error) {
        workerLogger.error("Failed to schedule critical stock sync:", error);
      }
    });

    // PRODUTOS (Every 30 minutes)
    const produtosJob = cron.schedule("*/30 * * * *", async () => {
      try {
        const lastSync = await getLastSyncTimestamp(
          "sap",
          "sync-produtos-delta",
        );

        await sapSyncQueue.add(
          "sync-produtos-delta",
          {
            type: "sync-produtos-delta",
            lastSync,
          },
          {
            priority: 5,
            attempts: 3,
          },
        );

        workerLogger.info("Produtos delta sync scheduled", { lastSync });
      } catch (error) {
        workerLogger.error("Failed to schedule produtos sync:", error);
      }
    });

    // CLIENTES (Every hour)
    const clientesJob = cron.schedule("0 * * * *", async () => {
      try {
        const lastSync = await getLastSyncTimestamp(
          "sap",
          "sync-clientes-delta",
        );

        await sapSyncQueue.add(
          "sync-clientes-delta",
          {
            type: "sync-clientes-delta",
            lastSync,
          },
          {
            priority: 3,
            attempts: 3,
          },
        );

        workerLogger.info("Clientes delta sync scheduled", { lastSync });
      } catch (error) {
        workerLogger.error("Failed to schedule clientes sync:", error);
      }
    });

    // VENDAS (Every 10 minutes)
    const vendasJob = cron.schedule("*/10 * * * *", async () => {
      try {
        const lastSync = await getLastSyncTimestamp("sap", "sync-vendas-delta");

        await sapSyncQueue.add(
          "sync-vendas-delta",
          {
            type: "sync-vendas-delta",
            lastSync,
          },
          {
            priority: 4,
            attempts: 3,
          },
        );

        workerLogger.info("Vendas delta sync scheduled", { lastSync });
      } catch (error) {
        workerLogger.error("Failed to schedule vendas sync:", error);
      }
    });

    // FULL SYNC (Daily at 2 AM)
    const fullSyncJob = cron.schedule("0 2 * * *", async () => {
      try {
        await sapSyncQueue.add(
          "full-sync",
          {
            type: "full-sync",
            force: true,
          },
          {
            priority: 1,
            attempts: 5,
            delay: 5000, // 5 second delay to ensure other jobs complete
          },
        );

        workerLogger.info("Full sync scheduled");
      } catch (error) {
        workerLogger.error("Failed to schedule full sync:", error);
      }
    });

    // PRELOAD POPULAR PRODUCTS (Every 6 hours)
    const preloadJob = cron.schedule("0 */6 * * *", async () => {
      try {
        await sapEstoqueQueue.add(
          "preload-popular",
          {
            type: "preload-popular",
          },
          {
            priority: 1,
            attempts: 2,
          },
        );

        workerLogger.info("Popular products preload scheduled");
      } catch (error) {
        workerLogger.error("Failed to schedule preload:", error);
      }
    });

    // QUEUE MONITORING (Every 5 minutes)
    const monitoringJob = cron.schedule("*/5 * * * *", async () => {
      try {
        await this.monitorQueues();
      } catch (error) {
        workerLogger.error("Queue monitoring failed:", error);
      }
    });

    // CLEANUP OLD JOBS (Every 6 hours)
    const cleanupJob = cron.schedule("0 */6 * * *", async () => {
      try {
        await this.cleanupOldJobs();
      } catch (error) {
        workerLogger.error("Job cleanup failed:", error);
      }
    });

    // Store job references
    this.jobs = [
      estoqueJob,
      estoqueCriticoJob,
      produtosJob,
      clientesJob,
      vendasJob,
      fullSyncJob,
      preloadJob,
      monitoringJob,
      cleanupJob,
    ];

    // Start all jobs
    this.jobs.forEach((job) => job.start());

    workerLogger.info(
      `${this.jobs.length} SAP schedulers started successfully`,
    );
  }

  stop(): void {
    workerLogger.info("Stopping SAP schedulers...");

    this.jobs.forEach((job) => {
      if (job) {
        job.stop();
      }
    });

    this.jobs = [];
    workerLogger.info("All SAP schedulers stopped");
  }

  private async monitorQueues(): Promise<void> {
    try {
      const stats = await getQueueStats();

      for (const [queueName, queueStats] of Object.entries(stats)) {
        const { waiting, active, failed } = queueStats as any;
        const backlog = waiting + active;

        // Alert on high backlog
        if (backlog > 1000) {
          await alertManager.createQueueBacklogAlert(queueName, backlog);
        }

        // Log queue stats periodically
        if (backlog > 100 || failed > 10) {
          workerLogger.warn(`Queue ${queueName} stats`, queueStats);
        }
      }
    } catch (error) {
      workerLogger.error("Queue monitoring error:", error);
    }
  }

  private async cleanupOldJobs(): Promise<void> {
    try {
      const queues = [
        sapSyncQueue,
        sapEstoqueQueue,
        criticalStockQueue,
        integrationQueue,
        notificationQueue,
      ];

      for (const queue of queues) {
        // Clean completed jobs older than 24 hours
        await queue.clean(24 * 60 * 60 * 1000, "completed");

        // Clean failed jobs older than 7 days
        await queue.clean(7 * 24 * 60 * 60 * 1000, "failed");
      }

      workerLogger.info("Old jobs cleaned successfully");
    } catch (error) {
      workerLogger.error("Job cleanup error:", error);
    }
  }

  getStatus(): { running: boolean; jobCount: number } {
    return {
      running: this.jobs.length > 0,
      jobCount: this.jobs.length,
    };
  }
}
