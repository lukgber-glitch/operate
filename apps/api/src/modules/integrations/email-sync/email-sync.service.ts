import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { GmailService } from '../gmail/gmail.service';
import { OutlookService } from '../outlook/outlook.service';
import {
  EmailProvider,
  EmailSyncType,
  EmailSyncStatus,
} from '@prisma/client';
import {
  TriggerSyncDto,
  SyncStatusDto,
  ListSyncedEmailsDto,
  SyncStatisticsDto,
  RetryFailedEmailsDto,
  SyncedEmailDetailDto,
} from './dto/email-sync.dto';
import {
  SyncedEmailEntity,
  EmailSyncJobEntity,
} from './entities/synced-email.entity';

export const EMAIL_SYNC_QUEUE = 'email-sync';

/**
 * Email Sync Service
 * Orchestrates email synchronization from Gmail and Outlook
 *
 * Features:
 * - Incremental sync (only new emails since last sync)
 * - Full sync (all emails in date range)
 * - Financial document detection (invoices, receipts)
 * - Attachment metadata storage
 * - Rate limiting and retry handling
 * - Background processing via BullMQ
 * - Progress tracking
 *
 * Integration:
 * - Uses GmailService for Gmail operations
 * - Uses OutlookService for Outlook operations
 * - Queues attachment processing for detected documents
 */
