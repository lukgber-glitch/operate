/**
 * Wise Business API Types and Interfaces
 * Comprehensive type definitions for Wise API integration
 *
 * @see https://api-docs.wise.com/
 */

/**
 * Wise Environment (Sandbox vs Production)
 */
export enum WiseEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

/**
 * Wise API Endpoints
 */
export const WISE_ENDPOINTS = {
  SANDBOX: {
    API: 'https://api.sandbox.transferwise.tech',
  },
  PRODUCTION: {
    API: 'https://api.transferwise.com',
  },
} as const;

/**
 * Wise Configuration
 */
export interface WiseConfig {
  apiToken: string;
  environment: WiseEnvironment;
  webhookSecret?: string;
  sandbox: boolean;
  profileId?: string; // Business profile ID
}

/**
 * Wise Profile Types
 */
export enum WiseProfileType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
}

/**
 * Wise Profile
 */
export interface WiseProfile {
  id: number;
  type: WiseProfileType;
  details: {
    firstName?: string;
    lastName?: string;
    name?: string; // Business name
    companyType?: string;
    companyRole?: string;
    registrationNumber?: string;
  };
}

/**
 * Wise Currency Codes (50+ supported currencies)
 */
export type WiseCurrency =
  | 'EUR'
  | 'USD'
  | 'GBP'
  | 'CHF'
  | 'AUD'
  | 'CAD'
  | 'JPY'
  | 'CNY'
  | 'HKD'
  | 'SGD'
  | 'INR'
  | 'BRL'
  | 'MXN'
  | 'ZAR'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'PLN'
  | 'CZK'
  | 'HUF'
  | 'RON'
  | 'BGN'
  | 'TRY'
  | 'ILS'
  | 'AED'
  | 'SAR'
  | 'NZD'
  | 'THB'
  | 'MYR'
  | 'IDR'
  | 'PHP'
  | 'KRW'
  | string; // Support for additional currencies

/**
 * Quote Type
 */
export enum WiseQuoteType {
  BALANCE_CONVERSION = 'BALANCE_CONVERSION',
  BALANCE_PAYOUT = 'BALANCE_PAYOUT',
  REGULAR = 'REGULAR',
}

/**
 * Wise Quote (Exchange Rate Quote)
 */
export interface WiseQuote {
  id: string;
  source: WiseCurrency;
  target: WiseCurrency;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  type: WiseQuoteType;
  createdTime: string;
  expirationTime: string;
  profile: number;
  rateType: 'FIXED' | 'FLOATING';
  deliveryEstimate?: string;
  fee: number;
  allowedProfileTypes: WiseProfileType[];
  guaranteedTargetAmount: boolean;
  ofSourceAmount: boolean;
}

/**
 * Quote Request
 */
export interface WiseQuoteRequest {
  sourceCurrency: WiseCurrency;
  targetCurrency: WiseCurrency;
  sourceAmount?: number;
  targetAmount?: number;
  profile: number;
  type?: WiseQuoteType;
}

/**
 * Recipient Account Type
 */
export enum WiseRecipientType {
  EMAIL = 'email',
  IBAN = 'iban',
  SORT_CODE = 'sort_code',
  ABA = 'aba',
  SWIFT_CODE = 'swift_code',
  BSB_CODE = 'bsb_code',
  INSTITUTION_NUMBER = 'institution_number',
  BANK_CODE = 'bank_code',
  IFSC = 'ifsc',
  CLABE = 'clabe',
}

/**
 * Recipient Account Details (varies by country)
 */
export interface WiseRecipientDetails {
  // Common fields
  currency: WiseCurrency;
  type: WiseRecipientType;
  accountHolderName: string;
  legalType: 'PRIVATE' | 'BUSINESS';

  // IBAN (SEPA - EU)
  iban?: string;

  // UK
  sortCode?: string;
  accountNumber?: string;

  // US (ACH/Wire)
  abartn?: string; // ABA routing number
  accountType?: 'CHECKING' | 'SAVINGS';
  routingNumber?: string;

  // Australia
  bsbCode?: string;

