/**
 * IMAP Service
 * Core IMAP client wrapper and connection management
 */

import { Injectable, Logger } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import * as crypto from 'crypto';
import {
  ImapConnectionConfig,
  ImapFolder,
  ImapMessage,
  ImapConnectionStatus,
  ImapSearchCriteria,
  EncryptedImapCredentials,
  ImapAttachment,
} from './imap.types';
import {
  DEFAULT_CONNECTION_TIMEOUT,
  DEFAULT_SOCKET_TIMEOUT,
  ENCRYPTION_ALGORITHM,
  IMAP_ERROR_MESSAGES,
  FETCH_FIELDS,
  IMAP_SERVER_PRESETS,
} from './imap.constants';

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);
  private readonly encryptionKey: Buffer;

  constructor() {
    // Use environment variable for encryption key
    const key = process.env.IMAP_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('IMAP_ENCRYPTION_KEY environment variable is required');
    }
    this.encryptionKey = Buffer.from(key, 'hex');
    if (this.encryptionKey.length !== 32) {
      throw new Error('IMAP_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
  }

  /**
   * Create and connect to IMAP server
   */
  async createConnection(config: ImapConnectionConfig): Promise<ImapFlow> {
    try {
      const client = new ImapFlow({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: {
          rejectUnauthorized: config.tls?.rejectUnauthorized ?? true,
          minVersion: config.tls?.minVersion ?? 'TLSv1.2',
        },
        logger: config.logger ?? false,
        connectionTimeout: DEFAULT_CONNECTION_TIMEOUT,
        greetingTimeout: DEFAULT_SOCKET_TIMEOUT,
      });

      await client.connect();
      this.logger.log(`Connected to IMAP server: ${config.host}`);

      return client;
    } catch (error) {
      this.logger.error(
        `Failed to connect to IMAP server: ${error.message}`,
        error.stack,
      );
      throw new Error(IMAP_ERROR_MESSAGES.CONNECTION_FAILED);
    }
  }

  /**
   * Test IMAP connection without persisting
   */
  async testConnection(config: ImapConnectionConfig): Promise<ImapConnectionStatus> {
    let client: ImapFlow | null = null;

    try {
      client = await this.createConnection(config);

      const status: ImapConnectionStatus = {
        connected: true,
        authenticated: true,
        capabilities: Array.from(client.capabilities || []),
      };

      return status;
    } catch (error) {
      this.logger.warn(`Connection test failed: ${error.message}`);
      return {
        connected: false,
        authenticated: false,
        error: error.message,
      };
    } finally {
      if (client) {
        try {
          await client.logout();
        } catch (error) {
          // Ignore logout errors
        }
      }
    }
  }

  /**
   * List all folders/mailboxes
   */
  async listFolders(client: ImapFlow): Promise<ImapFolder[]> {
    try {
      const folders: ImapFolder[] = [];

      for await (const mailbox of client.list()) {
        folders.push({
          path: mailbox.path,
          name: mailbox.name,
          specialUse: mailbox.specialUse,
          flags: mailbox.flags || [],
          listed: mailbox.listed,
          subscribed: mailbox.subscribed,
        });
      }

      return folders;
    } catch (error) {
      this.logger.error(`Failed to list folders: ${error.message}`, error.stack);
      throw new Error('Failed to list IMAP folders');
    }
  }

  /**
   * Select a folder/mailbox
   */
  async selectFolder(client: ImapFlow, folderPath: string): Promise<void> {
    try {
      const lock = await client.getMailboxLock(folderPath);
      try {
        this.logger.debug(`Selected folder: ${folderPath}`);
      } finally {
        lock.release();
      }
    } catch (error) {
      this.logger.error(`Failed to select folder: ${error.message}`, error.stack);
      throw new Error(IMAP_ERROR_MESSAGES.FOLDER_NOT_FOUND);
    }
  }

  /**
   * Fetch messages from a folder
   */
  async fetchMessages(
    client: ImapFlow,
    folderPath: string,
    options: {
      since?: Date;
      limit?: number;
      unseenOnly?: boolean;
    } = {},
  ): Promise<ImapMessage[]> {
    try {
      const lock = await client.getMailboxLock(folderPath);

      try {
        // Build search criteria
        const searchCriteria: any = {};

        if (options.since) {
          searchCriteria.since = options.since;
        }

        if (options.unseenOnly) {
          searchCriteria.seen = false;
        }

        // Search for messages
        const messages: ImapMessage[] = [];

        for await (const message of client.fetch(
          searchCriteria,
          {
            envelope: true,
            bodyStructure: true,
            source: false,
            flags: true,
            internalDate: true,
            size: true,
            uid: true,
          },
          { uid: true },
        )) {
          messages.push(this.mapToImapMessage(message));

          if (options.limit && messages.length >= options.limit) {
            break;
          }
        }

        return messages;
      } finally {
        lock.release();
      }
    } catch (error) {
      this.logger.error(`Failed to fetch messages: ${error.message}`, error.stack);
      throw new Error('Failed to fetch messages from IMAP server');
    }
  }

  /**
   * Fetch a single message by UID
   */
  async fetchMessage(
    client: ImapFlow,
    folderPath: string,
    uid: number,
    includeBody: boolean = false,
  ): Promise<ImapMessage | null> {
    try {
      const lock = await client.getMailboxLock(folderPath);

      try {
        const fetchOptions: any = {
          envelope: true,
          bodyStructure: true,
          flags: true,
          internalDate: true,
          size: true,
          uid: true,
        };

        if (includeBody) {
          fetchOptions.source = true;
        }

        const message = await client.fetchOne(String(uid), fetchOptions, {
          uid: true,
        });

        if (!message) {
          return null;
        }

        return this.mapToImapMessage(message);
      } finally {
        lock.release();
      }
    } catch (error) {
      this.logger.error(`Failed to fetch message: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Search messages by criteria
   */
  async searchMessages(
    client: ImapFlow,
    folderPath: string,
    criteria: ImapSearchCriteria,
  ): Promise<number[]> {
    try {
      const lock = await client.getMailboxLock(folderPath);

      try {
        const searchQuery: any = {};

        if (criteria.from) searchQuery.from = criteria.from;
        if (criteria.to) searchQuery.to = criteria.to;
        if (criteria.subject) searchQuery.subject = criteria.subject;
        if (criteria.body) searchQuery.body = criteria.body;
        if (criteria.since) searchQuery.since = criteria.since;
        if (criteria.before) searchQuery.before = criteria.before;
        if (criteria.seen !== undefined) searchQuery.seen = criteria.seen;
        if (criteria.flagged !== undefined) searchQuery.flagged = criteria.flagged;

        const uids = await client.search(searchQuery, { uid: true });
        return Array.isArray(uids) ? uids : [];
      } finally {
        lock.release();
      }
    } catch (error) {
      this.logger.error(`Failed to search messages: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Mark messages as seen
   */
  async markAsSeen(
    client: ImapFlow,
    folderPath: string,
    uids: number[],
  ): Promise<void> {
    try {
      const lock = await client.getMailboxLock(folderPath);

      try {
        await client.messageFlagsAdd(
          { uid: uids },
          ['\\Seen'],
          { uid: true },
        );
      } finally {
        lock.release();
      }
    } catch (error) {
      this.logger.error(`Failed to mark messages as seen: ${error.message}`, error.stack);
    }
  }

  /**
   * Download attachment from message
   */
  async downloadAttachment(
    client: ImapFlow,
    folderPath: string,
    uid: number,
    partId: string,
  ): Promise<Buffer | null> {
    try {
      const lock = await client.getMailboxLock(folderPath);

      try {
        const { content } = await client.download(String(uid), partId, {
          uid: true,
        });

        const chunks: Buffer[] = [];
        for await (const chunk of content) {
          chunks.push(chunk);
        }

        return Buffer.concat(chunks);
      } finally {
        lock.release();
      }
    } catch (error) {
      this.logger.error(`Failed to download attachment: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Encrypt password for storage
   */
  encryptPassword(password: string): EncryptedImapCredentials {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

      let encrypted = cipher.update(password, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encryptedPassword: encrypted,
        iv,
        authTag,
      };
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new Error(IMAP_ERROR_MESSAGES.ENCRYPTION_ERROR);
    }
  }

  /**
   * Decrypt password from storage
   */
  decryptPassword(credentials: EncryptedImapCredentials): string {
    try {
      const decipher = crypto.createDecipheriv(
        ENCRYPTION_ALGORITHM,
        this.encryptionKey,
        credentials.iv,
      );
      decipher.setAuthTag(credentials.authTag);

      let decrypted = decipher.update(credentials.encryptedPassword, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`, error.stack);
      throw new Error(IMAP_ERROR_MESSAGES.ENCRYPTION_ERROR);
    }
  }

  /**
   * Get preset configuration for known email providers
   */
  getPresetConfig(presetName: string): ImapConnectionConfig | null {
    const preset = IMAP_SERVER_PRESETS[presetName.toUpperCase()];
    if (!preset) {
      return null;
    }

    return {
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
      auth: {
        user: '',
        pass: '',
      },
    };
  }

  /**
   * Map ImapFlow message to our ImapMessage type
   */
  private mapToImapMessage(message: any): ImapMessage {
    return {
      uid: message.uid,
      seq: message.seq,
      flags: message.flags || [],
      internalDate: message.internalDate,
      size: message.size,
      envelope: message.envelope
        ? {
            date: message.envelope.date,
            subject: message.envelope.subject,
            from: message.envelope.from || [],
            sender: message.envelope.sender || [],
            replyTo: message.envelope.replyTo || [],
            to: message.envelope.to || [],
            cc: message.envelope.cc || [],
            bcc: message.envelope.bcc || [],
            messageId: message.envelope.messageId,
            inReplyTo: message.envelope.inReplyTo,
          }
        : undefined,
      bodyStructure: message.bodyStructure,
    };
  }

  /**
   * Close IMAP connection safely
   */
  async closeConnection(client: ImapFlow): Promise<void> {
    try {
      await client.logout();
      this.logger.debug('IMAP connection closed');
    } catch (error) {
      this.logger.warn(`Error closing IMAP connection: ${error.message}`);
    }
  }
}
