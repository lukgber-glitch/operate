import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InvoiceNowService } from './invoice-now.service';
import { InvoiceNowController } from './invoice-now.controller';
import { InvoiceNowPeppolClient } from './invoice-now-peppol.client';
import { InvoiceNowMapper } from './invoice-now.mapper';
import { InvoiceNowUenValidator } from './invoice-now-uen.validator';
import { PeppolModule } from '../peppol/peppol.module';
import { DatabaseModule } from '../../database/database.module';

/**
 * InvoiceNow Integration Module
 * Singapore's nationwide e-invoicing network integration
 *
 * Features:
 * - Peppol BIS Billing 3.0 (PINT-SG) support
 * - Singapore UEN validation
 * - GST registration number validation
 * - Invoice send/receive via Peppol AS4
 * - Document type support (Invoice, Credit Note, Debit Note)
 * - PayNow payment means support
 * - IMDA compliance
 *
 * Standards:
 * - Peppol BIS Billing 3.0
 * - PINT-SG (Peppol International Model - Singapore)
 * - UBL 2.1
 * - AS4 Profile (CEF eDelivery)
 * - ISO/IEC 6523 (Participant ID: 0195 for Singapore UEN)
 *
 * Regulatory Compliance:
 * - IMDA (Info-communications Media Development Authority)
 * - ACRA (Accounting and Corporate Regulatory Authority) UEN format
 * - IRAS (Inland Revenue Authority of Singapore) GST requirements
 */
@Module({
  imports: [ConfigModule, DatabaseModule, PeppolModule],
  providers: [
    InvoiceNowService,
    InvoiceNowPeppolClient,
    InvoiceNowMapper,
    InvoiceNowUenValidator,
  ],
  controllers: [InvoiceNowController],
  exports: [InvoiceNowService],
})
export class InvoiceNowModule {}
