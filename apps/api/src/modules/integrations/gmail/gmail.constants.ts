/**
 * Gmail Integration Constants
 * Configuration values and constants for Gmail OAuth2 integration
 */

// Gmail OAuth2 Scopes
export const GMAIL_SCOPES = {
  READONLY: 'https://www.googleapis.com/auth/gmail.readonly',
  LABELS: 'https://www.googleapis.com/auth/gmail.labels',
  MODIFY: 'https://www.googleapis.com/auth/gmail.modify',
  COMPOSE: 'https://www.googleapis.com/auth/gmail.compose',
} as const;

// Default scopes for invoice extraction
export const DEFAULT_GMAIL_SCOPES = [
  GMAIL_SCOPES.READONLY,
  GMAIL_SCOPES.LABELS,
];

// Gmail API Configuration
export const GMAIL_API_CONFIG = {
  apiVersion: 'v1',
  maxResults: 100, // Maximum results per page
  maxBatchSize: 50, // Maximum batch size for API calls
  rateLimit: {
    requestsPerSecond: 10,
    requestsPerDay: 1000000,
  },
} as const;

// Token Configuration
export const GMAIL_TOKEN_CONFIG = {
  // Access token expires in 3600 seconds (1 hour)
  accessTokenExpiry: 3600,
  // Refresh token before it expires (5 minutes buffer)
  refreshBuffer: 300,
  // Refresh token valid for ~6 months (no fixed expiry but can be revoked)
  refreshTokenValidity: 180 * 24 * 60 * 60, // 180 days in seconds
} as const;

// Encryption Configuration
export const GMAIL_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  tagLength: 16, // 128 bits
} as const;

// PKCE Configuration
export const GMAIL_PKCE_CONFIG = {
  codeVerifierLength: 32, // 32 bytes = 256 bits
  stateLength: 32, // 32 bytes = 256 bits
  codeChallengeMethod: 'S256' as const, // SHA256
} as const;

// Email Search Queries
export const GMAIL_SEARCH_QUERIES = {
  // Common invoice patterns
  INVOICES: 'subject:(invoice OR rechnung OR factura OR facture) has:attachment',
  RECEIPTS: 'subject:(receipt OR quittung OR recibo) has:attachment',
  DOCUMENTS: 'has:attachment (filename:pdf OR filename:jpg OR filename:png)',

  // Specific providers (extend as needed)
  AMAZON: 'from:order-update@amazon.com has:attachment',
  PAYPAL: 'from:service@paypal.com subject:(invoice OR receipt)',
  STRIPE: 'from:receipts@stripe.com',
} as const;

// Gmail Labels
export const GMAIL_LABELS = {
  PROCESSED: 'CoachOS/Processed',
  INVOICE: 'CoachOS/Invoice',
  RECEIPT: 'CoachOS/Receipt',
  ERROR: 'CoachOS/Error',
} as const;

// Rate Limiting
export const OAUTH_RATE_LIMITS = {
  attemptsPerUserPerHour: 10,
  attemptsPerIpPerHour: 50,
} as const;

// Gmail API Endpoints
export const GMAIL_ENDPOINTS = {
  authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  revoke: 'https://oauth2.googleapis.com/revoke',
  userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
  api: 'https://gmail.googleapis.com/gmail/v1',
} as const;

// Error Messages
export const GMAIL_ERROR_MESSAGES = {
  INVALID_CONFIG: 'Invalid Gmail configuration',
  MISSING_ENV_VARS: 'Missing required environment variables for Gmail integration',
  INVALID_STATE: 'Invalid or expired state parameter',
  TOKEN_EXCHANGE_FAILED: 'Failed to exchange authorization code for tokens',
  TOKEN_REFRESH_FAILED: 'Failed to refresh access token',
  CONNECTION_NOT_FOUND: 'Gmail connection not found',
  REVOCATION_FAILED: 'Failed to revoke Gmail access',
  API_ERROR: 'Gmail API error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
} as const;

// Attachment MIME Types
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
] as const;
