import { logger } from "../logger";

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

interface CircuitBreakerOptions {
  threshold?: number;
  timeout?: number;
  resetTimeout?: number;
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly resetTimeout: number; // eslint-disable-line @typescript-eslint/no-unused-vars
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds - reserved for future implementation
    this.name = options.name || "CircuitBreaker";
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      this.state = CircuitState.HALF_OPEN;
      logger.info(`Circuit breaker ${this.name} moved to HALF_OPEN state`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        logger.info(`Circuit breaker ${this.name} moved to CLOSED state`);
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.successCount = 0;

    if (this.failures >= this.threshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.timeout;
      logger.warn(
        `Circuit breaker ${this.name} moved to OPEN state. ` +
          `Will retry at ${new Date(this.nextAttempt).toISOString()}`,
      );
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      nextAttempt:
        this.state === CircuitState.OPEN ? new Date(this.nextAttempt) : null,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    logger.info(`Circuit breaker ${this.name} manually reset`);
  }
}

// Create specific circuit breakers for different services
export const sapCircuitBreaker = new CircuitBreaker({
  name: "SAP",
  threshold: 5,
  timeout: 60000,
});

export const estoqueCircuitBreaker = new CircuitBreaker({
  name: "Estoque",
  threshold: 3,
  timeout: 30000, // Shorter timeout for critical stock updates
});

export const notificationCircuitBreaker = new CircuitBreaker({
  name: "Notification",
  threshold: 10,
  timeout: 120000,
});
