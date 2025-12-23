import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';

/**
 * TrueLayer Transaction Matcher Service
 * Automatically matches bank transactions to invoices and expenses
 *
 * Features:
 * - Fuzzy matching by amount and date
 * - Merchant name matching
 * - Description keyword matching
 * - Confidence scoring (0.0 - 1.0)
 * - Auto-match above threshold
 * - Suggested matches below threshold
 */
@Injectable()
export class TrueLayerTransactionMatcherService {
  private readonly logger = new Logger(TrueLayerTransactionMatcherService.name);

  // Matching thresholds
  private readonly AUTO_MATCH_THRESHOLD = 0.95; // Auto-match above 95%
  private readonly SUGGEST_MATCH_THRESHOLD = 0.70; // Suggest matches above 70%
  private readonly DATE_WINDOW_DAYS = 7; // Look for matches within ±7 days

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Match a single transaction to invoices/expenses
   */
  async matchTransaction(
    orgId: string,
    transactionId: string,
    autoMatch = false,
  ): Promise<TransactionMatch | null> {
    try {
      this.logger.log(`Matching transaction ${transactionId}`);

      // Get transaction
      const transaction = await this.prisma.trueLayerTransaction.findFirst({
        where: {
          id: transactionId,
          orgId,
          isReconciled: false, // Only match unreconciled transactions
        },
      });

      if (!transaction) {
        this.logger.warn(`Transaction ${transactionId} not found or already reconciled`);
        return null;
      }

      // Determine if income or expense
      const isIncome = transaction.isIncome;

      let bestMatch: TransactionMatch | null = null;

      if (isIncome) {
        // Match to invoices
        bestMatch = await this.matchToInvoices(transaction);
      } else {
        // Match to expenses
        bestMatch = await this.matchToExpenses(transaction);
      }

      // Auto-match if confidence is high enough
      if (bestMatch && autoMatch && bestMatch.confidence >= this.AUTO_MATCH_THRESHOLD) {
        await this.applyMatch(transactionId, bestMatch);
        this.logger.log(
          `Auto-matched transaction ${transactionId} with confidence ${bestMatch.confidence}`,
        );
      }

      return bestMatch;
    } catch (error) {
      this.logger.error(`Failed to match transaction: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Match transaction to invoices
   */
  private async matchToInvoices(transaction: any): Promise<TransactionMatch | null> {
    // Calculate date range
    const dateFrom = new Date(transaction.timestamp);
    dateFrom.setDate(dateFrom.getDate() - this.DATE_WINDOW_DAYS);

    const dateTo = new Date(transaction.timestamp);
    dateTo.setDate(dateTo.getDate() + this.DATE_WINDOW_DAYS);

    // Find candidate invoices
    const invoices = await this.prisma.$queryRaw<Array<any>>`
      SELECT id, invoice_number, total_amount, issue_date, due_date, customer_name
      FROM invoices
      WHERE org_id = ${transaction.orgId}
        AND status = 'SENT'
        AND ABS(total_amount - ${transaction.amount}) < 1.00
        AND issue_date >= ${dateFrom}
        AND issue_date <= ${dateTo}
      LIMIT 10
    `;

    if (invoices.length === 0) {
      return null;
    }

    // Calculate confidence for each candidate
    const matches = invoices.map((invoice) => {
      let confidence = 0.0;

      // Amount match (40% weight)
      const amountDiff = Math.abs(Number(invoice.total_amount) - Number(transaction.amount));
      if (amountDiff < 0.01) {
        confidence += 0.4; // Exact match
      } else if (amountDiff < 1.0) {
        confidence += 0.4 * (1 - amountDiff); // Partial match
      }

      // Date match (30% weight)
      const dateDiff = Math.abs(
        new Date(invoice.issue_date).getTime() - new Date(transaction.timestamp).getTime(),
      );
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
      if (daysDiff <= 1) {
        confidence += 0.3; // Within 1 day
      } else if (daysDiff <= this.DATE_WINDOW_DAYS) {
        confidence += 0.3 * (1 - daysDiff / this.DATE_WINDOW_DAYS);
      }

      // Description/merchant match (30% weight)
      const description = transaction.description?.toLowerCase() || '';
      const merchantName = transaction.merchantName?.toLowerCase() || '';
      const customerName = invoice.customer_name?.toLowerCase() || '';
      const invoiceNumber = invoice.invoice_number?.toLowerCase() || '';

      if (description.includes(customerName) || merchantName.includes(customerName)) {
        confidence += 0.15;
      }
      if (description.includes(invoiceNumber)) {
        confidence += 0.15;
      }

      return {
        type: 'invoice' as const,
        matchedId: invoice.id,
        matchedRef: invoice.invoice_number,
        confidence: Math.min(confidence, 1.0),
        metadata: {
          amount: invoice.total_amount,
          issueDate: invoice.issue_date,
          customerName: invoice.customer_name,
        },
      };
    });

    // Return best match
    matches.sort((a, b) => b.confidence - a.confidence);
    const bestMatch = matches[0];

    if (bestMatch && bestMatch.confidence >= this.SUGGEST_MATCH_THRESHOLD) {
      return bestMatch;
    }

    return null;
  }

  /**
   * Match transaction to expenses
   */
  private async matchToExpenses(transaction: any): Promise<TransactionMatch | null> {
    // Calculate date range
    const dateFrom = new Date(transaction.timestamp);
    dateFrom.setDate(dateFrom.getDate() - this.DATE_WINDOW_DAYS);

    const dateTo = new Date(transaction.timestamp);
    dateTo.setDate(dateTo.getDate() + this.DATE_WINDOW_DAYS);

    // Find candidate expenses
    const expenses = await this.prisma.$queryRaw<Array<any>>`
      SELECT id, description, amount, expense_date, merchant, category
      FROM expenses
      WHERE org_id = ${transaction.orgId}
        AND ABS(amount - ${transaction.amount}) < 1.00
        AND expense_date >= ${dateFrom}
        AND expense_date <= ${dateTo}
      LIMIT 10
    `;

    if (expenses.length === 0) {
      return null;
    }

    // Calculate confidence for each candidate
    const matches = expenses.map((expense) => {
      let confidence = 0.0;

      // Amount match (40% weight)
      const amountDiff = Math.abs(Number(expense.amount) - Number(transaction.amount));
      if (amountDiff < 0.01) {
        confidence += 0.4; // Exact match
      } else if (amountDiff < 1.0) {
        confidence += 0.4 * (1 - amountDiff); // Partial match
      }

      // Date match (30% weight)
      const dateDiff = Math.abs(
        new Date(expense.expense_date).getTime() - new Date(transaction.timestamp).getTime(),
      );
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
      if (daysDiff <= 1) {
        confidence += 0.3; // Within 1 day
      } else if (daysDiff <= this.DATE_WINDOW_DAYS) {
        confidence += 0.3 * (1 - daysDiff / this.DATE_WINDOW_DAYS);
      }

      // Merchant/description match (30% weight)
      const description = transaction.description?.toLowerCase() || '';
      const merchantName = transaction.merchantName?.toLowerCase() || '';
      const expenseMerchant = expense.merchant?.toLowerCase() || '';
      const expenseDescription = expense.description?.toLowerCase() || '';

      if (merchantName && expenseMerchant && merchantName.includes(expenseMerchant)) {
        confidence += 0.2;
      }
      if (description.includes(expenseDescription) || expenseDescription.includes(description)) {
        confidence += 0.1;
      }

      return {
        type: 'expense' as const,
        matchedId: expense.id,
        matchedRef: expense.description,
        confidence: Math.min(confidence, 1.0),
        metadata: {
          amount: expense.amount,
          expenseDate: expense.expense_date,
          merchant: expense.merchant,
          category: expense.category,
        },
      };
    });

    // Return best match
    matches.sort((a, b) => b.confidence - a.confidence);
    const bestMatch = matches[0];

    if (bestMatch && bestMatch.confidence >= this.SUGGEST_MATCH_THRESHOLD) {
      return bestMatch;
    }

    return null;
  }

  /**
   * Apply match to transaction
   */
  private async applyMatch(transactionId: string, match: TransactionMatch): Promise<void> {
    const updateData: any = {
      isReconciled: true,
      matchConfidence: match.confidence,
      matchedAt: new Date(),
    };

    if (match.type === 'invoice') {
      updateData.matchedInvoiceId = match.matchedId;
    } else {
      updateData.matchedExpenseId = match.matchedId;
    }

    await this.prisma.trueLayerTransaction.update({
      where: { id: transactionId },
      data: updateData,
    });
  }

  /**
   * Match all unreconciled transactions for an organization
   */
  async matchAllTransactions(orgId: string, autoMatch = false): Promise<MatchSummary> {
    const summary: MatchSummary = {
      total: 0,
      matched: 0,
      suggested: 0,
      unmatched: 0,
    };

    try {
      // Get all unreconciled transactions
      const transactions = await this.prisma.trueLayerTransaction.findMany({
        where: {
          orgId,
          isReconciled: false,
        },
        orderBy: { timestamp: 'desc' },
      });

      summary.total = transactions.length;

      for (const transaction of transactions) {
        const match = await this.matchTransaction(orgId, transaction.id, autoMatch);

        if (match) {
          if (match.confidence >= this.AUTO_MATCH_THRESHOLD) {
            summary.matched++;
          } else {
            summary.suggested++;
          }
        } else {
          summary.unmatched++;
        }
      }

      this.logger.log(
        `Matched ${summary.matched}/${summary.total} transactions for org ${orgId}`,
      );

      return summary;
    } catch (error) {
      this.logger.error(`Failed to match all transactions: ${error.message}`, error.stack);
      return summary;
    }
  }
}

/**
 * Transaction Match Result
 */
export interface TransactionMatch {
  type: 'invoice' | 'expense';
  matchedId: string;
  matchedRef: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Match Summary
 */
export interface MatchSummary {
  total: number;
  matched: number;
  suggested: number;
  unmatched: number;
}
