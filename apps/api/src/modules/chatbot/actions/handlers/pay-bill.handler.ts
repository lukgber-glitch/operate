/**
 * Pay Bill Action Handler
 * Handles recording bill payments via chatbot
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
import { RecordPaymentDto } from '../../../finance/bills/dto/record-payment.dto';

@Injectable()
export class PayBillHandler extends BaseActionHandler {
  constructor(private billsService: BillsService) {
    super('PayBillHandler');
  }

  get actionType(): ActionType {
    return ActionType.PAY_BILL;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'billId',
        type: 'string',
        required: true,
        description: 'ID of the bill to mark as paid',
      },
      {
        name: 'amount',
        type: 'number',
        required: true,
        description: 'Payment amount',
        validation: (value) => value > 0,
      },
      {
        name: 'paymentDate',
        type: 'string',
        required: false,
        description: 'Payment date (ISO format, default: today)',
      },
      {
        name: 'paymentMethod',
        type: 'string',
        required: false,
        description: 'Payment method (e.g., bank_transfer, credit_card, cash)',
      },
      {
        name: 'transactionId',
        type: 'string',
        required: false,
        description: 'Transaction or payment reference ID',
      },
      {
        name: 'reference',
        type: 'string',
        required: false,
        description: 'Payment reference or note',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'bills:update')) {
        return this.error(
          'You do not have permission to record bill payments',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Verify bill exists and get details
      const bill = await this.billsService.findById(normalized.billId);

      if (!bill) {
        return this.error(
          `Bill with ID ${normalized.billId} not found`,
          'BILL_NOT_FOUND',
        );
      }

      // Build payment DTO
      const paymentDto: RecordPaymentDto = {
        amount: normalized.amount,
        paymentDate: normalized.paymentDate || new Date().toISOString(),
        paymentMethod: normalized.paymentMethod || 'bank_transfer',
        transactionId: normalized.transactionId,
        reference: normalized.reference || 'Recorded via AI Assistant',
      };

      // Record payment
      const updatedBill = await this.billsService.recordPayment(
        normalized.billId,
        paymentDto,
      );

      this.logger.log(
        `Payment of ${normalized.amount} recorded for bill ${normalized.billId} by AI assistant`,
      );

      // Check if bill is fully paid
      const isPaid = updatedBill.paymentStatus === 'COMPLETED';
      const remainingAmount = Number(updatedBill.totalAmount) - Number(updatedBill.paidAmount);

      return this.success(
        isPaid
          ? `Bill marked as paid: ${updatedBill.vendorName} - ${normalized.amount} ${updatedBill.currency}`
          : `Partial payment recorded: ${normalized.amount} ${updatedBill.currency}. Remaining: ${remainingAmount.toFixed(2)} ${updatedBill.currency}`,
        updatedBill.id,
        'Bill',
        {
          vendorName: updatedBill.vendorName,
          paidAmount: updatedBill.paidAmount,
          totalAmount: updatedBill.totalAmount,
          paymentStatus: updatedBill.paymentStatus,
          status: updatedBill.status,
          isPaid,
          remainingAmount,
        },
      );
    } catch (error) {
      this.logger.error('Failed to record bill payment:', error);
      return this.error(
        'Failed to record bill payment',
        error.message || 'Unknown error',
      );
    }
  }
}
