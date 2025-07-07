import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { sapLogger } from '../../lib/logger';
import { CircuitBreaker } from '../../lib/patterns/circuitBreaker';
import { retryWithBackoff } from '../../lib/patterns/retryLogic';

export interface IntegrationConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  circuitBreaker?: CircuitBreaker;
  rateLimitPerMinute?: number;
}

export abstract class BaseIntegrationService {
  protected client: AxiosInstance;
  protected circuitBreaker: CircuitBreaker;
  protected rateLimitPerMinute: number;
  protected requestCount = 0;
  protected requestWindowStart = Date.now();

  constructor(config: IntegrationConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.circuitBreaker = config.circuitBreaker || new CircuitBreaker({
      name: this.constructor.name,
      threshold: 5,
      timeout: 60000,
    });

    this.rateLimitPerMinute = config.rateLimitPerMinute || 100;

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Rate limiting check
        await this.checkRateLimit();
        
        // Log request
        sapLogger.debug('API Request', {
          method: config.method,
          url: config.url,
          params: config.params,
        });

        return config;
      },
      (error) => {
        sapLogger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        sapLogger.debug('API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        const errorData = {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        };

        sapLogger.error('API Error', errorData);
        return Promise.reject(error);
      }
    );
  }

  protected async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute

    // Reset window if needed
    if (now - this.requestWindowStart > windowDuration) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }

    this.requestCount++;

    // If rate limit exceeded, wait
    if (this.requestCount > this.rateLimitPerMinute) {
      const waitTime = windowDuration - (now - this.requestWindowStart);
      sapLogger.warn(`Rate limit reached. Waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      
      // Reset after waiting
      this.requestCount = 1;
      this.requestWindowStart = Date.now();
    }
  }

  protected async executeRequest<T>(
    request: () => Promise<T>,
    useCircuitBreaker = true
  ): Promise<T> {
    const operation = () => retryWithBackoff(request, {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
    });

    if (useCircuitBreaker) {
      return this.circuitBreaker.execute(operation);
    }

    return operation();
  }

  protected async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.executeRequest(async () => {
      const response = await this.client.get<T>(url, config);
      return response.data;
    });
  }

  protected async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.executeRequest(async () => {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    });
  }

  protected async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.executeRequest(async () => {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    });
  }

  protected async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.executeRequest(async () => {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    });
  }

  /**
   * Transform external data to internal format
   */
  protected abstract transformToInternal(data: any): any;

  /**
   * Transform internal data to external format
   */
  protected abstract transformToExternal(data: any): any;

  /**
   * Get service health status
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Override in subclass with actual health check endpoint
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get circuit breaker stats
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }
}