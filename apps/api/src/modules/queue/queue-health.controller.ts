import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@operate/database';

/**
 * Queue Health Data Transfer Object
 */
export interface QueueHealth {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  isPaused: boolean;
  lastJobTime?: Date;
}

/**
 * Queue Health Controller
 * Provides health monitoring and management endpoints for Bull queues
 *
 * Features:
 * - Queue health metrics
 * - Retry failed jobs
 * - Clean old jobs
 * - Pause/resume queues
 * - Get job details
 *
 * Authentication: Requires OWNER or ADMIN role
 */
@ApiTags('Queue Management')
@ApiBearerAuth()
@ApiSecurity('x-queue-admin-key')
@Controller('admin/queues')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN)
export class QueueHealthController {
  private readonly logger = new Logger(QueueHealthController.name);

  constructor(
    // Email and Document Processing Queues
    @InjectQueue('email-sync') private emailSyncQueue: Queue,
    @InjectQueue('attachment-processing') private attachmentQueue: Queue,
    @InjectQueue('invoice-extraction') private invoiceExtractionQueue: Queue,
    @InjectQueue('receipt-extraction') private receiptExtractionQueue: Queue,

    // Banking Queues
    @InjectQueue('bank-import') private bankImportQueue: Queue,
    @InjectQueue('truelayer-sync') private truelayerSyncQueue: Queue,
    @InjectQueue('truelayer-balance') private truelayerBalanceQueue: Queue,

    // Finance Queues
    @InjectQueue('payment-reminders') private paymentRemindersQueue: Queue,
    @InjectQueue('bill-reminders') private billRemindersQueue: Queue,
    @InjectQueue('recurring-invoices') private recurringInvoicesQueue: Queue,

    // Tax and Compliance Queues
    @InjectQueue('deadline-check') private deadlineCheckQueue: Queue,
    @InjectQueue('deadline-reminder') private deadlineReminderQueue: Queue,
    @InjectQueue('retention-check') private retentionCheckQueue: Queue,

    // Reporting and Export Queues
    @InjectQueue('scheduled-reports') private scheduledReportsQueue: Queue,
    @InjectQueue('export-scheduler') private exportSchedulerQueue: Queue,
    @InjectQueue('mrr-snapshot') private mrrSnapshotQueue: Queue,

    // Subscription and Usage Queues
    @InjectQueue('subscription-usage-tracking') private usageTrackingQueue: Queue,
    @InjectQueue('usage-aggregation') private usageAggregationQueue: Queue,
    @InjectQueue('usage-stripe-report') private usageStripeReportQueue: Queue,
    @InjectQueue('dunning-retry') private dunningRetryQueue: Queue,
    @InjectQueue('dunning-escalate') private dunningEscalateQueue: Queue,

    // Utility Queues
    @InjectQueue('exchange-rate-refresh') private exchangeRateQueue: Queue,
    @InjectQueue('search-indexing') private searchIndexingQueue: Queue,
    @InjectQueue('client-insights') private clientInsightsQueue: Queue,
    @InjectQueue('xero-sync') private xeroSyncQueue: Queue,
  ) {}

  /**
   * Get all queues mapped by name
   */
  private getAllQueues(): Map<string, Queue> {
    return new Map([
      // Email and Document Processing
      ['email-sync', this.emailSyncQueue],
      ['attachment-processing', this.attachmentQueue],
      ['invoice-extraction', this.invoiceExtractionQueue],
      ['receipt-extraction', this.receiptExtractionQueue],

      // Banking
      ['bank-import', this.bankImportQueue],
      ['truelayer-sync', this.truelayerSyncQueue],
      ['truelayer-balance', this.truelayerBalanceQueue],

      // Finance
      ['payment-reminders', this.paymentRemindersQueue],
      ['bill-reminders', this.billRemindersQueue],
      ['recurring-invoices', this.recurringInvoicesQueue],

      // Tax and Compliance
      ['deadline-check', this.deadlineCheckQueue],
      ['deadline-reminder', this.deadlineReminderQueue],
      ['retention-check', this.retentionCheckQueue],

      // Reporting and Export
      ['scheduled-reports', this.scheduledReportsQueue],
      ['export-scheduler', this.exportSchedulerQueue],
      ['mrr-snapshot', this.mrrSnapshotQueue],

      // Subscription and Usage
      ['subscription-usage-tracking', this.usageTrackingQueue],
      ['usage-aggregation', this.usageAggregationQueue],
      ['usage-stripe-report', this.usageStripeReportQueue],
      ['dunning-retry', this.dunningRetryQueue],
      ['dunning-escalate', this.dunningEscalateQueue],

      // Utility
      ['exchange-rate-refresh', this.exchangeRateQueue],
      ['search-indexing', this.searchIndexingQueue],
      ['client-insights', this.clientInsightsQueue],
      ['xero-sync', this.xeroSyncQueue],
    ]);
  }

