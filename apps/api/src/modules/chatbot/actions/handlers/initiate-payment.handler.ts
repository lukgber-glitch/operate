/**
 * Initiate Payment Action Handler
 * Handles payment initiation via TrueLayer PIS through chatbot
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
import { InvoicesService } from '../../../finance/invoices/invoices.service';
import { TrueLayerPISService } from '../../../integrations/truelayer/services/truelayer-pis.service';
import { CreatePaymentRequest, PaymentSourceType } from '../../../integrations/truelayer/truelayer-pis.types';

@Injectable()
export class InitiatePaymentHandler extends BaseActionHandler {
  constructor(
    private billsService: BillsService,
    private invoicesService: InvoicesService,
    private truelayerPISService: TrueLayerPISService,
  ) {
    super('InitiatePaymentHandler');
  }

  get actionType(): ActionType {
    return ActionType.INITIATE_PAYMENT;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'billId',
        type: 'string',
        required: false,
        description: 'ID of the bill to pay',
      },
      {
        name: 'invoiceNumber',
        type: 'string',
        required: false,
        description: 'Invoice number to pay (for vendor bills)',
      },
      {
        name: 'vendorName',
        type: 'string',
        required: false,
        description: 'Vendor name to pay (for vendor bills)',
      },
      {
        name: 'filter',
        type: 'string',
        required: false,
        description: 'Filter for bill selection: overdue, due_soon, all',
      },
      {
        name: 'amount',
        type: 'number',
        required: false,
        description: 'Payment amount (defaults to full bill amount)',
        validation: (value) => value > 0,
      },
      {
        name: 'confirmed',
        type: 'boolean',
        required: false,
        description: 'Whether the user has confirmed the payment',
        default: false,
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
          'You do not have permission to initiate payments',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // If no specific bill is identified, show payment suggestions
      if (
        !normalized.billId &&
        !normalized.invoiceNumber &&
        !normalized.vendorName &&
        !normalized.filter
      ) {
        return this.showPaymentSuggestions(context);
      }

      // Find the bill to pay
      let bill: any;
      let bills: any[] = [];

      if (normalized.billId) {
        // Direct bill ID lookup
        bill = await this.billsService.findById(normalized.billId);
        if (!bill) {
          return this.error(
            `Bill with ID ${normalized.billId} not found`,
            'BILL_NOT_FOUND',
          );
        }
      } else if (normalized.invoiceNumber) {
        // Search by invoice number
        const result = await this.billsService.findAll(
          context.organizationId,
          {
            search: normalized.invoiceNumber,
            pageSize: 1,
            page: 1,
          },
        );

        if (result.data.length === 0) {
          return this.error(
            `No bill found with invoice number ${normalized.invoiceNumber}`,
            'BILL_NOT_FOUND',
          );
        }
        bill = result.data[0];
      } else if (normalized.vendorName) {
        // Search by vendor name
        const result = await this.billsService.findAll(
          context.organizationId,
          {
            search: normalized.vendorName,
            paymentStatus: 'PENDING',
            pageSize: 10,
            page: 1,
          },
        );

        bills = result.data;

        if (bills.length === 0) {
          return this.error(
            `No unpaid bills found for vendor: ${normalized.vendorName}`,
            'NO_BILLS_FOUND',
          );
        }

        if (bills.length === 1) {
          bill = bills[0];
        } else {
          // Multiple bills found - show list for user to choose
          return this.showBillSelectionList(bills);
        }
      } else if (normalized.filter) {
        // Filter-based lookup (overdue, due_soon)
        if (normalized.filter === 'overdue') {
          bills = await this.billsService.getOverdue(context.organizationId);
        } else if (normalized.filter === 'due_soon') {
          bills = await this.billsService.getDueSoon(
            context.organizationId,
            7,
          );
        }

        if (bills.length === 0) {
          return this.success(
            `No ${normalized.filter} bills found. Great job staying on top of payments!`,
            undefined,
            'PaymentSuggestions',
            { bills: [], filter: normalized.filter },
          );
        }

        return this.showBillSelectionList(bills);
      }

      // Validate bill can be paid
      if (!bill) {
        return this.error('Unable to identify bill to pay', 'BILL_NOT_FOUND');
      }

      if (bill.paymentStatus === 'COMPLETED') {
        return this.error(
          `Bill ${bill.billNumber || bill.id} is already paid`,
          'ALREADY_PAID',
        );
      }

      // Check if bill has payment details
      if (!bill.vendorIban && !bill.vendorSortCode && !bill.vendorAccountNumber) {
        // Check if vendor has payment details
        if (bill.vendor) {
          if (
            !bill.vendor.iban &&
            !bill.vendor.sortCode &&
            !bill.vendor.accountNumber
          ) {
            return this.error(
              `Cannot initiate payment: No bank details available for ${bill.vendorName}. Please add vendor bank details first.`,
              'MISSING_BANK_DETAILS',
            );
          }
        } else {
          return this.error(
            `Cannot initiate payment: No bank details available for ${bill.vendorName}. Please add vendor bank details first.`,
            'MISSING_BANK_DETAILS',
          );
        }
      }

      // Determine payment amount
      const remainingAmount =
        Number(bill.totalAmount) - Number(bill.paidAmount || 0);
      const paymentAmount = normalized.amount || remainingAmount;

      if (paymentAmount > remainingAmount) {
        return this.error(
          `Payment amount ${paymentAmount} ${bill.currency} exceeds remaining balance of ${remainingAmount.toFixed(2)} ${bill.currency}`,
          'AMOUNT_TOO_HIGH',
        );
      }

      // If not confirmed, return confirmation request
      if (!normalized.confirmed) {
        return this.requestPaymentConfirmation(bill, paymentAmount);
      }

      // User confirmed - initiate payment via TrueLayer
      this.logger.log(
        `Initiating payment for bill ${bill.id}: ${paymentAmount} ${bill.currency}`,
      );

      // Build payment request
      const paymentRequest: CreatePaymentRequest = {
        userId: context.userId,
        orgId: context.organizationId,
        amount: paymentAmount,
        currency: bill.currency,
        beneficiaryName:
          bill.vendorName || bill.vendor?.name || 'Unknown Vendor',
        beneficiaryIban: bill.vendorIban || bill.vendor?.iban,
        beneficiarySortCode: bill.vendorSortCode || bill.vendor?.sortCode,
        beneficiaryAccountNumber:
          bill.vendorAccountNumber || bill.vendor?.accountNumber,
        reference: bill.billNumber || `Bill ${bill.id}`,
        description: bill.description || `Payment for bill ${bill.billNumber || bill.id}`,
        sourceType: PaymentSourceType.AI_ASSISTANT,
        billId: bill.id,
      };

      // Create payment initiation
      const payment = await this.truelayerPISService.createPayment(
        paymentRequest,
      );

      this.logger.log(
        `Payment initiated: ${payment.paymentId}. Authorization required.`,
      );

      return this.success(
        `Payment initiated for ${bill.vendorName}: ${paymentAmount} ${bill.currency}`,
        payment.paymentId,
        'Payment',
        {
          type: 'payment_authorization',
          paymentId: payment.paymentId,
          truelayerPaymentId: payment.truelayerPaymentId,
          authorizationUri: payment.authorizationUri,
          status: payment.status,
          expiresAt: payment.expiresAt,
          bill: {
            id: bill.id,
            billNumber: bill.billNumber,
            vendorName: bill.vendorName,
            amount: paymentAmount,
            currency: bill.currency,
            reference: bill.billNumber || bill.reference,
          },
          instructions:
            'Please authorize this payment in your banking app. You will be redirected to your bank to complete the authorization.',
        },
      );
    } catch (error) {
      this.logger.error('Failed to initiate payment:', error);
      return this.error(
        'Failed to initiate payment',
        error.message || 'Unknown error',
      );
    }
  }

  /**
   * Show payment suggestions (overdue and due soon bills)
   */
  private async showPaymentSuggestions(
    context: ActionContext,
  ): Promise<ActionResult> {
    const overdueBills = await this.billsService.getOverdue(
      context.organizationId,
    );
    const dueSoonBills = await this.billsService.getDueSoon(
      context.organizationId,
      7,
    );

    const suggestions: any[] = [];

    // Add overdue bills (high priority)
    if (overdueBills.length > 0) {
      suggestions.push({
        category: 'overdue',
        priority: 'high',
        count: overdueBills.length,
        totalAmount: overdueBills.reduce(
          (sum, bill) =>
            sum + (Number(bill.totalAmount) - Number(bill.paidAmount || 0)),
          0,
        ),
        bills: overdueBills.slice(0, 5).map((bill) => ({
          id: bill.id,
          vendorName: bill.vendorName,
          amount: Number(bill.totalAmount) - Number(bill.paidAmount || 0),
          currency: bill.currency,
          dueDate: bill.dueDate,
          daysOverdue: Math.floor(
            (Date.now() - new Date(bill.dueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        })),
      });
    }

    // Add due soon bills
    if (dueSoonBills.length > 0) {
      suggestions.push({
        category: 'due_soon',
        priority: 'medium',
        count: dueSoonBills.length,
        totalAmount: dueSoonBills.reduce(
          (sum, bill) =>
            sum + (Number(bill.totalAmount) - Number(bill.paidAmount || 0)),
          0,
        ),
        bills: dueSoonBills.slice(0, 5).map((bill) => ({
          id: bill.id,
          vendorName: bill.vendorName,
          amount: Number(bill.totalAmount) - Number(bill.paidAmount || 0),
          currency: bill.currency,
          dueDate: bill.dueDate,
          daysUntilDue: Math.ceil(
            (new Date(bill.dueDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        })),
      });
    }

    if (suggestions.length === 0) {
      return this.success(
        'No bills require immediate payment. All caught up!',
        undefined,
        'PaymentSuggestions',
        { suggestions: [] },
      );
    }

    return this.success(
      `Found ${overdueBills.length} overdue and ${dueSoonBills.length} upcoming bills`,
      undefined,
      'PaymentSuggestions',
      {
        type: 'payment_suggestions',
        suggestions,
        summary: {
          overdueCount: overdueBills.length,
          dueSoonCount: dueSoonBills.length,
          totalCount: overdueBills.length + dueSoonBills.length,
        },
      },
    );
  }

  /**
   * Show bill selection list when multiple bills match
   */
  private showBillSelectionList(bills: any[]): ActionResult {
    const billList = bills.map((bill) => ({
      id: bill.id,
      billNumber: bill.billNumber,
      vendorName: bill.vendorName,
      amount: Number(bill.totalAmount) - Number(bill.paidAmount || 0),
      currency: bill.currency,
      dueDate: bill.dueDate,
      description: bill.description,
      isOverdue: new Date(bill.dueDate) < new Date(),
    }));

    return this.success(
      `Found ${bills.length} matching bills. Please specify which one to pay.`,
      undefined,
      'BillList',
      {
        type: 'bill_selection',
        bills: billList,
        count: bills.length,
      },
    );
  }

  /**
   * Request payment confirmation from user
   */
  private requestPaymentConfirmation(
    bill: any,
    amount: number,
  ): ActionResult {
    const remainingAmount =
      Number(bill.totalAmount) - Number(bill.paidAmount || 0);
    const isPartialPayment = amount < remainingAmount;

    return this.success(
      `Payment confirmation required for ${bill.vendorName}`,
      bill.id,
      'Bill',
      {
        type: 'payment_confirmation',
        requiresConfirmation: true,
        bill: {
          id: bill.id,
          billNumber: bill.billNumber,
          vendorName: bill.vendorName,
          totalAmount: Number(bill.totalAmount),
          paidAmount: Number(bill.paidAmount || 0),
          remainingAmount,
          currency: bill.currency,
          dueDate: bill.dueDate,
          description: bill.description,
        },
        payment: {
          amount,
          currency: bill.currency,
          isPartialPayment,
          remainingAfterPayment: isPartialPayment
            ? remainingAmount - amount
            : 0,
        },
        beneficiary: {
          name: bill.vendorName || bill.vendor?.name,
          iban: bill.vendorIban || bill.vendor?.iban,
          sortCode: bill.vendorSortCode || bill.vendor?.sortCode,
          accountNumber:
            bill.vendorAccountNumber || bill.vendor?.accountNumber,
        },
        reference: bill.billNumber || bill.reference || `Bill ${bill.id}`,
        instructions:
          'Please confirm to proceed with payment authorization. You will be redirected to your bank to complete the payment.',
        warning:
          'Once confirmed, you will need to authorize this payment in your banking app.',
      },
    );
  }
}
