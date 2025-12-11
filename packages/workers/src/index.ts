import { setupWorkers, shutdownWorkers } from "./workers/processors";
import { SapScheduler } from "./workers/schedulers/sapScheduler";
import { sapWebhookServer } from "./webhooks/sapWebhook";
import { isRedisHealthy } from "./config/redis";
import { isDatabaseHealthy } from "./config/database";
import logger from "./lib/logger";
import environment from "./config/environment";
import express from "express";

class WorkerManager {
  private sapScheduler: SapScheduler;
  private isShuttingDown = false;
  private healthServer: express.Application;

  constructor() {
    this.sapScheduler = new SapScheduler();
    this.healthServer = express();
    this.setupHealthEndpoints();
  }

  private setupHealthEndpoints(): void {
    this.healthServer.get("/health", async (req, res) => {
      try {
        const redisHealthy = await isRedisHealthy();
        const dbHealthy = await isDatabaseHealthy();

        const status = {
          status: "ok",
          timestamp: new Date().toISOString(),
          services: {
            redis: redisHealthy ? "healthy" : "unhealthy",
            database: dbHealthy ? "healthy" : "unhealthy",
            workers: !this.isShuttingDown ? "running" : "shutting_down",
          },
          schedulers: this.sapScheduler.getStatus(),
        };

        const isHealthy = redisHealthy && dbHealthy && !this.isShuttingDown;
        res.status(isHealthy ? 200 : 503).json(status);
      } catch (error) {
        res.status(503).json({
          status: "error",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    this.healthServer.get("/status", (req, res) => {
      res.json(this.getStatus());
    });
  }

  async start(): Promise<void> {
    logger.info("🚀 Starting SaúdeNow Workers...");

    try {
      // Health checks
      await this.performHealthChecks();

      // Setup workers
      logger.info("Setting up worker processors...");
      await setupWorkers();

      // Start schedulers
      logger.info("Starting SAP schedulers...");
      this.sapScheduler.start();

      // Start webhook server (optional)
      try {
        logger.info("Starting SAP webhook server...");
        await sapWebhookServer.start(3002);
      } catch (error) {
        logger.warn("Webhook server failed to start (optional):", error);
      }

      // Start health check server
      logger.info("Starting health check server...");
      this.healthServer.listen(4000, () => {
        logger.info("Health check server listening on port 4000");
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info("✅ Workers started successfully!");
      this.logSystemStatus();
    } catch (error: any) {
      logger.error("❌ Failed to start workers:", error);
      process.exit(1);
    }
  }

  private async performHealthChecks(): Promise<void> {
    logger.info("🔍 Performing health checks...");

    // Check Redis
    const redisHealthy = await isRedisHealthy();
    if (!redisHealthy) {
      throw new Error("Redis health check failed");
    }
    logger.info("✅ Redis is healthy");

    // Check Database
    const dbHealthy = await isDatabaseHealthy();
    if (!dbHealthy) {
      throw new Error("Database health check failed");
    }
    logger.info("✅ Database is healthy");

    logger.info("✅ All health checks passed");
  }

  private setupGracefulShutdown(): void {
    const signals = ["SIGTERM", "SIGINT", "SIGUSR2"];

    signals.forEach((signal) => {
      process.on(signal, () => {
        if (this.isShuttingDown) {
          logger.warn("Force shutdown initiated");
          process.exit(1);
        }

        this.gracefulShutdown(signal);
      });
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception:", error);
      this.gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled rejection at:", promise, "reason:", reason);
      this.gracefulShutdown("unhandledRejection");
    });
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    this.isShuttingDown = true;

    logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

    try {
      // Stop schedulers first
      logger.info("Stopping schedulers...");
      this.sapScheduler.stop();

      // Stop webhook server
      logger.info("Stopping webhook server...");
      await sapWebhookServer.stop();

      // Shutdown workers and connections
      logger.info("Shutting down workers...");
      await shutdownWorkers();

      logger.info("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  }

  private logSystemStatus(): void {
    const { running, jobCount } = this.sapScheduler.getStatus();

    logger.info("📊 System Status:", {
      environment: environment.NODE_ENV,
      schedulers: {
        running,
        jobCount,
      },
      redis: environment.redis.url,
      database: environment.database.url,
    });

    logger.info("📋 Scheduler Overview:");
    logger.info("   🎯 Estoque Delta: Every 2 minutes (CRITICAL)");
    logger.info("   🔥 Estoque Crítico: Every 1 minute (ULTRA HIGH)");
    logger.info("   📦 Produtos: Every 30 minutes");
    logger.info("   👥 Clientes: Every hour");
    logger.info("   🛒 Vendas: Every 10 minutes");
    logger.info("   🔄 Full Sync: Daily at 2 AM");
    logger.info("   🧹 Cleanup: Every 6 hours");
  }

  getStatus() {
    return {
      isRunning: !this.isShuttingDown,
      schedulers: this.sapScheduler.getStatus(),
      environment: environment.NODE_ENV,
    };
  }
}

// Start the worker manager
async function main() {
  const workerManager = new WorkerManager();
  await workerManager.start();
}

// Only start if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    logger.error("Fatal error starting workers:", error);
    process.exit(1);
  });
}

export { WorkerManager };
export default main;
