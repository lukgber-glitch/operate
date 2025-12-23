/**
 * Bank Import Scheduler
 * Manages scheduled and recurring bank import jobs using Bull and NestJS Scheduler
 *
 * Features:
 * - Every 4 hours: Sync all active connections
 * - Daily at 3am: Refresh expiring consents (within 7 days)
 * - Job staggering to avoid rate limits
 * - Timezone-aware scheduling
 * - Configurable schedules
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';
import { ConnectionStatus } from '@prisma/client';
import {
  BankImportJobData,
  BankImportJobType,
  SyncConnectionJobData,
  SyncAllOrgJobData,
  RefreshConsentsJobData,
  DEFAULT_RETRY_CONFIG,
} from './bank-import.types';
import { BANK_IMPORT_QUEUE } from './bank-import.processor';

/**
 * Bank Import Scheduler
 * Schedules recurring bank sync jobs
 */
@Injectable()
export class BankImportScheduler {
  private readonly logger = new Logger(BankImportScheduler.name);
  private readonly isEnabled: boolean;
  private readonly staggerDelayMs: number;

  constructor(
    @InjectQueue(BANK_IMPORT_QUEUE)
    private readonly bankImportQueue: Queue<BankImportJobData>,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get<string>('BANK_SYNC_ENABLED', 'true') === 'true';
    this.staggerDelayMs = this.configService.get<number>('BANK_SYNC_STAGGER_DELAY_MS', 30000); // 30 seconds

    if (this.isEnabled) {
      this.logger.log('Bank import scheduler initialized');
    } else {
      this.logger.warn('Bank import scheduler is DISABLED via config');
    }
  }

  /**
   * Cron job: Sync all active connections every 4 hours
   * Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
   */
  @Cron('0 */4 * * *', {
    name: 'sync-all-active-connections',
    timeZone: 'Europe/Berlin',
  })
  async syncAllActiveConnections(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting scheduled sync for all active connections');

    try {
      // Get all organizations with active connections
      const orgsWithConnections = await this.prisma.bankConnection.groupBy({
        by: ['orgId'],
        where: {
          status: {
            in: [ConnectionStatus.ACTIVE, ConnectionStatus.ERROR],
          },
        },
      });

      this.logger.log(`Found ${orgsWithConnections.length} organizations with active connections`);

      // Stagger jobs to avoid rate limits
      for (let i = 0; i < orgsWithConnections.length; i++) {
        const org = orgsWithConnections[i];
        const delay = i * this.staggerDelayMs;

        await this.scheduleOrgSync(org.orgId, delay);
      }

      this.logger.log('All organization sync jobs scheduled');
    } catch (error) {
      this.logger.error('Failed to schedule sync jobs:', error);
    }
  }

  /**
   * Cron job: Refresh expiring consents daily at 3am
   */
  @Cron('0 3 * * *', {
    name: 'refresh-expiring-consents',
    timeZone: 'Europe/Berlin',
  })
  async refreshExpiringConsents(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting scheduled consent refresh check');

    try {
      const jobData: RefreshConsentsJobData = {
        type: BankImportJobType.REFRESH_CONSENTS,
        daysBeforeExpiry: 7, // Check consents expiring within 7 days
        batchSize: 10, // Process 10 at a time
        priority: 8, // High priority
      };

      const retryConfig = DEFAULT_RETRY_CONFIG[BankImportJobType.REFRESH_CONSENTS];

      await this.bankImportQueue.add(jobData, {
        priority: jobData.priority,
        attempts: retryConfig.attempts,
        backoff: retryConfig.backoff,
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      });

      this.logger.log('Consent refresh job scheduled');
    } catch (error) {
      this.logger.error('Failed to schedule consent refresh job:', error);
    }
  }

