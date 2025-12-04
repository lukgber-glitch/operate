import { registerAs } from '@nestjs/config';
import { TinkConfig } from './tink.types';

/**
 * Tink API Configuration
 * Loads configuration from environment variables
 */
export default registerAs('tink', (): TinkConfig => {
  const environment = (process.env.TINK_ENVIRONMENT || 'sandbox') as 'production' | 'sandbox';
  const mockMode = process.env.TINK_MOCK_MODE === 'true';

  return {
    clientId: process.env.TINK_CLIENT_ID || '',
    clientSecret: process.env.TINK_CLIENT_SECRET || '',
    apiUrl:
      environment === 'production'
        ? 'https://api.tink.com'
        : 'https://api.tink.com', // Tink uses same URL for both
    linkUrl:
      environment === 'production'
        ? 'https://link.tink.com/1.0'
        : 'https://link.tink.com/1.0',
    redirectUri: process.env.TINK_REDIRECT_URI || 'http://localhost:3000/integrations/tink/callback',
    environment,
    mockMode,
  };
});

/**
 * Tink API Scopes
 * PSD2-compliant scopes for different access levels
 */
export const TINK_SCOPES = {
  // Account Information Service (AIS)
  ACCOUNTS_READ: 'accounts:read',
  BALANCES_READ: 'balances:read',
  TRANSACTIONS_READ: 'transactions:read',

  // Payment Initiation Service (PIS)
  PAYMENTS_WRITE: 'payments:write',

  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',

  // Statistics
  STATISTICS_READ: 'statistics:read',

  // Identity
  IDENTITY_READ: 'identity:read',

  // Investments
  INVESTMENTS_READ: 'investments:read',
};

/**
 * Default scope for Open Banking integration
 * Minimal required scopes for account and transaction access
 */
export const DEFAULT_TINK_SCOPE = [
  TINK_SCOPES.ACCOUNTS_READ,
  TINK_SCOPES.BALANCES_READ,
  TINK_SCOPES.TRANSACTIONS_READ,
  TINK_SCOPES.USER_READ,
].join(',');

/**
 * Tink API Rate Limits
 */
export const TINK_RATE_LIMITS = {
  // Per-endpoint rate limits (requests per minute)
  TOKEN: 60,
  ACCOUNTS: 100,
  TRANSACTIONS: 100,
  CREDENTIALS: 60,

  // Burst limits
  BURST_MULTIPLIER: 2,
};

/**
 * Tink Configuration Validation
 */
export function validateTinkConfig(config: TinkConfig): void {
  if (!config.mockMode) {
    if (!config.clientId) {
      throw new Error('TINK_CLIENT_ID is required');
    }
    if (!config.clientSecret) {
      throw new Error('TINK_CLIENT_SECRET is required');
    }
    if (!config.redirectUri) {
      throw new Error('TINK_REDIRECT_URI is required');
    }
  }
}

/**
 * Tink Supported Markets
 */
export const TINK_MARKETS = [
  'AT', // Austria
  'BE', // Belgium
  'DE', // Germany
  'DK', // Denmark
  'ES', // Spain
  'FI', // Finland
  'FR', // France
  'GB', // United Kingdom
  'IT', // Italy
  'NL', // Netherlands
  'NO', // Norway
  'SE', // Sweden
  'PT', // Portugal
  'PL', // Poland
] as const;

export type TinkMarket = typeof TINK_MARKETS[number];

/**
 * Tink Encryption Key Configuration
 */
export const TINK_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltLength: 64,
  iterations: 100000,
  digest: 'sha512',
} as const;
