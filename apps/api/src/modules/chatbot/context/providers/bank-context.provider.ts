/**
 * Bank Context Provider
 * Provides context about bank accounts and transactions
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { TinkService } from '../../../integrations/tink/tink.service';

export interface BankAccountSummary {
  accountId: string;
  accountName: string;
  balance: number;
  currency: string;
  type: string;
  lastUpdated: Date;
}

export interface RecentTransactionSummary {
  date: Date;
  description: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
}

export interface BankContext {
  accounts: BankAccountSummary[];
  totalBalance: number;
  currency: string;
  recentTransactions: RecentTransactionSummary[];
  lastSynced?: Date;
}

@Injectable()
export class BankContextProvider {
  private readonly logger = new Logger(BankContextProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tinkService: TinkService,
  ) {}

  /**
   * Get bank context for an organization
   * Returns account balances and recent transactions
   */
  async getBankContext(
    organizationId: string,
    userId: string,
    limit: number = 10,
  ): Promise<BankContext> {
    try {
      this.logger.debug(`Fetching bank context for org ${organizationId}`);

      // Fetch accounts from Tink
      const accounts = await this.tinkService.getAccounts(organizationId, userId);

      // Transform accounts to summary format
      const accountSummaries: BankAccountSummary[] = accounts.map(account => ({
        accountId: account.id,
        accountName: account.name || account.identifiers?.accountNumber || 'Unknown Account',
        balance: account.balances?.booked?.amount?.value || 0,
        currency: account.balances?.booked?.amount?.currencyCode || 'EUR',
        type: account.type || 'CHECKING',
        lastUpdated: new Date(),
      }));

      // Calculate total balance (sum all accounts in primary currency)
      const primaryCurrency = accountSummaries[0]?.currency || 'EUR';
      const totalBalance = accountSummaries
        .filter(acc => acc.currency === primaryCurrency)
        .reduce((sum, acc) => sum + acc.balance, 0);

      // Fetch recent transactions from all accounts
      const recentTransactions: RecentTransactionSummary[] = [];

      for (const account of accounts.slice(0, 3)) { // Limit to first 3 accounts
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30); // Last 30 days

          const transactions = await this.tinkService.getTransactions(
            organizationId,
            userId,
            account.id,
            startDate,
            endDate,
          );

          // Add transactions to summary
          transactions.slice(0, limit).forEach(tx => {
            const amount = tx.amount?.value || 0;
            recentTransactions.push({
              date: new Date(tx.dates?.booked || tx.dates?.value || new Date()),
              description: tx.descriptions?.display || tx.descriptions?.original || 'Transaction',
              amount: Math.abs(amount),
              currency: tx.amount?.currencyCode || 'EUR',
              type: amount >= 0 ? 'credit' : 'debit',
            });
          });
        } catch (error) {
          this.logger.warn(`Failed to fetch transactions for account ${account.id}:`, error.message);
        }
      }

      // Sort transactions by date (most recent first)
      recentTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Limit to requested number
      const limitedTransactions = recentTransactions.slice(0, limit);

      const context: BankContext = {
        accounts: accountSummaries,
        totalBalance,
        currency: primaryCurrency,
        recentTransactions: limitedTransactions,
        lastSynced: new Date(),
      };

      this.logger.debug(
        `Bank context fetched: ${accountSummaries.length} accounts, ${limitedTransactions.length} recent transactions`,
      );

      return context;
    } catch (error) {
      this.logger.error('Error fetching bank context:', error);

      // Return empty context on error (chatbot can still function)
      return {
        accounts: [],
        totalBalance: 0,
        currency: 'EUR',
        recentTransactions: [],
      };
    }
  }

  /**
   * Format bank context for AI prompt
   */
  formatBankContextForPrompt(context: BankContext): string {
    const parts: string[] = [];

    if (context.accounts.length === 0) {
      parts.push('No bank accounts connected.');
      return parts.join('\n');
    }

    // Account summary
    parts.push(`Bank Accounts (${context.accounts.length}):`);
    context.accounts.forEach(account => {
      const balance = this.formatCurrency(account.balance, account.currency);
      parts.push(`  - ${account.accountName}: ${balance} (${account.type})`);
    });

    // Total balance
    const totalBalance = this.formatCurrency(context.totalBalance, context.currency);
    parts.push(`Total Balance: ${totalBalance}`);

    // Recent transactions
    if (context.recentTransactions.length > 0) {
      parts.push('\nRecent Transactions:');
      context.recentTransactions.slice(0, 5).forEach(tx => {
        const amount = this.formatCurrency(tx.amount, tx.currency);
        const symbol = tx.type === 'credit' ? '+' : '-';
        const date = this.formatDate(tx.date);
        parts.push(`  ${date}: ${symbol}${amount} - ${tx.description}`);
      });
    }

    if (context.lastSynced) {
      parts.push(`\nLast synced: ${this.getTimeAgo(context.lastSynced)}`);
    }

    return parts.join('\n');
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get human-readable time ago string
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}
