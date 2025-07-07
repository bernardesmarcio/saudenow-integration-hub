#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { db, dbAdmin, Tables, getTableName } from '../lib/database/supabase';
import { DevProduto, DevProdutoInsert } from '../lib/database/types';

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testDatabaseConnection() {
  log('\n🔍 Testing Supabase Database Connection for SaúdeNow Integration Hub', colors.blue + colors.bold);
  log('═'.repeat(70), colors.blue);

  try {
    // Test 1: Basic Connection Health Check
    log('\n1. Testing basic connection health...', colors.yellow);
    const isHealthy = await db.healthCheck();
    if (isHealthy) {
      log('✅ Database connection is healthy', colors.green);
    } else {
      log('❌ Database connection failed', colors.red);
      return;
    }

    // Test 2: Check table existence and structure
    log('\n2. Checking dev_ tables existence...', colors.yellow);
    const tables = ['dev_produtos', 'dev_clientes', 'dev_estoque', 'dev_vendas', 'dev_integration_logs', 'dev_users'];
    
    for (const table of tables) {
      try {
        const stats = await db.getTableStats(table as Tables);
        log(`✅ ${table}: ${stats.count} records`, colors.green);
      } catch (error) {
        log(`❌ ${table}: Table not found or error accessing`, colors.red);
        console.error(`   Error: ${error}`);
      }
    }

    // Test 3: Insert a test product
    log('\n3. Testing product insertion...', colors.yellow);
    const testProduct: DevProdutoInsert = {
      sku: `TEST-${Date.now()}`,
      nome: 'Produto de Teste',
      descricao: 'Produto criado pelo script de teste',
      categoria: 'Teste',
      preco: 99.99,
      custo: 50.00,
      peso: 0.100,
      dimensoes: {
        altura: 10,
        largura: 10,
        profundidade: 5
      },
      imagens: ['https://example.com/test.jpg'],
      ativo: true,
      metadata: {
        test: true,
        created_by: 'test-script',
        timestamp: new Date().toISOString()
      }
    };

    try {
      const insertedProduct = await db.insert<DevProduto>(Tables.PRODUTOS, testProduct);
      log(`✅ Product inserted successfully: ${insertedProduct.id} (${insertedProduct.sku})`, colors.green);
      
      // Test 4: Read the inserted product
      log('\n4. Testing product retrieval...', colors.yellow);
      const products = await db.select<DevProduto>(Tables.PRODUTOS, '*', { sku: insertedProduct.sku });
      if (products.length > 0) {
        log(`✅ Product retrieved successfully: ${products[0].nome}`, colors.green);
        log(`   Details: ${products[0].categoria} - R$ ${products[0].preco}`, colors.reset);
      } else {
        log('❌ Product not found after insertion', colors.red);
      }

      // Test 5: Update the product
      log('\n5. Testing product update...', colors.yellow);
      const updatedProduct = await db.update<DevProduto>(Tables.PRODUTOS, insertedProduct.id, {
        nome: 'Produto de Teste Atualizado',
        preco: 149.99
      });
      log(`✅ Product updated successfully: ${updatedProduct.nome} - R$ ${updatedProduct.preco}`, colors.green);

      // Test 6: Clean up - delete the test product
      log('\n6. Cleaning up test data...', colors.yellow);
      await db.delete(Tables.PRODUTOS, insertedProduct.id);
      log('✅ Test product deleted successfully', colors.green);

    } catch (error) {
      log(`❌ Product operations failed: ${error}`, colors.red);
      throw error;
    }

    // Test 7: Test table name resolution
    log('\n7. Testing table name resolution...', colors.yellow);
    const tableName = getTableName(Tables.PRODUTOS);
    log(`✅ Table name resolved: ${Tables.PRODUTOS} -> ${tableName}`, colors.green);

    // Test 8: Test different environments
    log('\n8. Testing environment configuration...', colors.yellow);
    const env = process.env.ENVIRONMENT || 'development';
    const prefix = process.env.SCHEMA_PREFIX || 'dev_';
    log(`✅ Environment: ${env}`, colors.green);
    log(`✅ Schema prefix: ${prefix}`, colors.green);

    // Test 9: Test admin client
    log('\n9. Testing admin client...', colors.yellow);
    try {
      const adminStats = await dbAdmin.getTableStats(Tables.PRODUTOS);
      log(`✅ Admin client works: ${adminStats.count} products accessible`, colors.green);
    } catch (error) {
      log(`❌ Admin client failed: ${error}`, colors.red);
    }

    // Summary
    log('\n' + '═'.repeat(70), colors.blue);
    log('🎉 Database connection test completed successfully!', colors.green + colors.bold);
    log('\nNext steps:', colors.yellow);
    log('1. Configure your .cursor-settings with your Supabase PROJECT_REF and ACCESS_TOKEN', colors.reset);
    log('2. Run the migration: Run the SQL in database/supabase/migrations/001_dev_schema.sql in your Supabase dashboard', colors.reset);
    log('3. Run the seeds: Run the SQL in database/supabase/seeds/001_dev_data.sql in your Supabase dashboard', colors.reset);
    log('4. Test MCP integration with Claude Code', colors.reset);
    log('═'.repeat(70), colors.blue);

  } catch (error) {
    log('\n❌ Database connection test failed!', colors.red + colors.bold);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      log('\n✅ Test completed successfully', colors.green);
      process.exit(0);
    })
    .catch((error) => {
      log('\n❌ Test failed', colors.red);
      console.error(error);
      process.exit(1);
    });
}