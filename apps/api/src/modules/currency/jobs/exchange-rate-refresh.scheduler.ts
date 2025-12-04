/**
 * Exchange Rate Refresh Scheduler
 * Manages scheduled exchange rate refresh jobs using Bull and NestJS Scheduler
 *
 * Features:
 * - Hourly: Refresh exchange rates (configurable)
 * - Configurable base currencies
 * - Job staggering for multiple base currencies
 * - Manual refresh support
 * - Queue health monitoring
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import {
  EXCHANGE_RATE_QUEUE,
  ExchangeRateRefreshJobData,
} from './exchange-rate-refresh.processor';

/**
 * Exchange Rate Refresh Scheduler
 * Schedules recurring exchange rate refresh jobs
 */
@Injectable()
export class ExchangeRateRefreshScheduler {
  private readonly logger = new Logger(ExchangeRateRefreshScheduler.name);
  private readonly isEnabled: boolean;
  private readonly baseCurrencies: string[];
  private readonly staggerDelayMs: number;

  constructor(
    @InjectQueue(EXCHANGE_RATE_QUEUE)
    private readonly exchangeRateQueue: Queue<ExchangeRateRefreshJobData>,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled =
      this.configService.get<string>('EXCHANGE_RATE_REFRESH_ENABLED', 'true') === 'true';
    this.baseCurrencies = this.configService
      .get<string>('EXCHANGE_RATE_BASE_CURRENCIES', 'USD,EUR,GBP')
      .split(',')
      .map((c) => c.trim());
    this.staggerDelayMs = this.configService.get<number>(
      'EXCHANGE_RATE_STAGGER_DELAY_MS',
      10000,
    ); // 10 seconds

    if (this.isEnabled) {
      this.logger.log(
        `Exchange rate refresh scheduler initialized for base currencies: ${this.baseCurrencies.join(', ')}`,
      );
    } else {
      this.logger.warn('Exchange rate refresh scheduler is DISABLED via config');
    }
  }

  /**
   * Cron job: Refresh exchange rates every hour
   * Runs at: XX:00 (every hour on the hour)
   */
  @Cron('0 * * * *', {
    name: 'refresh-exchange-rates',
    timeZone: 'UTC',
  })
  async refreshExchangeRates(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting scheduled exchange rate refresh');

    try {
      // Stagger jobs for multiple base currencies to avoid rate limits
      for (let i = 0; i < this.baseCurrencies.length; i++) {
        const baseCurrency = this.baseCurrencies[i];
        const delay = i * this.staggerDelayMs;

        await this.scheduleRefresh(baseCurrency, delay, 'scheduler');
      }

      this.logger.log(
        `Scheduled refresh for ${this.baseCurrencies.length} base currencies`,
      );
    } catch (error) {
      this.logger.error('Failed to schedule exchange rate refresh:', error);
    }
  }

  /**
   * Schedule a refresh job for a specific base currency
   */
  async scheduleRefresh(
    baseCurrency: string = 'USD',
    delay: number = 0,
    triggeredBy: 'scheduler' | 'manual' | 'api' = 'manual',
  ): Promise<string> {
    try {
      const jobData: ExchangeRateRefreshJobData = {
        baseCurrency: baseCurrency.toUpperCase(),
        triggeredBy,
        priority: triggeredBy === 'manual' ? 10 : 5,
      };

      const job = await this.exchangeRateQueue.add(jobData, {
        priority: jobData.priority,
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      });

      this.logger.log(
        `Scheduled exchange rate refresh for ${baseCurrency}, job ID: ${job.id}${
          delay > 0 ? ` (delay: ${delay}ms)` : ''
        }`,
      );

      return job.id?.toString() || 'unknown';
    } catch (error) {
      this.logger.error(
        `Failed to schedule refresh for ${baseCurrency}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Schedule immediate refresh (for manual trigger)
   */
  async scheduleImmediateRefresh(baseCurrency: string = 'USD'): Promise<string> {
    return this.scheduleRefresh(baseCurrency, 0, 'manual');
  }

  /**
   * Get job status for UI progress tracking
   */
  async getJobStatus(jobId: string): Promise<{
    id: string;
    state: string;
    progress: any;
    data: ExchangeRateRefreshJobData;
    result?: any;
    failedReason?: string;
    attemptsMade: number;
    finishedOn?: number;
    processedOn?: number;
  } | null> {
    try {
      const job = await this.exchangeRateQueue.getJob(jobId);

      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        id: job.id?.toString() || 'unknown',
        state,
        progress,
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
      };
    } catch (error) {
      this.logger.error(`Failed to get job status for ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    try {
      const [waiting, active, completed, failed, delayed, paused] =
        await Promise.all([
          this.exchangeRateQueue.getWaitingCount(),
          this.exchangeRateQueue.getActiveCount(),
          this.exchangeRateQueue.getCompletedCount(),
          this.exchangeRateQueue.getFailedCount(),
          this.exchangeRateQueue.getDelayedCount(),
          this.exchangeRateQueue.getPausedCount(),
        ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused,
      };
    } catch (error) {
      this.logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Pause the queue (for maintenance)
   */
  async pauseQueue(): Promise<void> {
    await this.exchangeRateQueue.pause();
    this.logger.warn('Exchange rate refresh queue PAUSED');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await this.exchangeRateQueue.resume();
    this.logger.log('Exchange rate refresh queue RESUMED');
  }

  /**
   * Get queue health status
   */
  async getQueueHealth(): Promise<{
    isHealthy: boolean;
    isPaused: boolean;
    stats: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      paused: number;
    };
    warnings: string[];
  }> {
    const stats = await this.getQueueStats();
    const isPaused = await this.exchangeRateQueue.isPaused();
    const warnings: string[] = [];

    // Check for health issues
    if (isPaused) {
      warnings.push('Queue is paused');
    }

    if (stats.failed > 50) {
      warnings.push(`High number of failed jobs: ${stats.failed}`);
    }

    if (stats.waiting > 100) {
      warnings.push(`High number of waiting jobs: ${stats.waiting}`);
    }

    const isHealthy = warnings.length === 0;

    return {
      isHealthy,
      isPaused,
      stats,
      warnings,
    };
  }
}
