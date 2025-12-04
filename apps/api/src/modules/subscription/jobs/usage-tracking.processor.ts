/**
 * Usage Tracking Job Processor
 * Handles background jobs for subscription usage tracking and limit enforcement
 *
 * Features:
 * - Scheduled monthly reset of usage counters
 * - Usage warnings at 80% and 100% of limits
 * - Automatic notifications to organization admins
 * - Audit logging of usage events
 */

import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionFeaturesService } from '../services/subscription-features.service';

export const USAGE_TRACKING_QUEUE = 'subscription-usage-tracking';

export interface UsageTrackingJobData {
  type: 'invoice_created' | 'user_added' | 'monthly_reset' | 'usage_check';
  orgId?: string;
  resourceId?: string;
  triggeredBy?: 'event' | 'scheduler' | 'manual';
}

export interface UsageTrackingJobResult {
  jobId: string;
  success: boolean;
  type: string;
  orgId?: string;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  warnings?: string[];
  errorMessage?: string;
}

/**
 * Usage Tracking Processor
 * Processes jobs from the subscription-usage-tracking queue
 */
@Processor(USAGE_TRACKING_QUEUE)
export class UsageTrackingProcessor {
  private readonly logger = new Logger(UsageTrackingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly features: SubscriptionFeaturesService,
  ) {}

