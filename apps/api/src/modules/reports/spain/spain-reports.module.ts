/**
 * Spain Reports Module
 * Provides Spanish tax report generation and management
 * Task: W25-T4
 */

import { Module } from '@nestjs/common';
import { SpainReportsService } from './spain-reports.service';
import { Modelo303Service } from './modelo-303.service';
import { SpainReportCalculatorService } from './spain-report-calculator.service';
import { SpainReportXmlGeneratorService } from './spain-report-xml-generator.service';
import { SpainReportPdfGeneratorService } from './spain-report-pdf-generator.service';
import { DatabaseModule } from '../../database/database.module';
import { SiiModule } from '../../integrations/spain-sii/sii.module';

/**
 * Spain Reports Module
 *
 * Provides comprehensive Spanish tax report generation including:
 * - Modelo 303: Quarterly VAT declaration
 * - Modelo 390: Annual VAT summary
 * - Modelo 111: Withholding tax declaration
 * - Modelo 347: Third-party operations
 *
 * Features:
 * - Automatic calculation from invoice/expense data
 * - PDF preview generation
 * - AEAT-compatible XML export
 * - SII integration for pre-filled data
 * - Validation and deadline tracking
 */
@Module({
  imports: [DatabaseModule, SiiModule],
  providers: [
    SpainReportsService,
    Modelo303Service,
    SpainReportCalculatorService,
    SpainReportXmlGeneratorService,
    SpainReportPdfGeneratorService,
  ],
  exports: [
    SpainReportsService,
    Modelo303Service,
  ],
})
export class SpainReportsModule {}
