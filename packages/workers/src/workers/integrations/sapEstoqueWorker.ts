import { Job } from "bull";
import {
  sapEstoqueQueue,
  criticalStockQueue,
  notificationQueue,
} from "../../config/queues";
import { SapEstoqueService } from "../../services/integrations/sapEstoqueService";
import {
  supabase,
  Tables,
  logIntegration,
  batchUpsert,
} from "../../config/database";
import { estoqueCache } from "../../lib/cache/estoqueCache";
import { estoqueLogger } from "../../lib/logger";

interface SapEstoqueJobData {
  type:
    | "sync-estoque-delta"
    | "sync-estoque-criticos"
    | "alert-estoque-zero"
    | "preload-popular";
  lastSync?: Date;
  produtoId?: string;
  threshold?: number;
}

export class SapEstoqueWorker {
  private sapEstoqueService = new SapEstoqueService();

  async process(job: Job<SapEstoqueJobData>) {
    const { type, lastSync, produtoId, threshold } = job.data;

    estoqueLogger.info(`Processing estoque job: ${type}`, {
      jobId: job.id,
      lastSync,
      produtoId,
      threshold,
    });

    try {
      switch (type) {
        case "sync-estoque-delta":
          return await this.syncEstoqueDelta(lastSync);

        case "sync-estoque-criticos":
          return await this.syncEstoqueCriticos(threshold);

        case "alert-estoque-zero":
          return await this.alertEstoqueZero(produtoId!);

        case "preload-popular":
          return await this.preloadPopularProducts();

        default:
          throw new Error(`Unknown estoque job type: ${type}`);
      }
    } catch (error: any) {
      estoqueLogger.error(`Estoque job ${type} failed:`, error);

      await logIntegration(
        "sap",
        `estoque-${type}`,
        "error",
        {
          error: error.message,
          lastSync,
          produtoId,
        },
        error.message,
      );

      throw error;
    }
  }

  private async syncEstoqueDelta(lastSync?: Date): Promise<void> {
    estoqueLogger.info("Starting estoque delta sync", { lastSync });

    const startTime = Date.now();
    const estoques = await this.sapEstoqueService.fetchEstoqueDelta(lastSync);

    if (estoques.length === 0) {
      estoqueLogger.info("No estoque changes to sync");
      await logIntegration("sap", "sync-estoque-delta", "success", {
        processedCount: 0,
        duration: Date.now() - startTime,
      });
      return;
    }

    // Transform and process
    const transformedEstoques = estoques.map((estoque) =>
      this.transformEstoque(estoque),
    );

    // Batch upsert to database
    const { success, failed } = await batchUpsert(
      Tables.ESTOQUE,
      transformedEstoques,
      ["produto_id", "deposito"],
      100,
    );

    // Update cache in batches
    await this.updateEstoqueCache(transformedEstoques);

    // Check for critical stock levels
    const criticalItems = transformedEstoques.filter((e) => e.quantidade <= 10);
    if (criticalItems.length > 0) {
      await this.processCriticalStock(criticalItems);
    }

    // Check for zero stock
    const zeroStockItems = transformedEstoques.filter(
      (e) => e.quantidade === 0,
    );
    if (zeroStockItems.length > 0) {
      await this.processZeroStock(zeroStockItems);
    }

    const duration = Date.now() - startTime;

    estoqueLogger.info("Estoque delta sync completed", {
      total: estoques.length,
      success,
      failed,
      critical: criticalItems.length,
      zeroStock: zeroStockItems.length,
      duration,
    });

    await logIntegration("sap", "sync-estoque-delta", "success", {
      processedCount: estoques.length,
      successCount: success,
      failedCount: failed,
      criticalCount: criticalItems.length,
      zeroStockCount: zeroStockItems.length,
      duration,
    });
  }

  private async syncEstoqueCriticos(threshold = 10): Promise<void> {
    estoqueLogger.info("Starting critical stock sync", { threshold });

    const startTime = Date.now();
    const criticalEstoques =
      await this.sapEstoqueService.fetchEstoqueCritico(threshold);

    if (criticalEstoques.length === 0) {
      estoqueLogger.info("No critical stock items found");
      return;
    }

    // Transform and update
    const transformedEstoques = criticalEstoques.map((estoque) => ({
      ...this.transformEstoque(estoque),
      critico: true,
    }));

    // Update database
    const { success, failed } = await batchUpsert(
      Tables.ESTOQUE,
      transformedEstoques,
      ["produto_id", "deposito"],
      50,
    );

    // Update cache with shorter TTL for critical items
    const estoqueMap = new Map();
    transformedEstoques.forEach((estoque) => {
      estoqueMap.set(estoque.produto_id, estoque);
    });
    await estoqueCache.setMultiple(estoqueMap);

    // Send alerts for each critical item
    await this.processCriticalStock(transformedEstoques);

    const duration = Date.now() - startTime;

    estoqueLogger.warn("Critical stock sync completed", {
      total: criticalEstoques.length,
      success,
      failed,
      threshold,
      duration,
    });

    await logIntegration("sap", "sync-estoque-criticos", "success", {
      processedCount: criticalEstoques.length,
      successCount: success,
      failedCount: failed,
      threshold,
      duration,
    });
  }

