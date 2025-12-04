import { Module } from '@nestjs/common';
import { ZugferdService } from './services/zugferd.service';
import { XRechnungService } from './services/xrechnung.service';
import { EInvoiceValidationService } from './services/e-invoice-validation.service';

/**
 * E-Invoice Module
 *
 * Provides electronic invoice generation and processing capabilities
 * for European standards including:
 * - ZUGFeRD/Factur-X (hybrid PDF+XML)
 * - XRechnung (German B2G standard)
 * - EN16931 compliance
 * - Unified validation across all formats
 * - Business rule checking (BR-01 to BR-65, BR-DE, BR-AT)
 *
 * Supports multiple invoice profiles from minimal to extended
 * data requirements for various business scenarios.
 */
@Module({
  providers: [ZugferdService, XRechnungService, EInvoiceValidationService],
  exports: [ZugferdService, XRechnungService, EInvoiceValidationService],
})
export class EInvoiceModule {}
