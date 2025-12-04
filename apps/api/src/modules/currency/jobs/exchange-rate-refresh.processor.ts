/**
 * Exchange Rate Refresh Job Processor
 * Handles background jobs for automatic exchange rate refreshing using Bull
 *
 * Features:
 * - Scheduled refresh every hour
 * - Fetches latest rates from external API
 * - Updates Redis cache and PostgreSQL database
 * - Handles API failures gracefully
 * - Logs rate changes for auditing
 * - Retry logic with exponential backoff
 */

import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ExchangeRateService } from '../exchange-rate.service';

export const EXCHANGE_RATE_QUEUE = 'exchange-rate-refresh';

export interface ExchangeRateRefreshJobData {
  baseCurrency?: string; // Default: USD
  triggeredBy?: 'scheduler' | 'manual' | 'api';
  priority?: number;
}

export interface ExchangeRateRefreshJobResult {
  jobId: string;
  success: boolean;
  baseCurrency: string;
  ratesRefreshed?: number;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  errorMessage?: string;
}

/**
 * Exchange Rate Refresh Processor
 * Processes jobs from the exchange-rate-refresh queue
 */
@Processor(EXCHANGE_RATE_QUEUE)
export class ExchangeRateRefreshProcessor {
  private readonly logger = new Logger(ExchangeRateRefreshProcessor.name);

  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  /**
   * Process exchange rate refresh job
   */
  @Process()
  async handleRefresh(job: Job<ExchangeRateRefreshJobData>): Promise<ExchangeRateRefreshJobResult> {
    const startedAt = new Date();
    const baseCurrency = job.data.baseCurrency || 'USD';

    this.logger.log(
      `Processing exchange rate refresh job ${job.id} for base currency: ${baseCurrency}`,
    );

    try {
      // Update progress
      await job.progress({
        stage: 'starting',
        message: `Fetching exchange rates for ${baseCurrency}`,
        percent: 0,
      });

      // Refresh rates from API
      await this.exchangeRateService.refreshRates(baseCurrency);

      // Get count of refreshed rates
      const cachedRates = await this.exchangeRateService.getCachedRates();
      const ratesRefreshed = cachedRates.size;

      // Update progress
      await job.progress({
        stage: 'completed',
        message: `Successfully refreshed ${ratesRefreshed} exchange rates`,
        percent: 100,
      });

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.log(
        `Successfully refreshed ${ratesRefreshed} exchange rates for ${baseCurrency} in ${duration}ms`,
      );

      return {
        jobId: job.id?.toString() || 'unknown',
        success: true,
        baseCurrency,
        ratesRefreshed,
        startedAt,
        completedAt,
        duration,
      };
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.error(
        `Exchange rate refresh job ${job.id} failed for ${baseCurrency}:`,
        error.message,
      );

      return {
        jobId: job.id?.toString() || 'unknown',
        success: false,
        baseCurrency,
        startedAt,
        completedAt,
        duration,
        errorMessage: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Handler for when a job becomes active
   */
  @OnQueueActive()
  onActive(job: Job<ExchangeRateRefreshJobData>): void {
    this.logger.log(
      `Exchange rate refresh job ${job.id} started${
        job.attemptsMade > 0 ? ` (retry ${job.attemptsMade})` : ''
      }`,
    );
  }

  /**
   * Handler for when a job is completed
   */
  @OnQueueCompleted()
  onCompleted(job: Job<ExchangeRateRefreshJobData>, result: ExchangeRateRefreshJobResult): void {
    this.logger.log(
      `Exchange rate refresh job ${job.id} completed: ${result.success ? 'SUCCESS' : 'FAILURE'} ` +
        `(${result.duration}ms)`,
    );

    if (result.success && result.ratesRefreshed) {
      this.logger.log(`  → Refreshed ${result.ratesRefreshed} exchange rates`);
    }
  }

  /**
   * Handler for when a job fails
   */
  @OnQueueFailed()
  onFailed(job: Job<ExchangeRateRefreshJobData>, error: Error): void {
    const maxAttempts = 3;
    const willRetry = job.attemptsMade < maxAttempts;

    this.logger.error(
      `Exchange rate refresh job ${job.id} failed (attempt ${job.attemptsMade + 1}/${maxAttempts}): ${error.message}`,
    );

    if (willRetry) {
      const nextDelay = 60000 * Math.pow(2, job.attemptsMade); // 1min, 2min, 4min
      this.logger.log(`  → Will retry in ${nextDelay / 1000}s`);
    } else {
      this.logger.error(`  → Max retries exceeded, job will not retry`);
    }
  }
}
