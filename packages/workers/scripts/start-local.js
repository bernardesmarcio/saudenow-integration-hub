#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting SaúdeNow Workers Local Development...\n");

// Check if Docker is running
function checkDockerRunning() {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if Redis is already running
function checkRedisRunning() {
  try {
    execSync('docker ps --format "table {{.Names}}" | grep -q redis', {
      stdio: "ignore",
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if .env.local exists
function checkEnvFile() {
  const envPath = path.join(__dirname, "../.env.local");
  return fs.existsSync(envPath);
}

async function main() {
  // Pre-flight checks
  console.log("🔍 Running pre-flight checks...");

  if (!checkDockerRunning()) {
    console.error(
      "❌ Docker is not running. Please start Docker and try again.",
    );
    process.exit(1);
  }
  console.log("✅ Docker is running");

  if (!checkEnvFile()) {
    console.error(
      "❌ .env.local file not found. Please copy from .env.example and configure.",
    );
    process.exit(1);
  }
  console.log("✅ Environment file found");

  // Start Redis if not running
  if (!checkRedisRunning()) {
    console.log("📦 Starting Redis container...");
    try {
      execSync("docker-compose up -d redis", {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
      });
      console.log("✅ Redis started successfully");
    } catch (error) {
      console.error("❌ Failed to start Redis:", error.message);
      process.exit(1);
    }
  } else {
    console.log("✅ Redis is already running");
  }

  // Wait for Redis to be ready
  console.log("⏳ Waiting for Redis to be ready...");
  let redisReady = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!redisReady && attempts < maxAttempts) {
    try {
      execSync("docker exec $(docker ps -q -f name=redis) redis-cli ping", {
        stdio: "ignore",
      });
      redisReady = true;
    } catch (error) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (!redisReady) {
    console.error("❌ Redis failed to start after 10 seconds");
    process.exit(1);
  }
  console.log("✅ Redis is ready");

  // Show Redis info
  try {
    console.log("\n📊 Redis Info:");
    console.log("   • Redis UI: http://localhost:8081");
    console.log(
      "   • Redis CLI: docker exec -it $(docker ps -q -f name=redis) redis-cli",
    );
  } catch (error) {
    // Ignore
  }

  console.log("\n🔧 Starting TypeScript compilation...");
  try {
    execSync("npm run build", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    console.log("✅ Build completed");
  } catch (error) {
    console.warn("⚠️  Build failed, starting in dev mode");
  }

  // Start the workers
  console.log("\n🚀 Starting Workers...");
  console.log("   Press Ctrl+C to stop\n");

  const workerProcess = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, NODE_ENV: "development" },
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping workers...");
    workerProcess.kill("SIGTERM");

    console.log("🛑 Stopping Redis...");
    try {
      execSync("docker-compose down", {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit",
      });
    } catch (error) {
      console.warn("⚠️  Failed to stop Redis gracefully");
    }

    console.log("✅ Cleanup completed");
    process.exit(0);
  });

  workerProcess.on("exit", (code) => {
    console.log(`\n📊 Worker process exited with code ${code}`);
    if (code !== 0) {
      console.log("💡 Tips:");
      console.log("   • Check the logs above for errors");
      console.log("   • Verify your .env.local configuration");
      console.log("   • Make sure Supabase credentials are correct");
      console.log("   • Check if Redis is accessible");
    }
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error("❌ Failed to start:", error);
  process.exit(1);
});
