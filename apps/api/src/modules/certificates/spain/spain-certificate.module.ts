import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@modules/database/database.module';
import { SpainCertificateService } from './spain-certificate.service';
import { CertificateStorageService } from './certificate-storage.service';
import { CertificateValidatorService } from './certificate-validator.service';
import { CertificateRotationService } from './certificate-rotation.service';

/**
 * Spanish SII Certificate Management Module
 *
 * Provides secure management of FNMT digital certificates for Spanish Tax Agency (AEAT) integration.
 *
 * Features:
 * - Secure certificate storage with AES-256-GCM encryption
 * - FNMT certificate validation
 * - Certificate rotation without downtime
 * - Expiry monitoring with cron jobs
 * - AEAT connectivity testing
 * - Comprehensive audit logging
 *
 * Environment Variables Required:
 * - SPAIN_SII_CERT_ENCRYPTION_KEY: Master key for certificate encryption (min 32 chars)
 *
 * Usage:
 * ```typescript
 * import { SpainCertificateModule } from '@modules/certificates/spain/spain-certificate.module';
 *
 * @Module({
 *   imports: [SpainCertificateModule],
 * })
 * export class MyModule {}
 * ```
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  providers: [
    SpainCertificateService,
    CertificateStorageService,
    CertificateValidatorService,
    CertificateRotationService,
  ],
  exports: [
    SpainCertificateService,
    CertificateStorageService,
    CertificateValidatorService,
    CertificateRotationService,
  ],
})
export class SpainCertificateModule {}
