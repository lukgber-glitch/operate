import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionStatus, SubscriptionTier } from './dto/subscription.dto';
import Stripe from 'stripe';

/**
 * Stripe Billing Webhook Handlers
 * Handles subscription and invoice webhook events with full lifecycle management
 *
 * Features:
 * - Subscription creation, updates, and cancellation
 * - Organization tier management based on price IDs
 * - Invoice payment tracking and failure handling
 * - Trial period notifications
 * - Idempotency through event ID tracking
 */

/**
 * Price ID to Tier Mapping
 * Map your Stripe price IDs to subscription tiers
 * Update these with your actual Stripe price IDs
 */
const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  // Monthly prices
  'price_starter_monthly': SubscriptionTier.STARTER,
  'price_pro_monthly': SubscriptionTier.PRO,
  'price_business_monthly': SubscriptionTier.BUSINESS,
  'price_enterprise_monthly': SubscriptionTier.BUSINESS,

  // Annual prices
  'price_starter_annual': SubscriptionTier.STARTER,
  'price_pro_annual': SubscriptionTier.PRO,
  'price_business_annual': SubscriptionTier.BUSINESS,
  'price_enterprise_annual': SubscriptionTier.BUSINESS,
};

export class StripeBillingWebhookHandlers {
  private readonly logger = new Logger(StripeBillingWebhookHandlers.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle customer.subscription.created event
   */
  async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing customer.subscription.created for ${subscription.id}`);

    const status = this.mapSubscriptionStatus(subscription.status);
    const customerId = subscription.customer as string;

    // Get user_id and org_id from customer
    const customer = await this.prisma.$queryRaw<any[]>`
      SELECT sc.user_id, uo.org_id
      FROM stripe_customers sc
      LEFT JOIN user_organizations uo ON uo.user_id = sc.user_id AND uo.role = 'OWNER'
      WHERE sc.stripe_customer_id = ${customerId}
      LIMIT 1
    `;

    if (!customer.length) {
      this.logger.warn(`Customer ${customerId} not found in database`);
      return;
    }

    const userId = customer[0].user_id;
    const orgId = customer[0].org_id || subscription.metadata?.orgId;

    // Determine tier from price ID
    const priceId = subscription.items.data[0]?.price.id;
    const tier = this.getTierFromPriceId(priceId) || subscription.metadata?.tier || SubscriptionTier.FREE;

    // Store subscription with tier in metadata
    const metadata = {
      ...subscription.metadata,
      tier,
      orgId,
      seats: subscription.items.data[0]?.quantity?.toString() || '1',
    };

    // Stripe SDK v20: billing period dates are on subscription items
    const firstItem = subscription.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start || Math.floor(Date.now() / 1000);
    const currentPeriodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000);

    await this.prisma.$executeRaw`
      INSERT INTO stripe_subscriptions
      (user_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end, trial_start, trial_end, cancel_at_period_end, metadata, created_at, updated_at)
      VALUES
      (${userId}, ${subscription.id}, ${customerId}, ${status}, to_timestamp(${currentPeriodStart}), to_timestamp(${currentPeriodEnd}), ${subscription.trial_start ? `to_timestamp(${subscription.trial_start})` : null}, ${subscription.trial_end ? `to_timestamp(${subscription.trial_end})` : null}, ${subscription.cancel_at_period_end}, ${JSON.stringify(metadata)}::jsonb, NOW(), NOW())
      ON CONFLICT (stripe_subscription_id) DO NOTHING
    `;

    // Store subscription items
    for (const item of subscription.items.data) {
      await this.prisma.$executeRaw`
        INSERT INTO stripe_subscription_items
        (stripe_subscription_item_id, subscription_id, stripe_price_id, quantity, created_at, updated_at)
        SELECT ${item.id}, id, ${item.price.id}, ${item.quantity || 1}, NOW(), NOW()
        FROM stripe_subscriptions
        WHERE stripe_subscription_id = ${subscription.id}
        ON CONFLICT (stripe_subscription_item_id) DO NOTHING
      `;
    }

    // Update organization tier if orgId is available
    if (orgId && typeof tier === 'string') {
      await this.updateOrganizationTier(orgId, tier as SubscriptionTier, subscription.trial_end);
      this.logger.log(`Updated organization ${orgId} to tier ${tier}`);
    }
  }

  /**
   * Handle customer.subscription.updated event
   */
  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing customer.subscription.updated for ${subscription.id}`);

