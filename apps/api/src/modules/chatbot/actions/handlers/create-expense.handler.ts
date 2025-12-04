/**
 * Create Expense Action Handler
 * Handles creation of expenses via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { ExpensesService } from '../../../finance/expenses/expenses.service';
import { CreateExpenseDto } from '../../../finance/expenses/dto/create-expense.dto';

@Injectable()
export class CreateExpenseHandler extends BaseActionHandler {
  constructor(private expensesService: ExpensesService) {
    super('CreateExpenseHandler');
  }

  get actionType(): ActionType {
    return ActionType.CREATE_EXPENSE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'description',
        type: 'string',
        required: true,
        description: 'Expense description',
      },
      {
        name: 'amount',
        type: 'number',
        required: true,
        description: 'Expense amount',
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
        name: 'date',
        type: 'string',
        required: false,
        description: 'Expense date (ISO format, default: today)',
      },
      {
        name: 'category',
        type: 'string',
        required: true,
        description: 'Expense category',
      },
      {
        name: 'vendorName',
        type: 'string',
        required: false,
        description: 'Vendor/supplier name',
      },
      {
        name: 'vatRate',
        type: 'number',
        required: false,
        description: 'VAT rate percentage',
      },
      {
        name: 'isDeductible',
        type: 'boolean',
        required: false,
        description: 'Whether expense is tax deductible',
        default: true,
      },
      {
        name: 'paymentMethod',
        type: 'string',
        required: false,
        description: 'Payment method used',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'expenses:create')) {
        return this.error(
          'You do not have permission to create expenses',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Build expense DTO
      const expenseDto: CreateExpenseDto = {
        description: normalized.description,
        amount: normalized.amount,
        currency: normalized.currency || 'EUR',
        date: normalized.date || new Date().toISOString(),
        category: normalized.category,
        vendorName: normalized.vendorName,
        vatRate: normalized.vatRate,
        isDeductible: normalized.isDeductible ?? true,
        paymentMethod: normalized.paymentMethod,
        submittedBy: context.userId,
        notes: 'Created via AI Assistant',
      };

      // Calculate VAT amount if rate provided
      if (normalized.vatRate) {
        expenseDto.vatAmount = (normalized.amount * normalized.vatRate) / 100;
      }

      // Create expense
      const expense = await this.expensesService.create(
        context.organizationId,
        expenseDto,
      );

      this.logger.log(
        `Expense ${expense.id} created by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Expense created successfully: ${normalized.description} - ${normalized.amount} ${normalized.currency || 'EUR'}`,
        expense.id,
        'Expense',
        {
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          status: expense.status,
        },
      );
    } catch (error) {
      this.logger.error('Failed to create expense:', error);
      return this.error(
        'Failed to create expense',
        error.message || 'Unknown error',
      );
    }
  }
}
