/**
 * Banking Context Provider
 * Provides bank account balances and recent transactions to chatbot context
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { BaseContextProvider } from './base-context.provider';
import { TinkService } from '../../../integrations/tink/tink.service';

@Injectable()
export class BankingContextProvider extends BaseContextProvider {
  entityType = 'banking';

  constructor(
    prisma: PrismaService,
    private tinkService: TinkService,
  ) {
    super(prisma);
  }

  /**
   * Get banking summary for organization
   */
  async getBankingSummary(orgId: string): Promise<any> {
    // Get connected bank accounts
    const bankConnections = await this.prisma.bankConnection.findMany({
      where: { orgId, status: 'ACTIVE' },
      select: {
        id: true,
        provider: true,
        institutionName: true,
        status: true,
        lastSyncAt: true,
      },
    });

    // Get bank accounts
    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        accountNumber: true,
        iban: true,
        currency: true,
        currentBalance: true,
        availableBalance: true,
        accountType: true,
        bankName: true,
        lastSyncedAt: true,
      },
    });

    // Calculate total balance by currency
    const balancesByCurrency = new Map<string, number>();
    bankAccounts.forEach(acc => {
      const currency = acc.currency || 'EUR';
      const balance = parseFloat(acc.currentBalance?.toString() || '0');
      balancesByCurrency.set(currency, (balancesByCurrency.get(currency) || 0) + balance);
    });

    // Get recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccount: { orgId },
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
      take: 50,
      select: {
        id: true,
        description: true,
        amount: true,
        currency: true,
        date: true,
        type: true,
        category: true,
        counterpartyName: true,
      },
    });

    // Calculate income/expense summary
    let totalIncome = 0;
    let totalExpense = 0;
    recentTransactions.forEach(tx => {
      const amount = parseFloat(tx.amount?.toString() || '0');
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpense += Math.abs(amount);
      }
    });

    // Get pending payments (bills due)
    const pendingBills = await this.prisma.bill.findMany({
      where: {
        organisationId: orgId,
        status: { in: ['PENDING', 'APPROVED'] },
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      select: {
        id: true,
        vendorName: true,
        amount: true,
        currency: true,
        dueDate: true,
        status: true,
      },
    });

    const totalPendingPayments = pendingBills.reduce(
      (sum, bill) => sum + parseFloat(bill.amount?.toString() || '0'),
      0,
    );

    return {
      connections: bankConnections.length,
      accounts: bankAccounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        iban: acc.iban ? `****${acc.iban.slice(-4)}` : null,
        balance: parseFloat(acc.currentBalance?.toString() || '0'),
        available: parseFloat(acc.availableBalance?.toString() || '0'),
        currency: acc.currency || 'EUR',
        type: acc.accountType,
        institution: acc.bankName,
        lastSync: acc.lastSyncedAt,
      })),
      totalBalances: Object.fromEntries(balancesByCurrency),
      recentActivity: {
        transactionCount: recentTransactions.length,
        income: totalIncome,
        expenses: totalExpense,
        netFlow: totalIncome - totalExpense,
      },
      upcomingPayments: {
        count: pendingBills.length,
        total: totalPendingPayments,
        bills: pendingBills.map(b => ({
          id: b.id,
          vendor: b.vendorName,
          amount: parseFloat(b.amount?.toString() || '0'),
          currency: b.currency,
          dueDate: b.dueDate,
        })),
      },
      lastSyncTime: bankAccounts.length > 0
        ? bankAccounts.reduce((latest, acc) =>
            acc.lastSyncedAt && (!latest || acc.lastSyncedAt > latest) ? acc.lastSyncedAt : latest,
            null as Date | null)
        : null,
    };
  }

  /**
   * Get specific account details
   */
  async getAccountDetails(orgId: string, accountId: string): Promise<any> {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: accountId, orgId },
    });

    if (!account) {
      return null;
    }

    // Get last 30 transactions for this account
    const transactions = await this.prisma.bankTransaction.findMany({
      where: { bankAccountId: accountId },
      orderBy: { date: 'desc' },
      take: 30,
      select: {
        id: true,
        description: true,
        amount: true,
        currency: true,
        date: true,
        category: true,
        counterpartyName: true,
      },
    });

    return {
      account: {
        id: account.id,
        name: account.name,
        iban: account.iban,
        balance: parseFloat(account.currentBalance?.toString() || '0'),
        currency: account.currency || 'EUR',
        type: account.accountType,
      },
      transactions,
    };
  }

  protected async fetchEntity(entityId: string, orgId: string): Promise<any> {
    if (entityId === 'summary') {
      return this.getBankingSummary(orgId);
    }
    return this.getAccountDetails(orgId, entityId);
  }

  getSummary(banking: any): string {
    if (banking.accounts) {
      // This is a summary
      const totalBalance = Object.entries(banking.totalBalances)
        .map(([currency, amount]) => `${this.formatCurrency(amount as number)} ${currency}`)
        .join(', ');

      return `Banking: ${banking.accounts.length} accounts with ${totalBalance}. ${banking.recentActivity.transactionCount} recent transactions. ${banking.upcomingPayments.count} pending payments.`;
    }
    // This is an account detail
    return `Account ${banking.account.name}: ${this.formatCurrency(banking.account.balance)} ${banking.account.currency}`;
  }

  getRelevantFields(banking: any): Record<string, any> {
    if (banking.accounts) {
      return {
        accountCount: banking.accounts.length,
        totalBalances: banking.totalBalances,
        recentIncome: banking.recentActivity.income,
        recentExpenses: banking.recentActivity.expenses,
        netCashFlow: banking.recentActivity.netFlow,
        pendingPayments: banking.upcomingPayments.total,
        lastSync: banking.lastSyncTime,
      };
    }
    return {
      accountName: banking.account.name,
      balance: banking.account.balance,
      currency: banking.account.currency,
      recentTransactions: banking.transactions.length,
    };
  }

  getSuggestedActions(banking: any): string[] {
    const suggestions: string[] = [];

    if (banking.accounts) {
      if (banking.recentActivity.netFlow < 0) {
        suggestions.push('Review recent expenses - negative cash flow detected');
      }
      if (banking.upcomingPayments.count > 0) {
        suggestions.push(`Pay ${banking.upcomingPayments.count} pending bills`);
      }
      suggestions.push('View detailed transaction history');
      suggestions.push('Analyze spending by category');
      suggestions.push('Export bank statement');
    } else {
      suggestions.push('View all transactions');
      suggestions.push('Categorize transactions');
      suggestions.push('Set up automatic categorization');
    }

    return suggestions.slice(0, 5);
  }
}
