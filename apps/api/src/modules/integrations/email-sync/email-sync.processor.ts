import { Processor, Process, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { GmailService } from '../gmail/gmail.service';
import { OutlookService } from '../outlook/outlook.service';
import {
  EmailProvider,
  EmailSyncStatus,
  EmailSyncType,
} from '@prisma/client';
import { EMAIL_SYNC_QUEUE } from './email-sync.service';

// Import Email Intelligence services
import { EmailClassifierService } from '../../ai/email-intelligence/email-classifier.service';
import { EntityExtractorService } from '../../ai/email-intelligence/entity-extractor.service';
import { EmailSuggestionsService } from '../../ai/email-intelligence/email-suggestions.service';

/**
 * Email Sync Processor
 * Background processor for email synchronization jobs
 *
 * Processes:
 * 1. sync-emails: Main sync job - fetches emails from provider
 * 2. process-email-attachments: Processes attachments for a single email
 * 3. classify-email: Runs AI classification on email content
 *
 * Rate Limiting:
 * - Gmail: 250 quota units per user per second
 * - Outlook: 10,000 requests per 10 minutes per app per tenant
 *
 * Error Handling:
 * - Automatic retries with exponential backoff
 * - Rate limit detection and queuing
 * - Detailed error logging
 */

interface SyncEmailsJobData {
  jobId: string;
  connectionId: string;
  provider: EmailProvider;
}

interface ProcessAttachmentsJobData {
  emailId: string;
  connectionId: string;
  provider: EmailProvider;
  isRetry?: boolean;
}

interface ClassifyEmailJobData {
  emailId: string;
  subject: string;
  snippet: string;
  from: string;
  attachmentNames: string[];
}

@Processor(EMAIL_SYNC_QUEUE)
export class EmailSyncProcessor {
  private readonly logger = new Logger(EmailSyncProcessor.name);

  // Rate limiting trackers
  private gmailRequestCount = 0;
  private gmailRateLimitResetTime = Date.now();
  private outlookRequestCount = 0;
  private outlookRateLimitResetTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailService: GmailService,
    private readonly outlookService: OutlookService,
    private readonly emailClassifier: EmailClassifierService,
    private readonly entityExtractor: EntityExtractorService,
    private readonly suggestionsService: EmailSuggestionsService,
  ) {}

  /**
   * Main email sync job processor
   * Fetches emails from provider and stores metadata
   */
  @Process('sync-emails')
  async handleSyncEmails(job: Job<SyncEmailsJobData>): Promise<void> {
    const { jobId, connectionId, provider } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing sync job ${jobId} for provider ${provider}`);

    try {
      // Update job status to RUNNING
      await this.prisma.emailSyncJob.update({
        where: { id: jobId },
        data: {
          status: EmailSyncStatus.RUNNING,
          startedAt: new Date(),
        },
      });

      // Get job details
      const syncJob = await this.prisma.emailSyncJob.findUnique({
        where: { id: jobId },
        include: {
          connection: true,
        },
      });

      if (!syncJob) {
        throw new Error(`Sync job ${jobId} not found`);
      }

      // Check if cancelled
      if (syncJob.status === EmailSyncStatus.CANCELLED) {
        this.logger.log(`Sync job ${jobId} was cancelled`);
        return;
      }

      // Sync based on provider
      let result: { totalEmails: number; newEmails: number; errors: number };

      if (provider === EmailProvider.GMAIL) {
        result = await this.syncGmailEmails(syncJob, job);
      } else if (provider === EmailProvider.OUTLOOK) {
        result = await this.syncOutlookEmails(syncJob, job);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Calculate duration
      const durationMs = Date.now() - startTime;
      const avgEmailProcessingMs =
        result.totalEmails > 0 ? durationMs / result.totalEmails : 0;

      // Update job with success status
      await this.prisma.emailSyncJob.update({
        where: { id: jobId },
        data: {
          status:
            result.errors > 0
              ? EmailSyncStatus.PARTIAL
              : EmailSyncStatus.COMPLETED,
          completedAt: new Date(),
          totalEmails: result.totalEmails,
          processedEmails: result.totalEmails,
          newEmails: result.newEmails,
          failedEmails: result.errors,
          durationMs,
          avgEmailProcessingMs,
        },
      });

      // Update connection last sync time
      await this.prisma.emailConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          syncStatus: EmailSyncStatus.COMPLETED,
          syncError: null,
        },
      });

      this.logger.log(
        `Sync job ${jobId} completed: ${result.newEmails} new emails, ${result.errors} errors`,
      );

      job.progress(100);
    } catch (error) {
      this.logger.error(`Sync job ${jobId} failed:`, error);

      // Update job with failure status
      await this.prisma.emailSyncJob.update({
        where: { id: jobId },
        data: {
          status: EmailSyncStatus.FAILED,
          completedAt: new Date(),
          error: error.message,
          errorCount: { increment: 1 },
          durationMs: Date.now() - startTime,
        },
      });

      // Update connection sync error
      await this.prisma.emailConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: EmailSyncStatus.FAILED,
          syncError: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Sync emails from Gmail
   */
  private async syncGmailEmails(
    syncJob: any,
    bullJob: Job,
  ): Promise<{ totalEmails: number; newEmails: number; errors: number }> {
    let totalEmails = 0;
    let newEmails = 0;
    let errors = 0;
    let pageToken: string | undefined;

    try {
      // Build search query
      let searchQuery = syncJob.searchQuery || 'has:attachment';

      // Add date filter for incremental sync
      if (
        syncJob.syncType === EmailSyncType.INCREMENTAL &&
        syncJob.syncFromDate
      ) {
        const dateStr = syncJob.syncFromDate.toISOString().split('T')[0];
        searchQuery += ` after:${dateStr}`;
      }

      // Fetch messages in batches
      do {
        // Check rate limit
        await this.checkGmailRateLimit();

        // List messages
        const response = await this.gmailService.listMessages(
          syncJob.connectionId,
          {
            query: searchQuery,
            maxResults: 50,
            pageToken,
            labelIds: syncJob.labelIds,
          },
        );

        this.gmailRequestCount++;

        if (!response.messages || response.messages.length === 0) {
          break;
        }

        totalEmails += response.messages.length;

        // Process each message
        for (const message of response.messages) {
          try {
            // Check rate limit
            await this.checkGmailRateLimit();

            // Get full message details
            const emailDetails = await this.gmailService.getMessage(
              syncJob.connectionId,
              message.id,
            );

            this.gmailRequestCount++;

            // Check if email already exists
            const existingEmail = await this.prisma.syncedEmail.findUnique({
              where: {
                connectionId_externalId: {
                  connectionId: syncJob.connectionId,
                  externalId: message.id,
                },
              },
            });

            if (!existingEmail) {
              // Create synced email record
              const syncedEmail = await this.createSyncedEmailFromGmail(
                emailDetails,
                syncJob,
              );
              newEmails++;

              // Process email intelligence (classification, extraction, suggestions)
              if (syncedEmail) {
                await this.processEmailIntelligence(syncedEmail, syncJob);
              }
            }
          } catch (error) {
            this.logger.error(
              `Error processing Gmail message ${message.id}:`,
              error,
            );
            errors++;
          }
        }

        // Update progress
        const progress = Math.min(
          95,
          Math.round((newEmails / (response.resultSizeEstimate || 100)) * 100),
        );
        bullJob.progress(progress);

        // Update job stats
        await this.prisma.emailSyncJob.update({
          where: { id: syncJob.id },
          data: {
            totalEmails,
            processedEmails: totalEmails,
            newEmails,
            failedEmails: errors,
            nextPageToken: response.nextPageToken,
            apiCallsMade: this.gmailRequestCount,
          },
        });

        pageToken = response.nextPageToken;
      } while (pageToken);

      return { totalEmails, newEmails, errors };
    } catch (error) {
      // Check if rate limited
      if (error.message?.includes('rate limit') || error.code === 429) {
        await this.handleRateLimit(syncJob.id, EmailProvider.GMAIL);
      }
      throw error;
    }
  }

  /**
   * Sync emails from Outlook
   */
  private async syncOutlookEmails(
    syncJob: any,
    bullJob: Job,
  ): Promise<{ totalEmails: number; newEmails: number; errors: number }> {
    let totalEmails = 0;
    let newEmails = 0;
    let errors = 0;
    let skip = 0;
    const maxResults = 50;

    try {
      // Build filter
      let filter = 'hasAttachments eq true';

      // Add date filter for incremental sync
      if (
        syncJob.syncType === EmailSyncType.INCREMENTAL &&
        syncJob.syncFromDate
      ) {
        const dateStr = syncJob.syncFromDate.toISOString();
        filter += ` and receivedDateTime ge ${dateStr}`;
      }

      // Fetch messages in batches
      let hasMore = true;

      while (hasMore) {
        // Check rate limit
        await this.checkOutlookRateLimit();

        // List messages
        const response = await this.outlookService.listMessages({
          userId: syncJob.userId,
          orgId: syncJob.orgId,
          maxResults,
          skip,
          filter,
          orderBy: 'receivedDateTime desc',
        });

        this.outlookRequestCount++;

        if (!response.messages || response.messages.length === 0) {
          hasMore = false;
          break;
        }

        totalEmails += response.messages.length;

        // Process each message
        for (const message of response.messages) {
          try {
            // Check if email already exists
            const existingEmail = await this.prisma.syncedEmail.findUnique({
              where: {
                connectionId_externalId: {
                  connectionId: syncJob.connectionId,
                  externalId: message.id,
                },
              },
            });

            if (!existingEmail) {
              // Create synced email record
              const syncedEmail = await this.createSyncedEmailFromOutlook(message, syncJob);
              newEmails++;

              // Process email intelligence (classification, extraction, suggestions)
              if (syncedEmail) {
                await this.processEmailIntelligence(syncedEmail, syncJob);
              }
            }
          } catch (error) {
            this.logger.error(
              `Error processing Outlook message ${message.id}:`,
              error,
            );
            errors++;
          }
        }

        // Update progress
        const progress = Math.min(95, Math.round((skip / 1000) * 100));
        bullJob.progress(progress);

        // Update job stats
        await this.prisma.emailSyncJob.update({
          where: { id: syncJob.id },
          data: {
            totalEmails,
            processedEmails: totalEmails,
            newEmails,
            failedEmails: errors,
            apiCallsMade: this.outlookRequestCount,
          },
        });

        skip += maxResults;
        hasMore = response.messages.length === maxResults;
      }

      return { totalEmails, newEmails, errors };
    } catch (error) {
      // Check if rate limited
      if (error.response?.status === 429) {
        await this.handleRateLimit(syncJob.id, EmailProvider.OUTLOOK);
      }
      throw error;
    }
  }

  /**
   * Create synced email record from Gmail message
   */
  private async createSyncedEmailFromGmail(
    message: any,
    syncJob: any,
  ): Promise<any> {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
        ?.value;

    // Extract attachment info
    const attachments: any[] = [];
    const extractAttachments = (part: any) => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId,
        });
      }
      if (part.parts) {
        part.parts.forEach(extractAttachments);
      }
    };
    extractAttachments(message.payload);

    // Classify email
    const subject = getHeader('Subject') || '';
    const from = getHeader('From') || '';
    const snippet = message.snippet || '';

    const isInvoice = this.containsKeywords(
      subject + ' ' + snippet,
      ['invoice', 'bill', 'payment due'],
    );
    const isReceipt = this.containsKeywords(
      subject + ' ' + snippet,
      ['receipt', 'order confirmation', 'payment received'],
    );
    const isFinancial =
      isInvoice ||
      isReceipt ||
      this.containsKeywords(subject + ' ' + snippet, [
        'statement',
        'quote',
        'estimate',
      ]);

    const syncedEmail = await this.prisma.syncedEmail.create({
      data: {
        connectionId: syncJob.connectionId,
        orgId: syncJob.orgId,
        userId: syncJob.userId,
        provider: EmailProvider.GMAIL,
        externalId: message.id,
        threadId: message.threadId,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        fromName: this.extractName(getHeader('From')),
        to: this.parseEmailList(getHeader('To')),
        cc: this.parseEmailList(getHeader('Cc')),
        bcc: this.parseEmailList(getHeader('Bcc')),
        receivedAt: new Date(parseInt(message.internalDate)),
        internalDate: new Date(parseInt(message.internalDate)),
        snippet: message.snippet,
        hasHtmlBody: true,
        hasTextBody: true,
        hasAttachments: attachments.length > 0,
        attachmentCount: attachments.length,
        attachmentNames: attachments.map((a) => a.filename),
        attachmentSizes: attachments.map((a) => a.size),
        attachmentMimeTypes: attachments.map((a) => a.mimeType),
        isInvoice,
        isReceipt,
        isFinancial,
        confidence: isFinancial ? 0.8 : 0.3,
        labels: message.labelIds || [],
        categories: [],
        syncJobId: syncJob.id,
      },
    });

    return syncedEmail;
  }

  /**
   * Create synced email record from Outlook message
   */
  private async createSyncedEmailFromOutlook(
    message: any,
    syncJob: any,
  ): Promise<any> {
    // Extract attachment info
    const attachments = message.hasAttachments
      ? await this.getOutlookAttachments(message.id, syncJob)
      : [];

    // Classify email
    const subject = message.subject || '';
    const bodyPreview = message.bodyPreview || '';
    const from = message.from?.emailAddress?.address || '';

    const isInvoice = this.containsKeywords(subject + ' ' + bodyPreview, [
      'invoice',
      'bill',
      'payment due',
    ]);
    const isReceipt = this.containsKeywords(subject + ' ' + bodyPreview, [
      'receipt',
      'order confirmation',
      'payment received',
    ]);
    const isFinancial =
      isInvoice ||
      isReceipt ||
      this.containsKeywords(subject + ' ' + bodyPreview, [
        'statement',
        'quote',
        'estimate',
      ]);

    const syncedEmail = await this.prisma.syncedEmail.create({
      data: {
        connectionId: syncJob.connectionId,
        orgId: syncJob.orgId,
        userId: syncJob.userId,
        provider: EmailProvider.OUTLOOK,
        externalId: message.id,
        threadId: message.conversationId,
        subject: message.subject,
        from: message.from?.emailAddress?.address,
        fromName: message.from?.emailAddress?.name,
        to: message.toRecipients?.map((r: any) => r.emailAddress.address) || [],
        cc: message.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
        bcc:
          message.bccRecipients?.map((r: any) => r.emailAddress.address) || [],
        sentAt: message.sentDateTime ? new Date(message.sentDateTime) : null,
        receivedAt: new Date(message.receivedDateTime),
        snippet: message.bodyPreview?.substring(0, 250),
        bodyPreview: message.bodyPreview,
        hasHtmlBody: message.body?.contentType === 'html',
        hasTextBody: message.body?.contentType === 'text',
        hasAttachments: message.hasAttachments,
        attachmentCount: attachments.length,
        attachmentNames: attachments.map((a: any) => a.name),
        attachmentSizes: attachments.map((a: any) => a.size),
        attachmentMimeTypes: attachments.map((a: any) => a.contentType),
        isInvoice,
        isReceipt,
        isFinancial,
        confidence: isFinancial ? 0.8 : 0.3,
        isRead: message.isRead,
        isImportant: message.importance === 'high',
        isDraft: message.isDraft,
        labels: [],
        categories: message.categories || [],
        syncJobId: syncJob.id,
      },
    });

    return syncedEmail;
  }

  /**
   * Process email intelligence: classification, entity extraction, and suggestions
   * This is called after a SyncedEmail record is created
   */
  private async processEmailIntelligence(
    syncedEmail: any,
    syncJob: any,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Processing email intelligence for email: ${syncedEmail.subject}`,
      );

      // Skip if email intelligence services are not available
      if (
        !this.emailClassifier.isHealthy() ||
        !this.entityExtractor ||
        !this.suggestionsService
      ) {
        this.logger.warn(
          'Email intelligence services not fully initialized - skipping processing',
        );
        return;
      }

      // 1. Classify the email
      const emailInput = {
        subject: syncedEmail.subject || '',
        body: syncedEmail.snippet || syncedEmail.bodyPreview || '',
        from: syncedEmail.from || '',
        to: syncedEmail.to || [],
        hasAttachments: syncedEmail.hasAttachments,
        attachmentNames: syncedEmail.attachmentNames || [],
      };

      const classification = await this.emailClassifier.classifyEmail(
        emailInput,
      );

      this.logger.debug(
        `Email classified as: ${classification.classification} (confidence: ${classification.confidence})`,
      );

      // 2. Extract entities from the email
      const entities = await this.entityExtractor.extractEntities({
        subject: syncedEmail.subject || '',
        body: syncedEmail.snippet || syncedEmail.bodyPreview || '',
        from: syncedEmail.from || '',
        to: syncedEmail.to || [],
      });

      this.logger.debug(
        `Extracted entities: ${entities.companies.length} companies, ${entities.contacts.length} contacts, ${entities.amounts.length} amounts`,
      );

      // 3. Generate suggestions based on classification and entities
      const suggestions =
        await this.suggestionsService.generateSuggestionsForEmail(
          {
            id: syncedEmail.id,
            subject: syncedEmail.subject,
            classification,
            entities,
          },
          classification,
          entities,
          syncedEmail.orgId,
        );

      this.logger.log(
        `Email intelligence complete for "${syncedEmail.subject}": ${suggestions.length} suggestions generated`,
      );
    } catch (error) {
      // Log error but don't fail the entire sync
      this.logger.error(
        `Failed to process email intelligence for email ${syncedEmail.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get attachments for Outlook message (simplified version)
   */
  private async getOutlookAttachments(
    messageId: string,
    syncJob: any,
  ): Promise<any[]> {
    try {
      // This would call the Outlook service to get attachments
      // Simplified for now - in reality you'd call outlookService.getAttachments
      return [];
    } catch (error) {
      this.logger.error(
        `Failed to get attachments for message ${messageId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Check Gmail rate limit
   */
  private async checkGmailRateLimit(): Promise<void> {
    const now = Date.now();
    const timeWindow = 1000; // 1 second
    const maxRequests = 250;

    if (now - this.gmailRateLimitResetTime > timeWindow) {
      this.gmailRequestCount = 0;
      this.gmailRateLimitResetTime = now;
    }

    if (this.gmailRequestCount >= maxRequests) {
      const waitTime = timeWindow - (now - this.gmailRateLimitResetTime);
      this.logger.warn(`Gmail rate limit reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.gmailRequestCount = 0;
      this.gmailRateLimitResetTime = Date.now();
    }
  }

  /**
   * Check Outlook rate limit
   */
  private async checkOutlookRateLimit(): Promise<void> {
    const now = Date.now();
    const timeWindow = 600000; // 10 minutes
    const maxRequests = 10000;

    if (now - this.outlookRateLimitResetTime > timeWindow) {
      this.outlookRequestCount = 0;
      this.outlookRateLimitResetTime = now;
    }

    if (this.outlookRequestCount >= maxRequests) {
      const waitTime = timeWindow - (now - this.outlookRateLimitResetTime);
      this.logger.warn(`Outlook rate limit reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.outlookRequestCount = 0;
      this.outlookRateLimitResetTime = Date.now();
    }
  }

  /**
   * Handle rate limiting
   */
  private async handleRateLimit(
    jobId: string,
    provider: EmailProvider,
  ): Promise<void> {
    const resetTime = new Date(
      Date.now() + (provider === EmailProvider.GMAIL ? 1000 : 600000),
    );

    await this.prisma.emailSyncJob.update({
      where: { id: jobId },
      data: {
        status: EmailSyncStatus.RATE_LIMITED,
        rateLimitHit: true,
        rateLimitResetAt: resetTime,
      },
    });

    this.logger.warn(`Rate limit hit for ${provider}, job ${jobId} paused`);
  }

  /**
   * Helper: Check if text contains keywords
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Helper: Extract name from email address "Name <email@example.com>"
   */
  private extractName(emailString: string): string | null {
    if (!emailString) return null;
    const match = emailString.match(/^(.+?)\s*<.*>$/);
    return match ? match[1].trim() : null;
  }

  /**
   * Helper: Parse comma-separated email list
   */
  private parseEmailList(emailString: string): string[] {
    if (!emailString) return [];
    return emailString
      .split(',')
      .map((e) => {
        const match = e.match(/<(.+?)>/);
        return match ? match[1].trim() : e.trim();
      })
      .filter((e) => e);
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle queue errors
   */
  @OnQueueError()
  handleError(error: Error) {
    this.logger.error('Queue error occurred:', error);
  }

  /**
   * Handle failed jobs
   */
  @OnQueueFailed()
  async handleFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error);

    if (job.data.jobId) {
      await this.prisma.emailSyncJob.update({
        where: { id: job.data.jobId },
        data: {
          status: EmailSyncStatus.FAILED,
          error: error.message,
          completedAt: new Date(),
        },
      });
    }
  }
}
