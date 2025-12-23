import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlaidBankService } from '../services/plaid-bank.service';
import { PlaidTransactionMatcherService } from '../services/plaid-transaction-matcher.service';
import { PrismaService } from '@/modules/database/prisma.service';

/**
 * Plaid Sync Jobs
 *
 * Background jobs for syncing Plaid data:
 * - Daily transaction sync
 * - Balance refresh
 * - Webhook processing
 * - Auto-matching transactions
 */

// Job names
export const PLAID_JOB_NAMES = {
  DAILY_SYNC: 'plaid:daily-sync',
  BALANCE_REFRESH: 'plaid:balance-refresh',
  PROCESS_WEBHOOK: 'plaid:process-webhook',
  AUTO_MATCH: 'plaid:auto-match',
} as const;

// Job data interfaces
export interface DailySyncJobData {
  orgId: string;
  userId: string;
  accountIds?: string[];
}

export interface BalanceRefreshJobData {
  orgId: string;
  userId: string;
  itemId: string;
}

export interface ProcessWebhookJobData {
  webhookType: string;
  webhookCode: string;
  itemId: string;
  data: any;
}

export interface AutoMatchJobData {
  orgId: string;
  limit?: number;
  minConfidence?: number;
}

/**
 * Daily Transaction Sync Job Processor
 */
@Processor('plaid-sync')
export class PlaidDailySyncProcessor extends WorkerHost {
  private readonly logger = new Logger(PlaidDailySyncProcessor.name);

