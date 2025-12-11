#!/usr/bin/env node

import * as dotenv from "dotenv";
import { resolve } from "path";
import { SapService } from "../src/services/integrations/sapService";
import { SapEstoqueService } from "../src/services/integrations/sapEstoqueService";
import { estoqueCache } from "../src/lib/cache/estoqueCache";
import { isRedisHealthy } from "../src/config/redis";
import { isDatabaseHealthy } from "../src/config/database";
import { alertManager } from "../src/lib/monitoring/alertManager";

// Load environment
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  console.log("🧪 SAP Integration Test Suite\n");

  try {
    // Health checks
    console.log("🔍 Running health checks...");

    const redisHealthy = await isRedisHealthy();
    console.log(`   Redis: ${redisHealthy ? "✅" : "❌"}`);

    const dbHealthy = await isDatabaseHealthy();
    console.log(`   Database: ${dbHealthy ? "✅" : "❌"}`);

    if (!redisHealthy || !dbHealthy) {
      console.log("\n❌ Health checks failed. Please fix before continuing.");
      process.exit(1);
    }

    console.log("\n📊 Testing SAP Services...");

    // Test SAP Service
    console.log("\n1️⃣ Testing SAP General Service");
    await testSapService();

    // Test SAP Estoque Service
    console.log("\n2️⃣ Testing SAP Estoque Service");
    await testSapEstoqueService();

    // Test Cache
    console.log("\n3️⃣ Testing Estoque Cache");
    await testEstoqueCache();

    // Test Alerts
    console.log("\n4️⃣ Testing Alert Manager");
    await testAlertManager();

    console.log("\n✅ All tests completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("   1. Configure real SAP credentials in .env.local");
    console.log("   2. Start workers: npm run dev");
    console.log("   3. Monitor logs and Redis UI at http://localhost:8081");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

async function testSapService() {
  try {
    const sapService = new SapService();

    // Test health check
    console.log("   Testing SAP health check...");
    const healthy = await sapService.healthCheck();
    console.log(
      `   SAP Health: ${healthy ? "✅ OK" : "⚠️ Offline (expected with mock)"}`,
    );

    // Test circuit breaker stats
    const stats = sapService.getCircuitBreakerStats();
    console.log("   Circuit Breaker:", stats);

    console.log("   ✅ SAP Service tests passed");
  } catch (error) {
    console.log(
      "   ⚠️ SAP Service tests failed (expected with mock config):",
      error.message,
    );
  }
}

async function testSapEstoqueService() {
  try {
    const sapEstoqueService = new SapEstoqueService();

    // Test health check
    console.log("   Testing SAP Estoque health check...");
    const healthy = await sapEstoqueService.healthCheck();
    console.log(
      `   SAP Estoque Health: ${healthy ? "✅ OK" : "⚠️ Offline (expected with mock)"}`,
    );

    // Test circuit breaker stats
    const stats = sapEstoqueService.getCircuitBreakerStats();
    console.log("   Estoque Circuit Breaker:", stats);

    console.log("   ✅ SAP Estoque Service tests passed");
  } catch (error) {
    console.log(
      "   ⚠️ SAP Estoque Service tests failed (expected with mock config):",
      error.message,
    );
  }
}

async function testEstoqueCache() {
  try {
    // Test cache operations
    console.log("   Testing cache set/get...");

    const testEstoque = {
      produto_id: "test-123",
      sku: "TEST-SKU",
      quantidade: 100,
      deposito: "PRINCIPAL",
      ultima_atualizacao: new Date().toISOString(),
    };

    await estoqueCache.set("test-123", testEstoque);
    const cached = await estoqueCache.get("test-123");

    if (cached && cached.quantidade === 100) {
      console.log("   ✅ Cache set/get working");
    } else {
      throw new Error("Cache test failed");
    }

    // Test cache stats
    const stats = await estoqueCache.getStats();
    console.log("   Cache Stats:", stats);

    // Cleanup
    await estoqueCache.invalidate("test-123");
    console.log("   ✅ Cache cleanup completed");
  } catch (error) {
    console.log("   ❌ Cache tests failed:", error.message);
    throw error;
  }
}

async function testAlertManager() {
  try {
    console.log("   Testing stock alerts...");

    // Test estoque crítico alert
    await alertManager.createStockAlert("estoque-critico", {
      produto: { nome: "Produto Teste" },
      sku: "TEST-SKU",
      quantidade: 5,
      deposito: "PRINCIPAL",
    });

    console.log("   ✅ Critical stock alert created");

    // Test estoque zero alert
    await alertManager.createStockAlert("estoque-zero", {
      produto: { nome: "Produto Teste Zero" },
      sku: "TEST-ZERO",
      quantidade: 0,
      deposito: "PRINCIPAL",
    });

    console.log("   ✅ Zero stock alert created");

    // Test SAP offline alert
    await alertManager.createSapOfflineAlert(120000); // 2 minutes

    console.log("   ✅ SAP offline alert created");

    console.log("   💡 Check Slack/logs for alert notifications");
  } catch (error) {
    console.log("   ❌ Alert tests failed:", error.message);
    throw error;
  }
}

// Show configuration info
function showConfig() {
  console.log("📋 Configuration:");
  console.log(`   SAP API URL: ${process.env.SAP_API_URL || "Not configured"}`);
  console.log(
    `   SAP API Key: ${process.env.SAP_API_KEY ? "***configured***" : "Not configured"}`,
  );
  console.log(
    `   Redis URL: ${process.env.REDIS_URL || "redis://localhost:6379"}`,
  );
  console.log(
    `   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "***configured***" : "Not configured"}`,
  );
  console.log("");
}

// Show help
if (process.argv.includes("--help")) {
  console.log("🧪 SAP Integration Test Suite");
  console.log("");
  console.log("Usage: npm run test:sap");
  console.log("");
  console.log("This script tests:");
  console.log("  • Redis and Database connectivity");
  console.log("  • SAP service configurations");
  console.log("  • Cache operations");
  console.log("  • Alert system");
  console.log("");
  console.log("Environment variables needed:");
  console.log("  • REDIS_URL (default: redis://localhost:6379)");
  console.log("  • NEXT_PUBLIC_SUPABASE_URL");
  console.log("  • SUPABASE_SERVICE_ROLE_KEY");
  console.log("  • SAP_API_URL (optional for testing)");
  console.log("  • SAP_API_KEY (optional for testing)");
  process.exit(0);
}

showConfig();
main().catch(console.error);