  /**
   * Process usage tracking job
   */
  @Process()
  async handleUsageTracking(
    job: Job<UsageTrackingJobData>,
  ): Promise<UsageTrackingJobResult> {
    const startedAt = new Date();

    this.logger.log(
      `Processing usage tracking job ${job.id}: ${job.data.type}`,
    );

    try {
      let warnings: string[] = [];

      switch (job.data.type) {
        case 'invoice_created':
          warnings = await this.handleInvoiceCreated(job.data);
          break;
        case 'user_added':
          warnings = await this.handleUserAdded(job.data);
          break;
        case 'monthly_reset':
          warnings = await this.handleMonthlyReset();
          break;
        case 'usage_check':
          warnings = await this.handleUsageCheck(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.data.type}`);
      }

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.log(
        `Successfully processed ${job.data.type} job in ${duration}ms`,
      );

      return {
        jobId: job.id?.toString() || 'unknown',
        success: true,
        type: job.data.type,
        orgId: job.data.orgId,
        startedAt,
        completedAt,
        duration,
        warnings,
      };
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.error(
        `Failed to process usage tracking job: ${error.message}`,
        error.stack,
      );

      return {
        jobId: job.id?.toString() || 'unknown',
        success: false,
        type: job.data.type,
        orgId: job.data.orgId,
        startedAt,
        completedAt,
        duration,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Handle invoice created event
   */
  private async handleInvoiceCreated(
    data: UsageTrackingJobData,
  ): Promise<string[]> {
    if (!data.orgId || !data.resourceId) {
      throw new Error('orgId and resourceId are required for invoice_created');
    }

    // Track the invoice creation
    await this.features.trackInvoiceCreated(data.orgId, data.resourceId);

    // Check if approaching limit
    const usage = await this.features.getUsageMetrics(data.orgId);
    const warnings: string[] = [];

    if (
      usage.limits.invoicesPerMonth > 0 &&
      usage.percentUsed.invoices >= 80
    ) {
      const warning = `Organization ${data.orgId} has used ${usage.percentUsed.invoices}% of invoice limit (${usage.invoicesCreated}/${usage.limits.invoicesPerMonth})`;
      warnings.push(warning);

      // Send notification (implement notification service)
      this.logger.warn(warning);

      // TODO: Send email/notification to org admin
      await this.sendLimitWarning(data.orgId, 'invoices', usage.percentUsed.invoices);
    }

    return warnings;
  }

  /**
   * Handle user added event
   */
  private async handleUserAdded(data: UsageTrackingJobData): Promise<string[]> {
    if (!data.orgId || !data.resourceId) {
      throw new Error('orgId and resourceId are required for user_added');
    }

    // Track the user addition
    await this.features.trackUserAdded(data.orgId, data.resourceId);

    // Check if approaching limit
    const usage = await this.features.getUsageMetrics(data.orgId);
    const warnings: string[] = [];

    if (usage.limits.maxUsers > 0 && usage.percentUsed.users >= 80) {
      const warning = `Organization ${data.orgId} has used ${usage.percentUsed.users}% of user seats (${usage.activeUsers}/${usage.limits.maxUsers})`;
      warnings.push(warning);

      // Send notification (implement notification service)
      this.logger.warn(warning);

      // TODO: Send email/notification to org admin
      await this.sendLimitWarning(data.orgId, 'users', usage.percentUsed.users);
    }

    return warnings;
  }

  /**
   * Handle monthly reset (run on 1st of each month)
   */
  private async handleMonthlyReset(): Promise<string[]> {
    this.logger.log('Processing monthly usage reset...');

    // Archive last month's usage data
    await this.archiveUsageData();

    // Reset counters for the new month
    await this.resetMonthlyCounters();

    this.logger.log('Monthly usage reset completed');
    return [];
  }

  /**
   * Handle usage check for a specific organization
   */
  private async handleUsageCheck(
    data: UsageTrackingJobData,
  ): Promise<string[]> {
    if (!data.orgId) {
      throw new Error('orgId is required for usage_check');
    }

    const usage = await this.features.getUsageMetrics(data.orgId);
    const warnings: string[] = [];

    // Check invoice usage
    if (
      usage.limits.invoicesPerMonth > 0 &&
      usage.percentUsed.invoices >= 80
    ) {
      warnings.push(
        `Invoice usage at ${usage.percentUsed.invoices}% (${usage.invoicesCreated}/${usage.limits.invoicesPerMonth})`,
      );
    }

    // Check user usage
    if (usage.limits.maxUsers > 0 && usage.percentUsed.users >= 80) {
      warnings.push(
        `User seat usage at ${usage.percentUsed.users}% (${usage.activeUsers}/${usage.limits.maxUsers})`,
      );
    }

    return warnings;
  }

  /**
   * Archive usage data from previous month
   */
  private async archiveUsageData(): Promise<void> {
    try {
      // Move current month's tracking data to archive table
      await this.prisma.$executeRaw`
        INSERT INTO subscription_usage_archive
        (org_id, resource_type, resource_id, event_type, created_at, archived_at)
        SELECT org_id, resource_type, resource_id, event_type, created_at, NOW()
        FROM subscription_usage_tracking
        WHERE created_at < date_trunc('month', CURRENT_DATE)
      `;

      // Delete archived data from main table
      await this.prisma.$executeRaw`
        DELETE FROM subscription_usage_tracking
        WHERE created_at < date_trunc('month', CURRENT_DATE)
      `;

      this.logger.log('Usage data archived successfully');
    } catch (error) {
      this.logger.error(
        `Failed to archive usage data: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Reset monthly counters
   */
  private async resetMonthlyCounters(): Promise<void> {
    try {
      // Clear any cached usage data
      // This is primarily handled by date filtering in queries
      // but we log the event for audit purposes
      await this.prisma.$executeRaw`
        INSERT INTO subscription_audit_log
        (event_type, metadata, created_at)
        VALUES
        ('MONTHLY_RESET', '{"reset_date": "${new Date().toISOString()}"}'::jsonb, NOW())
      `;

      this.logger.log('Monthly counters reset completed');
    } catch (error) {
      this.logger.error(
        `Failed to reset monthly counters: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send limit warning notification
   */
  private async sendLimitWarning(
    orgId: string,
    resourceType: 'invoices' | 'users',
    percentUsed: number,
  ): Promise<void> {
    try {
      // Store notification in database
      await this.prisma.$executeRaw`
        INSERT INTO subscription_notifications
        (org_id, notification_type, resource_type, percent_used, sent_at, created_at)
        VALUES
        (${orgId}, 'LIMIT_WARNING', ${resourceType}, ${percentUsed}, NOW(), NOW())
      `;

      // TODO: Integrate with notification service to send emails
      this.logger.log(
        `Limit warning stored for org ${orgId}: ${resourceType} at ${percentUsed}%`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send limit warning: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Hook: Job became active
   */
  @OnQueueActive()
  onActive(job: Job<UsageTrackingJobData>) {
    this.logger.debug(
      `Processing usage tracking job ${job.id} of type ${job.data.type}`,
    );
  }

  /**
   * Hook: Job completed successfully
   */
  @OnQueueCompleted()
  onComplete(job: Job<UsageTrackingJobData>, result: UsageTrackingJobResult) {
    this.logger.log(
      `Usage tracking job ${job.id} completed in ${result.duration}ms`,
    );

    if (result.warnings && result.warnings.length > 0) {
      this.logger.warn(
        `Job ${job.id} completed with warnings:`,
        result.warnings,
      );
    }
  }

  /**
   * Hook: Job failed
   */
  @OnQueueFailed()
  onError(job: Job<UsageTrackingJobData>, error: Error) {
    this.logger.error(
      `Usage tracking job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
