/**
 * GST IRP Service
 *
 * Business logic for India's e-invoicing system
 * Handles IRN generation, cancellation, and invoice management
 */

import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import * as QRCode from 'qrcode';
import {
  IrpEInvoiceRequest,
  IrpIrnResponse,
  IrpCancelRequest,
  IrpCancelResponse,
  IrpIrnDetailsResponse,
  IrnHashInput,
  IrpBulkRequest,
  IrpBulkResponse,
  ValidationResult,
  IrpQrCodeData,
  DocumentStatus,
} from './gst-irp.types';
import { GstIrpClient } from './gst-irp.client';
import {
  IRP_SANDBOX_ENDPOINTS,
  TIMEOUT_CONFIG,
  SCHEMA_VERSIONS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  VALIDATION_PATTERNS,
  CANCELLATION_REASONS,
  DATE_FORMATS,
  INVOICE_LIMITS,
  BATCH_LIMITS,
} from './gst-irp.constants';
import { GstIrpValidationService } from './utils/gst-irp-validation.service';
import { GstIrpAuditService } from './gst-irp-audit.service';

@Injectable()
export class GstIrpService {
  private readonly logger = new Logger(GstIrpService.name);

  constructor(
    private readonly client: GstIrpClient,
    private readonly validationService: GstIrpValidationService,
    private readonly auditService: GstIrpAuditService,
  ) {}

