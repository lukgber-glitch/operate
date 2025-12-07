import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';

/**
 * Queue Board Module
 * Provides a web-based dashboard for monitoring Bull queues
 *
 * Features:
 * - Real-time queue monitoring
 * - Job details and logs
 * - Retry failed jobs
 * - Clean completed/failed jobs
 * - Pause/resume queues
 *
 * Access: /admin/queues
 * Authentication: Required (see QueueBoardAuthMiddleware)
 */
@Module({
  imports: [
    // Configure Bull Board with Express adapter
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),

    // Email and Document Processing Queues
    BullBoardModule.forFeature({
      name: 'email-sync',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'attachment-processing',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'invoice-extraction',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'receipt-extraction',
      adapter: BullAdapter,
    }),

    // Banking Queues
    BullBoardModule.forFeature({
      name: 'bank-import',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'truelayer-sync',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'truelayer-balance',
      adapter: BullAdapter,
    }),

    // Finance Queues
    BullBoardModule.forFeature({
      name: 'payment-reminders',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'bill-reminders',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'recurring-invoices',
      adapter: BullAdapter,
    }),

    // Tax and Compliance Queues
    BullBoardModule.forFeature({
      name: 'deadline-check',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'deadline-reminder',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'retention-check',
      adapter: BullAdapter,
    }),

    // Reporting and Export Queues
    BullBoardModule.forFeature({
      name: 'scheduled-reports',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'export-scheduler',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'mrr-snapshot',
      adapter: BullAdapter,
    }),

    // Subscription and Usage Queues
    BullBoardModule.forFeature({
      name: 'subscription-usage-tracking',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'usage-aggregation',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'usage-stripe-report',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'dunning-retry',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'dunning-escalate',
      adapter: BullAdapter,
    }),

    // Utility Queues
    BullBoardModule.forFeature({
      name: 'exchange-rate-refresh',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'search-indexing',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'client-insights',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'xero-sync',
      adapter: BullAdapter,
    }),
  ],
})
export class QueueBoardModule {}
