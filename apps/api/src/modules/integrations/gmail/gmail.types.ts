/**
 * Gmail Integration Types
 * Type definitions for Gmail OAuth2 and API operations
 */

import { EmailProvider, EmailSyncStatus } from '@prisma/client';

// ============================================================================
// OAuth Types
// ============================================================================

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

export interface OAuthState {
  state: string;
  codeVerifier: string;
  userId: string;
  orgId: string;
  createdAt: number;
  expiresAt: number;
}

export interface GmailAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface GmailCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface GmailTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// ============================================================================
// Encryption Types
// ============================================================================

export interface EncryptedToken {
  encryptedData: string;
  iv: Buffer;
  tag: Buffer;
}

export interface DecryptedTokens {
  accessToken: string;
  refreshToken?: string;
}

// ============================================================================
// Connection Types
// ============================================================================

export interface GmailConnectionInfo {
  id: string;
  userId: string;
  orgId: string;
  provider: EmailProvider;
  email: string;
  scopes: string[];
  syncEnabled: boolean;
  syncStatus: EmailSyncStatus;
  lastSyncAt?: Date;
  syncError?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenResult {
  success: boolean;
  tokenExpiresAt?: Date;
  error?: string;
}

export interface DisconnectResult {
  success: boolean;
  message: string;
}

// ============================================================================
// Gmail API Types
// ============================================================================

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
  sizeEstimate?: number;
  raw?: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessageBody;
  parts?: GmailMessagePart[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessageBody {
  attachmentId?: string;
  size?: number;
  data?: string; // base64url encoded
}

export interface GmailAttachment {
  attachmentId: string;
  size: number;
  data: string; // base64url encoded
}

export interface GmailListMessagesResponse {
  messages?: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  type?: string;
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor?: string;
    backgroundColor?: string;
  };
}

export interface GmailBatchResponse {
  messages: GmailMessage[];
  errors: Array<{
    messageId: string;
    error: string;
  }>;
}

// ============================================================================
// Search and Filter Types
// ============================================================================

export interface GmailSearchOptions {
  query: string;
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
  includeSpamTrash?: boolean;
}

export interface GmailSearchResult {
  messages: GmailMessage[];
  nextPageToken?: string;
  totalResults?: number;
}

export interface InvoiceSearchOptions {
  since?: Date;
  until?: Date;
  from?: string;
  hasAttachment?: boolean;
  maxResults?: number;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface GmailAuditLog {
  action: 'CONNECT' | 'DISCONNECT' | 'TOKEN_REFRESH' | 'SYNC' | 'EMAIL_READ' | 'ATTACHMENT_DOWNLOAD' | 'ERROR';
  endpoint?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Configuration Validation Types
// ============================================================================

export interface ValidatedGmailConfig extends GmailConfig {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitInfo {
  userId: string;
  attempts: number;
  resetAt: Date;
}

// ============================================================================
// Email Processing Types
// ============================================================================

export interface ProcessedEmail {
  messageId: string;
  subject?: string;
  from?: string;
  date?: Date;
  hasAttachments: boolean;
  attachments: ProcessedAttachment[];
}

export interface ProcessedAttachment {
  filename: string;
  mimeType: string;
  size: number;
  data?: Buffer;
  attachmentId: string;
}
