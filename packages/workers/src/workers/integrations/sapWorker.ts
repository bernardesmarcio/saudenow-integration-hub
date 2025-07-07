import { Job } from 'bull';
import { sapSyncQueue } from '../../config/queues';
import { SapService } from '../../services/integrations/sapService';
import { Tables, logIntegration, batchUpsert } from '../../config/database';
import { workerLogger } from '../../lib/logger';
import { CacheManager } from '../../lib/cache/cacheManager';

interface SapJobData {
  type: 'sync-produtos-delta' | 'sync-clientes-delta' | 'sync-vendas-delta' | 'full-sync';
  lastSync?: Date;
  force?: boolean;
}

export class SapWorker {
  private sapService = new SapService();

  async process(job: Job<SapJobData>) {
    const { type, lastSync, force } = job.data;

    workerLogger.info(`Processing SAP job: ${type}`, {
      jobId: job.id,
      lastSync,
      force,
    });

    try {
      switch (type) {
        case 'sync-produtos-delta':
          return await this.syncProdutosDelta(lastSync);

        case 'sync-clientes-delta':
          return await this.syncClientesDelta(lastSync);

        case 'sync-vendas-delta':
          return await this.syncVendasDelta(lastSync);

        case 'full-sync':
          return await this.fullSync();

        default:
          throw new Error(`Unknown SAP job type: ${type}`);
      }
    } catch (error: any) {
      workerLogger.error(`SAP job ${type} failed:`, error);
      
      await logIntegration('sap', type, 'error', {
        error: error.message,
        lastSync,
      }, error.message);

      throw error;
    }
  }

  private async syncProdutosDelta(lastSync?: Date): Promise<void> {
    workerLogger.info('Starting produtos delta sync', { lastSync });

    const startTime = Date.now();
    const produtos = await this.sapService.fetchProdutosDelta(lastSync);

    if (produtos.length === 0) {
      workerLogger.info('No produtos to sync');
      await logIntegration('sap', 'sync-produtos-delta', 'success', {
        processedCount: 0,
        duration: Date.now() - startTime,
      });
      return;
    }

    // Transform SAP data to internal format
    const transformedProdutos = produtos.map(produto => this.transformProduto(produto));

    // Batch upsert to database
    const { success, failed } = await batchUpsert(
      Tables.PRODUTOS,
      transformedProdutos,
      ['sap_id'],
      100
    );

    // Update cache for popular products
    await this.updateProdutoCache(transformedProdutos.slice(0, 50));

    const duration = Date.now() - startTime;
    
    workerLogger.info('Produtos delta sync completed', {
      total: produtos.length,
      success,
      failed,
      duration,
    });

    await logIntegration('sap', 'sync-produtos-delta', 'success', {
      processedCount: produtos.length,
      successCount: success,
      failedCount: failed,
      duration,
    });
  }

  private async syncClientesDelta(lastSync?: Date): Promise<void> {
    workerLogger.info('Starting clientes delta sync', { lastSync });

    const startTime = Date.now();
    const clientes = await this.sapService.fetchClientesDelta(lastSync);

    if (clientes.length === 0) {
      workerLogger.info('No clientes to sync');
      await logIntegration('sap', 'sync-clientes-delta', 'success', {
        processedCount: 0,
        duration: Date.now() - startTime,
      });
      return;
    }

    // Transform and validate
    const transformedClientes = clientes.map(cliente => this.transformCliente(cliente));

    // Batch upsert
    const { success, failed } = await batchUpsert(
      Tables.CLIENTES,
      transformedClientes,
      ['sap_id'],
      100
    );

    const duration = Date.now() - startTime;

    workerLogger.info('Clientes delta sync completed', {
      total: clientes.length,
      success,
      failed,
      duration,
    });

    await logIntegration('sap', 'sync-clientes-delta', 'success', {
      processedCount: clientes.length,
      successCount: success,
      failedCount: failed,
      duration,
    });
  }

