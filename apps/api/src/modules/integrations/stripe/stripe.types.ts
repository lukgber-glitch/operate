import Stripe from 'stripe';

/**
 * Stripe Connect Configuration
 */
export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  environment: StripeEnvironment;
  apiVersion: string;
  connectEnabled: boolean;
  platformFeePercent: number;
}

export enum StripeEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

/**
 * Stripe Connect Account Types
 */
export enum StripeAccountType {
  EXPRESS = 'express',
  STANDARD = 'standard',
}

/**
 * Stripe Connect Account Status
 */
export enum StripeAccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  RESTRICTED = 'RESTRICTED',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED',
}

/**
 * Stripe Payment Status
 */
export enum StripePaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

/**
 * Stripe Connect Account Creation Request
 */
export interface CreateConnectAccountRequest {
  userId: string;
  type: StripeAccountType;
  email: string;
  country: string;
  businessProfile?: {
    name?: string;
    productDescription?: string;
    supportEmail?: string;
    url?: string;
  };
  metadata?: Record<string, string>;
}

/**
 * Stripe Connect Account Response
 */
export interface ConnectAccountResponse {
  accountId: string;
  type: StripeAccountType;
  status: StripeAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  email: string;
  country: string;
  defaultCurrency: string;
  capabilities?: Stripe.Account.Capabilities;
  metadata?: Record<string, string>;
}

/**
 * Stripe Connect Onboarding Link Request
 */
export interface CreateOnboardingLinkRequest {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

/**
 * Stripe Connect Onboarding Link Response
 */
export interface OnboardingLinkResponse {
  url: string;
  expiresAt: number;
}

/**
 * Stripe Payment Intent Request
 */
export interface CreatePaymentIntentRequest {
  userId: string;
  amount: number;
  currency: string;
  connectedAccountId?: string;
  platformFeeAmount?: number;
  platformFeePercent?: number;
  description?: string;
  metadata?: Record<string, string>;
  captureMethod?: 'automatic' | 'manual';
  confirmationMethod?: 'automatic' | 'manual';
  paymentMethodTypes?: string[];
}

/**
 * Stripe Payment Intent Response
 */
export interface PaymentIntentResponse {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  connectedAccountId?: string;
  platformFee?: number;
  metadata?: Record<string, string>;
}

/**
 * Stripe Transfer Request
 */
export interface CreateTransferRequest {
  userId: string;
  amount: number;
  currency: string;
  destinationAccountId: string;
  description?: string;
  metadata?: Record<string, string>;
  sourceTransaction?: string;
}

/**
 * Stripe Transfer Response
 */
export interface TransferResponse {
  id: string;
  amount: number;
  currency: string;
  destination: string;
  status: string;
  created: number;
  metadata?: Record<string, string>;
}

/**
 * Stripe Refund Request
 */
export interface CreateRefundRequest {
  userId: string;
  paymentIntentId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
  reverseTransfer?: boolean;
  refundApplicationFee?: boolean;
}

/**
 * Stripe Refund Response
 */
export interface RefundResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentIntentId: string;
  created: number;
  metadata?: Record<string, string>;
}

/**
 * Stripe Payout Configuration
 */
export interface PayoutConfiguration {
  accountId: string;
  schedule: {
    interval: 'manual' | 'daily' | 'weekly' | 'monthly';
    weeklyAnchor?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
    monthlyAnchor?: number;
    delayDays?: number;
  };
}

/**
 * Stripe Webhook Event Types
 */
export const STRIPE_WEBHOOK_EVENTS = {
  ACCOUNT_UPDATED: 'account.updated',
  ACCOUNT_APPLICATION_AUTHORIZED: 'account.application.authorized',
  ACCOUNT_APPLICATION_DEAUTHORIZED: 'account.application.deauthorized',
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED: 'payment_intent.canceled',
  CHARGE_SUCCEEDED: 'charge.succeeded',
  CHARGE_FAILED: 'charge.failed',
  CHARGE_REFUNDED: 'charge.refunded',
  TRANSFER_CREATED: 'transfer.created',
  TRANSFER_FAILED: 'transfer.failed',
  TRANSFER_REVERSED: 'transfer.reversed',
  PAYOUT_CREATED: 'payout.created',
  PAYOUT_PAID: 'payout.paid',
  PAYOUT_FAILED: 'payout.failed',
  PAYOUT_CANCELED: 'payout.canceled',
} as const;

/**
 * Supported Currencies for Multi-Currency Payments
 */
export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CHF',
  'AUD',
  'CAD',
  'JPY',
  'CNY',
  'INR',
  'SGD',
  'HKD',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Stripe Connect Capabilities
 */
export const STRIPE_CAPABILITIES = {
  CARD_PAYMENTS: 'card_payments',
  TRANSFERS: 'transfers',
  PLATFORM_PAYMENTS: 'platform_payments',
} as const;

/**
 * Default platform fee percentage (2.5%)
 */
export const DEFAULT_PLATFORM_FEE_PERCENT = 2.5;

/**
 * Stripe Billing Webhook Event Types
 */
export const STRIPE_BILLING_WEBHOOK_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END: 'customer.subscription.trial_will_end',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_UPCOMING: 'invoice.upcoming',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_FINALIZED: 'invoice.finalized',
} as const;

/**
 * All Stripe Webhook Events (Connect + Billing)
 */
export const ALL_STRIPE_WEBHOOK_EVENTS = {
  ...STRIPE_WEBHOOK_EVENTS,
  ...STRIPE_BILLING_WEBHOOK_EVENTS,
} as const;
