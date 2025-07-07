#!/usr/bin/env node

/**
 * Script para testar a API de Produtos manualmente
 * Execute: node scripts/test-produtos-api.js
 */

const https = require('https');
const http = require('http');

// Configuração
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  apiKey: process.env.API_KEY || null,
  timeout: 10000,
};

// Cores para output no terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Função para fazer requisições HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.baseUrl + path);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SaudeNow-API-Test/1.0',
      },
      timeout: config.timeout,
    };

    // Adicionar API Key se configurada
    if (config.apiKey) {
      options.headers['X-API-Key'] = config.apiKey;
    }

    // Adicionar Content-Length para POST/PUT
    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = httpModule.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: { raw: responseData },
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Enviar dados para POST/PUT
    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Dados de teste
const testProducts = [
  {
    sku: 'TEST-001',
    nome: 'Produto de Teste 1',
    descricao: 'Produto criado pelo script de teste',
    categoria: 'Teste',
    preco: 99.99,
    custo: 50.00,
    peso: 0.500,
    dimensoes: {
      altura: 10,
      largura: 8,
      profundidade: 5,
    },
    imagens: ['https://example.com/test1.jpg'],
    ativo: true,
    metadata: {
      test: true,
      script: 'test-produtos-api.js',
    },
  },
  {
    sku: 'TEST-002',
    nome: 'Produto de Teste 2',
    descricao: 'Segundo produto de teste',
    categoria: 'Teste',
    preco: 149.99,
    custo: 75.00,
    peso: 0.300,
    ativo: true,
    metadata: {
      test: true,
      script: 'test-produtos-api.js',
    },
  },
];

