import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../database/prisma.service';
import { UsageStripeService } from '../services/usage-stripe.service';
import { UsageFeature } from '@prisma/client';

export const USAGE_STRIPE_REPORT_QUEUE = 'usage-stripe-report';

interface ReportUsageJob {
  organizationId: string;
  feature: UsageFeature;
}

/**
 * Usage Stripe Report Processor
 * Reports usage to Stripe for metered billing
 *
 * Jobs:
 * - report-usage: Report usage for a specific org/feature
 * - report-all: Report all pending usage (daily cron)
 * - retry-failed: Retry failed reports (every 6 hours)
 */
@Processor(USAGE_STRIPE_REPORT_QUEUE)
export class UsageStripeReportProcessor {
  private readonly logger = new Logger(UsageStripeReportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usageStripeService: UsageStripeService,
  ) {}

  /**
   * Report usage for a specific organization and feature
   */
  @Process('report-usage')
  async handleReportUsage(job: Job<ReportUsageJob>): Promise<void> {
    const { organizationId, feature } = job.data;

    try {
      this.logger.debug(
        `Reporting usage to Stripe: org=${organizationId}, feature=${feature}`,
      );

      const periodStart = this.getMonthStart(new Date());
      const periodEnd = new Date();

      await this.usageStripeService.reportAggregatedUsage(
        organizationId,
        feature,
        periodStart,
        periodEnd,
      );

      this.logger.debug(
        `Successfully reported usage to Stripe for org=${organizationId}, feature=${feature}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to report usage to Stripe for org=${organizationId}, feature=${feature}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Report all pending usage to Stripe (run daily)
   */
  @Process('report-all')
  async handleReportAll(): Promise<void> {
    try {
      this.logger.log('Starting daily usage reporting to Stripe');

      // Get all summaries for current period that haven't been reported
      const periodStart = this.getMonthStart(new Date());
      const periodEnd = new Date();

      const summaries = await this.prisma.usageSummary.findMany({
        where: {
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
          reportedToStripe: false,
          overageQuantity: { gt: 0 }, // Only report if there's overage
        },
      });

      this.logger.log(
        `Found ${summaries.length} usage summaries to report to Stripe`,
      );

      let reported = 0;
      let failed = 0;

      for (const summary of summaries) {
        try {
          await this.usageStripeService.reportAggregatedUsage(
            summary.organisationId,
            summary.feature,
            summary.periodStart,
            summary.periodEnd,
          );

          // Mark summary as reported
          await this.prisma.usageSummary.update({
            where: { id: summary.id },
            data: {
              reportedToStripe: true,
              reportedAt: new Date(),
            },
          });

          reported++;
        } catch (error) {
          this.logger.error(
            `Failed to report usage for org=${summary.organisationId}, feature=${summary.feature}`,
            error,
          );
          failed++;
        }
      }

      this.logger.log(
        `Daily usage reporting completed: reported=${reported}, failed=${failed}`,
      );
    } catch (error) {
      this.logger.error('Failed to report all usage to Stripe', error);
      throw error;
    }
  }

  /**
   * Retry failed reports (run every 6 hours)
   */
  @Process('retry-failed')
  async handleRetryFailed(): Promise<void> {
    try {
      this.logger.log('Retrying failed Stripe usage reports');

      const retried = await this.usageStripeService.retryFailedReports(3);

      this.logger.log(`Retried ${retried} failed reports`);
    } catch (error) {
      this.logger.error('Failed to retry failed reports', error);
      throw error;
    }
  }

  /**
   * Generate invoice items for overage (end of month)
   */
  @Process('generate-invoice-items')
  async handleGenerateInvoiceItems(): Promise<void> {
    try {
      this.logger.log('Generating invoice items for usage overages');

      const periodStart = this.getLastMonthStart();
      const periodEnd = this.getLastMonthEnd();

      // Get all summaries with overage from last month
      const summaries = await this.prisma.usageSummary.findMany({
        where: {
          periodStart,
          periodEnd,
          overageQuantity: { gt: 0 },
          reportedToStripe: false,
        },
      });

      this.logger.log(
        `Found ${summaries.length} usage summaries with overage for last month`,
      );

      for (const summary of summaries) {
        try {
          // Report usage to Stripe
          await this.usageStripeService.reportAggregatedUsage(
            summary.organisationId,
            summary.feature,
            summary.periodStart,
            summary.periodEnd,
          );

          // Mark as reported
          await this.prisma.usageSummary.update({
            where: { id: summary.id },
            data: {
              reportedToStripe: true,
              reportedAt: new Date(),
            },
          });

          this.logger.debug(
            `Generated invoice item for org=${summary.organisationId}, feature=${summary.feature}, amount=${summary.overageAmount}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to generate invoice item for org=${summary.organisationId}, feature=${summary.feature}`,
            error,
          );
        }
      }

      this.logger.log('Completed generating invoice items');
    } catch (error) {
      this.logger.error('Failed to generate invoice items', error);
      throw error;
    }
  }

  /**
   * Get start of current month
   */
  private getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  /**
   * Get end of current month
   */
  private getMonthEnd(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  }

  /**
   * Get start of last month
   */
  private getLastMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  }

  /**
   * Get end of last month
   */
  private getLastMonthEnd(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }
}
