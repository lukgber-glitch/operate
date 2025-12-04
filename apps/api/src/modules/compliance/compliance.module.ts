import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { GobdService } from './exports/gobd/gobd.service';
import { GobdBuilderService } from './exports/gobd/gobd-builder.service';
import { SaftService } from './exports/saft/saft.service';
import { SaftBuilderService } from './exports/saft/saft-builder.service';
import { DatevExportService } from './exports/datev/datev-export.service';
import { BmdExportService } from './exports/bmd/bmd-export.service';
import { ExportAccessGuard, RetentionPolicyGuard } from './guards/export-access.guard';
import { HashChainService } from './services/hash-chain.service';
import { DocumentArchiveService } from './services/document-archive.service';
import { RetentionPolicyService } from './services/retention-policy.service';
import { ProcessDocumentationService } from './services/process-documentation.service';
import { GoBDComplianceReportService } from './services/gobd-compliance-report.service';
import { RetentionCheckJobProcessor, RetentionCheckScheduler } from './jobs/retention-check.job';

/**
 * Compliance Module
 * Manages GoBD, SAF-T, and BMD compliance exports, document archiving, and retention policy enforcement
 *
 * Features:
 * - Create and manage compliance exports (GoBD, SAF-T, BMD)
 * - Schedule recurring exports
 * - Download and validate exports
 * - GoBD-compliant document archiving with encryption
 * - Retention policy enforcement (updated for 2025 regulations)
 * - Legal hold management
 * - Background job processing for automated retention checks
 * - Process documentation (Verfahrensdokumentation) generation
 * - GoBD compliance reporting
 * - BMD export for Austrian accounting software
 */
@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs for scheduled exports
    BullModule.registerQueue({
      name: 'retention-check',
    }),
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
    DatevExportService,
    BmdExportService,
    ExportAccessGuard,
    RetentionPolicyGuard,
    HashChainService,
    DocumentArchiveService,
    RetentionPolicyService,
    ProcessDocumentationService,
    GoBDComplianceReportService,
    RetentionCheckJobProcessor,
    RetentionCheckScheduler,
  ],
  exports: [
    ComplianceService,
    GobdService,
    SaftService,
    DatevExportService,
    BmdExportService,
    HashChainService,
    DocumentArchiveService,
    RetentionPolicyService,
    ProcessDocumentationService,
    GoBDComplianceReportService,
  ],
})
export class ComplianceModule {}
