import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DatabaseModule } from '../database/database.module';

/**
 * Dashboard Module
 * Provides dashboard widget endpoints for real-time business metrics
 *
 * Features:
 * - Cash flow summary (inflow vs outflow)
 * - Accounts receivable tracking
 * - Accounts payable tracking
 * - Cash runway calculation
 */
@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
