import { sapLogger } from "../logger";
import { CacheManager } from "../cache/cacheManager";

export interface RetailProMetrics {
  // Sync Metrics
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  avg_sync_duration: number;
  last_sync_timestamp: string | null;

  // API Metrics
  total_api_calls: number;
  successful_api_calls: number;
  failed_api_calls: number;
  avg_response_time: number;

  // Data Metrics
  total_products: number;
  products_with_stock: number;
  products_out_of_stock: number;
  products_low_stock: number;

  // Cache Metrics
  cache_hit_rate: number;
  cache_miss_rate: number;
  cache_size: number;

  // Performance Metrics
  throughput_per_minute: number;
  error_rate: number;
  availability: number;

  // Store Specific
  store_sid: string;
  store_name: string;
  last_updated: string;
}

export class RetailProMetricsCollector {
  private logger = sapLogger.child({ metrics: "RetailProMetrics" });
  private readonly METRICS_CACHE_PREFIX = "retailpro:metrics";
  private readonly METRICS_TTL = 3600; // 1 hour

  /**
   * Collect comprehensive metrics for a store
   */
  async collectStoreMetrics(storeSid: string): Promise<RetailProMetrics> {
    try {
      this.logger.debug("Collecting store metrics", { storeSid });

      const [
        syncMetrics,
        apiMetrics,
        dataMetrics,
        cacheMetrics,
        performanceMetrics,
      ] = await Promise.all([
        this.collectSyncMetrics(storeSid),
        this.collectApiMetrics(storeSid),
        this.collectDataMetrics(storeSid),
        this.collectCacheMetrics(storeSid),
        this.collectPerformanceMetrics(storeSid),
      ]);

      const metrics: RetailProMetrics = {
        // Sync Metrics - with defaults
        total_syncs: syncMetrics.total_syncs ?? 0,
        successful_syncs: syncMetrics.successful_syncs ?? 0,
        failed_syncs: syncMetrics.failed_syncs ?? 0,
        avg_sync_duration: syncMetrics.avg_sync_duration ?? 0,
        last_sync_timestamp: syncMetrics.last_sync_timestamp ?? null,
        // API Metrics - with defaults
        total_api_calls: apiMetrics.total_api_calls ?? 0,
        successful_api_calls: apiMetrics.successful_api_calls ?? 0,
        failed_api_calls: apiMetrics.failed_api_calls ?? 0,
        avg_response_time: apiMetrics.avg_response_time ?? 0,
        // Data Metrics - with defaults
        total_products: dataMetrics.total_products ?? 0,
        products_with_stock: dataMetrics.products_with_stock ?? 0,
        products_out_of_stock: dataMetrics.products_out_of_stock ?? 0,
        products_low_stock: dataMetrics.products_low_stock ?? 0,
        // Cache Metrics - with defaults
        cache_hit_rate: cacheMetrics.cache_hit_rate ?? 0,
        cache_miss_rate: cacheMetrics.cache_miss_rate ?? 0,
        cache_size: cacheMetrics.cache_size ?? 0,
        // Performance Metrics - with defaults
        throughput_per_minute: performanceMetrics.throughput_per_minute ?? 0,
        error_rate: performanceMetrics.error_rate ?? 0,
        availability: performanceMetrics.availability ?? 0,
        // Store Info
        store_sid: storeSid,
        store_name: this.getStoreName(storeSid),
        last_updated: new Date().toISOString(),
      };

      // Cache the metrics
      await this.cacheMetrics(storeSid, metrics);

      this.logger.info("Store metrics collected", { storeSid, metrics });
      return metrics;
    } catch (error) {
      this.logger.error("Error collecting store metrics", { storeSid, error });
      throw error;
    }
  }

  /**
   * Get cached metrics or collect new ones
   */
  async getStoreMetrics(
    storeSid: string,
    forceRefresh = false,
  ): Promise<RetailProMetrics> {
    if (!forceRefresh) {
      const cached = await this.getCachedMetrics(storeSid);
      if (cached) {
        return cached;
      }
    }

    return await this.collectStoreMetrics(storeSid);
  }

