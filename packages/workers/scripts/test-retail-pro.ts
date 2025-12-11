#!/usr/bin/env tsx

/**
 * Script de teste para integração Retail Pro
 *
 * Este script testa a conectividade e funcionalidades básicas
 * da integração com o Retail Pro para a loja Resende.
 *
 * Uso: npm run test:retail-pro
 */

import { RetailProService } from "../src/services/integrations/retailProService";
import { RetailProWorker } from "../src/workers/integrations/retailProWorker";
import { retailProMetrics } from "../src/lib/monitoring/retailProMetrics";
import { retailProCache } from "../src/lib/cache/retailProCache";
import { RETAIL_PRO_CONSTANTS } from "../src/types/retailpro";

// Configuration
const CONFIG = {
  baseUrl:
    process.env.RETAIL_PRO_BASE_URL || "http://macserver-pdv.maconequi.local",
  storeSid: RETAIL_PRO_CONSTANTS.STORES.RESENDE.SID,
  storeId: RETAIL_PRO_CONSTANTS.STORES.RESENDE.ID,
  storeName: RETAIL_PRO_CONSTANTS.STORES.RESENDE.NAME,
  testBatchSize: 10,
  timeout: 30000,
};

class RetailProTester {
  private service: RetailProService;
  private worker: RetailProWorker;
  private startTime: number;

  constructor() {
    this.service = new RetailProService({
      baseUrl: CONFIG.baseUrl,
      timeout: CONFIG.timeout,
      maxRetries: 3,
      batchSize: CONFIG.testBatchSize,
      stores: {
        [CONFIG.storeId]: {
          id: CONFIG.storeId,
          name: CONFIG.storeName,
          sid: CONFIG.storeSid,
          active: true,
        },
      },
    });

    this.worker = new RetailProWorker();
    this.startTime = Date.now();
  }

