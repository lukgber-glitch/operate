/**
 * Expense Classifier Service
 * Specialized service for classifying expenses with auto-approve integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { AutoApproveService } from '../../automation/auto-approve.service';
import { EventsGateway } from '../../../websocket/events.gateway';
import { AutomationEvent, AutomationEventPayload, ExpenseEvent, ExpenseEventPayload } from '@operate/shared';
import { ClassifyTransactionDto } from './dto/classify-transaction.dto';

export interface ExpenseClassificationInput {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: Date | string;
  merchantName?: string;
  receiptUrl?: string;
  employeeId?: string;
}

export interface ExpenseClassificationResult {
  expenseId: string;
  category: string;
  confidence: number;
  taxDeductible: boolean;
  taxDeductionPercentage?: number;
  suggestedAccount?: string;
  reasoning: string;
  autoApproved: boolean;
  needsReceipt: boolean;
}

@Injectable()
export class ExpenseClassifierService {
  private readonly logger = new Logger(ExpenseClassifierService.name);

  constructor(
    private readonly classificationService: ClassificationService,
    private readonly autoApproveService: AutoApproveService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Classify an expense with auto-approval workflow
   */
  async classifyExpense(
    organisationId: string,
    expense: ExpenseClassificationInput,
  ): Promise<ExpenseClassificationResult> {
    this.logger.log(`Classifying expense ${expense.id} for org ${organisationId}`);

    // Convert to transaction format
    const transaction: ClassifyTransactionDto = {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      counterparty: expense.merchantName,
    };

    // Classify with auto-approval logic
    const result = await this.classificationService.classifyWithAutoApproval(
      organisationId,
      transaction,
    );

    // Determine if receipt is needed
    const needsReceipt = this.shouldRequireReceipt(expense.amount, result.category);

    // Emit expense-specific event
    this.emitExpenseEvent(
      organisationId,
      expense.id,
      result.autoApproved,
      expense.employeeId,
    );

    return {
      expenseId: expense.id,
      category: result.category,
      confidence: result.confidence,
      taxDeductible: result.taxRelevant,
      taxDeductionPercentage: result.taxDeductionPercentage,
      suggestedAccount: result.suggestedAccount,
      reasoning: result.reasoning,
      autoApproved: result.autoApproved,
      needsReceipt,
    };
  }

  /**
   * Classify multiple expenses in batch
   */
  async classifyExpenseBatch(
    organisationId: string,
    expenses: ExpenseClassificationInput[],
  ): Promise<ExpenseClassificationResult[]> {
    this.logger.log(
      `Batch classifying ${expenses.length} expenses for org ${organisationId}`,
    );

    const results = await Promise.all(
      expenses.map((expense) => this.classifyExpense(organisationId, expense)),
    );

    // Emit batch completion event
    this.emitBatchCompletionEvent(organisationId, results);

    return results;
  }

  /**
   * Determine if a receipt should be required based on amount and category
   */
  private shouldRequireReceipt(amount: number, category: string): boolean {
    // Receipts always required for amounts over 250 EUR
    if (Math.abs(amount) > 250) {
      return true;
    }

    // Certain categories always require receipts
    const categoriesRequiringReceipts = [
      'travel_business',
      'meals_business',
      'equipment',
      'professional_services',
    ];

    return categoriesRequiringReceipts.includes(category);
  }

  /**
   * Emit expense-specific WebSocket event
   */
  private emitExpenseEvent(
    organisationId: string,
    expenseId: string,
    autoApproved: boolean,
    employeeId?: string,
  ): void {
    try {
      const event = autoApproved ? ExpenseEvent.APPROVED : ExpenseEvent.CREATED;

      const payload: ExpenseEventPayload = {
        organizationId: organisationId,
        expenseId,
        timestamp: new Date(),
        submittedBy: employeeId,
        status: autoApproved ? 'approved' : 'pending',
      };

      this.eventsGateway.emitToOrganization(organisationId, event, payload);

      this.logger.debug(
        `Emitted expense event ${event} for expense ${expenseId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit expense event for ${expenseId}: ${error.message}`,
      );
    }
  }

  /**
   * Emit batch completion event
   */
  private emitBatchCompletionEvent(
    organisationId: string,
    results: ExpenseClassificationResult[],
  ): void {
    try {
      const autoApprovedCount = results.filter((r) => r.autoApproved).length;

      const payload: AutomationEventPayload = {
        organizationId: organisationId,
        entityType: 'expense',
        entityId: 'batch',
        feature: 'expense_classification',
        action: 'BATCH_COMPLETED',
        timestamp: new Date(),
        metadata: {
          total: results.length,
          autoApproved: autoApprovedCount,
          needsReview: results.length - autoApprovedCount,
        },
      };

      this.eventsGateway.emitToOrganization(
        organisationId,
        AutomationEvent.CLASSIFICATION_COMPLETE,
        payload,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit batch completion event: ${error.message}`,
      );
    }
  }
}
