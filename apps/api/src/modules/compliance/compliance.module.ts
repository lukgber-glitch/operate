import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { GobdService } from './exports/gobd/gobd.service';
import { GobdBuilderService } from './exports/gobd/gobd-builder.service';
import { SaftService } from './exports/saft/saft.service';
import { SaftBuilderService } from './exports/saft/saft-builder.service';
import { ExportAccessGuard, RetentionPolicyGuard } from './guards/export-access.guard';

/**
 * Compliance Module
 * Manages GoBD and SAF-T compliance exports, scheduling, and validation
 *
 * Features:
 * - Create and manage compliance exports (GoBD, SAF-T)
 * - Schedule recurring exports
 * - Download and validate exports
 * - Retention policy enforcement
 * - Background job processing
 */
@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs for scheduled exports
    ConfigModule,
    DatabaseModule,
  ],
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    GobdService,
    GobdBuilderService,
    SaftService,
    SaftBuilderService,
    ExportAccessGuard,
    RetentionPolicyGuard,
  ],
  exports: [ComplianceService, GobdService, SaftService],
})
export class ComplianceModule {}
