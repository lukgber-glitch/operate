import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  SubscriptionTier,
  PlatformFeature,
  SUBSCRIPTION_TIERS,
  FeatureCheckResult,
  UsageMetrics,
} from '../types/subscription.types';

/**
 * Subscription Features Service
 * Handles feature gating and usage tracking based on subscription tier
 */
@Injectable()
export class SubscriptionFeaturesService {
  private readonly logger = new Logger(SubscriptionFeaturesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if organization has access to a feature
   */
  async hasFeature(
    orgId: string,
    feature: PlatformFeature,
  ): Promise<FeatureCheckResult> {
    try {
      const subscription = await this.getOrganizationSubscription(orgId);

      if (!subscription) {
        return {
          hasAccess: false,
          reason: 'No active subscription found',
          upgradeRequired: SubscriptionTier.STARTER,
        };
      }

      const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];

      // Check if feature is included in tier
      const hasFeature = tierConfig.features.includes(feature);

      if (!hasFeature) {
        // Find the lowest tier that includes this feature
        const upgradeRequired = this.findRequiredTierForFeature(feature);

        return {
          hasAccess: false,
          reason: `Feature '${feature}' requires ${upgradeRequired} tier or higher`,
          upgradeRequired,
        };
      }

      return {
        hasAccess: true,
      };
    } catch (error) {
      this.logger.error(`Failed to check feature access: ${error.message}`, error);
      return {
        hasAccess: false,
        reason: 'Error checking feature access',
      };
    }
  }

  /**
   * Check if organization can create another invoice (usage limit)
   */
  async canCreateInvoice(orgId: string): Promise<FeatureCheckResult> {
    try {
      const usage = await this.getUsageMetrics(orgId);

      // Unlimited tier
      if (usage.limits.invoices === -1) {
        return { hasAccess: true };
      }

      // Check if under limit
      if (usage.invoicesCreated < usage.limits.invoices) {
        return { hasAccess: true };
      }

      return {
        hasAccess: false,
        reason: `Monthly invoice limit reached (${usage.limits.invoices}). Upgrade to increase limit.`,
        upgradeRequired: this.getNextTier(usage.tier),
      };
    } catch (error) {
      this.logger.error(`Failed to check invoice limit: ${error.message}`, error);
      return {
        hasAccess: false,
        reason: 'Error checking invoice limit',
      };
    }
  }

  /**
   * Check if organization can add another user (seat limit)
   */
  async canAddUser(orgId: string): Promise<FeatureCheckResult> {
    try {
      const usage = await this.getUsageMetrics(orgId);

      // Unlimited tier
      if (usage.limits.teamMembers === -1) {
        return { hasAccess: true };
      }

      // Check if under limit
      if (usage.teamMembersActive < usage.limits.teamMembers) {
        return { hasAccess: true };
      }

      return {
        hasAccess: false,
        reason: `Team member limit reached (${usage.limits.teamMembers}). Upgrade to add more members.`,
        upgradeRequired: this.getNextTier(usage.tier),
      };
    } catch (error) {
      this.logger.error(`Failed to check user limit: ${error.message}`, error);
      return {
        hasAccess: false,
        reason: 'Error checking user limit',
      };
    }
  }

  /**
   * Get current usage metrics for organization
   */
  async getUsageMetrics(orgId: string): Promise<UsageMetrics> {
    const subscription = await this.getOrganizationSubscription(orgId);
    const tier = subscription?.tier || SubscriptionTier.FREE;
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    // Get current billing period
    const now = new Date();
    const periodStart = subscription?.currentPeriodStart || this.getMonthStart(now);
    const periodEnd = subscription?.currentPeriodEnd || this.getMonthEnd(now);

    // Count usage in current period
    const invoicesCreated = await this.countInvoicesInPeriod(
      orgId,
      periodStart,
      periodEnd,
    );
    const teamMembersActive = await this.countActiveUsers(orgId);
    const aiMessagesUsed = await this.countAIMessagesInPeriod(
      orgId,
      periodStart,
      periodEnd,
    );
    const bankConnectionsUsed = await this.countBankConnections(orgId);

    // Calculate percentage used
    const invoicesPercent =
      tierConfig.invoices === -1
        ? -1
        : Math.round((invoicesCreated / tierConfig.invoices) * 100);

    const teamMembersPercent =
      tierConfig.teamMembers === -1
        ? -1
        : Math.round((teamMembersActive / tierConfig.teamMembers) * 100);

    const aiMessagesPercent =
      tierConfig.aiMessages === -1
        ? -1
        : Math.round((aiMessagesUsed / tierConfig.aiMessages) * 100);

    const bankConnectionsPercent =
      tierConfig.bankConnections === -1
        ? -1
        : Math.round((bankConnectionsUsed / tierConfig.bankConnections) * 100);

    return {
      orgId,
      tier,
      period: {
        start: periodStart,
        end: periodEnd,
      },
      invoicesCreated,
      teamMembersActive,
      activeUsers: teamMembersActive, // Alias for compatibility
      aiMessagesUsed,
      bankConnectionsUsed,
      limits: {
        invoices: tierConfig.invoices,
        invoicesPerMonth: tierConfig.invoices, // Alias for compatibility
        teamMembers: tierConfig.teamMembers,
        maxUsers: tierConfig.teamMembers, // Alias for compatibility
        users: tierConfig.teamMembers, // Alias for compatibility
        aiMessages: tierConfig.aiMessages,
        bankConnections: tierConfig.bankConnections,
      },
      percentUsed: {
        invoices: invoicesPercent,
        teamMembers: teamMembersPercent,
        users: teamMembersPercent, // Alias for compatibility
        aiMessages: aiMessagesPercent,
        bankConnections: bankConnectionsPercent,
      },
    };
  }

