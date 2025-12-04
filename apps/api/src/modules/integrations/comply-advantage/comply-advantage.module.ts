import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplyAdvantageService } from './comply-advantage.service';
import { ComplyAdvantageController } from './comply-advantage.controller';
import { ComplyAdvantageWebhookController } from './comply-advantage-webhook.controller';
import { ScreeningService } from './services/screening.service';
import { MonitoringService } from './services/monitoring.service';
import { CaseManagementService } from './services/case-management.service';
import { DatabaseModule } from '../../database/database.module';

/**
 * ComplyAdvantage AML Integration Module
 * Provides comprehensive AML screening and monitoring capabilities
 *
 * Features:
 * - PEP (Politically Exposed Persons) screening
 * - Sanctions list screening (UN, OFAC, EU, UK)
 * - Watchlist screening
 * - Adverse media screening
 * - Ongoing monitoring with configurable frequency
 * - Alert case management workflow
 * - Webhook support for real-time updates
 * - AES-256-GCM encrypted credential storage
 * - Comprehensive audit logging
 */
@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [ComplyAdvantageController, ComplyAdvantageWebhookController],
  providers: [
    ComplyAdvantageService,
    ScreeningService,
    MonitoringService,
    CaseManagementService,
  ],
  exports: [ComplyAdvantageService],
})
export class ComplyAdvantageModule {}
