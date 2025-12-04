import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { RecurringInvoiceService } from './recurring-invoice.service';

/**
 * Recurring Invoice Job Processor
 * Handles background jobs for recurring invoice generation
 */
@Processor('recurring-invoices')
export class RecurringInvoiceProcessor {
  private readonly logger = new Logger(RecurringInvoiceProcessor.name);

  constructor(
    private readonly recurringInvoiceService: RecurringInvoiceService,
  ) {}

  /**
   * Process individual recurring invoice generation
   */
  @Process('generate')
  async handleGeneration(
    job: Job<{ recurringInvoiceId: string }>,
  ): Promise<void> {
    const { recurringInvoiceId } = job.data;

    this.logger.log(
      `Processing recurring invoice generation: ${recurringInvoiceId}`,
    );

    try {
      // Fetch the recurring invoice
      const recurringInvoice = await this.recurringInvoiceService.findOne(
        recurringInvoiceId,
      );

      // Check if it's still active and due
      if (!recurringInvoice.isActive) {
        this.logger.warn(
          `Recurring invoice ${recurringInvoiceId} is not active, skipping`,
        );
        return;
      }

      const now = new Date();
      if (recurringInvoice.nextRunDate > now) {
        this.logger.warn(
          `Recurring invoice ${recurringInvoiceId} is not due yet, skipping`,
        );
        return;
      }

      // Check if end date has passed
      if (
        recurringInvoice.endDate &&
        new Date(recurringInvoice.endDate) < now
      ) {
        this.logger.log(
          `Recurring invoice ${recurringInvoiceId} has ended, deactivating`,
        );
        await this.recurringInvoiceService.deactivate(
          recurringInvoiceId,
          recurringInvoice.organisationId,
        );
        return;
      }

      // Generate the invoice
      const invoice = await this.recurringInvoiceService.generateInvoice(
        recurringInvoice,
      );

      this.logger.log(
        `Successfully generated invoice ${invoice.number} from recurring invoice ${recurringInvoiceId}`,
      );

      // Update job progress
      await job.progress(100);
    } catch (error) {
      this.logger.error(
        `Failed to generate invoice from recurring invoice ${recurringInvoiceId}`,
        error.stack,
      );
      throw error; // Let Bull retry the job
    }
  }

  /**
   * Process check for due recurring invoices
   * This runs periodically to find and queue invoices that need generation
   */
  @Process('check-due')
  async handleDueCheck(job: Job): Promise<void> {
    this.logger.log('Checking for due recurring invoices...');

    try {
      // Get all recurring invoices due for processing
      const dueInvoices =
        await this.recurringInvoiceService.getDueForProcessing();

      this.logger.log(`Found ${dueInvoices.length} recurring invoices due`);

      // Queue each one for generation
      for (const recurringInvoice of dueInvoices) {
        // The scheduler will handle adding these to the queue
        this.logger.debug(
          `Recurring invoice ${recurringInvoice.id} is due for generation`,
        );
      }

      await job.progress(100);
    } catch (error) {
      this.logger.error('Failed to check for due recurring invoices', error.stack);
      throw error;
    }
  }
}