@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailService: GmailService,
    private readonly outlookService: OutlookService,
    @InjectQueue(EMAIL_SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {
    this.logger.log('Email Sync Service initialized');
  }

  /**
   * Trigger a sync operation for a connection
   * Creates a sync job and queues it for background processing
   */
  async triggerSync(dto: TriggerSyncDto): Promise<EmailSyncJobEntity> {
    this.logger.log(`Triggering sync for connection ${dto.connectionId}`);

    // Verify connection exists and is active
    const connection = await this.prisma.emailConnection.findUnique({
      where: { id: dto.connectionId },
    });

    if (!connection) {
      throw new NotFoundException(
        `Email connection ${dto.connectionId} not found`,
      );
    }

    if (!connection.syncEnabled) {
      throw new BadRequestException(
        'Sync is disabled for this email connection',
      );
    }

    // Check for existing running sync
    const existingSync = await this.prisma.emailSyncJob.findFirst({
      where: {
        connectionId: dto.connectionId,
        status: { in: ['PENDING', 'RUNNING'] },
      },
    });

    if (existingSync) {
      this.logger.warn(
        `Sync already in progress for connection ${dto.connectionId}`,
      );
      return new EmailSyncJobEntity(existingSync);
    }

    // Determine sync date range
    const syncFromDate = dto.fromDate
      ? new Date(dto.fromDate)
      : await this.getLastSyncDate(dto.connectionId);

    const syncToDate = dto.toDate ? new Date(dto.toDate) : new Date();

    // Create sync job
    const syncJob = await this.prisma.emailSyncJob.create({
      data: {
        connectionId: dto.connectionId,
        orgId: connection.orgId,
        userId: connection.userId,
        provider: connection.provider,
        syncType: (dto.syncType as EmailSyncType) || EmailSyncType.INCREMENTAL,
        status: EmailSyncStatus.PENDING,
        syncFromDate,
        syncToDate,
        searchQuery: dto.searchQuery,
        labelIds: dto.labelIds || [],
        folderIds: dto.folderIds || [],
      },
    });

    // Queue the sync job for background processing
    await this.syncQueue.add(
      'sync-emails',
      {
        jobId: syncJob.id,
        connectionId: dto.connectionId,
        provider: connection.provider,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    this.logger.log(`Sync job ${syncJob.id} queued for processing`);

    return new EmailSyncJobEntity(syncJob);
  }

  /**
   * Get folders to sync based on mailbox configuration
   */
  private async getFoldersForMailbox(
    connectionId: string,
    mailboxId?: string,
  ): Promise<{ labelIds: string[]; folderIds: string[] }> {
    if (!mailboxId) {
      // No specific mailbox - sync all (backwards compatible)
      return { labelIds: [], folderIds: [] };
    }

    const mailbox = await this.prisma.emailMailbox.findUnique({
      where: { id: mailboxId },
    });

    if (!mailbox || mailbox.scanAllFolders) {
      return { labelIds: [], folderIds: [] }; // Empty means all folders
    }

    // Return configured folders based on provider
    const connection = await this.prisma.emailConnection.findUnique({
      where: { id: connectionId },
    });

    if (connection?.provider === 'GMAIL') {
      return { labelIds: mailbox.labelIds, folderIds: [] };
    } else if (connection?.provider === 'OUTLOOK') {
      return { labelIds: [], folderIds: mailbox.folderIds };
    }

    return { labelIds: [], folderIds: mailbox.foldersToScan };
  }

  /**
   * Get the last sync date for a connection
   * Used for incremental syncs to only fetch new emails
   */
  private async getLastSyncDate(connectionId: string): Promise<Date> {
    // Try to get the most recent successfully synced email
    const lastEmail = await this.prisma.syncedEmail.findFirst({
      where: { connectionId },
      orderBy: { receivedAt: 'desc' },
      select: { receivedAt: true },
    });

    if (lastEmail) {
      return lastEmail.receivedAt;
    }

    // If no emails synced yet, default to 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo;
  }

  /**
   * Get sync job status
   */
  async getSyncStatus(jobId: string): Promise<SyncStatusDto> {
    const job = await this.prisma.emailSyncJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Sync job ${jobId} not found`);
    }

    const entity = new EmailSyncJobEntity(job);

    return {
      jobId: job.id,
      connectionId: job.connectionId,
      status: job.status,
      provider: job.provider,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      totalEmails: job.totalEmails,
      processedEmails: job.processedEmails,
      newEmails: job.newEmails,
      updatedEmails: job.updatedEmails,
      failedEmails: job.failedEmails,
      error: job.error,
      durationMs: job.durationMs,
      progress: entity.getProgress(),
    };
  }

  /**
   * List sync jobs for a connection
   */
  async listSyncJobs(
    connectionId: string,
    limit: number = 20,
  ): Promise<EmailSyncJobEntity[]> {
    const jobs = await this.prisma.emailSyncJob.findMany({
      where: { connectionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return jobs.map((job) => new EmailSyncJobEntity(job));
  }

  /**
   * Cancel a running sync job
   */
  async cancelSync(jobId: string, reason?: string): Promise<void> {
    const job = await this.prisma.emailSyncJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Sync job ${jobId} not found`);
    }

    if (!['PENDING', 'RUNNING', 'RATE_LIMITED'].includes(job.status)) {
      throw new BadRequestException(
        `Cannot cancel sync job with status ${job.status}`,
      );
    }

    await this.prisma.emailSyncJob.update({
      where: { id: jobId },
      data: {
        status: EmailSyncStatus.CANCELLED,
        completedAt: new Date(),
        error: reason || 'Cancelled by user',
      },
    });

    // Remove from queue if still pending
    const bullJobs = await this.syncQueue.getJobs(['waiting', 'active']);
    const bullJob = bullJobs.find((j) => j.data.jobId === jobId);
    if (bullJob) {
      await bullJob.remove();
      this.logger.log(`Removed sync job ${jobId} from queue`);
    }
  }

  /**
   * List synced emails with filtering
   */
  async listSyncedEmails(
    dto: ListSyncedEmailsDto,
  ): Promise<{ emails: SyncedEmailDetailDto[]; total: number; page: number }> {
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      connectionId: dto.connectionId,
    };

    if (dto.processed !== undefined) {
      where.processed = dto.processed;
    }

    if (dto.isInvoice !== undefined) {
      where.isInvoice = dto.isInvoice;
    }

    if (dto.isReceipt !== undefined) {
      where.isReceipt = dto.isReceipt;
    }

    if (dto.hasAttachments !== undefined) {
      where.hasAttachments = dto.hasAttachments;
    }

    if (dto.fromDate || dto.toDate) {
      where.receivedAt = {};
      if (dto.fromDate) {
        where.receivedAt.gte = new Date(dto.fromDate);
      }
      if (dto.toDate) {
        where.receivedAt.lte = new Date(dto.toDate);
      }
    }

    if (dto.search) {
      where.OR = [
        { subject: { contains: dto.search, mode: 'insensitive' } },
        { from: { contains: dto.search, mode: 'insensitive' } },
        { fromName: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.syncedEmail.count({ where });

    // Get paginated results
    const emails = await this.prisma.syncedEmail.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      skip,
      take: limit,
    });

    const emailDtos: SyncedEmailDetailDto[] = emails.map((email) => ({
      id: email.id,
      externalId: email.externalId,
      provider: email.provider,
      subject: email.subject,
      from: email.from,
      fromName: email.fromName,
      to: email.to,
      cc: email.cc,
      receivedAt: email.receivedAt,
      snippet: email.snippet,
      hasAttachments: email.hasAttachments,
      attachmentCount: email.attachmentCount,
      attachmentNames: email.attachmentNames,
      isInvoice: email.isInvoice,
      isReceipt: email.isReceipt,
      isFinancial: email.isFinancial,
      confidence: email.confidence,
      processed: email.processed,
      processedAt: email.processedAt,
      processingError: email.processingError,
      labels: [...email.labels, ...email.categories],
      lastSyncedAt: email.lastSyncedAt,
    }));

    return {
      emails: emailDtos,
      total,
      page,
    };
  }

  /**
   * Get sync statistics for a connection
   */
  async getSyncStatistics(
    connectionId: string,
  ): Promise<SyncStatisticsDto> {
    const connection = await this.prisma.emailConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException(`Connection ${connectionId} not found`);
    }

    // Get email counts
    const [
      totalEmailsSynced,
      emailsWithAttachments,
      invoiceCount,
      receiptCount,
      financialCount,
      processedCount,
      pendingCount,
      failedCount,
    ] = await Promise.all([
      this.prisma.syncedEmail.count({ where: { connectionId } }),
      this.prisma.syncedEmail.count({
        where: { connectionId, hasAttachments: true },
      }),
      this.prisma.syncedEmail.count({
        where: { connectionId, isInvoice: true },
      }),
      this.prisma.syncedEmail.count({
        where: { connectionId, isReceipt: true },
      }),
      this.prisma.syncedEmail.count({
        where: { connectionId, isFinancial: true },
      }),
      this.prisma.syncedEmail.count({
        where: { connectionId, processed: true },
      }),
      this.prisma.syncedEmail.count({
        where: {
          connectionId,
          processed: false,
          processingError: null,
        },
      }),
      this.prisma.syncedEmail.count({
        where: {
          connectionId,
          processed: false,
          processingError: { not: null },
        },
      }),
    ]);

    // Get sync job stats
    const [totalSyncJobs, successfulSyncJobs, failedSyncJobs] =
      await Promise.all([
        this.prisma.emailSyncJob.count({ where: { connectionId } }),
        this.prisma.emailSyncJob.count({
          where: { connectionId, status: EmailSyncStatus.COMPLETED },
        }),
        this.prisma.emailSyncJob.count({
          where: { connectionId, status: EmailSyncStatus.FAILED },
        }),
      ]);

    // Get last sync times
    const lastSuccessfulSync = await this.prisma.emailSyncJob.findFirst({
      where: { connectionId, status: EmailSyncStatus.COMPLETED },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });

    return {
      connectionId,
      provider: connection.provider,
      totalEmailsSynced,
      emailsWithAttachments,
      invoiceCount,
      receiptCount,
      financialCount,
      processedCount,
      pendingCount,
      failedCount,
      lastSyncAt: connection.lastSyncAt,
      lastSuccessfulSyncAt: lastSuccessfulSync?.completedAt,
      totalSyncJobs,
      successfulSyncJobs,
      failedSyncJobs,
    };
  }

  /**
   * Retry failed email processing
   */
  async retryFailedEmails(
    dto: RetryFailedEmailsDto,
  ): Promise<{ queued: number }> {
    const maxEmails = dto.maxEmails || 50;
    const maxRetryCount = dto.maxRetryCount || 3;

    // Find failed emails that can be retried
    const failedEmails = await this.prisma.syncedEmail.findMany({
      where: {
        connectionId: dto.connectionId,
        processed: false,
        processingError: { not: null },
        retryCount: { lt: maxRetryCount },
      },
      take: maxEmails,
      orderBy: { receivedAt: 'desc' },
    });

    if (failedEmails.length === 0) {
      return { queued: 0 };
    }

    // Queue emails for reprocessing
    for (const email of failedEmails) {
      await this.syncQueue.add(
        'process-email-attachments',
        {
          emailId: email.id,
          connectionId: email.connectionId,
          provider: email.provider,
          isRetry: true,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      // Increment retry count
      await this.prisma.syncedEmail.update({
        where: { id: email.id },
        data: {
          retryCount: { increment: 1 },
          processingError: null, // Clear error for retry
        },
      });
    }

    this.logger.log(
      `Queued ${failedEmails.length} failed emails for retry processing`,
    );

    return { queued: failedEmails.length };
  }

  /**
   * Get a single synced email by ID
   */
  async getSyncedEmail(emailId: string): Promise<SyncedEmailDetailDto> {
    const email = await this.prisma.syncedEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      throw new NotFoundException(`Synced email ${emailId} not found`);
    }

    return {
      id: email.id,
      externalId: email.externalId,
      provider: email.provider,
      subject: email.subject,
      from: email.from,
      fromName: email.fromName,
      to: email.to,
      cc: email.cc,
      receivedAt: email.receivedAt,
      snippet: email.snippet,
      hasAttachments: email.hasAttachments,
      attachmentCount: email.attachmentCount,
      attachmentNames: email.attachmentNames,
      isInvoice: email.isInvoice,
      isReceipt: email.isReceipt,
      isFinancial: email.isFinancial,
      confidence: email.confidence,
      processed: email.processed,
      processedAt: email.processedAt,
      processingError: email.processingError,
      labels: [...email.labels, ...email.categories],
      lastSyncedAt: email.lastSyncedAt,
    };
  }

  /**
   * Mark email as processed
   */
  async markEmailAsProcessed(
    emailId: string,
    success: boolean,
    error?: string,
  ): Promise<void> {
    await this.prisma.syncedEmail.update({
      where: { id: emailId },
      data: {
        processed: success,
        processedAt: success ? new Date() : null,
        processingError: error,
      },
    });
  }

  /**
   * Update connection last sync timestamp
   */
  async updateConnectionLastSync(
    connectionId: string,
    status: EmailSyncStatus,
  ): Promise<void> {
    await this.prisma.emailConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        syncStatus: status,
      },
    });
  }

  /**
   * Sync emails for a specific mailbox configuration
   */
  async syncMailbox(mailboxId: string): Promise<EmailSyncJobEntity> {
    this.logger.log(`Syncing mailbox ${mailboxId}`);

    const mailbox = await this.prisma.emailMailbox.findUnique({
      where: { id: mailboxId },
      include: { connection: true },
    });

    if (!mailbox || !mailbox.isActive) {
      throw new NotFoundException(
        `Mailbox ${mailboxId} not found or inactive`,
      );
    }

    // Get folder configuration
    const folders = await this.getFoldersForMailbox(
      mailbox.connectionId,
      mailbox.id,
    );

    // Determine sync date range
    const syncFromDate = await this.getLastSyncDate(mailbox.connectionId);
    const syncToDate = new Date();

    // Create sync job for this mailbox
    const syncJob = await this.prisma.emailSyncJob.create({
      data: {
        connectionId: mailbox.connectionId,
        mailboxId: mailbox.id,
        orgId: mailbox.orgId,
        userId: mailbox.userId,
        provider: mailbox.connection.provider,
        syncType: EmailSyncType.INCREMENTAL,
        status: EmailSyncStatus.PENDING,
        syncFromDate,
        syncToDate,
        labelIds: folders.labelIds,
        folderIds: folders.folderIds,
      },
    });

    // Queue the sync job
    await this.syncQueue.add(
      'sync-emails',
      {
        jobId: syncJob.id,
        connectionId: mailbox.connectionId,
        mailboxId: mailbox.id,
        provider: mailbox.connection.provider,
        labelIds: folders.labelIds,
        folderIds: folders.folderIds,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    // Update mailbox last sync attempt
    await this.prisma.emailMailbox.update({
      where: { id: mailboxId },
      data: { lastSyncAt: new Date() },
    });

    this.logger.log(`Mailbox sync job ${syncJob.id} queued for processing`);

    return new EmailSyncJobEntity(syncJob);
  }

  /**
   * Sync all active mailboxes for an organization
   */
  async syncAllMailboxes(orgId: string): Promise<EmailSyncJobEntity[]> {
    this.logger.log(`Syncing all active mailboxes for org ${orgId}`);

    const mailboxes = await this.prisma.emailMailbox.findMany({
      where: { orgId, isActive: true },
      include: { connection: true },
    });

    if (mailboxes.length === 0) {
      this.logger.warn(`No active mailboxes found for org ${orgId}`);
      return [];
    }

    const syncJobs: EmailSyncJobEntity[] = [];

    for (const mailbox of mailboxes) {
      try {
        const job = await this.syncMailbox(mailbox.id);
        syncJobs.push(job);
      } catch (error) {
        this.logger.error(
          `Failed to sync mailbox ${mailbox.id}: ${error.message}`,
          error,
        );
      }
    }

    this.logger.log(
      `Queued ${syncJobs.length} mailbox sync jobs for org ${orgId}`,
    );

    return syncJobs;
  }

  /**
   * Sync all active mailboxes for a connection
   */
  async syncMailboxesForConnection(
    connectionId: string,
  ): Promise<EmailSyncJobEntity[]> {
    this.logger.log(
      `Syncing all active mailboxes for connection ${connectionId}`,
    );

    const mailboxes = await this.prisma.emailMailbox.findMany({
      where: { connectionId, isActive: true },
      include: { connection: true },
    });

    if (mailboxes.length === 0) {
      this.logger.warn(
        `No active mailboxes found for connection ${connectionId}`,
      );
      return [];
    }

    const syncJobs: EmailSyncJobEntity[] = [];

    for (const mailbox of mailboxes) {
      try {
        const job = await this.syncMailbox(mailbox.id);
        syncJobs.push(job);
      } catch (error) {
        this.logger.error(
          `Failed to sync mailbox ${mailbox.id}: ${error.message}`,
          error,
        );
      }
    }

    this.logger.log(
      `Queued ${syncJobs.length} mailbox sync jobs for connection ${connectionId}`,
    );

    return syncJobs;
  }
}
