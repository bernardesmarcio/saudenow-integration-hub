import { BaseIntegrationService } from './baseIntegrationService';
import { sapCircuitBreaker } from '../../lib/patterns/circuitBreaker';
import { sapLogger } from '../../lib/logger';
import environment from '../../config/environment';
import {
  SapProduto,
  SapCliente,
  SapVenda,
  SapApiResponse,
  SapDeltaRequest,
} from '../../types/sap';

export class SapService extends BaseIntegrationService {
  constructor() {
    super({
      baseURL: environment.sap.apiUrl,
      timeout: 30000,
      headers: {
        'X-API-KEY': environment.sap.apiKey,
        'X-CLIENT-ID': environment.sap.client,
      },
      circuitBreaker: sapCircuitBreaker,
      rateLimitPerMinute: environment.sap.rateLimit,
    });
  }

  /**
   * Fetch products with delta sync support
   */
  async fetchProdutosDelta(lastSync?: Date): Promise<SapProduto[]> {
    const params: SapDeltaRequest = lastSync
      ? { modified_since: lastSync.toISOString(), limit: 1000 }
      : { limit: 1000 };

    sapLogger.info('Fetching produtos delta', { lastSync, params });

    const response = await this.get<SapApiResponse<SapProduto>>(
      '/api/v1/products',
      { params }
    );

    sapLogger.info(`Fetched ${response.data.length} produtos`);
    return response.data;
  }

  /**
   * Fetch all products (paginated)
   */
  async fetchAllProdutos(): Promise<SapProduto[]> {
    const allProdutos: SapProduto[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.get<SapApiResponse<SapProduto>>(
        '/api/v1/products',
        {
          params: { page, limit: 1000 },
        }
      );

      allProdutos.push(...response.data);

      hasMore = response.meta
        ? page < response.meta.last_page
        : response.data.length === 1000;
      page++;
    }

    sapLogger.info(`Fetched total ${allProdutos.length} produtos`);
    return allProdutos;
  }

  /**
   * Push product to SAP
   */
  async pushProduto(produto: Partial<SapProduto>): Promise<SapProduto> {
    const transformed = this.transformToExternal(produto);
    
    const response = await this.post<SapProduto>(
      '/api/v1/products',
      transformed
    );

    return response;
  }

  /**
   * Update product in SAP
   */
  async updateProduto(
    id: string,
    produto: Partial<SapProduto>
  ): Promise<SapProduto> {
    const transformed = this.transformToExternal(produto);
    
    const response = await this.put<SapProduto>(
      `/api/v1/products/${id}`,
      transformed
    );

    return response;
  }

  /**
   * Fetch customers with delta sync
   */
  async fetchClientesDelta(lastSync?: Date): Promise<SapCliente[]> {
    const params: SapDeltaRequest = lastSync
      ? { modified_since: lastSync.toISOString(), limit: 1000 }
      : { limit: 1000 };

    sapLogger.info('Fetching clientes delta', { lastSync, params });

    const response = await this.get<SapApiResponse<SapCliente>>(
      '/api/v1/customers',
      { params }
    );

    sapLogger.info(`Fetched ${response.data.length} clientes`);
    return response.data;
  }

  /**
   * Fetch sales with delta sync
   */
  async fetchVendasDelta(lastSync?: Date): Promise<SapVenda[]> {
    const params: SapDeltaRequest = lastSync
      ? { modified_since: lastSync.toISOString(), limit: 500 }
      : { limit: 500 };

    sapLogger.info('Fetching vendas delta', { lastSync, params });

    const response = await this.get<SapApiResponse<SapVenda>>(
      '/api/v1/sales',
      { params }
    );

    sapLogger.info(`Fetched ${response.data.length} vendas`);
    return response.data;
  }

  /**
   * Transform SAP data to internal format
   */
  protected transformToInternal(data: any): any {
    // Base transformation - override in specific methods if needed
    return {
      ...data,
      sap_id: data.id,
      created_at: new Date(data.created_at).toISOString(),
      updated_at: new Date(data.updated_at).toISOString(),
    };
  }

  /**
   * Transform internal data to SAP format
   */
  protected transformToExternal(data: any): any {
    // Remove internal fields
    const { id, sap_id, created_at, updated_at, ...sapData } = data;
    return sapData;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      sapLogger.error('SAP health check failed', error);
      return false;
    }
  }
}