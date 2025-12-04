import { Injectable, Logger } from '@nestjs/common';
import { SiiBookType } from './constants/sii.constants';
import {
  SiiIssuedInvoice,
  SiiReceivedInvoice,
  SiiParty,
} from './interfaces/sii-invoice.interface';
import { SiiXmlBuilderService } from './sii-xml-builder.service';
import { SiiSoapClient } from './sii-soap.client';
import { SiiInvoiceSubmissionResponse } from './interfaces/sii-response.interface';

/**
 * SII Books Service
 * Handles different SII book types (A1, A2, A3, B1, B2, B3, B4)
 *
 * Book Types:
 * - A1: Issued invoices (Facturas Emitidas)
 * - A2: Rectifications of issued invoices
 * - A3: Assets register (Bienes de Inversión)
 * - B1: Received invoices (Facturas Recibidas)
 * - B2: Corrections of received invoices
 * - B3: Intracommunity acquisitions
 * - B4: Import VAT
 */
@Injectable()
export class SiiBooksService {
  private readonly logger = new Logger(SiiBooksService.name);

  constructor(
    private readonly xmlBuilder: SiiXmlBuilderService,
    private readonly soapClient: SiiSoapClient,
  ) {}

  /**
   * Submit to A1 book - Standard issued invoices
   */
  async submitIssuedInvoices(
    bookType: SiiBookType.A1_ISSUED,
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiIssuedInvoice[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    this.logger.log(
      `Submitting ${invoices.length} issued invoices to A1 book for ${holder.nif}`,
    );

    // Filter standard invoices (not rectifications)
    const standardInvoices = invoices.filter(
      (inv) => !inv.invoiceId.invoiceType.startsWith('R'),
    );

    if (standardInvoices.length === 0) {
      throw new Error('No standard invoices to submit to A1 book');
    }

    const soapEnvelope = this.xmlBuilder.buildIssuedInvoicesRequest(
      holder,
      fiscalYear,
      period,
      standardInvoices,
    );

    const response = await this.soapClient.submitIssuedInvoices(
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );

    return this.parseSubmissionResponse(response);
  }

  /**
   * Submit to A2 book - Rectifications of issued invoices
   */
  async submitIssuedRectifications(
    bookType: SiiBookType.A2_RECTIFICATIONS,
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiIssuedInvoice[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    this.logger.log(
      `Submitting ${invoices.length} rectifications to A2 book for ${holder.nif}`,
    );

    // Filter rectification invoices
    const rectifications = invoices.filter(
      (inv) =>
        inv.invoiceId.invoiceType.startsWith('R') && inv.rectification,
    );

    if (rectifications.length === 0) {
      throw new Error('No rectification invoices to submit to A2 book');
    }

    const soapEnvelope = this.xmlBuilder.buildIssuedInvoicesRequest(
      holder,
      fiscalYear,
      period,
      rectifications,
    );

    const response = await this.soapClient.submitIssuedInvoices(
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );

    return this.parseSubmissionResponse(response);
  }

  /**
   * Submit to A3 book - Assets register (Bienes de Inversión)
   */
  async submitAssets(
    bookType: SiiBookType.A3_ASSETS,
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiReceivedInvoice[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    this.logger.log(
      `Submitting ${invoices.length} assets to A3 book for ${holder.nif}`,
    );

    // Note: Assets are received invoices for capital goods
    const soapEnvelope = this.xmlBuilder.buildReceivedInvoicesRequest(
      holder,
      fiscalYear,
      period,
      invoices,
    );

    const response = await this.soapClient.submitReceivedInvoices(
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );

    return this.parseSubmissionResponse(response);
  }

  /**
   * Submit to B1 book - Standard received invoices
   */
  async submitReceivedInvoices(
    bookType: SiiBookType.B1_RECEIVED,
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiReceivedInvoice[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    this.logger.log(
      `Submitting ${invoices.length} received invoices to B1 book for ${holder.nif}`,
    );

    // Filter standard received invoices (not intracommunity or imports)
    const standardInvoices = invoices.filter(
      (inv) => !inv.isIntracommunity && !inv.isImport,
    );

    if (standardInvoices.length === 0) {
      throw new Error('No standard received invoices to submit to B1 book');
    }

    const soapEnvelope = this.xmlBuilder.buildReceivedInvoicesRequest(
      holder,
      fiscalYear,
      period,
      standardInvoices,
    );

    const response = await this.soapClient.submitReceivedInvoices(
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );

    return this.parseSubmissionResponse(response);
  }

  /**
   * Submit to B2 book - Corrections of received invoices
   */
  async submitReceivedCorrections(
    bookType: SiiBookType.B2_CORRECTIONS,
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiReceivedInvoice[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    this.logger.log(
      `Submitting ${invoices.length} corrections to B2 book for ${holder.nif}`,
    );

    // Filter rectification/correction invoices
    const corrections = invoices.filter((inv) => inv.rectification);

    if (corrections.length === 0) {
      throw new Error('No correction invoices to submit to B2 book');
    }

    const soapEnvelope = this.xmlBuilder.buildReceivedInvoicesRequest(
      holder,
      fiscalYear,
      period,
      corrections,
    );

    const response = await this.soapClient.submitReceivedInvoices(
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );

    return this.parseSubmissionResponse(response);
  }

  /**
   * Submit to B3 book - Intracommunity acquisitions
   */
  async submitIntracommunityAcquisitions(
    bookType: SiiBookType.B3_INTRACOMMUNITY,
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiReceivedInvoice[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    this.logger.log(
      `Submitting ${invoices.length} intracommunity acquisitions to B3 book for ${holder.nif}`,
    );

    // Filter intracommunity acquisitions
    const intracommunity = invoices.filter((inv) => inv.isIntracommunity);

    if (intracommunity.length === 0) {
      throw new Error(
        'No intracommunity acquisitions to submit to B3 book',
      );
    }

    const soapEnvelope = this.xmlBuilder.buildReceivedInvoicesRequest(
      holder,
      fiscalYear,
      period,
      intracommunity,
    );

    const response = await this.soapClient.submitReceivedInvoices(
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );

    return this.parseSubmissionResponse(response);
  }

  /**
   * Submit to B4 book - Import VAT
   */
  async submitImports(
    bookType: SiiBookType.B4_IMPORT_VAT,
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiReceivedInvoice[],
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    this.logger.log(
      `Submitting ${invoices.length} imports to B4 book for ${holder.nif}`,
    );

    // Filter import invoices
    const imports = invoices.filter((inv) => inv.isImport);

    if (imports.length === 0) {
      throw new Error('No import invoices to submit to B4 book');
    }

    const soapEnvelope = this.xmlBuilder.buildReceivedInvoicesRequest(
      holder,
      fiscalYear,
      period,
      imports,
    );

    const response = await this.soapClient.submitReceivedInvoices(
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );

    return this.parseSubmissionResponse(response);
  }

  /**
   * Determine appropriate book type for invoice
   */
  determineBookType(
    invoice: SiiIssuedInvoice | SiiReceivedInvoice,
  ): SiiBookType {
    // Check if it's an issued invoice
    if ('issuer' in invoice && 'recipient' in invoice) {
      const issuedInvoice = invoice as SiiIssuedInvoice;

      // Rectifications go to A2
      if (issuedInvoice.rectification) {
        return SiiBookType.A2_RECTIFICATIONS;
      }

      // Standard issued invoices go to A1
      return SiiBookType.A1_ISSUED;
    }

    // Check if it's a received invoice
    const receivedInvoice = invoice as SiiReceivedInvoice;

    // Corrections go to B2
    if (receivedInvoice.rectification) {
      return SiiBookType.B2_CORRECTIONS;
    }

    // Intracommunity acquisitions go to B3
    if (receivedInvoice.isIntracommunity) {
      return SiiBookType.B3_INTRACOMMUNITY;
    }

    // Imports go to B4
    if (receivedInvoice.isImport) {
      return SiiBookType.B4_IMPORT_VAT;
    }

    // Standard received invoices go to B1
    return SiiBookType.B1_RECEIVED;
  }

  /**
   * Parse submission response (simplified - to be enhanced with actual XML parsing)
   */
  private parseSubmissionResponse(
    xmlResponse: string,
  ): SiiInvoiceSubmissionResponse {
    // This is a simplified implementation
    // In production, you would use proper XML parsing (e.g., xml2js)
    const isSuccess = !xmlResponse.includes('soap:Fault');

    if (isSuccess) {
      return {
        success: true,
        timestamp: new Date(),
        submissionId: `SII-${Date.now()}`,
        acceptedCount: 1,
        rejectedCount: 0,
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
