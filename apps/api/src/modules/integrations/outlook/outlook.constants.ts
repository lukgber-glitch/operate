/**
 * Microsoft Graph (Outlook) Integration Constants
 * Configuration and constants for Outlook/Office 365 email integration
 */

/**
 * Microsoft Graph API Base URL
 */
export const GRAPH_API_BASE_URL = 'https://graph.microsoft.com/v1.0';

/**
 * Microsoft OAuth2 endpoints
 */
export const MICROSOFT_OAUTH_ENDPOINTS = {
  authorize: (tenant: string) =>
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
  token: (tenant: string) =>
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
  logout: (tenant: string) =>
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/logout`,
};

/**
 * Required Microsoft Graph scopes for email operations
 * https://docs.microsoft.com/en-us/graph/permissions-reference
 */
export const OUTLOOK_SCOPES = [
  'Mail.Read', // Read user's email
  'Mail.ReadWrite', // Read and write user's email (for moving to folders)
  'User.Read', // Read user profile
  'offline_access', // Get refresh token
];

/**
 * Token expiry settings (in seconds)
 */
export const OUTLOOK_TOKEN_EXPIRY = {
  accessToken: 3600, // 1 hour (Microsoft default)
  refreshToken: 90 * 24 * 60 * 60, // 90 days
  refreshBuffer: 300, // 5 minutes before expiry, trigger refresh
};

/**
 * PKCE Configuration
 */
export const OUTLOOK_PKCE_CONFIG = {
  codeVerifierLength: 32, // 32 bytes = 43 chars in base64url
  stateLength: 16, // 16 bytes = 22 chars in base64url
  challengeMethod: 'S256', // SHA256
};

/**
 * Encryption configuration for token storage
 */
export const OUTLOOK_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  tagLength: 16, // 128 bits
};

/**
 * Rate limiting configuration
 */
export const OUTLOOK_RATE_LIMITS = {
  oauthAttempts: 10, // Max OAuth attempts per user per hour
  oauthWindow: 60 * 60 * 1000, // 1 hour
  apiCalls: 2000, // Max API calls per user per hour (Microsoft throttle: 10,000/10 min)
  apiWindow: 60 * 60 * 1000, // 1 hour
};

/**
 * OData query defaults
 */
export const OUTLOOK_QUERY_DEFAULTS = {
  maxResults: 50, // Max messages to fetch per request
  maxPageSize: 999, // Microsoft Graph max page size
  defaultSelect: [
    'id',
    'subject',
    'from',
    'toRecipients',
    'ccRecipients',
    'receivedDateTime',
    'hasAttachments',
    'isRead',
    'importance',
    'bodyPreview',
  ].join(','),
};

/**
 * Email search filters for invoices/receipts
 */
export const INVOICE_SEARCH_KEYWORDS = [
  'invoice',
  'receipt',
  'bill',
  'payment',
  'statement',
  'facture', // French
  'rechnung', // German
  'fattura', // Italian
  'factura', // Spanish
];

/**
 * Folder names
 */
export const OUTLOOK_FOLDERS = {
  processed: 'Operate - Processed',
  inbox: 'inbox',
  sentItems: 'sentitems',
  drafts: 'drafts',
};

/**
 * Microsoft Graph error codes
 */
export const GRAPH_ERROR_CODES = {
  authenticationFailure: 'AuthenticationFailure',
  invalidAuthenticationToken: 'InvalidAuthenticationToken',
  tokenExpired: 'TokenExpired',
  itemNotFound: 'ItemNotFound',
  quotaLimitReached: 'QuotaLimitReached',
  generalException: 'GeneralException',
};

/**
 * Retry configuration
 */
export const OUTLOOK_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryBackoff: 2, // Exponential backoff multiplier
};
