/**
 * Tink Webhook DTOs
 * Type definitions for incoming webhook payloads
 */

/**
 * Tink Webhook Payload
 * Main webhook event structure from Tink
 */
export interface TinkWebhookPayload {
  eventType: string;
  userId: string;
  timestamp: string;
  data: TinkWebhookData;
}

/**
 * Tink Webhook Data
 * Event-specific data payload
 */
export interface TinkWebhookData {
  credentialsId?: string;
  accountId?: string;
  transactionId?: string;
  transaction?: TinkWebhookTransaction;
  account?: TinkWebhookAccount;
  [key: string]: any;
}

/**
 * Tink Webhook Transaction
 * Transaction data in webhook events
 */
export interface TinkWebhookTransaction {
  id: string;
  accountId: string;
  amount: {
    value: {
      unscaledValue: number;
      scale: number;
    };
    currencyCode: string;
  };
  dates: {
    booked: string;
    value?: string;
  };
  descriptions: {
    original: string;
    display: string;
  };
  identifiers?: {
    providerTransactionId?: string;
  };
  merchantInformation?: {
    merchantName?: string;
    merchantCategoryCode?: string;
  };
  status: string;
  types: {
    type: string;
    financialInstitutionType?: string;
  };
}

/**
 * Tink Webhook Account
 * Account data in webhook events
 */
export interface TinkWebhookAccount {
  id: string;
  name: string;
  type: string;
  balances: {
    booked: {
      amount: {
        value: {
          unscaledValue: number;
          scale: number;
        };
        currencyCode: string;
      };
    };
    available?: {
      amount: {
        value: {
          unscaledValue: number;
          scale: number;
        };
        currencyCode: string;
      };
    };
  };
  dates: {
    lastRefreshed: string;
  };
}

/**
 * Event types supported by Tink webhooks
 */
export enum TinkWebhookEventType {
  // Transaction events
  TRANSACTION_CREATED = 'transaction:created',
  TRANSACTION_UPDATED = 'transaction:updated',

  // Account events
  ACCOUNT_CREATED = 'account:created',
  ACCOUNT_UPDATED = 'account:updated',
  ACCOUNT_BALANCE_UPDATED = 'account:balance_updated',

  // Credentials events
  CREDENTIALS_UPDATED = 'credentials:updated',
  CREDENTIALS_REFRESH_FAILED = 'credentials:refresh_failed',
}
