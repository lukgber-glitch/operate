import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { StripePaymentsService } from './services/stripe-payments.service';
import { StripeBillingService } from './services/stripe-billing.service';
import { StripeProductsService } from './services/stripe-products.service';
import { StripePortalService } from './services/stripe-portal.service';
import { StripeController } from './stripe.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { DatabaseModule } from '../../database/database.module';
import stripeConfig from './stripe.config';

/**
 * Stripe Integration Module
 * Provides comprehensive Stripe payment processing and billing capabilities
 *
 * Features:
 * - Stripe Connect account creation and management
 * - OAuth Connect flow for platform accounts
 * - Express and Standard account types
 * - Account onboarding and status tracking
 * - Payment Intent creation with platform fees
 * - Split payments (platform fee + connected account)
 * - Transfer creation to connected accounts
 * - Refund handling with optional transfer reversal
 * - Subscription management (Free, Pro, Enterprise tiers)
 * - Customer portal for self-service subscription management
 * - Product and pricing catalog management
 * - Trial period support (14-day default)
 * - Proration handling for mid-cycle changes
 * - Billing history and invoice management
 * - Multi-currency support (USD, EUR, GBP, CHF, etc.)
 * - Webhook handling for real-time updates
 * - Comprehensive audit logging
 *
 * Security:
 * - Stripe secret keys stored in environment variables
 * - Webhook signature verification mandatory
 * - Idempotency keys for all payment operations
 * - Full audit logging for all transactions
 * - Rate limiting on all endpoints (via global throttler)
 * - AES-256-GCM encryption for sensitive data
 *
 * Webhook Events:
 * - account.updated - Connect account status changes
 * - payment_intent.succeeded/failed - Payment status updates
 * - charge.succeeded/failed/refunded - Charge updates
 * - transfer.created/failed/reversed - Transfer updates
 * - payout.created/paid/failed/canceled - Payout updates
 * - customer.subscription.created/updated/deleted - Subscription lifecycle
 * - customer.subscription.trial_will_end - Trial ending notification
 * - invoice.paid/payment_failed/upcoming - Invoice events
 *
 * Environment Variables:
 * - STRIPE_SECRET_KEY (required) - Stripe secret API key
 * - STRIPE_PUBLISHABLE_KEY (required) - Stripe publishable key
 * - STRIPE_WEBHOOK_SECRET (required) - Stripe webhook signing secret
 * - STRIPE_SANDBOX (optional) - Set to 'false' for production mode
 * - STRIPE_PLATFORM_FEE_PERCENT (optional) - Platform fee percentage (default: 2.5)
 *
 * @see https://stripe.com/docs/connect
 * @see https://stripe.com/docs/billing
 * @see https://stripe.com/docs/api
 */
@Module({
  imports: [ConfigModule.forFeature(stripeConfig), DatabaseModule],
  controllers: [StripeController, StripeWebhookController],
  providers: [
    StripeService,
    StripeConnectService,
    StripePaymentsService,
    StripeBillingService,
    StripeProductsService,
    StripePortalService,
  ],
  exports: [
    StripeService,
    StripeConnectService,
    StripePaymentsService,
    StripeBillingService,
    StripeProductsService,
    StripePortalService,
  ],
})
export class StripeModule {}
