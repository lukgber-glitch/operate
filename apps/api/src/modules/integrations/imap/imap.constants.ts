/**
 * IMAP Constants
 * Pre-configured IMAP server settings for major email providers
 */

import { ImapServerPreset } from './imap.types';

/**
 * Pre-configured IMAP server settings for popular email providers
 */
export const IMAP_SERVER_PRESETS: Record<string, ImapServerPreset> = {
  GMAIL: {
    name: 'Gmail',
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    requiresAppPassword: true,
    oauth2Support: true,
    description: 'Google Gmail (requires App Password or OAuth2)',
  },
  OUTLOOK: {
    name: 'Outlook.com / Office 365',
    host: 'outlook.office365.com',
    port: 993,
    secure: true,
    requiresAppPassword: false,
    oauth2Support: true,
    description: 'Microsoft Outlook and Office 365',
  },
  YAHOO: {
    name: 'Yahoo Mail',
    host: 'imap.mail.yahoo.com',
    port: 993,
    secure: true,
    requiresAppPassword: true,
    oauth2Support: false,
    description: 'Yahoo Mail (requires App Password)',
  },
  AOL: {
    name: 'AOL Mail',
    host: 'imap.aol.com',
    port: 993,
    secure: true,
    requiresAppPassword: true,
    oauth2Support: false,
    description: 'AOL Mail (requires App Password)',
  },
  ICLOUD: {
    name: 'iCloud Mail',
    host: 'imap.mail.me.com',
    port: 993,
    secure: true,
    requiresAppPassword: true,
    oauth2Support: false,
    description: 'Apple iCloud Mail (requires App-Specific Password)',
  },
  ZOHO: {
    name: 'Zoho Mail',
    host: 'imap.zoho.com',
    port: 993,
    secure: true,
    requiresAppPassword: false,
    oauth2Support: false,
    description: 'Zoho Mail',
  },
  GMX: {
    name: 'GMX Mail',
    host: 'imap.gmx.com',
    port: 993,
    secure: true,
    requiresAppPassword: false,
    oauth2Support: false,
    description: 'GMX Mail',
  },
  FASTMAIL: {
    name: 'FastMail',
    host: 'imap.fastmail.com',
    port: 993,
    secure: true,
    requiresAppPassword: false,
    oauth2Support: false,
    description: 'FastMail',
  },
  PROTONMAIL_BRIDGE: {
    name: 'ProtonMail Bridge',
    host: '127.0.0.1',
    port: 1143,
    secure: false,
    requiresAppPassword: false,
    oauth2Support: false,
    description: 'ProtonMail via Bridge (requires ProtonMail Bridge)',
  },
};

/**
 * Default IMAP connection timeout in milliseconds
 */
export const DEFAULT_CONNECTION_TIMEOUT = 30000; // 30 seconds

/**
 * Default IMAP socket timeout in milliseconds
 */
export const DEFAULT_SOCKET_TIMEOUT = 60000; // 60 seconds

/**
 * Maximum time to keep IDLE connection alive (in seconds)
 */
export const MAX_IDLE_TIME = 1740; // 29 minutes (just under 30 min RFC requirement)

/**
 * Maximum number of messages to fetch in a single sync operation
 */
export const DEFAULT_SYNC_LIMIT = 100;

/**
 * Maximum attachment size to download (in bytes) - 10MB default
 */
export const DEFAULT_MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

/**
 * Rate limiting - maximum IMAP operations per minute
 */
export const MAX_OPERATIONS_PER_MINUTE = 60;

/**
 * Connection pool configuration
 */
export const CONNECTION_POOL_CONFIG = {
  min: 0,
  max: 5,
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 30000,
};

/**
 * Default folders to sync
 */
export const DEFAULT_SYNC_FOLDERS = ['INBOX'];

/**
 * IMAP encryption algorithm
 */
export const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * IMAP standard flags
 */
export const IMAP_STANDARD_FLAGS = {
  SEEN: '\\Seen',
  ANSWERED: '\\Answered',
  FLAGGED: '\\Flagged',
  DELETED: '\\Deleted',
  DRAFT: '\\Draft',
  RECENT: '\\Recent',
} as const;

/**
 * IMAP special use folders (RFC 6154)
 */
export const IMAP_SPECIAL_USE = {
  ALL: '\\All',
  ARCHIVE: '\\Archive',
  DRAFTS: '\\Drafts',
  FLAGGED: '\\Flagged',
  JUNK: '\\Junk',
  SENT: '\\Sent',
  TRASH: '\\Trash',
  INBOX: 'INBOX',
} as const;

/**
 * Common folder name mappings
 */
export const FOLDER_NAME_MAPPINGS: Record<string, string[]> = {
  INBOX: ['INBOX', 'Inbox'],
  SENT: ['Sent', 'Sent Items', 'Sent Messages', '[Gmail]/Sent Mail'],
  DRAFTS: ['Drafts', 'Draft', '[Gmail]/Drafts'],
  TRASH: ['Trash', 'Deleted', 'Deleted Items', '[Gmail]/Trash'],
  SPAM: ['Spam', 'Junk', 'Junk E-mail', '[Gmail]/Spam'],
  ARCHIVE: ['Archive', 'All Mail', '[Gmail]/All Mail'],
};

/**
 * Email sync batch sizes
 */
export const SYNC_BATCH_SIZES = {
  INITIAL: 50, // Initial sync
  INCREMENTAL: 20, // Subsequent syncs
  REAL_TIME: 1, // Real-time (IDLE) sync
};

/**
 * Retry configuration for failed operations
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
};

/**
 * IMAP capabilities we check for
 */
export const REQUIRED_CAPABILITIES = ['IMAP4rev1'];

export const OPTIONAL_CAPABILITIES = [
  'IDLE', // Push notifications
  'MOVE', // Move messages between folders
  'UIDPLUS', // Extended UID support
  'QUOTA', // Mailbox quota
  'CHILDREN', // Hierarchy info
  'NAMESPACE', // Namespace support
];

/**
 * Error messages
 */
export const IMAP_ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to connect to IMAP server',
  AUTHENTICATION_FAILED: 'IMAP authentication failed',
  FOLDER_NOT_FOUND: 'Specified folder not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  OPERATION_TIMEOUT: 'IMAP operation timed out',
  INVALID_CREDENTIALS: 'Invalid IMAP credentials',
  SERVER_ERROR: 'IMAP server error',
  NETWORK_ERROR: 'Network connection error',
  ENCRYPTION_ERROR: 'Failed to encrypt/decrypt credentials',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
};

/**
 * IMAP fetch fields
 */
export const FETCH_FIELDS = {
  HEADERS: 'BODY.PEEK[HEADER]',
  BODY_TEXT: 'BODY.PEEK[TEXT]',
  BODY_FULL: 'BODY.PEEK[]',
  FLAGS: 'FLAGS',
  ENVELOPE: 'ENVELOPE',
  BODYSTRUCTURE: 'BODYSTRUCTURE',
  INTERNALDATE: 'INTERNALDATE',
  RFC822_SIZE: 'RFC822.SIZE',
  UID: 'UID',
};
