import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';

/**
 * Queue Metrics Service
 * Collects and logs metrics for all Bull queues
 *
 * Features:
 * - Periodic metrics collection (every 5 minutes)
 * - High failure rate alerts
 * - Stalled job detection
 * - Queue health monitoring
 *
 * Metrics are logged in JSON format for external monitoring systems
 * (Grafana, CloudWatch, Datadog, etc.)
 */
@Injectable()
export class QueueMetricsService {
  private readonly logger = new Logger(QueueMetricsService.name);
  private readonly enabled: boolean;
  private readonly failureThreshold: number;

  constructor(
    private readonly configService: ConfigService,

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
  ) {
    this.enabled = this.configService.get<boolean>('QUEUE_METRICS_ENABLED', true);
    this.failureThreshold = this.configService.get<number>('QUEUE_FAILURE_THRESHOLD', 100);

    if (this.enabled) {
      this.logger.log('Queue metrics collection enabled');
    }
  }

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
   * Collect metrics for all queues
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectMetrics() {
    if (!this.enabled) {
      return;
    }

    const queues = Array.from(this.getAllQueues().entries());
    const timestamp = new Date().toISOString();

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

        // Log metrics in JSON format for external monitoring
        this.logger.log({
          type: 'queue_metrics',
          queue: name,
          waiting,
          active,
          completed,
          failed,
          delayed,
          isPaused,
          timestamp,
        });

        // Alert on high failure rate
        if (failed > this.failureThreshold) {
          this.logger.warn({
            type: 'queue_alert',
            level: 'warning',
            queue: name,
            message: `Queue ${name} has ${failed} failed jobs (threshold: ${this.failureThreshold})`,
            failed,
            threshold: this.failureThreshold,
            timestamp,
          });
        }

        // Alert on paused queues with waiting jobs
        if (isPaused && waiting > 0) {
          this.logger.warn({
            type: 'queue_alert',
            level: 'warning',
            queue: name,
            message: `Queue ${name} is paused with ${waiting} waiting jobs`,
            waiting,
            timestamp,
          });
        }

        // Alert on high active job count (possible stalled jobs)
        if (active > 50) {
          this.logger.warn({
            type: 'queue_alert',
            level: 'info',
            queue: name,
            message: `Queue ${name} has ${active} active jobs`,
            active,
            timestamp,
          });
        }
      } catch (error) {
        this.logger.error({
          type: 'queue_error',
          queue: name,
          message: `Failed to collect metrics for queue ${name}`,
          error: error.message,
          timestamp,
        });
      }
    }
  }

  /**
   * Get current metrics for a specific queue
   */
  async getQueueMetrics(queueName: string) {
    const queue = this.getAllQueues().get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed, isPaused, jobCounts] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
      queue.getJobCounts(),
    ]);

    return {
      queue: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      isPaused,
      jobCounts,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get metrics for all queues
   */
  async getAllMetrics() {
    const queues = Array.from(this.getAllQueues().keys());
    const metrics = await Promise.all(
      queues.map((name) => this.getQueueMetrics(name)),
    );
    return metrics;
  }

  /**
   * Get queue health summary
   */
  async getHealthSummary() {
    const metrics = await this.getAllMetrics();

    const summary = {
      totalQueues: metrics.length,
      totalWaiting: 0,
      totalActive: 0,
      totalCompleted: 0,
      totalFailed: 0,
      pausedQueues: 0,
      healthyQueues: 0,
      warningQueues: 0,
      criticalQueues: 0,
      timestamp: new Date().toISOString(),
    };

    for (const metric of metrics) {
      summary.totalWaiting += metric.waiting;
      summary.totalActive += metric.active;
      summary.totalCompleted += metric.completed;
      summary.totalFailed += metric.failed;

      if (metric.isPaused) {
        summary.pausedQueues++;
      }

      // Determine queue health
      if (metric.failed > this.failureThreshold) {
        summary.criticalQueues++;
      } else if (metric.failed > this.failureThreshold / 2 || metric.active > 50) {
        summary.warningQueues++;
      } else {
        summary.healthyQueues++;
      }
    }

    return summary;
  }
}