  /**
   * Record a sync operation
   */
  async recordSyncOperation(
    storeSid: string,
    type: string,
    success: boolean,
    duration: number,
    itemsProcessed: number,
  ): Promise<void> {
    try {
      const key = `${this.METRICS_CACHE_PREFIX}:sync:${storeSid}`;

      // Increment counters
      await this.incrementCounter(`${key}:total`);

      if (success) {
        await this.incrementCounter(`${key}:success`);
      } else {
        await this.incrementCounter(`${key}:failed`);
      }

      // Record duration
      await this.recordDuration(`${key}:duration`, duration);

      // Record throughput
      await this.recordThroughput(
        `${key}:throughput`,
        itemsProcessed,
        duration,
      );

      this.logger.debug("Sync operation recorded", {
        storeSid,
        type,
        success,
        duration,
        itemsProcessed,
      });
    } catch (error) {
      this.logger.error("Error recording sync operation", { storeSid, error });
    }
  }

  /**
   * Record an API call
   */
  async recordApiCall(
    storeSid: string,
    endpoint: string,
    success: boolean,
    responseTime: number,
  ): Promise<void> {
    try {
      const key = `${this.METRICS_CACHE_PREFIX}:api:${storeSid}`;

      // Increment counters
      await this.incrementCounter(`${key}:total`);

      if (success) {
        await this.incrementCounter(`${key}:success`);
      } else {
        await this.incrementCounter(`${key}:failed`);
      }

      // Record response time
      await this.recordDuration(`${key}:response_time`, responseTime);

      this.logger.debug("API call recorded", {
        storeSid,
        endpoint,
        success,
        responseTime,
      });
    } catch (error) {
      this.logger.error("Error recording API call", { storeSid, error });
    }
  }

  /**
   * Record cache hit/miss
   */
  async recordCacheOperation(
    storeSid: string,
    operation: "hit" | "miss",
    cacheType: "product" | "stock" | "config",
  ): Promise<void> {
    try {
      const key = `${this.METRICS_CACHE_PREFIX}:cache:${storeSid}:${cacheType}`;
      await this.incrementCounter(`${key}:${operation}`);

      this.logger.debug("Cache operation recorded", {
        storeSid,
        operation,
        cacheType,
      });
    } catch (error) {
      this.logger.error("Error recording cache operation", { storeSid, error });
    }
  }

  /**
   * Get metrics summary for dashboard
   */
  async getMetricsSummary(storeSid: string): Promise<{
    health_score: number;
    sync_status: "healthy" | "degraded" | "unhealthy";
    api_status: "healthy" | "degraded" | "unhealthy";
    cache_status: "healthy" | "degraded" | "unhealthy";
    last_issues: string[];
  }> {
    try {
      const metrics = await this.getStoreMetrics(storeSid);

      // Calculate health scores
      const syncHealth = this.calculateSyncHealth(metrics);
      const apiHealth = this.calculateApiHealth(metrics);
      const cacheHealth = this.calculateCacheHealth(metrics);

      const overallHealth = (syncHealth + apiHealth + cacheHealth) / 3;

      return {
        health_score: Math.round(overallHealth * 100),
        sync_status: this.getHealthStatus(syncHealth),
        api_status: this.getHealthStatus(apiHealth),
        cache_status: this.getHealthStatus(cacheHealth),
        last_issues: await this.getRecentIssues(storeSid),
      };
    } catch (error) {
      this.logger.error("Error getting metrics summary", { storeSid, error });
      return {
        health_score: 0,
        sync_status: "unhealthy",
        api_status: "unhealthy",
        cache_status: "unhealthy",
        last_issues: ["Error collecting metrics"],
      };
    }
  }

  private async collectSyncMetrics(
    storeSid: string,
  ): Promise<Partial<RetailProMetrics>> {
    try {
      const key = `${this.METRICS_CACHE_PREFIX}:sync:${storeSid}`;

      const [totalSyncs, successfulSyncs, failedSyncs, avgDuration, lastSync] =
        await Promise.all([
          this.getCounter(`${key}:total`),
          this.getCounter(`${key}:success`),
          this.getCounter(`${key}:failed`),
          this.getAverageDuration(`${key}:duration`),
          this.getLastTimestamp(`${key}:last_sync`),
        ]);

      return {
        total_syncs: totalSyncs,
        successful_syncs: successfulSyncs,
        failed_syncs: failedSyncs,
        avg_sync_duration: avgDuration,
        last_sync_timestamp: lastSync,
      };
    } catch (error) {
      this.logger.error("Error collecting sync metrics", { storeSid, error });
      return {
        total_syncs: 0,
        successful_syncs: 0,
        failed_syncs: 0,
        avg_sync_duration: 0,
        last_sync_timestamp: null,
      };
    }
  }

