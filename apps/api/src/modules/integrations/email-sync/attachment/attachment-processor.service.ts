import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/modules/database/prisma.service';
import { GmailService } from '../../gmail/gmail.service';
import { OutlookService } from '../../outlook/outlook.service';
import { AttachmentStorageService } from './attachment-storage.service';
import { AttachmentClassifierService } from './attachment-classifier.service';
import {
  EmailProvider,
  AttachmentProcessingStatus,
  AttachmentClassificationType,
  AttachmentStorageBackend,
} from '@prisma/client';
import {
  ProcessEmailAttachmentsDto,
  ProcessAttachmentDto,
  DownloadAttachmentDto,
  ListAttachmentsDto,
  AttachmentResponseDto,
  StorageQuotaResponseDto,
  UpdateStorageQuotaDto,
  BulkProcessAttachmentsDto,
  AttachmentStatisticsDto,
  RetryFailedAttachmentsDto,
  DeleteAttachmentDto,
} from '../dto/attachment.dto';

export const ATTACHMENT_PROCESSING_QUEUE = 'attachment-processing';

/**
 * Attachment Processor Service
 * Orchestrates email attachment processing pipeline
 *
 * Pipeline:
 * 1. Download attachments from email provider (Gmail/Outlook)
 * 2. Store in local filesystem or S3
 * 3. Scan for viruses/malware (placeholder)
 * 4. Classify attachment type using AI/heuristics
 * 5. Route to appropriate extractor (invoice/receipt)
 * 6. Track processing status
 * 7. Manage storage quotas
 *
 * Features:
 * - Async processing via BullMQ
 * - Streaming for large files
 * - Deduplication via content hashing
 * - Storage quota enforcement
 * - Retry logic for failed downloads
 * - Virus scanning integration (placeholder)
 *
 * Integration Points:
 * - GmailService: Download Gmail attachments
 * - OutlookService: Download Outlook attachments
 * - AttachmentStorageService: Store/retrieve files
 * - AttachmentClassifierService: Classify documents
 * - Invoice/Receipt Extractors: Data extraction (queued)
 */
@Injectable()
export class AttachmentProcessorService {
  private readonly logger = new Logger(AttachmentProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailService: GmailService,
    private readonly outlookService: OutlookService,
    private readonly storageService: AttachmentStorageService,
    private readonly classifierService: AttachmentClassifierService,
    @InjectQueue(ATTACHMENT_PROCESSING_QUEUE)
    private readonly attachmentQueue: Queue,
    @InjectQueue('invoice-extraction')
    private readonly invoiceExtractionQueue: Queue,
    @InjectQueue('receipt-extraction')
    private readonly receiptExtractionQueue: Queue,
  ) {}

  /**
   * Process all attachments for a synced email
   * Queues each attachment for async processing
   *
   * @param dto - Process email attachments DTO
   * @param userId - Current user ID
   * @param orgId - Organization ID
   * @returns Job IDs for queued processing tasks
   */
  async processEmailAttachments(
    dto: ProcessEmailAttachmentsDto,
    userId: string,
    orgId: string,
  ): Promise<{ queued: number; jobIds: string[] }> {
    this.logger.log(
      `Processing attachments for email: ${dto.emailId} (org: ${orgId})`,
    );

    // Fetch email from database
    const email = await this.prisma.syncedEmail.findUnique({
      where: { id: dto.emailId },
      include: {
        connection: true,
      },
    });

    if (!email) {
      throw new NotFoundException(`Email not found: ${dto.emailId}`);
    }

    // Verify access
    if (email.orgId !== orgId) {
      throw new BadRequestException('Access denied to this email');
    }

    // Check if email has attachments
    if (!email.hasAttachments || email.attachmentCount === 0) {
      this.logger.warn(
        `Email ${dto.emailId} has no attachments to process`,
      );
      return { queued: 0, jobIds: [] };
    }

    // Check storage quota
    await this.checkStorageQuota(orgId);

    // Get attachment metadata from email
    const attachmentMetadata = this.extractAttachmentMetadata(email);

    // Create database records for attachments (if not exists)
    const attachmentRecords = await this.createAttachmentRecords(
      email,
      attachmentMetadata,
      dto.forceReprocess,
    );

    // Queue processing jobs
    const jobIds: string[] = [];
    for (const attachment of attachmentRecords) {
      const job = await this.attachmentQueue.add('process-attachment', {
        attachmentId: attachment.id,
        emailId: email.id,
        connectionId: email.connectionId,
        provider: email.provider,
        externalId: attachment.externalId,
        orgId,
        userId,
        skipScanning: dto.skipScanning || false,
      });

      jobIds.push(job.id.toString());
    }

    this.logger.log(
      `Queued ${attachmentRecords.length} attachments for processing`,
    );

    return {
      queued: attachmentRecords.length,
      jobIds,
    };
  }

