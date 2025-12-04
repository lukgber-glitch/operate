/**
 * IMAP Sync Service
 * Handles email synchronization and storage
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ImapService } from './imap.service';
import { ImapConnectionService } from './imap-connection.service';
import { ImapParserService } from './imap-parser.service';
import {
  ImapSyncOptions,
  ImapSyncResult,
  ImapMessage,
  ImapIdleOptions,
} from './imap.types';
import {
  DEFAULT_SYNC_FOLDERS,
  DEFAULT_SYNC_LIMIT,
  DEFAULT_MAX_ATTACHMENT_SIZE,
  SYNC_BATCH_SIZES,
  MAX_IDLE_TIME,
} from './imap.constants';

@Injectable()
export class ImapSyncService {
  private readonly logger = new Logger(ImapSyncService.name);
  private readonly activeIdleConnections = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly imapService: ImapService,
    private readonly connectionService: ImapConnectionService,
    private readonly parserService: ImapParserService,
  ) {}

  /**
   * Sync emails for a connection
   */
  async syncEmails(
    connectionId: string,
    options: ImapSyncOptions = {},
  ): Promise<ImapSyncResult> {
    const startTime = Date.now();
    let messagesProcessed = 0;
    let messagesSaved = 0;
    const errors: string[] = [];

    try {
      // Get IMAP connection
      const client = await this.connectionService.getConnection(connectionId);

      // Get email connection details
      const emailConnection = await this.prisma.emailConnection.findUnique({
        where: { id: connectionId },
      });

      if (!emailConnection) {
        throw new Error('Email connection not found');
      }

      // Determine which folders to sync
      const foldersToSync = options.folder
        ? [options.folder]
        : DEFAULT_SYNC_FOLDERS;

      // Get last sync date
      const lastSyncDate = options.since || emailConnection.lastSyncedAt || undefined;

      // Sync each folder
      for (const folder of foldersToSync) {
        try {
          const folderResult = await this.syncFolder(
            client,
            connectionId,
            emailConnection.orgId,
            folder,
            {
              ...options,
              since: lastSyncDate,
            },
          );

          messagesProcessed += folderResult.messagesProcessed;
          messagesSaved += folderResult.messagesSaved;
          errors.push(...folderResult.errors);
        } catch (error) {
          this.logger.error(
            `Failed to sync folder ${folder}: ${error.message}`,
            error.stack,
          );
          errors.push(`Folder ${folder}: ${error.message}`);
        }
      }

      // Update last synced timestamp
      await this.prisma.emailConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: errors.length > 0 ? 'ERROR' : 'SYNCED',
        },
      });

      // Release connection back to pool
      this.connectionService.releaseConnection(connectionId);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Sync completed for ${connectionId}: ${messagesSaved}/${messagesProcessed} messages saved in ${duration}ms`,
      );

      return {
        success: errors.length === 0,
        messagesProcessed,
        messagesSaved,
        errors,
        lastSyncDate: new Date(),
      };
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`, error.stack);

      // Update sync status to error
      await this.prisma.emailConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: 'ERROR',
        },
      });

      return {
        success: false,
        messagesProcessed,
        messagesSaved,
        errors: [...errors, error.message],
        lastSyncDate: new Date(),
      };
    }
  }

  /**
   * Sync a specific folder
   */
  private async syncFolder(
    client: any,
    connectionId: string,
    orgId: string,
    folder: string,
    options: ImapSyncOptions,
  ): Promise<ImapSyncResult> {
    let messagesProcessed = 0;
    let messagesSaved = 0;
    const errors: string[] = [];

    try {
      // Fetch messages from folder
      const messages = await this.imapService.fetchMessages(client, folder, {
        since: options.since,
        limit: options.limit || DEFAULT_SYNC_LIMIT,
        unseenOnly: options.unseenOnly,
      });

      this.logger.debug(`Fetched ${messages.length} messages from ${folder}`);

      // Process messages in batches
      const batchSize = SYNC_BATCH_SIZES.INCREMENTAL;

      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);

        for (const message of batch) {
          try {
            await this.saveMessage(
              client,
              connectionId,
              orgId,
              folder,
              message,
              options,
            );
            messagesSaved++;
          } catch (error) {
            this.logger.error(
              `Failed to save message ${message.uid}: ${error.message}`,
              error.stack,
            );
            errors.push(`Message ${message.uid}: ${error.message}`);
          }
          messagesProcessed++;
        }
      }

      return {
        success: errors.length === 0,
        messagesProcessed,
        messagesSaved,
        errors,
        lastSyncDate: new Date(),
      };
    } catch (error) {
      this.logger.error(`Folder sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Save a message to database
   */
  private async saveMessage(
    client: any,
    connectionId: string,
    orgId: string,
    folder: string,
    message: ImapMessage,
    options: ImapSyncOptions,
  ): Promise<void> {
    try {
      // Check if message already exists
      const existing = await this.prisma.email.findFirst({
        where: {
          messageId: message.envelope?.messageId,
          emailConnectionId: connectionId,
        },
      });

      if (existing) {
        // Update flags if changed
        await this.prisma.email.update({
          where: { id: existing.id },
          data: {
            flags: message.flags,
            isRead: message.flags.includes('\\Seen'),
          },
        });
        return;
      }

      // Fetch full message with body
      const fullMessage = await this.imapService.fetchMessage(
        client,
        folder,
        message.uid,
        true,
      );

      if (!fullMessage || !fullMessage.body) {
        throw new Error('Failed to fetch full message');
      }

      // Parse email content
      const parsed = await this.parserService.parseEmail(fullMessage.body);
      const { text, html } = this.parserService.extractTextContent(parsed);
      const metadata = this.parserService.extractMetadata(parsed);

      // Handle attachments if requested
      let attachments: any[] = [];
      if (options.includeAttachments) {
        attachments = this.parserService.extractAttachments(
          parsed,
          options.maxAttachmentSize || DEFAULT_MAX_ATTACHMENT_SIZE,
        );
      }

      // Save email to database
      const email = await this.prisma.email.create({
        data: {
          emailConnectionId: connectionId,
          orgId,
          messageId: message.envelope?.messageId || `${connectionId}-${message.uid}`,
          threadId: this.parserService.calculateThreadId(
            message.envelope?.messageId || '',
            metadata.references,
            metadata.inReplyTo,
          ),
          subject: this.parserService.parseSubject(message.envelope?.subject),
          from: message.envelope?.from?.[0]?.address || '',
          fromName: message.envelope?.from?.[0]?.name,
          to: message.envelope?.to?.map((a) => a.address) || [],
          cc: message.envelope?.cc?.map((a) => a.address) || [],
          bcc: message.envelope?.bcc?.map((a) => a.address) || [],
          replyTo: message.envelope?.replyTo?.map((a) => a.address) || [],
          date: message.envelope?.date || message.internalDate,
          textContent: text,
          htmlContent: html,
          folder,
          flags: message.flags,
          isRead: message.flags.includes('\\Seen'),
          isFlagged: message.flags.includes('\\Flagged'),
          isDraft: message.flags.includes('\\Draft'),
          size: message.size,
          metadata: {
            ...metadata,
            uid: message.uid,
            seq: message.seq,
          },
        },
      });

      // Save attachments
      if (attachments.length > 0) {
        await this.saveAttachments(email.id, attachments);
      }

      this.logger.debug(`Saved message: ${message.envelope?.subject || 'No subject'}`);
    } catch (error) {
      this.logger.error(`Failed to save message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Save email attachments
   */
  private async saveAttachments(emailId: string, attachments: any[]): Promise<void> {
    for (const attachment of attachments) {
      try {
        // In a real implementation, you'd upload to S3 or similar
        // For now, we'll just store metadata
        await this.prisma.emailAttachment.create({
          data: {
            emailId,
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            contentId: attachment.contentId,
            // Store attachment in external storage and save URL
            // url: await uploadToStorage(attachment.content),
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to save attachment: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Start IDLE mode for real-time updates
   */
  async startIdleSync(
    connectionId: string,
    options: ImapIdleOptions = {},
  ): Promise<void> {
    try {
      // Check if already in IDLE mode
      if (this.activeIdleConnections.has(connectionId)) {
        this.logger.warn(`IDLE already active for connection ${connectionId}`);
        return;
      }

      const client = await this.connectionService.getConnection(connectionId);
      const folder = options.folder || 'INBOX';

      // Select folder and start IDLE
      await this.imapService.selectFolder(client, folder);

      // Set up IDLE listener
      const idleHandler = async (event: any) => {
        if (event.type === 'exists') {
          // New message arrived
          this.logger.debug(`New message in ${folder} for ${connectionId}`);

          // Trigger sync for new messages
          await this.syncEmails(connectionId, {
            folder,
            unseenOnly: true,
            limit: 10,
          });
        }
      };

      client.on('exists', idleHandler);

      // Start IDLE
      await client.idle();

      // Store reference
      this.activeIdleConnections.set(connectionId, {
        client,
        folder,
        handler: idleHandler,
        startedAt: new Date(),
      });

      this.logger.log(`Started IDLE sync for ${connectionId} on folder ${folder}`);
    } catch (error) {
      this.logger.error(`Failed to start IDLE: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Stop IDLE mode
   */
  async stopIdleSync(connectionId: string): Promise<void> {
    const idle = this.activeIdleConnections.get(connectionId);
    if (!idle) {
      return;
    }

    try {
      idle.client.off('exists', idle.handler);
      // IDLE will be automatically stopped when connection is released
      this.activeIdleConnections.delete(connectionId);
      this.connectionService.releaseConnection(connectionId);

      this.logger.log(`Stopped IDLE sync for ${connectionId}`);
    } catch (error) {
      this.logger.error(`Failed to stop IDLE: ${error.message}`, error.stack);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(connectionId: string): Promise<{
    isIdle: boolean;
    lastSyncedAt: Date | null;
    syncStatus: string;
  }> {
    const emailConnection = await this.prisma.emailConnection.findUnique({
      where: { id: connectionId },
    });

    if (!emailConnection) {
      throw new Error('Email connection not found');
    }

    return {
      isIdle: this.activeIdleConnections.has(connectionId),
      lastSyncedAt: emailConnection.lastSyncedAt,
      syncStatus: emailConnection.syncStatus || 'PENDING',
    };
  }

  /**
   * Clean up on module destroy
   */
  async onModuleDestroy() {
    for (const connectionId of this.activeIdleConnections.keys()) {
      await this.stopIdleSync(connectionId);
    }
  }
}
