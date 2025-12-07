import { Injectable, Logger, TooManyRequestsException } from '@nestjs/common';

/**
 * Plaid Rate Limiter Service
 * Implements client-side rate limiting to prevent exceeding Plaid API limits
 *
 * Plaid Production Limits:
 * - Most endpoints: 100 requests per minute
 * - Burst: 200 requests per minute (2x multiplier)
 * - Some endpoints have lower limits
 */
@Injectable()
export class PlaidRateLimiterService {
  private readonly logger = new Logger(PlaidRateLimiterService.name);
  private requestCounts = new Map<string, number[]>();

  // Rate limits per endpoint (requests per minute)
  private readonly limits: Record<string, number> = {
    'link_token_create': 100,
    'item_public_token_exchange': 100,
    'accounts_get': 100,
    'accounts_balance_get': 100,
    'transactions_sync': 100,
    'transactions_get': 100,
    'item_get': 100,
    'item_remove': 10,
    'default': 100,
  };

  /**
   * Check if rate limit is exceeded for an endpoint
   * @param endpoint The Plaid API endpoint name
   * @throws TooManyRequestsException if rate limit exceeded
   */
  async checkRateLimit(endpoint: string): Promise<void> {
    const limit = this.limits[endpoint] || this.limits.default;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    // Get or create request log for this endpoint
    const key = endpoint;
    let requests = this.requestCounts.get(key) || [];

    // Remove requests older than 1 minute
    requests = requests.filter((timestamp) => now - timestamp < windowMs);

    // Check if limit exceeded
    if (requests.length >= limit) {
      const oldestRequest = Math.min(...requests);
      const resetTime = Math.ceil((oldestRequest + windowMs - now) / 1000);

      this.logger.warn(
        `Rate limit exceeded for ${endpoint}. Limit: ${limit} req/min. Reset in ${resetTime}s`,
      );

      throw new TooManyRequestsException(
        `Rate limit exceeded for ${endpoint}. Please try again in ${resetTime} seconds.`,
      );
    }

    // Add current request
    requests.push(now);
    this.requestCounts.set(key, requests);

    // Log if approaching limit (80%)
    if (requests.length >= limit * 0.8) {
      this.logger.warn(
        `Approaching rate limit for ${endpoint}: ${requests.length}/${limit} requests`,
      );
    }
  }

  /**
   * Get current request count for an endpoint
   */
  getRequestCount(endpoint: string): number {
    const now = Date.now();
    const windowMs = 60000;
    const requests = this.requestCounts.get(endpoint) || [];

    return requests.filter((timestamp) => now - timestamp < windowMs).length;
  }

  /**
   * Get remaining requests for an endpoint
   */
  getRemainingRequests(endpoint: string): number {
    const limit = this.limits[endpoint] || this.limits.default;
    const count = this.getRequestCount(endpoint);
    return Math.max(0, limit - count);
  }

  /**
   * Reset rate limits for an endpoint (for testing)
   */
  reset(endpoint?: string): void {
    if (endpoint) {
      this.requestCounts.delete(endpoint);
    } else {
      this.requestCounts.clear();
    }
  }

  /**
   * Clean up old entries periodically
   */
  cleanup(): void {
    const now = Date.now();
    const windowMs = 60000;

    for (const [key, requests] of this.requestCounts.entries()) {
      const activeRequests = requests.filter(
        (timestamp) => now - timestamp < windowMs,
      );

      if (activeRequests.length === 0) {
        this.requestCounts.delete(key);
      } else {
        this.requestCounts.set(key, activeRequests);
      }
    }
  }
}
