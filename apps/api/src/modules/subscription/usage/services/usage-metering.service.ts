import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UsageFeature } from '@prisma/client';
import {
  CurrentUsageSummary,
  FeatureUsageSummary,
  UsageEventMetadata,
  UsageHistoryEntry,
  USAGE_FEATURE_CONFIGS,
} from '../types/usage.types';
import {
  TrackUsageDto,
  GetUsageSummaryDto,
  UsageHistoryQueryDto,
} from '../dto/usage.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Usage Metering Service
 * Tracks and manages usage-based billing events
 *
 * Features:
 * - Real-time usage event tracking
 * - Usage aggregation by billing period
 * - Quota management and overage calculation
 * - Historical usage reporting
 */
@Injectable()
export class UsageMeteringService {
  private readonly logger = new Logger(UsageMeteringService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('usage-aggregation') private readonly aggregationQueue: Queue,
    @InjectQueue('usage-stripe-report') private readonly stripeReportQueue: Queue,
  ) {}

  /**
   * Track a usage event
   */
  async trackUsage(dto: TrackUsageDto): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Tracking usage: org=${dto.organizationId}, feature=${dto.feature}, qty=${dto.quantity || 1}`,
      );

      // Verify organization exists
      const org = await this.prisma.organisation.findUnique({
        where: { id: dto.organizationId },
      });

      if (!org) {
        throw new NotFoundException(
          `Organization ${dto.organizationId} not found`,
        );
      }

      // Create usage event
      await this.prisma.usageEvent.create({
        data: {
          organisationId: dto.organizationId,
          feature: dto.feature,
          quantity: dto.quantity || 1,
          metadata: dto.metadata || {},
          userId: dto.userId,
          timestamp: new Date(),
        },
      });

      // Queue aggregation job (debounced)
      await this.aggregationQueue.add(
        'aggregate-usage',
        {
          organizationId: dto.organizationId,
          feature: dto.feature,
        },
        {
          delay: 60000, // Wait 1 minute before aggregating
          jobId: `aggregate-${dto.organizationId}-${dto.feature}`,
          removeOnComplete: true,
        },
      );

      this.logger.debug(
        `Usage tracked successfully in ${Date.now() - startTime}ms`,
      );
    } catch (error) {
      this.logger.error('Failed to track usage', error);
      throw error;
    }
  }

  /**
   * Track multiple usage events in bulk
   */
  async trackBulkUsage(
    organizationId: string,
    events: Array<{
      feature: UsageFeature;
      quantity?: number;
      metadata?: UsageEventMetadata;
      userId?: string;
    }>,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Bulk tracking ${events.length} usage events for org=${organizationId}`,
      );

      // Create all usage events in a transaction
      await this.prisma.$transaction(
        events.map((event) =>
          this.prisma.usageEvent.create({
            data: {
              organisationId: organizationId,
              feature: event.feature,
              quantity: event.quantity || 1,
              metadata: event.metadata || {},
              userId: event.userId,
              timestamp: new Date(),
            },
          }),
        ),
      );

      // Queue aggregation for unique features
      const uniqueFeatures = [...new Set(events.map((e) => e.feature))];
      for (const feature of uniqueFeatures) {
        await this.aggregationQueue.add(
          'aggregate-usage',
          {
            organizationId,
            feature,
          },
          {
            delay: 60000,
            jobId: `aggregate-${organizationId}-${feature}`,
            removeOnComplete: true,
          },
        );
      }

      this.logger.debug(
        `Bulk usage tracked successfully in ${Date.now() - startTime}ms`,
      );
    } catch (error) {
      this.logger.error('Failed to track bulk usage', error);
      throw error;
    }
  }

  /**
   * Get current usage summary for an organization
   */
  async getCurrentUsage(
    dto: GetUsageSummaryDto,
  ): Promise<CurrentUsageSummary> {
    const { organizationId, periodStart, periodEnd, features } = dto;

    try {
      // Determine billing period
      const period = this.getBillingPeriod(periodStart, periodEnd);

      // Get usage quotas
      const quotas = await this.prisma.usageQuota.findMany({
        where: {
          organisationId: organizationId,
          isActive: true,
          ...(features && { feature: { in: features } }),
        },
      });

      // Get aggregated usage for the period
      const usageSummaries = await this.prisma.usageSummary.findMany({
        where: {
          organisationId: organizationId,
          periodStart: { gte: period.start },
          periodEnd: { lte: period.end },
          ...(features && { feature: { in: features } }),
        },
      });

      // Calculate current usage for features without summaries
      const featureSummaries: FeatureUsageSummary[] = [];
      let totalOverageAmount = 0;

      for (const quota of quotas) {
        const summary = usageSummaries.find((s) => s.feature === quota.feature);

        let totalQuantity: number;
        if (summary) {
          totalQuantity = summary.totalQuantity;
        } else {
          // Calculate on-the-fly from raw events
          const result = await this.prisma.usageEvent.aggregate({
            where: {
              organisationId: organizationId,
              feature: quota.feature,
              timestamp: {
                gte: period.start,
                lte: period.end,
              },
            },
            _sum: {
              quantity: true,
            },
          });
          totalQuantity = result._sum.quantity || 0;
        }

        const overageQuantity = Math.max(
          0,
          totalQuantity - quota.includedQuantity,
        );
        const overageAmount =
          (overageQuantity * Number(quota.pricePerUnit)) / 100;
        totalOverageAmount += overageAmount;

        const config = USAGE_FEATURE_CONFIGS[quota.feature];
        const percentUsed =
          quota.includedQuantity > 0
            ? Math.min(100, (totalQuantity / quota.includedQuantity) * 100)
            : 0;

        featureSummaries.push({
          feature: quota.feature,
          displayName: config.displayName,
          unit: config.unit,
          totalQuantity,
          includedQuantity: quota.includedQuantity,
          overageQuantity,
          pricePerUnit: Number(quota.pricePerUnit),
          overageAmount,
          percentUsed,
          currency: quota.currency,
        });
      }

      return {
        organizationId,
        periodStart: period.start,
        periodEnd: period.end,
        features: featureSummaries,
        totalOverageAmount,
        currency: quotas[0]?.currency || 'EUR',
      };
    } catch (error) {
      this.logger.error('Failed to get current usage', error);
      throw error;
    }
  }

  /**
   * Get usage history
   */
  async getUsageHistory(
    dto: UsageHistoryQueryDto,
  ): Promise<UsageHistoryEntry[]> {
    const { organizationId, startDate, endDate, limit = 12, features } = dto;

    try {
      // Calculate period range
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate
        ? new Date(startDate)
        : new Date(end.getFullYear(), end.getMonth() - limit, 1);

      // Get summaries
      const summaries = await this.prisma.usageSummary.findMany({
        where: {
          organisationId: organizationId,
          periodStart: { gte: start },
          periodEnd: { lte: end },
          ...(features && { feature: { in: features } }),
        },
        orderBy: {
          periodStart: 'desc',
        },
        take: limit,
      });

      // Group by period
      const periodMap = new Map<string, UsageHistoryEntry>();

      for (const summary of summaries) {
        const key = `${summary.periodStart.toISOString()}-${summary.periodEnd.toISOString()}`;

        if (!periodMap.has(key)) {
          periodMap.set(key, {
            periodStart: summary.periodStart,
            periodEnd: summary.periodEnd,
            features: [],
            totalAmount: 0,
            currency: summary.currency,
          });
        }

        const entry = periodMap.get(key)!;
        const config = USAGE_FEATURE_CONFIGS[summary.feature];

        entry.features.push({
          feature: summary.feature,
          displayName: config.displayName,
          unit: config.unit,
          totalQuantity: summary.totalQuantity,
          includedQuantity: summary.includedQuantity,
          overageQuantity: summary.overageQuantity,
          pricePerUnit: Number(summary.overageAmount) / summary.overageQuantity || 0,
          overageAmount: Number(summary.overageAmount),
          percentUsed:
            summary.includedQuantity > 0
              ? (summary.totalQuantity / summary.includedQuantity) * 100
              : 0,
          currency: summary.currency,
        });

        entry.totalAmount += Number(summary.overageAmount);
      }

      return Array.from(periodMap.values());
    } catch (error) {
      this.logger.error('Failed to get usage history', error);
      throw error;
    }
  }

  /**
   * Estimate usage costs for current period
   */
  async estimateUsageCosts(organizationId: string): Promise<{
    estimatedAmount: number;
    currency: string;
    features: Array<{
      feature: UsageFeature;
      projectedQuantity: number;
      projectedOverage: number;
      estimatedAmount: number;
    }>;
  }> {
    try {
      const period = this.getBillingPeriod();
      const now = new Date();
      const periodDuration = period.end.getTime() - period.start.getTime();
      const elapsed = now.getTime() - period.start.getTime();
      const elapsedRatio = elapsed / periodDuration;

      // Get current usage
      const currentUsage = await this.getCurrentUsage({
        organizationId,
      });

      const features = currentUsage.features.map((feature) => {
        const projectedQuantity = Math.ceil(
          feature.totalQuantity / elapsedRatio,
        );
        const projectedOverage = Math.max(
          0,
          projectedQuantity - feature.includedQuantity,
        );
        const estimatedAmount =
          (projectedOverage * feature.pricePerUnit) / 100;

        return {
          feature: feature.feature,
          projectedQuantity,
          projectedOverage,
          estimatedAmount,
        };
      });

      const estimatedAmount = features.reduce(
        (sum, f) => sum + f.estimatedAmount,
        0,
      );

      return {
        estimatedAmount,
        currency: currentUsage.currency,
        features,
      };
    } catch (error) {
      this.logger.error('Failed to estimate usage costs', error);
      throw error;
    }
  }

  /**
   * Get billing period (current month by default)
   */
  private getBillingPeriod(
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date } {
    if (startDate && endDate) {
      return {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    return { start, end };
  }

  /**
   * Check if organization has exceeded quota for a feature
   */
  async checkQuota(
    organizationId: string,
    feature: UsageFeature,
  ): Promise<{
    hasQuota: boolean;
    totalUsed: number;
    limit: number;
    remaining: number;
  }> {
    try {
      const quota = await this.prisma.usageQuota.findUnique({
        where: {
          organisationId_feature: {
            organisationId: organizationId,
            feature,
          },
        },
      });

      if (!quota || !quota.isActive) {
        return {
          hasQuota: true,
          totalUsed: 0,
          limit: -1,
          remaining: -1,
        };
      }

      const period = this.getBillingPeriod();

      const result = await this.prisma.usageEvent.aggregate({
        where: {
          organisationId: organizationId,
          feature,
          timestamp: {
            gte: period.start,
            lte: period.end,
          },
        },
        _sum: {
          quantity: true,
        },
      });

      const totalUsed = result._sum.quantity || 0;
      const remaining = Math.max(0, quota.includedQuantity - totalUsed);

      return {
        hasQuota: remaining > 0,
        totalUsed,
        limit: quota.includedQuantity,
        remaining,
      };
    } catch (error) {
      this.logger.error('Failed to check quota', error);
      throw error;
    }
  }
}
