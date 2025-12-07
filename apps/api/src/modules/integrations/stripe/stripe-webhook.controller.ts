import {
  Controller,
  Post,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { PrismaService } from '../../database/prisma.service';
import {
  STRIPE_WEBHOOK_EVENTS,
  STRIPE_BILLING_WEBHOOK_EVENTS,
  StripeAccountStatus,
  StripePaymentStatus
} from './stripe.types';
import { StripeBillingWebhookHandlers } from './stripe-webhook-billing-handlers';
import Stripe from 'stripe';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * Stripe Webhook Controller
 * Handles incoming webhook events from Stripe
 *
 * Supported Events:
 *
 * Connect Events:
 * - account.updated - Connect account status changes
 * - account.application.authorized - OAuth Connect authorized
 * - account.application.deauthorized - OAuth Connect deauthorized
 *
 * Payment Events:
 * - payment_intent.succeeded - Payment completed successfully
 * - payment_intent.payment_failed - Payment failed
 * - payment_intent.canceled - Payment canceled
 * - charge.succeeded - Charge completed
 * - charge.failed - Charge failed
 * - charge.refunded - Charge refunded
 *
 * Transfer Events:
 * - transfer.created - Transfer created to connected account
 * - transfer.failed - Transfer failed
 * - transfer.reversed - Transfer reversed
 *
 * Payout Events:
 * - payout.created - Payout initiated
 * - payout.paid - Payout completed
 * - payout.failed - Payout failed
 * - payout.canceled - Payout canceled
 *
 * Subscription Events:
 * - customer.subscription.created - New subscription created
 * - customer.subscription.updated - Subscription plan/status changed
 * - customer.subscription.deleted - Subscription canceled
 * - customer.subscription.trial_will_end - Trial ending soon (3 days)
 *
 * Invoice Events:
 * - invoice.paid - Invoice payment succeeded
 * - invoice.payment_failed - Invoice payment failed
 * - invoice.upcoming - Upcoming invoice notification
 *
 * Security:
 * - All webhooks are verified using Stripe signature
 * - Raw body is required for signature verification
 * - Events are idempotent and safe to retry
 * - Webhook signature secret from STRIPE_WEBHOOK_SECRET env var
 */
@Controller('integrations/stripe/webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly billingHandlers: StripeBillingWebhookHandlers;

  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeConnectService: StripeConnectService,
    private readonly prisma: PrismaService,
  ) {
    this.billingHandlers = new StripeBillingWebhookHandlers(this.prisma);
  }

  /**
   * Handle Stripe webhook events
   * Requires raw body for signature verification
   */
  @Public()
  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Get raw body (required for signature verification)
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body for signature verification');
    }

    try {
      // Verify webhook signature and construct event
      const event = this.stripeService.verifyWebhookSignature(
        rawBody,
        signature,
      );

      this.logger.log(
        `Received webhook event: ${event.type} (ID: ${event.id})`,
      );

      // Check if event already processed (idempotency)
      const alreadyProcessed = await this.isEventProcessed(event.id);
      if (alreadyProcessed) {
        this.logger.log(`Event ${event.id} already processed, skipping`);
        return { received: true };
      }

      // Process event based on type
      await this.processEvent(event);

      // Log successful webhook processing
      await this.logWebhookEvent(event, 'SUCCESS');

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook processing failed', error);
      await this.logWebhookEvent(
        { id: 'unknown', type: 'unknown' } as any,
        'FAILED',
        error.message,
      );
      throw new BadRequestException('Webhook processing failed');
    }
  }

  /**
   * Process webhook event based on type
   */
  private async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      // Connect Account Events
      case STRIPE_WEBHOOK_EVENTS.ACCOUNT_UPDATED:
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case STRIPE_WEBHOOK_EVENTS.ACCOUNT_APPLICATION_AUTHORIZED:
        await this.handleAccountAuthorized(event.data.object as any);
        break;

      case STRIPE_WEBHOOK_EVENTS.ACCOUNT_APPLICATION_DEAUTHORIZED:
        await this.handleAccountDeauthorized(event.data.object as any);
        break;

      // Payment Intent Events
      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_FAILED:
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_CANCELED:
        await this.handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      // Charge Events
      case STRIPE_WEBHOOK_EVENTS.CHARGE_SUCCEEDED:
        await this.handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case STRIPE_WEBHOOK_EVENTS.CHARGE_FAILED:
        await this.handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case STRIPE_WEBHOOK_EVENTS.CHARGE_REFUNDED:
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      // Transfer Events
      case STRIPE_WEBHOOK_EVENTS.TRANSFER_CREATED:
        await this.handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case STRIPE_WEBHOOK_EVENTS.TRANSFER_FAILED:
        await this.handleTransferFailed(event.data.object as Stripe.Transfer);
        break;

      case STRIPE_WEBHOOK_EVENTS.TRANSFER_REVERSED:
        await this.handleTransferReversed(event.data.object as Stripe.Transfer);
        break;

      // Payout Events
      case STRIPE_WEBHOOK_EVENTS.PAYOUT_CREATED:
        await this.handlePayoutCreated(event.data.object as Stripe.Payout);
        break;

      case STRIPE_WEBHOOK_EVENTS.PAYOUT_PAID:
        await this.handlePayoutPaid(event.data.object as Stripe.Payout);
        break;

      case STRIPE_WEBHOOK_EVENTS.PAYOUT_FAILED:
        await this.handlePayoutFailed(event.data.object as Stripe.Payout);
        break;

      case STRIPE_WEBHOOK_EVENTS.PAYOUT_CANCELED:
        await this.handlePayoutCanceled(event.data.object as Stripe.Payout);
        break;

      // Subscription Events
      case STRIPE_BILLING_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
        await this.billingHandlers.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case STRIPE_BILLING_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
        await this.billingHandlers.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case STRIPE_BILLING_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
        await this.billingHandlers.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case STRIPE_BILLING_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END:
        await this.billingHandlers.handleSubscriptionTrialWillEnd(
          event.data.object as Stripe.Subscription,
        );
        break;

      // Invoice Events
      case STRIPE_BILLING_WEBHOOK_EVENTS.INVOICE_PAID:
        await this.billingHandlers.handleInvoicePaid(
          event.data.object as Stripe.Invoice,
        );
        break;

      case STRIPE_BILLING_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await this.billingHandlers.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      case STRIPE_BILLING_WEBHOOK_EVENTS.INVOICE_UPCOMING:
        await this.billingHandlers.handleInvoiceUpcoming(
          event.data.object as Stripe.Invoice,
        );
        break;

      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
    }
  }

  // Connect Account Event Handlers

  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    this.logger.log(`Processing account.updated for ${account.id}`);

    const status = this.getAccountStatus(account);

    await this.prisma.$executeRaw`
      UPDATE stripe_connect_accounts
      SET
        status = ${status},
        charges_enabled = ${account.charges_enabled},
        payouts_enabled = ${account.payouts_enabled},
        details_submitted = ${account.details_submitted},
        capabilities = ${JSON.stringify(account.capabilities)}::jsonb,
        updated_at = NOW()
      WHERE stripe_account_id = ${account.id}
    `;
  }

  private async handleAccountAuthorized(data: any): Promise<void> {
    this.logger.log(`Processing account.application.authorized`);
    // Handle OAuth Connect authorization
    // This can be used to track when merchants authorize the platform
  }

  private async handleAccountDeauthorized(data: any): Promise<void> {
    this.logger.log(`Processing account.application.deauthorized`);
    // Handle OAuth Connect deauthorization
    // Mark account as deauthorized in database
  }

  // Payment Intent Event Handlers

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Processing payment_intent.succeeded for ${paymentIntent.id}`);

    await this.prisma.$executeRaw`
      UPDATE stripe_payments
      SET status = ${StripePaymentStatus.SUCCEEDED}, updated_at = NOW()
      WHERE payment_intent_id = ${paymentIntent.id}
    `;
  }

  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Processing payment_intent.payment_failed for ${paymentIntent.id}`);

    await this.prisma.$executeRaw`
      UPDATE stripe_payments
      SET status = ${StripePaymentStatus.FAILED}, updated_at = NOW()
      WHERE payment_intent_id = ${paymentIntent.id}
    `;
  }

  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Processing payment_intent.canceled for ${paymentIntent.id}`);

    await this.prisma.$executeRaw`
      UPDATE stripe_payments
      SET status = ${StripePaymentStatus.CANCELED}, updated_at = NOW()
      WHERE payment_intent_id = ${paymentIntent.id}
    `;
  }

  // Charge Event Handlers

  private async handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
    this.logger.log(`Processing charge.succeeded for ${charge.id}`);
    // Additional processing for successful charges if needed
  }

  private async handleChargeFailed(charge: Stripe.Charge): Promise<void> {
    this.logger.log(`Processing charge.failed for ${charge.id}`);
    // Handle failed charges - send notifications, update status, etc.
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    this.logger.log(`Processing charge.refunded for ${charge.id}`);

    const paymentIntentId = charge.payment_intent as string;
    if (paymentIntentId) {
      const status = charge.amount_refunded === charge.amount
        ? StripePaymentStatus.REFUNDED
        : StripePaymentStatus.PARTIALLY_REFUNDED;

      await this.prisma.$executeRaw`
        UPDATE stripe_payments
        SET status = ${status}, updated_at = NOW()
        WHERE payment_intent_id = ${paymentIntentId}
      `;
    }
  }

  // Transfer Event Handlers

  private async handleTransferCreated(transfer: Stripe.Transfer): Promise<void> {
    this.logger.log(`Processing transfer.created for ${transfer.id}`);
    // Log transfer creation
  }

  private async handleTransferFailed(transfer: Stripe.Transfer): Promise<void> {
    this.logger.log(`Processing transfer.failed for ${transfer.id}`);
    // Handle failed transfers - notify users, retry logic, etc.
  }

  private async handleTransferReversed(transfer: Stripe.Transfer): Promise<void> {
    this.logger.log(`Processing transfer.reversed for ${transfer.id}`);
    // Handle reversed transfers
  }

  // Payout Event Handlers

  private async handlePayoutCreated(payout: Stripe.Payout): Promise<void> {
    this.logger.log(`Processing payout.created for ${payout.id}`);
    // Log payout initiation
  }

  private async handlePayoutPaid(payout: Stripe.Payout): Promise<void> {
    this.logger.log(`Processing payout.paid for ${payout.id}`);
    // Notify connected account that payout was successful
  }

  private async handlePayoutFailed(payout: Stripe.Payout): Promise<void> {
    this.logger.log(`Processing payout.failed for ${payout.id}`);
    // Handle failed payouts - notify connected account
  }

  private async handlePayoutCanceled(payout: Stripe.Payout): Promise<void> {
    this.logger.log(`Processing payout.canceled for ${payout.id}`);
    // Handle canceled payouts
  }

  // Helper Methods

  private getAccountStatus(account: Stripe.Account): StripeAccountStatus {
    if (!account.charges_enabled && !account.payouts_enabled) {
      if (account.details_submitted) {
        return StripeAccountStatus.RESTRICTED;
      }
      return StripeAccountStatus.PENDING;
    }
    return StripeAccountStatus.ACTIVE;
  }

  /**
   * Check if webhook event has already been processed (idempotency)
   */
  private async isEventProcessed(eventId: string): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM stripe_webhook_logs
        WHERE event_id = ${eventId} AND status = 'SUCCESS'
        LIMIT 1
      `;
      return result.length > 0;
    } catch (error) {
      this.logger.error('Failed to check event idempotency', error);
      return false; // Proceed with processing if check fails
    }
  }

  /**
   * Log webhook event processing result
   */
  private async logWebhookEvent(
    event: Stripe.Event,
    status: 'SUCCESS' | 'FAILED',
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO stripe_webhook_logs
        (event_id, event_type, status, error_message, created_at)
        VALUES
        (${event.id}, ${event.type}, ${status}, ${errorMessage || null}, NOW())
        ON CONFLICT (event_id) DO UPDATE SET
          status = EXCLUDED.status,
          error_message = EXCLUDED.error_message
      `;
    } catch (error) {
      this.logger.error('Failed to log webhook event', error);
    }
  }
}
