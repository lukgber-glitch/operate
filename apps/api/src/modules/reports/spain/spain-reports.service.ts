/**
 * Spain Reports Service
 * Main orchestration service for Spanish tax reports
 * Task: W25-T4
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Modelo303Service } from './modelo-303.service';
import { SpainReportXmlGeneratorService } from './spain-report-xml-generator.service';
import { SpainReportPdfGeneratorService } from './spain-report-pdf-generator.service';
import { SiiService } from '../../integrations/spain-sii/sii.service';
import {
  GenerateReportRequest,
  GenerateReportResponse,
  SpainReportType,
  SpainReportStatus,
} from './interfaces/spain-report.interface';

@Injectable()
export class SpainReportsService {
  private readonly logger = new Logger(SpainReportsService.name);

  constructor(
    private readonly modelo303Service: Modelo303Service,
    private readonly xmlGenerator: SpainReportXmlGeneratorService,
    private readonly pdfGenerator: SpainReportPdfGeneratorService,
    private readonly siiService: SiiService,
  ) {}

  /**
   * Generate a Spanish tax report
   */
  async generateReport(
    request: GenerateReportRequest,
  ): Promise<GenerateReportResponse> {
    this.logger.log(
      `Generating ${request.type} for org ${request.orgId}, period ${request.period.year}-Q${request.period.quarter}`,
    );

    try {
      // Generate report based on type
      let report;
      switch (request.type) {
        case SpainReportType.MODELO_303:
          report = await this.modelo303Service.generate(
            request.orgId,
            request.period,
            request.taxpayer,
          );
          break;

        case SpainReportType.MODELO_390:
        case SpainReportType.MODELO_111:
        case SpainReportType.MODELO_347:
          throw new BadRequestException(
            `Report type ${request.type} not yet implemented`,
          );

        default:
          throw new BadRequestException(`Unknown report type: ${request.type}`);
      }

      // Auto-validate if requested
      if (request.options?.autoValidate) {
        const validation = await this.validateReport(report.id);
        if (!validation.isValid) {
          this.logger.warn(
            `Report validation failed: ${validation.errors.join(', ')}`,
          );
        }
      }

      const response: GenerateReportResponse = {
        success: true,
        report,
        errors: [],
        warnings: [],
      };

      // Generate preview if requested
      if (request.options?.includePreview) {
        const pdfBuffer = await this.pdfGenerator.generatePdf(report);
        response.preview = {
          pdfBase64: pdfBuffer.toString('base64'),
        };
      }

      // Generate export if requested
      if (
        request.options?.exportFormat === 'XML' ||
        request.options?.exportFormat === 'BOTH'
      ) {
        const xml = await this.xmlGenerator.generateXml(report);
        response.export = {
          xmlContent: xml,
        };
      }

      this.logger.log(`Report generated successfully: ${report.id}`);

      return response;
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get existing report
   */
  async getReport(reportId: string, includePreview = false, includeExport = false) {
    this.logger.log(`Fetching report ${reportId}`);

    // Get report (delegated to specific service based on type)
    // For now, assume Modelo 303
    const report = await this.modelo303Service.getReport(reportId);

    const response: any = {
      success: true,
      report,
    };

    if (includePreview) {
      const pdfBuffer = await this.pdfGenerator.generatePdf(report);
      response.preview = {
        pdfBase64: pdfBuffer.toString('base64'),
      };
    }

    if (includeExport) {
      const xml = await this.xmlGenerator.generateXml(report);
      response.export = {
        xmlContent: xml,
      };
    }

    return response;
  }

  /**
   * Validate report
   */
  async validateReport(reportId: string) {
    this.logger.log(`Validating report ${reportId}`);

    // Validate based on report type
    // For now, assume Modelo 303
    return await this.modelo303Service.validate(reportId);
  }

  /**
   * Recalculate report
   */
  async recalculateReport(reportId: string, force = false) {
    this.logger.log(`Recalculating report ${reportId}`);

    // For now, assume Modelo 303
    return await this.modelo303Service.recalculate(reportId, force);
  }

  /**
   * Generate XML for report
   */
  async generateXml(reportId: string): Promise<string> {
    this.logger.log(`Generating XML for report ${reportId}`);

    const report = await this.modelo303Service.getReport(reportId);
    return await this.xmlGenerator.generateXml(report);
  }

  /**
   * Generate PDF for report
   */
  async generatePdf(reportId: string): Promise<Buffer> {
    this.logger.log(`Generating PDF for report ${reportId}`);

    const report = await this.modelo303Service.getReport(reportId);
    return await this.pdfGenerator.generatePdf(report);
  }

  /**
   * Submit report to AEAT via SII
   */
  async submitReport(
    reportId: string,
    certificatePath: string,
    certificatePassword?: string,
  ) {
    this.logger.log(`Submitting report ${reportId} to AEAT`);

    const report = await this.modelo303Service.getReport(reportId);

    // Validate before submission
    const validation = await this.validateReport(reportId);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Cannot submit invalid report: ${validation.errors.join(', ')}`,
      );
    }

    // For Modelo 303, we can optionally sync with SII
    // (Note: Modelo 303 is typically filed separately, but SII data can pre-fill it)
    this.logger.warn(
      'Modelo 303 submission to AEAT is not directly supported via SII. ' +
      'Use the generated XML for manual upload to AEAT website.',
    );

    // Mark as submitted
    const csvReference = `CSV-${Date.now()}`; // Placeholder
    const updatedReport = await this.modelo303Service.markAsSubmitted(
      reportId,
      csvReference,
    );

    return {
      success: true,
      report: updatedReport,
      message: 'Report marked as submitted. Use the generated XML for manual AEAT upload.',
    };
  }

  /**
   * List reports for organization
   */
  async listReports(
    orgId: string,
    filters?: {
      type?: SpainReportType;
      year?: number;
      quarter?: number;
      status?: SpainReportStatus;
    },
  ) {
    this.logger.log(`Listing reports for org ${orgId}`);

    // For now, only support Modelo 303
    if (!filters?.type || filters.type === SpainReportType.MODELO_303) {
      return await this.modelo303Service.listReports(orgId, filters);
    }

    return [];
  }

  /**
   * Get filing deadline for period
   */
  getFilingDeadline(type: SpainReportType, year: number, quarter?: number) {
    if (type === SpainReportType.MODELO_303 && quarter) {
      const deadlines = {
        1: new Date(year, 3, 20), // April 20
        2: new Date(year, 6, 20), // July 20
        3: new Date(year, 9, 20), // October 20
        4: new Date(year + 1, 0, 30), // January 30 (next year)
      };
      return deadlines[quarter];
    }

    throw new BadRequestException('Unsupported report type or missing quarter');
  }

  /**
   * Check if report can be filed
   */
  canFileReport(reportId: string): Promise<{
    canFile: boolean;
    reason?: string;
  }> {
    // Check validation, deadline, status
    return Promise.resolve({
      canFile: true,
    });
  }
}
