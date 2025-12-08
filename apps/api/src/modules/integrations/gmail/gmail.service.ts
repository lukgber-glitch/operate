import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { GmailOAuthService } from './gmail-oauth.service';
import {
  GMAIL_API_CONFIG,
  GMAIL_SEARCH_QUERIES,
  GMAIL_LABELS,
  SUPPORTED_MIME_TYPES,
} from './gmail.constants';
import {
  GmailMessage,
  GmailListMessagesResponse,
  GmailSearchOptions,
  GmailSearchResult,
  InvoiceSearchOptions,
  GmailAttachment,
  ProcessedEmail,
  ProcessedAttachment,
} from './gmail.types';

/**
 * Gmail API Operations Service
 * Handles Gmail API operations for reading emails and attachments
 *
 * Features:
 * - List and search emails
 * - Get email details with attachments
 * - Download attachments
 * - Search for invoice/receipt emails
 * - Batch operations
 * - Label management
 */
@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly gmailOAuthService: GmailOAuthService,
  ) {
    this.logger.log('Gmail Service initialized');
  }

  /**
   * Create authenticated Gmail API client
   */
  private async createGmailClient(connectionId: string): Promise<gmail_v1.Gmail> {
    const tokens = await this.gmailOAuthService.getDecryptedTokens(connectionId);

    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GMAIL_CLIENT_ID'),
      this.configService.get<string>('GMAIL_CLIENT_SECRET'),
      this.configService.get<string>('GMAIL_REDIRECT_URI'),
    );

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * List messages with optional query filter
   */
  async listMessages(
    connectionId: string,
    options: GmailSearchOptions,
  ): Promise<GmailListMessagesResponse> {
    try {
      const gmail = await this.createGmailClient(connectionId);

      const response = await gmail.users.messages.list({
        userId: 'me',
        q: options.query,
        maxResults: options.maxResults || GMAIL_API_CONFIG.maxResults,
        pageToken: options.pageToken,
        labelIds: options.labelIds,
        includeSpamTrash: options.includeSpamTrash || false,
      });

      return {
        messages: response.data.messages || [],
        nextPageToken: response.data.nextPageToken,
        resultSizeEstimate: response.data.resultSizeEstimate,
      };
    } catch (error) {
      this.logger.error('Failed to list messages', error);
      throw new InternalServerErrorException('Failed to retrieve messages from Gmail');
    }
  }

  /**
   * Get full message details including body and attachments
   */
  async getMessage(
    connectionId: string,
    messageId: string,
    format: 'full' | 'metadata' | 'minimal' | 'raw' = 'full',
  ): Promise<GmailMessage> {
    try {
      const gmail = await this.createGmailClient(connectionId);

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format,
      });

      return response.data as GmailMessage;
    } catch (error) {
      this.logger.error(`Failed to get message ${messageId}`, error);
      if (error.code === 404) {
        throw new NotFoundException(`Message ${messageId} not found`);
      }
      throw new InternalServerErrorException('Failed to retrieve message from Gmail');
    }
  }

  /**
   * Get attachment data
   */
  async getAttachment(
    connectionId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<GmailAttachment> {
    try {
      const gmail = await this.createGmailClient(connectionId);

      const response = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId,
      });

      if (!response.data.data) {
        throw new NotFoundException('Attachment data not found');
      }

      return {
        attachmentId,
        size: response.data.size || 0,
        data: response.data.data,
      };
    } catch (error) {
      this.logger.error(`Failed to get attachment ${attachmentId}`, error);
      if (error.code === 404) {
        throw new NotFoundException(`Attachment ${attachmentId} not found`);
      }
      throw new InternalServerErrorException('Failed to retrieve attachment from Gmail');
    }
  }

  /**
   * Search for invoice emails
   */
  async searchInvoiceEmails(
    connectionId: string,
    options: InvoiceSearchOptions,
  ): Promise<GmailSearchResult> {
    try {
      // Build search query
      let query = GMAIL_SEARCH_QUERIES.INVOICES;

      if (options.since) {
        const sinceStr = this.formatDateForGmail(options.since);
        query += ` after:${sinceStr}`;
      }

      if (options.until) {
        const untilStr = this.formatDateForGmail(options.until);
        query += ` before:${untilStr}`;
      }

      if (options.from) {
        query += ` from:${options.from}`;
      }

      if (options.hasAttachment !== false) {
        query += ' has:attachment';
      }

      this.logger.log(`Searching invoices with query: ${query}`);

      // Search messages
      const listResponse = await this.listMessages(connectionId, {
        query,
        maxResults: options.maxResults || 50,
      });

      // Get full message details for each result
      const messages: GmailMessage[] = [];
      if (listResponse.messages && listResponse.messages.length > 0) {
        for (const msg of listResponse.messages) {
          try {
            const fullMessage = await this.getMessage(connectionId, msg.id);
            messages.push(fullMessage);
          } catch (error) {
            this.logger.warn(`Failed to get message ${msg.id}, skipping`, error);
          }
        }
      }

      return {
        messages,
        nextPageToken: listResponse.nextPageToken,
        totalResults: listResponse.resultSizeEstimate,
      };
    } catch (error) {
      this.logger.error('Failed to search invoice emails', error);
      throw new InternalServerErrorException('Failed to search for invoice emails');
    }
  }

  /**
   * Mark email as processed by adding label
   */
  async markAsProcessed(
    connectionId: string,
    messageId: string,
  ): Promise<void> {
    try {
      const gmail = await this.createGmailClient(connectionId);

      // First, ensure the label exists
      await this.ensureLabel(connectionId, GMAIL_LABELS.PROCESSED);

      // Add label to message
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [GMAIL_LABELS.PROCESSED],
        },
      });

      this.logger.log(`Marked message ${messageId} as processed`);
    } catch (error) {
      this.logger.error(`Failed to mark message ${messageId} as processed`, error);
      throw new InternalServerErrorException('Failed to update message labels');
    }
  }

  /**
   * Extract and process email with attachments
   */
  async processEmail(
    connectionId: string,
    messageId: string,
  ): Promise<ProcessedEmail> {
    try {
      const message = await this.getMessage(connectionId, messageId);

      // Extract headers
      const headers = message.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value;
      const from = headers.find(h => h.name === 'From')?.value;
      const dateStr = headers.find(h => h.name === 'Date')?.value;
      const date = dateStr ? new Date(dateStr) : undefined;

      // Extract attachments
      const attachments = await this.extractAttachments(
        connectionId,
        messageId,
        message,
      );

      return {
        messageId,
        subject,
        from,
        date,
        hasAttachments: attachments.length > 0,
        attachments,
      };
    } catch (error) {
      this.logger.error(`Failed to process email ${messageId}`, error);
      throw new InternalServerErrorException('Failed to process email');
    }
  }

  /**
   * Extract attachments from message
   */
  private async extractAttachments(
    connectionId: string,
    messageId: string,
    message: GmailMessage,
  ): Promise<ProcessedAttachment[]> {
    const attachments: ProcessedAttachment[] = [];

    if (!message.payload) {
      return attachments;
    }

    // Recursive function to find attachments in message parts
    const findAttachments = (part: any) => {
      if (part.filename && part.body?.attachmentId) {
        // Check if MIME type is supported
        if (
          !part.mimeType ||
          SUPPORTED_MIME_TYPES.includes(part.mimeType as Prisma.InputJsonValue)
        ) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType || 'application/octet-stream',
            size: part.body.size || 0,
            attachmentId: part.body.attachmentId,
          });
        }
      }

      // Recursively check nested parts
      if (part.parts) {
        for (const subPart of part.parts) {
          findAttachments(subPart);
        }
      }
    };

    // Find all attachments
    findAttachments(message.payload);

    // Download attachment data
    for (const attachment of attachments) {
      try {
        const attachmentData = await this.getAttachment(
          connectionId,
          messageId,
          attachment.attachmentId,
        );

        // Decode base64url data
        attachment.data = Buffer.from(attachmentData.data, 'base64url');
      } catch (error) {
        this.logger.warn(
          `Failed to download attachment ${attachment.attachmentId}, skipping`,
          error,
        );
      }
    }

    return attachments;
  }

  /**
   * Ensure label exists, create if not
   */
  private async ensureLabel(
    connectionId: string,
    labelName: string,
  ): Promise<string> {
    try {
      const gmail = await this.createGmailClient(connectionId);

      // Get all labels
      const response = await gmail.users.labels.list({ userId: 'me' });
      const labels = response.data.labels || [];

      // Check if label exists
      const existingLabel = labels.find(l => l.name === labelName);
      if (existingLabel?.id) {
        return existingLabel.id;
      }

      // Create label
      const createResponse = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelName,
          messageListVisibility: 'show',
          labelListVisibility: 'labelShow',
        },
      });

      return createResponse.data.id || labelName;
    } catch (error) {
      this.logger.error(`Failed to ensure label ${labelName}`, error);
      // Return label name as fallback
      return labelName;
    }
  }

  /**
   * Format date for Gmail search query
   */
  private formatDateForGmail(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * Test connection by listing recent emails
   */
  async testConnection(connectionId: string): Promise<{
    success: boolean;
    email: string;
    messageCount: number;
    error?: string;
  }> {
    try {
      // Get connection info
      const connection = await this.gmailOAuthService.getConnectionStatus(
        connectionId,
      );

      if (!connection) {
        throw new NotFoundException('Connection not found');
      }

      // Try to list recent messages
      const response = await this.listMessages(connectionId, {
        query: '',
        maxResults: 10,
      });

      return {
        success: true,
        email: connection.email,
        messageCount: response.messages?.length || 0,
      };
    } catch (error) {
      this.logger.error('Connection test failed', error);
      return {
        success: false,
        email: '',
        messageCount: 0,
        error: error.message,
      };
    }
  }
}
