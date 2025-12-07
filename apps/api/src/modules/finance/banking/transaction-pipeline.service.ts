/**
 * Transaction Classification Pipeline Service
 * Automatically classifies bank transactions after they're synced
 *
 * Features:
 * - Event-driven architecture using NestJS EventEmitter
 * - Batch processing of unclassified transactions
 * - Auto-categorization for high-confidence matches (>0.8)
 * - Tax deduction suggestions for eligible expenses
 * - Comprehensive logging and error handling
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { TransactionCategorizationService } from '../../ai/transaction-categorization/transaction-categorization.service';
import { TaxDeductionClassifierService } from '../../ai/classification/tax-deduction-classifier.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReconciliationStatus } from '@prisma/client';
import { CategorizationRequest, CategorizationResult } from '../../ai/transaction-categorization/transaction-categorization.types';
import { TaxDeductionInput, TaxDeductionResult } from '../../ai/classification/tax-deduction-classifier.service';

/**
 * Event payload for bank sync completed
 */
export interface BankSyncCompletedEvent {
  connectionId: string;
  accountsSynced: number;
  transactionsSynced: number;
  timestamp: Date;
}

/**
 * Event payload for transaction classified
 */
export interface TransactionClassifiedEvent {
  transactionId: string;
  orgId: string;
  category: string;
  confidence: number;
  autoApplied: boolean;
  taxDeduction?: TaxDeductionResult;
  timestamp: Date;
}

/**
 * Pipeline processing result
 */
export interface PipelineResult {
  connectionId: string;
  totalProcessed: number;
  categorized: number;
  autoCategorized: number;
  taxDeductionsApplied: number;
  failed: number;
  duration: number;
  errors: Array<{ transactionId: string; error: string }>;
}

@Injectable()
export class TransactionPipelineService {
  private readonly logger = new Logger(TransactionPipelineService.name);
  private readonly BATCH_SIZE = 50; // Max transactions per batch
  private readonly AUTO_CATEGORIZE_THRESHOLD = 0.8; // Confidence threshold for auto-apply

