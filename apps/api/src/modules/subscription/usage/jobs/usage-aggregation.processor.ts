import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/modules/database/prisma.service';
import { UsageFeature } from '@prisma/client';

export const USAGE_AGGREGATION_QUEUE = 'usage-aggregation';

interface AggregateUsageJob {
  organizationId: string;
  feature: UsageFeature;
}

/**
 * Usage Aggregation Processor
 * Aggregates usage events into summaries for billing
 *
 * Jobs:
 * - aggregate-usage: Aggregate usage for a specific org/feature
 * - aggregate-all: Aggregate all pending usage (hourly cron)
 */
@Processor(USAGE_AGGREGATION_QUEUE)
export class UsageAggregationProcessor {
  private readonly logger = new Logger(UsageAggregationProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate usage for a specific organization and feature
   */
  @Process('aggregate-usage')
  async handleAggregateUsage(job: Job<AggregateUsageJob>): Promise<void> {
    const { organizationId, feature } = job.data;

    try {
      this.logger.debug(
        `Aggregating usage for org=${organizationId}, feature=${feature}`,
      );

      await this.aggregateUsageForFeature(organizationId, feature);

      this.logger.debug(
        `Successfully aggregated usage for org=${organizationId}, feature=${feature}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to aggregate usage for org=${organizationId}, feature=${feature}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Aggregate all pending usage (run hourly)
   */
  @Process('aggregate-all')
  async handleAggregateAll(): Promise<void> {
    try {
      this.logger.log('Starting hourly usage aggregation');

      // Get unique org/feature combinations with unreported events
      const combinations = await this.prisma.$queryRaw<
        Array<{ organisationId: string; feature: UsageFeature }>
      >`
        SELECT DISTINCT organisation_id as "organisationId", feature
        FROM usage_events
        WHERE reported_to_stripe = false
        AND timestamp >= DATE_TRUNC('month', CURRENT_DATE)
      `;

      this.logger.log(
        `Found ${combinations.length} org/feature combinations to aggregate`,
      );

      // Aggregate each combination
      for (const { organisationId, feature } of combinations) {
        try {
          await this.aggregateUsageForFeature(organisationId, feature);
        } catch (error) {
          this.logger.error(
            `Failed to aggregate usage for org=${organisationId}, feature=${feature}`,
            error,
          );
          // Continue with other combinations
        }
      }

      this.logger.log('Completed hourly usage aggregation');
    } catch (error) {
      this.logger.error('Failed to aggregate all usage', error);
      throw error;
    }
  }

  /**
   * Aggregate usage for a specific org/feature for current billing period
   */
  private async aggregateUsageForFeature(
    organizationId: string,
    feature: UsageFeature,
  ): Promise<void> {
    // Get current billing period
    const periodStart = this.getMonthStart(new Date());
    const periodEnd = this.getMonthEnd(new Date());

    // Get quota configuration
    const quota = await this.prisma.usageQuota.findUnique({
      where: {
        organisationId_feature: {
          organisationId: organizationId,
          feature,
        },
      },
    });

    if (!quota) {
      this.logger.debug(
        `No quota configured for org=${organizationId}, feature=${feature}`,
      );
      return;
    }

    // Sum up usage for the period
    const result = await this.prisma.usageEvent.aggregate({
      where: {
        organisationId: organizationId,
        feature,
        timestamp: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const totalQuantity = result._sum.quantity || 0;
    const overageQuantity = Math.max(0, totalQuantity - quota.includedQuantity);
    const overageAmount = (overageQuantity * Number(quota.pricePerUnit)) / 100;

    // Upsert summary
    await this.prisma.usageSummary.upsert({
      where: {
        organisationId_feature_periodStart_periodEnd: {
          organisationId: organizationId,
          feature,
          periodStart,
          periodEnd,
        },
      },
      create: {
        organisationId: organizationId,
        feature,
        periodStart,
        periodEnd,
        totalQuantity,
        includedQuantity: quota.includedQuantity,
        overageQuantity,
        overageAmount,
        currency: quota.currency,
      },
      update: {
        totalQuantity,
        overageQuantity,
        overageAmount,
        updatedAt: new Date(),
      },
    });

    this.logger.debug(
      `Aggregated usage: org=${organizationId}, feature=${feature}, total=${totalQuantity}, overage=${overageQuantity}, amount=${overageAmount}`,
    );
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
}