  /**
   * Schedule sync for a specific organization
   */
  private async scheduleOrgSync(orgId: string, delay: number = 0): Promise<void> {
    try {
      const jobData: SyncAllOrgJobData = {
        type: BankImportJobType.SYNC_ALL_ORG,
        orgId,
        concurrency: 3, // Sync 3 connections at a time
        continueOnError: true,
        priority: 5, // Normal priority
      };

      const retryConfig = DEFAULT_RETRY_CONFIG[BankImportJobType.SYNC_ALL_ORG];

      await this.bankImportQueue.add(jobData, {
        priority: jobData.priority,
        delay,
        attempts: retryConfig.attempts,
        backoff: retryConfig.backoff,
        removeOnComplete: 100,
        removeOnFail: 500,
      });

      this.logger.debug(
        `Scheduled sync for org ${orgId}${delay > 0 ? ` with ${delay}ms delay` : ''}`,
      );
    } catch (error) {
      this.logger.error(`Failed to schedule sync for org ${orgId}:`, error);
    }
  }

  /**
   * Schedule immediate sync for a connection (for manual refresh button)
   */
  async scheduleImmediateSync(
    connectionId: string,
    options: {
      forceFullSync?: boolean;
      accountIds?: string[];
      startDate?: Date;
      endDate?: Date;
      triggeredBy?: string;
    } = {},
  ): Promise<string> {
    try {
      const jobData: SyncConnectionJobData = {
        type: BankImportJobType.SYNC_CONNECTION,
        connectionId,
        forceFullSync: options.forceFullSync,
        accountIds: options.accountIds,
        startDate: options.startDate?.toISOString(),
        endDate: options.endDate?.toISOString(),
        triggeredBy: options.triggeredBy,
        priority: 10, // Highest priority for manual triggers
      };

      const retryConfig = DEFAULT_RETRY_CONFIG[BankImportJobType.SYNC_CONNECTION];

      const job = await this.bankImportQueue.add(jobData, {
        priority: jobData.priority,
        attempts: retryConfig.attempts,
        backoff: retryConfig.backoff,
        removeOnComplete: 100,
        removeOnFail: 500,
      });

      this.logger.log(`Scheduled immediate sync for connection ${connectionId}, job ID: ${job.id}`);

      return job.id?.toString() || 'unknown';
    } catch (error) {
      this.logger.error(`Failed to schedule immediate sync for connection ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * Get job status for UI progress tracking
   */
  async getJobStatus(jobId: string): Promise<{
    id: string;
    state: string;
    progress: any;
    data: BankImportJobData;
    result?: any;
    failedReason?: string;
    attemptsMade: number;
    finishedOn?: number;
    processedOn?: number;
  } | null> {
    try {
      const job = await this.bankImportQueue.getJob(jobId);

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
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        this.bankImportQueue.getWaitingCount(),
        this.bankImportQueue.getActiveCount(),
        this.bankImportQueue.getCompletedCount(),
        this.bankImportQueue.getFailedCount(),
        this.bankImportQueue.getDelayedCount(),
        this.bankImportQueue.getPausedCount(),
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
   * Clean up old completed and failed jobs
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: 'cleanup-old-jobs',
    timeZone: 'Europe/Berlin',
  })
  async cleanupOldJobs(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting job cleanup');

    try {
      // Clean completed jobs older than 7 days
      await this.bankImportQueue.clean(7 * 24 * 60 * 60 * 1000, 'completed');

      // Clean failed jobs older than 30 days
      await this.bankImportQueue.clean(30 * 24 * 60 * 60 * 1000, 'failed');

      this.logger.log('Job cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup jobs:', error);
    }
  }

  /**
   * Pause the queue (for maintenance)
   */
  async pauseQueue(): Promise<void> {
    await this.bankImportQueue.pause();
    this.logger.warn('Bank import queue PAUSED');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await this.bankImportQueue.resume();
    this.logger.log('Bank import queue RESUMED');
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
    const isPaused = await this.bankImportQueue.isPaused();
    const warnings: string[] = [];

    // Check for health issues
    if (isPaused) {
      warnings.push('Queue is paused');
    }

    if (stats.failed > 100) {
      warnings.push(`High number of failed jobs: ${stats.failed}`);
    }

    if (stats.waiting > 1000) {
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
