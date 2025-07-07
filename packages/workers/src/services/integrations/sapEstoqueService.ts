import { BaseIntegrationService } from './baseIntegrationService';
import { estoqueCircuitBreaker } from '../../lib/patterns/circuitBreaker';
import { retryCriticalStockOperation } from '../../lib/patterns/retryLogic';
import { estoqueLogger } from '../../lib/logger';
import environment from '../../config/environment';
import {
  SapEstoque,
  SapApiResponse,
  SapDeltaRequest,
  SapEstoqueCriticalRequest,
} from '../../types/sap';

export class SapEstoqueService extends BaseIntegrationService {
  constructor() {
    super({
      baseURL: environment.sap.apiUrl,
      timeout: 15000, // Shorter timeout for stock operations
      headers: {
        'X-API-KEY': environment.sap.apiKey,
        'X-CLIENT-ID': environment.sap.client,
        'X-PRIORITY': 'HIGH', // Mark as high priority
      },
      circuitBreaker: estoqueCircuitBreaker,
      rateLimitPerMinute: 200, // Higher rate limit for stock
    });
  }

  /**
   * Fetch stock with delta sync - CRITICAL for realtime updates
   */
  async fetchEstoqueDelta(lastSync?: Date): Promise<SapEstoque[]> {
    const params: SapDeltaRequest = lastSync
      ? { modified_since: lastSync.toISOString(), limit: 1000 }
      : { limit: 1000 };

    estoqueLogger.info('Fetching estoque delta', { lastSync, params });

    return retryCriticalStockOperation(async () => {
      const response = await this.get<SapApiResponse<SapEstoque>>(
        '/api/v1/stock',
        { params }
      );

      estoqueLogger.info(`Fetched ${response.data.length} estoque items`);
      return response.data;
    });
  }

  /**
   * Fetch critical stock items (low quantity)
   */
  async fetchEstoqueCritico(threshold = 10): Promise<SapEstoque[]> {
    const params: SapEstoqueCriticalRequest = {
      threshold,
    };

    estoqueLogger.info('Fetching critical stock', { threshold });

    return retryCriticalStockOperation(async () => {
      const response = await this.get<SapApiResponse<SapEstoque>>(
        '/api/v1/stock/critical',
        { params }
      );

      estoqueLogger.warn(
        `Found ${response.data.length} critical stock items`,
        {
          count: response.data.length,
          threshold,
        }
      );

      return response.data;
    });
  }

  /**
   * Fetch stock for specific products (batch operation)
   */
  async fetchEstoqueBatch(produtoIds: string[]): Promise<SapEstoque[]> {
    if (produtoIds.length === 0) return [];

    const batchSize = 100;
    const allEstoque: SapEstoque[] = [];

    // Process in batches to avoid large requests
    for (let i = 0; i < produtoIds.length; i += batchSize) {
      const batch = produtoIds.slice(i, i + batchSize);
      
      try {
        const response = await this.post<SapApiResponse<SapEstoque>>(
          '/api/v1/stock/batch',
          { produto_ids: batch }
        );

        allEstoque.push(...response.data);
      } catch (error) {
        estoqueLogger.error(`Batch stock fetch failed for batch ${i}`, error);
        throw error;
      }
    }

    estoqueLogger.info(`Fetched stock for ${allEstoque.length} products`);
    return allEstoque;
  }

  /**
   * Get stock for a single product by SKU
   */
  async fetchEstoqueBySku(sku: string): Promise<SapEstoque | null> {
    try {
      const response = await this.get<SapEstoque>(
        `/api/v1/stock/sku/${sku}`
      );
      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update stock quantity in SAP
   */
  async updateEstoque(
    produtoId: string,
    quantidade: number,
    deposito: string,
    motivo?: string
  ): Promise<SapEstoque> {
    const data = {
      quantidade,
      deposito,
      motivo: motivo || 'Ajuste via integração',
      timestamp: new Date().toISOString(),
    };

    estoqueLogger.info('Updating stock in SAP', {
      produtoId,
      quantidade,
      deposito,
    });

    return retryCriticalStockOperation(async () => {
      const response = await this.put<SapEstoque>(
        `/api/v1/stock/product/${produtoId}`,
        data
      );

      estoqueLogger.info('Stock updated in SAP', {
        produtoId,
        newQuantity: response.quantidade,
      });

      return response;
    });
  }

  /**
   * Reserve stock in SAP
   */
  async reservarEstoque(
    produtoId: string,
    quantidade: number,
    pedidoId: string
  ): Promise<SapEstoque> {
    const data = {
      quantidade,
      pedido_id: pedidoId,
      timestamp: new Date().toISOString(),
    };

    return retryCriticalStockOperation(async () => {
      const response = await this.post<SapEstoque>(
        `/api/v1/stock/product/${produtoId}/reserve`,
        data
      );

      estoqueLogger.info('Stock reserved in SAP', {
        produtoId,
        quantidade,
        pedidoId,
      });

      return response;
    });
  }

  /**
   * Release reserved stock in SAP
   */
  async liberarEstoque(
    produtoId: string,
    quantidade: number,
    pedidoId: string
  ): Promise<SapEstoque> {
    const data = {
      quantidade,
      pedido_id: pedidoId,
      timestamp: new Date().toISOString(),
    };

    return retryCriticalStockOperation(async () => {
      const response = await this.post<SapEstoque>(
        `/api/v1/stock/product/${produtoId}/release`,
        data
      );

      estoqueLogger.info('Stock released in SAP', {
        produtoId,
        quantidade,
        pedidoId,
      });

      return response;
    });
  }

  /**
   * Get available stock (quantity - reserved)
   */
  async getEstoqueDisponivel(produtoId: string): Promise<number> {
    const estoque = await this.get<SapEstoque>(
      `/api/v1/stock/product/${produtoId}/available`
    );

    return estoque.quantidade_disponivel || estoque.quantidade;
  }

  /**
   * Transform SAP stock data to internal format
   */
  protected transformToInternal(data: SapEstoque): any {
    return {
      produto_id: data.produto_id,
      sku: data.sku,
      quantidade: data.quantidade,
      quantidade_reservada: data.quantidade_reservada || 0,
      quantidade_disponivel: data.quantidade_disponivel || data.quantidade,
      deposito: data.deposito,
      localizacao: data.localizacao,
      lote: data.lote,
      validade: data.validade ? new Date(data.validade) : null,
      custo_medio: data.custo_medio,
      ultima_movimentacao: data.ultima_movimentacao
        ? new Date(data.ultima_movimentacao)
        : null,
      sap_updated_at: new Date(data.updated_at),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Transform internal data to SAP format
   */
  protected transformToExternal(data: any): any {
    const {
      id,
      sap_updated_at,
      created_at,
      updated_at,
      ...sapData
    } = data;

    return {
      ...sapData,
      validade: data.validade ? data.validade.toISOString() : null,
      ultima_movimentacao: data.ultima_movimentacao
        ? data.ultima_movimentacao.toISOString()
        : null,
    };
  }

  /**
   * Health check specific for stock service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple stock count query
      await this.get('/api/v1/stock/count', { timeout: 5000 });
      return true;
    } catch (error) {
      estoqueLogger.error('SAP Estoque health check failed', error);
      return false;
    }
  }
}