import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GdprController } from './gdpr.controller';
import { GdprService } from './gdpr.service';
import { ConsentManagerService } from './services/consent-manager.service';
import { DataSubjectRequestService } from './services/data-subject-request.service';
import { DataRetentionService } from './services/data-retention.service';
import { DataPortabilityService } from './services/data-portability.service';
import { AnonymizationService } from './services/anonymization.service';
import { AuditTrailService } from './services/audit-trail.service';
import { DatabaseModule } from '../database/database.module';

/**
 * GDPR Module
 * Comprehensive GDPR compliance infrastructure
 *
 * Features:
 * - Consent Management (Article 7)
 * - Data Subject Requests (Articles 15-21)
 * - Data Retention Policies (Article 5)
 * - Data Portability (Article 20)
 * - Right to Erasure (Article 17)
 * - Audit Logging (Article 5 - Accountability)
 * - 30-day SLA tracking for DSRs
 * - Automated retention policy enforcement
 */
@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(), // For scheduled retention cleanup
  ],
  controllers: [GdprController],
  providers: [
    GdprService,
    ConsentManagerService,
    DataSubjectRequestService,
    DataRetentionService,
    DataPortabilityService,
    AnonymizationService,
    AuditTrailService,
  ],
  exports: [
    GdprService,
    ConsentManagerService,
    DataSubjectRequestService,
    DataRetentionService,
    DataPortabilityService,
    AnonymizationService,
    AuditTrailService,
  ],
})
export class GdprModule {}
