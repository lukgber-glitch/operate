import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../../database/database.module';
import { ElsterCertificateService } from './services/elster-certificate.service';
import { ElsterVatService } from './services/elster-vat.service';
import { ElsterStatusService } from './services/elster-status.service';
import { ElsterResponseParserService } from './services/elster-response-parser.service';
import { StatusSchedulerService } from './jobs/status-scheduler.service';

/**
 * ELSTER Integration Module
 *
 * Provides certificate management, VAT filing, and status tracking capabilities
 * for the German ELSTER tax filing system.
 *
 * Features:
 * - Secure certificate storage with AES-256-GCM encryption
 * - Certificate lifecycle management
 * - VAT return (UStVA) submission via tigerVAT
 * - Automatic VAT calculation from invoices
 * - Filing history and status tracking
 * - Response parsing and error handling
 * - Real-time status updates via polling and webhooks
 * - Automatic notifications on status changes
 * - Background job scheduling for status checks
 * - Expiry monitoring and notifications
 * - Comprehensive audit logging
 *
 * Environment Variables Required:
 * - ELSTER_CERT_ENCRYPTION_KEY: Master encryption key (min 32 chars)
 * - TIGERVAT_BASE_URL: tigerVAT API base URL
 * - TIGERVAT_API_KEY: tigerVAT API key
 * - TIGERVAT_TEST_MODE: Enable test mode (default: false)
 * - ELSTER_POLLING_ENABLED: Enable status polling (default: true)
 * - ELSTER_POLLING_INTERVAL_MS: Polling interval in ms (default: 300000 = 5min)
 */
@Module({
  imports: [ConfigModule, HttpModule, DatabaseModule, ScheduleModule.forRoot()],
  providers: [
    ElsterCertificateService,
    ElsterVatService,
    ElsterStatusService,
    ElsterResponseParserService,
    StatusSchedulerService,
  ],
  exports: [
    ElsterCertificateService,
    ElsterVatService,
    ElsterStatusService,
    ElsterResponseParserService,
  ],
})
export class ElsterModule {}
