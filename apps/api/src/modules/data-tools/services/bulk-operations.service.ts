import { Injectable, Logger } from '@nestjs/common';
import { DataExporterService } from './data-exporter.service';
import { DataDeletionService } from './data-deletion.service';
import { DataAnonymizerService } from './data-anonymizer.service';
import { BulkOperationResult, ExportFormat, DeletionMode, DataCategory } from '../types/data-tools.types';

/**
 * Bulk Operations Service
 * Handles batch export and deletion operations
 */
@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);

  constructor(
    private readonly exporterService: DataExporterService,
    private readonly deletionService: DataDeletionService,
    private readonly anonymizerService: DataAnonymizerService,
  ) {}

  /**
   * Bulk export data for multiple users
   */
  async bulkExport(
    userIds: string[],
    format: ExportFormat,
    categories: DataCategory[],
    options: {
      encrypted?: boolean;
      compress?: boolean;
    } = {},
  ): Promise<BulkOperationResult> {
    this.logger.log(`Starting bulk export for ${userIds.length} users`);

    const jobIds: string[] = [];
    const errors: Record<string, string> = {};
    let successfulJobs = 0;

    for (const userId of userIds) {
      try {
        const result = await this.exporterService.exportUserData(
          userId,
          undefined,
          format,
          categories,
          options,
        );

        jobIds.push(result.jobId);
        successfulJobs++;
        this.logger.log(`Export successful for user ${userId}: ${result.jobId}`);
      } catch (error) {
        this.logger.error(`Export failed for user ${userId}: ${error.message}`);
        errors[userId] = error.message;
      }
    }

    return {
      totalJobs: userIds.length,
      successfulJobs,
      failedJobs: userIds.length - successfulJobs,
      jobIds,
      errors,
    };
  }

  /**
   * Bulk delete data for multiple users
   */
  async bulkDelete(
    userIds: string[],
    mode: DeletionMode,
    categories: DataCategory[],
    options: {
      cascade?: boolean;
    } = {},
  ): Promise<BulkOperationResult> {
    this.logger.log(`Starting bulk deletion for ${userIds.length} users, mode: ${mode}`);

    const jobIds: string[] = [];
    const errors: Record<string, string> = {};
    let successfulJobs = 0;

    for (const userId of userIds) {
      try {
        const result = await this.deletionService.deleteUserData(
          userId,
          undefined,
          mode,
          categories,
          options,
        );

        jobIds.push(result.jobId);
        successfulJobs++;
        this.logger.log(`Deletion successful for user ${userId}: ${result.jobId}`);
      } catch (error) {
        this.logger.error(`Deletion failed for user ${userId}: ${error.message}`);
        errors[userId] = error.message;
      }
    }

    return {
      totalJobs: userIds.length,
      successfulJobs,
      failedJobs: userIds.length - successfulJobs,
      jobIds,
      errors,
    };
  }

  /**
   * Bulk anonymize data for multiple users
   */
  async bulkAnonymize(userIds: string[]): Promise<BulkOperationResult> {
    this.logger.log(`Starting bulk anonymization for ${userIds.length} users`);

    const jobIds: string[] = [];
    const errors: Record<string, string> = {};
    let successfulJobs = 0;

    for (const userId of userIds) {
      try {
        const result = await this.anonymizerService.anonymizeUserData(userId);

        if (result.success) {
          jobIds.push(`anon_${userId}`);
          successfulJobs++;
          this.logger.log(`Anonymization successful for user ${userId}`);
        } else {
          throw new Error(result.errors?.join(', ') || 'Anonymization failed');
        }
      } catch (error) {
        this.logger.error(`Anonymization failed for user ${userId}: ${error.message}`);
        errors[userId] = error.message;
      }
    }

    return {
      totalJobs: userIds.length,
      successfulJobs,
      failedJobs: userIds.length - successfulJobs,
      jobIds,
      errors,
    };
  }

  /**
   * Export and then delete (right to be forgotten workflow)
   */
  async exportAndDelete(
    userId: string,
    organisationId: string | undefined,
    exportFormat: ExportFormat,
    deletionMode: DeletionMode,
    categories: DataCategory[],
  ): Promise<{
    exportResult: any;
    deletionResult: any;
    success: boolean;
    error?: string;
  }> {
    this.logger.log(`Starting export-and-delete workflow for user ${userId}`);

    try {
      // Step 1: Export data
      const exportResult = await this.exporterService.exportUserData(
        userId,
        organisationId,
        exportFormat,
        categories,
        { compress: true, encrypted: true },
      );

      this.logger.log(`Export completed for user ${userId}: ${exportResult.jobId}`);

      // Step 2: Delete data
      const deletionResult = await this.deletionService.deleteUserData(
        userId,
        organisationId,
        deletionMode,
        categories,
        { cascade: true },
      );

      this.logger.log(`Deletion completed for user ${userId}: ${deletionResult.jobId}`);

      return {
        exportResult,
        deletionResult,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Export-and-delete workflow failed for user ${userId}: ${error.message}`);
      return {
        exportResult: null,
        deletionResult: null,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Schedule bulk deletion
   */
  async scheduleBulkDeletion(
    userIds: string[],
    scheduledFor: Date,
    mode: DeletionMode,
    categories: DataCategory[],
  ): Promise<{
    scheduledJobs: number;
    scheduledDate: Date;
    jobIds: string[];
  }> {
    this.logger.log(
      `Scheduling bulk deletion for ${userIds.length} users on ${scheduledFor.toISOString()}`,
    );

    const jobIds: string[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.deletionService.deleteUserData(userId, undefined, mode, categories, {
          scheduledFor,
        });

        jobIds.push(result.jobId);
      } catch (error) {
        this.logger.error(`Failed to schedule deletion for user ${userId}: ${error.message}`);
      }
    }

    return {
      scheduledJobs: jobIds.length,
      scheduledDate: scheduledFor,
      jobIds,
    };
  }

  /**
   * Get bulk operation statistics
   */
  async getBulkOperationStats(organisationId?: string): Promise<{
    totalExports: number;
    totalDeletions: number;
    totalAnonymizations: number;
    recentOperations: any[];
  }> {
    // This would query job/operation history
    // Placeholder for now
    return {
      totalExports: 0,
      totalDeletions: 0,
      totalAnonymizations: 0,
      recentOperations: [],
    };
  }

  /**
   * Validate bulk operation request
   */
  validateBulkRequest(userIds: string[], maxBatchSize = 100): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!userIds || userIds.length === 0) {
      errors.push('User IDs array cannot be empty');
    }

    if (userIds.length > maxBatchSize) {
      errors.push(`Batch size exceeds maximum of ${maxBatchSize} users`);
    }

    // Check for duplicates
    const uniqueIds = new Set(userIds);
    if (uniqueIds.size !== userIds.length) {
      errors.push('Duplicate user IDs detected in request');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
