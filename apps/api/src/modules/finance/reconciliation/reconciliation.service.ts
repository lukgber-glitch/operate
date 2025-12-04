import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  ReconciliationStatus,
  ReconciliationMatchType,
  ReconciliationAction,
} from '@prisma/client';
import {
  PotentialMatch,
  MatchResult,
  ReconciliationStats,
  ReconciliationFilter,
  AutoReconcileResult,
  CreateRuleDto,
  MatchType,
  MatchReason,
  ApplyMatchDto,
  IgnoreTransactionDto,
} from './reconciliation.types';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find potential matches for a bank transaction
   */
  async findMatches(transactionId: string): Promise<PotentialMatch[]> {
    const transaction = await this.prisma.bankTransactionNew.findUnique({
      where: { id: transactionId },
      include: {
        bankAccount: {
          include: {
            bankConnection: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (transaction.reconciliationStatus !== ReconciliationStatus.UNMATCHED) {
      throw new BadRequestException(
        `Transaction is already ${transaction.reconciliationStatus.toLowerCase()}`,
      );
    }

    const orgId = transaction.bankAccount.bankConnection.orgId;
    const matches: PotentialMatch[] = [];

    // Find matching expenses
    const expenseMatches = await this.findExpenseMatches(
      orgId,
      transaction,
    );
    matches.push(...expenseMatches);

    // Find matching invoice payments
    const invoiceMatches = await this.findInvoicePaymentMatches(
      orgId,
      transaction,
    );
    matches.push(...invoiceMatches);

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find matching expenses for a transaction
   */
  private async findExpenseMatches(
    orgId: string,
    transaction: any,
  ): Promise<PotentialMatch[]> {
    const matches: PotentialMatch[] = [];
    const transactionAmount = Math.abs(Number(transaction.amount));
    const transactionDate = new Date(transaction.bookingDate);

    // Date range: ±3 days
    const dateFrom = new Date(transactionDate);
    dateFrom.setDate(dateFrom.getDate() - 3);
    const dateTo = new Date(transactionDate);
    dateTo.setDate(dateTo.getDate() + 3);

    // Amount range: ±5%
    const minAmount = transactionAmount * 0.95;
    const maxAmount = transactionAmount * 1.05;

    const expenses = await this.prisma.expense.findMany({
      where: {
        orgId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
        amount: {
          gte: minAmount,
          lte: maxAmount,
        },
        status: {
          in: ['PENDING', 'APPROVED'],
        },
      },
    });

    for (const expense of expenses) {
      const confidence = this.calculateExpenseMatchConfidence(
        transaction,
        expense,
      );
      const reasons = this.getMatchReasons(transaction, expense);

      if (confidence > 0) {
        matches.push({
          type: MatchType.EXPENSE,
          id: expense.id,
          confidence,
          reason: reasons,
          metadata: {
            amount: Number(expense.amount),
            description: expense.description,
            date: expense.date,
            vendorName: expense.vendorName || undefined,
            category: expense.category,
            daysFromTransaction: this.getDaysDifference(
              transactionDate,
              expense.date,
            ),
            amountDifference: Math.abs(
              transactionAmount - Number(expense.amount),
            ),
          },
        });
      }
    }

    return matches;
  }

  /**
   * Find matching invoice payments for a transaction
   */
  private async findInvoicePaymentMatches(
    orgId: string,
    transaction: any,
  ): Promise<PotentialMatch[]> {
    const matches: PotentialMatch[] = [];
    const transactionAmount = Math.abs(Number(transaction.amount));
    const transactionDate = new Date(transaction.bookingDate);

    // Date range: ±3 days
    const dateFrom = new Date(transactionDate);
    dateFrom.setDate(dateFrom.getDate() - 3);
    const dateTo = new Date(transactionDate);
    dateTo.setDate(dateTo.getDate() + 3);

    // Amount range: exact or ±1%
    const minAmount = transactionAmount * 0.99;
    const maxAmount = transactionAmount * 1.01;

    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId,
        status: {
          in: ['SENT', 'OVERDUE'],
        },
        dueDate: {
          gte: dateFrom,
          lte: dateTo,
        },
        totalAmount: {
          gte: minAmount,
          lte: maxAmount,
        },
      },
    });

    for (const invoice of invoices) {
      const confidence = this.calculateInvoiceMatchConfidence(
        transaction,
        invoice,
      );
      const reasons = this.getInvoiceMatchReasons(transaction, invoice);

      if (confidence > 0) {
        matches.push({
          type: MatchType.INVOICE_PAYMENT,
          id: invoice.id,
          confidence,
          reason: reasons,
          metadata: {
            amount: Number(invoice.totalAmount),
            description: invoice.customerName,
            date: invoice.dueDate,
            merchantName: invoice.customerName,
            invoiceNumber: invoice.number,
            daysFromTransaction: this.getDaysDifference(
              transactionDate,
              invoice.dueDate,
            ),
            amountDifference: Math.abs(
              transactionAmount - Number(invoice.totalAmount),
            ),
          },
        });
      }
    }

    return matches;
  }

  /**
   * Calculate confidence score for expense match
   */
  private calculateExpenseMatchConfidence(
    transaction: any,
    expense: any,
  ): number {
    let confidence = 0;
    const transactionAmount = Math.abs(Number(transaction.amount));
    const expenseAmount = Number(expense.amount);
    const amountDiff = Math.abs(transactionAmount - expenseAmount);

    // Amount exact match: +40 points
    if (amountDiff <= 0.01) {
      confidence += 40;
    } else if (amountDiff / expenseAmount <= 0.01) {
      // Within 1%
      confidence += 35;
    } else if (amountDiff / expenseAmount <= 0.05) {
      // Within 5%
      confidence += 25;
    }

    // Date proximity: +30 points (max)
    const daysDiff = this.getDaysDifference(
      transaction.bookingDate,
      expense.date,
    );
    if (daysDiff === 0) {
      confidence += 30;
    } else if (daysDiff === 1) {
      confidence += 25;
    } else if (daysDiff === 2) {
      confidence += 15;
    } else if (daysDiff === 3) {
      confidence += 10;
    }

    // Merchant name match: +20 points
    if (expense.vendorName && transaction.merchantName) {
      const vendorSimilarity = this.calculateStringSimilarity(
        expense.vendorName.toLowerCase(),
        transaction.merchantName.toLowerCase(),
      );
      confidence += Math.floor(vendorSimilarity * 20);
    }

    // Description keyword match: +10 points
    if (expense.description && transaction.description) {
      const descSimilarity = this.calculateStringSimilarity(
        expense.description.toLowerCase(),
        transaction.description.toLowerCase(),
      );
      confidence += Math.floor(descSimilarity * 10);
    }

    return Math.min(confidence, 100);
  }

  /**
   * Calculate confidence score for invoice payment match
   */
  private calculateInvoiceMatchConfidence(
    transaction: any,
    invoice: any,
  ): number {
    let confidence = 0;
    const transactionAmount = Math.abs(Number(transaction.amount));
    const invoiceAmount = Number(invoice.totalAmount);
    const amountDiff = Math.abs(transactionAmount - invoiceAmount);

    // Amount exact match: +50 points (more important for invoices)
    if (amountDiff <= 0.01) {
      confidence += 50;
    } else if (amountDiff / invoiceAmount <= 0.01) {
      // Within 1%
      confidence += 40;
    }

    // Date proximity: +30 points
    const daysDiff = this.getDaysDifference(
      transaction.bookingDate,
      invoice.dueDate,
    );
    if (daysDiff === 0) {
      confidence += 30;
    } else if (daysDiff === 1) {
      confidence += 25;
    } else if (daysDiff === 2) {
      confidence += 15;
    } else if (daysDiff === 3) {
      confidence += 10;
    }

    // Customer name match: +20 points
    if (transaction.merchantName && invoice.customerName) {
      const nameSimilarity = this.calculateStringSimilarity(
        invoice.customerName.toLowerCase(),
        transaction.merchantName.toLowerCase(),
      );
      confidence += Math.floor(nameSimilarity * 20);
    }

    return Math.min(confidence, 100);
  }

  /**
   * Get match reasons for expense
   */
  private getMatchReasons(transaction: any, expense: any): MatchReason[] {
    const reasons: MatchReason[] = [];
    const transactionAmount = Math.abs(Number(transaction.amount));
    const expenseAmount = Number(expense.amount);
    const amountDiff = Math.abs(transactionAmount - expenseAmount);

    if (amountDiff <= 0.01) {
      reasons.push(MatchReason.AMOUNT_EXACT);
    } else if (amountDiff / expenseAmount <= 0.05) {
      reasons.push(MatchReason.AMOUNT_APPROXIMATE);
    }

    const daysDiff = this.getDaysDifference(
      transaction.bookingDate,
      expense.date,
    );
    if (daysDiff <= 3) {
      reasons.push(MatchReason.DATE_PROXIMITY);
    }

    if (expense.vendorName && transaction.merchantName) {
      const similarity = this.calculateStringSimilarity(
        expense.vendorName.toLowerCase(),
        transaction.merchantName.toLowerCase(),
      );
      if (similarity > 0.6) {
        reasons.push(MatchReason.MERCHANT_MATCH);
      }
    }

    if (expense.description && transaction.description) {
      const descLower = transaction.description.toLowerCase();
      const vendorLower = expense.vendorName?.toLowerCase() || '';
      if (descLower.includes(vendorLower) && vendorLower.length > 3) {
        reasons.push(MatchReason.DESCRIPTION_CONTAINS);
      }
    }

    return reasons;
  }

  /**
   * Get match reasons for invoice
   */
  private getInvoiceMatchReasons(
    transaction: any,
    invoice: any,
  ): MatchReason[] {
    const reasons: MatchReason[] = [];
    const transactionAmount = Math.abs(Number(transaction.amount));
    const invoiceAmount = Number(invoice.totalAmount);
    const amountDiff = Math.abs(transactionAmount - invoiceAmount);

    if (amountDiff <= 0.01) {
      reasons.push(MatchReason.AMOUNT_EXACT);
    } else if (amountDiff / invoiceAmount <= 0.01) {
      reasons.push(MatchReason.AMOUNT_APPROXIMATE);
    }

    const daysDiff = this.getDaysDifference(
      transaction.bookingDate,
      invoice.dueDate,
    );
    if (daysDiff <= 3) {
      reasons.push(MatchReason.DATE_PROXIMITY);
    }

    if (transaction.merchantName && invoice.customerName) {
      const similarity = this.calculateStringSimilarity(
        invoice.customerName.toLowerCase(),
        transaction.merchantName.toLowerCase(),
      );
      if (similarity > 0.6) {
        reasons.push(MatchReason.MERCHANT_MATCH);
      }
    }

    return reasons;
  }

  /**
   * Apply a match to a transaction
   */
  async applyMatch(
    transactionId: string,
    matchDto: ApplyMatchDto,
  ): Promise<MatchResult> {
    const transaction = await this.prisma.bankTransactionNew.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (transaction.reconciliationStatus !== ReconciliationStatus.UNMATCHED) {
      throw new BadRequestException(
        `Transaction is already ${transaction.reconciliationStatus.toLowerCase()}`,
      );
    }

    // Verify the match exists
    if (matchDto.matchType === MatchType.EXPENSE) {
      const expense = await this.prisma.expense.findUnique({
        where: { id: matchDto.matchId },
      });
      if (!expense) {
        throw new NotFoundException(`Expense ${matchDto.matchId} not found`);
      }
    } else if (matchDto.matchType === MatchType.INVOICE_PAYMENT) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: matchDto.matchId },
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice ${matchDto.matchId} not found`);
      }
    }

    // Update transaction
    const updateData: any = {
      reconciliationStatus: ReconciliationStatus.MATCHED,
    };

    if (matchDto.matchType === MatchType.EXPENSE) {
      updateData.matchedExpenseId = matchDto.matchId;
    } else if (matchDto.matchType === MatchType.INVOICE_PAYMENT) {
      updateData.matchedInvoicePaymentId = matchDto.matchId;
    }

    await this.prisma.bankTransactionNew.update({
      where: { id: transactionId },
      data: updateData,
    });

    this.logger.log(
      `Matched transaction ${transactionId} to ${matchDto.matchType} ${matchDto.matchId}`,
    );

    return {
      transactionId,
      matchType: matchDto.matchType,
      matchId: matchDto.matchId,
      confidence: matchDto.confidence || 0,
      matchedAt: new Date(),
    };
  }

  /**
   * Mark a transaction as ignored
   */
  async ignoreTransaction(
    transactionId: string,
    dto: IgnoreTransactionDto,
  ): Promise<void> {
    const transaction = await this.prisma.bankTransactionNew.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    await this.prisma.bankTransactionNew.update({
      where: { id: transactionId },
      data: {
        reconciliationStatus: ReconciliationStatus.IGNORED,
        rawData: transaction.rawData
          ? {
              ...(transaction.rawData as object),
              ignoreReason: dto.reason,
              ignoredAt: new Date().toISOString(),
            }
          : {
              ignoreReason: dto.reason,
              ignoredAt: new Date().toISOString(),
            },
      },
    });

    this.logger.log(`Ignored transaction ${transactionId}: ${dto.reason}`);
  }

  /**
   * Auto-reconcile transactions using rules
   */
  async autoReconcile(orgId: string): Promise<AutoReconcileResult> {
    const result: AutoReconcileResult = {
      processedCount: 0,
      matchedCount: 0,
      skippedCount: 0,
      matches: [],
      errors: [],
    };

    // Get all unmatched transactions
    const unmatchedTransactions =
      await this.prisma.bankTransactionNew.findMany({
        where: {
          bankAccount: {
            bankConnection: {
              orgId,
            },
          },
          reconciliationStatus: ReconciliationStatus.UNMATCHED,
        },
        include: {
          bankAccount: {
            include: {
              bankConnection: true,
            },
          },
        },
        take: 100, // Process in batches
      });

    result.processedCount = unmatchedTransactions.length;

    // Get active rules
    const rules = await this.prisma.reconciliationRule.findMany({
      where: {
        orgId,
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    for (const transaction of unmatchedTransactions) {
      try {
        // Try to find high-confidence matches
        const matches = await this.findMatches(transaction.id);
        const highConfidenceMatch = matches.find((m) => m.confidence >= 85);

        if (highConfidenceMatch) {
          await this.applyMatch(transaction.id, {
            matchType: highConfidenceMatch.type,
            matchId: highConfidenceMatch.id,
            confidence: highConfidenceMatch.confidence,
          });
          result.matchedCount++;
          result.matches.push({
            transactionId: transaction.id,
            matchType: highConfidenceMatch.type,
            matchId: highConfidenceMatch.id,
            confidence: highConfidenceMatch.confidence,
            matchedAt: new Date(),
          });
        } else {
          // Try rule-based matching
          const ruleMatch = await this.applyRules(transaction, rules);
          if (ruleMatch) {
            result.matchedCount++;
            result.matches.push(ruleMatch);
          } else {
            result.skippedCount++;
          }
        }
      } catch (error) {
        this.logger.error(
          `Error auto-reconciling transaction ${transaction.id}:`,
          error,
        );
        result.errors.push(
          `Transaction ${transaction.id}: ${error.message}`,
        );
        result.skippedCount++;
      }
    }

    this.logger.log(
      `Auto-reconciliation completed: ${result.matchedCount}/${result.processedCount} matched`,
    );

    return result;
  }

  /**
   * Apply reconciliation rules to a transaction
   */
  private async applyRules(
    transaction: any,
    rules: any[],
  ): Promise<MatchResult | null> {
    for (const rule of rules) {
      const matches = await this.checkRuleMatch(transaction, rule);
      if (matches) {
        return matches;
      }
    }
    return null;
  }

  /**
   * Check if a transaction matches a rule
   */
  private async checkRuleMatch(
    transaction: any,
    rule: any,
  ): Promise<MatchResult | null> {
    const { matchType, matchPattern } = rule;

    let isMatch = false;

    switch (matchType) {
      case ReconciliationMatchType.MERCHANT:
        isMatch = this.matchMerchantPattern(transaction, matchPattern);
        break;
      case ReconciliationMatchType.DESCRIPTION:
        isMatch = this.matchDescriptionPattern(transaction, matchPattern);
        break;
      case ReconciliationMatchType.AMOUNT_RANGE:
        isMatch = this.matchAmountRange(transaction, matchPattern);
        break;
    }

    if (!isMatch) {
      return null;
    }

    // Execute rule action
    if (rule.action === ReconciliationAction.AUTO_MATCH_EXPENSE) {
      // Find expense matching the rule criteria
      const matches = await this.findMatches(transaction.id);
      const bestMatch = matches.find((m) => m.type === MatchType.EXPENSE);

      if (bestMatch) {
        await this.applyMatch(transaction.id, {
          matchType: bestMatch.type,
          matchId: bestMatch.id,
          confidence: bestMatch.confidence,
        });

        return {
          transactionId: transaction.id,
          matchType: bestMatch.type,
          matchId: bestMatch.id,
          confidence: bestMatch.confidence,
          matchedAt: new Date(),
        };
      }
    }

    return null;
  }

  /**
   * Match merchant pattern
   */
  private matchMerchantPattern(transaction: any, pattern: string): boolean {
    if (!transaction.merchantName) return false;
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(transaction.merchantName);
    } catch {
      return transaction.merchantName
        .toLowerCase()
        .includes(pattern.toLowerCase());
    }
  }

  /**
   * Match description pattern
   */
  private matchDescriptionPattern(transaction: any, pattern: string): boolean {
    if (!transaction.description) return false;
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(transaction.description);
    } catch {
      return transaction.description
        .toLowerCase()
        .includes(pattern.toLowerCase());
    }
  }

  /**
   * Match amount range
   */
  private matchAmountRange(transaction: any, pattern: string): boolean {
    try {
      const [min, max] = pattern.split('-').map(Number);
      const amount = Math.abs(Number(transaction.amount));
      return amount >= min && amount <= max;
    } catch {
      return false;
    }
  }

  /**
   * Get unmatched transactions
   */
  async getUnmatchedTransactions(
    orgId: string,
    filters?: ReconciliationFilter,
  ) {
    const where: any = {
      bankAccount: {
        bankConnection: {
          orgId,
        },
      },
      reconciliationStatus: filters?.status || ReconciliationStatus.UNMATCHED,
    };

    if (filters?.dateFrom || filters?.dateTo) {
      where.bookingDate = {};
      if (filters.dateFrom) {
        where.bookingDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.bookingDate.lte = filters.dateTo;
      }
    }

    if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    if (filters?.merchantName) {
      where.merchantName = {
        contains: filters.merchantName,
        mode: 'insensitive',
      };
    }

    if (filters?.accountId) {
      where.bankAccountId = filters.accountId;
    }

    return this.prisma.bankTransactionNew.findMany({
      where,
      include: {
        bankAccount: {
          select: {
            id: true,
            name: true,
            accountType: true,
            currency: true,
          },
        },
      },
      orderBy: {
        bookingDate: 'desc',
      },
    });
  }

  /**
   * Get suggested matches for a transaction
   */
  async getSuggestedMatches(transactionId: string) {
    return this.findMatches(transactionId);
  }

  /**
   * Create a reconciliation rule
   */
  async createRule(orgId: string, dto: CreateRuleDto) {
    return this.prisma.reconciliationRule.create({
      data: {
        orgId,
        name: dto.name,
        description: dto.description,
        matchType: dto.matchType as ReconciliationMatchType,
        matchPattern: dto.matchPattern,
        action: dto.action as ReconciliationAction,
        categoryId: dto.categoryId,
        vendorId: dto.vendorId,
        priority: dto.priority || 0,
      },
    });
  }

  /**
   * Undo a match
   */
  async undoMatch(transactionId: string): Promise<void> {
    const transaction = await this.prisma.bankTransactionNew.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (transaction.reconciliationStatus !== ReconciliationStatus.MATCHED) {
      throw new BadRequestException('Transaction is not matched');
    }

    await this.prisma.bankTransactionNew.update({
      where: { id: transactionId },
      data: {
        reconciliationStatus: ReconciliationStatus.UNMATCHED,
        matchedExpenseId: null,
        matchedInvoicePaymentId: null,
      },
    });

    this.logger.log(`Undid match for transaction ${transactionId}`);
  }

  /**
   * Get reconciliation statistics
   */
  async getReconciliationStats(orgId: string): Promise<ReconciliationStats> {
    const transactions = await this.prisma.bankTransactionNew.findMany({
      where: {
        bankAccount: {
          bankConnection: {
            orgId,
          },
        },
      },
    });

    const stats: ReconciliationStats = {
      total: transactions.length,
      unmatched: 0,
      matched: 0,
      ignored: 0,
      percentageReconciled: 0,
      unmatchedValue: 0,
      matchedValue: 0,
      averageConfidence: 0,
      matchesByType: {
        expense: 0,
        invoicePayment: 0,
      },
      matchesByReason: {},
    };

    for (const transaction of transactions) {
      const amount = Math.abs(Number(transaction.amount));

      switch (transaction.reconciliationStatus) {
        case ReconciliationStatus.UNMATCHED:
          stats.unmatched++;
          stats.unmatchedValue += amount;
          break;
        case ReconciliationStatus.MATCHED:
          stats.matched++;
          stats.matchedValue += amount;
          if (transaction.matchedExpenseId) {
            stats.matchesByType.expense++;
          }
          if (transaction.matchedInvoicePaymentId) {
            stats.matchesByType.invoicePayment++;
          }
          break;
        case ReconciliationStatus.IGNORED:
          stats.ignored++;
          break;
      }
    }

    stats.percentageReconciled =
      stats.total > 0
        ? Math.round(((stats.matched + stats.ignored) / stats.total) * 100)
        : 0;

    return stats;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    if (longer.includes(shorter)) {
      return 0.8;
    }

    const editDistance = this.levenshteinDistance(str1, str2);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

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
   * Calculate days difference between two dates
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
