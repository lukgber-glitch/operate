import { registerAs } from '@nestjs/config';

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
  webhookVerifierToken?: string;
  minorVersion?: string;
}

/**
 * QuickBooks Online API Configuration
 * Loads configuration from environment variables
 */
export default registerAs('quickbooks', (): QuickBooksConfig => {
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') as
    | 'sandbox'
    | 'production';

  return {
    clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
    redirectUri:
      process.env.QUICKBOOKS_REDIRECT_URI ||
      'http://localhost:3000/api/quickbooks/callback',
    environment,
    webhookVerifierToken: process.env.QUICKBOOKS_WEBHOOK_TOKEN,
    minorVersion: process.env.QUICKBOOKS_MINOR_VERSION || '65', // QuickBooks API minor version
  };
});

/**
 * QuickBooks OAuth2 Scopes
 * Required scopes for accounting operations
 */
export const QUICKBOOKS_SCOPES = [
  'com.intuit.quickbooks.accounting', // Read/write access to QuickBooks data
  'com.intuit.quickbooks.payment', // Payment processing
  'openid', // OpenID Connect
  'profile', // User profile
  'email', // User email
  'phone', // User phone
  'address', // User address
];

/**
 * Default scope for QuickBooks integration
 */
export const DEFAULT_QUICKBOOKS_SCOPE = [
  'com.intuit.quickbooks.accounting',
  'openid',
  'profile',
  'email',
].join(' ');

/**
 * QuickBooks API Endpoints
 */
export const QUICKBOOKS_ENDPOINTS = {
  production: {
    baseUrl: 'https://quickbooks.api.intuit.com',
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    revokeUrl: 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
    userInfoUrl: 'https://accounts.platform.intuit.com/v1/openid_connect/userinfo',
  },
  sandbox: {
    baseUrl: 'https://sandbox-quickbooks.api.intuit.com',
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    revokeUrl: 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
    userInfoUrl: 'https://sandbox-accounts.platform.intuit.com/v1/openid_connect/userinfo',
  },
};

/**
 * QuickBooks API Rate Limits
 * Reference: https://developer.intuit.com/app/developer/qbo/docs/develop/rest-api-features/rate-limiting
 */
export const QUICKBOOKS_RATE_LIMITS = {
  perMinute: 500, // Requests per minute per app
  perDay: 10000, // Requests per day per app (for some endpoints)
  concurrent: 10, // Concurrent requests
};

/**
 * Token Expiry Times
 */
export const QUICKBOOKS_TOKEN_EXPIRY = {
  accessToken: 3600, // 1 hour in seconds
  refreshToken: 8726400, // 101 days in seconds
  refreshBuffer: 300, // Refresh 5 minutes before expiry
};

/**
 * PKCE Configuration
 */
export const QUICKBOOKS_PKCE_CONFIG = {
  codeChallengeMethod: 'S256', // SHA-256
  codeVerifierLength: 128, // Length of code verifier
  stateLength: 32, // Length of state parameter
};

/**
 * Encryption Configuration
 */
export const QUICKBOOKS_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
} as const;

/**
 * Configuration Validation
 */
export function validateQuickBooksConfig(config: QuickBooksConfig): void {
  if (!config.clientId) {
    throw new Error('QUICKBOOKS_CLIENT_ID is required');
  }
  if (!config.clientSecret) {
    throw new Error('QUICKBOOKS_CLIENT_SECRET is required');
  }
  if (!config.redirectUri) {
    throw new Error('QUICKBOOKS_REDIRECT_URI is required');
  }
  if (!['sandbox', 'production'].includes(config.environment)) {
    throw new Error('QUICKBOOKS_ENVIRONMENT must be either sandbox or production');
  }
}

/**
 * Get QuickBooks endpoints for current environment
 */
export function getQuickBooksEndpoints(environment: 'sandbox' | 'production') {
  return QUICKBOOKS_ENDPOINTS[environment];
}
