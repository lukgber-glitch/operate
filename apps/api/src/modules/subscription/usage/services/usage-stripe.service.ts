import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { StripeService } from '../../../integrations/stripe/stripe.service';
import { UsageFeature } from '@prisma/client';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';

/**
 * Usage Stripe Service
 * Handles reporting usage to Stripe for metered billing
 *
 * Features:
 * - Report usage records to Stripe
 * - Idempotent usage reporting
 * - Handle Stripe subscription items
 * - Retry failed reports
 */
@Injectable()
export class UsageStripeService {
  private readonly logger = new Logger(UsageStripeService.name);
  private readonly stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {
    if (this.stripeService.isEnabled()) {
      this.stripe = this.stripeService.getClient();
    } else {
      this.logger.warn('UsageStripeService disabled - Stripe is not configured');
    }
  }

  /**
   * Get Stripe client or throw if not available
   */
  private getStripeClient(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  /**
   * Report usage to Stripe
   */
  async reportUsageToStripe(
    organizationId: string,
    feature: UsageFeature,
    quantity: number,
    timestamp: Date = new Date(),
  ): Promise<void> {
    const startTime = Date.now();
    const idempotencyKey = `usage-${organizationId}-${feature}-${timestamp.getTime()}-${randomBytes(8).toString('hex')}`;

    try {
      this.logger.debug(
        `Reporting usage to Stripe: org=${organizationId}, feature=${feature}, qty=${quantity}`,
      );

      // Get Stripe subscription item for this feature
      const subscriptionItem = await this.getSubscriptionItemForFeature(
        organizationId,
        feature,
      );

      if (!subscriptionItem) {
        this.logger.warn(
          `No Stripe subscription item found for org=${organizationId}, feature=${feature}`,
        );
        return;
      }

      // Create usage record in Stripe
      const usageRecord = await this.getStripeClient().subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity,
          timestamp: Math.floor(timestamp.getTime() / 1000),
          action: 'increment',
        },
        {
          idempotencyKey,
        },
      );

      // Store usage record tracking
      await this.prisma.stripeUsageRecord.create({
        data: {
          organisationId: organizationId,
          stripeSubscriptionItemId: subscriptionItem.id,
          stripeUsageRecordId: usageRecord.id,
          feature,
          quantity,
          timestamp,
          status: 'SENT',
          sentAt: new Date(),
          idempotencyKey,
        },
      });

      this.logger.debug(
        `Usage reported to Stripe successfully in ${Date.now() - startTime}ms`,
      );
    } catch (error) {
      this.logger.error('Failed to report usage to Stripe', error);

      // Store failed attempt
      await this.prisma.stripeUsageRecord.create({
        data: {
          organisationId: organizationId,
          stripeSubscriptionItemId: 'unknown',
          feature,
          quantity,
          timestamp,
          status: 'FAILED',
          errorMessage: error.message,
          idempotencyKey,
        },
      });

      throw error;
    }
  }

  /**
   * Report aggregated usage to Stripe
   */
  async reportAggregatedUsage(
    organizationId: string,
    feature: UsageFeature,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<void> {
    try {
      // Get unreported usage events
      const events = await this.prisma.usageEvent.findMany({
        where: {
          organisationId: organizationId,
          feature,
          timestamp: {
            gte: periodStart,
            lte: periodEnd,
          },
          reportedToStripe: false,
        },
      });

      if (events.length === 0) {
        this.logger.debug(
          `No unreported usage events for org=${organizationId}, feature=${feature}`,
        );
        return;
      }

      // Sum quantities
      const totalQuantity = events.reduce((sum, e) => sum + e.quantity, 0);

      // Report to Stripe
      await this.reportUsageToStripe(
        organizationId,
        feature,
        totalQuantity,
        periodEnd,
      );

      // Mark events as reported
      await this.prisma.usageEvent.updateMany({
        where: {
          id: { in: events.map((e) => e.id) },
        },
        data: {
          reportedToStripe: true,
          reportedAt: new Date(),
        },
      });

      this.logger.debug(
        `Reported ${totalQuantity} ${feature} usage from ${events.length} events`,
      );
    } catch (error) {
      this.logger.error('Failed to report aggregated usage', error);
      throw error;
    }
  }

  /**
   * Create metered price in Stripe
   */
  async createMeteredPrice(
    productId: string,
    feature: UsageFeature,
    unitAmountDecimal: string,
    currency: string = 'EUR',
  ): Promise<Stripe.Price> {
    try {
      const price = await this.getStripeClient().prices.create({
        product: productId,
        currency: currency.toLowerCase(),
        unit_amount_decimal: unitAmountDecimal,
        recurring: {
          interval: 'month',
          usage_type: 'metered',
          aggregate_usage: 'sum',
        },
        billing_scheme: 'per_unit',
        metadata: {
          feature,
        },
      });

      this.logger.log(
        `Created metered price ${price.id} for feature ${feature}`,
      );

      return price;
    } catch (error) {
      this.logger.error('Failed to create metered price', error);
      throw this.stripeService.handleStripeError(error, 'createMeteredPrice');
    }
  }

  /**
   * Add metered subscription item
   */
  async addMeteredSubscriptionItem(
    subscriptionId: string,
    priceId: string,
  ): Promise<Stripe.SubscriptionItem> {
    try {
      const item = await this.getStripeClient().subscriptionItems.create({
        subscription: subscriptionId,
        price: priceId,
      });

      this.logger.log(
        `Added metered subscription item ${item.id} to subscription ${subscriptionId}`,
      );

      return item;
    } catch (error) {
      this.logger.error('Failed to add metered subscription item', error);
      throw this.stripeService.handleStripeError(
        error,
        'addMeteredSubscriptionItem',
      );
    }
  }

  /**
   * Get Stripe subscription item for a feature
   */
  private async getSubscriptionItemForFeature(
    organizationId: string,
    feature: UsageFeature,
  ): Promise<Stripe.SubscriptionItem | null> {
    try {
      // Get organization's active Stripe subscription
      const subscription = await this.prisma.$queryRaw<any[]>`
        SELECT stripe_subscription_id
        FROM stripe_subscriptions
        WHERE user_id IN (
          SELECT user_id FROM memberships WHERE org_id IN (
            SELECT id FROM organisations WHERE id = ${organizationId}
          )
        )
        AND status = 'ACTIVE'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!subscription || subscription.length === 0) {
        this.logger.warn(
          `No active Stripe subscription found for org ${organizationId}`,
        );
        return null;
      }

      const subscriptionId = subscription[0].stripe_subscription_id;

      // Get subscription items from Stripe
      const stripeSubscription = await this.getStripeClient().subscriptions.retrieve(
        subscriptionId,
        {
          expand: ['items.data.price'],
        },
      );

      // Find item matching the feature
      const item = stripeSubscription.items.data.find((item) => {
        const price = item.price as Stripe.Price;
        return price.metadata?.feature === feature;
      });

      return item || null;
    } catch (error) {
      this.logger.error('Failed to get subscription item for feature', error);
      return null;
    }
  }

  /**
   * Retry failed usage reports
   */
  async retryFailedReports(maxRetries: number = 3): Promise<number> {
    try {
      const failedRecords = await this.prisma.stripeUsageRecord.findMany({
        where: {
          status: 'FAILED',
          retryCount: { lt: maxRetries },
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 100,
      });

      let retried = 0;

      for (const record of failedRecords) {
        try {
          await this.reportUsageToStripe(
            record.organisationId,
            record.feature,
            record.quantity,
            record.timestamp,
          );

          await this.prisma.stripeUsageRecord.update({
            where: { id: record.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              retryCount: record.retryCount + 1,
            },
          });

          retried++;
        } catch (error) {
          await this.prisma.stripeUsageRecord.update({
            where: { id: record.id },
            data: {
              errorMessage: error.message,
              retryCount: record.retryCount + 1,
            },
          });
        }
      }

      this.logger.log(`Retried ${retried} failed usage reports`);
      return retried;
    } catch (error) {
      this.logger.error('Failed to retry failed reports', error);
      throw error;
    }
  }

  /**
   * Get usage summary from Stripe
   */
  async getStripeUsageSummary(
    subscriptionItemId: string,
  ): Promise<Stripe.UsageRecordSummary[]> {
    try {
      const summaries = await this.getStripeClient().subscriptionItems.listUsageRecordSummaries(
        subscriptionItemId,
        {
          limit: 100,
        },
      );

      return summaries.data;
    } catch (error) {
      this.logger.error('Failed to get Stripe usage summary', error);
      throw this.stripeService.handleStripeError(
        error,
        'getStripeUsageSummary',
      );
    }
  }
}
