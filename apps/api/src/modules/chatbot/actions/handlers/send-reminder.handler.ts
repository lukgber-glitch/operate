/**
 * Send Reminder Action Handler
 * Handles sending payment reminders via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { NotificationsService } from '../../../notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SendReminderHandler extends BaseActionHandler {
  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {
    super('SendReminderHandler');
  }

  get actionType(): ActionType {
    return ActionType.SEND_REMINDER;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'invoiceId',
        type: 'string',
        required: true,
        description: 'Invoice ID to send reminder for',
      },
      {
        name: 'reminderType',
        type: 'string',
        required: false,
        description: 'Type of reminder (gentle, firm, final)',
        default: 'gentle',
        validation: (value) => ['gentle', 'firm', 'final'].includes(value.toLowerCase()),
      },
      {
        name: 'customMessage',
        type: 'string',
        required: false,
        description: 'Custom message to include in reminder',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'invoices:send')) {
        return this.error(
          'You do not have permission to send invoice reminders',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Verify invoice exists and belongs to organization
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id: normalized.invoiceId,
          orgId: context.organizationId,
        },
        include: {
          customer: true,
        },
      });

      if (!invoice) {
        return this.error('Invoice not found', 'NOT_FOUND');
      }

      // Check if invoice is overdue
      const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();
      const reminderType = normalized.reminderType?.toLowerCase() || 'gentle';

      // Build reminder message based on type
      let message = this.buildReminderMessage(
        reminderType,
        invoice,
        normalized.customMessage,
      );

      // Send notification
      await this.notificationsService.create({
        userId: invoice.customerId,
        orgId: context.organizationId,
        type: 'INVOICE_REMINDER',
        title: `Payment Reminder: Invoice ${invoice.number}`,
        message,
        channel: 'EMAIL',
        metadata: {
          invoiceId: invoice.id,
          reminderType,
          sentBy: context.userId,
        },
      });

      this.logger.log(
        `Payment reminder sent for invoice ${invoice.id} by AI assistant`,
      );

      return this.success(
        `Payment reminder sent successfully to ${invoice.customerEmail} for invoice ${invoice.number}`,
        invoice.id,
        'Invoice',
        {
          invoiceNumber: invoice.number,
          amount: invoice.total,
          dueDate: invoice.dueDate,
          isOverdue,
          reminderType,
        },
      );
    } catch (error) {
      this.logger.error('Failed to send reminder:', error);
      return this.error(
        'Failed to send reminder',
        error.message || 'Unknown error',
      );
    }
  }

  /**
   * Build reminder message based on type
   */
  private buildReminderMessage(
    type: string,
    invoice: any,
    customMessage?: string,
  ): string {
    const baseMessage = customMessage || '';

    switch (type) {
      case 'gentle':
        return `${baseMessage}\n\nFriendly reminder: Invoice ${invoice.number} for ${invoice.total} ${invoice.currency} is ${invoice.dueDate && new Date(invoice.dueDate) < new Date() ? 'overdue' : 'due soon'}. Please process payment at your earliest convenience.`;

      case 'firm':
        return `${baseMessage}\n\nImportant: Invoice ${invoice.number} for ${invoice.total} ${invoice.currency} is overdue. Please arrange payment immediately to avoid late fees.`;

      case 'final':
        return `${baseMessage}\n\nFinal Notice: Invoice ${invoice.number} for ${invoice.total} ${invoice.currency} remains unpaid. Please settle this invoice immediately to maintain your account in good standing.`;

      default:
        return `${baseMessage}\n\nPayment reminder for invoice ${invoice.number}: ${invoice.total} ${invoice.currency}`;
    }
  }
}
