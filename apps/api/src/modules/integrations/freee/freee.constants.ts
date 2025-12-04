/**
 * freee API Constants
 * https://developer.freee.co.jp/docs
 */

/**
 * freee API Base URLs
 */
export const FREEE_API_BASE_URL = 'https://api.freee.co.jp';
export const FREEE_AUTH_BASE_URL = 'https://accounts.secure.freee.co.jp';

/**
 * freee OAuth2 Endpoints
 */
export const FREEE_ENDPOINTS = {
  // OAuth2
  authorize: `${FREEE_AUTH_BASE_URL}/public_api/authorize`,
  token: `${FREEE_AUTH_BASE_URL}/public_api/token`,

  // API Endpoints
  companies: `${FREEE_API_BASE_URL}/api/1/companies`,
  partners: `${FREEE_API_BASE_URL}/api/1/partners`, // 取引先 (Contacts)
  invoices: `${FREEE_API_BASE_URL}/api/1/invoices`, // 請求書
  deals: `${FREEE_API_BASE_URL}/api/1/deals`, // 取引 (Transactions)
  walletables: `${FREEE_API_BASE_URL}/api/1/walletables`, // 口座 (Bank Accounts)
  walletTxns: `${FREEE_API_BASE_URL}/api/1/wallet_txns`, // 明細 (Bank Transactions)
  items: `${FREEE_API_BASE_URL}/api/1/items`, // 品目
  sections: `${FREEE_API_BASE_URL}/api/1/sections`, // 部門
  tags: `${FREEE_API_BASE_URL}/api/1/tags`, // メモタグ
  accountItems: `${FREEE_API_BASE_URL}/api/1/account_items`, // 勘定科目
} as const;

/**
 * freee OAuth2 Scopes
 */
export const FREEE_SCOPES = {
  read: 'read',
  write: 'write',
} as const;

/**
 * Default OAuth2 scope
 * Requesting both read and write access
 */
export const DEFAULT_FREEE_SCOPE = 'read write';

/**
 * Token expiry times (in seconds)
 */
export const FREEE_TOKEN_EXPIRY = {
  accessToken: 86400, // 24 hours (freee default)
  refreshToken: 7776000, // 90 days (freee default)
} as const;

/**
 * Rate limiting configuration
 * freee API: 600 requests per 10 minutes per company
 */
export const FREEE_RATE_LIMIT = {
  requestsPerWindow: 600,
  windowMs: 10 * 60 * 1000, // 10 minutes
  requestsPerSecond: 1, // Conservative rate to avoid bursts
} as const;

/**
 * AES-256-GCM encryption configuration
 */
export const FREEE_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  tagLength: 16, // 128 bits
} as const;

/**
 * PKCE configuration
 */
export const FREEE_PKCE_CONFIG = {
  codeVerifierLength: 32, // 32 bytes = 64 hex chars
  stateLength: 16, // 16 bytes = 32 hex chars
  codeChallengeMethod: 'S256' as const,
} as const;

/**
 * Sync job configuration
 */
export const FREEE_SYNC_CONFIG = {
  // Full sync interval (daily at 2 AM JST)
  fullSyncCron: '0 2 * * *',

  // Incremental sync interval (every 30 minutes)
  incrementalSyncCron: '*/30 * * * *',

  // Batch size for sync operations
  batchSize: 100,

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryBackoffMultiplier: 2,
} as const;

/**
 * Japanese fiscal year configuration
 * Default: April 1 - March 31
 */
export const JAPANESE_FISCAL_YEAR = {
  startMonth: 4, // April
  startDay: 1,
  endMonth: 3, // March
  endDay: 31,
} as const;

/**
 * freee API date formats
 */
export const FREEE_DATE_FORMATS = {
  date: 'YYYY-MM-DD', // 2024-04-01
  datetime: 'YYYY-MM-DD HH:mm:ss', // 2024-04-01 09:30:00
  fiscalYear: 'YYYY', // 2024 (represents FY2024: April 2024 - March 2025)
} as const;

/**
 * freee entity types
 */
export const FREEE_ENTITY_TYPES = {
  partner: 'partner', // 取引先
  invoice: 'invoice', // 請求書
  deal: 'deal', // 取引
  walletTxn: 'wallet_txn', // 明細
  item: 'item', // 品目
  section: 'section', // 部門
  tag: 'tag', // メモタグ
  accountItem: 'account_item', // 勘定科目
} as const;

/**
 * freee partner (contact) types
 */
export const FREEE_PARTNER_TYPES = {
  customer: 'customer', // 顧客
  vendor: 'vendor', // 仕入先
  employee: 'employee', // 従業員
} as const;

/**
 * freee invoice status
 */
export const FREEE_INVOICE_STATUS = {
  draft: 'draft', // 下書き
  applying: 'applying', // 申請中
  remanded: 'remanded', // 差し戻し
  rejected: 'rejected', // 却下
  approved: 'approved', // 承認済み
  submitted: 'submitted', // 送信済み
} as const;

/**
 * freee deal status
 */
export const FREEE_DEAL_STATUS = {
  settled: 'settled', // 決済済み
  unsettled: 'unsettled', // 未決済
} as const;

/**
 * freee deal type
 */
export const FREEE_DEAL_TYPE = {
  income: 'income', // 収入
  expense: 'expense', // 支出
} as const;

/**
 * Connection status
 */
export enum FreeeConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
}

/**
 * Sync status
 */
export enum FreeeSyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Sync direction
 */
export enum FreeeSyncDirection {
  IMPORT = 'IMPORT', // freee → Operate
  EXPORT = 'EXPORT', // Operate → freee
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

/**
 * Webhook event types (if freee supports webhooks)
 */
export const FREEE_WEBHOOK_EVENTS = {
  partnerCreated: 'partner.created',
  partnerUpdated: 'partner.updated',
  partnerDeleted: 'partner.deleted',
  invoiceCreated: 'invoice.created',
  invoiceUpdated: 'invoice.updated',
  invoiceDeleted: 'invoice.deleted',
  dealCreated: 'deal.created',
  dealUpdated: 'deal.updated',
  dealDeleted: 'deal.deleted',
} as const;

/**
 * Error codes
 */
export const FREEE_ERROR_CODES = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  notFound: 'not_found',
  validationError: 'validation_error',
  rateLimitExceeded: 'rate_limit_exceeded',
  serverError: 'server_error',
  tokenExpired: 'token_expired',
  invalidGrant: 'invalid_grant',
} as const;
