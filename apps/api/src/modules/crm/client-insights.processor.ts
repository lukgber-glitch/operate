import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ClientInsightsService } from './client-insights.service';

export interface InsightsRecalculationJob {
  orgId: string;
  clientIds?: string[]; // Optional: specific clients to recalculate
  batchSize?: number; // Optional: number of clients per batch
}

@Processor('client-insights', {
  concurrency: 2, // Process 2 jobs simultaneously
})
export class ClientInsightsProcessor extends WorkerHost {
  private readonly logger = new Logger(ClientInsightsProcessor.name);

  constructor(
    private readonly clientInsightsService: ClientInsightsService,
  ) {
    super();
  }

  async process(
    job: Job<InsightsRecalculationJob>,
  ): Promise<{ processed: number; failed: number }> {
    const { orgId, clientIds, batchSize = 50 } = job.data;

    this.logger.log(
      `Starting insights recalculation for org ${orgId}. Job ID: ${job.id}`,
    );

    try {
      if (clientIds && clientIds.length > 0) {
        // Recalculate specific clients
        return await this.recalculateSpecificClients(
          orgId,
          clientIds,
          job,
          batchSize,
        );
      } else {
        // Recalculate all clients
        return await this.recalculateAllClients(orgId, job, batchSize);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process insights recalculation job ${job.id}:`,
        error,
      );
      throw error;
    }
  }

  private async recalculateSpecificClients(
    orgId: string,
    clientIds: string[],
    job: Job,
    batchSize: number,
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < clientIds.length; i += batchSize) {
      const batch = clientIds.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (clientId) => {
          try {
            await this.clientInsightsService.getClientInsights(clientId, orgId);
            processed++;

            // Update job progress
            const progress = Math.floor((processed / clientIds.length) * 100);
            await job.updateProgress(progress);
          } catch (error) {
            this.logger.error(
              `Failed to recalculate insights for client ${clientId}:`,
              error,
            );
            failed++;
          }
        }),
      );

      this.logger.log(
        `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clientIds.length / batchSize)}. ` +
          `Progress: ${processed}/${clientIds.length}`,
      );
    }

    return { processed, failed };
  }

  private async recalculateAllClients(
    orgId: string,
    job: Job,
    batchSize: number,
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    // Get all active client IDs first
    const clients = await this.prisma.client.findMany({
      where: { orgId, isActive: true },
      select: { id: true },
    });

    const totalClients = clients.length;
    this.logger.log(`Found ${totalClients} active clients to process`);

    // Process in batches
    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (client) => {
          try {
            await this.clientInsightsService.getClientInsights(
              client.id,
              orgId,
            );
            processed++;

            // Update job progress
            const progress = Math.floor((processed / totalClients) * 100);
            await job.updateProgress(progress);
          } catch (error) {
            this.logger.error(
              `Failed to recalculate insights for client ${client.id}:`,
              error,
            );
            failed++;
          }
        }),
      );

      this.logger.log(
        `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalClients / batchSize)}. ` +
          `Progress: ${processed}/${totalClients}`,
      );

      // Optional: Add a small delay between batches to avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return { processed, failed };
  }

  // Inject PrismaService for direct database access
  private get prisma() {
    // Access through the service's injected prisma instance
    return (this.clientInsightsService as any).prisma;
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name}. Data: ${JSON.stringify(job.data)}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: { processed: number; failed: number }) {
    this.logger.log(
      `Job ${job.id} completed. Processed: ${result.processed}, Failed: ${result.failed}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
  }
}

// ============================================================================
// QUEUE SERVICE (for enqueueing jobs)
// ============================================================================

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ClientInsightsQueueService {
  private readonly logger = new Logger(ClientInsightsQueueService.name);

  constructor(
    @InjectQueue('client-insights')
    private readonly insightsQueue: Queue<InsightsRecalculationJob>,
  ) {}

  /**
   * Schedule insights recalculation for all clients in an organization
   */
  async scheduleFullRecalculation(
    orgId: string,
    batchSize = 50,
  ): Promise<string> {
    const job = await this.insightsQueue.add(
      'recalculate-all',
      {
        orgId,
        batchSize,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    );

    this.logger.log(
      `Scheduled full insights recalculation for org ${orgId}. Job ID: ${job.id}`,
    );
    return job.id as string;
  }

  /**
   * Schedule insights recalculation for specific clients
   */
  async scheduleClientRecalculation(
    orgId: string,
    clientIds: string[],
    batchSize = 20,
  ): Promise<string> {
    const job = await this.insightsQueue.add(
      'recalculate-clients',
      {
        orgId,
        clientIds,
        batchSize,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    this.logger.log(
      `Scheduled insights recalculation for ${clientIds.length} clients in org ${orgId}. Job ID: ${job.id}`,
    );
    return job.id as string;
  }

  /**
   * Schedule daily recalculation as a recurring job
   */
  async scheduleDailyRecalculation(orgId: string): Promise<void> {
    await this.insightsQueue.add(
      'daily-recalculation',
      {
        orgId,
        batchSize: 100,
      },
      {
        repeat: {
          pattern: '0 2 * * *', // Every day at 2 AM
        },
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    );

    this.logger.log(
      `Scheduled daily insights recalculation for org ${orgId} at 2 AM`,
    );
  }

  /**
   * Get job status
   */
  async getJobStatus(
    jobId: string,
  ): Promise<{
    status: string;
    progress: number;
    result?: any;
    failedReason?: string;
  }> {
    const job = await this.insightsQueue.getJob(jobId);

    if (!job) {
      return { status: 'not_found', progress: 0 };
    }

    const state = await job.getState();
    const progress = job.progress || 0;

    return {
      status: state,
      progress: typeof progress === 'number' ? progress : 0,
      result: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.insightsQueue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.remove();
    this.logger.log(`Cancelled job ${jobId}`);
    return true;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.insightsQueue.getWaitingCount(),
      this.insightsQueue.getActiveCount(),
      this.insightsQueue.getCompletedCount(),
      this.insightsQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}
