import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentReminderService } from './payment-reminder.service';
import { ReminderEscalationService } from './reminder-escalation.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { InvoiceStatus } from '@prisma/client';

/**
 * Reminder Processor
 * Handles background jobs for sending and escalating payment reminders
 */
@Processor('payment-reminders')
@Injectable()
export class ReminderProcessor {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private reminderService: PaymentReminderService,
    private escalationService: ReminderEscalationService,
    private prisma: PrismaService,
  ) {}

  /**
   * Process: Send a specific reminder
   */
  @Process('send')
  async handleSend(job: Job<{ reminderId: string }>): Promise<void> {
    const { reminderId } = job.data;

    this.logger.log(`Processing send job for reminder ${reminderId}`);

    try {
      const reminder = await this.prisma.paymentReminder.findUnique({
        where: { id: reminderId },
        include: { invoice: true },
      });

      if (!reminder) {
        this.logger.warn(`Reminder ${reminderId} not found`);
        return;
      }

      // Check if invoice is still unpaid
      if (reminder.invoice.status === InvoiceStatus.PAID) {
        this.logger.log(
          `Skipping reminder ${reminderId} - invoice is paid`,
        );
        await this.reminderService.cancelReminder(
          reminder.organisationId,
          reminderId,
        );
        return;
      }

      // Send the reminder
      await this.reminderService.sendReminder(reminder);

      this.logger.log(`Successfully sent reminder ${reminderId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reminder ${reminderId}: ${error.message}`,
        error.stack,
      );
      throw error; // Bull will retry
    }
  }

  /**
   * Process: Check for overdue invoices and send reminders
   */
  @Process('check-overdue')
  async handleOverdueCheck(job: Job): Promise<void> {
    this.logger.log('Processing overdue check job');

    try {
      // Get all due reminders
      const dueReminders = await this.reminderService.getDueReminders();

      this.logger.log(`Found ${dueReminders.length} reminders to send`);

      for (const reminder of dueReminders) {
        // Check if invoice is still unpaid
        if (reminder.invoice.status === InvoiceStatus.PAID) {
          this.logger.log(
            `Skipping reminder ${reminder.id} - invoice is paid`,
          );
          await this.reminderService.cancelReminder(
            reminder.organisationId,
            reminder.id,
          );
          continue;
        }

        // Send reminder
        try {
          await this.reminderService.sendReminder(reminder);
          this.logger.log(`Sent reminder ${reminder.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to send reminder ${reminder.id}: ${error.message}`,
          );
          // Continue with other reminders
        }
      }

      this.logger.log('Completed overdue check job');
    } catch (error) {
      this.logger.error(
        `Failed to process overdue check: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process: Check for escalations
   */
  @Process('check-escalations')
  async handleCheckEscalations(job: Job): Promise<void> {
    this.logger.log('Processing escalation check job');

    try {
      // Get all invoices that need escalation
      const invoices = await this.escalationService.getInvoicesForEscalation();

      this.logger.log(`Found ${invoices.length} invoices for escalation`);

      for (const invoice of invoices) {
        try {
          const reminder = await this.escalationService.escalate(invoice);

          // Send escalation immediately
          await this.reminderService.sendReminder(reminder);

          this.logger.log(
            `Escalated and sent reminder for invoice ${invoice.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to escalate invoice ${invoice.id}: ${error.message}`,
          );
          // Continue with other invoices
        }
      }

      this.logger.log('Completed escalation check job');
    } catch (error) {
      this.logger.error(
        `Failed to process escalation check: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process: Escalate a specific invoice
   */
  @Process('escalate')
  async handleEscalation(job: Job<{ invoiceId: string }>): Promise<void> {
    const { invoiceId } = job.data;

    this.logger.log(`Processing escalation job for invoice ${invoiceId}`);

    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        this.logger.warn(`Invoice ${invoiceId} not found`);
        return;
      }

      // Check if should escalate
      const shouldEscalate = await this.escalationService.shouldEscalate(
        invoice,
      );

      if (!shouldEscalate) {
        this.logger.log(
          `Invoice ${invoiceId} does not need escalation`,
        );
        return;
      }

      // Escalate
      const reminder = await this.escalationService.escalate(invoice);

      // Send escalation immediately
      await this.reminderService.sendReminder(reminder);

      this.logger.log(
        `Successfully escalated invoice ${invoiceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to escalate invoice ${invoiceId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process: Schedule reminders for a new invoice
   */
  @Process('schedule-for-invoice')
  async handleScheduleForInvoice(
    job: Job<{ invoiceId: string }>,
  ): Promise<void> {
    const { invoiceId } = job.data;

    this.logger.log(
      `Processing schedule job for invoice ${invoiceId}`,
    );

    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        this.logger.warn(`Invoice ${invoiceId} not found`);
        return;
      }

      // Schedule reminders
      const reminders = await this.reminderService.scheduleRemindersForInvoice(
        invoice,
      );

      this.logger.log(
        `Scheduled ${reminders.length} reminders for invoice ${invoiceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule reminders for invoice ${invoiceId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process: Cancel reminders for a paid invoice
   */
  @Process('cancel-for-invoice')
  async handleCancelForInvoice(
    job: Job<{ organisationId: string; invoiceId: string }>,
  ): Promise<void> {
    const { organisationId, invoiceId } = job.data;

    this.logger.log(
      `Processing cancel job for invoice ${invoiceId}`,
    );

    try {
      await this.reminderService.cancelAllForInvoice(
        organisationId,
        invoiceId,
      );

      this.logger.log(
        `Cancelled all reminders for invoice ${invoiceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cancel reminders for invoice ${invoiceId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
