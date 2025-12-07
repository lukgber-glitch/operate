/**
 * List Bills Action Handler
 * Handles querying and listing bills via chatbot
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
import { BillFilterDto } from '../../../finance/bills/dto/bill-filter.dto';

@Injectable()
export class ListBillsHandler extends BaseActionHandler {
  constructor(private billsService: BillsService) {
    super('ListBillsHandler');
  }

  get actionType(): ActionType {
    return ActionType.LIST_BILLS;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'filter',
        type: 'string',
        required: false,
        description: 'Filter type: overdue, due_soon, pending, paid, all',
        default: 'all',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of bills to return',
        default: 10,
        validation: (value) => value > 0 && value <= 50,
      },
      {
        name: 'vendorName',
        type: 'string',
        required: false,
        description: 'Filter by vendor name',
      },
      {
        name: 'status',
        type: 'string',
        required: false,
        description: 'Filter by status: DRAFT, APPROVED, PAID, OVERDUE, CANCELLED',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'bills:view')) {
        return this.error(
          'You do not have permission to view bills',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);
      const filter = normalized.filter || 'all';
      const limit = Math.min(normalized.limit || 10, 50);

      let bills: any[] = [];
      let summary = '';

      // Handle different filter types
      switch (filter) {
        case 'overdue':
          bills = await this.billsService.getOverdue(context.organizationId);
          summary = `Found ${bills.length} overdue bill(s)`;
          break;

        case 'due_soon':
          bills = await this.billsService.getDueSoon(context.organizationId, 7);
          summary = `Found ${bills.length} bill(s) due in the next 7 days`;
          break;

        case 'pending':
          const pendingResult = await this.billsService.findAll(
            context.organizationId,
            {
              paymentStatus: 'PENDING',
              pageSize: limit,
              page: 1,
            } as BillFilterDto,
          );
          bills = pendingResult.data;
          summary = `Found ${bills.length} pending bill(s)`;
          break;

        case 'paid':
          const paidResult = await this.billsService.findAll(
            context.organizationId,
            {
              paymentStatus: 'COMPLETED',
              pageSize: limit,
              page: 1,
            } as BillFilterDto,
          );
          bills = paidResult.data;
          summary = `Found ${bills.length} paid bill(s)`;
          break;

        case 'all':
        default:
          const queryDto: BillFilterDto = {
            pageSize: limit,
            page: 1,
          };

          if (normalized.vendorName) {
            queryDto.search = normalized.vendorName;
          }

          if (normalized.status) {
            queryDto.status = normalized.status;
          }

          const allResult = await this.billsService.findAll(
            context.organizationId,
            queryDto,
          );
          bills = allResult.data;
          summary = `Found ${bills.length} bill(s)`;
          break;
      }

      // Limit results
      const limitedBills = bills.slice(0, limit);

      // Format bill details for response
      const billDetails = limitedBills.map((bill) => ({
        id: bill.id,
        vendorName: bill.vendorName,
        amount: `${Number(bill.totalAmount).toFixed(2)} ${bill.currency}`,
        dueDate: new Date(bill.dueDate).toLocaleDateString(),
        status: bill.status,
        paymentStatus: bill.paymentStatus,
        description: bill.description,
        isOverdue:
          new Date(bill.dueDate) < new Date() &&
          bill.paymentStatus !== 'COMPLETED',
      }));

      this.logger.log(
        `Listed ${limitedBills.length} bills for user ${context.userId} with filter: ${filter}`,
      );

      return this.success(
        summary,
        undefined,
        'BillList',
        {
          count: limitedBills.length,
          total: bills.length,
          filter,
          bills: billDetails,
        },
      );
    } catch (error) {
      this.logger.error('Failed to list bills:', error);
      return this.error(
        'Failed to list bills',
        error.message || 'Unknown error',
      );
    }
  }
}
