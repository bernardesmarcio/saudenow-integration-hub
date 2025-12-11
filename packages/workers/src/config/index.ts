import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables only in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: resolve(__dirname, "../../.env.local") });
}

export const config = {
  // Environment
  environment: process.env.ENVIRONMENT || "development",
  isProduction: process.env.ENVIRONMENT === "production",
  isDevelopment: process.env.ENVIRONMENT === "development",

  // Database
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    options: {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
    },
  },

  // Queue configuration
  queue: {
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
    rateLimiter: {
      max: 100,
      duration: 60000, // 1 minute
    },
  },

  // Worker configuration
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10),
    maxStalledCount: 3,
    stalledInterval: 30000,
  },

  // SAP Integration
  sap: {
    baseUrl: process.env.SAP_BASE_URL || "https://sap.example.com",
    username: process.env.SAP_USERNAME || "",
    password: process.env.SAP_PASSWORD || "",
    client: process.env.SAP_CLIENT || "800",
    timeout: 30000, // 30 seconds
    retryDelay: 5000, // 5 seconds
    maxRetries: 3,
    // Estoque specific endpoints
    endpoints: {
      estoque: "/api/v1/stock",
      estoqueByProduct: "/api/v1/stock/product",
      estoqueDelta: "/api/v1/stock/delta",
      estoqueCritical: "/api/v1/stock/critical",
      produtos: "/api/v1/products",
      clientes: "/api/v1/customers",
      vendas: "/api/v1/sales",
    },
  },

  // Cache TTL (in seconds)
  cache: {
    ttl: {
      estoque: parseInt(process.env.CACHE_TTL_ESTOQUE || "30", 10), // 30s for realtime
      estoqueCritical: 15, // 15s for critical items
      produtos: parseInt(process.env.CACHE_TTL_PRODUTOS || "300", 10), // 5min
      clientes: parseInt(process.env.CACHE_TTL_CLIENTES || "600", 10), // 10min
    },
    keyPrefixes: {
      estoque: "estoque:",
      estoqueCritical: "estoque:critical:",
      produto: "produto:",
      cliente: "cliente:",
      sapSync: "sap:sync:",
    },
  },

  // Monitoring
  monitoring: {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",
    alertEmail: process.env.ALERT_EMAIL || "alerts@saudenow.com",
    thresholds: {
      estoqueZero: 0,
      estoqueCritical: 10,
      syncDelayMinutes: 5,
      queueBacklog: 1000,
    },
  },

  // Cron schedules
  schedules: {
    // Estoque realtime - CRITICAL for e-commerce
    estoque: "*/2 * * * *", // Every 2 minutes
    estoqueCritical: "*/1 * * * *", // Every 1 minute for critical items

    // Other integrations
    produtos: "*/30 * * * *", // Every 30 minutes
    clientes: "0 * * * *", // Every hour
    vendas: "*/10 * * * *", // Every 10 minutes

    // Full sync
    fullSync: "0 2 * * *", // 2 AM daily

    // Maintenance
    cleanupOldJobs: "0 */6 * * *", // Every 6 hours
    healthCheck: "*/5 * * * *", // Every 5 minutes
  },

  // Webhook configuration
  webhook: {
    enabled: process.env.WEBHOOK_ENABLED === "true",
    port: parseInt(process.env.WEBHOOK_PORT || "3002", 10),
    secret: process.env.WEBHOOK_SECRET || "your-webhook-secret",
    endpoints: {
      sapEstoque: "/webhooks/sap/estoque",
      sapProdutos: "/webhooks/sap/produtos",
    },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    pretty: process.env.ENVIRONMENT !== "production",
  },
};

// Debug: list all available SUPABASE variables
console.log(
  "All SUPABASE env vars:",
  Object.keys(process.env).filter((key) => key.includes("SUPABASE")),
);

// Validate required configuration
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  } else {
    console.log(`Found: ${envVar}`);
  }
}

export default config;
