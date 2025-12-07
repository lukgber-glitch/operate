import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UsageFeature } from '@prisma/client';

/**
 * Usage Limit Service
 * Checks usage limits based on subscription tiers
 *
 * Features:
 * - Tier-based limit checking
 * - Real-time usage counting
 * - Limit enforcement with detailed error messages
 * - Support for unlimited tiers (-1 = unlimited)
 */
@Injectable()
export class UsageLimitService {
  private readonly logger = new Logger(UsageLimitService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if organization can use a specific feature
   * Throws ForbiddenException if limit exceeded
   */
  async checkLimit(
    organizationId: string,
    feature: UsageFeature,
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    percentage: number;
  }> {
    try {
      this.logger.debug(
        `Checking limit for org=${organizationId}, feature=${feature}`,
      );

      // Get organization with subscription tier
      const org = await this.prisma.organisation.findUnique({
        where: { id: organizationId },
        select: { subscriptionTier: true },
      });

      if (!org) {
        throw new NotFoundException(`Organization ${organizationId} not found`);
      }

      // Get tier configuration
      const tier = await this.prisma.subscriptionTier.findUnique({
        where: { name: org.subscriptionTier },
      });

      if (!tier) {
        // Default to free tier if not found
        this.logger.warn(
          `Tier ${org.subscriptionTier} not found, defaulting to free`,
        );
        const freeTier = await this.prisma.subscriptionTier.findUnique({
          where: { name: 'free' },
        });
        if (!freeTier) {
          throw new Error('No subscription tiers configured');
        }
        // Update org to free tier
        await this.prisma.organisation.update({
          where: { id: organizationId },
          data: { subscriptionTier: 'free' },
        });
        return this.checkLimitWithTier(organizationId, feature, freeTier);
      }

      return this.checkLimitWithTier(organizationId, feature, tier);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('Failed to check limit', error);
      throw error;
    }
  }

  /**
   * Check limit with specific tier configuration
   */
  private async checkLimitWithTier(
    organizationId: string,
    feature: UsageFeature,
    tier: any,
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    percentage: number;
  }> {
    const limits = tier.limits as Record<string, number>;
    const limit = limits[feature];

    // If no limit defined, default to unlimited
    if (limit === undefined) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        percentage: 0,
      };
    }

    // -1 means unlimited
    if (limit === -1) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        percentage: 0,
      };
    }

    // Get current usage for this billing period
    const current = await this.getCurrentUsage(organizationId, feature);

    // Calculate percentage
    const percentage = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;

    // Check if limit exceeded
    const allowed = current < limit;

    return {
      allowed,
      current,
      limit,
      percentage,
    };
  }

  /**
   * Get current usage for a feature in the current billing period
   */
  private async getCurrentUsage(
    organizationId: string,
    feature: UsageFeature,
  ): Promise<number> {
    const period = this.getCurrentBillingPeriod();

    // For cumulative features (like BANK_CONNECTIONS), get current count
    if (this.isCumulativeFeature(feature)) {
      return this.getCumulativeUsage(organizationId, feature);
    }

    // For periodic features (like AI_MESSAGES), count events in period
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

    return result._sum.quantity || 0;
  }

  /**
   * Get cumulative usage (current state, not period-based)
   */
  private async getCumulativeUsage(
    organizationId: string,
    feature: UsageFeature,
  ): Promise<number> {
    switch (feature) {
      case UsageFeature.BANK_CONNECTIONS:
        // Count active bank connections
        const bankCount = await this.prisma.bankConnection.count({
          where: {
            organisationId: organizationId,
            status: 'ACTIVE',
          },
        });
        return bankCount;

      default:
        return 0;
    }
  }

  /**
   * Check if feature is cumulative (current state) vs periodic (monthly count)
   */
  private isCumulativeFeature(feature: UsageFeature): boolean {
    return [UsageFeature.BANK_CONNECTIONS].includes(feature);
  }

  /**
   * Get current billing period (current month)
   */
  private getCurrentBillingPeriod(): { start: Date; end: Date } {
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
   * Enforce limit - throws exception if exceeded
   */
  async enforceLimit(
    organizationId: string,
    feature: UsageFeature,
  ): Promise<void> {
    const check = await this.checkLimit(organizationId, feature);

    if (!check.allowed) {
      const featureName = this.getFeatureName(feature);
      throw new ForbiddenException(
        `Usage limit exceeded for ${featureName}. Current: ${check.current}, Limit: ${check.limit}. Please upgrade your plan to continue.`,
      );
    }
  }

  /**
   * Get all limits for an organization
   */
  async getLimits(organizationId: string): Promise<{
    tier: string;
    limits: Array<{
      feature: UsageFeature;
      featureName: string;
      current: number;
      limit: number;
      percentage: number;
      allowed: boolean;
    }>;
  }> {
    // Get organization tier
    const org = await this.prisma.organisation.findUnique({
      where: { id: organizationId },
      select: { subscriptionTier: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    // Get tier configuration
    const tier = await this.prisma.subscriptionTier.findUnique({
      where: { name: org.subscriptionTier },
    });

    if (!tier) {
      throw new NotFoundException(`Tier ${org.subscriptionTier} not found`);
    }

    const limits = tier.limits as Record<string, number>;

    // Check all defined limits
    const limitChecks = await Promise.all(
      Object.keys(limits).map(async (featureKey) => {
        const feature = featureKey as UsageFeature;
        const check = await this.checkLimitWithTier(
          organizationId,
          feature,
          tier,
        );
        return {
          feature,
          featureName: this.getFeatureName(feature),
          current: check.current,
          limit: check.limit,
          percentage: check.percentage,
          allowed: check.allowed,
        };
      }),
    );

    return {
      tier: org.subscriptionTier,
      limits: limitChecks,
    };
  }

  /**
   * Get human-readable feature name
   */
  private getFeatureName(feature: UsageFeature): string {
    const names: Record<UsageFeature, string> = {
      AI_MESSAGES: 'AI Chat Messages',
      BANK_CONNECTIONS: 'Bank Connections',
      INVOICES: 'Invoices',
      EMAIL_SYNCS: 'Email Syncs',
      TAX_FILINGS: 'Tax Filings',
      OCR_SCAN: 'Receipt Scans',
      API_CALL: 'API Calls',
      STORAGE_GB: 'Storage (GB)',
      AI_CLASSIFICATION: 'AI Classifications',
      EMAIL_SENT: 'Emails Sent',
      BANK_SYNC: 'Bank Syncs',
      SMS_SENT: 'SMS Messages',
      EXPORT_PDF: 'PDF Exports',
      WEBHOOK_CALL: 'Webhook Calls',
      CUSTOM_REPORT: 'Custom Reports',
    };
    return names[feature] || feature;
  }
}
