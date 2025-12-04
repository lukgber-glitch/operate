/**
 * Retention Check Job
 * BullMQ job processor for scheduled retention policy enforcement
 *
 * Schedule:
 * - Daily at 2 AM: Check for expired documents
 * - Weekly (Monday 2 AM): Generate retention status report
 *
 * Cron: 0 2 * * * (daily at 2 AM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Processor, Process, OnQueueCompleted, OnQueueFailed, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { RetentionPolicyService } from '../services/retention-policy.service';
import { RetentionReport, ProcessingResult } from '../types/retention-policy.types';

export interface RetentionCheckJobData {
  tenantId?: string; // If provided, process only this tenant
  operation: 'check_status' | 'process_expired' | 'weekly_report';
  autoDelete?: boolean;
  confirmationRequired?: boolean;
}

export interface RetentionCheckJobResult {
  operation: string;
  tenantsProcessed: number;
  totalDocumentsReviewed: number;
  totalDocumentsExpired: number;
  totalDocumentsOnHold: number;
  errors: Array<{
    tenantId: string;
    error: string;
  }>;
  reports?: Record<string, RetentionReport>;
  processingResults?: Record<string, ProcessingResult>;
}

@Processor('retention-check')
@Injectable()
export class RetentionCheckJobProcessor {
  private readonly logger = new Logger(RetentionCheckJobProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly retentionPolicy: RetentionPolicyService,
  ) {}

  /**
   * Process retention check job
   */
  @Process()
  async processRetentionCheck(job: Job<RetentionCheckJobData>): Promise<RetentionCheckJobResult> {
    const { tenantId, operation, autoDelete = false } = job.data;

    this.logger.log(
      `Processing retention check job ${job.id}: operation=${operation}, tenantId=${tenantId || 'ALL'}, autoDelete=${autoDelete}`
    );

    const result: RetentionCheckJobResult = {
      operation,
      tenantsProcessed: 0,
      totalDocumentsReviewed: 0,
      totalDocumentsExpired: 0,
      totalDocumentsOnHold: 0,
      errors: [],
    };

    try {
      // Get tenants to process
      const tenants = tenantId
        ? [{ id: tenantId }]
        : await this.prisma.organisation.findMany({
            where: { deletedAt: null },
            select: { id: true },
          });

      this.logger.debug(`Processing ${tenants.length} tenant(s)`);

      // Process each tenant
      for (const tenant of tenants) {
        try {
          await this.processTenant(tenant.id, operation, autoDelete, result);
          result.tenantsProcessed++;
        } catch (error) {
          this.logger.error(`Error processing tenant ${tenant.id}: ${error.message}`, error.stack);
          result.errors.push({
            tenantId: tenant.id,
            error: error.message,
          });
        }
      }

      this.logger.log(
        `Completed retention check job ${job.id}: ${result.tenantsProcessed} tenants processed, ${result.totalDocumentsReviewed} documents reviewed`
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to process retention check job ${job.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process a single tenant
   */
  private async processTenant(
    tenantId: string,
    operation: string,
    autoDelete: boolean,
    result: RetentionCheckJobResult
  ): Promise<void> {
    switch (operation) {
      case 'check_status':
        await this.checkTenantStatus(tenantId, result);
        break;

      case 'process_expired':
        await this.processExpiredDocuments(tenantId, autoDelete, result);
        break;

      case 'weekly_report':
        await this.generateWeeklyReport(tenantId, result);
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Check retention status for a tenant
   */
  private async checkTenantStatus(tenantId: string, result: RetentionCheckJobResult): Promise<void> {
    this.logger.debug(`Checking retention status for tenant ${tenantId}`);

    const report = await this.retentionPolicy.checkRetentionStatus(tenantId);

    // Initialize reports object if needed
    if (!result.reports) {
      result.reports = {};
    }

    result.reports[tenantId] = report;
    result.totalDocumentsReviewed += report.summary.totalDocuments;
    result.totalDocumentsExpired += report.summary.expiredDocuments;
    result.totalDocumentsOnHold += report.summary.documentsOnHold;

    // Log warnings and issues
    if (report.complianceStatus.issues.length > 0) {
      this.logger.warn(
        `Tenant ${tenantId} has ${report.complianceStatus.issues.length} compliance issues: ${report.complianceStatus.issues.join(', ')}`
      );
    }

    if (report.complianceStatus.warnings.length > 0) {
      this.logger.log(
        `Tenant ${tenantId} has ${report.complianceStatus.warnings.length} warnings: ${report.complianceStatus.warnings.join(', ')}`
      );
    }
  }

  /**
   * Process expired documents for a tenant
   */
  private async processExpiredDocuments(
    tenantId: string,
    autoDelete: boolean,
    result: RetentionCheckJobResult
  ): Promise<void> {
    this.logger.debug(`Processing expired documents for tenant ${tenantId}, autoDelete=${autoDelete}`);

    // Note: autoDelete without confirmation will only mark documents for deletion
    const processingResult = await this.retentionPolicy.processExpiredDocuments(tenantId, autoDelete);

    // Initialize processing results if needed
    if (!result.processingResults) {
      result.processingResults = {};
    }

    result.processingResults[tenantId] = processingResult;
    result.totalDocumentsReviewed += processingResult.documentsReviewed;

    // Log processing summary
    if (processingResult.documentsDeleted > 0) {
      this.logger.log(
        `Tenant ${tenantId}: Deleted ${processingResult.documentsDeleted} documents, freed ${this.formatBytes(processingResult.summary.storageFreed)}`
      );
    }

    if (processingResult.documentsMarkedForDeletion > 0) {
      this.logger.log(
        `Tenant ${tenantId}: Marked ${processingResult.documentsMarkedForDeletion} documents for deletion review`
      );
    }

    if (processingResult.errors.length > 0) {
      this.logger.warn(`Tenant ${tenantId}: ${processingResult.errors.length} errors during processing`);
    }
  }

  /**
   * Generate weekly retention report for a tenant
   */
  private async generateWeeklyReport(tenantId: string, result: RetentionCheckJobResult): Promise<void> {
    this.logger.debug(`Generating weekly report for tenant ${tenantId}`);

    // Get current status
    const report = await this.retentionPolicy.checkRetentionStatus(tenantId);

    // Initialize reports if needed
    if (!result.reports) {
      result.reports = {};
    }

    result.reports[tenantId] = report;

    // TODO: Send email notification with report
    // TODO: Store report snapshot in database

    this.logger.log(
      `Weekly report for ${tenantId}: ${report.summary.totalDocuments} documents, ${report.summary.expiredDocuments} expired, ${report.summary.documentsOnHold} on hold`
    );
  }

  /**
   * On job completion
   */
  @OnQueueCompleted()
  onCompleted(job: Job<RetentionCheckJobData>, result: RetentionCheckJobResult): void {
    this.logger.log(
      `Job ${job.id} completed: ${result.tenantsProcessed} tenants processed, ${result.errors.length} errors`
    );

    if (result.errors.length > 0) {
      this.logger.warn(`Errors: ${JSON.stringify(result.errors)}`);
    }
  }

  /**
   * On job failure
   */
  @OnQueueFailed()
  onFailed(job: Job<RetentionCheckJobData>, error: Error): void {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

/**
 * Retention Check Job Scheduler
 * Schedules retention check jobs using BullMQ
 */
@Injectable()
export class RetentionCheckScheduler {
  private readonly logger = new Logger(RetentionCheckScheduler.name);

  constructor(
    @InjectQueue('retention-check') private readonly retentionCheckQueue: Queue<RetentionCheckJobData>,
  ) {}

  /**
   * Schedule daily retention check
   * Runs at 2 AM every day
   */
  async scheduleDailyCheck(): Promise<void> {
    this.logger.log('Scheduling daily retention check at 2 AM');

    await this.retentionCheckQueue.add(
      'daily-check',
      {
        operation: 'check_status',
      } as RetentionCheckJobData,
      {
        repeat: {
          cron: '0 2 * * *', // 2 AM daily
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200, // Keep last 200 failed jobs
      }
    );
  }

  /**
   * Schedule weekly report
   * Runs at 2 AM every Monday
   */
  async scheduleWeeklyReport(): Promise<void> {
    this.logger.log('Scheduling weekly retention report at 2 AM on Mondays');

    await this.retentionCheckQueue.add(
      'weekly-report',
      {
        operation: 'weekly_report',
      } as RetentionCheckJobData,
      {
        repeat: {
          cron: '0 2 * * 1', // 2 AM every Monday
        },
        removeOnComplete: 52, // Keep last year
        removeOnFail: 52,
      }
    );
  }

  /**
   * Schedule immediate retention check for a specific tenant
   */
  async scheduleImmediateCheck(tenantId: string): Promise<void> {
    this.logger.log(`Scheduling immediate retention check for tenant ${tenantId}`);

    await this.retentionCheckQueue.add(
      'immediate-check',
      {
        tenantId,
        operation: 'check_status',
      } as RetentionCheckJobData,
      {
        priority: 10, // Higher priority
      }
    );
  }

  /**
   * Schedule expired document processing
   */
  async scheduleExpiredProcessing(tenantId?: string, autoDelete = false): Promise<void> {
    this.logger.log(
      `Scheduling expired document processing${tenantId ? ` for tenant ${tenantId}` : ''}, autoDelete=${autoDelete}`
    );

    await this.retentionCheckQueue.add(
      'process-expired',
      {
        tenantId,
        operation: 'process_expired',
        autoDelete,
        confirmationRequired: autoDelete,
      } as RetentionCheckJobData,
      {
        priority: autoDelete ? 5 : 3,
      }
    );
  }
}
