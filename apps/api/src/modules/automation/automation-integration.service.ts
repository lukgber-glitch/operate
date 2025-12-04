import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AutoApproveService } from './auto-approve.service';

/**
 * Automation Integration Service
 * Provides integration points for automation with existing services
 *
 * NOTE: These are helper methods that will be called by other services
 * when they need to trigger automation workflows.
 *
 * Integration pattern:
 * 1. Service performs action (e.g., AI classifies expense)
 * 2. Service calls appropriate integration method
 * 3. Integration method checks if auto-approval should occur
 * 4. Integration method executes auto-approval or logs suggestion
 * 5. Returns result to calling service
 */
@Injectable()
export class AutomationIntegrationService {
  private readonly logger = new Logger(AutomationIntegrationService.name);

  constructor(
    private prisma: PrismaService,
    private autoApprove: AutoApproveService,
  ) {}

  /**
   * Handle expense classification by AI
   *
   * Called when: AI classifies an expense transaction
   *
   * Flow:
   * 1. Check if auto-approve conditions are met
   * 2. If yes and FULL_AUTO: mark expense as approved
   * 3. If SEMI_AUTO: create suggestion for user
   * 4. Log action in audit trail
   *
   * @example
   * ```typescript
   * // In expense service after AI classification:
   * const result = await this.automationIntegration.handleExpenseClassification(
   *   expense,
   *   { category: 'TRAVEL', confidence: 0.92 }
   * );
   * ```
   */
  async handleExpenseClassification(
    expense: {
      id: string;
      orgId: string;
      amount: number;
      category?: string;
      status?: string;
    },
    classification: {
      category: string;
      confidence: number;
      metadata?: any;
    },
  ): Promise<{
    autoApproved: boolean;
    action: string;
    reason: string;
  }> {
    this.logger.log(`Handling expense classification for expense: ${expense.id}`);

    // Convert confidence from 0-1 to 0-100 if needed
    const confidenceScore =
      classification.confidence <= 1
        ? classification.confidence * 100
        : classification.confidence;

    // Check if should auto-approve
    const decision = await this.autoApprove.shouldAutoApprove({
      organisationId: expense.orgId,
      feature: 'expenses',
      confidenceScore,
      amount: expense.amount,
    });

    // Execute auto-approval workflow
    await this.autoApprove.executeAutoApproval({
      organisationId: expense.orgId,
      feature: 'expenses',
      entityType: 'Expense',
      entityId: expense.id,
      confidenceScore,
      inputData: {
        amount: expense.amount,
        category: classification.category,
        originalCategory: expense.category,
        metadata: classification.metadata,
      },
    });

    // If auto-approved, update expense status
    if (decision.autoApprove) {
      // Note: This would need to be called by the expense service
      // We don't update directly to avoid circular dependencies
      this.logger.log(`Expense ${expense.id} approved automatically`);
      return {
        autoApproved: true,
        action: 'AUTO_APPROVED',
        reason: decision.reason,
      };
    }

    // Suggested for manual review
    return {
      autoApproved: false,
      action: 'SUGGESTED_FOR_REVIEW',
      reason: decision.reason,
    };
  }

  /**
   * Handle tax deduction classification by AI
   *
   * Called when: AI suggests a tax deduction for a transaction
   *
   * Flow:
   * 1. Check if auto-approve conditions are met
   * 2. If yes and FULL_AUTO: confirm deduction automatically
   * 3. If SEMI_AUTO: create suggestion for user review
   * 4. Log action in audit trail
   *
   * @example
   * ```typescript
   * // In tax service after AI suggests deduction:
   * const result = await this.automationIntegration.handleTaxClassification(
   *   transaction,
   *   { deductibleAmount: 5000, confidence: 0.95, category: 'OFFICE_SUPPLIES' }
   * );
   * ```
   */
  async handleTaxClassification(
    transaction: {
      id: string;
      orgId: string;
      amount: number;
    },
    classification: {
      deductibleAmount: number;
      confidence: number;
      category: string;
      legalBasis?: string;
    },
  ): Promise<{
    autoApproved: boolean;
    action: string;
    reason: string;
  }> {
    this.logger.log(`Handling tax classification for transaction: ${transaction.id}`);

    // Convert confidence from 0-1 to 0-100 if needed
    const confidenceScore =
      classification.confidence <= 1
        ? classification.confidence * 100
        : classification.confidence;

    // Check if should auto-approve
    const decision = await this.autoApprove.shouldAutoApprove({
      organisationId: transaction.orgId,
      feature: 'tax',
      confidenceScore,
      amount: classification.deductibleAmount,
    });

    // Execute auto-approval workflow
    await this.autoApprove.executeAutoApproval({
      organisationId: transaction.orgId,
      feature: 'tax',
      entityType: 'Transaction',
      entityId: transaction.id,
      confidenceScore,
      inputData: {
        transactionAmount: transaction.amount,
        deductibleAmount: classification.deductibleAmount,
        category: classification.category,
        legalBasis: classification.legalBasis,
      },
    });

    // If auto-approved, the tax service should confirm the deduction
    if (decision.autoApprove) {
      this.logger.log(`Tax deduction for transaction ${transaction.id} approved automatically`);
      return {
        autoApproved: true,
        action: 'AUTO_APPROVED',
        reason: decision.reason,
      };
    }

    // Suggested for manual review
    return {
      autoApproved: false,
      action: 'SUGGESTED_FOR_REVIEW',
      reason: decision.reason,
    };
  }