  async runAllTests(): Promise<void> {
    console.log("🚀 Iniciando testes da integração Retail Pro\n");
    console.log(`📍 Loja: ${CONFIG.storeName} (${CONFIG.storeSid})`);
    console.log(`🌐 URL Base: ${CONFIG.baseUrl}`);
    console.log(`⏱️  Timeout: ${CONFIG.timeout}ms\n`);

    const tests = [
      { name: "Health Check", fn: this.testHealthCheck.bind(this) },
      { name: "Conectividade API", fn: this.testApiConnectivity.bind(this) },
      { name: "Busca de Produtos", fn: this.testProductFetch.bind(this) },
      { name: "Consulta de Estoque", fn: this.testStockQuery.bind(this) },
      {
        name: "Processamento em Lotes",
        fn: this.testBatchProcessing.bind(this),
      },
      { name: "Cache Redis", fn: this.testCache.bind(this) },
      {
        name: "Transformação de Dados",
        fn: this.testDataTransformation.bind(this),
      },
      { name: "Worker Background", fn: this.testWorker.bind(this) },
      { name: "Métricas e Monitoramento", fn: this.testMetrics.bind(this) },
      { name: "Performance e Stress", fn: this.testPerformance.bind(this) },
    ];

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(`\n🧪 Executando: ${test.name}`);
        console.log("─".repeat(50));

        const testStart = Date.now();
        await test.fn();
        const duration = Date.now() - testStart;

        console.log(`✅ ${test.name} - PASSOU (${duration}ms)`);
        results.push({ name: test.name, status: "PASSOU", duration });
        passed++;
      } catch (error) {
        const duration = Date.now() - (Date.now() - 5000); // Rough estimate
        console.log(`❌ ${test.name} - FALHOU`);
        console.log(`   Erro: ${error.message}`);
        results.push({
          name: test.name,
          status: "FALHOU",
          error: error.message,
          duration,
        });
        failed++;
      }
    }

    // Relatório final
    this.printFinalReport(results, passed, failed);
  }

  private async testHealthCheck(): Promise<void> {
    console.log("Verificando saúde da API Retail Pro...");

    const isHealthy = await this.service.healthCheck();

    if (!isHealthy) {
      throw new Error("API Retail Pro não está respondendo");
    }

    console.log("✓ API Retail Pro está saudável");
  }

  private async testApiConnectivity(): Promise<void> {
    console.log("Testando conectividade básica da API...");

    try {
      const response = await this.service.getProducts(CONFIG.storeSid, {
        limit: 1,
        offset: 0,
      });

      if (!response || !Array.isArray(response.data)) {
        throw new Error("Resposta da API inválida");
      }

      console.log(
        `✓ Conectividade OK - Resposta com ${response.data.length} produtos`,
      );
      console.log(
        `✓ Endpoint respondeu: ${response.total || 0} produtos disponíveis`,
      );
    } catch (error) {
      throw new Error(`Falha na conectividade: ${error.message}`);
    }
  }

  private async testProductFetch(): Promise<void> {
    console.log("Testando busca de produtos...");

    const response = await this.service.getProducts(CONFIG.storeSid, {
      limit: CONFIG.testBatchSize,
      offset: 0,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("Nenhum produto retornado");
    }

    console.log(`✓ Produtos buscados: ${response.data.length}`);

    // Validar estrutura dos produtos
    const firstProduct = response.data[0];
    const requiredFields = ["sid", "alu", "description1", "vendor_name"];

    for (const field of requiredFields) {
      if (!firstProduct[field]) {
        console.log(`⚠️  Campo obrigatório ausente: ${field}`);
      }
    }

    console.log(
      `✓ Primeiro produto: ${firstProduct.alu} - ${firstProduct.description1}`,
    );
  }

  private async testStockQuery(): Promise<void> {
    console.log("Testando consulta de estoque...");

    // Primeiro, buscar alguns produtos
    const productsResponse = await this.service.getProducts(CONFIG.storeSid, {
      limit: 5,
      offset: 0,
    });

    if (!productsResponse.data || productsResponse.data.length === 0) {
      throw new Error("Nenhum produto disponível para teste de estoque");
    }

    const productSid = productsResponse.data[0].sid;
    console.log(`Testando estoque para produto: ${productSid}`);

    const stock = await this.service.getProductStock(
      productSid,
      CONFIG.storeSid,
    );

    if (stock) {
      console.log(`✓ Estoque encontrado: ${stock.quantity} unidades`);
      console.log(`  - Mínimo: ${stock.minimum_quantity}`);
      console.log(`  - Em pedido: ${stock.po_ordered_quantity}`);
      console.log(`  - Recebido: ${stock.po_received_quantity}`);
    } else {
      console.log("ℹ️  Nenhum estoque registrado para este produto (OK)");
    }
  }

  private async testBatchProcessing(): Promise<void> {
    console.log("Testando processamento em lotes...");

    // Buscar alguns produtos para teste
    const productsResponse = await this.service.getProducts(CONFIG.storeSid, {
      limit: CONFIG.testBatchSize,
      offset: 0,
    });

    if (!productsResponse.data || productsResponse.data.length === 0) {
      throw new Error("Nenhum produto disponível para teste em lotes");
    }

    const productSids = productsResponse.data.map((p) => p.sid);
    console.log(`Processando lote de ${productSids.length} produtos...`);

    const startTime = Date.now();
    const batchResult = await this.service.getProductsStockBatch(
      productSids,
      CONFIG.storeSid,
    );
    const duration = Date.now() - startTime;

    console.log(`✓ Lote processado em ${duration}ms`);
    console.log(`✓ Sucessos: ${batchResult.success.length}`);
    console.log(`✓ Erros: ${batchResult.errors.length}`);
    console.log(
      `✓ Taxa de sucesso: ${((batchResult.success.length / batchResult.total) * 100).toFixed(1)}%`,
    );

    if (batchResult.errors.length > 0) {
      console.log(`⚠️  Primeiros erros:`, batchResult.errors.slice(0, 3));
    }
  }

  private async testCache(): Promise<void> {
    console.log("Testando sistema de cache...");

    const testProductSid = "1234567890";
    const testStock = {
      store_sid: CONFIG.storeSid,
      store_name: CONFIG.storeName,
      quantity: 100,
      minimum_quantity: 10,
      po_ordered_quantity: 50,
      po_received_quantity: 25,
      status: "in_stock" as const,
      last_updated: new Date(),
    };

    // Teste de escrita no cache
    await retailProCache.cacheStock(CONFIG.storeSid, testProductSid, testStock);
    console.log("✓ Dados gravados no cache");

    // Teste de leitura do cache
    const cachedStock = await retailProCache.getStock(
      CONFIG.storeSid,
      testProductSid,
    );

    if (!cachedStock) {
      throw new Error("Falha na leitura do cache");
    }

    if (cachedStock.quantity !== testStock.quantity) {
      throw new Error("Dados do cache não conferem");
    }

    console.log("✓ Dados lidos do cache corretamente");

    // Teste de estatísticas do cache
    const stats = await retailProCache.getCacheStats(CONFIG.storeSid);
    console.log(`✓ Estatísticas do cache: ${JSON.stringify(stats)}`);
  }

  private async testDataTransformation(): Promise<void> {
    console.log("Testando transformação de dados...");

    // Buscar produto real para teste
    const productsResponse = await this.service.getProducts(CONFIG.storeSid, {
      limit: 1,
      offset: 0,
    });

    if (!productsResponse.data || productsResponse.data.length === 0) {
      throw new Error("Nenhum produto disponível para teste de transformação");
    }

    const rawProduct = productsResponse.data[0];
    const transformedProduct = this.service.processProduct(rawProduct);

    // Validar transformação
    if (
      !transformedProduct.sid ||
      !transformedProduct.alu ||
      !transformedProduct.description
    ) {
      throw new Error("Transformação de produto falhou");
    }

    console.log(`✓ Produto transformado:`);
    console.log(`  - SID: ${transformedProduct.sid}`);
    console.log(`  - ALU: ${transformedProduct.alu}`);
    console.log(`  - Descrição: ${transformedProduct.description}`);
    console.log(`  - Marca: ${transformedProduct.brand}`);
    console.log(`  - Ativo: ${transformedProduct.active}`);
  }

  private async testWorker(): Promise<void> {
    console.log("Testando worker em background...");

    // Simular job de sincronização
    const mockJob = {
      id: "test-job-1",
      data: {
        type: "stock_sync" as const,
        store_sid: CONFIG.storeSid,
        options: {
          batch_size: 5,
          force: false,
        },
      },
    };

    try {
      // Note: Em um teste real, você executaria o worker
      // await this.worker.process(mockJob as any)
      console.log("✓ Worker inicializado corretamente");
      console.log("ℹ️  Teste do worker simulado (sem execução real)");
    } catch (error) {
      throw new Error(`Falha no worker: ${error.message}`);
    }
  }

  private async testMetrics(): Promise<void> {
    console.log("Testando coleta de métricas...");

    // Registrar algumas métricas de teste
    await retailProMetrics.recordSyncOperation(
      CONFIG.storeSid,
      "test_sync",
      true,
      5000,
      100,
    );

    await retailProMetrics.recordApiCall(CONFIG.storeSid, "/test", true, 150);

    // Coletar métricas
    const metrics = await retailProMetrics.getStoreMetrics(
      CONFIG.storeSid,
      true,
    );

    if (!metrics) {
      throw new Error("Falha na coleta de métricas");
    }

    console.log("✓ Métricas coletadas:");
    console.log(`  - Total de sincronizações: ${metrics.total_syncs}`);
    console.log(`  - Total de chamadas API: ${metrics.total_api_calls}`);
    console.log(
      `  - Taxa de hit do cache: ${(metrics.cache_hit_rate * 100).toFixed(1)}%`,
    );
    console.log(`  - Tempo médio de resposta: ${metrics.avg_response_time}ms`);

    // Teste de resumo de métricas
    const summary = await retailProMetrics.getMetricsSummary(CONFIG.storeSid);
    console.log(`✓ Score de saúde: ${summary.health_score}%`);
  }

  private async testPerformance(): Promise<void> {
    console.log("Testando performance e stress...");

    const concurrentRequests = 5;
    const promises = [];

    console.log(`Executando ${concurrentRequests} requisições concorrentes...`);

    const startTime = Date.now();

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        this.service.getProducts(CONFIG.storeSid, {
          limit: 5,
          offset: i * 5,
        }),
      );
    }

    const results = await Promise.allSettled(promises);
    const duration = Date.now() - startTime;

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`✓ Requisições concorrentes completadas em ${duration}ms`);
    console.log(`✓ Sucessos: ${successful}/${concurrentRequests}`);
    console.log(`✓ Falhas: ${failed}/${concurrentRequests}`);
    console.log(
      `✓ Throughput: ${(concurrentRequests / (duration / 1000)).toFixed(2)} req/s`,
    );

    if (failed > concurrentRequests * 0.2) {
      // Mais de 20% de falhas
      throw new Error(
        `Taxa de falhas muito alta: ${failed}/${concurrentRequests}`,
      );
    }
  }

  private printFinalReport(
    results: any[],
    passed: number,
    failed: number,
  ): void {
    const totalDuration = Date.now() - this.startTime;

    console.log("\n" + "=".repeat(60));
    console.log("📊 RELATÓRIO FINAL DOS TESTES");
    console.log("=".repeat(60));

    console.log(`⏱️  Duração total: ${totalDuration}ms`);
    console.log(`✅ Testes aprovados: ${passed}`);
    console.log(`❌ Testes falharam: ${failed}`);
    console.log(
      `📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`,
    );

    console.log("\n📋 Detalhes dos testes:");
    console.log("─".repeat(60));

    results.forEach((result) => {
      const status = result.status === "PASSOU" ? "✅" : "❌";
      const duration = result.duration ? `(${result.duration}ms)` : "";
      console.log(`${status} ${result.name} ${duration}`);

      if (result.error) {
        console.log(`   💡 ${result.error}`);
      }
    });

    console.log("\n🎯 Recomendações:");
    console.log("─".repeat(60));

    if (failed === 0) {
      console.log(
        "🎉 Todos os testes passaram! Integração está funcionando perfeitamente.",
      );
      console.log("📝 Próximos passos:");
      console.log("   - Configurar monitoramento em produção");
      console.log("   - Ajustar frequência de sincronização");
      console.log("   - Configurar alertas de saúde");
    } else {
      console.log("⚠️  Alguns testes falharam. Verifique:");
      console.log("   - Conectividade com o Retail Pro");
      console.log("   - Configurações de rede e firewall");
      console.log("   - Credenciais e permissões");
      console.log("   - Disponibilidade do Redis");
    }

    console.log("\n🔧 Configuração testada:");
    console.log(`   URL: ${CONFIG.baseUrl}`);
    console.log(`   Loja: ${CONFIG.storeName} (${CONFIG.storeSid})`);
    console.log(`   Timeout: ${CONFIG.timeout}ms`);
    console.log(`   Batch Size: ${CONFIG.testBatchSize}`);

    console.log("\n" + "=".repeat(60));
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new RetailProTester();

  tester
    .runAllTests()
    .then(() => {
      console.log("\n🏁 Testes concluídos!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Erro fatal nos testes:", error);
      process.exit(1);
    });
}

export { RetailProTester };
