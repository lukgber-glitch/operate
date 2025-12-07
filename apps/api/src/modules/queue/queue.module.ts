import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueBoardModule } from './queue-board.module';
import { QueueHealthController } from './queue-health.controller';
import { QueueMetricsService } from './queue-metrics.service';

/**
 * Queue Module
 * Central module for queue monitoring and management
 *
 * Features:
 * - Bull Board dashboard for visual monitoring
 * - Queue health API endpoints
 * - Automated metrics collection
 * - Queue management operations
 *
 * Includes:
 * - QueueBoardModule: Web dashboard at /admin/queues
 * - QueueHealthController: REST API for queue operations
 * - QueueMetricsService: Automated metrics collection
 *
 * Authentication:
 * - Requires OWNER or ADMIN role
 * - Or QUEUE_ADMIN_KEY header
 */
@Module({
  imports: [
    // Import all queue registrations needed for health monitoring
    BullModule.registerQueue(
      // Email and Document Processing
      { name: 'email-sync' },
      { name: 'attachment-processing' },
      { name: 'invoice-extraction' },
      { name: 'receipt-extraction' },

      // Banking
      { name: 'bank-import' },
      { name: 'truelayer-sync' },
      { name: 'truelayer-balance' },

      // Finance
      { name: 'payment-reminders' },
      { name: 'bill-reminders' },
      { name: 'recurring-invoices' },

      // Tax and Compliance
      { name: 'deadline-check' },
      { name: 'deadline-reminder' },
      { name: 'retention-check' },

      // Reporting and Export
      { name: 'scheduled-reports' },
      { name: 'export-scheduler' },
      { name: 'mrr-snapshot' },

      // Subscription and Usage
      { name: 'subscription-usage-tracking' },
      { name: 'usage-aggregation' },
      { name: 'usage-stripe-report' },
      { name: 'dunning-retry' },
      { name: 'dunning-escalate' },

      // Utility
      { name: 'exchange-rate-refresh' },
      { name: 'search-indexing' },
      { name: 'client-insights' },
      { name: 'xero-sync' },
    ),

    // JWT module for authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn', '1d'),
        },
      }),
      inject: [ConfigService],
    }),

    // Bull Board module for visual dashboard
    QueueBoardModule,
  ],
  controllers: [QueueHealthController],
  providers: [QueueMetricsService],
  exports: [QueueMetricsService],
})
export class QueueModule {}