  /**
   * Handle bank transaction import
   *
   * Called when: Bank transactions are imported/synced
   *
   * Flow:
   * 1. For each transaction, check if should auto-reconcile
   * 2. If confidence high enough: auto-match and reconcile
   * 3. If not: suggest matches for manual review
   * 4. Log all actions in audit trail
   *
   * @example
   * ```typescript
   * // In bank integration service after import:
   * const results = await this.automationIntegration.handleBankTransactionImport(
   *   importedTransactions
   * );
   * ```
   */
  async handleBankTransactionImport(
    transactions: Array<{
      id: string;
      bankAccountId: string;
      amount: number;
      description: string;
      date: Date;
      counterpartyName?: string;
    }>,
  ): Promise<Array<{
    transactionId: string;
    autoReconciled: boolean;
    action: string;
    reason: string;
    matchedTransactionId?: string;
  }>> {
    this.logger.log(`Handling bank transaction import: ${transactions.length} transactions`);

    const results = [];

    for (const transaction of transactions) {
      try {
        // Get bank account to find organisation
        const bankAccount = await this.prisma.bankAccount.findUnique({
          where: { id: transaction.bankAccountId },
          select: { orgId: true },
        });

        if (!bankAccount) {
          this.logger.warn(`Bank account not found: ${transaction.bankAccountId}`);
          continue;
        }

        // TODO: Implement matching logic
        // For now, we'll log the intent to auto-reconcile
        // In a full implementation, this would:
        // 1. Search for matching internal transactions
        // 2. Calculate confidence score based on amount, date, description
        // 3. Check if should auto-reconcile
        // 4. Execute reconciliation if approved

        const confidenceScore = 0; // Placeholder - would come from matching algorithm

        const decision = await this.autoApprove.shouldAutoApprove({
          organisationId: bankAccount.orgId,
          feature: 'bankReconciliation',
          confidenceScore,
          amount: Math.abs(transaction.amount),
        });

        await this.autoApprove.executeAutoApproval({
          organisationId: bankAccount.orgId,
          feature: 'bankReconciliation',
          entityType: 'BankTransaction',
          entityId: transaction.id,
          confidenceScore,
          inputData: {
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date,
            counterpartyName: transaction.counterpartyName,
          },
        });

        results.push({
          transactionId: transaction.id,
          autoReconciled: decision.autoApprove,
          action: decision.autoApprove ? 'AUTO_RECONCILED' : 'SUGGESTED_FOR_REVIEW',
          reason: decision.reason,
        });
      } catch (error) {
        this.logger.error(
          `Error processing transaction ${transaction.id}: ${error.message}`,
          error.stack,
        );
        results.push({
          transactionId: transaction.id,
          autoReconciled: false,
          action: 'ERROR',
          reason: error.message,
        });
      }
    }

    this.logger.log(`Bank transaction import completed: ${results.length} processed`);
    return results;
  }

  /**
   * Handle invoice creation by AI
   *
   * Called when: AI suggests creating an invoice based on email/document
   *
   * Flow:
   * 1. Check if auto-approve conditions are met
   * 2. If yes and FULL_AUTO: create invoice automatically
   * 3. If SEMI_AUTO: create draft invoice for review
   * 4. Log action in audit trail
   *
   * @example
   * ```typescript
   * // In email processing service after AI extracts invoice data:
   * const result = await this.automationIntegration.handleInvoiceCreation(
   *   orgId,
   *   { customer: 'Acme Corp', amount: 1500, confidence: 0.88 }
   * );
   * ```
   */
  async handleInvoiceCreation(
    organisationId: string,
    invoiceData: {
      customerName: string;
      amount: number;
      confidence: number;
      dueDate?: Date;
      items?: any[];
      metadata?: any;
    },
  ): Promise<{
    autoCreated: boolean;
    action: string;
    reason: string;
    invoiceId?: string;
  }> {
    this.logger.log(`Handling invoice creation suggestion for org: ${organisationId}`);

    // Convert confidence from 0-1 to 0-100 if needed
    const confidenceScore =
      invoiceData.confidence <= 1
        ? invoiceData.confidence * 100
        : invoiceData.confidence;

    // Check if should auto-create
    const decision = await this.autoApprove.shouldAutoApprove({
      organisationId,
      feature: 'invoices',
      confidenceScore,
      amount: invoiceData.amount,
    });

    // Log the action (invoice creation would happen in invoice service)
    await this.autoApprove.executeAutoApproval({
      organisationId,
      feature: 'invoices',
      entityType: 'Invoice',
      entityId: 'pending', // Would be set after invoice created
      confidenceScore,
      inputData: {
        customerName: invoiceData.customerName,
        amount: invoiceData.amount,
        dueDate: invoiceData.dueDate,
        items: invoiceData.items,
        metadata: invoiceData.metadata,
      },
    });

    // If auto-approved, the invoice service should create the invoice
    if (decision.autoApprove) {
      this.logger.log(`Invoice creation approved automatically for ${invoiceData.customerName}`);
      return {
        autoCreated: true,
        action: 'AUTO_CREATED',
        reason: decision.reason,
      };
    }

    // Suggested for manual review
    return {
      autoCreated: false,
      action: 'SUGGESTED_FOR_REVIEW',
      reason: decision.reason,
    };
  }
}
