import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { StripeService } from '../stripe.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
  PauseSubscriptionDto,
  ResumeSubscriptionDto,
  SubscriptionResponseDto,
  SubscriptionItemResponse,
  BillingHistoryDto,
  SubscriptionStatus,
  ProrationBehavior,
  BillingInterval,
} from '../dto/subscription.dto';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';

/**
 * Stripe Billing Service
 * Handles Stripe subscription management and billing operations
 *
 * Features:
 * - Create/update/cancel subscriptions
 * - Handle pricing tiers (Free, Pro, Enterprise)
 * - Proration for mid-cycle changes
 * - Trial period support (14-day default)
 * - Pause/resume subscriptions
 * - Billing history retrieval
 * - Upcoming invoice preview
 * - Multiple pricing intervals (monthly/yearly)
 * - Per-seat pricing support
 */
@Injectable()
export class StripeBillingService {
  private readonly logger = new Logger(StripeBillingService.name);
  private readonly stripe: Stripe | null = null;

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {
    if (this.stripeService.isEnabled()) {
      this.stripe = this.stripeService.getClient();
    } else {
      this.logger.warn('StripeBillingService disabled - Stripe is not configured');
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
   * Create a new subscription
   */
  async createSubscription(
    dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const startTime = Date.now();
    const idempotencyKey = `create-subscription-${dto.userId}-${Date.now()}-${randomBytes(8).toString('hex')}`;

    try {
      this.logger.log(
        `Creating subscription for customer ${dto.customerId}`,
      );

      // Verify customer exists
      await this.verifyCustomer(dto.customerId);

      // Prepare subscription items
      const items = dto.items.map((item) => ({
        price: item.priceId,
        quantity: item.quantity || 1,
      }));

      // Create subscription parameters
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: dto.customerId,
        items,
        metadata: {
          userId: dto.userId,
          ...dto.metadata,
        },
        proration_behavior: dto.prorationBehavior || ProrationBehavior.CREATE_PRORATIONS,
      };

      // Add trial period if specified
      if (dto.trialPeriodDays && dto.trialPeriodDays > 0) {
        subscriptionParams.trial_period_days = dto.trialPeriodDays;
      }

      // Add default payment method if specified
      if (dto.defaultPaymentMethod) {
        subscriptionParams.default_payment_method = dto.defaultPaymentMethod;
      }

      // Add discounts (coupon or promotion code) - Stripe SDK v20+ uses discounts array
      if (dto.couponId || dto.promotionCode) {
        subscriptionParams.discounts = [];
        if (dto.couponId) {
          subscriptionParams.discounts.push({ coupon: dto.couponId });
        }
        if (dto.promotionCode) {
          subscriptionParams.discounts.push({ promotion_code: dto.promotionCode });
        }
      }

      // Create subscription in Stripe
      const subscription = await this.getStripeClient().subscriptions.create(
        subscriptionParams,
        {
          idempotencyKey,
        },
      );

      // Store subscription in database
      await this.storeSubscription(dto.userId, subscription);

      // Log audit event
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'SUBSCRIPTION_CREATED',
        metadata: {
          subscriptionId: subscription.id,
          customerId: dto.customerId,
          items: dto.items,
          duration: Date.now() - startTime,
        },
      });

      return this.mapSubscriptionToResponse(subscription);
    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'SUBSCRIPTION_CREATION_FAILED',
        metadata: {
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw this.stripeService.handleStripeError(error, 'createSubscription');
    }
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(
    dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const startTime = Date.now();
    const idempotencyKey = `update-subscription-${dto.subscriptionId}-${Date.now()}-${randomBytes(8).toString('hex')}`;

    try {
      this.logger.log(`Updating subscription ${dto.subscriptionId}`);

      // Verify subscription ownership
      await this.verifySubscriptionOwnership(dto.userId, dto.subscriptionId);

      // Prepare update parameters
      const updateParams: Stripe.SubscriptionUpdateParams = {
        proration_behavior: dto.prorationBehavior || ProrationBehavior.CREATE_PRORATIONS,
        metadata: dto.metadata,
      };

      // Update items if specified
      if (dto.items && dto.items.length > 0) {
        updateParams.items = dto.items.map((item) => {
          const itemData: any = {
            price: item.priceId,
            quantity: item.quantity || 1,
          };
          if (item.id) {
            itemData.id = item.id;
          }
          return itemData;
        });
      }

      // Update cancel_at_period_end if specified
      if (dto.cancelAtPeriodEnd !== undefined) {
        updateParams.cancel_at_period_end = dto.cancelAtPeriodEnd;
      }

      // Update default payment method if specified
      if (dto.defaultPaymentMethod) {
        updateParams.default_payment_method = dto.defaultPaymentMethod;
      }

      // Update subscription in Stripe
      const subscription = await this.getStripeClient().subscriptions.update(
        dto.subscriptionId,
        updateParams,
        {
          idempotencyKey,
        },
      );

      // Update subscription in database
      await this.updateSubscriptionInDb(subscription);

      // Log audit event
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'SUBSCRIPTION_UPDATED',
        metadata: {
          subscriptionId: dto.subscriptionId,
          changes: updateParams,
          duration: Date.now() - startTime,
        },
      });

      return this.mapSubscriptionToResponse(subscription);
    } catch (error) {
      this.logger.error('Failed to update subscription', error);
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'SUBSCRIPTION_UPDATE_FAILED',
        metadata: {
          subscriptionId: dto.subscriptionId,
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw this.stripeService.handleStripeError(error, 'updateSubscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    dto: CancelSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Canceling subscription ${dto.subscriptionId}`);

      // Verify subscription ownership
      await this.verifySubscriptionOwnership(dto.userId, dto.subscriptionId);

      let subscription: Stripe.Subscription;

      if (dto.cancelAtPeriodEnd) {
        // Cancel at period end (allow subscription to run until end of billing period)
        subscription = await this.getStripeClient().subscriptions.update(
          dto.subscriptionId,
          {
            cancel_at_period_end: true,
            metadata: {
              cancellation_reason: dto.cancellationReason || 'user_requested',
            },
          },
        );
      } else {
        // Cancel immediately - Stripe SDK v20 doesn't support metadata in cancel params
        // First update metadata, then cancel
        await this.getStripeClient().subscriptions.update(dto.subscriptionId, {
          metadata: {
            cancellation_reason: dto.cancellationReason || 'user_requested',
          },
        });
        subscription = await this.getStripeClient().subscriptions.cancel(dto.subscriptionId);
      }

      // Update subscription in database
      await this.updateSubscriptionInDb(subscription);

      // Log audit event
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'SUBSCRIPTION_CANCELED',
        metadata: {
          subscriptionId: dto.subscriptionId,
          cancelAtPeriodEnd: dto.cancelAtPeriodEnd,
          reason: dto.cancellationReason,
          duration: Date.now() - startTime,
        },
      });

      return this.mapSubscriptionToResponse(subscription);
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'SUBSCRIPTION_CANCELLATION_FAILED',
        metadata: {
          subscriptionId: dto.subscriptionId,
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw this.stripeService.handleStripeError(error, 'cancelSubscription');
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(
    dto: PauseSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Pausing subscription ${dto.subscriptionId}`);

      // Verify subscription ownership
      await this.verifySubscriptionOwnership(dto.userId, dto.subscriptionId);

      const updateParams: Stripe.SubscriptionUpdateParams = {
        pause_collection: {
          behavior: 'void',
        },
      };

      // Add resume date if specified
      if (dto.resumeAt) {
        const resumeTimestamp = Math.floor(new Date(dto.resumeAt).getTime() / 1000);
        updateParams.pause_collection = {
          behavior: 'void',
          resumes_at: resumeTimestamp,
        };
      }

      const subscription = await this.getStripeClient().subscriptions.update(
        dto.subscriptionId,
        updateParams,
      );

      // Update subscription in database
      await this.updateSubscriptionInDb(subscription);

      // Log audit event
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'SUBSCRIPTION_PAUSED',
        metadata: {
          subscriptionId: dto.subscriptionId,
          resumeAt: dto.resumeAt,
          duration: Date.now() - startTime,
        },
      });

      return this.mapSubscriptionToResponse(subscription);
    } catch (error) {
      this.logger.error('Failed to pause subscription', error);
      throw this.stripeService.handleStripeError(error, 'pauseSubscription');
    }
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(
    dto: ResumeSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Resuming subscription ${dto.subscriptionId}`);

      // Verify subscription ownership
      await this.verifySubscriptionOwnership(dto.userId, dto.subscriptionId);

      const subscription = await this.getStripeClient().subscriptions.update(
        dto.subscriptionId,
        {
          pause_collection: '' as any, // Clear pause_collection
        },
      );

      // Update subscription in database
      await this.updateSubscriptionInDb(subscription);

      // Log audit event
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'SUBSCRIPTION_RESUMED',
        metadata: {
          subscriptionId: dto.subscriptionId,
          duration: Date.now() - startTime,
        },
      });

