/**
 * Get Bank Balance Action Handler
 * Handles bank balance queries via chatbot
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
export class GetBankBalanceHandler extends BaseActionHandler {
  constructor(private bankContextProvider: BankContextProvider) {
    super('GetBankBalanceHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_BANK_BALANCE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'banking:view')) {
        return this.error(
          'You do not have permission to view bank balances',
          'PERMISSION_DENIED',
        );
      }

      // Fetch bank context
      const bankContext = await this.bankContextProvider.getBankContext(
        context.organizationId,
        context.userId,
      );

      if (bankContext.accounts.length === 0) {
        return this.success(
          'No bank accounts are currently connected. Please connect a bank account to view your balance.',
          undefined,
          'NoBankAccounts',
        );
      }

      // Format currency
      const formatCurrency = (amount: number, currency: string) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);

      // Build message
      let message = `**Bank Account Summary**\n\n`;

      // List all accounts
      bankContext.accounts.forEach(account => {
        const balance = formatCurrency(account.balance, account.currency);
        message += `**${account.accountName}** (${account.type})\n`;
        message += `Balance: ${balance}\n\n`;
      });

      // Add total if we have accounts
      if (bankContext.accounts.length > 1) {
        const totalBalance = formatCurrency(
          bankContext.totalBalance,
          bankContext.currency,
        );
        message += `**Total Balance:** ${totalBalance}\n`;
      }

      if (bankContext.lastSynced) {
        const timeAgo = this.getTimeAgo(bankContext.lastSynced);
        message += `\n_Last updated: ${timeAgo}_`;
      }

      this.logger.log(
        `Bank balance retrieved for user ${context.userId}: ${bankContext.accounts.length} accounts`,
      );

      return this.success(message, undefined, 'BankBalance', {
        accounts: bankContext.accounts.map(acc => ({
          name: acc.accountName,
          balance: acc.balance,
          currency: acc.currency,
          type: acc.type,
        })),
        totalBalance: bankContext.totalBalance,
        currency: bankContext.currency,
        lastSynced: bankContext.lastSynced,
      });
    } catch (error) {
      this.logger.error('Failed to get bank balance:', error);
      return this.error(
        'Failed to retrieve bank balance. Please try again later.',
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
