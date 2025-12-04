import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ElsterStatusService } from '../services/elster-status.service';
import { DEFAULT_POLLING_CONFIG } from '../types/elster-status.types';

/**
 * ELSTER Status Scheduler Service
 *
 * Periodically checks for pending filings and schedules status check jobs.
 *
 * Features:
 * - Runs every 5 minutes via cron
 * - Finds all pending filings
 * - Schedules status check jobs for each
 * - Handles rate limiting and backoff
 *
 * Cron: */5 * * * * (every 5 minutes)
 */
@Injectable()
export class StatusSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(StatusSchedulerService.name);
  private readonly enabled: boolean;
  private readonly intervalMs: number;

  constructor(
    private readonly statusService: ElsterStatusService,
    private readonly config: ConfigService,
  ) {
    this.enabled = this.config.get<boolean>('ELSTER_POLLING_ENABLED', true);
    this.intervalMs = this.config.get<number>(
      'ELSTER_POLLING_INTERVAL_MS',
      DEFAULT_POLLING_CONFIG.intervalMs,
    );
  }

  /**
   * Initialize scheduler on module start
   */
  onModuleInit() {
    if (this.enabled) {
      this.logger.log(
        `ELSTER status scheduler enabled (interval: ${this.intervalMs}ms)`,
      );
    } else {
      this.logger.warn('ELSTER status scheduler disabled');
    }
  }

  /**
   * Cron job to check pending filings every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkPendingFilings() {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Running scheduled status check for pending filings');

    try {
      const pendingFilings = await this.statusService.getPendingFilings();

      if (pendingFilings.length === 0) {
        this.logger.log('No pending filings to check');
        return;
      }

      this.logger.log(
        `Found ${pendingFilings.length} pending filings - scheduling status checks`,
      );

      // Schedule status check for each pending filing
      for (const filing of pendingFilings) {
        try {
          await this.statusService.scheduleStatusCheck(filing.id, 0); // Immediate check
          this.logger.debug(`Scheduled status check for filing ${filing.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to schedule status check for filing ${filing.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Scheduled status checks for ${pendingFilings.length} filings`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to check pending filings: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualCheck(): Promise<void> {
    this.logger.log('Manual status check triggered');
    await this.checkPendingFilings();
  }
}