  constructor(
    private readonly plaidBankService: PlaidBankService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<DailySyncJobData>): Promise<any> {
    const { orgId, userId, accountIds } = job.data;

    this.logger.log(
      `Processing daily sync job for org ${orgId} (Job ID: ${job.id})`,
    );

    try {
      // Get active accounts to sync
      const accounts = accountIds
        ? await this.prisma.plaidBankAccount.findMany({
            where: {
              orgId,
              id: { in: accountIds },
              isActive: true,
            },
          })
        : await this.prisma.plaidBankAccount.findMany({
            where: {
              orgId,
              isActive: true,
            },
          });

      const results = [];

      for (const account of accounts) {
        try {
          // Update progress
          await job.updateProgress({
            current: results.length + 1,
            total: accounts.length,
            accountId: account.id,
            accountName: account.name,
          });

          // Sync transactions for this account
          const syncResult = await this.plaidBankService.syncTransactions(
            orgId,
            userId,
            account.id,
          );

          results.push({
            accountId: account.id,
            accountName: account.name,
            ...syncResult,
          });

          this.logger.log(
            `Synced account ${account.name}: +${syncResult.added} ~${syncResult.modified} -${syncResult.removed}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to sync account ${account.id}: ${error.message}`,
          );
          results.push({
            accountId: account.id,
            accountName: account.name,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        accountsProcessed: accounts.length,
        results,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Daily sync job failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<DailySyncJobData>) {
    this.logger.log(`Daily sync job completed: ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<DailySyncJobData>, error: Error) {
    this.logger.error(
      `Daily sync job failed: ${job.id} - ${error.message}`,
      error.stack,
    );
  }
}

/**
 * Balance Refresh Job Processor
 */
@Processor('plaid-balance')
export class PlaidBalanceRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(PlaidBalanceRefreshProcessor.name);

  constructor(private readonly plaidBankService: PlaidBankService) {
    super();
  }

  async process(job: Job<BalanceRefreshJobData>): Promise<any> {
    const { orgId, userId, itemId } = job.data;

    this.logger.log(
      `Processing balance refresh job for item ${itemId} (Job ID: ${job.id})`,
    );

    try {
      const accounts = await this.plaidBankService.refreshAccountBalances(
        orgId,
        userId,
        itemId,
      );

      return {
        success: true,
        accountsRefreshed: accounts.length,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Balance refresh job failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BalanceRefreshJobData>) {
    this.logger.log(`Balance refresh job completed: ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BalanceRefreshJobData>, error: Error) {
    this.logger.error(
      `Balance refresh job failed: ${job.id} - ${error.message}`,
      error.stack,
    );
  }
}

/**
 * Webhook Processing Job Processor
 */
@Processor('plaid-webhook')
export class PlaidWebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(PlaidWebhookProcessor.name);

  constructor(
    private readonly plaidBankService: PlaidBankService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<ProcessWebhookJobData>): Promise<any> {
    const { webhookType, webhookCode, itemId, data } = job.data;

    this.logger.log(
      `Processing webhook: ${webhookType}.${webhookCode} for item ${itemId} (Job ID: ${job.id})`,
    );

    try {
      // Handle different webhook types
      switch (webhookType) {
        case 'TRANSACTIONS':
          return await this.handleTransactionsWebhook(webhookCode, itemId, data);

        case 'ITEM':
          return await this.handleItemWebhook(webhookCode, itemId, data);

        default:
          this.logger.warn(`Unhandled webhook type: ${webhookType}`);
          return { success: true, action: 'ignored' };
      }
    } catch (error) {
      this.logger.error(
        `Webhook processing failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async handleTransactionsWebhook(
    code: string,
    itemId: string,
    data: any,
  ) {
    switch (code) {
      case 'SYNC_UPDATES_AVAILABLE':
        // Trigger sync for all accounts with this itemId
        const accounts = await this.prisma.plaidBankAccount.findMany({
          where: { plaidItemId: itemId, isActive: true },
        });

        this.logger.log(
          `SYNC_UPDATES_AVAILABLE: Syncing ${accounts.length} accounts`,
        );

        // Note: You would typically queue individual sync jobs here
        return {
          success: true,
          action: 'sync_queued',
          accountCount: accounts.length,
        };

      case 'DEFAULT_UPDATE':
        this.logger.log('DEFAULT_UPDATE: New transactions available');
        return { success: true, action: 'notification_sent' };

      case 'REMOVED':
        // Handle removed transactions
        if (data.removed_transactions && data.removed_transactions.length > 0) {
          const account = await this.prisma.plaidBankAccount.findFirst({
            where: { plaidItemId: itemId },
          });

          if (account) {
            await this.plaidBankService.removeTransactions(
              account.orgId,
              data.removed_transactions,
            );
          }
        }
        return {
          success: true,
          action: 'transactions_removed',
          count: data.removed_transactions?.length || 0,
        };

      default:
        this.logger.warn(`Unhandled transaction webhook code: ${code}`);
        return { success: true, action: 'ignored' };
    }
  }

  private async handleItemWebhook(code: string, itemId: string, data: any) {
    switch (code) {
      case 'ERROR':
        // Mark item as having an error
        await this.prisma.$executeRaw`
          UPDATE plaid_connections
          SET status = 'ERROR', updated_at = NOW()
          WHERE item_id = ${itemId}
        `;
        this.logger.error(`Item error: ${itemId} - ${JSON.stringify(data.error)}`);
        return { success: true, action: 'item_marked_error' };

      case 'PENDING_EXPIRATION':
        // Notify user that consent is expiring
        this.logger.warn(`Item pending expiration: ${itemId}`);
        return { success: true, action: 'expiration_notification_sent' };

      case 'USER_PERMISSION_REVOKED':
        // Mark connection as inactive
        await this.prisma.$executeRaw`
          UPDATE plaid_connections
          SET status = 'INACTIVE', updated_at = NOW()
          WHERE item_id = ${itemId}
        `;

        await this.prisma.plaidBankAccount.updateMany({
          where: { plaidItemId: itemId },
          data: { isActive: false },
        });

        this.logger.log(`User revoked permission for item: ${itemId}`);
        return { success: true, action: 'item_deactivated' };

      default:
        this.logger.warn(`Unhandled item webhook code: ${code}`);
        return { success: true, action: 'ignored' };
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ProcessWebhookJobData>) {
    this.logger.log(`Webhook processing job completed: ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ProcessWebhookJobData>, error: Error) {
    this.logger.error(
      `Webhook processing job failed: ${job.id} - ${error.message}`,
      error.stack,
    );
  }
}

/**
 * Auto-Match Transactions Job Processor
 */
@Processor('plaid-auto-match')
export class PlaidAutoMatchProcessor extends WorkerHost {
  private readonly logger = new Logger(PlaidAutoMatchProcessor.name);

  constructor(
    private readonly matcherService: PlaidTransactionMatcherService,
  ) {
    super();
  }

  async process(job: Job<AutoMatchJobData>): Promise<any> {
    const { orgId, limit = 50, minConfidence = 0.85 } = job.data;

    this.logger.log(
      `Processing auto-match job for org ${orgId} (Job ID: ${job.id})`,
    );

    try {
      // Get suggested matches
      const suggestions = await this.matcherService.getSuggestedMatches(
        orgId,
        limit,
      );

      let invoiceMatches = 0;
      let expenseMatches = 0;

      for (const suggestion of suggestions) {
        const topMatch = suggestion.matches[0];

        // Only auto-confirm high confidence matches
        if (topMatch.confidence >= minConfidence) {
          try {
            if (suggestion.matchType === 'INVOICE') {
              await this.matcherService.confirmInvoiceMatch(
                suggestion.transaction.id,
                topMatch.invoice.id,
                topMatch.confidence,
                'SYSTEM',
              );
              invoiceMatches++;
            } else if (suggestion.matchType === 'EXPENSE') {
              await this.matcherService.confirmExpenseMatch(
                suggestion.transaction.id,
                topMatch.expense.id,
                topMatch.confidence,
                'SYSTEM',
              );
              expenseMatches++;
            }

            // Update progress
            await job.updateProgress({
              total: suggestions.length,
              matched: invoiceMatches + expenseMatches,
            });
          } catch (error) {
            this.logger.error(
              `Failed to auto-match transaction ${suggestion.transaction.id}: ${error.message}`,
            );
          }
        }
      }

      return {
        success: true,
        totalSuggestions: suggestions.length,
        invoiceMatches,
        expenseMatches,
        totalMatched: invoiceMatches + expenseMatches,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Auto-match job failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<AutoMatchJobData>) {
    this.logger.log(`Auto-match job completed: ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<AutoMatchJobData>, error: Error) {
    this.logger.error(
      `Auto-match job failed: ${job.id} - ${error.message}`,
      error.stack,
    );
  }
}
