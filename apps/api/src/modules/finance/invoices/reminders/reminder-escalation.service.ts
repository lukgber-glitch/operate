import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  Invoice,
  PaymentReminder,
  ReminderSettings,
  ReminderType,
  ReminderStatus,
  InvoiceStatus,
} from '@prisma/client';
import { differenceInDays } from 'date-fns';

/**
 * Reminder Escalation Service
 * Handles escalation logic for overdue invoices
 */
@Injectable()
export class ReminderEscalationService {
  private readonly logger = new Logger(ReminderEscalationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Determine if an invoice should be escalated
   */
  async shouldEscalate(invoice: Invoice): Promise<boolean> {
    // Don't escalate paid or cancelled invoices
    if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      return false;
    }

    const settings = await this.getSettings(invoice.orgId);

    // Check if auto-escalation is enabled
    if (!settings.autoEscalate) {
      return false;
    }

    const daysOverdue = this.getDaysOverdue(invoice);

    // Not overdue yet
    if (daysOverdue <= 0) {
      return false;
    }

    const currentLevel = await this.getEscalationLevel(invoice);

    // Already at max level
    if (currentLevel >= settings.maxEscalationLevel) {
      return false;
    }

    // Check if we should escalate based on days overdue
    const shouldEscalate = this.shouldEscalateByDays(
      daysOverdue,
      currentLevel,
      settings,
    );

    return shouldEscalate;
  }

  /**
   * Escalate an invoice to the next level
   */
  async escalate(invoice: Invoice): Promise<PaymentReminder> {
    const settings = await this.getSettings(invoice.orgId);
    const currentLevel = await this.getEscalationLevel(invoice);
    const newLevel = Math.min(
      currentLevel + 1,
      settings.maxEscalationLevel,
    );

    this.logger.log(
      `Escalating invoice ${invoice.id} from level ${currentLevel} to ${newLevel}`,
    );

    // Get escalation template
    const template = await this.getEscalationTemplate(newLevel, settings);
    const { subject, body } = await this.personalizeReminder(template, invoice);

    // Create escalation reminder
    const reminder = await this.prisma.paymentReminder.create({
      data: {
        organisationId: invoice.orgId,
        invoiceId: invoice.id,
        reminderType: ReminderType.ESCALATION,
        scheduledFor: new Date(), // Send immediately
        subject,
        body,
        escalationLevel: newLevel,
        status: ReminderStatus.PENDING,
      },
    });

    this.logger.log(
      `Created escalation reminder ${reminder.id} at level ${newLevel} for invoice ${invoice.id}`,
    );

    return reminder;
  }

  /**
   * Get current escalation level for an invoice
   */
  async getEscalationLevel(invoice: Invoice): Promise<number> {
    const latestReminder = await this.prisma.paymentReminder.findFirst({
      where: {
        invoiceId: invoice.id,
      },
      orderBy: {
        escalationLevel: 'desc',
      },
    });

    return latestReminder?.escalationLevel || 0;
  }

  /**
   * Get escalation template based on level
   */
  async getEscalationTemplate(
    level: number,
    settings: ReminderSettings,
  ): Promise<string> {
    // Use custom template if available
    if (settings.escalationTemplate) {
      return settings.escalationTemplate;
    }

    // Default templates by level
    const templates = {
      1: `Dear {customerName},

We notice that Invoice {invoiceNumber} for {totalAmount} {currency}, which was due on {dueDate}, remains unpaid.

This invoice is now {daysOverdue} days overdue. We kindly request that you arrange payment at your earliest convenience.

If you have any questions or are experiencing difficulties, please contact us immediately so we can work together to resolve this matter.

Best regards`,

      2: `Dear {customerName},

PAYMENT REMINDER - INVOICE OVERDUE

Invoice {invoiceNumber} for {totalAmount} {currency} is now {daysOverdue} days overdue (due date: {dueDate}).

Despite our previous reminders, we have not yet received payment. Please arrange immediate payment to avoid:
• Late payment fees
• Service interruption
• Credit restrictions

If payment has already been made, please provide proof of payment. Otherwise, please settle this invoice within the next 7 days.

Best regards`,

      3: `Dear {customerName},

FINAL NOTICE - URGENT ACTION REQUIRED

Invoice {invoiceNumber} for {totalAmount} {currency} is seriously overdue ({daysOverdue} days past due date: {dueDate}).

This is our final reminder before we are forced to take further action, which may include:
• Engagement of a collection agency
• Legal proceedings
• Credit reporting
• Suspension of services

IMMEDIATE PAYMENT IS REQUIRED WITHIN 5 BUSINESS DAYS.

If there are extenuating circumstances, please contact us immediately to discuss payment arrangements.

Regards`,
    };

    return templates[level] || templates[3];
  }

