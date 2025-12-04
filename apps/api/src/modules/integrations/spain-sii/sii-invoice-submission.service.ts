import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../cache/redis.service';
import { SiiBookType, SII_CACHE_TTL } from './constants/sii.constants';
import {
  SiiIssuedInvoice,
  SiiReceivedInvoice,
  SiiParty,
  SiiPaymentRecord,
} from './interfaces/sii-invoice.interface';
import {
  SiiInvoiceSubmissionResponse,
  SiiSubmissionStatus,
  CachedSiiSubmission,
} from './interfaces/sii-response.interface';
import { SiiXmlBuilderService } from './sii-xml-builder.service';
import { SiiSoapClient } from './sii-soap.client';
import { SiiErrorHandlerService } from './sii-error-handler.service';
import { SiiBooksService } from './sii-books.service';

/**
 * SII Invoice Submission Service
 * Main service for submitting invoices to SII
 */
@Injectable()
export class SiiInvoiceSubmissionService {
  private readonly logger = new Logger(SiiInvoiceSubmissionService.name);
  private readonly cachePrefix = 'sii';

  constructor(
    private readonly xmlBuilder: SiiXmlBuilderService,
    private readonly soapClient: SiiSoapClient,
    private readonly errorHandler: SiiErrorHandlerService,
    private readonly booksService: SiiBooksService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Submit issued invoices
   */
  async submitIssuedInvoices(
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiIssuedInvoice[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    try {
      this.logger.log(
        `Submitting ${invoices.length} issued invoices for ${holder.nif}`,
      );

      // Validate all invoices
      invoices.forEach((invoice) => {
        this.errorHandler.validateInvoice(invoice);
      });

      // Group invoices by book type
      const standardInvoices = invoices.filter(
        (inv) => !inv.invoiceId.invoiceType.startsWith('R'),
      );
      const rectifications = invoices.filter(
        (inv) =>
          inv.invoiceId.invoiceType.startsWith('R') && inv.rectification,
      );

      const results: SiiInvoiceSubmissionResponse[] = [];

      // Submit standard invoices to A1
      if (standardInvoices.length > 0) {
        const result = await this.booksService.submitIssuedInvoices(
          SiiBookType.A1_ISSUED,
          holder,
          fiscalYear,
          period,
          standardInvoices,
          certificate,
          certificateKey,
          certificatePassword,
        );
        results.push(result);
      }

      // Submit rectifications to A2
      if (rectifications.length > 0) {
        const result = await this.booksService.submitIssuedRectifications(
          SiiBookType.A2_RECTIFICATIONS,
          holder,
          fiscalYear,
          period,
          rectifications,
          certificate,
          certificateKey,
          certificatePassword,
        );
        results.push(result);
      }

      // Combine results
      const combinedResult = this.combineSubmissionResults(results);

      // Cache submission
      await this.cacheSubmission(combinedResult);

      // Log audit trail
      await this.logSubmission(holder, 'ISSUED_INVOICES', combinedResult);

      return combinedResult;
    } catch (error) {
      this.logger.error(
        `Failed to submit issued invoices: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Submit received invoices
   */
  async submitReceivedInvoices(
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiReceivedInvoice[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    try {
      this.logger.log(
        `Submitting ${invoices.length} received invoices for ${holder.nif}`,
      );

      // Validate all invoices
      invoices.forEach((invoice) => {
        this.errorHandler.validateInvoice(invoice);
      });

      // Group invoices by book type
      const standardInvoices = invoices.filter(
        (inv) => !inv.isIntracommunity && !inv.isImport && !inv.rectification,
      );
      const corrections = invoices.filter((inv) => inv.rectification);
      const intracommunity = invoices.filter((inv) => inv.isIntracommunity);
      const imports = invoices.filter((inv) => inv.isImport);

      const results: SiiInvoiceSubmissionResponse[] = [];

      // Submit to appropriate books
      if (standardInvoices.length > 0) {
        const result = await this.booksService.submitReceivedInvoices(
          SiiBookType.B1_RECEIVED,
          holder,
          fiscalYear,
          period,
          standardInvoices,
          certificate,
          certificateKey,
          certificatePassword,
        );
        results.push(result);
      }

      if (corrections.length > 0) {
        const result = await this.booksService.submitReceivedCorrections(
          SiiBookType.B2_CORRECTIONS,
          holder,
          fiscalYear,
          period,
          corrections,
          certificate,
          certificateKey,
          certificatePassword,
        );
        results.push(result);
      }

      if (intracommunity.length > 0) {
        const result = await this.booksService.submitIntracommunityAcquisitions(
          SiiBookType.B3_INTRACOMMUNITY,
          holder,
          fiscalYear,
          period,
          intracommunity,
          certificate,
          certificateKey,
          certificatePassword,
        );
        results.push(result);
      }

      if (imports.length > 0) {
        const result = await this.booksService.submitImports(
          SiiBookType.B4_IMPORT_VAT,
          holder,
          fiscalYear,
          period,
          imports,
          certificate,
          certificateKey,
          certificatePassword,
        );
        results.push(result);
      }

      // Combine results
      const combinedResult = this.combineSubmissionResults(results);

      // Cache submission
      await this.cacheSubmission(combinedResult);

      // Log audit trail
      await this.logSubmission(holder, 'RECEIVED_INVOICES', combinedResult);

      return combinedResult;
    } catch (error) {
      this.logger.error(
        `Failed to submit received invoices: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Submit payment/collection records
   */
  async submitPayments(
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    payments: SiiPaymentRecord[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    try {
      this.logger.log(
        `Submitting ${payments.length} payment records for ${holder.nif}`,
      );

      const soapEnvelope = this.xmlBuilder.buildPaymentRequest(
        holder,
        fiscalYear,
        period,
        payments,
      );

      const xmlResponse = await this.soapClient.submitPayments(
        soapEnvelope,
        certificate,
        certificateKey,
        certificatePassword,
      );

      const result = this.parseSubmissionResponse(xmlResponse);

      // Cache submission
      await this.cacheSubmission(result);

      // Log audit trail
      await this.logSubmission(holder, 'PAYMENTS', result);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to submit payments: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get submission status from cache
   */
  async getSubmissionStatus(
    submissionId: string,
  ): Promise<CachedSiiSubmission | null> {
    const cacheKey = `${this.cachePrefix}:submission:${submissionId}`;
    return await this.redisService.get<CachedSiiSubmission>(cacheKey);
  }

  /**
   * Combine multiple submission results
   */
  private combineSubmissionResults(
    results: SiiInvoiceSubmissionResponse[],
  ): SiiInvoiceSubmissionResponse {
    if (results.length === 0) {
      return {
        success: false,
        timestamp: new Date(),
        errorMessage: 'No submissions to process',
      };
    }

    if (results.length === 1) {
      return results[0];
    }

    const allSuccess = results.every((r) => r.success);
    const totalAccepted = results.reduce(
      (sum, r) => sum + (r.acceptedCount || 0),
      0,
    );
    const totalRejected = results.reduce(
      (sum, r) => sum + (r.rejectedCount || 0),
      0,
    );

    return {
      success: allSuccess,
      timestamp: new Date(),
      submissionId: results[0].submissionId,
      acceptedCount: totalAccepted,
      rejectedCount: totalRejected,
      invoiceResults: results.flatMap((r) => r.invoiceResults || []),
    };
  }

  /**
   * Cache submission for later retrieval
   */
  private async cacheSubmission(
    result: SiiInvoiceSubmissionResponse,
  ): Promise<void> {
    if (!result.submissionId) {
      return;
    }

    const cached: CachedSiiSubmission = {
      submissionId: result.submissionId,
      status: result.success
        ? SiiSubmissionStatus.ACCEPTED
        : SiiSubmissionStatus.REJECTED,
      submittedAt: result.timestamp.toISOString(),
      processedAt: result.timestamp.toISOString(),
      csvReference: result.csvReference,
      invoiceCount: (result.acceptedCount || 0) + (result.rejectedCount || 0),
      acceptedCount: result.acceptedCount || 0,
      rejectedCount: result.rejectedCount || 0,
      expiresAt: new Date(
        Date.now() + SII_CACHE_TTL.SUBMISSION_STATUS * 1000,
      ).toISOString(),
    };

    const cacheKey = `${this.cachePrefix}:submission:${result.submissionId}`;
    await this.redisService.set(
      cacheKey,
      cached,
      SII_CACHE_TTL.SUBMISSION_STATUS,
    );

    this.logger.debug(`Cached submission ${result.submissionId}`);
  }

  /**
   * Log submission to audit trail
   */
  private async logSubmission(
    holder: SiiParty,
    type: string,
    result: SiiInvoiceSubmissionResponse,
  ): Promise<void> {
    const logEntry = {
      type,
      holder: holder.nif,
      submissionId: result.submissionId,
      success: result.success,
      acceptedCount: result.acceptedCount,
      rejectedCount: result.rejectedCount,
      timestamp: result.timestamp.toISOString(),
    };

    const logKey = `${this.cachePrefix}:audit:${result.submissionId || Date.now()}`;
    await this.redisService.set(logKey, logEntry, 365 * 24 * 60 * 60); // 1 year

    this.logger.log(`Audit log created: ${JSON.stringify(logEntry)}`);
  }

  /**
   * Parse submission response (simplified)
   */
  private parseSubmissionResponse(
    xmlResponse: string,
  ): SiiInvoiceSubmissionResponse {
    // This is a simplified implementation
    // In production, use proper XML parsing library (xml2js, fast-xml-parser, etc.)
    const isSuccess = !xmlResponse.includes('soap:Fault');

    if (isSuccess) {
      return {
        success: true,
        timestamp: new Date(),
        submissionId: `SII-${Date.now()}`,
        acceptedCount: 1,
        rejectedCount: 0,
        csvReference: `CSV-${Date.now()}`,
      };
    }

    return {
      success: false,
      timestamp: new Date(),
      errorCode: '5003',
      errorMessage: 'Submission failed',
    };
  }
}