      return this.mapSubscriptionToResponse(subscription);
    } catch (error) {
      this.logger.error('Failed to resume subscription', error);
      throw this.stripeService.handleStripeError(error, 'resumeSubscription');
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(
    userId: string,
    subscriptionId: string,
  ): Promise<SubscriptionResponseDto> {
    try {
      // Verify subscription ownership
      await this.verifySubscriptionOwnership(userId, subscriptionId);

      const subscription = await this.getStripeClient().subscriptions.retrieve(
        subscriptionId,
        {
          expand: ['latest_invoice', 'default_payment_method'],
        },
      );

      return this.mapSubscriptionToResponse(subscription);
    } catch (error) {
      this.logger.error('Failed to retrieve subscription', error);
      throw this.stripeService.handleStripeError(error, 'getSubscription');
    }
  }

  /**
   * Get all subscriptions for a customer
   */
  async getCustomerSubscriptions(
    userId: string,
    customerId: string,
  ): Promise<SubscriptionResponseDto[]> {
    try {
      const subscriptions = await this.getStripeClient().subscriptions.list({
        customer: customerId,
        expand: ['data.latest_invoice', 'data.default_payment_method'],
      });

      return subscriptions.data.map((sub) => this.mapSubscriptionToResponse(sub));
    } catch (error) {
      this.logger.error('Failed to retrieve customer subscriptions', error);
      throw this.stripeService.handleStripeError(error, 'getCustomerSubscriptions');
    }
  }

  /**
   * Preview upcoming invoice
   */
  async previewUpcomingInvoice(
    customerId: string,
    subscriptionId?: string,
  ): Promise<Stripe.Invoice> {
    try {
      // Stripe SDK v20 uses createPreview instead of retrieveUpcoming
      const params: Stripe.InvoiceCreatePreviewParams = {
        customer: customerId,
      };

      if (subscriptionId) {
        params.subscription = subscriptionId;
      }

      return await this.getStripeClient().invoices.createPreview(params);
    } catch (error) {
      this.logger.error('Failed to preview upcoming invoice', error);
      throw this.stripeService.handleStripeError(error, 'previewUpcomingInvoice');
    }
  }

  /**
   * Get billing history
   */
  async getBillingHistory(
    customerId: string,
    limit: number = 20,
  ): Promise<BillingHistoryDto[]> {
    try {
      const invoices = await this.getStripeClient().invoices.list({
        customer: customerId,
        limit,
      });

      return invoices.data.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.number || '',
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status || 'draft',
        invoiceUrl: invoice.hosted_invoice_url || '',
        invoicePdf: invoice.invoice_pdf || '',
        created: invoice.created,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end,
      }));
    } catch (error) {
      this.logger.error('Failed to retrieve billing history', error);
      throw this.stripeService.handleStripeError(error, 'getBillingHistory');
    }
  }

  // Helper Methods

  private async verifyCustomer(customerId: string): Promise<void> {
    try {
      await this.getStripeClient().customers.retrieve(customerId);
    } catch (error) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
  }

  private async verifySubscriptionOwnership(
    userId: string,
    subscriptionId: string,
  ): Promise<void> {
    const subscription = await this.prisma.$queryRaw<any[]>`
      SELECT user_id FROM stripe_subscriptions
      WHERE stripe_subscription_id = ${subscriptionId}
      LIMIT 1
    `;

    if (!subscription.length || subscription[0].user_id !== userId) {
      throw new NotFoundException(
        `Subscription ${subscriptionId} not found for user ${userId}`,
      );
    }
  }

  private async storeSubscription(
    userId: string,
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const status = this.mapStripeStatusToDbStatus(subscription.status);

    // Stripe SDK v20: billing period dates are on subscription items
    const firstItem = subscription.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start || Math.floor(Date.now() / 1000);
    const currentPeriodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000);

    await this.prisma.$executeRaw`
      INSERT INTO stripe_subscriptions
      (user_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end, trial_start, trial_end, cancel_at_period_end, canceled_at, ended_at, metadata, created_at, updated_at)
      VALUES
      (${userId}, ${subscription.id}, ${subscription.customer as string}, ${status}, to_timestamp(${currentPeriodStart}), to_timestamp(${currentPeriodEnd}), ${subscription.trial_start ? `to_timestamp(${subscription.trial_start})` : null}, ${subscription.trial_end ? `to_timestamp(${subscription.trial_end})` : null}, ${subscription.cancel_at_period_end}, ${subscription.canceled_at ? `to_timestamp(${subscription.canceled_at})` : null}, ${subscription.ended_at ? `to_timestamp(${subscription.ended_at})` : null}, ${JSON.stringify(subscription.metadata)}::jsonb, NOW(), NOW())
      ON CONFLICT (stripe_subscription_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        trial_start = EXCLUDED.trial_start,
        trial_end = EXCLUDED.trial_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        canceled_at = EXCLUDED.canceled_at,
        ended_at = EXCLUDED.ended_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;

    // Store subscription items
    for (const item of subscription.items.data) {
      await this.prisma.$executeRaw`
        INSERT INTO stripe_subscription_items
        (stripe_subscription_item_id, subscription_id, stripe_price_id, quantity, created_at, updated_at)
        SELECT ${item.id}, id, ${item.price.id}, ${item.quantity}, NOW(), NOW()
        FROM stripe_subscriptions
        WHERE stripe_subscription_id = ${subscription.id}
        ON CONFLICT (stripe_subscription_item_id)
        DO UPDATE SET
          stripe_price_id = EXCLUDED.stripe_price_id,
          quantity = EXCLUDED.quantity,
          updated_at = NOW()
      `;
    }
  }

  private async updateSubscriptionInDb(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const status = this.mapStripeStatusToDbStatus(subscription.status);

    // Stripe SDK v20: billing period dates are on subscription items
    const firstItem = subscription.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start || Math.floor(Date.now() / 1000);
    const currentPeriodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000);

    await this.prisma.$executeRaw`
      UPDATE stripe_subscriptions
      SET
        status = ${status},
        current_period_start = to_timestamp(${currentPeriodStart}),
        current_period_end = to_timestamp(${currentPeriodEnd}),
        trial_start = ${subscription.trial_start ? `to_timestamp(${subscription.trial_start})` : null},
        trial_end = ${subscription.trial_end ? `to_timestamp(${subscription.trial_end})` : null},
        cancel_at_period_end = ${subscription.cancel_at_period_end},
        canceled_at = ${subscription.canceled_at ? `to_timestamp(${subscription.canceled_at})` : null},
        ended_at = ${subscription.ended_at ? `to_timestamp(${subscription.ended_at})` : null},
        metadata = ${JSON.stringify(subscription.metadata)}::jsonb,
        updated_at = NOW()
      WHERE stripe_subscription_id = ${subscription.id}
    `;
  }

  private mapStripeStatusToDbStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      unpaid: SubscriptionStatus.UNPAID,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      trialing: SubscriptionStatus.TRIALING,
      paused: SubscriptionStatus.PAUSED,
    };

    return statusMap[status] || SubscriptionStatus.ACTIVE;
  }

  private mapSubscriptionToResponse(
    subscription: Stripe.Subscription,
  ): SubscriptionResponseDto {
    // Stripe SDK v20: billing period dates are on subscription items
    const firstItem = subscription.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start || Math.floor(Date.now() / 1000);
    const currentPeriodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000);

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: this.mapStripeStatusToDbStatus(subscription.status),
      items: subscription.items.data.map((item) => this.mapSubscriptionItem(item)),
      currentPeriodStart,
      currentPeriodEnd,
      trialStart: subscription.trial_start || undefined,
      trialEnd: subscription.trial_end || undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at || undefined,
      endedAt: subscription.ended_at || undefined,
      latestInvoiceId: subscription.latest_invoice
        ? typeof subscription.latest_invoice === 'string'
          ? subscription.latest_invoice
          : subscription.latest_invoice.id
        : undefined,
      defaultPaymentMethod: subscription.default_payment_method
        ? typeof subscription.default_payment_method === 'string'
          ? subscription.default_payment_method
          : subscription.default_payment_method.id
        : undefined,
      metadata: subscription.metadata,
      created: subscription.created,
    };
  }

  private mapSubscriptionItem(
    item: Stripe.SubscriptionItem,
  ): SubscriptionItemResponse {
    return {
      id: item.id,
      priceId: item.price.id,
      productId: typeof item.price.product === 'string'
        ? item.price.product
        : item.price.product.id,
      quantity: item.quantity || 1,
      price: {
        id: item.price.id,
        unitAmount: item.price.unit_amount || 0,
        currency: item.price.currency,
        interval: (item.price.recurring?.interval || 'month') as BillingInterval,
        intervalCount: item.price.recurring?.interval_count || 1,
      },
    };
  }

  private async logAuditEvent(data: {
    userId: string;
    action: string;
    metadata: any;
  }): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO stripe_audit_logs
        (user_id, action, metadata, created_at)
        VALUES
        (${data.userId}, ${data.action}, ${JSON.stringify(data.metadata)}::jsonb, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}
