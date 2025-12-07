import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EmailService } from '../../../notifications/channels/email.service';
import {
  CreateReminderDto,
  UpdateReminderSettingsDto,
  ReminderQueryDto,
} from './dto/payment-reminder.dto';
import {
  PaymentReminder,
  ReminderSettings,
  Invoice,
  ReminderStatus,
  ReminderType,
  InvoiceStatus,
} from '@prisma/client';
import { addDays, differenceInDays, isBefore } from 'date-fns';

/**
 * Payment Reminder Service
 * Manages payment reminders and reminder settings
 */
@Injectable()
export class PaymentReminderService {
  private readonly logger = new Logger(PaymentReminderService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Create a new payment reminder
   */
  async createReminder(
    organisationId: string,
    invoiceId: string,
    dto: CreateReminderDto,
  ): Promise<PaymentReminder> {
    // Verify invoice exists and belongs to organisation
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        orgId: organisationId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Check if invoice is already paid
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot create reminder for paid invoice');
    }

    const reminder = await this.prisma.paymentReminder.create({
      data: {
        organisationId,
        invoiceId,
        reminderType: dto.reminderType,
        scheduledFor: new Date(dto.scheduledFor),
        subject: dto.subject,
        body: dto.body,
        escalationLevel: dto.escalationLevel || 1,
        status: ReminderStatus.PENDING,
      },
    });

    this.logger.log(
      `Created reminder ${reminder.id} for invoice ${invoiceId}, scheduled for ${reminder.scheduledFor}`,
    );

    return reminder;
  }

