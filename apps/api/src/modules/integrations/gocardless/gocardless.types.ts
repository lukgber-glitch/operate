import { GoCardlessClient } from 'gocardless-nodejs';

/**
 * GoCardless Configuration
 */
export interface GoCardlessConfig {
  accessToken: string;
  environment: 'sandbox' | 'live';
  webhookSecret: string;
  webhookUrl: string;
  redirectUri: string;
  mockMode: boolean;
}

/**
 * GoCardless OAuth Response
 */
export interface GoCardlessOAuthResponse {
  access_token: string;
  token_type: string;
  scope: string;
  organisation_id: string;
}

/**
 * GoCardless Mandate Schemes
 */
export enum GoCardlessMandateScheme {
  BACS = 'bacs',
  SEPA_CORE = 'sepa_core',
  SEPA_COR1 = 'sepa_cor1',
  AUTOGIRO = 'autogiro',
  BETALINGSSERVICE = 'betalingsservice',
  PAD = 'pad',
}

/**
 * GoCardless Mandate Status
 */
export enum GoCardlessMandateStatus {
  PENDING_CUSTOMER_APPROVAL = 'pending_customer_approval',
  PENDING_SUBMISSION = 'pending_submission',
  SUBMITTED = 'submitted',
  ACTIVE = 'active',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * GoCardless Payment Status
 */
export enum GoCardlessPaymentStatus {
  PENDING_CUSTOMER_APPROVAL = 'pending_customer_approval',
  PENDING_SUBMISSION = 'pending_submission',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  PAID_OUT = 'paid_out',
  CANCELLED = 'cancelled',
  CUSTOMER_APPROVAL_DENIED = 'customer_approval_denied',
  FAILED = 'failed',
  CHARGED_BACK = 'charged_back',
}

/**
 * GoCardless Payout Status
 */
export enum GoCardlessPayoutStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

/**
 * GoCardless Redirect Flow Response
 */
export interface GoCardlessRedirectFlowResponse {
  id: string;
  description: string;
  session_token: string;
  scheme: string;
  success_redirect_url: string;
  redirect_url: string;
  created_at: string;
  links: {
    creditor: string;
  };
}

/**
 * GoCardless Customer Bank Account
 */
export interface GoCardlessCustomerBankAccount {
  id: string;
  account_holder_name: string;
  account_number_ending: string;
  bank_name: string;
  country_code: string;
  currency: string;
  enabled: boolean;
  created_at: string;
  links: {
    customer: string;
  };
}

/**
 * GoCardless Mandate
 */
export interface GoCardlessMandate {
  id: string;
  created_at: string;
  reference: string;
  scheme: string;
  status: GoCardlessMandateStatus;
  next_possible_charge_date: string;
  payments_require_approval: boolean;
  metadata: Record<string, string>;
  links: {
    customer_bank_account: string;
    creditor: string;
    customer: string;
  };
}

/**
 * GoCardless Payment
 */
export interface GoCardlessPayment {
  id: string;
  created_at: string;
  charge_date: string;
  amount: number;
  currency: string;
  status: GoCardlessPaymentStatus;
  reference: string;
  description: string;
  metadata: Record<string, string>;
  amount_refunded: number;
  fx?: {
    fx_currency: string;
    fx_exchange_rate: string;
    estimated_fx_amount: number;
  };
  links: {
    mandate: string;
    creditor: string;
  };
}

/**
 * GoCardless Subscription
 */
export interface GoCardlessSubscription {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: string;
  name: string;
  start_date: string;
  end_date: string | null;
  interval: number;
  interval_unit: 'weekly' | 'monthly' | 'yearly';
  day_of_month: number | null;
  month: string | null;
  payment_reference: string;
  metadata: Record<string, string>;
  upcoming_payments: Array<{
    charge_date: string;
    amount: number;
  }>;
  links: {
    mandate: string;
  };
}

/**
 * GoCardless Webhook Event
 */
export interface GoCardlessWebhookEvent {
  id: string;
  created_at: string;
  resource_type: string;
  action: string;
  links: {
    [key: string]: string;
  };
  details: {
    origin: string;
    cause: string;
    description: string;
    scheme?: string;
    reason_code?: string;
  };
  metadata: Record<string, string>;
}

/**
 * GoCardless Webhook Payload
 */
export interface GoCardlessWebhookPayload {
  events: GoCardlessWebhookEvent[];
}

/**
 * Create Mandate Request
 */
export interface CreateMandateRequest {
  customerId: string;
  scheme: GoCardlessMandateScheme;
  reference?: string;
  metadata?: Record<string, string>;
}

/**
 * Create Payment Request
 */
export interface CreatePaymentRequest {
  mandateId: string;
  amount: number;
  currency: string;
  chargeDate?: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, string>;
  appFee?: number;
}

/**
 * Create Subscription Request
 */
export interface CreateSubscriptionRequest {
  mandateId: string;
  amount: number;
  currency: string;
  name: string;
  intervalUnit: 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  dayOfMonth?: number;
  month?: string;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, string>;
}

/**
 * Create Redirect Flow Request
 */
export interface CreateRedirectFlowRequest {
  description: string;
  sessionToken: string;
  successRedirectUrl: string;
  scheme?: GoCardlessMandateScheme;
  prefilled_customer?: {
    given_name?: string;
    family_name?: string;
    email?: string;
    address_line1?: string;
    city?: string;
    postal_code?: string;
    country_code?: string;
  };
}

/**
 * Complete Redirect Flow Request
 */
export interface CompleteRedirectFlowRequest {
  redirectFlowId: string;
  sessionToken: string;
}

/**
 * GoCardless Client Type
 */
export type GoCardlessClientType = GoCardlessClient;