  private async alertEstoqueZero(produtoId: string): Promise<void> {
    estoqueLogger.warn("Processing zero stock alert", { produtoId });

    // Get product details
    const { data: produto } = await supabase
      .from(Tables.PRODUTOS)
      .select("nome, sku, categoria")
      .eq("sap_id", produtoId)
      .single();

    if (!produto) {
      estoqueLogger.error("Product not found for zero stock alert", {
        produtoId,
      });
      return;
    }

    // Send notification
    await notificationQueue.add(
      "estoque-zero",
      {
        produtoId,
        produto,
        timestamp: new Date().toISOString(),
        priority: "CRITICAL",
      },
      {
        priority: 30, // Highest priority
        attempts: 5,
      },
    );

    estoqueLogger.warn("Zero stock alert queued", {
      produtoId,
      produtoNome: produto.nome,
      sku: produto.sku,
    });
  }

  private async preloadPopularProducts(): Promise<void> {
    estoqueLogger.info("Preloading popular products to cache");

    try {
      // Get top 100 most accessed products
      const { data: popularProducts } = await supabase
        .from(Tables.PRODUTOS)
        .select("sap_id, nome, sku")
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!popularProducts || popularProducts.length === 0) {
        return;
      }

      const produtoIds = popularProducts.map((p) => p.sap_id);

      // Fetch current stock for these products
      const estoques =
        await this.sapEstoqueService.fetchEstoqueBatch(produtoIds);

      // Transform and cache
      const estoqueData = estoques.map((estoque) => ({
        id: estoque.produto_id,
        estoque: this.transformEstoque(estoque),
      }));

      await estoqueCache.preloadPopular(estoqueData);

      estoqueLogger.info(
        `Preloaded ${estoqueData.length} popular products to cache`,
      );
    } catch (error) {
      estoqueLogger.error("Failed to preload popular products:", error);
    }
  }

  private transformEstoque(estoque: any): any {
    return {
      produto_id: estoque.produto_id,
      sku: estoque.sku,
      quantidade: estoque.quantidade,
      quantidade_reservada: estoque.quantidade_reservada || 0,
      quantidade_disponivel:
        estoque.quantidade_disponivel || estoque.quantidade,
      deposito: estoque.deposito,
      localizacao: estoque.localizacao,
      lote: estoque.lote,
      validade: estoque.validade
        ? new Date(estoque.validade).toISOString()
        : null,
      custo_medio: estoque.custo_medio,
      ultima_movimentacao: estoque.ultima_movimentacao
        ? new Date(estoque.ultima_movimentacao).toISOString()
        : null,
      metadata: {
        sap_updated_at: estoque.updated_at,
        sync_timestamp: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };
  }

  private async updateEstoqueCache(estoques: any[]): Promise<void> {
    try {
      const estoqueMap = new Map();
      estoques.forEach((estoque) => {
        estoqueMap.set(estoque.produto_id, estoque);
      });

      await estoqueCache.setMultiple(estoqueMap);
      estoqueLogger.debug(`Updated cache for ${estoques.length} estoque items`);
    } catch (error) {
      estoqueLogger.error("Error updating estoque cache:", error);
    }
  }

  private async processCriticalStock(criticalItems: any[]): Promise<void> {
    for (const item of criticalItems) {
      await notificationQueue.add(
        "estoque-critico",
        {
          produtoId: item.produto_id,
          sku: item.sku,
          quantidade: item.quantidade,
          deposito: item.deposito,
          timestamp: new Date().toISOString(),
          priority: "HIGH",
        },
        {
          priority: 20,
          attempts: 3,
        },
      );
    }

    estoqueLogger.warn(`Queued ${criticalItems.length} critical stock alerts`);
  }

  private async processZeroStock(zeroStockItems: any[]): Promise<void> {
    for (const item of zeroStockItems) {
      await criticalStockQueue.add(
        "estoque-zero",
        {
          produtoId: item.produto_id,
          sku: item.sku,
          deposito: item.deposito,
          timestamp: new Date().toISOString(),
          priority: "CRITICAL",
        },
        {
          priority: 30, // Highest priority
          attempts: 10, // More attempts for critical alerts
        },
      );
    }

    estoqueLogger.error(`Queued ${zeroStockItems.length} ZERO STOCK alerts`);
  }
}

// Register worker processors
sapEstoqueQueue.process("*", async (job) => {
  const worker = new SapEstoqueWorker();
  await worker.process(job);
});

criticalStockQueue.process("*", async (job) => {
  const worker = new SapEstoqueWorker();
  await worker.process(job);
});