  // Canada
  institutionNumber?: string;
  transitNumber?: string;

  // India
  ifscCode?: string;

  // Mexico
  clabe?: string;

  // SWIFT (International)
  swiftCode?: string;
  BIC?: string;

  // Address (required for some countries)
  address?: {
    country: string;
    city: string;
    postCode: string;
    firstLine: string;
    state?: string;
  };

  // Email (for Wise-to-Wise transfers)
  email?: string;
}

/**
 * Recipient (Beneficiary)
 */
export interface WiseRecipient {
  id: number;
  accountHolderName: string;
  currency: WiseCurrency;
  country: string;
  type: WiseRecipientType;
  details: WiseRecipientDetails;
  user?: number;
  business?: number;
  active: boolean;
}

/**
 * Create Recipient Request
 */
export interface WiseCreateRecipientRequest {
  currency: WiseCurrency;
  type: WiseRecipientType;
  profile: number;
  accountHolderName: string;
  details: WiseRecipientDetails;
}

/**
 * Transfer Status
 */
export enum WiseTransferStatus {
  INCOMING_PAYMENT_WAITING = 'incoming_payment_waiting',
  PROCESSING = 'processing',
  FUNDS_CONVERTED = 'funds_converted',
  OUTGOING_PAYMENT_SENT = 'outgoing_payment_sent',
  CANCELLED = 'cancelled',
  FUNDS_REFUNDED = 'funds_refunded',
  BOUNCED_BACK = 'bounced_back',
  CHARGED_BACK = 'charged_back',
}

/**
 * Transfer
 */
export interface WiseTransfer {
  id: number;
  user: number;
  targetAccount: number;
  sourceAccount?: number;
  quote: string;
  quoteUuid: string;
  status: WiseTransferStatus;
  reference: string;
  rate: number;
  created: string;
  business?: number;
  transferRequest?: number;
  details: {
    reference: string;
  };
  hasActiveIssues: boolean;
  sourceCurrency: WiseCurrency;
  sourceValue: number;
  targetCurrency: WiseCurrency;
  targetValue: number;
  customerTransactionId?: string;
}

/**
 * Create Transfer Request
 */
export interface WiseCreateTransferRequest {
  targetAccount: number;
  quoteUuid: string;
  customerTransactionId?: string;
  details: {
    reference: string;
    transferPurpose?: string;
    transferPurposeSubTransferPurpose?: string;
    sourceOfFunds?: string;
  };
}

/**
 * Fund Transfer Request
 */
export interface WiseFundTransferRequest {
  type: 'BALANCE';
}

/**
 * Balance Account
 */
export interface WiseBalance {
  id: number;
  profileId: number;
  recipientId: number;
  creationTime: string;
  modificationTime: string;
  active: boolean;
  eligible: boolean;
  balances: Array<{
    currency: WiseCurrency;
    amount: {
      value: number;
      currency: WiseCurrency;
    };
    reservedAmount: {
      value: number;
      currency: WiseCurrency;
    };
    bankDetails?: {
      id: number;
      currency: WiseCurrency;
      bankCode: string;
      accountNumber: string;
      swift: string;
      iban: string;
      bankName: string;
      accountHolderName: string;
      bankAddress: {
        addressFirstLine: string;
        postCode: string;
        city: string;
        country: string;
        stateCode: string;
      };
    };
  }>;
}

/**
 * Statement Transaction
 */
export interface WiseStatementTransaction {
  type: 'DEBIT' | 'CREDIT';
  date: string;
  amount: {
    value: number;
    currency: WiseCurrency;
  };
  totalFees: {
    value: number;
    currency: WiseCurrency;
  };
  details: {
    type: string;
    description: string;
    amount: {
      value: number;
      currency: WiseCurrency;
    };
    category: string;
    merchant?: {
      name: string;
      firstLine: string;
      postCode: string;
      city: string;
      state: string;
      country: string;
      category: string;
    };
  };
  exchangeDetails?: {
    forAmount: {
      value: number;
      currency: WiseCurrency;
    };
    rate: number;
  };
  runningBalance: {
    value: number;
    currency: WiseCurrency;
  };
  referenceNumber: string;
}

