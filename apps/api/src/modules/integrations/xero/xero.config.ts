import { registerAs } from '@nestjs/config';

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  webhookKey?: string;
}

/**
 * Xero API Configuration
 * Loads configuration from environment variables
 */
export default registerAs('xero', (): XeroConfig => {
  return {
    clientId: process.env.XERO_CLIENT_ID || '',
    clientSecret: process.env.XERO_CLIENT_SECRET || '',
    redirectUri:
      process.env.XERO_REDIRECT_URI ||
      'http://localhost:3000/api/integrations/xero/callback',
    webhookKey: process.env.XERO_WEBHOOK_KEY,
  };
});

/**
 * Xero OAuth2 Scopes
 * Required scopes for accounting operations
 */
export const XERO_SCOPES = [
  'openid',
  'profile',
  'email',
  'accounting.transactions',
  'accounting.contacts',
  'accounting.settings',
  'offline_access', // Required for refresh token
];

/**
 * Default scope for Xero integration
 */
export const DEFAULT_XERO_SCOPE = XERO_SCOPES.join(' ');

/**
 * Xero API Endpoints
 */
export const XERO_ENDPOINTS = {
  authUrl: 'https://login.xero.com/identity/connect/authorize',
  tokenUrl: 'https://identity.xero.com/connect/token',
  connectionsUrl: 'https://api.xero.com/connections',
  apiUrl: 'https://api.xero.com/api.xro/2.0',
  revokeUrl: 'https://identity.xero.com/connect/revocation',
};

/**
 * Xero API Rate Limits
 * Reference: https://developer.xero.com/documentation/guides/oauth2/limits/
 */
export const XERO_RATE_LIMITS = {
  perMinute: 60, // API calls per minute per organisation
  perDay: 5000, // API calls per day per organisation
  concurrent: 10, // Concurrent requests
};

/**
 * Token Expiry Times
 */
export const XERO_TOKEN_EXPIRY = {
  accessToken: 1800, // 30 minutes in seconds
  refreshToken: 5184000, // 60 days in seconds
  refreshBuffer: 300, // Refresh 5 minutes before expiry
};

/**
 * PKCE Configuration
 */
export const XERO_PKCE_CONFIG = {
  codeChallengeMethod: 'S256', // SHA-256
  codeVerifierLength: 128, // Length of code verifier
  stateLength: 32, // Length of state parameter
};

/**
 * Encryption Configuration
 */
export const XERO_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
} as const;

/**
 * Configuration Validation
 */
export function validateXeroConfig(config: XeroConfig): void {
  if (!config.clientId) {
    throw new Error('XERO_CLIENT_ID is required');
  }
  if (!config.clientSecret) {
    throw new Error('XERO_CLIENT_SECRET is required');
  }
  if (!config.redirectUri) {
    throw new Error('XERO_REDIRECT_URI is required');
  }
}