  /**
   * Track invoice creation
   */
  async trackInvoiceCreated(orgId: string, invoiceId: string): Promise<void> {
    try {
      // Store in usage tracking table
      await this.prisma.$executeRaw`
        INSERT INTO subscription_usage_tracking
        (org_id, resource_type, resource_id, event_type, created_at)
        VALUES
        (${orgId}, 'invoice', ${invoiceId}, 'created', NOW())
      `;

      // Check if approaching limit
      const usage = await this.getUsageMetrics(orgId);
      if (
        usage.limits.invoices > 0 &&
        usage.percentUsed.invoices >= 80
      ) {
        this.logger.warn(
          `Organization ${orgId} has used ${usage.percentUsed.invoices}% of invoice limit`,
        );
        // TODO: Send notification to org admin
      }
    } catch (error) {
      this.logger.error(`Failed to track invoice creation: ${error.message}`, error);
    }
  }

  /**
   * Track user addition
   */
  async trackUserAdded(orgId: string, userId: string): Promise<void> {
    try {
      // Store in usage tracking table
      await this.prisma.$executeRaw`
        INSERT INTO subscription_usage_tracking
        (org_id, resource_type, resource_id, event_type, created_at)
        VALUES
        (${orgId}, 'user', ${userId}, 'added', NOW())
      `;

      // Check if approaching limit
      const usage = await this.getUsageMetrics(orgId);
      if (usage.limits.teamMembers > 0 && usage.percentUsed.teamMembers >= 80) {
        this.logger.warn(
          `Organization ${orgId} has used ${usage.percentUsed.teamMembers}% of team member seats`,
        );
        // TODO: Send notification to org admin
      }
    } catch (error) {
      this.logger.error(`Failed to track user addition: ${error.message}`, error);
    }
  }

  // Private helper methods

  private async getOrganizationSubscription(orgId: string): Promise<any> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        ss.id,
        ss.user_id,
        ss.stripe_subscription_id,
        ss.stripe_customer_id,
        ss.status,
        ss.current_period_start,
        ss.current_period_end,
        ss.trial_end,
        ss.cancel_at_period_end,
        COALESCE(ss.metadata->>'tier', 'FREE') as tier,
        COALESCE((ss.metadata->>'seats')::int, 1) as seats
      FROM stripe_subscriptions ss
      INNER JOIN users u ON u.id = ss.user_id
      WHERE u.id IN (
        SELECT user_id FROM user_organizations WHERE org_id = ${orgId} LIMIT 1
      )
      AND ss.status IN ('ACTIVE', 'TRIALING')
      AND ss.deleted_at IS NULL
      ORDER BY ss.created_at DESC
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      // Return default free tier
      return {
        tier: SubscriptionTier.FREE,
        status: 'ACTIVE',
        currentPeriodStart: this.getMonthStart(new Date()),
        currentPeriodEnd: this.getMonthEnd(new Date()),
        seats: 1,
      };
    }

    return {
      ...result[0],
      tier: result[0].tier as SubscriptionTier,
      currentPeriodStart: new Date(result[0].current_period_start),
      currentPeriodEnd: new Date(result[0].current_period_end),
      trialEnd: result[0].trial_end ? new Date(result[0].trial_end) : undefined,
    };
  }

  private async countInvoicesInPeriod(
    orgId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM invoices
      WHERE org_id = ${orgId}
      AND created_at >= ${start}
      AND created_at < ${end}
      AND deleted_at IS NULL
    `;

    return result[0]?.count || 0;
  }

  private async countActiveUsers(orgId: string): Promise<number> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(DISTINCT user_id)::int as count
      FROM user_organizations
      WHERE org_id = ${orgId}
      AND deleted_at IS NULL
    `;

    return result[0]?.count || 0;
  }

  private findRequiredTierForFeature(feature: PlatformFeature): SubscriptionTier {
    // Check each tier in order: FREE -> STARTER -> PRO -> BUSINESS
    for (const tier of [
      SubscriptionTier.FREE,
      SubscriptionTier.STARTER,
      SubscriptionTier.PRO,
      SubscriptionTier.BUSINESS,
    ]) {
      if (SUBSCRIPTION_TIERS[tier].features.includes(feature)) {
        return tier;
      }
    }

    return SubscriptionTier.BUSINESS;
  }

  private getNextTier(currentTier: SubscriptionTier): SubscriptionTier {
    if (currentTier === SubscriptionTier.FREE) return SubscriptionTier.STARTER;
    if (currentTier === SubscriptionTier.STARTER) return SubscriptionTier.PRO;
    if (currentTier === SubscriptionTier.PRO) return SubscriptionTier.BUSINESS;
    return SubscriptionTier.BUSINESS;
  }

  private async countAIMessagesInPeriod(
    orgId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM chat_messages
      WHERE org_id = ${orgId}
      AND role = 'assistant'
      AND created_at >= ${start}
      AND created_at < ${end}
      AND deleted_at IS NULL
    `;

    return result[0]?.count || 0;
  }

  private async countBankConnections(orgId: string): Promise<number> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM bank_connections
      WHERE org_id = ${orgId}
      AND status = 'ACTIVE'
      AND deleted_at IS NULL
    `;

    return result[0]?.count || 0;
  }

  private getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  private getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }
}