  /**
   * Personalize reminder with invoice data
   */
  async personalizeReminder(
    template: string,
    invoice: Invoice,
  ): Promise<{ subject: string; body: string }> {
    const daysOverdue = this.getDaysOverdue(invoice);
    const level = await this.getEscalationLevel(invoice);

    const body = template
      .replace(/{customerName}/g, invoice.customerName)
      .replace(/{invoiceNumber}/g, invoice.number)
      .replace(/{totalAmount}/g, invoice.totalAmount.toString())
      .replace(/{currency}/g, invoice.currency)
      .replace(/{dueDate}/g, invoice.dueDate.toLocaleDateString())
      .replace(/{daysOverdue}/g, Math.max(0, daysOverdue).toString());

    const subjectPrefixes = {
      1: 'Payment Reminder',
      2: 'URGENT: Payment Required',
      3: 'FINAL NOTICE',
    };

    const subject = `${subjectPrefixes[level + 1] || 'Payment Notice'} - Invoice ${invoice.number}`;

    return { subject, body };
  }

  /**
   * Get all invoices that need escalation
   */
  async getInvoicesForEscalation(organisationId?: string): Promise<Invoice[]> {
    const where = {
      ...(organisationId && { orgId: organisationId }),
      status: {
        notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
      },
      dueDate: {
        lt: new Date(), // Overdue
      },
    };

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        reminders: {
          orderBy: { escalationLevel: 'desc' },
          take: 1,
        },
      },
    });

    // Filter invoices that should be escalated
    const invoicesToEscalate: Invoice[] = [];

    for (const invoice of invoices) {
      if (await this.shouldEscalate(invoice)) {
        invoicesToEscalate.push(invoice);
      }
    }

    return invoicesToEscalate;
  }

  /**
   * Get days overdue for an invoice
   */
  private getDaysOverdue(invoice: Invoice): number {
    return differenceInDays(new Date(), invoice.dueDate);
  }

  /**
   * Check if we should escalate based on days overdue
   */
  private shouldEscalateByDays(
    daysOverdue: number,
    currentLevel: number,
    settings: ReminderSettings,
  ): boolean {
    // Level 1 (Friendly): 1-7 days overdue
    if (currentLevel === 0 && daysOverdue >= 1 && daysOverdue <= 7) {
      return true;
    }

    // Level 2 (Firm): 8-21 days overdue
    if (currentLevel === 1 && daysOverdue >= 8 && daysOverdue <= 21) {
      return true;
    }

    // Level 3 (Final Notice): 22+ days overdue
    if (currentLevel === 2 && daysOverdue >= 22) {
      return true;
    }

    return false;
  }

  /**
   * Get reminder settings (with fallback)
   */
  private async getSettings(organisationId: string): Promise<ReminderSettings> {
    let settings = await this.prisma.reminderSettings.findUnique({
      where: { organisationId },
    });

    if (!settings) {
      // Create default settings
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
   * Get escalation statistics for an organisation
   */
  async getEscalationStats(organisationId: string): Promise<{
    level1: number;
    level2: number;
    level3: number;
    totalOverdue: number;
  }> {
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organisationId,
        status: {
          notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
        },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        reminders: {
          orderBy: { escalationLevel: 'desc' },
          take: 1,
        },
      },
    });

    const stats = {
      level1: 0,
      level2: 0,
      level3: 0,
      totalOverdue: overdueInvoices.length,
    };

    for (const invoice of overdueInvoices) {
      const daysOverdue = this.getDaysOverdue(invoice);

      if (daysOverdue >= 1 && daysOverdue <= 7) {
        stats.level1++;
      } else if (daysOverdue >= 8 && daysOverdue <= 21) {
        stats.level2++;
      } else if (daysOverdue >= 22) {
        stats.level3++;
      }
    }

    return stats;
  }
}
