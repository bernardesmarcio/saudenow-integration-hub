import { workerLogger } from "../../lib/logger";
import "./notificationWorker"; // Import to register processors
import "../integrations/sapWorker"; // Import to register processors
import "../integrations/sapEstoqueWorker"; // Import to register processors

// Import other workers as they're created
// import './healthCheckWorker';
// import './maintenanceWorker';

export async function setupWorkers(): Promise<void> {
  workerLogger.info("Setting up workers...");

  // Workers are automatically registered when imported
  // This happens due to the processor registration at the bottom of each worker file

  workerLogger.info("All workers setup completed");
}

export async function shutdownWorkers(): Promise<void> {
  workerLogger.info("Shutting down workers...");

  // Import and close queues
  const { closeQueues } = await import("../../config/queues");
  await closeQueues();

  // Close Redis connections
  const { closeRedisConnections } = await import("../../config/redis");
  await closeRedisConnections();

  workerLogger.info("Workers shutdown completed");
}