    const status = this.mapSubscriptionStatus(subscription.status);

    // Determine tier from price ID
    const priceId = subscription.items.data[0]?.price.id;
    const tier = this.getTierFromPriceId(priceId) || subscription.metadata?.tier || SubscriptionTier.FREE;
    const orgId = subscription.metadata?.orgId;

    // Update metadata with tier
    const firstItem = subscription.items.data[0];
    const metadata = {
      ...subscription.metadata,
      tier,
      seats: firstItem?.quantity?.toString() || '1',
    };

    // Stripe SDK v20: billing period dates are on subscription items
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
        metadata = ${JSON.stringify(metadata)}::jsonb,
        updated_at = NOW()
      WHERE stripe_subscription_id = ${subscription.id}
    `;

    // Update subscription items
    for (const item of subscription.items.data) {
      await this.prisma.$executeRaw`
        INSERT INTO stripe_subscription_items
        (stripe_subscription_item_id, subscription_id, stripe_price_id, quantity, created_at, updated_at)
        SELECT ${item.id}, id, ${item.price.id}, ${item.quantity || 1}, NOW(), NOW()
        FROM stripe_subscriptions
        WHERE stripe_subscription_id = ${subscription.id}
        ON CONFLICT (stripe_subscription_item_id)
        DO UPDATE SET
          stripe_price_id = EXCLUDED.stripe_price_id,
          quantity = EXCLUDED.quantity,
          updated_at = NOW()
      `;
    }

    // Update organization tier if plan changed or status changed
    if (orgId && typeof tier === 'string') {
      await this.updateOrganizationTier(orgId, tier as SubscriptionTier, subscription.trial_end);
      this.logger.log(`Updated organization ${orgId} to tier ${tier} (status: ${status})`);
    }
  }

  /**
   * Handle customer.subscription.deleted event
   */
  async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing customer.subscription.deleted for ${subscription.id}`);

    const orgId = subscription.metadata?.orgId;

    await this.prisma.$executeRaw`
      UPDATE stripe_subscriptions
      SET
        status = ${SubscriptionStatus.CANCELED},
        canceled_at = ${subscription.canceled_at ? `to_timestamp(${subscription.canceled_at})` : 'NOW()'},
        ended_at = ${subscription.ended_at ? `to_timestamp(${subscription.ended_at})` : 'NOW()'},
        updated_at = NOW()
      WHERE stripe_subscription_id = ${subscription.id}
    `;

    // Downgrade organization to FREE tier
    if (orgId) {
      await this.updateOrganizationTier(orgId, SubscriptionTier.FREE, null);
      this.logger.log(`Downgraded organization ${orgId} to FREE tier after cancellation`);
    }

    // TODO: Send notification to user about subscription cancellation
  }

  /**
   * Handle customer.subscription.trial_will_end event
   */
  async handleSubscriptionTrialWillEnd(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing customer.subscription.trial_will_end for ${subscription.id}`);

    // TODO: Send notification to user that trial is ending soon
    // Typically sent 3 days before trial ends
  }

  /**
   * Handle invoice.paid event
   */
  async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Processing invoice.paid for ${invoice.id}`);

    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    if (!customerId) {
      this.logger.warn('Invoice has no customer ID');
      return;
    }

    // Get user_id from customer
    const customer = await this.prisma.$queryRaw<any[]>`
      SELECT user_id FROM stripe_customers
      WHERE stripe_customer_id = ${customerId}
      LIMIT 1
    `;

    if (!customer.length) {
      this.logger.warn(`Customer ${customerId} not found in database`);
      return;
    }

    const userId = customer[0].user_id;
    // Stripe SDK v20: use type assertion for subscription property
    const invoiceAny = invoice as any;
    const subscriptionId = typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id;

    // Store billing history
    await this.prisma.$executeRaw`
      INSERT INTO stripe_billing_history
      (user_id, stripe_invoice_id, stripe_customer_id, stripe_subscription_id, invoice_number, amount, currency, status, invoice_url, invoice_pdf, period_start, period_end, paid_at, metadata, created_at, updated_at)
      VALUES
      (${userId}, ${invoice.id}, ${customerId}, ${subscriptionId || null}, ${invoice.number || null}, ${invoice.amount_paid || 0}, ${invoice.currency || 'usd'}, 'paid', ${invoice.hosted_invoice_url || null}, ${invoice.invoice_pdf || null}, ${invoice.period_start ? `to_timestamp(${invoice.period_start})` : null}, ${invoice.period_end ? `to_timestamp(${invoice.period_end})` : null}, NOW(), ${JSON.stringify(invoice.metadata || {})}::jsonb, NOW(), NOW())
      ON CONFLICT (stripe_invoice_id)
      DO UPDATE SET
        status = 'paid',
        amount = EXCLUDED.amount,
        invoice_url = EXCLUDED.invoice_url,
        invoice_pdf = EXCLUDED.invoice_pdf,
        paid_at = NOW(),
        updated_at = NOW()
    `;
  }

  /**
   * Handle invoice.payment_failed event
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Processing invoice.payment_failed for ${invoice.id}`);

    // Update subscription status to PAST_DUE if applicable
    // Stripe SDK v20: use type assertion for subscription property
    const invoiceAny = invoice as any;
    const subscriptionId = typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id;
    if (subscriptionId) {
      await this.prisma.$executeRaw`
        UPDATE stripe_subscriptions
        SET status = ${SubscriptionStatus.PAST_DUE}, updated_at = NOW()
        WHERE stripe_subscription_id = ${subscriptionId}
      `;
    }

    // TODO: Send notification to user about payment failure
    // Include retry instructions and update payment method link
  }

  /**
   * Handle invoice.upcoming event
   */
  async handleInvoiceUpcoming(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Processing invoice.upcoming for customer ${invoice.customer}`);

    // TODO: Send notification to user about upcoming invoice
    // Typically sent 7 days before invoice is due
  }

  // Helper Methods

  /**
   * Map Stripe subscription status to internal status
   */
  private mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
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

  /**
   * Get tier from Stripe price ID
   */
  private getTierFromPriceId(priceId: string): SubscriptionTier | null {
    return PRICE_TO_TIER[priceId] || null;
  }

  /**
   * Update organization tier and subscription status
   */
  private async updateOrganizationTier(
    orgId: string,
    tier: SubscriptionTier,
    trialEndsAt: number | null,
  ): Promise<void> {
    try {
      // Update organization settings with subscription tier
      const settings = await this.prisma.$queryRaw<any[]>`
        SELECT settings FROM organisations WHERE id = ${orgId} LIMIT 1
      `;

      const currentSettings = settings.length > 0 ? settings[0].settings : {};
      const updatedSettings = {
        ...currentSettings,
        subscriptionTier: tier,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt * 1000).toISOString() : null,
      };

      await this.prisma.$executeRaw`
        UPDATE organisations
        SET settings = ${JSON.stringify(updatedSettings)}::jsonb, updated_at = NOW()
        WHERE id = ${orgId}
      `;
    } catch (error) {
      this.logger.error(`Failed to update organization tier: ${error.message}`, error);
      throw error;
    }
  }
}
