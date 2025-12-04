/**
 * ZATCA Compliance Service
 * Handles CSID onboarding, invoice clearance, and reporting
 *
 * Features:
 * - CSID onboarding (compliance and production)
 * - Invoice clearance (B2B > 1000 SAR)
 * - Invoice reporting (simplified invoices)
 * - Compliance validation
 */

import { Injectable, Logger } from '@nestjs/common';
import { ZatcaClientService } from './zatca-client.service';
import { ZatcaInvoiceService } from './zatca-invoice.service';
import {
  ZatcaInvoiceData,
  InvoiceSubmissionResult,
  ZatcaCSIDRequest,
  ZatcaCSIDResponse,
  ZatcaInvoiceType,
} from './zatca.types';
import { CLEARANCE_THRESHOLD_SAR, CSID_TYPES } from './zatca.constants';
import { generateCSR } from './utils/crypto.util';

@Injectable()
export class ZatcaComplianceService {
  private readonly logger = new Logger(ZatcaComplianceService.name);

  constructor(
    private readonly zatcaClient: ZatcaClientService,
    private readonly zatcaInvoice: ZatcaInvoiceService,
  ) {}

  /**
   * Phase 1: Onboard to ZATCA and obtain Compliance CSID
   * This is the first step in the onboarding process
   */
  async onboardComplianceCSID(config: {
    organizationName: string;
    organizationIdentifier: string; // TRN
    organizationalUnitName: string;
    countryCode: string;
    privateKey: string;
  }): Promise<ZatcaCSIDResponse> {
    this.logger.log('Starting compliance CSID onboarding...');

    try {
      // Generate Certificate Signing Request (CSR)
      const csr = generateCSR({
        commonName: config.organizationName,
        organizationalUnitName: config.organizationalUnitName,
        organizationIdentifier: config.organizationIdentifier,
        countryName: config.countryCode,
        privateKey: config.privateKey,
      });

      this.logger.debug('CSR generated, requesting compliance CSID...');

      // Request compliance CSID from ZATCA
      const csidRequest: ZatcaCSIDRequest = {
        csr,
      };

      const response = await this.zatcaClient.requestComplianceCSID(csr);

      this.logger.log('Compliance CSID obtained successfully');

      return {
        requestId: response.requestID,
        dispositionMessage: response.dispositionMessage,
        binarySecurityToken: response.binarySecurityToken,
        secret: response.secret,
        expiryDate: response.tokenExpiryDate,
      };
    } catch (error) {
      this.logger.error(`Failed to obtain compliance CSID: ${error.message}`);
      throw new Error(`Compliance CSID onboarding failed: ${error.message}`);
    }
  }

  /**
   * Phase 2: Request Production CSID after compliance testing
   */
  async requestProductionCSID(complianceRequestId: string): Promise<ZatcaCSIDResponse> {
    this.logger.log('Requesting production CSID...');

    try {
      const response = await this.zatcaClient.requestProductionCSID(complianceRequestId);

      this.logger.log('Production CSID obtained successfully');

      return {
        requestId: response.requestID,
        dispositionMessage: response.dispositionMessage,
        binarySecurityToken: response.binarySecurityToken,
        secret: response.secret,
        expiryDate: response.tokenExpiryDate,
      };
    } catch (error) {
      this.logger.error(`Failed to obtain production CSID: ${error.message}`);
      throw new Error(`Production CSID request failed: ${error.message}`);
    }
  }

