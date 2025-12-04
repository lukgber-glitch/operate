import { HmrcConfig, HmrcEndpoints } from './interfaces/hmrc.interface';

/**
 * HMRC MTD Configuration
 */

/**
 * HMRC OAuth2 Scopes
 */
export const HMRC_SCOPES = {
  READ_VAT: 'read:vat',
  WRITE_VAT: 'write:vat',
} as const;

/**
 * Default scopes for MTD VAT
 */
export const DEFAULT_HMRC_SCOPE = [HMRC_SCOPES.READ_VAT, HMRC_SCOPES.WRITE_VAT].join(' ');

/**
 * Token expiry configuration
 */
export const HMRC_TOKEN_EXPIRY = {
  // HMRC access tokens expire in 4 hours (14400 seconds)
  accessTokenTtl: 4 * 60 * 60,
  // HMRC refresh tokens expire in 18 months (540 days)
  refreshTokenTtl: 540 * 24 * 60 * 60,
  // Refresh buffer - refresh tokens 10 minutes before expiry
  refreshBuffer: 10 * 60,
} as const;

/**
 * Get HMRC API endpoints based on environment
 */
export function getHmrcEndpoints(environment: 'sandbox' | 'production'): HmrcEndpoints {
  if (environment === 'production') {
    return {
      authorizationUrl: 'https://api.service.hmrc.gov.uk/oauth/authorize',
      tokenUrl: 'https://api.service.hmrc.gov.uk/oauth/token',
      apiBaseUrl: 'https://api.service.hmrc.gov.uk',
    };
  } else {
    // Sandbox environment
    return {
      authorizationUrl: 'https://test-api.service.hmrc.gov.uk/oauth/authorize',
      tokenUrl: 'https://test-api.service.hmrc.gov.uk/oauth/token',
      apiBaseUrl: 'https://test-api.service.hmrc.gov.uk',
    };
  }
}

/**
 * HMRC API endpoints
 */
export const HMRC_API_ENDPOINTS = {
  // VAT (MTD) endpoints
  VAT_OBLIGATIONS: '/organisations/vat/:vrn/obligations',
  VAT_RETURNS: '/organisations/vat/:vrn/returns',
  VAT_LIABILITIES: '/organisations/vat/:vrn/liabilities',
  VAT_PAYMENTS: '/organisations/vat/:vrn/payments',

  // Test endpoints (sandbox only)
  TEST_FRAUD_PREVENTION: '/test/fraud-prevention-headers/validate',
} as const;

/**
 * Validate HMRC configuration
 */
export function validateHmrcConfig(config: HmrcConfig): void {
  const errors: string[] = [];

  if (!config.clientId) {
    errors.push('HMRC_CLIENT_ID is required');
  }

  if (!config.clientSecret) {
    errors.push('HMRC_CLIENT_SECRET is required');
  }

  if (!config.redirectUri) {
    errors.push('HMRC_REDIRECT_URI is required');
  }

  if (!config.environment || !['sandbox', 'production'].includes(config.environment)) {
    errors.push('HMRC_ENVIRONMENT must be either "sandbox" or "production"');
  }

  if (errors.length > 0) {
    throw new Error(`HMRC configuration invalid:\n${errors.join('\n')}`);
  }
}

/**
 * HMRC-specific error codes
 */
export const HMRC_ERROR_CODES = {
  // OAuth errors
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  INVALID_REQUEST: 'invalid_request',
  INVALID_SCOPE: 'invalid_scope',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',

  // API errors
  INVALID_VRN: 'VRN_INVALID',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_SUBMISSION: 'DUPLICATE_SUBMISSION',
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  INVALID_PERIOD_KEY: 'INVALID_PERIOD_KEY',
  TAX_PERIOD_NOT_ENDED: 'TAX_PERIOD_NOT_ENDED',

  // Fraud prevention errors
  FRAUD_PREVENTION_HEADERS_MISSING: 'FRAUD_PREVENTION_HEADERS_MISSING',
  FRAUD_PREVENTION_HEADERS_INVALID: 'FRAUD_PREVENTION_HEADERS_INVALID',
} as const;

/**
 * HTTP headers for HMRC API calls
 */
export const HMRC_HEADERS = {
  ACCEPT: 'application/vnd.hmrc.1.0+json',
  CONTENT_TYPE: 'application/json',
} as const;

/**
 * Rate limiting configuration
 * HMRC has rate limits on their APIs
 */
export const HMRC_RATE_LIMITS = {
  // General rate limit: 3 requests per second per application
  requestsPerSecond: 3,
  // Burst allowance
  burstSize: 10,
} as const;

/**
 * HMRC connection status enum values
 */
export const HMRC_CONNECTION_STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  EXPIRED: 'EXPIRED',
  ERROR: 'ERROR',
} as const;

/**
 * HMRC audit action types
 */
export const HMRC_AUDIT_ACTIONS = {
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  API_CALL: 'API_CALL',
} as const;

/**
 * VAT obligation status
 */
export const VAT_OBLIGATION_STATUS = {
  OPEN: 'O',
  FULFILLED: 'F',
} as const;

/**
 * HMRC test VRNs (sandbox only)
 * @see https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/1.0
 */
export const HMRC_TEST_VRNS = {
  // Standard test VRN
  STANDARD: '999999999',
  // Invalid VRN for testing error scenarios
  INVALID: '123456789',
} as const;