  /**
   * Generate IRN (Invoice Reference Number) for e-invoice
   */
  async generateIrn(invoiceData: IrpEInvoiceRequest): Promise<IrpIrnResponse> {
    this.logger.log(`Generating IRN for invoice: ${invoiceData.docDtls.no}`);

    try {
      // Validate invoice data
      const validation = this.validationService.validateInvoice(invoiceData);
      if (!validation.isValid) {
        const errors = validation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new Error(`Validation failed: ${errors}`);
      }

      // Set schema version if not provided
      if (!invoiceData.version) {
        invoiceData.version = SCHEMA_VERSIONS.CURRENT;
      }

      // Generate IRN hash
      const irnHash = this.generateIrnHash({
        supplyType: invoiceData.tranDtls.supTyp,
        documentType: invoiceData.docDtls.typ,
        documentNumber: invoiceData.docDtls.no,
        documentDate: invoiceData.docDtls.dt,
        sellerGstin: invoiceData.sellerDtls.gstin,
        buyerGstin: invoiceData.buyerDtls.gstin,
        totalInvoiceValue: invoiceData.valDtls.totInvVal,
      });

      this.logger.debug(`Generated IRN hash: ${irnHash}`);

      // Submit to IRP
      const response = await this.client.makeRequest<IrpIrnResponse>(
        'POST',
        IRP_SANDBOX_ENDPOINTS.GENERATE_IRN,
        invoiceData,
        TIMEOUT_CONFIG.GENERATE_IRN,
      );

      // Audit log
      await this.auditService.logOperation({
        operation: 'generate',
        gstin: invoiceData.sellerDtls.gstin,
        invoiceNo: invoiceData.docDtls.no,
        irn: response.irn,
        status: 'success',
        request: invoiceData,
        response,
      });

      this.logger.log(`IRN generated successfully: ${response.irn}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to generate IRN: ${error.message}`, error.stack);

      // Audit log failure
      await this.auditService.logOperation({
        operation: 'generate',
        gstin: invoiceData.sellerDtls.gstin,
        invoiceNo: invoiceData.docDtls.no,
        status: 'error',
        request: invoiceData,
        response: null,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Generate IRN hash (SHA-256)
   */
  generateIrnHash(input: IrnHashInput): string {
    // IRN format: SupplyType|DocType|DocNo|DocDate|SellerGSTIN|BuyerGSTIN|TotalInvoiceValue
    const dataString = [
      input.supplyType,
      input.documentType,
      input.documentNumber,
      input.documentDate,
      input.sellerGstin,
      input.buyerGstin,
      input.totalInvoiceValue.toFixed(2),
    ].join('|');

    return createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Cancel IRN within 24 hours
   */
  async cancelIrn(cancelRequest: IrpCancelRequest): Promise<IrpCancelResponse> {
    this.logger.log(`Cancelling IRN: ${cancelRequest.irn}`);

    try {
      // Validate IRN format
      if (!VALIDATION_PATTERNS.IRN.test(cancelRequest.irn)) {
        throw new Error(ERROR_MESSAGES.INVALID_IRN);
      }

      // Validate cancellation reason
      if (!Object.keys(CANCELLATION_REASONS).includes(cancelRequest.cnlRsn)) {
        throw new Error('Invalid cancellation reason code');
      }

      // Submit cancellation request
      const response = await this.client.makeRequest<IrpCancelResponse>(
        'POST',
        IRP_SANDBOX_ENDPOINTS.CANCEL_IRN,
        cancelRequest,
        TIMEOUT_CONFIG.CANCEL_IRN,
      );

      // Audit log
      await this.auditService.logOperation({
        operation: 'cancel',
        gstin: '', // Would be extracted from IRN details
        invoiceNo: '',
        irn: cancelRequest.irn,
        status: 'success',
        request: cancelRequest,
        response,
      });

      this.logger.log(`IRN cancelled successfully: ${cancelRequest.irn}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to cancel IRN: ${error.message}`, error.stack);

      // Audit log failure
      await this.auditService.logOperation({
        operation: 'cancel',
        gstin: '',
        invoiceNo: '',
        irn: cancelRequest.irn,
        status: 'error',
        request: cancelRequest,
        response: null,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Get IRN details by IRN
   */
  async getIrnByIrn(irn: string): Promise<IrpIrnDetailsResponse> {
    this.logger.log(`Fetching IRN details: ${irn}`);

    try {
      // Validate IRN format
      if (!VALIDATION_PATTERNS.IRN.test(irn)) {
        throw new Error(ERROR_MESSAGES.INVALID_IRN);
      }

      const response = await this.client.makeRequest<IrpIrnDetailsResponse>(
        'GET',
        `${IRP_SANDBOX_ENDPOINTS.GET_IRN}/${irn}`,
        null,
        TIMEOUT_CONFIG.GET_IRN,
      );

      // Audit log
      await this.auditService.logOperation({
        operation: 'fetch',
        gstin: response.invoiceData?.sellerDtls?.gstin || '',
        invoiceNo: response.invoiceData?.docDtls?.no || '',
        irn,
        status: 'success',
        request: { irn },
        response,
      });

      this.logger.log(`IRN details fetched successfully`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to fetch IRN details: ${error.message}`, error.stack);

      // Audit log failure
      await this.auditService.logOperation({
        operation: 'fetch',
        gstin: '',
        invoiceNo: '',
        irn,
        status: 'error',
        request: { irn },
        response: null,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Get IRN details by document details
   */
  async getIrnByDocumentDetails(
    docType: string,
    docNo: string,
    docDate: string,
  ): Promise<IrpIrnDetailsResponse> {
    this.logger.log(`Fetching IRN by document: ${docType}/${docNo}/${docDate}`);

    try {
      const response = await this.client.makeRequest<IrpIrnDetailsResponse>(
        'POST',
        IRP_SANDBOX_ENDPOINTS.GET_IRN_BY_DOC,
        {
          docType,
          docNo,
          docDate,
        },
        TIMEOUT_CONFIG.GET_IRN,
      );

      this.logger.log(`IRN details fetched successfully by document`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to fetch IRN by document: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate QR code from IRN response
   */
  async generateQrCode(irnResponse: IrpIrnResponse, invoiceData: IrpEInvoiceRequest): Promise<string> {
    try {
      const qrData: IrpQrCodeData = {
        sellerGstin: invoiceData.sellerDtls.gstin,
        buyerGstin: invoiceData.buyerDtls.gstin,
        documentNumber: invoiceData.docDtls.no,
        documentDate: invoiceData.docDtls.dt,
        totalInvoiceValue: invoiceData.valDtls.totInvVal,
        itemCount: invoiceData.itemList.length,
        hsnCode: invoiceData.itemList[0]?.hsnCode || '',
        irn: irnResponse.irn,
        ackNo: irnResponse.ackNo,
        ackDt: irnResponse.ackDt,
      };

      // Create QR code data string
      const qrString = JSON.stringify(qrData);

      // Generate QR code as base64 PNG
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 256,
        margin: 1,
      });

      return qrCodeDataUrl;
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk generate IRNs
   */
  async generateBulkIrn(bulkRequest: IrpBulkRequest): Promise<IrpBulkResponse> {
    this.logger.log(`Processing bulk IRN generation for ${bulkRequest.invoices.length} invoices`);

    // Validate batch size
    if (bulkRequest.invoices.length > BATCH_LIMITS.MAX_BATCH_SIZE) {
      throw new Error(`Batch size exceeds limit of ${BATCH_LIMITS.MAX_BATCH_SIZE}`);
    }

    const results: IrpBulkResponse['results'] = [];

    // Process in chunks to respect concurrent request limits
    const chunks = this.chunkArray(bulkRequest.invoices, BATCH_LIMITS.MAX_CONCURRENT_REQUESTS);

    for (const chunk of chunks) {
      const promises = chunk.map(async invoice => {
        try {
          const response = await this.generateIrn(invoice);
          return {
            invoiceNo: invoice.docDtls.no,
            status: 'success' as const,
            data: response,
          };
        } catch (error) {
          return {
            invoiceNo: invoice.docDtls.no,
            status: 'error' as const,
            error: {
              errorCode: 'BULK_ERROR',
              errorMessage: error.message,
            },
          };
        }
      });

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    this.logger.log(`Bulk generation completed: ${successCount} success, ${errorCount} errors`);

    return { results };
  }

  /**
   * Validate e-invoice JSON structure
   */
  validateInvoice(invoiceData: IrpEInvoiceRequest): ValidationResult {
    return this.validationService.validateInvoice(invoiceData);
  }

  /**
   * Check if IRN can be cancelled (within 24 hours)
   */
  async canCancelIrn(irn: string): Promise<boolean> {
    try {
      const details = await this.getIrnByIrn(irn);

      // Check if already cancelled
      if (details.status === DocumentStatus.CANCELLED) {
        return false;
      }

      // Parse acknowledgement date
      const ackDate = this.parseGstDate(details.ackDt);
      const now = new Date();
      const hoursSinceAck = (now.getTime() - ackDate.getTime()) / (1000 * 60 * 60);

      // Can cancel within 24 hours
      return hoursSinceAck < 24;
    } catch (error) {
      this.logger.error(`Error checking cancellation eligibility: ${error.message}`);
      return false;
    }
  }

  /**
   * Convert invoice to e-invoice JSON format
   */
  convertToEInvoiceFormat(invoice: any): IrpEInvoiceRequest {
    // This would implement the conversion logic from internal invoice format
    // to GST e-invoice JSON format
    // Implementation depends on the internal invoice schema
    throw new Error('Method not implemented - depends on internal invoice schema');
  }

  /**
   * Parse GST date format (DD/MM/YYYY)
   */
  private parseGstDate(dateString: string): Date {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Format date to GST format (DD/MM/YYYY)
   */
  formatGstDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    return {
      service: 'GST IRP',
      authenticated: this.client.isAuthenticated(),
      rateLimits: this.client.getRateLimitStatus(),
      config: this.client.getConfig(),
    };
  }
}
