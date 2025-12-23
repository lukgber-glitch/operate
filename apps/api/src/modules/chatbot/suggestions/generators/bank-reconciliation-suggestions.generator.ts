/**
 * Bank Reconciliation Suggestions Generator
 * Generates proactive suggestions for unreconciled transactions and bank account issues
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { BaseSuggestionGenerator } from './base.generator';
import {
  GeneratorResult,
  Suggestion,
  SuggestionContext,
  SuggestionPriority,
  SuggestionType,
  Insight,
  TrendDirection,
} from '../suggestion.types';

@Injectable()
export class BankReconciliationSuggestionsGenerator extends BaseSuggestionGenerator {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async generate(context: SuggestionContext): Promise<GeneratorResult> {
    this.logger.debug(`Generating bank reconciliation suggestions for org ${context.orgId}`);

    const suggestions: Suggestion[] = [];
    const insights: Insight[] = [];

    try {
      // Check for unreconciled transactions
      const unreconciledResult = await this.checkUnreconciledTransactions(context);
      suggestions.push(...unreconciledResult.suggestions);

      // Check for uncategorized transactions
      const uncategorizedResult = await this.checkUncategorizedTransactions(context);
      suggestions.push(...uncategorizedResult.suggestions);

      // Check for unmatched transactions (could match invoices/bills)
      const unmatchedResult = await this.checkUnmatchedTransactions(context);
      suggestions.push(...unmatchedResult.suggestions);

      // Get bank connection health insights
      const connectionInsights = await this.checkBankConnectionHealth(context);
      insights.push(...connectionInsights);

      return {
        suggestions,
        insights,
        reminders: [],
        optimizations: [],
      };
    } catch (error) {
      this.logger.error('Error generating bank reconciliation suggestions:', error);
      return this.emptyResult();
    }
  }

  /**
   * Check for unreconciled transactions
   */
  private async checkUnreconciledTransactions(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    // Get bank connections for this org
    const bankConnections = await this.prisma.bankConnection.findMany({
      where: {
        orgId: context.orgId,
      },
      include: {
        accounts: {
          select: {
            id: true,
          },
        },
      },
    });

    if (bankConnections.length === 0) {
      return { suggestions: [] };
    }

    // Get all account IDs
    const accountIds = bankConnections.flatMap(conn => conn.accounts.map(acc => acc.id));

    if (accountIds.length === 0) {
      return { suggestions: [] };
    }

    // Count unreconciled transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const unreconciledCount = await this.prisma.bankTransactionNew.count({
      where: {
        bankAccountId: { in: accountIds },
        bookingDate: { gte: thirtyDaysAgo },
        reconciliationStatus: 'UNMATCHED',
      },
    });

    if (unreconciledCount === 0) {
      return { suggestions: [] };
    }

    // Get total amount
    const unreconciledTransactions = await this.prisma.bankTransactionNew.findMany({
      where: {
        bankAccountId: { in: accountIds },
        bookingDate: { gte: thirtyDaysAgo },
        reconciliationStatus: 'UNMATCHED',
      },
      select: {
        id: true,
        amount: true,
      },
      take: 100,
    });

    const totalUnreconciled = unreconciledTransactions.reduce(
      (sum, tx) => sum + Math.abs(Number(tx.amount)),
      0,
    );

    const priority = unreconciledCount > 50
      ? SuggestionPriority.HIGH
      : SuggestionPriority.MEDIUM;

    const suggestion: Suggestion = {
      id: this.createSuggestionId('bank', 'unreconciled', context.orgId),
      type: SuggestionType.WARNING,
      title: `${unreconciledCount} unreconciled transaction${unreconciledCount > 1 ? 's' : ''}`,
      description: `You have ${unreconciledCount} unreconciled bank transaction${unreconciledCount > 1 ? 's' : ''} from the last 30 days totaling ${this.formatCurrency(totalUnreconciled)}. Keep your books accurate by reconciling them.`,
      action: {
        type: 'navigate',
        label: 'Reconcile Now',
        params: { path: '/banking?view=unreconciled' },
      },
      priority,
      dismissible: true,
      metadata: {
        entityType: 'bank_transaction',
        count: unreconciledCount,
        totalAmount: totalUnreconciled,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check for uncategorized transactions
   */
  private async checkUncategorizedTransactions(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    // Get bank connections for this org
    const bankConnections = await this.prisma.bankConnection.findMany({
      where: {
        orgId: context.orgId,
      },
      include: {
        accounts: {
          select: {
            id: true,
          },
        },
      },
    });

    if (bankConnections.length === 0) {
      return { suggestions: [] };
    }

    const accountIds = bankConnections.flatMap(conn => conn.accounts.map(acc => acc.id));

    if (accountIds.length === 0) {
      return { suggestions: [] };
    }

    // Count uncategorized transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const uncategorizedCount = await this.prisma.bankTransactionNew.count({
      where: {
        bankAccountId: { in: accountIds },
        bookingDate: { gte: thirtyDaysAgo },
        category: null,
      },
    });

    if (uncategorizedCount === 0) {
      return { suggestions: [] };
    }

    const suggestion: Suggestion = {
      id: this.createSuggestionId('bank', 'uncategorized', context.orgId),
      type: SuggestionType.QUICK_ACTION,
      title: `${uncategorizedCount} uncategorized transaction${uncategorizedCount > 1 ? 's' : ''}`,
      description: `${uncategorizedCount} bank transaction${uncategorizedCount > 1 ? 's' : ''} from the last 30 days ${uncategorizedCount > 1 ? 'are' : 'is'} missing categories. Categorize them to get accurate financial reports.`,
      action: {
        type: 'navigate',
        label: 'Categorize',
        params: { path: '/banking?view=uncategorized' },
      },
      priority: SuggestionPriority.MEDIUM,
      dismissible: true,
      metadata: {
        entityType: 'bank_transaction',
        count: uncategorizedCount,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check for unmatched transactions (could be matched to invoices/bills)
   */
  private async checkUnmatchedTransactions(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    // Get bank connections for this org
    const bankConnections = await this.prisma.bankConnection.findMany({
      where: {
        orgId: context.orgId,
      },
      include: {
        accounts: {
          select: {
            id: true,
          },
        },
      },
    });

    if (bankConnections.length === 0) {
      return { suggestions: [] };
    }

    const accountIds = bankConnections.flatMap(conn => conn.accounts.map(acc => acc.id));

    if (accountIds.length === 0) {
      return { suggestions: [] };
    }

    // Count unmatched transactions (last 30 days, income/expense only)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const unmatchedCount = await this.prisma.bankTransactionNew.count({
      where: {
        bankAccountId: { in: accountIds },
        bookingDate: { gte: thirtyDaysAgo },
        reconciliationStatus: 'UNMATCHED',
        OR: [
          { matchedExpenseId: null, amount: { gt: 0 } }, // Unmatched income
          { matchedExpenseId: null, amount: { lt: 0 } }, // Unmatched expenses
        ],
      },
    });

    if (unmatchedCount === 0 || unmatchedCount < 5) {
      // Only suggest if there are at least 5 unmatched transactions
      return { suggestions: [] };
    }

    const suggestion: Suggestion = {
      id: this.createSuggestionId('bank', 'unmatched', context.orgId),
      type: SuggestionType.TIP,
      title: `${unmatchedCount} transaction${unmatchedCount > 1 ? 's' : ''} could be matched`,
      description: `${unmatchedCount} bank transaction${unmatchedCount > 1 ? 's' : ''} might match existing invoices or bills. Matching them will help track payments automatically.`,
      action: {
        type: 'navigate',
        label: 'Match Transactions',
        params: { path: '/banking?view=matching' },
      },
      priority: SuggestionPriority.LOW,
      dismissible: true,
      metadata: {
        entityType: 'bank_transaction',
        count: unmatchedCount,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check bank connection health
   */
  private async checkBankConnectionHealth(
    context: SuggestionContext,
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    try {
      // Get bank connections
      const connections = await this.prisma.bankConnection.findMany({
        where: {
          orgId: context.orgId,
        },
        include: {
          accounts: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (connections.length === 0) {
        insights.push({
          id: this.createSuggestionId('insight', 'no_bank', context.orgId),
          title: 'No Bank Connection',
          description: 'Connect your bank account to automatically sync transactions and get real-time cash flow insights.',
          icon: 'bank',
          metadata: {
            action: 'connect_bank',
          },
        });
        return insights;
      }

      // Check for stale connections (not synced in 48 hours)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const staleConnections = connections.filter(
        conn => conn.lastSyncAt && conn.lastSyncAt < twoDaysAgo
      );

      if (staleConnections.length > 0) {
        insights.push({
          id: this.createSuggestionId('insight', 'stale_connection', context.orgId),
          title: 'Bank Connection Outdated',
          description: `${staleConnections.length} bank connection${staleConnections.length > 1 ? 's' : ''} haven't synced in over 48 hours. Reconnect to get the latest transactions.`,
          icon: 'alert',
          trend: TrendDirection.DOWN,
          metadata: {
            connectionIds: staleConnections.map(c => c.id),
            action: 'reconnect_bank',
          },
        });
      }

      // Check for disconnected connections
      const disconnectedConnections = connections.filter(
        conn => conn.status === 'ERROR' || conn.status === 'DISCONNECTED'
      );

      if (disconnectedConnections.length > 0) {
        insights.push({
          id: this.createSuggestionId('insight', 'disconnected', context.orgId),
          title: 'Bank Connection Issue',
          description: `${disconnectedConnections.length} bank connection${disconnectedConnections.length > 1 ? 's' : ''} ${disconnectedConnections.length > 1 ? 'are' : 'is'} disconnected. Please reconnect to continue syncing transactions.`,
          icon: 'alert',
          trend: TrendDirection.DOWN,
          metadata: {
            connectionIds: disconnectedConnections.map(c => c.id),
            institutions: disconnectedConnections.map(c => c.institutionName),
            action: 'reconnect_bank',
          },
        });
      }

      // Positive insight: All connections healthy
      if (staleConnections.length === 0 && disconnectedConnections.length === 0) {
        const totalAccounts = connections.reduce((sum, c) => sum + c.accounts.length, 0);
        insights.push({
          id: this.createSuggestionId('insight', 'healthy_connections', context.orgId),
          title: 'Bank Connections Healthy',
          description: `All ${totalAccounts} bank account${totalAccounts > 1 ? 's' : ''} are connected and syncing properly.`,
          icon: 'check',
          trend: TrendDirection.UP,
          metadata: {
            connectionCount: connections.length,
            accountCount: totalAccounts,
          },
        });
      }
    } catch (error) {
      this.logger.error('Error checking bank connection health:', error);
    }

    return insights;
  }
}
