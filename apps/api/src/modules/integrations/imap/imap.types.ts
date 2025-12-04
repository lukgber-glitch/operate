/**
 * IMAP Types and Interfaces
 * TypeScript type definitions for IMAP email integration
 */

export interface ImapConnectionConfig {
  host: string;
  port: number;
  secure: boolean; // Use TLS
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
    minVersion?: string;
  };
  logger?: boolean;
}

export interface ImapServerPreset {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  requiresAppPassword?: boolean;
  oauth2Support?: boolean;
  description?: string;
}

export interface ImapFolder {
  path: string;
  name: string;
  specialUse?: string;
  flags?: string[];
  listed: boolean;
  subscribed: boolean;
  permanentFlags?: string[];
  messages?: number;
  uidNext?: number;
  uidValidity?: number;
  unseen?: number;
}

export interface ImapMessage {
  uid: number;
  seq: number;
  flags: string[];
  internalDate: Date;
  size: number;
  envelope?: {
    date: Date;
    subject: string;
    from: EmailAddress[];
    sender: EmailAddress[];
    replyTo: EmailAddress[];
    to: EmailAddress[];
    cc: EmailAddress[];
    bcc: EmailAddress[];
    messageId: string;
    inReplyTo?: string;
  };
  bodyStructure?: any;
  body?: string;
  html?: string;
  text?: string;
  attachments?: ImapAttachment[];
  headers?: Map<string, string>;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface ImapAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
  disposition?: string;
  content?: Buffer;
}

export interface ImapSyncOptions {
  folder?: string;
  since?: Date;
  limit?: number;
  unseenOnly?: boolean;
  includeAttachments?: boolean;
  maxAttachmentSize?: number; // in bytes
}

export interface ImapSyncResult {
  success: boolean;
  messagesProcessed: number;
  messagesSaved: number;
  errors: string[];
  lastSyncDate: Date;
}

export interface ImapConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  selectedMailbox?: string;
  capabilities?: string[];
  error?: string;
}

export interface ImapSearchCriteria {
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  since?: Date;
  before?: Date;
  seen?: boolean;
  answered?: boolean;
  flagged?: boolean;
  draft?: boolean;
  deleted?: boolean;
  larger?: number;
  smaller?: number;
  uid?: string;
}

export interface ImapConnectionPoolStats {
  active: number;
  idle: number;
  waiting: number;
  total: number;
}

export interface EncryptedImapCredentials {
  encryptedPassword: string;
  iv: Buffer;
  authTag: Buffer;
}

export enum ImapConnectionEvent {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  MAIL_ARRIVED = 'mail_arrived',
  FLAGS_UPDATED = 'flags_updated',
}

export enum ImapFolderSpecialUse {
  ALL = '\\All',
  ARCHIVE = '\\Archive',
  DRAFTS = '\\Drafts',
  FLAGGED = '\\Flagged',
  JUNK = '\\Junk',
  SENT = '\\Sent',
  TRASH = '\\Trash',
}

export interface ImapIdleOptions {
  folder?: string;
  onNewMail?: (message: ImapMessage) => Promise<void>;
  onFlagsUpdate?: (uid: number, flags: string[]) => Promise<void>;
  maxIdleTime?: number; // in seconds
}

export interface ImapQuota {
  path: string;
  storage: {
    used: number;
    limit: number;
  };
  message?: {
    used: number;
    limit: number;
  };
}
