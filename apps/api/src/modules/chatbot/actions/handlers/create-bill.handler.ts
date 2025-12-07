/**
 * Create Bill Action Handler
 * Handles creation of bills (accounts payable) via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { BillsService } from '../../../finance/bills/bills.service';
import { CreateBillDto } from '../../../finance/bills/dto/create-bill.dto';

@Injectable()
export class CreateBillHandler extends BaseActionHandler {
  constructor(private billsService: BillsService) {
    super('CreateBillHandler');
  }

  get actionType(): ActionType {
    return ActionType.CREATE_BILL;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'vendorName',
        type: 'string',
        required: true,
        description: 'Vendor/supplier name',
      },
      {
        name: 'amount',
        type: 'number',
        required: true,
        description: 'Bill amount (excluding tax)',
        validation: (value) => value > 0,
      },
      {
        name: 'dueDate',
        type: 'string',
        required: false,
        description: 'Payment due date (ISO format, defaults to 30 days from issue)',
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        description: 'Bill description or purpose',
      },
      {
        name: 'currency',
        type: 'string',
        required: false,
        description: 'Currency code (default: EUR)',
        default: 'EUR',
      },
      {
        name: 'issueDate',
        type: 'string',
        required: false,
        description: 'Bill issue date (ISO format, default: today)',
      },
      {
        name: 'taxAmount',
        type: 'number',
        required: false,
        description: 'Tax/VAT amount',
      },
      {
        name: 'vatRate',
        type: 'number',
        required: false,
        description: 'VAT rate percentage',
      },
      {
        name: 'billNumber',
        type: 'string',
        required: false,
        description: 'Bill/invoice number from vendor',
      },
      {
        name: 'reference',
        type: 'string',
        required: false,
        description: 'Internal reference number',
      },
      {
        name: 'taxDeductible',
        type: 'boolean',
        required: false,
        description: 'Whether bill is tax deductible',
        default: true,
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'bills:create')) {
        return this.error(
          'You do not have permission to create bills',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Calculate due date (30 days from issue date if not provided)
      const issueDate = normalized.issueDate
        ? new Date(normalized.issueDate)
        : new Date();
      const dueDate = normalized.dueDate
        ? new Date(normalized.dueDate)
        : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Build bill DTO
      const billDto: CreateBillDto = {
        vendorName: normalized.vendorName,
        amount: normalized.amount,
        currency: normalized.currency || 'EUR',
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        description: normalized.description,
        taxAmount: normalized.taxAmount,
        vatRate: normalized.vatRate,
        billNumber: normalized.billNumber,
        reference: normalized.reference,
        taxDeductible: normalized.taxDeductible ?? true,
        sourceType: 'MANUAL',
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        internalNotes: 'Created via AI Assistant',
      };

      // Create bill
      const bill = await this.billsService.create(
        context.organizationId,
        billDto,
      );

      this.logger.log(
        `Bill ${bill.id} created by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Bill created successfully: ${normalized.vendorName} - ${normalized.amount} ${normalized.currency || 'EUR'} (Due: ${dueDate.toLocaleDateString()})`,
        bill.id,
        'Bill',
        {
          vendorName: bill.vendorName,
          amount: bill.amount,
          currency: bill.currency,
          dueDate: bill.dueDate,
          status: bill.status,
          paymentStatus: bill.paymentStatus,
        },
      );
    } catch (error) {
      this.logger.error('Failed to create bill:', error);
      return this.error(
        'Failed to create bill',
        error.message || 'Unknown error',
      );
    }
  }
}
