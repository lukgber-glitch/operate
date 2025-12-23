import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';

/**
 * Plaid Transaction Matcher Service
 * Intelligently matches bank transactions to invoices and expenses
 *
 * Matching Strategies:
 * 1. Exact amount + date range match
 * 2. Merchant name similarity
 * 3. Description pattern matching
 * 4. Amount range matching (±5%)
 *
 * Confidence Scoring:
 * - 1.0: Exact match (amount + date + merchant)
 * - 0.8-0.99: High confidence (amount + partial merchant)
 * - 0.6-0.79: Medium confidence (amount range + date)
 * - 0.4-0.59: Low confidence (fuzzy matching)
 * - <0.4: No match suggested
 */
@Injectable()
export class PlaidTransactionMatcherService {
  private readonly logger = new Logger(PlaidTransactionMatcherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Match bank transactions to invoices
   */
  async matchToInvoices(
    orgId: string,
    transactionId: string,
    options?: {
      autoConfirm?: boolean;
      minConfidence?: number;
    },
  ) {
    const minConfidence = options?.minConfidence || 0.6;

    try {
      // Get transaction
      const transaction = await this.prisma.plaidTransaction.findFirst({
        where: {
          id: transactionId,
          orgId,
          isReconciled: false,
        },
      });

      if (!transaction) {
        return null;
      }

      // Only match income transactions to invoices
      if (!transaction.isIncome) {
        return null;
      }

      // Find potential invoice matches
      const dateRange = this.getDateRange(transaction.date, 7); // ±7 days

      const invoices = await this.prisma.invoice.findMany({
        where: {
          orgId,
          status: 'SENT', // Only match unpaid invoices
          totalAmount: {
            gte: Number(transaction.amount) * 0.95, // ±5%
            lte: Number(transaction.amount) * 1.05,
          },
          dueDate: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        orderBy: { dueDate: 'desc' },
        take: 10,
      });

      // Score each potential match
      const matches = invoices.map((invoice) => {
        const confidence = this.calculateInvoiceMatchConfidence(
          transaction,
          invoice,
        );
        return {
          invoice,
          confidence,
        };
      });

      // Filter by minimum confidence
      const validMatches = matches.filter((m) => m.confidence >= minConfidence);

      // Sort by confidence
      validMatches.sort((a, b) => b.confidence - a.confidence);

      // Auto-confirm if requested and high confidence
      if (
        options?.autoConfirm &&
        validMatches.length > 0 &&
        validMatches[0].confidence >= 0.9
      ) {
        const topMatch = validMatches[0];
        await this.confirmInvoiceMatch(
          transactionId,
          topMatch.invoice.id,
          topMatch.confidence,
          'SYSTEM',
        );

        this.logger.log(
          `Auto-confirmed invoice match: txn=${transactionId} invoice=${topMatch.invoice.id} confidence=${topMatch.confidence}`,
        );
      }

      return validMatches;
    } catch (error) {
      this.logger.error('Failed to match transaction to invoices', error);
      return null;
    }
  }

  /**
   * Match bank transactions to expenses
   */
  async matchToExpenses(
    orgId: string,
    transactionId: string,
    options?: {
      autoConfirm?: boolean;
      minConfidence?: number;
    },
  ) {
    const minConfidence = options?.minConfidence || 0.6;

    try {
      // Get transaction
      const transaction = await this.prisma.plaidTransaction.findFirst({
        where: {
          id: transactionId,
          orgId,
          isReconciled: false,
        },
      });

      if (!transaction) {
        return null;
      }

      // Only match expense transactions (not income)
      if (transaction.isIncome) {
        return null;
      }

      // Find potential expense matches
      const dateRange = this.getDateRange(transaction.date, 7); // ±7 days

      const expenses = await this.prisma.expense.findMany({
        where: {
          orgId,
          status: {
            in: ['PENDING', 'APPROVED'], // Only unmatch expenses
          },
          amount: {
            gte: Number(transaction.amount) * 0.95, // ±5%
            lte: Number(transaction.amount) * 1.05,
          },
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        orderBy: { date: 'desc' },
        take: 10,
      });

      // Score each potential match
      const matches = expenses.map((expense) => {
        const confidence = this.calculateExpenseMatchConfidence(
          transaction,
          expense,
        );
        return {
          expense,
          confidence,
        };
      });

      // Filter by minimum confidence
      const validMatches = matches.filter((m) => m.confidence >= minConfidence);

      // Sort by confidence
      validMatches.sort((a, b) => b.confidence - a.confidence);

      // Auto-confirm if requested and high confidence
      if (
        options?.autoConfirm &&
        validMatches.length > 0 &&
        validMatches[0].confidence >= 0.9
      ) {
        const topMatch = validMatches[0];
        await this.confirmExpenseMatch(
          transactionId,
          topMatch.expense.id,
          topMatch.confidence,
          'SYSTEM',
        );

        this.logger.log(
          `Auto-confirmed expense match: txn=${transactionId} expense=${topMatch.expense.id} confidence=${topMatch.confidence}`,
        );
      }

      return validMatches;
    } catch (error) {
      this.logger.error('Failed to match transaction to expenses', error);
      return null;
    }
  }

  /**
   * Get suggested matches for unreconciled transactions
   */
  async getSuggestedMatches(orgId: string, limit = 50) {
    try {
      // Get unreconciled transactions
      const transactions = await this.prisma.plaidTransaction.findMany({
        where: {
          orgId,
          isReconciled: false,
          status: 'POSTED', // Only posted transactions
        },
        orderBy: { date: 'desc' },
        take: limit,
      });

      const suggestions = [];

      for (const transaction of transactions) {
        let matches: any = null;

        if (transaction.isIncome) {
          // Match to invoices
          matches = await this.matchToInvoices(orgId, transaction.id, {
            minConfidence: 0.7,
          });

          if (matches && matches.length > 0) {
            suggestions.push({
              transaction,
              matchType: 'INVOICE',
              matches: matches.slice(0, 3), // Top 3 matches
            });
          }
        } else {
          // Match to expenses
          matches = await this.matchToExpenses(orgId, transaction.id, {
            minConfidence: 0.7,
          });

          if (matches && matches.length > 0) {
            suggestions.push({
              transaction,
              matchType: 'EXPENSE',
              matches: matches.slice(0, 3), // Top 3 matches
            });
          }
        }
      }

      return suggestions;
    } catch (error) {
      this.logger.error('Failed to get suggested matches', error);
      return [];
    }
  }

  /**
   * Confirm an invoice match
   */
  async confirmInvoiceMatch(
    transactionId: string,
    invoiceId: string,
    confidence: number,
    userId: string,
  ) {
    try {
      // Update transaction
      await this.prisma.plaidTransaction.update({
        where: { id: transactionId },
        data: {
          isReconciled: true,
          matchedInvoiceId: invoiceId,
          matchConfidence: confidence,
          matchedAt: new Date(),
          matchedBy: userId,
        },
      });

      // Update invoice status to PAID
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidDate: new Date(),
        },
      });

      this.logger.log(
        `Confirmed invoice match: txn=${transactionId} invoice=${invoiceId}`,
      );
    } catch (error) {
      this.logger.error('Failed to confirm invoice match', error);
      throw error;
    }
  }

