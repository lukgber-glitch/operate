/**
 * TrueLayer Configuration Interface
 */
export interface TrueLayerConfig {
  clientId: string;
  clientSecret: string;
  environment: TrueLayerEnvironment;
  redirectUri: string;
  webhookUrl?: string;
  sandbox: boolean;
}

/**
 * TrueLayer Environment
 */
export enum TrueLayerEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

/**
 * TrueLayer OAuth2 Authorization Request
 */
export interface TrueLayerAuthRequest {
  userId: string;
  redirectUri?: string;
  state?: string;
  scopes?: TrueLayerScope[];
  providerId?: string; // Optional: specific bank provider
  enableMockProviders?: boolean; // Sandbox only
}

/**
 * TrueLayer OAuth2 Authorization Response
 */
export interface TrueLayerAuthResponse {
  authUrl: string;
  state: string;
  expiresAt: Date;
}

/**
 * TrueLayer OAuth2 Token Exchange Request
 */
export interface TrueLayerTokenExchangeRequest {
  code: string;
  userId: string;
  state?: string;
  redirectUri?: string;
}

/**
 * TrueLayer OAuth2 Token Exchange Response
 */
export interface TrueLayerTokenExchangeResponse {
  accessToken: string; // Encrypted for storage
  refreshToken: string; // Encrypted for storage
  expiresIn: number;
  tokenType: string;
  scope: string;
}

/**
 * TrueLayer Scopes
 * See: https://docs.truelayer.com/docs/permissions-and-scopes
 */
export enum TrueLayerScope {
  INFO = 'info',
  ACCOUNTS = 'accounts',
  BALANCE = 'balance',
  TRANSACTIONS = 'transactions',
  CARDS = 'cards',
  STANDING_ORDERS = 'standing_orders',
  DIRECT_DEBITS = 'direct_debits',
  OFFLINE_ACCESS = 'offline_access', // For refresh tokens
}

/**
 * Default TrueLayer Scopes for UK Market
 */
export const TRUELAYER_DEFAULT_SCOPES: TrueLayerScope[] = [
  TrueLayerScope.INFO,
  TrueLayerScope.ACCOUNTS,
  TrueLayerScope.BALANCE,
  TrueLayerScope.TRANSACTIONS,
  TrueLayerScope.OFFLINE_ACCESS,
];

/**
 * TrueLayer Account Information
 */
export interface TrueLayerAccount {
  account_id: string;
  account_type: TrueLayerAccountType;
  display_name: string;
  currency: string;
  account_number?: {
    iban?: string;
    number?: string;
    sort_code?: string;
    swift_bic?: string;
  };
  provider?: {
    provider_id: string;
    display_name: string;
    logo_uri?: string;
  };
  update_timestamp: string;
}

/**
 * TrueLayer Account Types
 */
export enum TrueLayerAccountType {
  TRANSACTION = 'TRANSACTION',
  SAVINGS = 'SAVINGS',
  CURRENT = 'CURRENT',
}

/**
 * TrueLayer Balance Information
 */
export interface TrueLayerBalance {
  currency: string;
  available: number;
  current: number;
  overdraft?: number;
  update_timestamp: string;
}

/**
 * TrueLayer Transaction Information
 */
export interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: TrueLayerTransactionType;
  transaction_category: string;
  transaction_classification?: string[];
  merchant_name?: string;
  running_balance?: {
    amount: number;
    currency: string;
  };
  meta?: Record<string, any>;
}

/**
 * TrueLayer Transaction Types
 */
export enum TrueLayerTransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

/**
 * TrueLayer Connection Status
 */
export enum TrueLayerConnectionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

/**
 * TrueLayer Connection Record
 */
export interface TrueLayerConnectionRecord {
  id: string;
  organizationId: string;
  userId: string;
  providerId: string;
  providerName: string;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiresAt: Date;
  status: TrueLayerConnectionStatus;
  scopes: string[];
  lastSynced?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TrueLayer Webhook Event Types
 * See: https://docs.truelayer.com/docs/webhooks
 */
export enum TrueLayerWebhookType {
  ACCOUNT_UPDATED = 'account.updated',
  BALANCE_UPDATED = 'balance.updated',
  TRANSACTION_CREATED = 'transaction.created',
  CONSENT_REVOKED = 'consent.revoked',
  ERROR = 'error',
}

/**
 * TrueLayer Webhook Event
 */
export interface TrueLayerWebhookEvent {
  type: TrueLayerWebhookType;
  event_id: string;
  event_timestamp: string;
  resource_id: string;
  resource_type: string;
  resource_token?: string;
  metadata?: Record<string, any>;
}

/**
 * TrueLayer Encryption Configuration
 * Using AES-256-GCM (same as Plaid)
 */
export const TRUELAYER_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltLength: 64,
  iterations: 100000,
  digest: 'sha512',
} as const;

/**
 * TrueLayer API Rate Limits
 */
export const TRUELAYER_RATE_LIMITS = {
  AUTH: 10, // requests per minute
  TOKEN_EXCHANGE: 10,
  ACCOUNTS: 60,
  BALANCE: 60,
  TRANSACTIONS: 60,
  REFRESH_TOKEN: 10,
};

/**
 * TrueLayer Transaction Sync Configuration
 */
export const TRUELAYER_SYNC_CONFIG = {
  // How many days of historical transactions to fetch initially
  INITIAL_DAYS: 365, // 1 year (UK Open Banking standard)

  // Maximum transactions to fetch per request
  MAX_TRANSACTIONS_PER_REQUEST: 100,

  // Sync frequency (in minutes)
  SYNC_FREQUENCY: 60,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
  RETRY_BACKOFF: 2, // exponential backoff multiplier
};

/**
 * TrueLayer API Endpoints
 */
export const TRUELAYER_ENDPOINTS = {
  SANDBOX: {
    AUTH: 'https://auth.truelayer-sandbox.com',
    API: 'https://api.truelayer-sandbox.com',
  },
  PRODUCTION: {
    AUTH: 'https://auth.truelayer.com',
    API: 'https://api.truelayer.com',
  },
} as const;