  private async collectApiMetrics(
    storeSid: string,
  ): Promise<Partial<RetailProMetrics>> {
    try {
      const key = `${this.METRICS_CACHE_PREFIX}:api:${storeSid}`;

      const [totalCalls, successfulCalls, failedCalls, avgResponseTime] =
        await Promise.all([
          this.getCounter(`${key}:total`),
          this.getCounter(`${key}:success`),
          this.getCounter(`${key}:failed`),
          this.getAverageDuration(`${key}:response_time`),
        ]);

      return {
        total_api_calls: totalCalls,
        successful_api_calls: successfulCalls,
        failed_api_calls: failedCalls,
        avg_response_time: avgResponseTime,
      };
    } catch (error) {
      this.logger.error("Error collecting API metrics", { storeSid, error });
      return {
        total_api_calls: 0,
        successful_api_calls: 0,
        failed_api_calls: 0,
        avg_response_time: 0,
      };
    }
  }

  private async collectDataMetrics(
    storeSid: string,
  ): Promise<Partial<RetailProMetrics>> {
    try {
      // In real implementation, this would query the database
      // For now, return mock data
      return {
        total_products: 29875,
        products_with_stock: 25342,
        products_out_of_stock: 2156,
        products_low_stock: 2377,
      };
    } catch (error) {
      this.logger.error("Error collecting data metrics", { storeSid, error });
      return {
        total_products: 0,
        products_with_stock: 0,
        products_out_of_stock: 0,
        products_low_stock: 0,
      };
    }
  }

  private async collectCacheMetrics(
    storeSid: string,
  ): Promise<Partial<RetailProMetrics>> {
    try {
      const key = `${this.METRICS_CACHE_PREFIX}:cache:${storeSid}`;

      const [productHits, productMisses, stockHits, stockMisses] =
        await Promise.all([
          this.getCounter(`${key}:product:hit`),
          this.getCounter(`${key}:product:miss`),
          this.getCounter(`${key}:stock:hit`),
          this.getCounter(`${key}:stock:miss`),
        ]);

      const totalHits = productHits + stockHits;
      const totalMisses = productMisses + stockMisses;
      const totalRequests = totalHits + totalMisses;

      const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
      const missRate = totalRequests > 0 ? totalMisses / totalRequests : 0;

      return {
        cache_hit_rate: hitRate,
        cache_miss_rate: missRate,
        cache_size: totalRequests,
      };
    } catch (error) {
      this.logger.error("Error collecting cache metrics", { storeSid, error });
      return {
        cache_hit_rate: 0,
        cache_miss_rate: 0,
        cache_size: 0,
      };
    }
  }

  private async collectPerformanceMetrics(
    storeSid: string,
  ): Promise<Partial<RetailProMetrics>> {
    try {
      const throughput = await this.getThroughput(storeSid);
      const errorRate = await this.getErrorRate(storeSid);
      const availability = await this.getAvailability(storeSid);

      return {
        throughput_per_minute: throughput,
        error_rate: errorRate,
        availability: availability,
      };
    } catch (error) {
      this.logger.error("Error collecting performance metrics", {
        storeSid,
        error,
      });
      return {
        throughput_per_minute: 0,
        error_rate: 0,
        availability: 0,
      };
    }
  }

  // Helper methods
  private async cacheMetrics(
    storeSid: string,
    metrics: RetailProMetrics,
  ): Promise<void> {
    const key = `${this.METRICS_CACHE_PREFIX}:summary:${storeSid}`;
    await CacheManager.set(key, metrics, this.METRICS_TTL);
  }

