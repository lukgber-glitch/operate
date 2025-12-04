/**
 * Search Reindex Job Processor
 * Handles background reindexing of all searchable entities
 */

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SearchService } from '../modules/search/search.service';

interface ReindexJobData {
  orgId: string;
  userId: string;
  timestamp: string;
}

@Processor('search-reindex')
export class SearchReindexProcessor {
  private readonly logger = new Logger(SearchReindexProcessor.name);

  constructor(private readonly searchService: SearchService) {}

  /**
   * Process full reindex job
   */
  @Process('reindex-all')
  async handleReindexAll(job: Job<ReindexJobData>): Promise<any> {
    const { orgId, userId, timestamp } = job.data;

    this.logger.log(
      `Starting reindex job ${job.id} for org ${orgId} (requested by ${userId} at ${timestamp})`,
    );

    try {
      // Update job progress
      await job.progress(10);

      // Execute reindex
      const result = await this.searchService.reindexAll(orgId);

      await job.progress(90);

      this.logger.log(
        `Reindex job ${job.id} completed: ${result.total} entities indexed`,
      );

      // Log breakdown by type
      for (const [type, count] of Object.entries(result.byType)) {
        this.logger.debug(`  - ${type}: ${count} entities`);
      }

      await job.progress(100);

      return {
        success: true,
        orgId,
        userId,
        total: result.total,
        byType: result.byType,
        startTime: timestamp,
        endTime: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Reindex job ${job.id} failed for org ${orgId}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  /**
   * Handle job completion
   */
  @Process('reindex-complete')
  async handleReindexComplete(job: Job): Promise<void> {
    this.logger.log(`Reindex job ${job.id} completed successfully`);
  }

  /**
   * Handle job failure
   */
  @Process('reindex-failed')
  async handleReindexFailed(job: Job, error: Error): Promise<void> {
    this.logger.error(
      `Reindex job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