  /**
   * Cancel a payment reminder
   */
  async cancelReminder(
    organisationId: string,
    reminderId: string,
  ): Promise<void> {
    const reminder = await this.prisma.paymentReminder.findFirst({
      where: {
        id: reminderId,
        organisationId,
      },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    if (reminder.status === ReminderStatus.SENT) {
      throw new BadRequestException('Cannot cancel already sent reminder');
    }

    await this.prisma.paymentReminder.update({
      where: { id: reminderId },
      data: { status: ReminderStatus.CANCELLED },
    });

    this.logger.log(`Cancelled reminder ${reminderId}`);
  }

  /**
   * Send a reminder immediately
   */
  async sendReminder(reminder: PaymentReminder & { invoice?: Invoice }): Promise<void> {
    try {
      // Get invoice if not already included
      const invoice = reminder.invoice || await this.prisma.invoice.findUnique({
        where: { id: reminder.invoiceId },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get customer email from invoice
      const customerEmail = invoice.customerEmail;
      if (!customerEmail) {
        throw new Error('Customer email not found on invoice');
      }

      this.logger.log(
        `Sending payment reminder ${reminder.id} to ${customerEmail}`,
      );

      // Send email using EmailService
      const emailSent = await this.emailService.send({
        to: customerEmail,
        subject: reminder.subject,
        title: reminder.subject,
        message: reminder.body,
        priority: reminder.escalationLevel + 2, // Map escalation (1-3) to priority (3-5)
        actionUrl: `${process.env.APP_URL || 'https://operate.guru'}/invoices/${invoice.id}`,
        actionText: 'View Invoice',
      });

      if (!emailSent) {
        throw new Error('Email service failed to send');
      }

      // Mark reminder as sent
      await this.prisma.paymentReminder.update({
        where: { id: reminder.id },
        data: {
          status: ReminderStatus.SENT,
          sentAt: new Date(),
        },
      });

      this.logger.log(`Successfully sent reminder ${reminder.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reminder ${reminder.id}: ${error.message}`,
      );

      await this.prisma.paymentReminder.update({
        where: { id: reminder.id },
        data: {
          status: ReminderStatus.FAILED,
          failureReason: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Send a reminder now (bypassing schedule)
   */
  async sendReminderNow(
    organisationId: string,
    reminderId: string,
  ): Promise<void> {
    const reminder = await this.prisma.paymentReminder.findFirst({
      where: {
        id: reminderId,
        organisationId,
      },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    if (reminder.status !== ReminderStatus.PENDING) {
      throw new BadRequestException(
        'Can only send pending reminders immediately',
      );
    }

    await this.sendReminder(reminder);
  }

  /**
   * Schedule reminders for an invoice based on settings
   */
  async scheduleRemindersForInvoice(
    invoice: Invoice,
  ): Promise<PaymentReminder[]> {
    const settings = await this.getSettings(invoice.orgId);

    if (!settings.enableAutoReminders) {
      this.logger.debug(
        `Auto-reminders disabled for organisation ${invoice.orgId}`,
      );
      return [];
    }

    const reminders: PaymentReminder[] = [];
    const now = new Date();

    // Schedule before-due reminders
    for (const days of settings.reminderDaysBeforeDue) {
      const scheduledDate = addDays(invoice.dueDate, -days);

      // Only schedule if date is in the future
      if (isBefore(now, scheduledDate)) {
        const reminder = await this.createReminder(invoice.orgId, invoice.id, {
          reminderType: ReminderType.BEFORE_DUE,
          scheduledFor: scheduledDate.toISOString(),
          subject: this.generateSubject(invoice, ReminderType.BEFORE_DUE),
          body: this.generateBody(
            invoice,
            settings.beforeDueTemplate,
            ReminderType.BEFORE_DUE,
          ),
          escalationLevel: 1,
        });
        reminders.push(reminder);
      }
    }

    // Schedule on-due reminder
    if (isBefore(now, invoice.dueDate)) {
      const reminder = await this.createReminder(invoice.orgId, invoice.id, {
        reminderType: ReminderType.ON_DUE,
        scheduledFor: invoice.dueDate.toISOString(),
        subject: this.generateSubject(invoice, ReminderType.ON_DUE),
        body: this.generateBody(
          invoice,
          settings.onDueTemplate,
          ReminderType.ON_DUE,
        ),
        escalationLevel: 1,
      });
      reminders.push(reminder);
    }

    // Schedule after-due reminders
    for (const days of settings.reminderDaysAfterDue) {
      const scheduledDate = addDays(invoice.dueDate, days);

      const reminder = await this.createReminder(invoice.orgId, invoice.id, {
        reminderType: ReminderType.AFTER_DUE,
        scheduledFor: scheduledDate.toISOString(),
        subject: this.generateSubject(invoice, ReminderType.AFTER_DUE),
        body: this.generateBody(
          invoice,
          settings.afterDueTemplate,
          ReminderType.AFTER_DUE,
        ),
        escalationLevel: 1,
      });
      reminders.push(reminder);
    }

    this.logger.log(
      `Scheduled ${reminders.length} reminders for invoice ${invoice.id}`,
    );

    return reminders;
  }

  /**
   * Cancel all reminders for an invoice
   */
  async cancelAllForInvoice(
    organisationId: string,
    invoiceId: string,
  ): Promise<void> {
    await this.prisma.paymentReminder.updateMany({
      where: {
        organisationId,
        invoiceId,
        status: ReminderStatus.PENDING,
      },
      data: {
        status: ReminderStatus.CANCELLED,
      },
    });

    this.logger.log(`Cancelled all pending reminders for invoice ${invoiceId}`);
  }

  /**
   * Get pending reminders for an organisation
   */
  async getPendingReminders(
    organisationId: string,
    query?: ReminderQueryDto,
  ): Promise<{ data: PaymentReminder[]; total: number; page: number; pageSize: number }> {
    const { status, reminderType, page = 1, pageSize = 20 } = query || {};

    const where = {
      organisationId,
      ...(status && { status }),
      ...(reminderType && { reminderType }),
    };

    const [data, total] = await Promise.all([
      this.prisma.paymentReminder.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              number: true,
              customerName: true,
              totalAmount: true,
              dueDate: true,
              status: true,
            },
          },
        },
        orderBy: { scheduledFor: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.paymentReminder.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /**
   * Get reminder history for an invoice
   */
  async getReminderHistory(
    organisationId: string,
    invoiceId: string,
  ): Promise<PaymentReminder[]> {
    return this.prisma.paymentReminder.findMany({
      where: {
        organisationId,
        invoiceId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get reminder settings for organisation
   */
  async getSettings(organisationId: string): Promise<ReminderSettings> {
    let settings = await this.prisma.reminderSettings.findUnique({
      where: { organisationId },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await this.prisma.reminderSettings.create({
        data: {
          organisationId,
          enableAutoReminders: true,
          reminderDaysBeforeDue: [7, 3, 1],
          reminderDaysAfterDue: [1, 7, 14, 30],
          autoEscalate: true,
          escalationThresholdDays: 14,
          maxEscalationLevel: 3,
        },
      });
    }

    return settings;
  }

  /**
   * Update reminder settings
   */
  async updateSettings(
    organisationId: string,
    dto: UpdateReminderSettingsDto,
  ): Promise<ReminderSettings> {
    // Ensure settings exist
    await this.getSettings(organisationId);

    const settings = await this.prisma.reminderSettings.update({
      where: { organisationId },
      data: dto,
    });

    this.logger.log(`Updated reminder settings for organisation ${organisationId}`);

    return settings;
  }

  /**
   * Get reminders that are due to be sent
   */
  async getDueReminders(): Promise<PaymentReminder[]> {
    const now = new Date();

    return this.prisma.paymentReminder.findMany({
      where: {
        status: ReminderStatus.PENDING,
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        invoice: true,
      },
    });
  }

  /**
   * Generate subject line for reminder
   */
  private generateSubject(invoice: Invoice, type: ReminderType): string {
    const prefix = {
      [ReminderType.BEFORE_DUE]: 'Upcoming payment',
      [ReminderType.ON_DUE]: 'Payment due today',
      [ReminderType.AFTER_DUE]: 'Payment overdue',
      [ReminderType.ESCALATION]: 'URGENT: Payment required',
    }[type];

    return `${prefix} - Invoice ${invoice.number}`;
  }

  /**
   * Generate body content for reminder
   */
  private generateBody(
    invoice: Invoice,
    template: string | null,
    type: ReminderType,
  ): string {
    if (template) {
      return this.replaceTemplatePlaceholders(template, invoice);
    }

    // Default templates
    const defaultTemplates = {
      [ReminderType.BEFORE_DUE]: `Dear ${invoice.customerName},\n\nThis is a friendly reminder that Invoice ${invoice.number} for ${invoice.totalAmount.toString()} ${invoice.currency} is due on ${invoice.dueDate.toLocaleDateString()}.\n\nPlease ensure payment is made by the due date to avoid any late fees.\n\nBest regards`,
      [ReminderType.ON_DUE]: `Dear ${invoice.customerName},\n\nInvoice ${invoice.number} for ${invoice.totalAmount.toString()} ${invoice.currency} is due today.\n\nPlease process payment at your earliest convenience.\n\nBest regards`,
      [ReminderType.AFTER_DUE]: `Dear ${invoice.customerName},\n\nInvoice ${invoice.number} for ${invoice.totalAmount.toString()} ${invoice.currency} is now overdue.\n\nPlease arrange payment immediately to avoid further action.\n\nBest regards`,
      [ReminderType.ESCALATION]: `Dear ${invoice.customerName},\n\nDespite previous reminders, Invoice ${invoice.number} for ${invoice.totalAmount.toString()} ${invoice.currency} remains unpaid.\n\nImmediate payment is required. If payment is not received within 7 days, we may need to take further action.\n\nBest regards`,
    };

    return defaultTemplates[type];
  }

  /**
   * Replace template placeholders
   */
  private replaceTemplatePlaceholders(
    template: string,
    invoice: Invoice,
  ): string {
    const daysOverdue = differenceInDays(new Date(), invoice.dueDate);

    return template
      .replace(/{customerName}/g, invoice.customerName)
      .replace(/{invoiceNumber}/g, invoice.number)
      .replace(/{totalAmount}/g, invoice.totalAmount.toString())
      .replace(/{currency}/g, invoice.currency)
      .replace(/{dueDate}/g, invoice.dueDate.toLocaleDateString())
      .replace(/{daysOverdue}/g, Math.max(0, daysOverdue).toString());
  }
}
