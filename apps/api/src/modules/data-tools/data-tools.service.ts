import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DataExporterService } from './services/data-exporter.service';
import { DataDeletionService } from './services/data-deletion.service';
import { DataAnonymizerService } from './services/data-anonymizer.service';
import { BulkOperationsService } from './services/bulk-operations.service';
import { AuditTrailService } from '../gdpr/services/audit-trail.service';
import { GdprEventType, ActorType } from '../gdpr/types/gdpr.types';
import { ExportRequestDto, ExportResultDto, DeletionRequestDto, DeletionResultDto } from './dto';
import {
  ExportStatus,
  ExportFormat,
  DeletionStatus,
  DataCategory,
  DeletionMode,
  DeletionPreview,
  AnonymizationResult,
} from './types/data-tools.types';
import * as crypto from 'crypto';

/**
 * Data Tools Service
 * Core service orchestrating export, deletion, and anonymization operations
 */
@Injectable()
export class DataToolsService {
  private readonly logger = new Logger(DataToolsService.name);

  constructor(
    private readonly exporterService: DataExporterService,
    private readonly deletionService: DataDeletionService,
    private readonly anonymizerService: DataAnonymizerService,
    private readonly bulkOperationsService: BulkOperationsService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  /**
   * Start data export
   */
  async startExport(
    dto: ExportRequestDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ExportResultDto> {
    this.logger.log(`Starting export for user ${userId}, format: ${dto.format}`);

    try {
      // Determine target user (support admin override)
      const targetUserId = dto.userId || userId;
      const organisationId = dto.organisationId;

      // Convert date range strings to Date objects
      const options: any = {
        encrypted: dto.encrypted,
        includeDeleted: dto.includeDeleted,
        compress: dto.compress,
      };

      if (dto.dateRange) {
        options.dateRange = {
          start: new Date(dto.dateRange.start),
          end: new Date(dto.dateRange.end),
        };
      }

      // Log export request
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_EXPORTED,
        userId: targetUserId,
        organisationId,
        actorId: userId,
        actorType: ActorType.USER,
        resourceType: 'DataExport',
        details: {
          format: dto.format,
          categories: dto.categories,
          encrypted: dto.encrypted,
        },
        ipAddress,
        userAgent,
      });

      // Perform export
      const result = await this.exporterService.exportUserData(
        targetUserId,
        organisationId,
        dto.format,
        dto.categories,
        options,
      );

      return {
        jobId: result.jobId,
        status: result.status,
        fileUrl: result.fileUrl,
        fileSize: result.fileSize,
        downloadToken: result.downloadToken,
        expiresAt: result.expiresAt,
        recordsExported: result.recordsExported,
        categoriesExported: result.categoriesExported,
      };
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get export status
   */
  async getExportStatus(jobId: string, userId: string): Promise<ExportResultDto> {
    // This would query job status from queue/database
    // Placeholder implementation
    return {
      jobId,
      status: ExportStatus.COMPLETED,
      categoriesExported: [DataCategory.PROFILE],
    };
  }

  /**
   * Start data deletion
   */
  async startDeletion(
    dto: DeletionRequestDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DeletionResultDto> {
    this.logger.log(`Starting deletion for user ${userId}, mode: ${dto.mode}`);

    try {
      // Determine target user
      const targetUserId = dto.userId || userId;
      const organisationId = dto.organisationId;

      // Verify confirmation if required
      if (dto.confirmationRequired && !dto.confirmationToken) {
        const confirmationToken = this.deletionService.generateConfirmationToken();

        // Log confirmation request
        await this.auditTrailService.logEvent({
          eventType: GdprEventType.DATA_DELETED,
          userId: targetUserId,
          organisationId,
          actorId: userId,
          actorType: ActorType.USER,
          resourceType: 'DataDeletion',
          details: {
            status: 'confirmation_required',
            mode: dto.mode,
            categories: dto.categories,
          },
          ipAddress,
          userAgent,
        });

        return {
          jobId: crypto.randomUUID(),
          status: DeletionStatus.PENDING,
          recordsDeleted: 0,
          tablesAffected: [],
          categories: dto.categories,
          confirmationToken,
        };
      }

      // Parse scheduled date
      const options: any = {
        cascade: dto.cascade,
      };

      if (dto.scheduledFor) {
        options.scheduledFor = new Date(dto.scheduledFor);
      }

      // Log deletion request
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_DELETED,
        userId: targetUserId,
        organisationId,
        actorId: userId,
        actorType: ActorType.USER,
        resourceType: 'DataDeletion',
        details: {
          mode: dto.mode,
          categories: dto.categories,
          cascade: dto.cascade,
          scheduledFor: dto.scheduledFor,
        },
        ipAddress,
        userAgent,
      });

      // Perform deletion
      const result = await this.deletionService.deleteUserData(
        targetUserId,
        organisationId,
        dto.mode,
        dto.categories,
        options,
      );

      return {
        jobId: result.jobId,
        status: result.status,
        recordsDeleted: result.recordsDeleted,
        tablesAffected: result.tablesAffected,
        categories: result.categories,
      };
    } catch (error) {
      this.logger.error(`Deletion failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get deletion status
   */
  async getDeletionStatus(jobId: string, userId: string): Promise<DeletionResultDto> {
    // This would query job status from queue/database
    // Placeholder implementation
    return {
      jobId,
      status: DeletionStatus.COMPLETED,
      recordsDeleted: 0,
      tablesAffected: [],
      categories: [DataCategory.PROFILE],
    };
  }

  /**
   * Preview deletion
   */
  async previewDeletion(
    userId: string,
    categories: DataCategory[],
    organisationId?: string,
  ): Promise<DeletionPreview> {
    this.logger.log(`Generating deletion preview for user ${userId}`);

    return this.deletionService.previewDeletion(userId, organisationId, categories);
  }

  /**
   * Anonymize user data
   */
  async anonymizeUser(
    userId: string,
    organisationId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AnonymizationResult> {
    this.logger.log(`Anonymizing data for user ${userId}`);

    try {
      // Log anonymization request
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_ANONYMIZED,
        userId,
        organisationId,
        actorId: userId,
        actorType: ActorType.USER,
        resourceType: 'DataAnonymization',
        details: {
          organisationId,
        },
        ipAddress,
        userAgent,
      });

      // Perform anonymization
      const result = await this.anonymizerService.anonymizeUserData(userId, organisationId);

      // Log completion
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_ANONYMIZED,
        userId,
        organisationId,
        actorId: userId,
        actorType: ActorType.SYSTEM,
        resourceType: 'DataAnonymization',
        details: {
          success: result.success,
          recordsAnonymized: result.recordsAnonymized,
          tablesAffected: result.tablesAffected,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`Anonymization failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate download token
   */
  generateDownloadToken(fileUrl: string, userId: string): string {
    const payload = `${fileUrl}:${userId}:${Date.now()}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Validate download token
   */
  validateDownloadToken(token: string, fileUrl: string, userId: string): boolean {
    // Simple validation - real implementation would check expiration, etc.
    return token && token.length === 64;
  }

  /**
   * Get data tools statistics
   */
  async getStatistics(userId: string, organisationId?: string): Promise<{
    exports: { total: number; lastExport?: Date };
    deletions: { total: number; lastDeletion?: Date };
    anonymizations: { total: number };
  }> {
    // This would aggregate statistics from audit logs
    // Placeholder implementation
    return {
      exports: { total: 0 },
      deletions: { total: 0 },
      anonymizations: { total: 0 },
    };
  }
}