// Testes
const tests = [
  {
    name: 'Health Check',
    run: async () => {
      try {
        const response = await makeRequest('GET', '/api/health');
        if (response.statusCode === 200 || response.statusCode === 404) {
          log('✓ Servidor está respondendo', colors.green);
          return true;
        } else {
          log(`✗ Servidor retornou status: ${response.statusCode}`, colors.red);
          return false;
        }
      } catch (error) {
        log(`✗ Erro de conexão: ${error.message}`, colors.red);
        return false;
      }
    },
  },
  {
    name: 'Listar Produtos (inicial)',
    run: async () => {
      try {
        const response = await makeRequest('GET', '/api/v1/produtos');
        
        if (response.statusCode === 200) {
          log(`✓ GET /api/v1/produtos - Status: ${response.statusCode}`, colors.green);
          log(`  Total de produtos: ${response.data.count || 0}`, colors.cyan);
          return { success: true, initialCount: response.data.count || 0 };
        } else {
          log(`✗ GET /api/v1/produtos - Status: ${response.statusCode}`, colors.red);
          log(`  Erro: ${response.data.error || 'Erro desconhecido'}`, colors.red);
          return { success: false };
        }
      } catch (error) {
        log(`✗ Erro ao listar produtos: ${error.message}`, colors.red);
        return { success: false };
      }
    },
  },
  {
    name: 'Criar Produto 1',
    run: async () => {
      try {
        const response = await makeRequest('POST', '/api/v1/produtos', testProducts[0]);
        
        if (response.statusCode === 201) {
          log(`✓ POST /api/v1/produtos - Status: ${response.statusCode}`, colors.green);
          log(`  Produto criado: ${response.data.data.nome} (ID: ${response.data.data.id})`, colors.cyan);
          return { success: true, productId: response.data.data.id };
        } else {
          log(`✗ POST /api/v1/produtos - Status: ${response.statusCode}`, colors.red);
          log(`  Erro: ${response.data.error || 'Erro desconhecido'}`, colors.red);
          if (response.data.details) {
            response.data.details.forEach(detail => log(`    - ${detail}`, colors.yellow));
          }
          return { success: false };
        }
      } catch (error) {
        log(`✗ Erro ao criar produto: ${error.message}`, colors.red);
        return { success: false };
      }
    },
  },
  {
    name: 'Buscar Produto por ID',
    run: async (context) => {
      if (!context.productId) {
        log('✗ Produto ID não disponível do teste anterior', colors.red);
        return { success: false };
      }

      try {
        const response = await makeRequest('GET', `/api/v1/produtos/${context.productId}`);
        
        if (response.statusCode === 200) {
          log(`✓ GET /api/v1/produtos/${context.productId} - Status: ${response.statusCode}`, colors.green);
          log(`  Produto encontrado: ${response.data.data.nome}`, colors.cyan);
          return { success: true };
        } else {
          log(`✗ GET /api/v1/produtos/${context.productId} - Status: ${response.statusCode}`, colors.red);
          log(`  Erro: ${response.data.error || 'Erro desconhecido'}`, colors.red);
          return { success: false };
        }
      } catch (error) {
        log(`✗ Erro ao buscar produto: ${error.message}`, colors.red);
        return { success: false };
      }
    },
  },
  {
    name: 'Atualizar Produto',
    run: async (context) => {
      if (!context.productId) {
        log('✗ Produto ID não disponível do teste anterior', colors.red);
        return { success: false };
      }

      const updateData = {
        nome: 'Produto de Teste 1 - Atualizado',
        preco: 119.99,
        metadata: {
          test: true,
          updated: true,
          script: 'test-produtos-api.js',
        },
      };

      try {
        const response = await makeRequest('PUT', `/api/v1/produtos/${context.productId}`, updateData);
        
        if (response.statusCode === 200) {
          log(`✓ PUT /api/v1/produtos/${context.productId} - Status: ${response.statusCode}`, colors.green);
          log(`  Produto atualizado: ${response.data.data.nome}`, colors.cyan);
          log(`  Novo preço: R$ ${response.data.data.preco}`, colors.cyan);
          return { success: true };
        } else {
          log(`✗ PUT /api/v1/produtos/${context.productId} - Status: ${response.statusCode}`, colors.red);
          log(`  Erro: ${response.data.error || 'Erro desconhecido'}`, colors.red);
          return { success: false };
        }
      } catch (error) {
        log(`✗ Erro ao atualizar produto: ${error.message}`, colors.red);
        return { success: false };
      }
    },
  },
  {
    name: 'Criar Produtos em Lote',
    run: async () => {
      const bulkData = {
        produtos: testProducts.slice(1), // Skip first product (already created)
      };

      try {
        const response = await makeRequest('POST', '/api/v1/produtos/bulk', bulkData);
        
        if (response.statusCode === 200) {
          log(`✓ POST /api/v1/produtos/bulk - Status: ${response.statusCode}`, colors.green);
          log(`  Processados: ${response.data.data.total}, Sucessos: ${response.data.data.success}, Falhas: ${response.data.data.failed}`, colors.cyan);
          
          if (response.data.data.errors.length > 0) {
            log('  Erros encontrados:', colors.yellow);
            response.data.data.errors.forEach(error => {
              log(`    - SKU ${error.sku}: ${error.error}`, colors.yellow);
            });
          }
          
          return { success: true };
        } else {
          log(`✗ POST /api/v1/produtos/bulk - Status: ${response.statusCode}`, colors.red);
          log(`  Erro: ${response.data.error || 'Erro desconhecido'}`, colors.red);
          return { success: false };
        }
      } catch (error) {
        log(`✗ Erro ao criar produtos em lote: ${error.message}`, colors.red);
        return { success: false };
      }
    },
  },
  {
    name: 'Buscar com Filtros',
    run: async () => {
      try {
        const response = await makeRequest('GET', '/api/v1/produtos?categoria=Teste&search=Produto&limit=10');
        
        if (response.statusCode === 200) {
          log(`✓ GET /api/v1/produtos (com filtros) - Status: ${response.statusCode}`, colors.green);
          log(`  Produtos encontrados: ${response.data.count}`, colors.cyan);
          log(`  Página: ${response.data.page}, Limite: ${response.data.limit}`, colors.cyan);
          return { success: true };
        } else {
          log(`✗ GET /api/v1/produtos (com filtros) - Status: ${response.statusCode}`, colors.red);
          log(`  Erro: ${response.data.error || 'Erro desconhecido'}`, colors.red);
          return { success: false };
        }
      } catch (error) {
        log(`✗ Erro ao buscar com filtros: ${error.message}`, colors.red);
        return { success: false };
      }
    },
  },
  {
    name: 'Excluir Produto',
    run: async (context) => {
      if (!context.productId) {
        log('✗ Produto ID não disponível do teste anterior', colors.red);
        return { success: false };
      }

      try {
        const response = await makeRequest('DELETE', `/api/v1/produtos/${context.productId}`);
        
        if (response.statusCode === 204) {
          log(`✓ DELETE /api/v1/produtos/${context.productId} - Status: ${response.statusCode}`, colors.green);
          log('  Produto excluído com sucesso', colors.cyan);
          return { success: true };
        } else {
          log(`✗ DELETE /api/v1/produtos/${context.productId} - Status: ${response.statusCode}`, colors.red);
          log(`  Erro: ${response.data?.error || 'Erro desconhecido'}`, colors.red);
          return { success: false };
        }
      } catch (error) {
        log(`✗ Erro ao excluir produto: ${error.message}`, colors.red);
        return { success: false };
      }
    },
  },
  {
    name: 'Validar Exclusão',
    run: async (context) => {
      if (!context.productId) {
        log('✗ Produto ID não disponível do teste anterior', colors.red);
        return { success: false };
      }

      try {
        const response = await makeRequest('GET', `/api/v1/produtos/${context.productId}`);
        
        if (response.statusCode === 404) {
          log(`✓ GET /api/v1/produtos/${context.productId} - Status: ${response.statusCode} (esperado)`, colors.green);
          log('  Produto foi excluído corretamente', colors.cyan);
          return { success: true };
        } else {
          log(`✗ GET /api/v1/produtos/${context.productId} - Status: ${response.statusCode} (produto ainda existe)`, colors.red);
          return { success: false };
        }
      } catch (error) {
        log(`✗ Erro ao validar exclusão: ${error.message}`, colors.red);
        return { success: false };
      }
    },
  },
  {
    name: 'Testar Validações',
    run: async () => {
      const invalidData = {
        sku: 'invalid-sku', // lowercase not allowed
        nome: '', // empty name
        preco: -10, // negative price
      };

      try {
        const response = await makeRequest('POST', '/api/v1/produtos', invalidData);
        
        if (response.statusCode === 400) {
          log(`✓ POST /api/v1/produtos (dados inválidos) - Status: ${response.statusCode} (esperado)`, colors.green);
          log('  Validações funcionando corretamente', colors.cyan);
          if (response.data.details) {
            log('  Erros de validação:', colors.yellow);
            response.data.details.forEach(detail => log(`    - ${detail}`, colors.yellow));
          }
          return { success: true };
        } else {
          log(`✗ POST /api/v1/produtos (dados inválidos) - Status: ${response.statusCode} (deveria ser 400)`, colors.red);
          return { success: false };
        }
      } catch (error) {
        log(`✗ Erro ao testar validações: ${error.message}`, colors.red);
        return { success: false };
      }
    },
  },
];

