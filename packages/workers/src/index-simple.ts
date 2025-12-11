import express from "express";
import logger from "./lib/logger";

class SimpleWorkerManager {
  private healthServer: express.Application;
  private isShuttingDown = false;

  constructor() {
    this.healthServer = express();
    this.setupHealthEndpoints();
  }

  private setupHealthEndpoints(): void {
    this.healthServer.get("/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          workers: !this.isShuttingDown ? "running" : "shutting_down",
        },
      });
    });

    this.healthServer.get("/status", (req, res) => {
      res.json({
        isRunning: !this.isShuttingDown,
        environment: process.env.NODE_ENV || "development",
        version: "0.1.0",
      });
    });
  }

  async start(): Promise<void> {
    logger.info("🚀 Starting Simple Workers...");

    try {
      // Start health check server
      const port = process.env.PORT || 4000;
      this.healthServer.listen(port, () => {
        logger.info(`Health check server listening on port ${port}`);
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info("✅ Simple Workers started successfully!");
    } catch (error: any) {
      logger.error("❌ Failed to start workers:", error);
      process.exit(1);
    }
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
      logger.info("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  }
}

// Start the worker manager
async function main() {
  const workerManager = new SimpleWorkerManager();
  await workerManager.start();
}

// Only start if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error starting workers:", error);
    process.exit(1);
  });
}

export { SimpleWorkerManager };
export default main;
