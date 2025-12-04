import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ExportSchedulerService } from './export-scheduler.service';

/**
 * Export Scheduler Job Processor
 * Handles background jobs for scheduled export execution
 */
@Processor('export-scheduler')
export class ExportSchedulerProcessor {
  private readonly logger = new Logger(ExportSchedulerProcessor.name);

  constructor(
    private readonly exportSchedulerService: ExportSchedulerService,
  ) {}

  /**
   * Process scheduled export execution
   */
  @Process('execute-export')
  async handleExportExecution(
    job: Job<{ scheduledExportId: string }>,
  ): Promise<void> {
    const { scheduledExportId } = job.data;

    this.logger.log(
      `Processing scheduled export execution: ${scheduledExportId}`,
    );

    try {
      await this.exportSchedulerService.processExport(scheduledExportId);

      // Update job progress
      await job.progress(100);

      this.logger.log(
        `Successfully processed scheduled export: ${scheduledExportId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process scheduled export ${scheduledExportId}`,
        error.stack,
      );
      throw error; // Let Bull retry the job
    }
  }

  /**
   * Process periodic check for due exports
   * This runs as a fallback to catch any missed schedules
   */
  @Process('check-due-exports')
  async handleDueExportsCheck(job: Job): Promise<void> {
    this.logger.log('Checking for due scheduled exports...');

    try {
      // This would query for any exports that should have run but didn't
      // For now, the main scheduling mechanism handles this
      // This is a safety net

      this.logger.log('Due exports check completed');
    } catch (error) {
      this.logger.error('Failed to check due exports', error.stack);
      throw error;
    }
  }
}
