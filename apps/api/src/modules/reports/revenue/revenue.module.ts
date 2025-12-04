/**
 * Revenue Reports Module
 * Provides revenue recognition and SaaS metrics functionality
 *
 * Features:
 * - ASC 606 / IFRS 15 compliant revenue recognition
 * - MRR (Monthly Recurring Revenue) tracking
 * - ARR (Annual Recurring Revenue) calculation
 * - Churn and retention metrics
 * - Cohort analysis
 * - Revenue forecasting
 * - Deferred revenue scheduling
 * - Daily MRR snapshot jobs
 *
 * Dependencies:
 * - PrismaService for database access
 * - BullModule for job processing
 * - RbacModule for permissions
 *
 * Integration Points:
 * - Subscription billing events trigger revenue recognition
 * - Invoice creation triggers deferred revenue scheduling
 * - Daily cron job creates MRR snapshots
 *
 * Endpoints:
 * - GET /reports/revenue/mrr - Current MRR breakdown
 * - GET /reports/revenue/arr - Annual Recurring Revenue
 * - GET /reports/revenue/movement - MRR movement over time
 * - GET /reports/revenue/churn - Churn and retention metrics
 * - GET /reports/revenue/tiers - Revenue by subscription tier
 * - GET /reports/revenue/cohort - Cohort analysis
 * - GET /reports/revenue/deferred - Deferred revenue schedule
 * - GET /reports/revenue/forecast - Revenue forecast
 * - GET /reports/revenue/metrics/summary - Comprehensive metrics
 * - POST /reports/revenue/recognition - Create revenue entry
 * - POST /reports/revenue/deferred - Create deferred revenue
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RevenueController } from './revenue.controller';
import { RevenueRecognitionService } from './revenue-recognition.service';
import { RevenueReportsService } from './revenue-reports.service';
import { MrrSnapshotProcessor, MRR_SNAPSHOT_QUEUE } from './jobs/mrr-snapshot.processor';
import { RbacModule } from '../../auth/rbac/rbac.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    RbacModule,
    DatabaseModule,
    BullModule.registerQueue({
      name: MRR_SNAPSHOT_QUEUE,
    }),
  ],
  controllers: [RevenueController],
  providers: [
    RevenueRecognitionService,
    RevenueReportsService,
    MrrSnapshotProcessor,
  ],
  exports: [RevenueRecognitionService, RevenueReportsService],
})
export class RevenueModule {}
