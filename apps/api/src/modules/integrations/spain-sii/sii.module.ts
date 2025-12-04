import { Module } from '@nestjs/common';
import { SiiService } from './sii.service';
import { SiiInvoiceSubmissionService } from './sii-invoice-submission.service';
import { SiiBooksService } from './sii-books.service';
import { SiiXmlBuilderService } from './sii-xml-builder.service';
import { SiiSoapClient } from './sii-soap.client';
import { SiiErrorHandlerService } from './sii-error-handler.service';
import { CacheModule } from '../../cache/cache.module';
import { DatabaseModule } from '../../database/database.module';

/**
 * Spain SII Integration Module
 * Provides integration with Spanish Tax Agency (AEAT) SII system
 *
 * Features:
 * - Real-time VAT reporting (invoices must be submitted within 4 days)
 * - SOAP/XML web services integration with AEAT
 * - Support for all SII book types:
 *   - A1: Issued invoices (Facturas Emitidas)
 *   - A2: Rectifications of issued invoices
 *   - A3: Assets register (Bienes de Inversión)
 *   - B1: Received invoices (Facturas Recibidas)
 *   - B2: Corrections of received invoices
 *   - B3: Intracommunity acquisitions
 *   - B4: Import VAT
 * - Certificate-based authentication (TLS 1.3)
 * - Retry logic with exponential backoff
 * - Comprehensive error handling for SII-specific error codes
 * - Redis caching for submission status
 * - Audit logging
 *
 * Environment Variables:
 * - SII_ENVIRONMENT: 'production' or 'test' (default: test)
 * - SII_TIMEOUT: Request timeout in ms (default: 60000)
 * - SII_CERTIFICATE_PATH: Path to Spanish digital certificate
 * - SII_CERTIFICATE_KEY_PATH: Path to certificate private key
 * - SII_CERTIFICATE_PASSWORD: Certificate password (if encrypted)
 *
 * SII Requirements:
 * - Spanish digital certificate (Certificado Digital)
 * - Valid NIF (Spanish tax ID)
 * - TLS 1.3 support
 * - Invoices must be submitted within 4 days of issue
 * - All amounts in EUR with 2 decimal places
 *
 * Supported Operations:
 * - Submit issued invoices
 * - Submit received invoices
 * - Submit payment/collection records
 * - Query invoices
 * - Delete/cancel invoices
 * - Get submission status
 *
 * @see https://www.agenciatributaria.es/AEAT.internet/SII.html
 */
@Module({
  imports: [CacheModule, DatabaseModule],
  providers: [
    SiiService,
    SiiInvoiceSubmissionService,
    SiiBooksService,
    SiiXmlBuilderService,
    SiiSoapClient,
    SiiErrorHandlerService,
  ],
  exports: [
    SiiService,
    SiiInvoiceSubmissionService,
    SiiBooksService,
    SiiXmlBuilderService,
    SiiSoapClient,
    SiiErrorHandlerService,
  ],
})
export class SiiModule {}