  /**
   * Process a single attachment
   * Called by the queue processor
   *
   * @param attachmentId - Attachment ID
   * @param jobData - Job data from queue
   */
  async processSingleAttachment(
    attachmentId: string,
    jobData: any,
  ): Promise<void> {
    this.logger.log(`Processing attachment: ${attachmentId}`);

    try {
      // Update status to DOWNLOADING
      await this.updateAttachmentStatus(
        attachmentId,
        AttachmentProcessingStatus.DOWNLOADING,
      );

      // Download attachment from provider
      const content = await this.downloadAttachmentFromProvider(
        jobData.provider,
        jobData.connectionId,
        jobData.externalId,
        jobData.emailId,
        jobData.orgId,
        jobData.userId,
      );

      // Update status to DOWNLOADED
      await this.updateAttachmentStatus(
        attachmentId,
        AttachmentProcessingStatus.DOWNLOADED,
      );

      // Get attachment record
      const attachment = await this.prisma.emailAttachment.findUnique({
        where: { id: attachmentId },
      });

      // Store attachment
      const storageResult = await this.storageService.storeAttachment(
        content,
        attachment.originalFilename,
        jobData.orgId,
        attachment.mimeType,
      );

      // Update attachment with storage metadata
      await this.prisma.emailAttachment.update({
        where: { id: attachmentId },
        data: {
          storageBackend: storageResult.storageBackend,
          storagePath: storageResult.storagePath,
          storageUrl: storageResult.storageUrl,
          s3Bucket: storageResult.s3Bucket,
          s3Key: storageResult.s3Key,
          contentHash: storageResult.contentHash,
          size: storageResult.size,
        },
      });

      // Update storage quota
      await this.updateStorageQuotaUsage(
        jobData.orgId,
        storageResult.size,
        null, // Will be updated after classification
      );

      // Scan for viruses (placeholder)
      if (!jobData.skipScanning) {
        await this.updateAttachmentStatus(
          attachmentId,
          AttachmentProcessingStatus.SCANNING,
        );
        await this.scanAttachment(attachmentId, content);
      }

      // Classify attachment
      await this.updateAttachmentStatus(
        attachmentId,
        AttachmentProcessingStatus.CLASSIFYING,
      );
      await this.classifyAttachment(attachmentId);

      // Update status to CLASSIFIED
      await this.updateAttachmentStatus(
        attachmentId,
        AttachmentProcessingStatus.CLASSIFIED,
      );

      // Route to extractor if applicable
      const updatedAttachment = await this.prisma.emailAttachment.findUnique({
        where: { id: attachmentId },
      });

      if (
        this.classifierService.shouldExtract(
          updatedAttachment.classifiedType,
          updatedAttachment.classificationConfidence,
        )
      ) {
        await this.routeToExtractor(updatedAttachment);
        await this.updateAttachmentStatus(
          attachmentId,
          AttachmentProcessingStatus.EXTRACTING,
        );
      } else {
        await this.updateAttachmentStatus(
          attachmentId,
          AttachmentProcessingStatus.COMPLETED,
        );
      }

      this.logger.log(`Successfully processed attachment: ${attachmentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process attachment ${attachmentId}: ${error.message}`,
        error.stack,
      );

      // Update attachment status to FAILED
      await this.prisma.emailAttachment.update({
        where: { id: attachmentId },
        data: {
          status: AttachmentProcessingStatus.FAILED,
          processingError: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  /**
   * Download attachment from email provider
   */
  private async downloadAttachmentFromProvider(
    provider: EmailProvider,
    connectionId: string,
    externalId: string,
    emailId: string,
    orgId: string,
    userId: string,
  ): Promise<Buffer> {
    if (provider === EmailProvider.GMAIL) {
      // Gmail doesn't have a downloadAttachment method - would need to implement
      // For now, throw error indicating this needs to be implemented
      throw new BadRequestException(
        'Gmail attachment download not yet implemented',
      );
    } else if (provider === EmailProvider.OUTLOOK) {
      // Outlook service expects a DTO
      const result = await this.outlookService.downloadAttachment({
        userId,
        orgId,
        messageId: emailId,
        attachmentId: externalId,
      });
      // Convert base64 to Buffer
      return Buffer.from(result.contentBytes, 'base64');
    } else {
      throw new BadRequestException(
        `Unsupported provider: ${provider}`,
      );
    }
  }

  /**
   * Scan attachment for viruses/malware (placeholder)
   * TODO: Integrate with ClamAV or VirusTotal
   */
  private async scanAttachment(
    attachmentId: string,
    content: Buffer,
  ): Promise<void> {
    this.logger.debug(`Scanning attachment: ${attachmentId}`);

    // Placeholder implementation
    // In production, integrate with ClamAV, VirusTotal, or similar service

    await this.prisma.emailAttachment.update({
      where: { id: attachmentId },
      data: {
        isScanned: true,
        scanResult: 'CLEAN', // CLEAN, INFECTED, SUSPICIOUS
        scanProvider: 'PLACEHOLDER',
        scannedAt: new Date(),
      },
    });
  }

  /**
   * Classify attachment using AI/heuristics
   */
  private async classifyAttachment(attachmentId: string): Promise<void> {
    const attachment = await this.prisma.emailAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        email: true,
      },
    });

    const classification = await this.classifierService.classifyAttachment(
      attachment.originalFilename,
      attachment.mimeType,
      attachment.email.subject,
    );

    await this.prisma.emailAttachment.update({
      where: { id: attachmentId },
      data: {
        classifiedType: classification.classifiedType,
        classificationConfidence: classification.confidence,
        classifiedAt: new Date(),
      },
    });

    // Update storage quota breakdown
    await this.updateStorageQuotaUsage(
      attachment.orgId,
      0, // Size already added
      classification.classifiedType,
    );

    this.logger.log(
      `Classified attachment ${attachmentId} as ${classification.classifiedType} (confidence: ${classification.confidence})`,
    );
  }

  /**
   * Route attachment to appropriate extractor
   */
  private async routeToExtractor(
    attachment: any,
  ): Promise<void> {
    const extractorRoute = this.classifierService.getExtractorRoute(
      attachment.classifiedType,
    );

    if (!extractorRoute) {
      this.logger.debug(
        `No extractor route for type: ${attachment.classifiedType}`,
      );
      return;
    }

    this.logger.log(
      `Routing attachment ${attachment.id} to ${extractorRoute}`,
    );

    try {
      // Retrieve attachment file from storage
      const fileBuffer = await this.storageService.retrieveAttachment(
        attachment.storagePath,
        attachment.storageBackend,
      );

      // Select appropriate queue based on extractor route
      const queue = extractorRoute === 'invoice-extractor'
        ? this.invoiceExtractionQueue
        : this.receiptExtractionQueue;

      const jobName = extractorRoute === 'invoice-extractor'
        ? 'extract'
        : 'extract';

      // Queue extraction job
      await queue.add(jobName, {
        attachmentId: attachment.id,
        organisationId: attachment.orgId,
        fileBuffer: fileBuffer,
        mimeType: attachment.mimeType,
        fileName: attachment.originalFilename,
        userId: attachment.userId,
        options: {
          maxRetries: 3,
          timeout: 60000,
          enableFallback: true,
        },
      });

      // Update extraction status
      await this.prisma.emailAttachment.update({
        where: { id: attachment.id },
        data: {
          extractionStatus: 'PENDING',
        },
      });

      this.logger.log(
        `Successfully queued attachment ${attachment.id} for ${extractorRoute}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to route attachment ${attachment.id} to extractor: ${error.message}`,
        error.stack,
      );

      // Update extraction status to FAILED
      await this.prisma.emailAttachment.update({
        where: { id: attachment.id },
        data: {
          extractionStatus: 'FAILED',
          processingError: `Failed to queue extraction: ${error.message}`,
        },
      });

      throw error;
    }
  }

  /**
   * Update attachment processing status
   */
  private async updateAttachmentStatus(
    attachmentId: string,
    status: AttachmentProcessingStatus,
  ): Promise<void> {
    await this.prisma.emailAttachment.update({
      where: { id: attachmentId },
      data: {
        status,
        processedAt:
          status === AttachmentProcessingStatus.COMPLETED ? new Date() : undefined,
      },
    });
  }

  /**
   * Extract attachment metadata from email
   */
  private extractAttachmentMetadata(email: any): Array<{
    filename: string;
    mimeType: string;
    size: number;
  }> {
    const metadata: Array<{
      filename: string;
      mimeType: string;
      size: number;
    }> = [];

    for (let i = 0; i < email.attachmentCount; i++) {
      metadata.push({
        filename: email.attachmentNames[i] || `attachment_${i}`,
        mimeType: email.attachmentMimeTypes[i] || 'application/octet-stream',
        size: email.attachmentSizes[i] || 0,
      });
    }

    return metadata;
  }

  /**
   * Create attachment records in database
   */
  private async createAttachmentRecords(
    email: any,
    metadata: Array<{ filename: string; mimeType: string; size: number }>,
    forceReprocess: boolean,
  ): Promise<any[]> {
    const records = [];

    for (let i = 0; i < metadata.length; i++) {
      const { filename, mimeType, size } = metadata[i];

      // Generate external ID (provider-specific attachment ID)
      // For Gmail: attachment ID, for Outlook: attachment ID
      const externalId = `att_${i}`;

      // Check if attachment already exists
      const existing = await this.prisma.emailAttachment.findFirst({
        where: {
          emailId: email.id,
          externalId,
        },
      });

      if (existing && !forceReprocess) {
        this.logger.debug(
          `Attachment already exists: ${existing.id}`,
        );
        records.push(existing);
        continue;
      }

      // Create or update attachment record
      const attachment = await this.prisma.emailAttachment.upsert({
        where: {
          emailId_externalId: {
            emailId: email.id,
            externalId,
          },
        },
        create: {
          emailId: email.id,
          orgId: email.orgId,
          userId: email.userId,
          provider: email.provider,
          externalId,
          filename,
          originalFilename: filename,
          mimeType,
          size,
          extension: this.getFileExtension(filename),
          status: AttachmentProcessingStatus.PENDING,
          storageBackend: this.storageService.getStorageBackend(),
          storagePath: '', // Will be set after download
        },
        update: {
          status: AttachmentProcessingStatus.PENDING,
          retryCount: 0,
          processingError: null,
        },
      });

      records.push(attachment);
    }

    return records;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string | null {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Check storage quota before processing
   */
  private async checkStorageQuota(orgId: string): Promise<void> {
    const quota = await this.getOrCreateStorageQuota(orgId);

    const usagePercentage = Number(
      (quota.usedSpace * BigInt(100)) / quota.totalQuota,
    );

    if (usagePercentage >= 100) {
      throw new BadRequestException(
        'Storage quota exceeded. Please upgrade your plan or delete old attachments.',
      );
    }

    if (usagePercentage >= quota.alertThreshold && !quota.alertSent) {
      // Send alert (implement notification service)
      await this.prisma.storageQuota.update({
        where: { orgId },
        data: {
          alertSent: true,
          alertSentAt: new Date(),
        },
      });

      this.logger.warn(
        `Storage quota alert: ${usagePercentage}% used for org ${orgId}`,
      );
    }
  }

  /**
   * Update storage quota usage
   */
  private async updateStorageQuotaUsage(
    orgId: string,
    sizeAdded: number,
    classifiedType?: AttachmentClassificationType,
  ): Promise<void> {
    const quota = await this.getOrCreateStorageQuota(orgId);

    const updateData: any = {
      usedSpace: { increment: sizeAdded },
      attachmentCount: { increment: sizeAdded > 0 ? 1 : 0 },
    };

    // Update type-specific usage
    if (classifiedType) {
      if (classifiedType === AttachmentClassificationType.INVOICE) {
        updateData.invoiceSpace = { increment: sizeAdded };
      } else if (classifiedType === AttachmentClassificationType.RECEIPT) {
        updateData.receiptSpace = { increment: sizeAdded };
      } else if (classifiedType === AttachmentClassificationType.STATEMENT) {
        updateData.statementSpace = { increment: sizeAdded };
      } else {
        updateData.otherSpace = { increment: sizeAdded };
      }
    }

    await this.prisma.storageQuota.update({
      where: { orgId },
      data: updateData,
    });
  }

  /**
   * Get or create storage quota for organization
   */
  private async getOrCreateStorageQuota(orgId: string): Promise<any> {
    let quota = await this.prisma.storageQuota.findUnique({
      where: { orgId },
    });

    if (!quota) {
      quota = await this.prisma.storageQuota.create({
        data: { orgId },
      });
    }

    return quota;
  }

  /**
   * Get storage quota for organization
   */
  async getStorageQuota(orgId: string): Promise<StorageQuotaResponseDto> {
    const quota = await this.getOrCreateStorageQuota(orgId);

    const availableSpace = quota.totalQuota - quota.usedSpace;
    const usagePercentage = Number(
      (quota.usedSpace * BigInt(100)) / quota.totalQuota,
    );

    return {
      orgId: quota.orgId,
      totalQuota: quota.totalQuota,
      usedSpace: quota.usedSpace,
      availableSpace: BigInt(availableSpace),
      usagePercentage: Number(usagePercentage),
      attachmentCount: quota.attachmentCount,
      invoiceSpace: quota.invoiceSpace,
      receiptSpace: quota.receiptSpace,
      statementSpace: quota.statementSpace,
      otherSpace: quota.otherSpace,
      alertThreshold: quota.alertThreshold,
      alertSent: quota.alertSent,
      isNearLimit: usagePercentage >= quota.alertThreshold,
    };
  }

  /**
   * Update storage quota settings
   */
  async updateStorageQuota(
    orgId: string,
    dto: UpdateStorageQuotaDto,
  ): Promise<StorageQuotaResponseDto> {
    await this.prisma.storageQuota.update({
      where: { orgId },
      data: dto,
    });

    return this.getStorageQuota(orgId);
  }

  /**
   * List attachments with filters
   */
  async listAttachments(
    orgId: string,
    dto: ListAttachmentsDto,
  ): Promise<{ attachments: AttachmentResponseDto[]; total: number }> {
    const where: any = { orgId };

    if (dto.emailId) {
      where.emailId = dto.emailId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.classifiedType) {
      where.classifiedType = dto.classifiedType;
    }

    if (dto.storageBackend) {
      where.storageBackend = dto.storageBackend;
    }

    const [attachments, total] = await Promise.all([
      this.prisma.emailAttachment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
      }),
      this.prisma.emailAttachment.count({ where }),
    ]);

    const attachmentDtos = await Promise.all(
      attachments.map((att) => this.toAttachmentResponseDto(att)),
    );

    return {
      attachments: attachmentDtos,
      total,
    };
  }

  /**
   * Convert attachment to response DTO
   */
  private async toAttachmentResponseDto(
    attachment: any,
  ): Promise<AttachmentResponseDto> {
    let downloadUrl: string | undefined;

    // Generate signed URL for S3 attachments
    if (
      attachment.storageBackend === AttachmentStorageBackend.S3 &&
      attachment.storagePath
    ) {
      try {
        downloadUrl = await this.storageService.generateSignedUrl(
          attachment.storagePath,
          3600, // 1 hour
        );
      } catch (error) {
        this.logger.warn(
          `Failed to generate signed URL for ${attachment.id}: ${error.message}`,
        );
      }
    }

    return {
      id: attachment.id,
      emailId: attachment.emailId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      extension: attachment.extension,
      storageBackend: attachment.storageBackend,
      status: attachment.status,
      classifiedType: attachment.classifiedType,
      classificationConfidence: attachment.classificationConfidence,
      downloadUrl,
      isScanned: attachment.isScanned,
      scanResult: attachment.scanResult,
      extractedDataId: attachment.extractedDataId,
      extractionStatus: attachment.extractionStatus,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    };
  }

  /**
   * Download attachment
   */
  async downloadAttachment(
    dto: DownloadAttachmentDto,
    orgId: string,
  ): Promise<{ content?: Buffer; url?: string }> {
    const attachment = await this.prisma.emailAttachment.findUnique({
      where: { id: dto.attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.orgId !== orgId) {
      throw new BadRequestException('Access denied');
    }

    // Return signed URL for S3
    if (
      dto.returnUrl &&
      attachment.storageBackend === AttachmentStorageBackend.S3
    ) {
      const url = await this.storageService.generateSignedUrl(
        attachment.storagePath,
        dto.expiresIn || 3600,
      );
      return { url };
    }

    // Return file content
    const content = await this.storageService.retrieveAttachment(
      attachment.storagePath,
      attachment.storageBackend,
    );

    return { content };
  }

  /**
   * Get attachment statistics
   */
  async getStatistics(orgId: string): Promise<AttachmentStatisticsDto> {
    const [
      totalAttachments,
      pendingAttachments,
      processedAttachments,
      failedAttachments,
      quarantinedAttachments,
      classificationCounts,
      storageCounts,
    ] = await Promise.all([
      this.prisma.emailAttachment.count({ where: { orgId } }),
      this.prisma.emailAttachment.count({
        where: { orgId, status: AttachmentProcessingStatus.PENDING },
      }),
      this.prisma.emailAttachment.count({
        where: { orgId, status: AttachmentProcessingStatus.COMPLETED },
      }),
      this.prisma.emailAttachment.count({
        where: { orgId, status: AttachmentProcessingStatus.FAILED },
      }),
      this.prisma.emailAttachment.count({
        where: { orgId, status: AttachmentProcessingStatus.QUARANTINED },
      }),
      this.prisma.emailAttachment.groupBy({
        by: ['classifiedType'],
        where: { orgId, classifiedType: { not: null } },
        _count: true,
      }),
      this.prisma.emailAttachment.groupBy({
        by: ['storageBackend'],
        where: { orgId },
        _count: true,
      }),
    ]);

    const classificationBreakdown: Record<string, number> = {};
    for (const item of classificationCounts) {
      classificationBreakdown[item.classifiedType] = item._count;
    }

    const storageBreakdown: Record<string, number> = {};
    for (const item of storageCounts) {
      storageBreakdown[item.storageBackend] = item._count;
    }

    // Calculate average processing time (placeholder)
    const averageProcessingTime = 5000; // 5 seconds

    // Get total storage used
    const quota = await this.getOrCreateStorageQuota(orgId);
    const totalStorageUsed = Number(quota.usedSpace);

    return {
      totalAttachments,
      pendingAttachments,
      processedAttachments,
      failedAttachments,
      quarantinedAttachments,
      classificationBreakdown,
      storageBreakdown,
      averageProcessingTime,
      totalStorageUsed,
    };
  }

  /**
   * Retry failed attachments
   */
  async retryFailedAttachments(
    orgId: string,
    dto: RetryFailedAttachmentsDto,
  ): Promise<{ queued: number; jobIds: string[] }> {
    const where: any = {
      orgId,
      status: AttachmentProcessingStatus.FAILED,
      retryCount: { lt: dto.maxRetries || 3 },
    };

    if (dto.emailId) {
      where.emailId = dto.emailId;
    }

    const failedAttachments = await this.prisma.emailAttachment.findMany({
      where,
    });

    const jobIds: string[] = [];
    for (const attachment of failedAttachments) {
      const job = await this.attachmentQueue.add('process-attachment', {
        attachmentId: attachment.id,
        emailId: attachment.emailId,
        provider: attachment.provider,
        externalId: attachment.externalId,
        orgId: attachment.orgId,
        userId: attachment.userId,
      });

      jobIds.push(job.id.toString());
    }

    return {
      queued: failedAttachments.length,
      jobIds,
    };
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(
    dto: DeleteAttachmentDto,
    orgId: string,
  ): Promise<void> {
    const attachment = await this.prisma.emailAttachment.findUnique({
      where: { id: dto.attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.orgId !== orgId) {
      throw new BadRequestException('Access denied');
    }

    // Delete from storage
    if (dto.deleteFromStorage && attachment.storagePath) {
      await this.storageService.deleteAttachment(
        attachment.storagePath,
        attachment.storageBackend,
      );
    }

    // Update storage quota
    await this.updateStorageQuotaUsage(orgId, -attachment.size, null);

    // Delete from database
    await this.prisma.emailAttachment.delete({
      where: { id: dto.attachmentId },
    });

    this.logger.log(`Deleted attachment: ${dto.attachmentId}`);
  }
}
