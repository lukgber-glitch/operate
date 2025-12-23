/**
 * MRR Snapshot Job Processor
 * Daily job to calculate and store MRR snapshots for historical tracking
 *
 * Schedule: Runs daily at end of day (11:59 PM)
 * Purpose: Creates permanent records of MRR movements for reporting and analytics
 */

import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/modules/database/prisma.service';
import { RevenueRecognitionService } from '../revenue-recognition.service';
import { Decimal } from '@prisma/client/runtime/library';

export const MRR_SNAPSHOT_QUEUE = 'mrr-snapshot';

export interface MrrSnapshotJobData {
  type: 'daily_snapshot' | 'historical_backfill';
  date?: Date; // For historical backfills
  currency?: string;
  triggeredBy?: 'scheduler' | 'manual';
}

export interface MrrSnapshotJobResult {
  jobId: string;
  success: boolean;
  type: string;
  date: Date;
  currency: string;
  mrrCalculated: number;
  customersTracked: number;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  errorMessage?: string;
}

/**
 * MRR Snapshot Processor
 * Calculates and stores daily MRR snapshots
 */
@Processor(MRR_SNAPSHOT_QUEUE)
export class MrrSnapshotProcessor {
  private readonly logger = new Logger(MrrSnapshotProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly revenueRecognition: RevenueRecognitionService,
  ) {}