  /**
   * Get queue by name
   */
  private getQueueByName(queueName: string): Queue {
    const queue = this.getAllQueues().get(queueName);
    if (!queue) {
      throw new HttpException(
        `Queue '${queueName}' not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return queue;
  }

  /**
   * Get last job completion time
   */
  private async getLastJobTime(queue: Queue): Promise<Date | undefined> {
    try {
      const completed = await queue.getCompleted(0, 0);
      if (completed.length > 0) {
        return new Date(completed[0].finishedOn || Date.now());
      }
    } catch (error) {
      this.logger.warn(`Failed to get last job time: ${error.message}`);
    }
    return undefined;
  }

  @Get('health')
  @ApiOperation({ summary: 'Get health status of all queues' })
  @ApiResponse({
    status: 200,
    description: 'Queue health metrics',
    type: [Object],
  })
  async getQueueHealth(): Promise<QueueHealth[]> {
    const queues = Array.from(this.getAllQueues().entries());
    const health: QueueHealth[] = [];

    for (const [name, queue] of queues) {
      try {
        const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
          queue.isPaused(),
        ]);

        health.push({
          name,
          waiting,
          active,
          completed,
          failed,
          delayed,
          paused: isPaused,
          isPaused,
          lastJobTime: await this.getLastJobTime(queue),
        });
      } catch (error) {
        this.logger.error(`Failed to get health for queue ${name}: ${error.message}`);
        health.push({
          name,
          waiting: -1,
          active: -1,
          completed: -1,
          failed: -1,
          delayed: -1,
          paused: false,
          isPaused: false,
        });
      }
    }

    return health;
  }

  @Post(':queueName/retry-failed')
  @ApiOperation({ summary: 'Retry all failed jobs in a queue' })
  @ApiParam({ name: 'queueName', description: 'Name of the queue' })
  @ApiResponse({
    status: 200,
    description: 'Number of jobs retried',
    schema: { example: { retriedCount: 5 } },
  })
  async retryFailed(@Param('queueName') queueName: string) {
    const queue = this.getQueueByName(queueName);
    const failedJobs = await queue.getFailed();

    let retriedCount = 0;
    for (const job of failedJobs) {
      try {
        await job.retry();
        retriedCount++;
      } catch (error) {
        this.logger.warn(`Failed to retry job ${job.id}: ${error.message}`);
      }
    }

    this.logger.log(`Retried ${retriedCount} failed jobs in queue ${queueName}`);
    return { retriedCount };
  }

  @Post(':queueName/clean')
  @ApiOperation({ summary: 'Clean old jobs from a queue' })
  @ApiParam({ name: 'queueName', description: 'Name of the queue' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['completed', 'failed'],
    description: 'Status of jobs to clean',
  })
  @ApiQuery({
    name: 'age',
    required: false,
    type: Number,
    description: 'Age in milliseconds (default: 86400000 = 24 hours)',
  })
  @ApiResponse({
    status: 200,
    description: 'Number of jobs cleaned',
    schema: { example: { cleanedCount: 10 } },
  })
  async cleanQueue(
    @Param('queueName') queueName: string,
    @Query('status') status: 'completed' | 'failed' = 'completed',
    @Query('age') age: number = 86400000, // 24 hours default
  ) {
    const queue = this.getQueueByName(queueName);
    const cleaned = await queue.clean(age, status);

    this.logger.log(
      `Cleaned ${cleaned.length} ${status} jobs from queue ${queueName} (age: ${age}ms)`,
    );
    return { cleanedCount: cleaned.length };
  }

  @Post(':queueName/pause')
  @ApiOperation({ summary: 'Pause a queue' })
  @ApiParam({ name: 'queueName', description: 'Name of the queue' })
  @ApiResponse({
    status: 200,
    description: 'Queue paused successfully',
    schema: { example: { paused: true } },
  })
  async pauseQueue(@Param('queueName') queueName: string) {
    const queue = this.getQueueByName(queueName);
    await queue.pause();

    this.logger.log(`Paused queue ${queueName}`);
    return { paused: true };
  }

  @Post(':queueName/resume')
  @ApiOperation({ summary: 'Resume a paused queue' })
  @ApiParam({ name: 'queueName', description: 'Name of the queue' })
  @ApiResponse({
    status: 200,
    description: 'Queue resumed successfully',
    schema: { example: { resumed: true } },
  })
  async resumeQueue(@Param('queueName') queueName: string) {
    const queue = this.getQueueByName(queueName);
    await queue.resume();

    this.logger.log(`Resumed queue ${queueName}`);
    return { resumed: true };
  }

  @Get(':queueName/stats')
  @ApiOperation({ summary: 'Get detailed statistics for a queue' })
  @ApiParam({ name: 'queueName', description: 'Name of the queue' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics',
  })
  async getQueueStats(@Param('queueName') queueName: string) {
    const queue = this.getQueueByName(queueName);

    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      isPaused,
      jobCounts,
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
      queue.getJobCounts(),
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      isPaused,
      jobCounts,
      lastJobTime: await this.getLastJobTime(queue),
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'List all available queues' })
  @ApiResponse({
    status: 200,
    description: 'List of queue names',
    schema: { example: { queues: ['email-sync', 'bank-import'] } },
  })
  async listQueues() {
    const queues = Array.from(this.getAllQueues().keys());
    return { queues };
  }
}
