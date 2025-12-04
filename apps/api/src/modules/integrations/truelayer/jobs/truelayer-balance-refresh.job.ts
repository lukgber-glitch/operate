import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TrueLayerBankingService } from '../services/truelayer-banking.service';

/**
 * TrueLayer Balance Refresh Job
 * Background job for refreshing account balances from TrueLayer
 *
 * Triggered by:
 * - Scheduled cron job (every hour or configurable)
 * - On-demand API request
 * - Webhook events (balance.updated)
 */
@Processor('truelayer-balance', {
  concurrency: 10, // Process up to 10 balance refresh jobs concurrently
})
export class TrueLayerBalanceRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(TrueLayerBalanceRefreshProcessor.name);

  constructor(
    private readonly trueLayerBankingService: TrueLayerBankingService,
  ) {
    super();
  }

  async process(
    job: Job<TrueLayerBalanceRefreshJobData>,
  ): Promise<TrueLayerBalanceRefreshJobResult> {
    const { orgId, userId, connectionId } = job.data;

    this.logger.log(
      `Processing balance refresh for connection ${connectionId} (job ${job.id})`,
    );

    const startTime = Date.now();

    try {
      const accounts = await this.trueLayerBankingService.refreshAccountBalances(
        orgId,
        userId,
        connectionId,
      );

      return {
        success: true,
        accountsRefreshed: accounts.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Balance refresh job failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<TrueLayerBalanceRefreshJobData, TrueLayerBalanceRefreshJobResult>) {
    const { result } = job;
    this.logger.log(
      `Balance refresh job ${job.id} completed: ${result.accountsRefreshed} accounts refreshed (${result.duration}ms)`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TrueLayerBalanceRefreshJobData>, error: Error) {
    this.logger.error(
      `Balance refresh job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job<TrueLayerBalanceRefreshJobData>) {
    this.logger.debug(`Balance refresh job ${job.id} started`);
  }
}

/**
 * TrueLayer Balance Refresh Job Data
 */
export interface TrueLayerBalanceRefreshJobData {
  orgId: string;
  userId: string;
  connectionId: string;
}

/**
 * TrueLayer Balance Refresh Job Result
 */
export interface TrueLayerBalanceRefreshJobResult {
  success: boolean;
  accountsRefreshed: number;
  duration: number;
}