  /**
   * Submit invoice to ZATCA (auto-determine clearance vs reporting)
   */
  async submitInvoice(
    invoiceData: ZatcaInvoiceData,
    previousInvoiceHash: string,
    privateKey: string,
    publicKey: string,
  ): Promise<InvoiceSubmissionResult> {
    this.logger.log(`Submitting invoice: ${invoiceData.invoiceNumber}`);

    try {
      // Generate UBL XML
      const invoiceXML = this.zatcaInvoice.generateUBLInvoice(invoiceData, previousInvoiceHash);

      // Calculate invoice hash
      const { hash: invoiceHash } = this.zatcaInvoice.calculateHash(invoiceXML);

      // Generate cryptographic stamp
      const stamp = this.zatcaInvoice.generateStamp(invoiceHash, privateKey, publicKey);

      // Generate QR code
      const qrCode = this.zatcaInvoice.generateQRCode(invoiceData, invoiceHash, stamp);

      // Embed QR code in XML (update the AdditionalDocumentReference for QR code)
      const invoiceWithQR = this.embedQRCode(invoiceXML, qrCode);

      // Encode invoice to Base64
      const invoiceBase64 = Buffer.from(invoiceWithQR, 'utf8').toString('base64');

      // Determine if clearance is required
      const requiresClearance = this.requiresClearance(invoiceData);

      let response;

      if (requiresClearance) {
        this.logger.debug(`Invoice requires clearance (amount: ${invoiceData.taxInclusiveAmount} SAR)`);
        response = await this.zatcaClient.clearInvoice(invoiceHash, invoiceData.uuid, invoiceBase64);

        return {
          success: response.clearanceStatus === 'CLEARED',
          invoiceHash,
          uuid: invoiceData.uuid,
          clearanceStatus: response.clearanceStatus,
          clearedInvoice: response.clearedInvoice,
          validationResults: response.validationResults,
          warnings: response.warnings,
          qrCode,
        };
      } else {
        this.logger.debug(`Invoice will be reported (simplified or below threshold)`);
        response = await this.zatcaClient.reportInvoice(invoiceHash, invoiceData.uuid, invoiceBase64);

        return {
          success: response.reportingStatus === 'REPORTED',
          invoiceHash,
          uuid: invoiceData.uuid,
          reportingStatus: response.reportingStatus,
          validationResults: response.validationResults,
          warnings: response.warnings,
          qrCode,
        };
      }
    } catch (error) {
      this.logger.error(`Invoice submission failed: ${error.message}`);

      return {
        success: false,
        invoiceHash: '',
        uuid: invoiceData.uuid,
        errorCode: 'SUBMISSION_FAILED',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Validate invoice without submission (compliance testing)
   */
  async validateInvoice(
    invoiceData: ZatcaInvoiceData,
    previousInvoiceHash: string,
    privateKey: string,
    publicKey: string,
  ): Promise<InvoiceSubmissionResult> {
    this.logger.log(`Validating invoice: ${invoiceData.invoiceNumber}`);

    try {
      // Generate UBL XML
      const invoiceXML = this.zatcaInvoice.generateUBLInvoice(invoiceData, previousInvoiceHash);

      // Calculate invoice hash
      const { hash: invoiceHash } = this.zatcaInvoice.calculateHash(invoiceXML);

      // Generate cryptographic stamp
      const stamp = this.zatcaInvoice.generateStamp(invoiceHash, privateKey, publicKey);

      // Generate QR code
      const qrCode = this.zatcaInvoice.generateQRCode(invoiceData, invoiceHash, stamp);

      // Embed QR code in XML
      const invoiceWithQR = this.embedQRCode(invoiceXML, qrCode);

      // Encode invoice to Base64
      const invoiceBase64 = Buffer.from(invoiceWithQR, 'utf8').toString('base64');

      // Perform compliance check
      const response = await this.zatcaClient.complianceCheck(
        invoiceHash,
        invoiceData.uuid,
        invoiceBase64,
      );

      return {
        success: response.clearanceStatus === 'CLEARED' || response.reportingStatus === 'REPORTED',
        invoiceHash,
        uuid: invoiceData.uuid,
        clearanceStatus: response.clearanceStatus,
        reportingStatus: response.reportingStatus,
        validationResults: response.validationResults,
        warnings: response.warnings,
        qrCode,
      };
    } catch (error) {
      this.logger.error(`Invoice validation failed: ${error.message}`);

      return {
        success: false,
        invoiceHash: '',
        uuid: invoiceData.uuid,
        errorCode: 'VALIDATION_FAILED',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Clear invoice (real-time validation for B2B)
   */
  async clearInvoice(
    invoiceData: ZatcaInvoiceData,
    previousInvoiceHash: string,
    privateKey: string,
    publicKey: string,
  ): Promise<InvoiceSubmissionResult> {
    this.logger.log(`Clearing invoice: ${invoiceData.invoiceNumber}`);

    // Validate that invoice requires clearance
    if (!this.requiresClearance(invoiceData)) {
      this.logger.warn('Invoice does not require clearance, use reportInvoice instead');
    }

    return this.submitInvoice(invoiceData, previousInvoiceHash, privateKey, publicKey);
  }

  /**
   * Report invoice (simplified invoices)
   */
  async reportInvoice(
    invoiceData: ZatcaInvoiceData,
    previousInvoiceHash: string,
    privateKey: string,
    publicKey: string,
  ): Promise<InvoiceSubmissionResult> {
    this.logger.log(`Reporting invoice: ${invoiceData.invoiceNumber}`);

    // Validate that invoice is simplified type
    if (this.isStandardInvoice(invoiceData.invoiceType)) {
      this.logger.warn('Standard invoices should use clearance if above threshold');
    }

    return this.submitInvoice(invoiceData, previousInvoiceHash, privateKey, publicKey);
  }

  /**
   * Determine if invoice requires clearance
   * Clearance is required for standard invoices with total > 1000 SAR
   */
  private requiresClearance(invoiceData: ZatcaInvoiceData): boolean {
    // Standard invoices above threshold require clearance
    if (this.isStandardInvoice(invoiceData.invoiceType)) {
      return invoiceData.taxInclusiveAmount > CLEARANCE_THRESHOLD_SAR;
    }

    // Simplified invoices are always reported, never cleared
    return false;
  }

  /**
   * Check if invoice is standard type
   */
  private isStandardInvoice(type: ZatcaInvoiceType): boolean {
    return [
      ZatcaInvoiceType.STANDARD_INVOICE,
      ZatcaInvoiceType.STANDARD_CREDIT_NOTE,
      ZatcaInvoiceType.STANDARD_DEBIT_NOTE,
    ].includes(type);
  }

  /**
   * Embed QR code into invoice XML
   */
  private embedQRCode(invoiceXML: string, qrCodeBase64: string): string {
    // Find the AdditionalDocumentReference section and add QR code
    // In a real implementation, this would use proper XML parsing
    // For now, we'll append it before the closing tag

    const qrCodeReference = `
      <cac:AdditionalDocumentReference>
        <cbc:ID>QR</cbc:ID>
        <cac:Attachment>
          <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qrCodeBase64}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
      </cac:AdditionalDocumentReference>`;

    // Insert before the AccountingSupplierParty element
    const insertPosition = invoiceXML.indexOf('<cac:AccountingSupplierParty>');

    if (insertPosition === -1) {
      this.logger.warn('Could not find AccountingSupplierParty element, appending QR code at end');
      return invoiceXML.replace('</Invoice>', `${qrCodeReference}</Invoice>`);
    }

    return (
      invoiceXML.substring(0, insertPosition) +
      qrCodeReference +
      invoiceXML.substring(insertPosition)
    );
  }

  /**
   * Get compliance status
   */
  async getComplianceStatus(): Promise<{
    hasComplianceCSID: boolean;
    hasProductionCSID: boolean;
    environment: string;
  }> {
    const config = this.zatcaClient.getConfig();

    return {
      hasComplianceCSID: !!config.organizationIdentifier, // Simplified check
      hasProductionCSID: config.environment === 'production',
      environment: config.environment || 'sandbox',
    };
  }

  /**
   * Test compliance with sample invoice
   */
  async testCompliance(
    sampleInvoice: ZatcaInvoiceData,
    privateKey: string,
    publicKey: string,
  ): Promise<boolean> {
    this.logger.log('Testing compliance with sample invoice...');

    try {
      const result = await this.validateInvoice(
        sampleInvoice,
        '0000000000000000000000000000000000000000000000000000000000000000', // Initial PIH
        privateKey,
        publicKey,
      );

      if (result.success) {
        this.logger.log('Compliance test passed successfully');
        return true;
      } else {
        this.logger.error('Compliance test failed');
        if (result.validationResults) {
          result.validationResults.forEach(validation => {
            this.logger.error(`  ${validation.type}: ${validation.message}`);
          });
        }
        return false;
      }
    } catch (error) {
      this.logger.error(`Compliance test error: ${error.message}`);
      return false;
    }
  }
}
