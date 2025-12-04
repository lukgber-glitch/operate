/**
 * Tink Open Banking API TypeScript Types
 * PSD2-compliant type definitions for Tink integration
 */

/**
 * Tink API Configuration
 */
export interface TinkConfig {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  linkUrl: string;
  redirectUri: string;
  environment: 'production' | 'sandbox';
  mockMode: boolean;
}

/**
 * OAuth2 PKCE Code Verifier/Challenge
 */
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/**
 * Tink OAuth2 Token
 */
export interface TinkToken {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
  expiresAt: Date;
}

/**
 * Encrypted Tink Credentials
 */
export interface TinkCredentials {
  id: string;
  organizationId: string;
  userId: string;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiresAt: Date;
  scope: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tink Authorization Flow State
 */
export interface TinkAuthorizationFlow {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  organizationId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Tink Consent Status
 */
export enum TinkConsentStatus {
  AWAITING_USER_APPROVAL = 'AWAITING_USER_APPROVAL',
  AUTHORIZED = 'AUTHORIZED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  FAILED = 'FAILED',
}

/**
 * Tink Bank Account
 */
export interface TinkAccount {
  id: string;
  identifiers: {
    iban?: string;
    bban?: string;
    sortCode?: string;
    accountNumber?: string;
  };
  name: string;
  type: TinkAccountType;
  balances: {
    booked: {
      amount: {
        value: number;
        currencyCode: string;
      };
    };
    available?: {
      amount: {
        value: number;
        currencyCode: string;
      };
    };
  };
  dates: {
    lastRefreshed: Date;
  };
}

/**
 * Tink Account Types
 */
export enum TinkAccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  LOAN = 'LOAN',
  PENSION = 'PENSION',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER',
}

/**
 * Tink Transaction
 */
export interface TinkTransaction {
  id: string;
  accountId: string;
  amount: {
    value: number;
    currencyCode: string;
  };
  dates: {
    booked: Date;
    value?: Date;
  };
  descriptions: {
    original: string;
    display: string;
  };
  identifiers: {
    providerTransactionId?: string;
  };
  merchantInformation?: {
    merchantName?: string;
    merchantCategoryCode?: string;
  };
  status: TinkTransactionStatus;
  types: {
    type: TinkTransactionType;
    financialInstitutionType?: string;
  };
  providerMutability: 'MUTABILITY_UNDEFINED' | 'MUTABILITY_MUTABLE' | 'MUTABILITY_IMMUTABLE';
}

/**
 * Tink Transaction Status
 */
export enum TinkTransactionStatus {
  BOOKED = 'BOOKED',
  PENDING = 'PENDING',
}

/**
 * Tink Transaction Type
 */
export enum TinkTransactionType {
  DEFAULT = 'DEFAULT',
  CREDIT_CARD = 'CREDIT_CARD',
  PAYMENT = 'PAYMENT',
  TRANSFER = 'TRANSFER',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
  FEE = 'FEE',
  INTEREST = 'INTEREST',
  DIVIDEND = 'DIVIDEND',
  TAX = 'TAX',
}

/**
 * Tink Provider (Bank)
 */
export interface TinkProvider {
  name: string;
  displayName: string;
  type: string;
  status: 'ENABLED' | 'DISABLED' | 'TEMPORARY_DISABLED';
  credentialsType: string;
  helpText?: string;
  isPopular: boolean;
  fields: TinkProviderField[];
  groupDisplayName?: string;
  image?: string;
  displayDescription?: string;
  capabilities: string[];
  accessType: 'OPEN_BANKING' | 'OTHER';
  market: string;
  financialInstitution: {
    id: string;
    name: string;
  };
}

/**
 * Tink Provider Field
 */
export interface TinkProviderField {
  name: string;
  description: string;
  hint?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  patternError?: string;
  optional: boolean;
  numeric: boolean;
  immutable: boolean;
  sensitive: boolean;
  value?: string;
}

/**
 * Tink User
 */
export interface TinkUser {
  id: string;
  externalUserId: string;
  created: Date;
  locale: string;
  market: string;
  timeZone: string;
  periodMode: 'MONTHLY' | 'WEEKLY' | 'DAILY';
  periodAdjustedDay: number;
  currency: string;
  appId: string;
}

/**
 * Tink Link Parameters
 */
export interface TinkLinkParams {
  clientId: string;
  redirectUri: string;
  market: string;
  locale: string;
  scope: string;
  state: string;
  test?: boolean;
  iframe?: boolean;
  input_provider?: string;
}

/**
 * Tink API Error Response
 */
export interface TinkApiError {
  error: string;
  errorDescription: string;
  errorCode?: string;
}

/**
 * Tink Webhook Event
 */
export interface TinkWebhookEvent {
  eventType: TinkEventType;
  userId: string;
  credentialsId?: string;
  accountId?: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * Tink Event Types
 */
export enum TinkEventType {
  CREDENTIALS_CREATED = 'credentials:created',
  CREDENTIALS_UPDATED = 'credentials:updated',
  CREDENTIALS_DELETED = 'credentials:deleted',
  ACCOUNT_CREATED = 'account:created',
  ACCOUNT_UPDATED = 'account:updated',
  ACCOUNT_DELETED = 'account:deleted',
  TRANSACTION_CREATED = 'transaction:created',
  TRANSACTION_UPDATED = 'transaction:updated',
}

/**
 * Tink Rate Limit Info
 */
export interface TinkRateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Tink Audit Log Entry
 */
export interface TinkAuditLog {
  id: string;
  organizationId: string;
  userId: string;
  action: TinkAuditAction;
  endpoint: string;
  method: string;
  statusCode: number;
  requestId?: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Tink Audit Actions
 */
export enum TinkAuditAction {
  AUTHORIZATION_START = 'authorization:start',
  AUTHORIZATION_COMPLETE = 'authorization:complete',
  TOKEN_REFRESH = 'token:refresh',
  ACCOUNTS_FETCH = 'accounts:fetch',
  TRANSACTIONS_FETCH = 'transactions:fetch',
  CREDENTIALS_DELETE = 'credentials:delete',
  WEBHOOK_RECEIVED = 'webhook:received',
}
