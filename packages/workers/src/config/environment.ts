import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables only in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: resolve(__dirname, "../../.env.local") });
}

export const environment = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  // Server
  PORT: parseInt(process.env.PORT || "4000", 10),

  // Database
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  // SAP Integration
  sap: {
    apiUrl: process.env.SAP_API_URL || "https://sap-api.empresa.com",
    apiKey: process.env.SAP_API_KEY || "",
    client: process.env.SAP_CLIENT || "800",
    rateLimit: parseInt(process.env.SAP_RATE_LIMIT || "100", 10),
  },

  // Worker configuration
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10),
  },

  // Cache TTL (seconds)
  cache: {
    estoque: parseInt(process.env.CACHE_TTL_ESTOQUE || "30", 10),
    produtos: parseInt(process.env.CACHE_TTL_PRODUTOS || "300", 10),
    clientes: parseInt(process.env.CACHE_TTL_CLIENTES || "600", 10),
  },

  // Monitoring
  monitoring: {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",
    alertEmail: process.env.ALERT_EMAIL || "alerts@saudenow.com",
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },

  // Webhook configuration
  webhook: {
    enabled: process.env.WEBHOOK_ENABLED === "true",
    secret: process.env.WEBHOOK_SECRET || "your-webhook-secret",
    port: parseInt(process.env.WEBHOOK_PORT || "3002", 10),
  },
};

// Validate required environment variables
const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}`,
  );
}

export default environment;