  private async getCachedMetrics(
    storeSid: string,
  ): Promise<RetailProMetrics | null> {
    const key = `${this.METRICS_CACHE_PREFIX}:summary:${storeSid}`;
    return await CacheManager.get<RetailProMetrics>(key);
  }

  private async incrementCounter(key: string): Promise<void> {
    await CacheManager.incr(key);
    await CacheManager.expire(key, 24 * 60 * 60); // 24 hours expiry
  }

  private async getCounter(key: string): Promise<number> {
    const value = await CacheManager.get<number>(key);
    return value || 0;
  }

  private async recordDuration(key: string, duration: number): Promise<void> {
    // Implement a simple moving average for durations
    const currentAvg = (await CacheManager.get<number>(`${key}:avg`)) || 0;
    const count = (await CacheManager.get<number>(`${key}:count`)) || 0;

    const newCount = count + 1;
    const newAvg = (currentAvg * count + duration) / newCount;

    await CacheManager.set(`${key}:avg`, newAvg, 24 * 60 * 60);
    await CacheManager.set(`${key}:count`, newCount, 24 * 60 * 60);
  }

  private async getAverageDuration(key: string): Promise<number> {
    return (await CacheManager.get<number>(`${key}:avg`)) || 0;
  }

  private async recordThroughput(
    key: string,
    items: number,
    duration: number,
  ): Promise<void> {
    const itemsPerMinute = duration > 0 ? (items / duration) * 60000 : 0;
    await this.recordDuration(`${key}:items_per_minute`, itemsPerMinute);
  }

  private async getThroughput(storeSid: string): Promise<number> {
    const key = `${this.METRICS_CACHE_PREFIX}:sync:${storeSid}:throughput:items_per_minute`;
    return await this.getAverageDuration(key);
  }

  private async getErrorRate(storeSid: string): Promise<number> {
    const successful = await this.getCounter(
      `${this.METRICS_CACHE_PREFIX}:api:${storeSid}:success`,
    );
    const failed = await this.getCounter(
      `${this.METRICS_CACHE_PREFIX}:api:${storeSid}:failed`,
    );
    const total = successful + failed;

    return total > 0 ? failed / total : 0;
  }

  private async getAvailability(storeSid: string): Promise<number> {
    // Mock availability calculation - in real implementation this would be based on uptime
    const errorRate = await this.getErrorRate(storeSid);
    return Math.max(0, 1 - errorRate);
  }

  private async getLastTimestamp(key: string): Promise<string | null> {
    return await CacheManager.get<string>(key);
  }

  private calculateSyncHealth(metrics: RetailProMetrics): number {
    const successRate =
      metrics.total_syncs > 0
        ? metrics.successful_syncs / metrics.total_syncs
        : 1;
    const recentSync = metrics.last_sync_timestamp
      ? Date.now() - new Date(metrics.last_sync_timestamp).getTime() <
        2 * 60 * 60 * 1000
      : false; // Within 2 hours

    return successRate * 0.7 + (recentSync ? 0.3 : 0);
  }

  private calculateApiHealth(metrics: RetailProMetrics): number {
    const successRate =
      metrics.total_api_calls > 0
        ? metrics.successful_api_calls / metrics.total_api_calls
        : 1;
    const responseTimeHealth =
      metrics.avg_response_time < 5000
        ? 1
        : Math.max(0, 1 - (metrics.avg_response_time - 5000) / 10000);

    return successRate * 0.6 + responseTimeHealth * 0.4;
  }

  private calculateCacheHealth(metrics: RetailProMetrics): number {
    return metrics.cache_hit_rate;
  }

  private getHealthStatus(score: number): "healthy" | "degraded" | "unhealthy" {
    if (score >= 0.8) return "healthy";
    if (score >= 0.5) return "degraded";
    return "unhealthy";
  }

  private async getRecentIssues(_storeSid: string): Promise<string[]> {
    // In real implementation, this would query error logs
    return [];
  }

  private getStoreName(storeSid: string): string {
    const storeNames: Record<string, string> = {
      "621769196001438846": "Loja Resende",
    };
    return storeNames[storeSid] || "Loja Desconhecida";
  }
}

// Export singleton instance
export const retailProMetrics = new RetailProMetricsCollector();