// Executar testes
async function runTests() {
  log('\n🧪 Iniciando testes da API de Produtos', colors.bold + colors.blue);
  log('═'.repeat(60), colors.blue);
  log(`📡 Base URL: ${config.baseUrl}`, colors.cyan);
  log(`🔑 API Key: ${config.apiKey ? 'Configurada' : 'Não configurada'}`, colors.cyan);
  log('═'.repeat(60), colors.blue);

  const results = {
    total: tests.length,
    passed: 0,
    failed: 0,
    errors: [],
  };

  const context = {}; // Compartilhar dados entre testes

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    log(`\n${i + 1}. ${test.name}`, colors.bold + colors.magenta);
    
    try {
      const result = await test.run(context);
      
      if (result && result.success) {
        results.passed++;
        // Salvar dados do contexto
        if (result.productId) context.productId = result.productId;
        if (result.initialCount !== undefined) context.initialCount = result.initialCount;
      } else {
        results.failed++;
        results.errors.push(test.name);
      }
    } catch (error) {
      log(`✗ Erro inesperado: ${error.message}`, colors.red);
      results.failed++;
      results.errors.push(test.name);
    }
  }

  // Relatório final
  log('\n' + '═'.repeat(60), colors.blue);
  log('📊 RELATÓRIO FINAL', colors.bold + colors.blue);
  log('═'.repeat(60), colors.blue);
  log(`Total de testes: ${results.total}`, colors.cyan);
  log(`✓ Passou: ${results.passed}`, colors.green);
  log(`✗ Falhou: ${results.failed}`, colors.red);
  
  if (results.errors.length > 0) {
    log('\nTestes com falha:', colors.yellow);
    results.errors.forEach(error => log(`  - ${error}`, colors.yellow));
  }

  const successRate = Math.round((results.passed / results.total) * 100);
  log(`\n📈 Taxa de sucesso: ${successRate}%`, successRate >= 80 ? colors.green : colors.red);

  if (successRate >= 80) {
    log('\n🎉 Testes concluídos com sucesso!', colors.bold + colors.green);
  } else {
    log('\n⚠️  Alguns testes falharam. Verifique a configuração da API.', colors.bold + colors.yellow);
  }

  log('═'.repeat(60), colors.blue);
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(error => {
    log(`\n💥 Erro fatal: ${error.message}`, colors.bold + colors.red);
    process.exit(1);
  });
}