/**
 * Create Invoice Action Handler
 * Handles creation of invoices via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { InvoicesService } from '../../../finance/invoices/invoices.service';
import { CreateInvoiceDto } from '../../../finance/invoices/dto/create-invoice.dto';

@Injectable()
export class CreateInvoiceHandler extends BaseActionHandler {
  constructor(private invoicesService: InvoicesService) {
    super('CreateInvoiceHandler');
  }

  get actionType(): ActionType {
    return ActionType.CREATE_INVOICE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'customerId',
        type: 'string',
        required: false,
        description: 'Customer ID (if existing customer)',
      },
      {
        name: 'customerName',
        type: 'string',
        required: false,
        description: 'Customer name (if new customer)',
      },
      {
        name: 'customerEmail',
        type: 'string',
        required: false,
        description: 'Customer email address',
      },
      {
        name: 'amount',
        type: 'number',
        required: true,
        description: 'Invoice amount',
        validation: (value) => value > 0,
      },
      {
        name: 'currency',
        type: 'string',
        required: false,
        description: 'Currency code (default: EUR)',
        default: 'EUR',
      },
      {
        name: 'description',
        type: 'string',
        required: true,
        description: 'Invoice description/item',
      },
      {
        name: 'dueDate',
        type: 'string',
        required: false,
        description: 'Due date (ISO format)',
      },
      {
        name: 'vatRate',
        type: 'number',
        required: false,
        description: 'VAT rate percentage (e.g., 19 for 19%)',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'invoices:create')) {
        return this.error(
          'You do not have permission to create invoices',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Validate customer information
      if (!normalized.customerId && !normalized.customerName) {
        return this.error(
          'Either customerId or customerName is required',
          'VALIDATION_ERROR',
        );
      }

      // Build invoice DTO
      const invoiceDto: CreateInvoiceDto = {
        type: 'STANDARD', // Default to STANDARD type
        customerId: normalized.customerId,
        customerName: normalized.customerName,
        customerEmail: normalized.customerEmail,
        issueDate: new Date().toISOString(),
        dueDate: normalized.dueDate || this.calculateDefaultDueDate(),
        currency: normalized.currency || 'EUR',
        items: [
          {
            description: normalized.description,
            quantity: 1,
            unitPrice: normalized.amount,
            taxRate: normalized.vatRate || 19,
            sortOrder: 0,
          },
        ],
        notes: 'Created via AI Assistant',
      };

      // Create invoice
      const invoice = await this.invoicesService.create(
        context.organizationId,
        invoiceDto,
      );

      this.logger.log(
        `Invoice ${invoice.id} created by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Invoice ${invoice.number} created successfully for ${normalized.customerName || normalized.customerId}`,
        invoice.id,
        'Invoice',
        {
          number: invoice.number,
          amount: invoice.total,
          currency: invoice.currency,
        },
      );
    } catch (error) {
      this.logger.error('Failed to create invoice:', error);
      return this.error(
        'Failed to create invoice',
        error.message || 'Unknown error',
      );
    }
  }

  /**
   * Calculate default due date (30 days from now)
   */
  private calculateDefaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  }
}
