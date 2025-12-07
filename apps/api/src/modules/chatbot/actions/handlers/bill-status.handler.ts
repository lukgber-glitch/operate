/**
 * Bill Status Action Handler
 * Handles querying individual bill status via chatbot
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
export class BillStatusHandler extends BaseActionHandler {
  constructor(private billsService: BillsService) {
    super('BillStatusHandler');
  }

  get actionType(): ActionType {
    return ActionType.BILL_STATUS;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'billId',
        type: 'string',
        required: false,
        description: 'Specific bill ID to check',
      },
      {
        name: 'vendorName',
        type: 'string',
        required: false,
        description: 'Vendor name to search for bills',
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
          'You do not have permission to view bill status',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Check by bill ID first
      if (normalized.billId) {
        const bill = await this.billsService.findById(normalized.billId);

        if (!bill) {
          return this.error(
            `Bill with ID ${normalized.billId} not found`,
            'BILL_NOT_FOUND',
          );
        }

        // Calculate payment details
        const totalAmount = Number(bill.totalAmount);
        const paidAmount = Number(bill.paidAmount);
        const remainingAmount = totalAmount - paidAmount;
        const isOverdue =
          new Date(bill.dueDate) < new Date() &&
          bill.paymentStatus !== 'COMPLETED';
        const daysUntilDue = Math.ceil(
          (new Date(bill.dueDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        this.logger.log(
          `Retrieved status for bill ${normalized.billId} for user ${context.userId}`,
        );

        return this.success(
          `Bill from ${bill.vendorName}: ${totalAmount.toFixed(2)} ${bill.currency} - ${bill.status} (${bill.paymentStatus})`,
          bill.id,
          'Bill',
          {
            id: bill.id,
            vendorName: bill.vendorName,
            billNumber: bill.billNumber,
            description: bill.description,
            totalAmount: totalAmount.toFixed(2),
            paidAmount: paidAmount.toFixed(2),
            remainingAmount: remainingAmount.toFixed(2),
            currency: bill.currency,
            status: bill.status,
            paymentStatus: bill.paymentStatus,
            issueDate: new Date(bill.issueDate).toLocaleDateString(),
            dueDate: new Date(bill.dueDate).toLocaleDateString(),
            isOverdue,
            daysUntilDue,
          },
        );
      }

      // Search by vendor name
      if (normalized.vendorName) {
        const result = await this.billsService.findAll(
          context.organizationId,
          {
            search: normalized.vendorName,
            pageSize: 5,
            page: 1,
          } as BillFilterDto,
        );

        if (!result.data || result.data.length === 0) {
          return this.error(
            `No bills found for vendor: ${normalized.vendorName}`,
            'BILLS_NOT_FOUND',
          );
        }

        // Return details for matching bills
        const billDetails = result.data.map((bill) => {
          const isOverdue =
            new Date(bill.dueDate) < new Date() &&
            bill.paymentStatus !== 'COMPLETED';
          const daysUntilDue = Math.ceil(
            (new Date(bill.dueDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );

          return {
            id: bill.id,
            vendorName: bill.vendorName,
            billNumber: bill.billNumber,
            amount: `${Number(bill.totalAmount).toFixed(2)} ${bill.currency}`,
            status: bill.status,
            paymentStatus: bill.paymentStatus,
            dueDate: new Date(bill.dueDate).toLocaleDateString(),
            isOverdue,
            daysUntilDue,
          };
        });

        this.logger.log(
          `Found ${result.data.length} bill(s) for vendor ${normalized.vendorName} for user ${context.userId}`,
        );

        return this.success(
          `Found ${result.data.length} bill(s) for vendor: ${normalized.vendorName}`,
          undefined,
          'BillList',
          {
            vendorName: normalized.vendorName,
            count: result.data.length,
            bills: billDetails,
          },
        );
      }

      // No valid parameters provided
      return this.error(
        'Please provide either a bill ID or vendor name to check status',
        'MISSING_PARAMETERS',
      );
    } catch (error) {
      this.logger.error('Failed to get bill status:', error);
      return this.error(
        'Failed to get bill status',
        error.message || 'Unknown error',
      );
    }
  }
}
