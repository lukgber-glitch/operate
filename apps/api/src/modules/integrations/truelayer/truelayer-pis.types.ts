/**
 * TrueLayer Payment Initiation Service (PIS) Types
 * Enables secure payment initiation via Open Banking
 *
 * @see https://docs.truelayer.com/docs/single-immediate-payments
 */

/**
 * Payment Initiation Request
 */
export interface CreatePaymentRequest {
  userId: string;
  orgId: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  beneficiaryIban?: string;
  beneficiarySortCode?: string;
  beneficiaryAccountNumber?: string;
  reference?: string;
  description?: string;
  redirectUri?: string;

  // Link to source entity
  sourceType?: PaymentSourceType;
  billId?: string;
  expenseId?: string;
  invoiceId?: string;

  // Security context
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Payment Initiation Response
 */
export interface CreatePaymentResponse {
  paymentId: string;
  truelayerPaymentId: string;
  authorizationUri: string;
  status: PaymentInitiationStatus;
  expiresAt: Date;
}

/**
 * Payment Status Response
 */
export interface PaymentStatusResponse {
  paymentId: string;
  truelayerPaymentId: string;
  status: PaymentInitiationStatus;
  amount: number;
  currency: string;
  beneficiaryName: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
  authorizedAt?: Date;
  executedAt?: Date;
  settledAt?: Date;
  failureReason?: string;
}

/**
 * Payment Initiation Status (from Prisma)
 */
export enum PaymentInitiationStatus {
  PENDING = 'PENDING',
  AUTHORIZATION_REQUIRED = 'AUTHORIZATION_REQUIRED',
  AUTHORIZING = 'AUTHORIZING',
  AUTHORIZED = 'AUTHORIZED',
  EXECUTED = 'EXECUTED',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Payment Source Type (from Prisma)
 */
export enum PaymentSourceType {
  BILL = 'BILL',
  EXPENSE = 'EXPENSE',
  INVOICE = 'INVOICE',
  TAX = 'TAX',
  MANUAL = 'MANUAL',
}

/**
 * TrueLayer Payment Initiation API Request
 * This is the format TrueLayer expects
 */
export interface TrueLayerPaymentRequest {
  amount_in_minor: number; // Amount in smallest currency unit (e.g., cents)
  currency: string;
  payment_method: {
    type: string; // 'bank_transfer'
    provider_selection: {
      type: string; // 'user_selected' or 'preselected'
      filter?: {
        countries?: string[];
        release_channel?: string;
        customer_segments?: string[];
      };
    };
    beneficiary: {
      type: string; // 'merchant_account' or 'external_account'
      name: string;
      account_holder_name?: string;
      account_identifier?: {
        type: string; // 'iban' or 'sort_code_account_number'
        iban?: string;
        sort_code?: string;
        account_number?: string;
      };
    };
  };
  user: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * TrueLayer Payment Initiation API Response
 */
export interface TrueLayerPaymentResponse {
  id: string;
  resource_token: string;
  user: {
    id: string;
  };
  status: TrueLayerPaymentStatus;
  created_at: string;
  authorization_flow?: {
    actions?: {
      next: {
        type: string;
        uri: string;
      };
    };
  };
}

/**
 * TrueLayer Payment Status
 */
export enum TrueLayerPaymentStatus {
  AUTHORIZATION_REQUIRED = 'authorization_required',
  AUTHORIZING = 'authorizing',
  AUTHORIZED = 'authorized',
  EXECUTED = 'executed',
  SETTLED = 'settled',
  FAILED = 'failed',
}

/**
 * TrueLayer Payment Details Response
 */
export interface TrueLayerPaymentDetailsResponse {
  id: string;
  status: TrueLayerPaymentStatus;
  amount_in_minor: number;
  currency: string;
  payment_method: {
    type: string;
    provider_selection: any;
    beneficiary: any;
  };
  user: {
    id: string;
  };
  created_at: string;
  executed_at?: string;
  settled_at?: string;
  failure_stage?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

/**
 * List Payments Request
 */
export interface ListPaymentsRequest {
  userId: string;
  orgId: string;
  status?: PaymentInitiationStatus;
  sourceType?: PaymentSourceType;
  limit?: number;
  offset?: number;
}

/**
 * List Payments Response
 */
export interface ListPaymentsResponse {
  payments: PaymentStatusResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Cancel Payment Request
 */
export interface CancelPaymentRequest {
  paymentId: string;
  userId: string;
  orgId: string;
  reason?: string;
}

/**
 * Payment Webhook Event
 */
export interface PaymentWebhookEvent {
  type: string; // 'payment.executed', 'payment.settled', 'payment.failed'
  event_id: string;
  event_timestamp: string;
  payment_id: string;
  payment_status: TrueLayerPaymentStatus;
  metadata?: Record<string, any>;
}

/**
 * TrueLayer PIS Scopes
 */
export enum TrueLayerPISScope {
  PAYMENTS = 'payments',
}

/**
 * TrueLayer PIS Endpoints
 */
export const TRUELAYER_PIS_ENDPOINTS = {
  CREATE_PAYMENT: '/payments',
  GET_PAYMENT: '/payments/:id',
  GET_PAYMENT_BY_ID: (id: string) => `/payments/${id}`,
} as const;

/**
 * Payment amount limits (in minor units)
 * These are configurable per jurisdiction
 */
export const PAYMENT_LIMITS = {
  MIN_AMOUNT_MINOR: 1, // 1 cent/penny
  MAX_AMOUNT_MINOR: 100000000, // 1,000,000 EUR/GBP
} as const;

/**
 * Payment authorization timeout (in minutes)
 */
export const PAYMENT_AUTH_TIMEOUT_MINUTES = 10;
