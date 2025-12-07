/**
 * Get Bank Transactions Action Handler
 * Handles bank transaction queries via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { BankContextProvider } from '../../context/providers/bank-context.provider';

@Injectable()
export class GetBankTransactionsHandler extends BaseActionHandler {
  constructor(private bankContextProvider: BankContextProvider) {
    super('GetBankTransactionsHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_BANK_TRANSACTIONS;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of transactions to retrieve (default: 10, max: 50)',
        default: 10,
        validation: (value) => value > 0 && value <= 50,
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'banking:view')) {
        return this.error(
          'You do not have permission to view bank transactions',
          'PERMISSION_DENIED',
        );
      }

      const limit = params.limit || 10;

      // Fetch bank context with transactions
      const bankContext = await this.bankContextProvider.getBankContext(
        context.organizationId,
        context.userId,
        limit,
      );

      if (bankContext.accounts.length === 0) {
        return this.success(
          'No bank accounts are currently connected. Please connect a bank account to view transactions.',
          undefined,
          'NoBankAccounts',
        );
      }

      if (bankContext.recentTransactions.length === 0) {
        return this.success(
          'No recent transactions found in your connected bank accounts.',
          undefined,
          'NoTransactions',
        );
      }

      // Format currency
      const formatCurrency = (amount: number, currency: string) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);

      // Format date
      const formatDate = (date: Date) =>
        date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

      // Build message
      let message = `**Recent Bank Transactions**\n\n`;

      // Group transactions by type
      const credits = bankContext.recentTransactions.filter(
        (tx) => tx.type === 'credit',
      );
      const debits = bankContext.recentTransactions.filter(
        (tx) => tx.type === 'debit',
      );

      // Show all transactions in chronological order
      bankContext.recentTransactions.forEach((tx) => {
        const amount = formatCurrency(tx.amount, tx.currency);
        const date = formatDate(tx.date);
        const symbol = tx.type === 'credit' ? '+' : '-';
        const emoji = tx.type === 'credit' ? '💰' : '💳';

        message += `${emoji} **${date}**: ${symbol}${amount}\n`;
        message += `   ${tx.description}\n\n`;
      });

      // Add summary
      const totalCredits = credits.reduce((sum, tx) => sum + tx.amount, 0);
      const totalDebits = debits.reduce((sum, tx) => sum + tx.amount, 0);

      message += `**Summary (${bankContext.recentTransactions.length} transactions)**\n`;
      message += `Income: ${formatCurrency(totalCredits, bankContext.currency)}\n`;
      message += `Expenses: ${formatCurrency(totalDebits, bankContext.currency)}\n`;
      message += `Net: ${formatCurrency(totalCredits - totalDebits, bankContext.currency)}\n`;

      if (bankContext.lastSynced) {
        const timeAgo = this.getTimeAgo(bankContext.lastSynced);
        message += `\n_Last updated: ${timeAgo}_`;
      }

      this.logger.log(
        `Bank transactions retrieved for user ${context.userId}: ${bankContext.recentTransactions.length} transactions`,
      );

      return this.success(message, undefined, 'BankTransactions', {
        transactions: bankContext.recentTransactions.map((tx) => ({
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          currency: tx.currency,
          type: tx.type,
        })),
        summary: {
          totalCredits,
          totalDebits,
          net: totalCredits - totalDebits,
          count: bankContext.recentTransactions.length,
        },
        lastSynced: bankContext.lastSynced,
      });
    } catch (error) {
      this.logger.error('Failed to get bank transactions:', error);
      return this.error(
        'Failed to retrieve bank transactions. Please try again later.',
        error.message || 'Unknown error',
      );
    }
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
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}
