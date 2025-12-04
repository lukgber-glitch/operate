import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionStatus } from './dto/subscription.dto';
import Stripe from 'stripe';

/**
 * Stripe Billing Webhook Handlers
 * Separate handlers for subscription and invoice webhook events
 *
 * Add these methods to StripeWebhookController and call them from processEvent()
 */

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

    // Store subscription
    await this.prisma.$executeRaw`
      INSERT INTO stripe_subscriptions
      (user_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end, trial_start, trial_end, cancel_at_period_end, metadata, created_at, updated_at)
      VALUES
      (${userId}, ${subscription.id}, ${customerId}, ${status}, to_timestamp(${subscription.current_period_start}), to_timestamp(${subscription.current_period_end}), ${subscription.trial_start ? `to_timestamp(${subscription.trial_start})` : null}, ${subscription.trial_end ? `to_timestamp(${subscription.trial_end})` : null}, ${subscription.cancel_at_period_end}, ${JSON.stringify(subscription.metadata)}::jsonb, NOW(), NOW())
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
  }

  /**
   * Handle customer.subscription.updated event
   */
  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing customer.subscription.updated for ${subscription.id}`);

    const status = this.mapSubscriptionStatus(subscription.status);

    await this.prisma.$executeRaw`
      UPDATE stripe_subscriptions
      SET
        status = ${status},
        current_period_start = to_timestamp(${subscription.current_period_start}),
        current_period_end = to_timestamp(${subscription.current_period_end}),
        trial_start = ${subscription.trial_start ? `to_timestamp(${subscription.trial_start})` : null},
        trial_end = ${subscription.trial_end ? `to_timestamp(${subscription.trial_end})` : null},
        cancel_at_period_end = ${subscription.cancel_at_period_end},
        canceled_at = ${subscription.canceled_at ? `to_timestamp(${subscription.canceled_at})` : null},
        ended_at = ${subscription.ended_at ? `to_timestamp(${subscription.ended_at})` : null},
        metadata = ${JSON.stringify(subscription.metadata)}::jsonb,
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
  }

  /**
   * Handle customer.subscription.deleted event
   */
  async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing customer.subscription.deleted for ${subscription.id}`);

    await this.prisma.$executeRaw`
      UPDATE stripe_subscriptions
      SET
        status = ${SubscriptionStatus.CANCELED},
        canceled_at = ${subscription.canceled_at ? `to_timestamp(${subscription.canceled_at})` : 'NOW()'},
        ended_at = ${subscription.ended_at ? `to_timestamp(${subscription.ended_at})` : 'NOW()'},
        updated_at = NOW()
      WHERE stripe_subscription_id = ${subscription.id}
    `;

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

    const customerId = invoice.customer as string;

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

    // Store billing history
    await this.prisma.$executeRaw`
      INSERT INTO stripe_billing_history
      (user_id, stripe_invoice_id, stripe_customer_id, stripe_subscription_id, invoice_number, amount, currency, status, invoice_url, invoice_pdf, period_start, period_end, paid_at, metadata, created_at, updated_at)
      VALUES
      (${userId}, ${invoice.id}, ${customerId}, ${invoice.subscription as string || null}, ${invoice.number || null}, ${invoice.amount_paid}, ${invoice.currency}, 'paid', ${invoice.hosted_invoice_url || null}, ${invoice.invoice_pdf || null}, ${invoice.period_start ? `to_timestamp(${invoice.period_start})` : null}, ${invoice.period_end ? `to_timestamp(${invoice.period_end})` : null}, NOW(), ${JSON.stringify(invoice.metadata)}::jsonb, NOW(), NOW())
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
    if (invoice.subscription) {
      await this.prisma.$executeRaw`
        UPDATE stripe_subscriptions
        SET status = ${SubscriptionStatus.PAST_DUE}, updated_at = NOW()
        WHERE stripe_subscription_id = ${invoice.subscription as string}
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
}

/**
 * INSTRUCTIONS FOR INTEGRATION:
 *
 * 1. Add these case statements to the processEvent() switch statement in stripe-webhook.controller.ts:
 *
 *    // Subscription Events
 *    case 'customer.subscription.created':
 *      await this.billingHandlers.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
 *      break;
 *
 *    case 'customer.subscription.updated':
 *      await this.billingHandlers.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
 *      break;
 *
 *    case 'customer.subscription.deleted':
 *      await this.billingHandlers.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
 *      break;
 *
 *    case 'customer.subscription.trial_will_end':
 *      await this.billingHandlers.handleSubscriptionTrialWillEnd(event.data.object as Stripe.Subscription);
 *      break;
 *
 *    // Invoice Events
 *    case 'invoice.paid':
 *      await this.billingHandlers.handleInvoicePaid(event.data.object as Stripe.Invoice);
 *      break;
 *
 *    case 'invoice.payment_failed':
 *      await this.billingHandlers.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
 *      break;
 *
 *    case 'invoice.upcoming':
 *      await this.billingHandlers.handleInvoiceUpcoming(event.data.object as Stripe.Invoice);
 *      break;
 *
 * 2. Add to StripeWebhookController constructor:
 *
 *    private readonly billingHandlers: StripeBillingWebhookHandlers;
 *
 *    constructor(
 *      private readonly stripeService: StripeService,
 *      private readonly stripeConnectService: StripeConnectService,
 *      private readonly prisma: PrismaService,
 *    ) {
 *      this.billingHandlers = new StripeBillingWebhookHandlers(this.prisma);
 *    }
 *
 * 3. Add import at the top:
 *
 *    import { StripeBillingWebhookHandlers } from './stripe-webhook-billing-handlers';
 *    import { SubscriptionStatus } from './dto/subscription.dto';
 */
