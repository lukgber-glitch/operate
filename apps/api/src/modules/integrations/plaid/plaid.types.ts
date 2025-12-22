import {
  AccountBase,
  Transaction,
  PlaidEnvironments,
  Products,
  CountryCode,
} from 'plaid';

/**
 * Plaid Configuration Interface
 */
export interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: typeof PlaidEnvironments[keyof typeof PlaidEnvironments];
  webhookUrl?: string;
  redirectUri?: string;
  mockMode: boolean;
}

/**
 * Plaid Link Token Request
 */
export interface PlaidLinkTokenRequest {
  userId: string;
  clientName: string;
  language?: string;
  countryCodes?: CountryCode[];
  products?: Products[];
  webhookUrl?: string;
  redirectUri?: string;
}

/**
 * Plaid Link Token Response
 */
export interface PlaidLinkTokenResponse {
  linkToken: string;
  expiration: string;
}

/**
 * Plaid Exchange Token Request
 */
export interface PlaidExchangeTokenRequest {
  publicToken: string;
  userId: string;
  institutionId?: string;
  institutionName?: string;
}

/**
 * Plaid Exchange Token Response
 */
export interface PlaidExchangeTokenResponse {
  accessToken: string;
  itemId: string;
  requestId: string;
}

/**
 * Plaid Account Information
 */
export interface PlaidAccount extends AccountBase {
  // Additional custom fields can be added here
  organizationId?: string;
  lastSynced?: Date;
}

/**
 * Plaid Transaction with extended metadata
 */
export interface PlaidTransactionExtended extends Transaction {
  organizationId?: string;
  synced?: boolean;
  categorized?: boolean;
}

/**
 * Plaid Webhook Event Types
 */
export enum PlaidWebhookType {
  TRANSACTIONS = 'TRANSACTIONS',
  ITEM = 'ITEM',
  AUTH = 'AUTH',
  ASSETS = 'ASSETS',
  HOLDINGS = 'HOLDINGS',
  INVESTMENTS_TRANSACTIONS = 'INVESTMENTS_TRANSACTIONS',
  LIABILITIES = 'LIABILITIES',
  IDENTITY = 'IDENTITY',
  INCOME = 'INCOME',
  PAYMENT_INITIATION = 'PAYMENT_INITIATION',
}

/**
 * Plaid Webhook Event
 */
export interface PlaidWebhookEvent {
  webhook_type: PlaidWebhookType;
  webhook_code: string;
  item_id: string;
  error?: {
    error_code: string;
    error_message: string;
  };
  new_transactions?: number;
  removed_transactions?: string[];
}

/**
 * Plaid Item Status
 */
export enum PlaidItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

/**
 * Plaid Connection Record
 */
export interface PlaidConnectionRecord {
  id: string;
  organizationId: string;
  userId: string;
  itemId: string;
  accessToken: string; // Encrypted
  institutionId?: string;
  institutionName?: string;
  status: PlaidItemStatus;
  lastSynced?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plaid Supported Countries for US Market
 */
export const PLAID_US_COUNTRY_CODES: CountryCode[] = [
  CountryCode.Us,
  CountryCode.Ca, // Also support Canadian banks for US customers
];

/**
 * Default Plaid Products for US Market
 */
export const PLAID_US_PRODUCTS: Products[] = [
  Products.Auth,
  Products.Transactions,
  Products.Balance,
  Products.Identity,
];

/**
 * Plaid API Rate Limits
 */
export const PLAID_RATE_LIMITS = {
  // Per-endpoint rate limits (requests per second)
  LINK_TOKEN_CREATE: 100,
  ITEM_PUBLIC_TOKEN_EXCHANGE: 100,
  ACCOUNTS_GET: 100,
  TRANSACTIONS_GET: 100,
  TRANSACTIONS_SYNC: 100,

  // Burst limits
  BURST_MULTIPLIER: 2,
};

/**
 * Plaid Encryption Configuration
 * Using AES-256-GCM for access token encryption
 */
export const PLAID_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltLength: 64,
  iterations: 100000,
  digest: 'sha512',
} as const;

/**
 * Plaid Transaction Sync Configuration
 */
export const PLAID_SYNC_CONFIG = {
  // How many days of historical transactions to fetch initially
  INITIAL_DAYS: 730, // 2 years

  // Maximum transactions to fetch per request
  MAX_TRANSACTIONS_PER_REQUEST: 500,

  // Sync frequency (in minutes)
  SYNC_FREQUENCY: 60,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
  RETRY_BACKOFF: 2, // exponential backoff multiplier
};