  /**
   * Process MRR snapshot job
   */
  @Process()
  async handleMrrSnapshot(
    job: Job<MrrSnapshotJobData>,
  ): Promise<MrrSnapshotJobResult> {
    const startedAt = new Date();

    this.logger.log(`Processing MRR snapshot job ${job.id}: ${job.data.type}`);

    try {
      const date = job.data.date || new Date();
      const currency = job.data.currency || 'EUR';

      let mrrCalculated = 0;
      let customersTracked = 0;

      switch (job.data.type) {
        case 'daily_snapshot':
          const result = await this.createDailySnapshot(date, currency);
          mrrCalculated = result.mrr;
          customersTracked = result.customers;
          break;

        case 'historical_backfill':
          const backfill = await this.backfillHistoricalData(date, currency);
          mrrCalculated = backfill.mrr;
          customersTracked = backfill.customers;
          break;

        default:
          throw new Error(`Unknown job type: ${job.data.type}`);
      }

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.log(
        `Successfully processed MRR snapshot in ${duration}ms: ${currency} ${mrrCalculated / 100} from ${customersTracked} customers`,
      );

      return {
        jobId: job.id?.toString() || 'unknown',
        success: true,
        type: job.data.type,
        date,
        currency,
        mrrCalculated,
        customersTracked,
        startedAt,
        completedAt,
        duration,
      };
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.error(
        `Failed to process MRR snapshot: ${error.message}`,
        error.stack,
      );

      return {
        jobId: job.id?.toString() || 'unknown',
        success: false,
        type: job.data.type,
        date: job.data.date || new Date(),
        currency: job.data.currency || 'EUR',
        mrrCalculated: 0,
        customersTracked: 0,
        startedAt,
        completedAt,
        duration,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Create daily MRR snapshot for current month
   */
  private async createDailySnapshot(
    date: Date,
    currency: string,
  ): Promise<{ mrr: number; customers: number }> {
    const month = this.getMonthStart(date);

    this.logger.debug(
      `Creating MRR snapshot for ${month.toISOString()} (${currency})`,
    );

    // Calculate MRR for the month
    const mrrBreakdown = await this.revenueRecognition.calculateMrr(
      month,
      currency,
    );

    // Store or update MRR movement record
    await this.prisma.mrrMovement.upsert({
      where: {
        month_currency: {
          month,
          currency,
        },
      },
      create: {
        month,
        currency,
        newMrr: new Decimal(mrrBreakdown.newMrr),
        expansionMrr: new Decimal(mrrBreakdown.expansionMrr),
        contractionMrr: new Decimal(mrrBreakdown.contractionMrr),
        churnMrr: new Decimal(mrrBreakdown.churnMrr),
        reactivationMrr: new Decimal(mrrBreakdown.reactivationMrr),
        netNewMrr: new Decimal(mrrBreakdown.netNewMrr),
        totalMrr: new Decimal(mrrBreakdown.totalMrr),
        customerCount: mrrBreakdown.customerCount,
        newCustomers: mrrBreakdown.newCustomers,
        churnedCustomers: mrrBreakdown.churnedCustomers,
      },
      update: {
        newMrr: new Decimal(mrrBreakdown.newMrr),
        expansionMrr: new Decimal(mrrBreakdown.expansionMrr),
        contractionMrr: new Decimal(mrrBreakdown.contractionMrr),
        churnMrr: new Decimal(mrrBreakdown.churnMrr),
        reactivationMrr: new Decimal(mrrBreakdown.reactivationMrr),
        netNewMrr: new Decimal(mrrBreakdown.netNewMrr),
        totalMrr: new Decimal(mrrBreakdown.totalMrr),
        customerCount: mrrBreakdown.customerCount,
        newCustomers: mrrBreakdown.newCustomers,
        churnedCustomers: mrrBreakdown.churnedCustomers,
        updatedAt: new Date(),
      },
    });

    // Update cohort data
    await this.updateCohortData(month, currency);

    return {
      mrr: Math.round(mrrBreakdown.totalMrr * 100),
      customers: mrrBreakdown.customerCount,
    };
  }

  /**
   * Backfill historical MRR data
   * Used for initial setup or data recovery
   */
  private async backfillHistoricalData(
    startDate: Date,
    currency: string,
  ): Promise<{ mrr: number; customers: number }> {
    const now = new Date();
    const months = this.getMonthsBetween(startDate, now);

    this.logger.log(
      `Backfilling historical MRR data: ${months.length} months from ${startDate.toISOString()}`,
    );

    let totalMrr = 0;
    let totalCustomers = 0;

    for (const month of months) {
      const result = await this.createDailySnapshot(month, currency);
      totalMrr = result.mrr; // Keep latest value
      totalCustomers = result.customers;

      // Small delay to avoid overwhelming the database
      await this.sleep(100);
    }

    this.logger.log(
      `Completed historical backfill: ${months.length} months processed`,
    );

    return {
      mrr: totalMrr,
      customers: totalCustomers,
    };
  }

  /**
   * Update cohort tracking data
   */
  private async updateCohortData(month: Date, currency: string): Promise<void> {
    this.logger.debug(`Updating cohort data for ${month.toISOString()}`);

    // Get all revenue recognition for this month
    const revenue = await this.prisma.revenueRecognition.findMany({
      where: {
        recognitionMonth: month,
        currency,
      },
    });

    // Group by organization
    const orgRevenue = new Map<string, number>();
    for (const record of revenue) {
      const current = orgRevenue.get(record.organisationId) || 0;
      orgRevenue.set(
        record.organisationId,
        current + record.recognizedAmount.toNumber(),
      );
    }

    // For each organization, find their cohort month (first revenue month)
    for (const [orgId, revenueAmount] of orgRevenue) {
      const firstRevenue = await this.prisma.revenueRecognition.findFirst({
        where: {
          organisationId: orgId,
          currency,
        },
        orderBy: {
          recognitionMonth: 'asc',
        },
      });

      if (!firstRevenue) continue;

      const cohortMonth = this.getMonthStart(firstRevenue.recognitionMonth);

      // Get all organizations in this cohort
      const cohortOrgs = await this.getCohortOrganizations(
        cohortMonth,
        currency,
      );
      const initialCount = cohortOrgs.size;
      const activeCount = cohortOrgs.has(orgId) ? cohortOrgs.size : cohortOrgs.size - 1;
      const churnedCount = initialCount - activeCount;
      const retentionRate =
        initialCount > 0 ? (activeCount / initialCount) * 100 : 0;

      // Calculate cohort MRR
      const cohortMrr = Array.from(cohortOrgs.values()).reduce(
        (sum, mrr) => sum + mrr,
        0,
      );

      // Upsert cohort record
      await this.prisma.revenueCohort.upsert({
        where: {
          cohortMonth_revenueMonth_currency: {
            cohortMonth,
            revenueMonth: month,
            currency,
          },
        },
        create: {
          cohortMonth,
          revenueMonth: month,
          currency,
          customerCount: initialCount,
          revenue: new Decimal(revenueAmount),
          mrr: new Decimal(cohortMrr),
          activeCustomers: activeCount,
          churnedCustomers: churnedCount,
          retentionRate: new Decimal(retentionRate.toFixed(2)),
        },
        update: {
          customerCount: initialCount,
          revenue: new Decimal(revenueAmount),
          mrr: new Decimal(cohortMrr),
          activeCustomers: activeCount,
          churnedCustomers: churnedCount,
          retentionRate: new Decimal(retentionRate.toFixed(2)),
          updatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Get all organizations in a cohort
   */
  private async getCohortOrganizations(
    cohortMonth: Date,
    currency: string,
  ): Promise<Map<string, number>> {
    const firstRevenue = await this.prisma.revenueRecognition.groupBy({
      by: ['organisationId'],
      where: {
        currency,
      },
      _min: {
        recognitionMonth: true,
      },
    });

    const cohortStart = this.getMonthStart(cohortMonth);
    const orgIds = firstRevenue
      .filter((r) => {
        const firstMonth = this.getMonthStart(r._min.recognitionMonth!);
        return firstMonth.getTime() === cohortStart.getTime();
      })
      .map((r) => r.organisationId);

    // Get current MRR for each org
    const orgs = new Map<string, number>();
    for (const orgId of orgIds) {
      const latestRevenue = await this.prisma.revenueRecognition.findMany({
        where: {
          organisationId: orgId,
          currency,
        },
        orderBy: {
          recognitionMonth: 'desc',
        },
        take: 1,
      });

      if (latestRevenue.length > 0) {
        orgs.set(orgId, latestRevenue[0].recognizedAmount.toNumber());
      }
    }

    return orgs;
  }

  /**
   * Hook: Job became active
   */
  @OnQueueActive()
  onActive(job: Job<MrrSnapshotJobData>) {
    this.logger.debug(
      `Processing MRR snapshot job ${job.id} of type ${job.data.type}`,
    );
  }

  /**
   * Hook: Job completed successfully
   */
  @OnQueueCompleted()
  onComplete(job: Job<MrrSnapshotJobData>, result: MrrSnapshotJobResult) {
    this.logger.log(
      `MRR snapshot job ${job.id} completed in ${result.duration}ms: ${result.currency} ${result.mrrCalculated / 100}`,
    );
  }

  /**
   * Hook: Job failed
   */
  @OnQueueFailed()
  onError(job: Job<MrrSnapshotJobData>, error: Error) {
    this.logger.error(
      `MRR snapshot job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getMonthsBetween(start: Date, end: Date): Date[] {
    const months: Date[] = [];
    const current = this.getMonthStart(start);
    const endMonth = this.getMonthStart(end);

    while (current <= endMonth) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
