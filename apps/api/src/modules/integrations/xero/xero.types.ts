/**
 * Xero OAuth2 and Integration Types
 */

/**
 * Encrypted token storage
 */
export interface EncryptedToken {
  encryptedData: string;
  iv: Buffer;
  tag: Buffer;
}

/**
 * PKCE challenge for OAuth2
 */
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

/**
 * OAuth state stored during authorization
 */
export interface OAuthState {
  state: string;
  codeVerifier: string;
  orgId: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Xero OAuth2 token response
 */
export interface XeroToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
}

/**
 * Xero tenant (organization) information
 */
export interface XeroTenant {
  id: string; // Tenant ID
  tenantId: string; // Same as id
  tenantType: string; // e.g., 'ORGANISATION'
  tenantName: string;
  createdDateUtc: string;
  updatedDateUtc: string;
}

/**
 * Xero connection information
 */
export interface XeroConnectionInfo {
  id: string;
  orgId: string;
  xeroTenantId: string;
  xeroOrgName: string | null;
  status: string;
  isConnected: boolean;
  lastSyncAt: Date | null;
  lastError: string | null;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  connectedAt: Date;
}

/**
 * OAuth authorization URL response
 */
export interface XeroAuthUrlResponse {
  authUrl: string;
  state: string;
}

/**
 * OAuth callback query parameters
 */
export interface XeroCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/**
 * Token refresh result
 */
export interface RefreshTokenResult {
  success: boolean;
  tokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  error?: string;
}

/**
 * Disconnect result
 */
export interface DisconnectResult {
  success: boolean;
  message: string;
}

/**
 * Decrypted tokens for internal use
 */
export interface DecryptedTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Xero audit log entry
 */
export interface XeroAuditLog {
  action: string;
  endpoint?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Xero API error response
 */
export interface XeroApiError {
  Type: string;
  Title: string;
  Status: number;
  Detail: string;
  Instance?: string;
  ValidationErrors?: Array<{
    Message: string;
    Path: string;
  }>;
}

/**
 * Connection status enum
 */
export enum XeroConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
}
