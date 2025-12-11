import express from "express";
import { createHmac } from "crypto";
import { sapEstoqueQueue, criticalStockQueue } from "../config/queues";
import { estoqueCache } from "../lib/cache/estoqueCache";
import { workerLogger } from "../lib/logger";
import environment from "../config/environment";

export class SapWebhookServer {
  private app: express.Application;
  private server: any;
  private webhookSecret = environment.webhook?.secret || "your-webhook-secret";

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (_req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // SAP Stock webhook
    this.app.post(
      "/webhooks/sap/estoque",
      this.verifySignature.bind(this),
      this.handleEstoqueWebhook.bind(this),
    );

    // SAP Products webhook
    this.app.post(
      "/webhooks/sap/produtos",
      this.verifySignature.bind(this),
      this.handleProdutosWebhook.bind(this),
    );

    // Fallback
    this.app.use("*", (_req, res) => {
      res.status(404).json({ error: "Webhook endpoint not found" });
    });
  }

  private verifySignature(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void {
    const signature = req.headers["x-sap-signature"] as string;

    if (!signature) {
      workerLogger.warn("Webhook received without signature", {
        path: req.path,
        headers: req.headers,
      });
      res.status(401).json({ error: "Missing signature" });
      return;
    }

    const expectedSignature = createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    const providedSignature = signature.replace("sha256=", "");

    if (expectedSignature !== providedSignature) {
      workerLogger.warn("Invalid webhook signature", {
        path: req.path,
        expected: expectedSignature,
        provided: providedSignature,
      });
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    next();
  }

  private async handleEstoqueWebhook(
    req: express.Request,
    res: express.Response,
  ): Promise<void> {
    try {
      const { event, data } = req.body;

      workerLogger.info("SAP estoque webhook received", {
        event,
        dataCount: Array.isArray(data) ? data.length : 1,
      });

      switch (event) {
        case "stock.updated":
          await this.processStockUpdate(data);
          break;

        case "stock.depleted":
          await this.processStockDepletion(data);
          break;

        case "stock.critical":
          await this.processStockCritical(data);
          break;

        default:
          workerLogger.warn("Unknown estoque webhook event", { event });
          res.status(400).json({ error: "Unknown event type" });
          return;
      }

      res.json({
        status: "processed",
        event,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      workerLogger.error("Estoque webhook processing failed:", error);
      res.status(500).json({ error: "Processing failed" });
    }
  }

  private async handleProdutosWebhook(
    req: express.Request,
    res: express.Response,
  ): Promise<void> {
    try {
      const { event, data } = req.body;

      workerLogger.info("SAP produtos webhook received", {
        event,
        dataCount: Array.isArray(data) ? data.length : 1,
      });

      switch (event) {
        case "product.created":
        case "product.updated":
          await this.processProductUpdate(data);
          break;

        case "product.deleted":
          await this.processProductDeletion(data);
          break;

        default:
          workerLogger.warn("Unknown produtos webhook event", { event });
          res.status(400).json({ error: "Unknown event type" });
          return;
      }

      res.json({
        status: "processed",
        event,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      workerLogger.error("Produtos webhook processing failed:", error);
      res.status(500).json({ error: "Processing failed" });
    }
  }

  private async processStockUpdate(data: any[]): Promise<void> {
    const updates = Array.isArray(data) ? data : [data];

    for (const update of updates) {
      const { produto_id, sku, quantidade, deposito } = update;

      // Invalidate cache immediately
      await estoqueCache.invalidate(produto_id);

      // Queue high-priority sync
      await sapEstoqueQueue.add(
        "webhook-stock-update",
        {
          type: "sync-estoque-delta",
          produtoId: produto_id,
          sku,
          quantidade,
          deposito,
          timestamp: new Date().toISOString(),
        },
        {
          priority: 25, // Very high priority for webhook updates
          attempts: 5,
        },
      );

      workerLogger.info("Stock update processed from webhook", {
        produto_id,
        sku,
        quantidade,
        deposito,
      });
    }
  }

  private async processStockDepletion(data: any[]): Promise<void> {
    const depletions = Array.isArray(data) ? data : [data];

    for (const depletion of depletions) {
      const { produto_id, sku, deposito } = depletion;

      // Invalidate cache
      await estoqueCache.invalidate(produto_id);

      // Queue critical alert
      await criticalStockQueue.add(
        "webhook-stock-zero",
        {
          type: "alert-estoque-zero",
          produtoId: produto_id,
          sku,
          deposito,
          quantidade: 0,
          timestamp: new Date().toISOString(),
        },
        {
          priority: 30, // Highest priority
          attempts: 10,
        },
      );

      workerLogger.error("Stock depletion processed from webhook", {
        produto_id,
        sku,
        deposito,
      });
    }
  }

  private async processStockCritical(data: any[]): Promise<void> {
    const criticals = Array.isArray(data) ? data : [data];

    for (const critical of criticals) {
      const { produto_id, sku, quantidade, deposito } = critical;

      // Invalidate cache
      await estoqueCache.invalidate(produto_id);

      // Queue critical sync
      await criticalStockQueue.add(
        "webhook-stock-critical",
        {
          type: "sync-estoque-criticos",
          produtoId: produto_id,
          sku,
          quantidade,
          deposito,
          timestamp: new Date().toISOString(),
        },
        {
          priority: 25,
          attempts: 7,
        },
      );

      workerLogger.warn("Critical stock processed from webhook", {
        produto_id,
        sku,
        quantidade,
        deposito,
      });
    }
  }

  private async processProductUpdate(data: any[]): Promise<void> {
    const updates = Array.isArray(data) ? data : [data];

    for (const update of updates) {
      const { id, sku } = update;

      // Queue product sync
      await sapEstoqueQueue.add(
        "webhook-product-update",
        {
          type: "sync-produtos-delta",
          produtoId: id,
          sku,
          timestamp: new Date().toISOString(),
        },
        {
          priority: 15,
          attempts: 3,
        },
      );

      workerLogger.info("Product update processed from webhook", {
        produto_id: id,
        sku,
      });
    }
  }

  private async processProductDeletion(data: any[]): Promise<void> {
    const deletions = Array.isArray(data) ? data : [data];

    for (const deletion of deletions) {
      const { id, sku } = deletion;

      // Invalidate all related caches
      await estoqueCache.invalidate(id);

      workerLogger.info("Product deletion processed from webhook", {
        produto_id: id,
        sku,
      });
    }
  }

  start(port = 3002): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, () => {
          workerLogger.info(`🔗 SAP Webhook server started on port ${port}`);
          workerLogger.info("   📍 Endpoints:");
          workerLogger.info(
            `   • POST http://localhost:${port}/webhooks/sap/estoque`,
          );
          workerLogger.info(
            `   • POST http://localhost:${port}/webhooks/sap/produtos`,
          );
          workerLogger.info(`   • GET  http://localhost:${port}/health`);
          resolve();
        });

        this.server.on("error", (error: any) => {
          if (error.code === "EADDRINUSE") {
            workerLogger.warn(
              `Port ${port} is in use, webhook server disabled`,
            );
            resolve(); // Don't fail the entire system
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          workerLogger.info("SAP Webhook server stopped");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export const sapWebhookServer = new SapWebhookServer();
