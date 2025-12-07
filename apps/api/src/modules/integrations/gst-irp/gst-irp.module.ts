/**
 * GST IRP Module
 *
 * NestJS module for India's GST Invoice Registration Portal integration
 * Provides e-invoicing functionality for B2B transactions
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/modules/database/database.module';
import { GstIrpClient } from './gst-irp.client';
import { GstIrpService } from './gst-irp.service';
import { GstIrpAuditService } from './gst-irp-audit.service';
import { GstIrpValidationService } from './utils/gst-irp-validation.service';

/**
 * GST IRP Module
 *
 * Features:
 * - IRN (Invoice Reference Number) generation
 * - E-invoice registration with IRP
 * - QR code generation
 * - IRN cancellation (within 24 hours)
 * - Bulk invoice processing
 * - Digital signature support (DSC)
 * - Audit logging
 * - Rate limiting compliance
 * - TLS 1.3 security
 *
 * Configuration (Environment Variables):
 * - GST_IRP_ENVIRONMENT: 'sandbox' | 'production'
 * - GST_IRP_GSTIN: Organization's GSTIN
 * - GST_IRP_USERNAME: GSP username
 * - GST_IRP_PASSWORD: GSP password
 * - GST_IRP_CLIENT_ID: GSP client ID
 * - GST_IRP_CLIENT_SECRET: GSP client secret
 * - GST_IRP_API_URL: (optional) Custom GSP API URL
 * - GST_IRP_CERTIFICATE_PATH: (optional) Path to digital signature certificate
 * - GST_IRP_CERTIFICATE_PASSWORD: (optional) Certificate password
 * - GST_IRP_TIMEOUT: (optional) Request timeout in ms
 * - GST_IRP_MAX_RETRIES: (optional) Maximum retry attempts
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
    DatabaseModule,
  ],
  providers: [
    GstIrpClient,
    GstIrpService,
    GstIrpAuditService,
    GstIrpValidationService,
  ],
  exports: [
    GstIrpService,
    GstIrpClient,
    GstIrpAuditService,
    GstIrpValidationService,
  ],
})
export class GstIrpModule {}
