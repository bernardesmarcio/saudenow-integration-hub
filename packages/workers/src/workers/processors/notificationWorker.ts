import { Job } from 'bull';
import { notificationQueue } from '../../config/queues';
import { alertManager } from '../../lib/monitoring/alertManager';
import { alertLogger } from '../../lib/logger';

interface NotificationJobData {
  type: 'estoque-zero' | 'estoque-critico' | 'sap-offline' | 'queue-backlog';
  produtoId?: string;
  produto?: any;
  sku?: string;
  quantidade?: number;
  deposito?: string;
  queueName?: string;
  backlog?: number;
  duration?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export class NotificationWorker {
  async process(job: Job<NotificationJobData>) {
    const { type, priority, timestamp, ...data } = job.data;

    alertLogger.info(`Processing notification: ${type}`, {
      jobId: job.id,
      type,
      priority,
      timestamp,
    });

    try {
      switch (type) {
        case 'estoque-zero':
          await this.processEstoqueZeroAlert(data);
          break;

        case 'estoque-critico':
          await this.processEstoqueCriticoAlert(data);
          break;

        case 'sap-offline':
          await this.processSapOfflineAlert(data);
          break;

        case 'queue-backlog':
          await this.processQueueBacklogAlert(data);
          break;

        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      alertLogger.info(`Notification ${type} processed successfully`);
    } catch (error: any) {
      alertLogger.error(`Notification ${type} failed:`, error);
      throw error;
    }
  }

  private async processEstoqueZeroAlert(data: any): Promise<void> {
    alertLogger.error('Processing ZERO STOCK alert', data);

    await alertManager.createStockAlert('estoque-zero', {
      produtoId: data.produtoId,
      produto: data.produto,
      sku: data.sku,
      quantidade: 0,
      deposito: data.deposito,
    });
  }

  private async processEstoqueCriticoAlert(data: any): Promise<void> {
    alertLogger.warn('Processing CRITICAL STOCK alert', data);

    await alertManager.createStockAlert('estoque-critico', {
      produtoId: data.produtoId,
      produto: data.produto,
      sku: data.sku,
      quantidade: data.quantidade,
      deposito: data.deposito,
    });
  }

  private async processSapOfflineAlert(data: any): Promise<void> {
    alertLogger.error('Processing SAP OFFLINE alert', data);

    await alertManager.createSapOfflineAlert(data.duration || 0);
  }

  private async processQueueBacklogAlert(data: any): Promise<void> {
    alertLogger.warn('Processing QUEUE BACKLOG alert', data);

    await alertManager.createQueueBacklogAlert(
      data.queueName || 'unknown',
      data.backlog || 0
    );
  }
}

// Register notification worker
notificationQueue.process('*', async (job) => {
  const worker = new NotificationWorker();
  await worker.process(job);
});