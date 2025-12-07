import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@/modules/database/database.module';
import { KeyManagementService } from '@/modules/security/key-management.service';
import { ZatcaCertificateService } from './zatca-certificate.service';
import { ZatcaCsrService } from './zatca-csr.service';
import { ZatcaAuditService } from './zatca-audit.service';
import { ZatcaCertificateValidator } from './zatca-certificate-validator';
import { ZatcaCertificateRotationService } from './zatca-certificate-rotation.service';
import { ZatcaSigningService } from './zatca-signing.service';

/**
 * ZATCA Module
 *
 * Provides Saudi Arabia ZATCA (Zakat, Tax and Customs Authority) e-invoicing integration
 * Features:
 * - Certificate management (CSID)
 * - Invoice signing
 * - Certificate rotation and monitoring
 * - Audit logging
 */
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
  ],
  providers: [
    KeyManagementService,
    ZatcaCertificateService,
    ZatcaCsrService,
    ZatcaAuditService,
    ZatcaCertificateValidator,
    ZatcaCertificateRotationService,
    ZatcaSigningService,
  ],
  exports: [
    ZatcaCertificateService,
    ZatcaSigningService,
    ZatcaCertificateRotationService,
    ZatcaAuditService,
  ],
})
export class ZatcaModule {}
