import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StripeBillingService } from '../../integrations/stripe/services/stripe-billing.service';
import { StripeProductsService } from '../../integrations/stripe/services/stripe-products.service';
import { StripePortalService } from '../../integrations/stripe/services/stripe-portal.service';
import { ProrationBehavior } from '../../integrations/stripe/dto/subscription.dto';
import { SubscriptionFeaturesService } from './subscription-features.service';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIERS,
  OrganizationSubscription,
  SubscriptionStatus,
  SubscriptionChangeType,
} from '../types/subscription.types';
import {
  StartTrialDto,
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionResponseDto,
  UsageStatsDto,
  PortalSessionResponseDto,
} from '../dto/subscription.dto';

/**
 * Subscription Manager Service
 * High-level abstraction over Stripe billing with business logic
 * Manages organization subscription lifecycle and tier transitions
 */
@Injectable()
export class SubscriptionManagerService {
  private readonly logger = new Logger(SubscriptionManagerService.name);
  private readonly TRIAL_DAYS = 14;

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeBilling: StripeBillingService,
    private readonly stripeProducts: StripeProductsService,
    private readonly stripePortal: StripePortalService,
    private readonly features: SubscriptionFeaturesService,
  ) {}

  /**
   * Start a trial subscription
   */
  async startTrial(dto: StartTrialDto): Promise<SubscriptionResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Starting trial for organization ${dto.orgId}`);

      // Check if organization already has a subscription
      const existing = await this.getOrganizationSubscription(dto.orgId);
      if (existing && existing.stripeSubscriptionId) {
        throw new BadRequestException(
          'Organization already has an active subscription',
        );
      }

      // Get organization owner
      const owner = await this.getOrganizationOwner(dto.orgId);
      if (!owner) {
        throw new NotFoundException(
          `No owner found for organization ${dto.orgId}`,
        );
      }

      // Get or create Stripe customer
      const customer = await this.getOrCreateStripeCustomer(owner.id, owner.email);

      // Get the trial tier (default to PRO)
      const trialTier = dto.tier || SubscriptionTier.PRO;
      const tierConfig = SUBSCRIPTION_TIERS[trialTier];

      // Get Stripe price for the tier
      const price = await this.getStripePriceForTier(trialTier);

      // Create subscription with trial
      const subscription = await this.stripeBilling.createSubscription({
        userId: owner.id,
        customerId: customer.stripeCustomerId,
        items: [
          {
            priceId: price.id,
            quantity: 1,
          },
        ],
        trialPeriodDays: this.TRIAL_DAYS,
        metadata: {
          orgId: dto.orgId,
          tier: trialTier,
          seats: '1',
        },
      });

      // Log subscription change
      await this.logSubscriptionChange({
        orgId: dto.orgId,
        userId: owner.id,
        changeType: SubscriptionChangeType.TRIAL_START,
        fromTier: SubscriptionTier.FREE,
        toTier: trialTier,
        metadata: {
          subscriptionId: subscription.id,
          trialDays: this.TRIAL_DAYS,
          duration: Date.now() - startTime,
        },
      });

      return this.formatSubscriptionResponse(dto.orgId, subscription);
    } catch (error) {
      this.logger.error(`Failed to start trial: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Upgrade subscription to a higher tier
   */
  async upgradeSubscription(
    dto: UpgradeSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Upgrading subscription for organization ${dto.orgId} to ${dto.targetTier}`);

      const current = await this.getOrganizationSubscription(dto.orgId);

      // Validate upgrade path
      if (!this.isValidUpgrade(current.tier, dto.targetTier)) {
        throw new BadRequestException(
          `Cannot upgrade from ${current.tier} to ${dto.targetTier}`,
        );
      }

      // Get organization owner
      const owner = await this.getOrganizationOwner(dto.orgId);

      // Get Stripe price for target tier
      const targetPrice = await this.getStripePriceForTier(dto.targetTier);

      let subscription;

      if (!current.stripeSubscriptionId) {
        // No Stripe subscription yet (free tier) - create new subscription
        const customer = await this.getOrCreateStripeCustomer(owner.id, owner.email);

        subscription = await this.stripeBilling.createSubscription({
          userId: owner.id,
          customerId: customer.stripeCustomerId,
          items: [
            {
              priceId: targetPrice.id,
              quantity: current.seats || 1,
            },
          ],
          defaultPaymentMethod: dto.paymentMethodId,
          metadata: {
            orgId: dto.orgId,
            tier: dto.targetTier,
            seats: String(current.seats || 1),
          },
        });
      } else {
        // Update existing subscription
        const existingSubscription = await this.stripeBilling.getSubscription(
          owner.id,
          current.stripeSubscriptionId,
        );

        subscription = await this.stripeBilling.updateSubscription({
          userId: owner.id,
          subscriptionId: current.stripeSubscriptionId,
          items: [
            {
              id: existingSubscription.items[0].id,
              priceId: targetPrice.id,
              quantity: current.seats || 1,
            },
          ],
          metadata: {
            orgId: dto.orgId,
            tier: dto.targetTier,
            seats: String(current.seats || 1),
          },
          prorationBehavior: ProrationBehavior.CREATE_PRORATIONS,
        });
      }

      // Log subscription change
      await this.logSubscriptionChange({
        orgId: dto.orgId,
        userId: owner.id,
        changeType: SubscriptionChangeType.UPGRADE,
        fromTier: current.tier,
        toTier: dto.targetTier,
        metadata: {
          subscriptionId: subscription.id,
          duration: Date.now() - startTime,
        },
      });

      return this.formatSubscriptionResponse(dto.orgId, subscription);
    } catch (error) {
      this.logger.error(`Failed to upgrade subscription: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Downgrade subscription to a lower tier
   */
  async downgradeSubscription(
    dto: DowngradeSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Downgrading subscription for organization ${dto.orgId} to ${dto.targetTier}`,
      );

      const current = await this.getOrganizationSubscription(dto.orgId);

      // Validate downgrade path
      if (!this.isValidDowngrade(current.tier, dto.targetTier)) {
        throw new BadRequestException(
          `Cannot downgrade from ${current.tier} to ${dto.targetTier}`,
        );
      }

      if (!current.stripeSubscriptionId) {
        throw new BadRequestException('No active subscription to downgrade');
      }

      // Get organization owner
      const owner = await this.getOrganizationOwner(dto.orgId);

      // If downgrading to FREE, cancel the subscription
      if (dto.targetTier === SubscriptionTier.FREE) {
        const subscription = await this.stripeBilling.cancelSubscription({
          userId: owner.id,
          subscriptionId: current.stripeSubscriptionId,
          cancelAtPeriodEnd: dto.atPeriodEnd !== false,
          cancellationReason: 'downgrade_to_free',
        });

        await this.logSubscriptionChange({
          orgId: dto.orgId,
          userId: owner.id,
          changeType: SubscriptionChangeType.DOWNGRADE,
          fromTier: current.tier,
          toTier: dto.targetTier,
          metadata: {
            subscriptionId: subscription.id,
            atPeriodEnd: dto.atPeriodEnd,
            duration: Date.now() - startTime,
          },
        });

        return this.formatSubscriptionResponse(dto.orgId, subscription);
      }

      // Otherwise, update to lower tier
      const targetPrice = await this.getStripePriceForTier(dto.targetTier);
      const existingSubscription = await this.stripeBilling.getSubscription(
        owner.id,
        current.stripeSubscriptionId,
      );

      const subscription = await this.stripeBilling.updateSubscription({
        userId: owner.id,
        subscriptionId: current.stripeSubscriptionId,
        items: [
          {
            id: existingSubscription.items[0].id,
            priceId: targetPrice.id,
            quantity: current.seats || 1,
          },
        ],
        metadata: {
          orgId: dto.orgId,
          tier: dto.targetTier,
          seats: String(current.seats || 1),
        },
        prorationBehavior: dto.atPeriodEnd !== false ? ProrationBehavior.NONE : ProrationBehavior.CREATE_PRORATIONS,
      });

      await this.logSubscriptionChange({
        orgId: dto.orgId,
        userId: owner.id,
        changeType: SubscriptionChangeType.DOWNGRADE,
        fromTier: current.tier,
        toTier: dto.targetTier,
        metadata: {
          subscriptionId: subscription.id,
          atPeriodEnd: dto.atPeriodEnd,
          duration: Date.now() - startTime,
        },
      });

      return this.formatSubscriptionResponse(dto.orgId, subscription);
    } catch (error) {
      this.logger.error(`Failed to downgrade subscription: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    dto: CancelSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Canceling subscription for organization ${dto.orgId}`);

      const current = await this.getOrganizationSubscription(dto.orgId);

      if (!current.stripeSubscriptionId) {
        throw new BadRequestException('No active subscription to cancel');
      }

      const owner = await this.getOrganizationOwner(dto.orgId);

      const subscription = await this.stripeBilling.cancelSubscription({
        userId: owner.id,
        subscriptionId: current.stripeSubscriptionId,
        cancelAtPeriodEnd: dto.atPeriodEnd !== false,
        cancellationReason: dto.reason || 'user_requested',
      });

      await this.logSubscriptionChange({
        orgId: dto.orgId,
        userId: owner.id,
        changeType: SubscriptionChangeType.CANCEL,
        fromTier: current.tier,
        toTier: SubscriptionTier.FREE,
        metadata: {
          subscriptionId: subscription.id,
          reason: dto.reason,
          atPeriodEnd: dto.atPeriodEnd,
          duration: Date.now() - startTime,
        },
      });

      return this.formatSubscriptionResponse(dto.orgId, subscription);
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscription(orgId: string): Promise<SubscriptionResponseDto> {
    const current = await this.getOrganizationSubscription(orgId);
    const usage = await this.features.getUsageMetrics(orgId);
    const tierConfig = SUBSCRIPTION_TIERS[current.tier];

    return {
      orgId,
      tier: current.tier,
      status: current.status,
      currentPeriodStart: current.currentPeriodStart,
      currentPeriodEnd: current.currentPeriodEnd,
      trialEnd: current.trialEnd,
      cancelAtPeriodEnd: current.cancelAtPeriodEnd,
      seats: current.seats,
      features: tierConfig.features,
      usage: {
        invoicesCreated: usage.invoicesCreated,
        invoicesLimit: usage.limits.invoicesPerMonth,
        activeUsers: usage.activeUsers,
        usersLimit: usage.limits.maxUsers,
        percentUsed: usage.percentUsed,
      },
    };
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(orgId: string): Promise<UsageStatsDto> {
    const usage = await this.features.getUsageMetrics(orgId);
    const warnings: string[] = [];

    // Generate warnings if approaching limits
    if (
      usage.limits.invoicesPerMonth > 0 &&
      usage.percentUsed.invoices >= 80
    ) {
      warnings.push(
        `You have used ${usage.percentUsed.invoices}% of your invoice limit`,
      );
    }

    if (usage.limits.maxUsers > 0 && usage.percentUsed.users >= 80) {
      warnings.push(
        `You have used ${usage.percentUsed.users}% of your user seats`,
      );
    }

    return {
      orgId,
      periodStart: usage.period.start,
      periodEnd: usage.period.end,
      invoicesCreated: usage.invoicesCreated,
      invoicesLimit: usage.limits.invoicesPerMonth,
      activeUsers: usage.activeUsers,
      usersLimit: usage.limits.maxUsers,
      warnings,
    };
  }

  /**
   * Get customer portal session URL
   */
  async getPortalSession(
    orgId: string,
    returnUrl: string,
  ): Promise<PortalSessionResponseDto> {
    try {
      const owner = await this.getOrganizationOwner(orgId);
      const customer = await this.getOrCreateStripeCustomer(owner.id, owner.email);

      const session = await this.stripePortal.createPortalSession({
        userId: owner.id,
        customerId: customer.stripeCustomerId,
        returnUrl,
      });

      return {
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create portal session: ${error.message}`, error);
      throw error;
    }
  }

  // Private helper methods

  private async getOrganizationSubscription(
    orgId: string,
  ): Promise<OrganizationSubscription> {
    // TODO: stripe_subscriptions table needs to be created in Prisma schema
    // For now, return default free tier until migration is complete

    /* COMMENTED OUT - Table doesn't exist yet
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        ss.id,
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
        SELECT user_id FROM user_organizations WHERE org_id = ${orgId} AND role = 'OWNER' LIMIT 1
      )
      AND ss.status IN ('ACTIVE', 'TRIALING')
      AND ss.deleted_at IS NULL
      ORDER BY ss.created_at DESC
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      // Return default free tier
      const now = new Date();
      return {
        orgId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        cancelAtPeriodEnd: false,
        seats: 1,
        usage: await this.features.getUsageMetrics(orgId),
      };
    }

    const subscription = result[0];
    return {
      orgId,
      tier: subscription.tier as SubscriptionTier,
      status: subscription.status as SubscriptionStatus,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      stripeCustomerId: subscription.stripe_customer_id,
      currentPeriodStart: new Date(subscription.current_period_start),
      currentPeriodEnd: new Date(subscription.current_period_end),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      seats: subscription.seats || 1,
      usage: await this.features.getUsageMetrics(orgId),
    };
    */

    // Return default free tier until stripe_subscriptions table is created
    const now = new Date();
    return {
      orgId,
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      cancelAtPeriodEnd: false,
      seats: 1,
      usage: await this.features.getUsageMetrics(orgId),
    };
  }

  private async getOrganizationOwner(orgId: string): Promise<any> {
    // Fixed to use correct table and field names (Membership, userId, orgId, firstName, lastName)
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT u.id, u.email, u."firstName", u."lastName"
      FROM "User" u
      INNER JOIN "Membership" m ON m."userId" = u.id
      WHERE m."orgId" = ${orgId} AND m.role = 'OWNER'
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      throw new NotFoundException(`No owner found for organization ${orgId}`);
    }

    return result[0];
  }

  private async getOrCreateStripeCustomer(
    userId: string,
    email: string,
  ): Promise<any> {
    // TODO: stripe_customers table needs to be created in Prisma schema
    // For now, throw an error indicating the feature is not yet implemented

    /* COMMENTED OUT - Table doesn't exist yet
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id, stripe_customer_id
      FROM stripe_customers
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (existing && existing.length > 0) {
      return existing[0];
    }
    */

    // Create new Stripe customer (this should be done via Stripe service)
    // For now, throw an error - customer should be created separately
    throw new BadRequestException(
      'Stripe customer not found. Please create a customer first.',
    );
  }

  private async getStripePriceForTier(tier: SubscriptionTier): Promise<any> {
    // TODO: StripeProductsService.listPrices() method needs to be implemented
    // For now, throw an error indicating the feature is not yet implemented

    /* COMMENTED OUT - listPrices method doesn't exist yet
    // Get the monthly price for the tier from Stripe
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    const prices = await this.stripeProducts.listPrices({
      active: true,
      limit: 100,
    });

    // Find price that matches the tier amount and is monthly
    // Fixed: use priceMonthly instead of price
    const price = prices.find(
      (p) =>
        p.unit_amount === tierConfig.priceMonthly &&
        p.recurring?.interval === 'month' &&
        p.metadata?.tier === tier,
    );

    if (!price) {
      throw new NotFoundException(
        `No Stripe price found for tier ${tier}. Please create products first.`,
      );
    }

    return price;
    */

    throw new BadRequestException(
      `Subscription tier management is not yet fully implemented. Missing Stripe price lookup for tier ${tier}.`,
    );
  }

  private isValidUpgrade(
    fromTier: SubscriptionTier,
    toTier: SubscriptionTier,
  ): boolean {
    const tierOrder = [
      SubscriptionTier.FREE,
      SubscriptionTier.STARTER,
      SubscriptionTier.PRO,
      SubscriptionTier.BUSINESS,
    ];

    const fromIndex = tierOrder.indexOf(fromTier);
    const toIndex = tierOrder.indexOf(toTier);

    return toIndex > fromIndex;
  }

  private isValidDowngrade(
    fromTier: SubscriptionTier,
    toTier: SubscriptionTier,
  ): boolean {
    const tierOrder = [
      SubscriptionTier.FREE,
      SubscriptionTier.STARTER,
      SubscriptionTier.PRO,
      SubscriptionTier.BUSINESS,
    ];

    const fromIndex = tierOrder.indexOf(fromTier);
    const toIndex = tierOrder.indexOf(toTier);

    return toIndex < fromIndex;
  }

  private async logSubscriptionChange(data: {
    orgId: string;
    userId: string;
    changeType: SubscriptionChangeType;
    fromTier: SubscriptionTier;
    toTier: SubscriptionTier;
    metadata: any;
  }): Promise<void> {
    try {
      // TODO: subscription_change_log table needs to be created in Prisma schema
      // For now, just log to console

      /* COMMENTED OUT - Table doesn't exist yet
      await this.prisma.$executeRaw`
        INSERT INTO subscription_change_log
        (org_id, user_id, change_type, from_tier, to_tier, metadata, created_at)
        VALUES
        (${data.orgId}, ${data.userId}, ${data.changeType}, ${data.fromTier}, ${data.toTier}, ${JSON.stringify(data.metadata)}::jsonb, NOW())
      `;
      */

      this.logger.log(
        `Subscription change: ${data.changeType} from ${data.fromTier} to ${data.toTier}`,
        {
          orgId: data.orgId,
          userId: data.userId,
          metadata: data.metadata,
        },
      );
    } catch (error) {
      this.logger.error('Failed to log subscription change', error);
    }
  }

  private formatSubscriptionResponse(
    orgId: string,
    subscription: any,
  ): SubscriptionResponseDto {
    const tier = (subscription.metadata?.tier as SubscriptionTier) || SubscriptionTier.FREE;
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    // Stripe API uses snake_case for some fields (current_period_start, trial_end, cancel_at_period_end)
    return {
      orgId,
      tier,
      status: subscription.status,
      currentPeriodStart: new Date((subscription.current_period_start || subscription.currentPeriodStart) * 1000),
      currentPeriodEnd: new Date((subscription.current_period_end || subscription.currentPeriodEnd) * 1000),
      trialEnd: subscription.trial_end || subscription.trialEnd
        ? new Date((subscription.trial_end || subscription.trialEnd) * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? subscription.cancelAtPeriodEnd ?? false,
      seats: parseInt(subscription.metadata?.seats || '1'),
      features: tierConfig.features,
      usage: {
        invoicesCreated: 0,
        invoicesLimit: tierConfig.invoicesPerMonth,
        activeUsers: 0,
        usersLimit: tierConfig.maxUsers,
        percentUsed: {
          invoices: 0,
          users: 0,
        },
      },
    };
  }
}
