/**
 * Bank Import Job Processor
 * Handles background jobs for automated bank transaction imports using Bull
 *
 * Features:
 * - Sync individual connections
 * - Batch sync for organizations
 * - Automatic consent refresh
 * - Retry logic with exponential backoff
 * - Progress tracking
 * - WebSocket event emission (if available)
 * - Comprehensive error handling
 */

import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { BankSyncService } from '../bank-sync.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BankImportJobData,
  BankImportJobResult,
  BankImportJobType,
  SyncConnectionJobData,
  SyncAllOrgJobData,
  RefreshConsentsJobData,
  BankImportJobMetrics,
  BankImportJobProgress,
  DEFAULT_RETRY_CONFIG,
} from './bank-import.types';

export const BANK_IMPORT_QUEUE = 'bank-import';

/**
 * Bank Import Processor
 * Processes jobs from the bank-import queue
 */
@Processor(BANK_IMPORT_QUEUE)
export class BankImportProcessor {
  private readonly logger = new Logger(BankImportProcessor.name);

  constructor(
    private readonly bankSyncService: BankSyncService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Process jobs based on type
   */
  @Process()
  async handleJob(job: Job<BankImportJobData>): Promise<BankImportJobResult> {
    const startedAt = new Date();
    this.logger.log(`Processing job ${job.id}: ${job.data.type}`);

    try {
      let result: BankImportJobResult;

      switch (job.data.type) {
        case BankImportJobType.SYNC_CONNECTION:
          result = await this.handleSyncConnection(job as Job<SyncConnectionJobData>);
          break;

        case BankImportJobType.SYNC_ALL_ORG:
          result = await this.handleSyncAllOrg(job as Job<SyncAllOrgJobData>);
          break;

        case BankImportJobType.REFRESH_CONSENTS:
          result = await this.handleRefreshConsents(job as Job<RefreshConsentsJobData>);
          break;

        default:
          throw new Error(`Unknown job type: ${(job.data as any).type}`);
      }

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      return {
        ...result,
        jobId: job.id?.toString() || 'unknown',
        startedAt,
        completedAt,
        duration,
      };
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.error(`Job ${job.id} failed:`, error);

      // Emit failure event
      this.eventEmitter.emit('bank.sync.failed', {
        jobId: job.id,
        type: job.data.type,
        error: error.message,
        timestamp: new Date(),
      });

      return {
        jobId: job.id?.toString() || 'unknown',
        type: job.data.type,
        success: false,
        startedAt,
        completedAt,
        duration,
        errorMessage: error.message || 'Unknown error',
      } as BankImportJobResult;
    }
  }

  /**
   * Handle sync-connection job
   */
  private async handleSyncConnection(
    job: Job<SyncConnectionJobData>,
  ): Promise<BankImportJobResult> {
    const { connectionId, forceFullSync, accountIds, startDate, endDate } = job.data;

    // Update progress
    await this.updateProgress(job, {
      stage: 'starting',
      message: 'Starting connection sync',
      percent: 0,
    });

    const syncResult = await this.bankSyncService.syncConnection({
      connectionId,
      forceFullSync,
      accountIds,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // Update progress
    await this.updateProgress(job, {
      stage: 'completed',
      message: `Sync completed: ${syncResult.newTransactions} new transactions`,
      percent: 100,
      accountsProcessed: syncResult.accountsSynced,
      transactionsProcessed: syncResult.transactionsSynced,
    });

    // Emit success event for monitoring
    this.eventEmitter.emit('bank.sync.completed', {
      connectionId,
      accountsSynced: syncResult.accountsSynced,
      transactionsSynced: syncResult.transactionsSynced,
      timestamp: new Date(),
    });

    this.logger.log(`Emitted bank.sync.completed event for connection ${connectionId}`);

    return {
      type: BankImportJobType.SYNC_CONNECTION,
      success: syncResult.success,
      syncResult,
    } as BankImportJobResult;
  }

  /**
   * Handle sync-all-org job
   */
  private async handleSyncAllOrg(
    job: Job<SyncAllOrgJobData>,
  ): Promise<BankImportJobResult> {
    const { orgId, connectionIds, concurrency, continueOnError } = job.data;

    // Update progress
    await this.updateProgress(job, {
      stage: 'starting',
      message: 'Starting batch sync for organization',
      percent: 0,
    });

    const batchResult = await this.bankSyncService.syncAllConnections({
      orgId,
      connectionIds,
      concurrency: concurrency || 3,
      continueOnError: continueOnError !== false,
    });

    // Update progress
    await this.updateProgress(job, {
      stage: 'completed',
      message: `Batch sync completed: ${batchResult.successfulSyncs}/${batchResult.totalConnections} successful`,
      percent: 100,
      accountsProcessed: batchResult.results.reduce((sum, r) => sum + r.accountsSynced, 0),
      transactionsProcessed: batchResult.results.reduce((sum, r) => sum + r.transactionsSynced, 0),
    });

    // Emit success event
    this.eventEmitter.emit('bank.batch.completed', {
      orgId,
      totalConnections: batchResult.totalConnections,
      successfulSyncs: batchResult.successfulSyncs,
      failedSyncs: batchResult.failedSyncs,
      timestamp: new Date(),
    });

    return {
      type: BankImportJobType.SYNC_ALL_ORG,
      success: batchResult.failedSyncs === 0,
      batchResult,
    } as BankImportJobResult;
  }

  /**
   * Handle refresh-consents job
   */
  private async handleRefreshConsents(
    job: Job<RefreshConsentsJobData>,
  ): Promise<BankImportJobResult> {
    const { daysBeforeExpiry, batchSize } = job.data;

    // Update progress
    await this.updateProgress(job, {
      stage: 'starting',
      message: 'Checking for expiring consents',
      percent: 0,
    });

    const refreshResult = await this.bankSyncService.refreshExpiredConsents({
      daysBeforeExpiry: daysBeforeExpiry || 7,
      batchSize: batchSize || 10,
    });

    // Update progress
    await this.updateProgress(job, {
      stage: 'completed',
      message: `Consent refresh completed: ${refreshResult.requiresUserAction} require user action`,
      percent: 100,
    });

    // Emit event for connections requiring user action
    if (refreshResult.requiresUserAction > 0) {
      this.eventEmitter.emit('bank.consents.expiring', {
        count: refreshResult.requiresUserAction,
        connections: refreshResult.results
          .filter(r => !r.success && r.error === 'Requires user re-authorization')
          .map(r => r.connectionId),
        timestamp: new Date(),
      });
    }

    return {
      type: BankImportJobType.REFRESH_CONSENTS,
      success: true,
      refreshResult,
    } as BankImportJobResult;
  }

  /**
   * Update job progress
   */
  private async updateProgress(
    job: Job<BankImportJobData>,
    progress: BankImportJobProgress,
  ): Promise<void> {
    try {
      await job.progress(progress);
      this.logger.debug(`Job ${job.id} progress: ${progress.percent}% - ${progress.message}`);
    } catch (error) {
      this.logger.warn(`Failed to update job progress: ${error.message}`);
    }
  }

  /**
   * Track job metrics
   */
  private trackJobMetrics(
    job: Job<BankImportJobData>,
    result: BankImportJobResult,
  ): BankImportJobMetrics {
    const metrics: BankImportJobMetrics = {
      jobId: job.id?.toString() || 'unknown',
      type: job.data.type,
      queuedAt: new Date(job.timestamp),
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      duration: result.duration,
      attempts: job.attemptsMade + 1,
      success: result.success,
      errorMessage: result.errorMessage,
    };

    // Add type-specific metrics
    if (result.type === BankImportJobType.SYNC_CONNECTION && result.syncResult) {
      metrics.accountsSynced = result.syncResult.accountsSynced;
      metrics.transactionsSynced = result.syncResult.transactionsSynced;
      metrics.connectionsSynced = 1;
    } else if (result.type === BankImportJobType.SYNC_ALL_ORG && result.batchResult) {
      metrics.connectionsSynced = result.batchResult.successfulSyncs;
      metrics.accountsSynced = result.batchResult.results.reduce(
        (sum, r) => sum + r.accountsSynced,
        0,
      );
      metrics.transactionsSynced = result.batchResult.results.reduce(
        (sum, r) => sum + r.transactionsSynced,
        0,
      );
    }

    return metrics;
  }

  /**
   * Handler for when a job becomes active
   */
  @OnQueueActive()
  onActive(job: Job<BankImportJobData>): void {
    this.logger.log(
      `Job ${job.id} started: ${job.data.type}${
        job.attemptsMade > 0 ? ` (retry ${job.attemptsMade})` : ''
      }`,
    );
  }

  /**
   * Handler for when a job is completed
   */
  @OnQueueCompleted()
  onCompleted(job: Job<BankImportJobData>, result: BankImportJobResult): void {
    const metrics = this.trackJobMetrics(job, result);

    this.logger.log(
      `Job ${job.id} completed: ${result.success ? 'SUCCESS' : 'FAILURE'} ` +
        `(${result.duration}ms, attempts: ${metrics.attempts})`,
    );

    if (result.type === BankImportJobType.SYNC_CONNECTION && result.syncResult) {
      this.logger.log(
        `  → ${result.syncResult.newTransactions} new transactions, ` +
          `${result.syncResult.newAccounts} new accounts`,
      );
    } else if (result.type === BankImportJobType.SYNC_ALL_ORG && result.batchResult) {
      this.logger.log(
        `  → ${result.batchResult.successfulSyncs}/${result.batchResult.totalConnections} ` +
          `connections synced successfully`,
      );
    }

    // Emit metrics event for monitoring
    this.eventEmitter.emit('bank.job.completed', metrics);
  }

  /**
   * Handler for when a job fails
   */
  @OnQueueFailed()
  onFailed(job: Job<BankImportJobData>, error: Error): void {
    const retryConfig = DEFAULT_RETRY_CONFIG[job.data.type];
    const willRetry = job.attemptsMade < retryConfig.attempts;

    this.logger.error(
      `Job ${job.id} failed (attempt ${job.attemptsMade + 1}/${retryConfig.attempts}): ${error.message}`,
    );

    if (willRetry) {
      const nextDelay =
        retryConfig.backoff.type === 'exponential'
          ? retryConfig.backoff.delay * Math.pow(2, job.attemptsMade)
          : retryConfig.backoff.delay;

      this.logger.log(`  → Will retry in ${nextDelay}ms`);
    } else {
      this.logger.error(`  → Max retries exceeded, job will not retry`);

      // Emit final failure event
      this.eventEmitter.emit('bank.job.failed', {
        jobId: job.id,
        type: job.data.type,
        attempts: job.attemptsMade + 1,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }
}
