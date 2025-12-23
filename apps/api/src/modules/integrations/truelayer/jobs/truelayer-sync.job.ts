import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TrueLayerBankingService } from '../services/truelayer-banking.service';
import { PrismaService } from '@/modules/database/prisma.service';

/**
 * TrueLayer Transaction Sync Job
 * Background job for syncing transactions from TrueLayer
 *
 * Scheduled to run every 4 hours (configurable)
 * Can also be triggered on-demand via API
 */
@Processor('truelayer-sync', {
  concurrency: 5, // Process up to 5 sync jobs concurrently
})
export class TrueLayerSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(TrueLayerSyncProcessor.name);

  constructor(
    private readonly trueLayerBankingService: TrueLayerBankingService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<TrueLayerSyncJobData>): Promise<TrueLayerSyncJobResult> {
    const { orgId, userId, accountId, connectionId, syncType } = job.data;

    this.logger.log(
      `Processing ${syncType} sync for account ${accountId} (job ${job.id})`,
    );

    const startTime = Date.now();

    try {
      if (syncType === 'accounts') {
        // Sync accounts
        const accounts = await this.trueLayerBankingService.syncAccounts(
          orgId,
          userId,
          connectionId,
        );

        return {
          success: true,
          syncType,
          accountsSynced: accounts.length,
          transactionsAdded: 0,
          transactionsModified: 0,
          duration: Date.now() - startTime,
        };
      } else if (syncType === 'transactions') {
        // Sync transactions for specific account
        const result = await this.trueLayerBankingService.syncTransactions(
          orgId,
          userId,
          accountId,
        );

        return {
          success: true,
          syncType,
          accountsSynced: 0,
          transactionsAdded: result.added,
          transactionsModified: result.modified,
          duration: Date.now() - startTime,
        };
      } else if (syncType === 'full') {
        // Full sync: accounts + transactions for all accounts
        const accounts = await this.trueLayerBankingService.syncAccounts(
          orgId,
          userId,
          connectionId,
        );

        let totalAdded = 0;
        let totalModified = 0;

        // Sync transactions for each account
        for (const account of accounts) {
          try {
            const result = await this.trueLayerBankingService.syncTransactions(
              orgId,
              userId,
              account.id,
            );
            totalAdded += result.added;
            totalModified += result.modified;
          } catch (error) {
            this.logger.error(
              `Failed to sync transactions for account ${account.id}: ${error.message}`,
            );
          }
        }

        return {
          success: true,
          syncType,
          accountsSynced: accounts.length,
          transactionsAdded: totalAdded,
          transactionsModified: totalModified,
          duration: Date.now() - startTime,
        };
      }

      throw new Error(`Unknown sync type: ${syncType}`);
    } catch (error) {
      this.logger.error(`Sync job failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<TrueLayerSyncJobData, TrueLayerSyncJobResult>) {
    const { result } = job;
    this.logger.log(
      `Sync job ${job.id} completed: ${result.accountsSynced} accounts, +${result.transactionsAdded} ~${result.transactionsModified} transactions (${result.duration}ms)`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TrueLayerSyncJobData>, error: Error) {
    this.logger.error(
      `Sync job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job<TrueLayerSyncJobData>) {
    this.logger.debug(`Sync job ${job.id} started`);
  }
}

/**
 * TrueLayer Sync Job Data
 */
export interface TrueLayerSyncJobData {
  orgId: string;
  userId: string;
  connectionId: string;
  accountId?: string; // Required for 'transactions' sync type
  syncType: 'accounts' | 'transactions' | 'full';
}

/**
 * TrueLayer Sync Job Result
 */
export interface TrueLayerSyncJobResult {
  success: boolean;
  syncType: string;
  accountsSynced: number;
  transactionsAdded: number;
  transactionsModified: number;
  duration: number;
}
