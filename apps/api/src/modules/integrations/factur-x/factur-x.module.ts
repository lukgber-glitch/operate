import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FacturXService } from './factur-x.service';
import { FacturXController } from './factur-x.controller';
import { FacturXGeneratorService } from './services/factur-x-generator.service';
import { FacturXParserService } from './services/factur-x-parser.service';
import { FacturXValidatorService } from './services/factur-x-validator.service';
import { FacturXPdfService } from './services/factur-x-pdf.service';
import { DatabaseModule } from '../../database/database.module';
import { PeppolModule } from '../peppol/peppol.module';
import { EInvoiceModule } from '../../e-invoice/e-invoice.module';

/**
 * Factur-X Integration Module (France)
 *
 * Provides French electronic invoicing capabilities using the Factur-X standard.
 *
 * Features:
 * - Factur-X invoice generation (PDF/A-3 + XML)
 * - EN 16931 compliance (European e-invoicing standard)
 * - Cross Industry Invoice (CII) D16B format
 * - PDF/A-3 generation with embedded XML
 * - French-specific validations (SIRET, TVA)
 * - Support for all Factur-X profiles (MINIMUM, BASIC, EN16931, EXTENDED)
 * - Peppol integration for B2B transmission
 * - Chorus Pro support (French B2G) - ready
 * - Invoice parsing and validation
 *
 * Profiles:
 * - MINIMUM: Basic payment information only
 * - BASIC_WL: Basic without line items
 * - BASIC: Standard invoices with line items
 * - EN16931: Full European standard (recommended)
 * - EXTENDED: Extended information
 *
 * Standards Compliance:
 * - EN 16931-1:2017 (European e-invoicing semantic model)
 * - UN/CEFACT Cross Industry Invoice D16B
 * - PDF/A-3 (ISO 19005-3)
 * - French tax regulations (Code Général des Impôts)
 * - SIRET/SIREN validation
 * - French VAT (TVA) validation
 *
 * Integration:
 * - Peppol network for cross-border B2B invoicing
 * - Chorus Pro for French public sector (B2G)
 * - Compatible with ZUGFeRD (German standard)
 *
 * French Legal Requirements:
 * - SIRET number validation (14 digits with Luhn)
 * - TVA intracommunautaire validation
 * - Mandatory legal mentions (RCS, capital social)
 * - French VAT rates (20%, 10%, 5.5%, 2.1%)
 * - Payment terms and late payment penalties
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PeppolModule,
    EInvoiceModule,
  ],
  providers: [
    FacturXGeneratorService,
    FacturXParserService,
    FacturXValidatorService,
    FacturXPdfService,
    FacturXService,
  ],
  controllers: [FacturXController],
  exports: [FacturXService],
})
export class FacturXModule {}