  private async syncVendasDelta(lastSync?: Date): Promise<void> {
    workerLogger.info('Starting vendas delta sync', { lastSync });

    const startTime = Date.now();
    const vendas = await this.sapService.fetchVendasDelta(lastSync);

    if (vendas.length === 0) {
      workerLogger.info('No vendas to sync');
      await logIntegration('sap', 'sync-vendas-delta', 'success', {
        processedCount: 0,
        duration: Date.now() - startTime,
      });
      return;
    }

    // Transform vendas
    const transformedVendas = vendas.map(venda => this.transformVenda(venda));

    // Batch upsert
    const { success, failed } = await batchUpsert(
      Tables.VENDAS,
      transformedVendas,
      ['sap_id'],
      50 // Smaller batches for sales due to complexity
    );

    const duration = Date.now() - startTime;

    workerLogger.info('Vendas delta sync completed', {
      total: vendas.length,
      success,
      failed,
      duration,
    });

    await logIntegration('sap', 'sync-vendas-delta', 'success', {
      processedCount: vendas.length,
      successCount: success,
      failedCount: failed,
      duration,
    });
  }

  private async fullSync(): Promise<void> {
    workerLogger.info('Starting full sync');

    const startTime = Date.now();

    // Run all syncs in parallel
    await Promise.all([
      this.syncProdutosDelta(), // Full produtos sync
      this.syncClientesDelta(), // Full clientes sync
      this.syncVendasDelta(), // Full vendas sync
    ]);

    const duration = Date.now() - startTime;

    workerLogger.info('Full sync completed', { duration });

    await logIntegration('sap', 'full-sync', 'success', {
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  private transformProduto(produto: any): any {
    return {
      sap_id: produto.id,
      sku: produto.sku,
      nome: produto.nome,
      descricao: produto.descricao,
      categoria: produto.categoria,
      preco: produto.preco,
      custo: produto.custo,
      peso: produto.peso,
      dimensoes: produto.dimensoes,
      imagens: produto.imagens,
      ativo: produto.ativo,
      metadata: {
        sap_created_at: produto.created_at,
        sap_updated_at: produto.updated_at,
        sync_timestamp: new Date().toISOString(),
      },
      created_at: new Date(produto.created_at).toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private transformCliente(cliente: any): any {
    return {
      sap_id: cliente.id,
      nome: cliente.nome,
      tipo: cliente.tipo,
      cpf_cnpj: cliente.cpf_cnpj,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      ativo: cliente.ativo,
      metadata: {
        sap_created_at: cliente.created_at,
        sap_updated_at: cliente.updated_at,
        sync_timestamp: new Date().toISOString(),
      },
      created_at: new Date(cliente.created_at).toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private transformVenda(venda: any): any {
    return {
      sap_id: venda.id,
      numero_venda: venda.numero_venda,
      cliente_id: venda.cliente_id,
      data_venda: new Date(venda.data_venda).toISOString(),
      valor_total: venda.valor_total,
      valor_desconto: venda.valor_desconto,
      valor_frete: venda.valor_frete,
      status: venda.status,
      origem: venda.origem || 'sap',
      items: venda.items,
      pagamento: venda.pagamento,
      entrega: venda.entrega,
      metadata: {
        sap_created_at: venda.created_at,
        sap_updated_at: venda.updated_at,
        sync_timestamp: new Date().toISOString(),
      },
      created_at: new Date(venda.created_at).toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private async updateProdutoCache(produtos: any[]): Promise<void> {
    try {
      for (const produto of produtos) {
        await CacheManager.set(
          `produto:${produto.sap_id}`,
          produto,
          300 // 5 minutes cache
        );
      }
      workerLogger.debug(`Updated cache for ${produtos.length} produtos`);
    } catch (error) {
      workerLogger.error('Error updating produto cache:', error);
    }
  }
}

// Register worker processor
sapSyncQueue.process('*', async (job) => {
  const worker = new SapWorker();
  await worker.process(job);
});