  constructor(
    private readonly prisma: PrismaService,
    private readonly categorizationService: TransactionCategorizationService,
    private readonly taxDeductionService: TaxDeductionClassifierService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Listen for bank sync completed events
   * Triggered when bank-import processor completes a sync
   */
  @OnEvent('bank.sync.completed')
  async handleBankSyncCompleted(event: BankSyncCompletedEvent): Promise<void> {
    this.logger.log(
      `Bank sync completed for connection ${event.connectionId}, ` +
      `processing ${event.transactionsSynced} new transactions`,
    );

    try {
      const result = await this.processConnectionTransactions(event.connectionId);

      this.logger.log(
        `Pipeline completed for connection ${event.connectionId}: ` +
        `${result.categorized}/${result.totalProcessed} categorized, ` +
        `${result.autoCategorized} auto-applied, ` +
        `${result.taxDeductionsApplied} tax deductions, ` +
        `duration: ${result.duration}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Pipeline failed for connection ${event.connectionId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process all unclassified transactions for a connection
   */
  async processConnectionTransactions(connectionId: string): Promise<PipelineResult> {
    const startTime = Date.now();

    // Get connection and org info
    const connection = await this.prisma.bankConnection.findUnique({
      where: { id: connectionId },
      include: { accounts: true },
    });

    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const orgId = connection.orgId;
    const accountIds = connection.accounts.map(acc => acc.id);

    // Get all unmatched/unclassified transactions for this connection
    const transactions = await this.prisma.bankTransactionNew.findMany({
      where: {
        bankAccountId: { in: accountIds },
        reconciliationStatus: ReconciliationStatus.UNMATCHED,
        category: null, // Not yet categorized
      },
      orderBy: { bookingDate: 'desc' },
      take: this.BATCH_SIZE,
    });

    if (transactions.length === 0) {
      this.logger.log(`No unclassified transactions found for connection ${connectionId}`);
      return {
        connectionId,
        totalProcessed: 0,
        categorized: 0,
        autoCategorized: 0,
        taxDeductionsApplied: 0,
        failed: 0,
        duration: Date.now() - startTime,
        errors: [],
      };
    }

    this.logger.log(`Processing ${transactions.length} unclassified transactions`);

    // Build categorization requests
    const requests: CategorizationRequest[] = transactions.map(tx => ({
      transactionId: tx.id,
      merchantName: tx.merchantName || undefined,
      merchantCategory: tx.merchantCategory || undefined,
      description: tx.description,
      amount: tx.amount.toNumber(),
      currency: tx.currency,
      date: tx.bookingDate,
      orgId,
    }));

    // Batch categorize
    const batchResult = await this.categorizationService.batchCategorize(requests);

    let autoCategorized = 0;
    let taxDeductionsApplied = 0;
    const errors: Array<{ transactionId: string; error: string }> = [];

    // Apply categorization results
    for (const result of batchResult.results) {
      try {
        await this.applyCategorizationResult(orgId, result);

        // If high confidence, auto-apply category
        if (result.autoCategorizationEnabled) {
          autoCategorized++;
        }

        // Process tax deduction if applicable
        const transaction = transactions.find(tx => tx.id === result.transactionId);
        if (transaction && this.isExpense(transaction.amount.toNumber())) {
          const taxResult = await this.processTaxDeduction(orgId, transaction, result);
          if (taxResult) {
            taxDeductionsApplied++;
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to apply categorization for transaction ${result.transactionId}: ${error.message}`,
        );
        errors.push({
          transactionId: result.transactionId,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    return {
      connectionId,
      totalProcessed: transactions.length,
      categorized: batchResult.categorized,
      autoCategorized,
      taxDeductionsApplied,
      failed: batchResult.failed + errors.length,
      duration,
      errors,
    };
  }

  /**
   * Apply categorization result to transaction
   */
  private async applyCategorizationResult(
    orgId: string,
    result: CategorizationResult,
  ): Promise<void> {
    const updateData: any = {
      // Store categorization metadata
      metadata: {
        categorization: {
          primarySuggestion: result.primarySuggestion,
          alternateSuggestions: result.alternateSuggestions,
          confidence: result.confidence,
          categorizedAt: result.categorizedAt,
        },
      },
    };

    // Auto-apply category if high confidence
    if (result.autoCategorizationEnabled) {
      updateData.category = result.primarySuggestion.categoryId;
      this.logger.log(
        `Auto-categorized transaction ${result.transactionId} as ${result.primarySuggestion.categoryName} ` +
        `(confidence: ${result.confidence.toFixed(2)})`,
      );
    }

    // Update transaction
    await this.prisma.bankTransactionNew.update({
      where: { id: result.transactionId },
      data: updateData,
    });

    // Emit classification event
    this.eventEmitter.emit('transaction.classified', {
      transactionId: result.transactionId,
      orgId,
      category: result.primarySuggestion.categoryId,
      confidence: result.confidence,
      autoApplied: result.autoCategorizationEnabled,
      timestamp: new Date(),
    } as TransactionClassifiedEvent);
  }

  /**
   * Process tax deduction for expense transaction
   */
  private async processTaxDeduction(
    orgId: string,
    transaction: any,
    categorizationResult: CategorizationResult,
  ): Promise<TaxDeductionResult | null> {
    try {
      // Build tax deduction input
      const deductionInput: TaxDeductionInput = {
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount.toNumber(),
        currency: transaction.currency,
        date: transaction.bookingDate,
        category: categorizationResult.primarySuggestion.categoryId,
      };

      // Classify tax deduction
      const taxResult = await this.taxDeductionService.classifyDeduction(orgId, deductionInput);

      // Store tax deduction result in transaction metadata
      await this.prisma.bankTransactionNew.update({
        where: { id: transaction.id },
        data: {
          metadata: {
            ...(transaction.metadata || {}),
            taxDeduction: {
              deductionPercentage: taxResult.deductionPercentage,
              deductibleAmount: taxResult.deductibleAmount,
              confidence: taxResult.confidence,
              reasoning: taxResult.reasoning,
              autoApproved: taxResult.autoApproved,
              taxYear: taxResult.taxYear,
              requiresDocumentation: taxResult.requiresDocumentation,
              complianceNotes: taxResult.complianceNotes,
            },
          },
        },
      });

      this.logger.log(
        `Tax deduction processed for transaction ${transaction.id}: ` +
        `${taxResult.deductionPercentage}% deductible (${taxResult.deductibleAmount} ${transaction.currency})`,
      );

      return taxResult;
    } catch (error) {
      this.logger.error(
        `Failed to process tax deduction for transaction ${transaction.id}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Check if transaction amount is an expense (negative/debit)
   */
  private isExpense(amount: number): boolean {
    return amount < 0;
  }

  /**
   * Manually trigger pipeline for specific connection
   * Useful for manual re-processing or testing
   */
  async triggerPipeline(connectionId: string): Promise<PipelineResult> {
    this.logger.log(`Manually triggering pipeline for connection ${connectionId}`);
    return this.processConnectionTransactions(connectionId);
  }

  /**
   * Manually trigger pipeline for specific transactions
   * Useful for re-categorizing specific transactions
   */
  async reclassifyTransactions(transactionIds: string[]): Promise<void> {
    this.logger.log(`Re-classifying ${transactionIds.length} transactions`);

    for (const txId of transactionIds) {
      try {
        const transaction = await this.prisma.bankTransactionNew.findUnique({
          where: { id: txId },
          include: {
            bankAccount: {
              include: {
                bankConnection: true,
              },
            },
          },
        });

        if (!transaction) {
          this.logger.warn(`Transaction ${txId} not found`);
          continue;
        }

        const orgId = transaction.bankAccount.bankConnection.orgId;

        // Categorize
        const result = await this.categorizationService.categorizeTransaction({
          transactionId: transaction.id,
          merchantName: transaction.merchantName || undefined,
          merchantCategory: transaction.merchantCategory || undefined,
          description: transaction.description,
          amount: transaction.amount.toNumber(),
          currency: transaction.currency,
          date: transaction.bookingDate,
          orgId,
        });

        // Apply result
        await this.applyCategorizationResult(orgId, result);

        this.logger.log(`Re-classified transaction ${txId}`);
      } catch (error) {
        this.logger.error(`Failed to re-classify transaction ${txId}: ${error.message}`);
      }
    }
  }
}
