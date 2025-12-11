import pRetry from "p-retry";
import { logger } from "../logger";

interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  onFailedAttempt?: (error: any) => void;
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    retries = 3,
    minTimeout = 1000,
    maxTimeout = 30000,
    factor = 2,
    onFailedAttempt,
  } = options;

  return pRetry(operation, {
    retries,
    minTimeout,
    maxTimeout,
    factor,
    onFailedAttempt: (error) => {
      logger.warn(
        `Retry attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
        {
          error: error.message,
          attemptNumber: error.attemptNumber,
          retriesLeft: error.retriesLeft,
        },
      );

      if (onFailedAttempt) {
        onFailedAttempt(error);
      }
    },
  });
}

/**
 * Retry with fixed delay
 */
export async function retryWithFixedDelay<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      logger.warn(`Fixed retry attempt ${attempt}/${retries} failed`, {
        error: error.message,
      });

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Retry with custom strategy
 */
export async function retryWithStrategy<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: any, attempt: number) => boolean,
  getDelay: (attempt: number) => number,
  maxAttempts = 5,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (!shouldRetry(error, attempt) || attempt === maxAttempts) {
        throw error;
      }

      const delay = getDelay(attempt);
      logger.debug(
        `Custom retry: waiting ${delay}ms before attempt ${attempt + 1}`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Retry specifically for SAP operations with custom logic
 */
export async function retrySapOperation<T>(
  operation: () => Promise<T>,
  _resourceType: string, // Prefix with underscore to indicate intentionally unused
): Promise<T> {
  return retryWithStrategy(
    operation,
    (error, attempt) => {
      // Don't retry on specific errors
      if (error.response?.status === 404) return false;
      if (error.response?.status === 401) return false;
      if (error.code === "ENOTFOUND") return false;

      // Retry on timeout, network errors, or 5xx errors
      if (error.code === "ECONNABORTED") return true;
      if (error.code === "ETIMEDOUT") return true;
      if (error.response?.status >= 500) return true;
      if (error.response?.status === 429) return true; // Rate limit

      return attempt < 3; // Default: retry up to 3 times
    },
    (attempt) => {
      // Exponential backoff with jitter
      const baseDelay = 1000 * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      return Math.min(baseDelay + jitter, 30000);
    },
    5,
  );
}

/**
 * Retry for critical stock operations (more aggressive)
 */
export async function retryCriticalStockOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  return retryWithBackoff(operation, {
    retries: 10, // More retries for critical operations
    minTimeout: 500, // Start with shorter delay
    maxTimeout: 5000, // Cap at 5 seconds
    factor: 1.5, // Less aggressive backoff
  });
}