  /**
   * Confirm an expense match
   */
  async confirmExpenseMatch(
    transactionId: string,
    expenseId: string,
    confidence: number,
    userId: string,
  ) {
    try {
      // Update transaction
      await this.prisma.plaidTransaction.update({
        where: { id: transactionId },
        data: {
          isReconciled: true,
          matchedExpenseId: expenseId,
          matchConfidence: confidence,
          matchedAt: new Date(),
          matchedBy: userId,
        },
      });

      // Optionally update expense status (depends on business logic)
      // await this.prisma.expense.update({
      //   where: { id: expenseId },
      //   data: { status: 'APPROVED' },
      // });

      this.logger.log(
        `Confirmed expense match: txn=${transactionId} expense=${expenseId}`,
      );
    } catch (error) {
      this.logger.error('Failed to confirm expense match', error);
      throw error;
    }
  }

  /**
   * Calculate confidence score for invoice match
   */
  private calculateInvoiceMatchConfidence(
    transaction: any,
    invoice: any,
  ): number {
    let score = 0;

    // Amount match (40% weight)
    const amountDiff =
      Math.abs(Number(transaction.amount) - Number(invoice.totalAmount)) /
      Number(invoice.totalAmount);
    if (amountDiff < 0.01) {
      score += 0.4; // Exact match
    } else if (amountDiff < 0.05) {
      score += 0.3; // Within 5%
    } else if (amountDiff < 0.1) {
      score += 0.2; // Within 10%
    }

    // Date proximity (30% weight)
    const daysDiff = Math.abs(
      (transaction.date.getTime() - invoice.dueDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysDiff === 0) {
      score += 0.3; // Same day
    } else if (daysDiff <= 3) {
      score += 0.25; // Within 3 days
    } else if (daysDiff <= 7) {
      score += 0.2; // Within a week
    } else if (daysDiff <= 14) {
      score += 0.1; // Within 2 weeks
    }

    // Customer name match (30% weight)
    if (
      transaction.merchantName &&
      invoice.customerName &&
      this.calculateStringSimilarity(
        transaction.merchantName.toLowerCase(),
        invoice.customerName.toLowerCase(),
      ) > 0.7
    ) {
      score += 0.3;
    } else if (
      transaction.merchantName &&
      invoice.customerName &&
      this.calculateStringSimilarity(
        transaction.merchantName.toLowerCase(),
        invoice.customerName.toLowerCase(),
      ) > 0.5
    ) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate confidence score for expense match
   */
  private calculateExpenseMatchConfidence(
    transaction: any,
    expense: any,
  ): number {
    let score = 0;

    // Amount match (40% weight)
    const amountDiff =
      Math.abs(Number(transaction.amount) - Number(expense.amount)) /
      Number(expense.amount);
    if (amountDiff < 0.01) {
      score += 0.4; // Exact match
    } else if (amountDiff < 0.05) {
      score += 0.3; // Within 5%
    } else if (amountDiff < 0.1) {
      score += 0.2; // Within 10%
    }

    // Date proximity (30% weight)
    const daysDiff = Math.abs(
      (transaction.date.getTime() - expense.date.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysDiff === 0) {
      score += 0.3; // Same day
    } else if (daysDiff <= 3) {
      score += 0.25; // Within 3 days
    } else if (daysDiff <= 7) {
      score += 0.2; // Within a week
    } else if (daysDiff <= 14) {
      score += 0.1; // Within 2 weeks
    }

    // Merchant/vendor name match (30% weight)
    if (
      transaction.merchantName &&
      expense.vendorName &&
      this.calculateStringSimilarity(
        transaction.merchantName.toLowerCase(),
        expense.vendorName.toLowerCase(),
      ) > 0.7
    ) {
      score += 0.3;
    } else if (
      transaction.merchantName &&
      expense.vendorName &&
      this.calculateStringSimilarity(
        transaction.merchantName.toLowerCase(),
        expense.vendorName.toLowerCase(),
      ) > 0.5
    ) {
      score += 0.15;
    }

    // Description similarity (bonus points)
    if (
      transaction.name &&
      expense.description &&
      this.calculateStringSimilarity(
        transaction.name.toLowerCase(),
        expense.description.toLowerCase(),
      ) > 0.6
    ) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate string similarity (Levenshtein distance normalized)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get date range (±days)
   */
  private getDateRange(
    date: Date,
    days: number,
  ): { start: Date; end: Date } {
    const start = new Date(date);
    start.setDate(start.getDate() - days);

    const end = new Date(date);
    end.setDate(end.getDate() + days);

    return { start, end };
  }
}