/**
 * Balance Statement
 */
export interface WiseStatement {
  accountHolder: {
    type: string;
    address: {
      addressFirstLine: string;
      city: string;
      postCode: string;
      stateCode: string;
      countryName: string;
    };
    firstName: string;
    lastName: string;
  };
  issuer: {
    name: string;
    firstLine: string;
    city: string;
    postCode: string;
    stateCode: string;
    country: string;
  };
  bankDetails?: Array<{
    id: number;
    currency: WiseCurrency;
    bankCode: string;
    accountNumber: string;
    swift: string;
    iban: string;
    bankName: string;
    accountHolderName: string;
    bankAddress: {
      addressFirstLine: string;
      postCode: string;
      city: string;
      country: string;
      stateCode: string;
    };
  }>;
  transactions: WiseStatementTransaction[];
  endOfStatementBalance: {
    value: number;
    currency: WiseCurrency;
  };
  query: {
    intervalStart: string;
    intervalEnd: string;
    currency: WiseCurrency;
  };
}

/**
 * Webhook Event Types
 */
export enum WiseWebhookEvent {
  TRANSFER_STATE_CHANGE = 'transfers#state-change',
  TRANSFER_ACTIVE_CASES = 'transfers#active-cases',
  BALANCE_CREDIT = 'balances#credit',
  BALANCE_UPDATE = 'balances#update',
}

/**
 * Webhook Payload
 */
export interface WiseWebhookPayload {
  subscriptionId: string;
  eventType: WiseWebhookEvent;
  createdAt: string;
  data: {
    resource: {
      id: number;
      profile_id: number;
      account_id: number;
      type: string;
    };
    current_state?: WiseTransferStatus;
    previous_state?: WiseTransferStatus;
    occurred_at: string;
    amount?: number;
    currency?: WiseCurrency;
    transaction_type?: string;
    post_transaction_balance_amount?: number;
  };
}

/**
 * SCA (Strong Customer Authentication) Challenge
 */
export interface WiseSCAChallenge {
  type: 'TWO_FACTOR_AUTHENTICATION';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * Wise Encryption Config (same as TrueLayer for consistency)
 */
export const WISE_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  saltLength: 64,
  tagLength: 16,
  iterations: 100000,
  digest: 'sha512',
} as const;

/**
 * Wise API Error Response
 */
export interface WiseErrorResponse {
  errors: Array<{
    code: string;
    message: string;
    path?: string;
    arguments?: string[];
  }>;
}

/**
 * Transfer Purpose Codes (varies by corridor)
 */
export enum WiseTransferPurpose {
  // General
  VERIFICATION_TRANSFERS = 'verification.transfers.purpose.verification.transfers',
  FAMILY_SUPPORT = 'verification.transfers.purpose.family.support',
  EDUCATION = 'verification.transfers.purpose.education',
  GIFT_DONATION = 'verification.transfers.purpose.gift.or.donation',
  PROPERTY_PURCHASE = 'verification.transfers.purpose.property.purchase',
  MORTGAGE_PAYMENT = 'verification.transfers.purpose.mortgage.payment',

  // Business
  BUSINESS_INVOICE = 'verification.transfers.purpose.invoice.payment',
  BUSINESS_SALARY = 'verification.transfers.purpose.salary.payment',
  BUSINESS_GOODS = 'verification.transfers.purpose.purchase.sale.of.goods',
  BUSINESS_SERVICES = 'verification.transfers.purpose.purchase.sale.of.services',

  // Other
  OTHER = 'verification.transfers.purpose.other',
}

/**
 * Source of Funds
 */
export enum WiseSourceOfFunds {
  VERIFICATION_TRANSFERS = 'verification.source.of.funds.other',
  SALARY = 'verification.source.of.funds.salary',
  INVESTMENT = 'verification.source.of.funds.investment',
  INHERITANCE = 'verification.source.of.funds.inheritance',
  BUSINESS = 'verification.source.of.funds.business',
  FAMILY = 'verification.source.of.funds.family',
}
