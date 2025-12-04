import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DataExporterService } from '../services/data-exporter.service';
import { AuditTrailService } from '../../gdpr/services/audit-trail.service';
import { GdprEventType, ActorType } from '../../gdpr/types/gdpr.types';
import { ExportFormat, DataCategory } from '../types/data-tools.types';

/**
 * Export Job Data Interface
 */
export interface ExportJobData {
  jobId: string;
  userId: string;
  organisationId?: string;
  format: ExportFormat;
  categories: DataCategory[];
  options: {
    encrypted?: boolean;
    includeDeleted?: boolean;
    dateRange?: { start: Date; end: Date };
    compress?: boolean;
  };
  requestedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Data Export Processor
 * Background job processor for data export operations
 */
@Injectable()
export class DataExportProcessor {
  private readonly logger = new Logger(DataExportProcessor.name);

  constructor(
    private readonly exporterService: DataExporterService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  /**
   * Process export job
   */
  async process(job: Job<ExportJobData>) {
    this.logger.log(`Processing export job ${job.data.jobId} for user ${job.data.userId}`);

    const startTime = Date.now();

    try {
      // Update job progress
      await job.progress(10);

      // Log export start
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_EXPORTED,
        userId: job.data.userId,
        organisationId: job.data.organisationId,
        actorId: job.data.requestedBy,
        actorType: ActorType.USER,
        resourceType: 'DataExport',
        resourceId: job.data.jobId,
        details: {
          format: job.data.format,
          categories: job.data.categories,
          jobId: job.data.jobId,
        },
        ipAddress: job.data.ipAddress,
        userAgent: job.data.userAgent,
      });

      await job.progress(20);

      // Perform export
      const result = await this.exporterService.exportUserData(
        job.data.userId,
        job.data.organisationId,
        job.data.format,
        job.data.categories,
        job.data.options,
      );

      await job.progress(90);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Export job ${job.data.jobId} completed in ${processingTime}ms. File: ${result.fileUrl}`,
      );

      // Log successful completion
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_EXPORTED,
        userId: job.data.userId,
        organisationId: job.data.organisationId,
        actorId: job.data.requestedBy,
        actorType: ActorType.SYSTEM,
        resourceType: 'DataExport',
        resourceId: job.data.jobId,
        details: {
          status: 'completed',
          fileUrl: result.fileUrl,
          fileSize: result.fileSize,
          recordsExported: result.recordsExported,
          processingTimeMs: processingTime,
        },
      });

      await job.progress(100);

      return {
        success: true,
        jobId: job.data.jobId,
        result,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Export job ${job.data.jobId} failed: ${error.message}`, error.stack);

      // Log failure
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_EXPORTED,
        userId: job.data.userId,
        organisationId: job.data.organisationId,
        actorId: job.data.requestedBy,
        actorType: ActorType.SYSTEM,
        resourceType: 'DataExport',
        resourceId: job.data.jobId,
        details: {
          status: 'failed',
          error: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }

  /**
   * Handle job completion
   */
  async onCompleted(job: Job<ExportJobData>, result: any) {
    this.logger.log(`Export job ${job.data.jobId} completed successfully`);
  }

  /**
   * Handle job failure
   */
  async onFailed(job: Job<ExportJobData>, error: Error) {
    this.logger.error(`Export job ${job.data.jobId} failed: ${error.message}`);

    // Could send notification to user here
  }

  /**
   * Handle job progress
   */
  async onProgress(job: Job<ExportJobData>, progress: number) {
    this.logger.debug(`Export job ${job.data.jobId} progress: ${progress}%`);
  }
}
