/**
 * ZATCA E-Invoice Service
 * Generates UBL 2.1 compliant XML invoices
 *
 * Features:
 * - UBL 2.1 XML generation
 * - Invoice hash calculation (SHA-256)
 * - Cryptographic stamp (ECDSA signature)
 * - QR code generation with TLV encoding
 * - Invoice validation
 * - Support for Standard and Simplified invoices
 */

import { Injectable, Logger } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import {
  ZatcaInvoiceData,
  ZatcaInvoiceType,
  InvoiceHashResult,
  CryptographicStampResult,
  ZatcaQRCodeData,
  UBLInvoice,
} from './zatca.types';
import {
  UBL_VERSION,
  DEFAULTS,
  VAT_CATEGORY_CODES,
  INVOICE_TRANSACTION_TYPES,
  ZATCA_INVOICE_TYPES,
} from './zatca.constants';
import {
  calculateInvoiceHash,
  generateCryptographicStamp,
  generateUUID,
} from './utils/crypto.util';
import { createZatcaQRCodeTLV, tlvToBase64 } from './utils/tlv-encoder.util';

@Injectable()
export class ZatcaInvoiceService {
  private readonly logger = new Logger(ZatcaInvoiceService.name);

  /**
   * Generate UBL 2.1 XML invoice
   */
  generateUBLInvoice(
    invoiceData: ZatcaInvoiceData,
    previousInvoiceHash: string,
  ): string {
    this.logger.debug(`Generating UBL invoice: ${invoiceData.invoiceNumber}`);

    // Validate invoice data
    this.validateInvoiceData(invoiceData);

    // Determine profile ID based on invoice type
    const profileId = this.getProfileId(invoiceData.invoiceType);

    // Build UBL structure
    const ublInvoice: UBLInvoice = {
      ublVersionId: UBL_VERSION,
      profileId,
      id: invoiceData.invoiceNumber,
      uuid: invoiceData.uuid,
      issueDate: this.formatDate(invoiceData.issueDate),
      issueTime: this.formatTime(invoiceData.issueTime),
      invoiceTypeCode: invoiceData.invoiceTypeCode,
      documentCurrencyCode: invoiceData.currency,
      billingReference: invoiceData.billingReference
        ? this.buildBillingReference(invoiceData.billingReference)
        : undefined,
      additionalDocumentReference: this.buildAdditionalDocumentReferences(
        invoiceData.uuid,
        previousInvoiceHash,
      ),
      accountingSupplierParty: this.buildParty(invoiceData.seller, 'Seller'),
      accountingCustomerParty: invoiceData.buyer
        ? this.buildParty(invoiceData.buyer, 'Buyer')
        : undefined,
      delivery: invoiceData.deliveryDate
        ? this.buildDelivery(invoiceData.deliveryDate)
        : undefined,
      paymentMeans: invoiceData.paymentMeans
        ? this.buildPaymentMeans(invoiceData.paymentMeans)
        : undefined,
      taxTotal: this.buildTaxTotal(invoiceData.taxSubtotals, invoiceData.currency),
      legalMonetaryTotal: this.buildLegalMonetaryTotal(invoiceData),
      invoiceLine: this.buildInvoiceLines(invoiceData.lines),
    };

    // Convert to XML
    const xml = this.buildXML(ublInvoice);

    this.logger.debug(`UBL invoice generated successfully`);

    return xml;
  }

  /**
   * Calculate invoice hash
   */
  calculateHash(invoiceXML: string): InvoiceHashResult {
    return calculateInvoiceHash(invoiceXML);
  }

  /**
   * Generate cryptographic stamp (ECDSA signature)
   */
  generateStamp(
    invoiceHash: string,
    privateKey: string,
    publicKey: string,
  ): CryptographicStampResult {
    return generateCryptographicStamp(invoiceHash, privateKey, publicKey);
  }

  /**
   * Generate QR code data
   */
  generateQRCode(
    invoiceData: ZatcaInvoiceData,
    invoiceHash: string,
    cryptographicStamp: CryptographicStampResult,
  ): string {
    const qrData: ZatcaQRCodeData = {
      sellerName: invoiceData.seller.registrationName,
      vatRegistrationNumber: invoiceData.seller.vatRegistrationNumber || '',
      timestamp: invoiceData.issueDate.toISOString(),
      invoiceTotal: invoiceData.taxInclusiveAmount.toFixed(2),
      vatTotal: this.calculateTotalVAT(invoiceData.taxSubtotals).toFixed(2),
      invoiceHash,
      cryptographicStamp: cryptographicStamp.signature,
      publicKey: cryptographicStamp.publicKey,
      signatureAlgorithm: cryptographicStamp.algorithm,
    };

    const tlvBuffer = createZatcaQRCodeTLV(
      qrData.sellerName,
      qrData.vatRegistrationNumber,
      qrData.timestamp,
      qrData.invoiceTotal,
      qrData.vatTotal,
      qrData.invoiceHash,
      qrData.cryptographicStamp,
      qrData.publicKey,
      qrData.signatureAlgorithm,
    );

    return tlvToBase64(tlvBuffer);
  }

  /**
   * Validate invoice data
   */
  private validateInvoiceData(invoiceData: ZatcaInvoiceData): void {
    const errors: string[] = [];

    // Required fields
    if (!invoiceData.invoiceNumber) errors.push('Invoice number is required');
    if (!invoiceData.uuid) errors.push('UUID is required');
    if (!invoiceData.issueDate) errors.push('Issue date is required');
    if (!invoiceData.issueTime) errors.push('Issue time is required');
    if (!invoiceData.seller) errors.push('Seller information is required');
    if (!invoiceData.lines || invoiceData.lines.length === 0) {
      errors.push('At least one invoice line is required');
    }

    // Seller validation
    if (invoiceData.seller) {
      if (!invoiceData.seller.registrationName) {
        errors.push('Seller registration name is required');
      }
      if (!invoiceData.seller.vatRegistrationNumber) {
        errors.push('Seller VAT registration number is required');
      }
      if (!invoiceData.seller.address) {
        errors.push('Seller address is required');
      }
    }

    // Buyer validation for standard invoices
    if (this.isStandardInvoice(invoiceData.invoiceType) && !invoiceData.buyer) {
      errors.push('Buyer information is required for standard invoices');
    }

    // Line validation
    if (invoiceData.lines) {
      invoiceData.lines.forEach((line, index) => {
        if (!line.name) errors.push(`Line ${index + 1}: Item name is required`);
        if (line.quantity <= 0) errors.push(`Line ${index + 1}: Quantity must be positive`);
        if (line.unitPrice < 0) errors.push(`Line ${index + 1}: Unit price cannot be negative`);
      });
    }

    // Totals validation
    const calculatedLineExtension = invoiceData.lines.reduce((sum, line) => sum + line.netAmount, 0);
    if (Math.abs(calculatedLineExtension - invoiceData.lineExtensionAmount) > 0.01) {
      errors.push('Line extension amount does not match sum of line net amounts');
    }

    if (errors.length > 0) {
      throw new Error(`Invoice validation failed:\n${errors.join('\n')}`);
    }
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
   * Get profile ID based on invoice type
   */
  private getProfileId(type: ZatcaInvoiceType): string {
    return this.isStandardInvoice(type)
      ? 'reporting:1.0' // Standard invoices require clearance
      : 'reporting:1.0'; // Simplified invoices are reported
  }

  /**
   * Build XML from UBL structure
   */
  private buildXML(ublInvoice: UBLInvoice): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('Invoice', {
        xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
      })
      .ele('cbc:UBLVersionID').txt(ublInvoice.ublVersionId).up()
      .ele('cbc:ProfileID').txt(ublInvoice.profileId).up()
      .ele('cbc:ID').txt(ublInvoice.id).up()
      .ele('cbc:UUID').txt(ublInvoice.uuid).up()
      .ele('cbc:IssueDate').txt(ublInvoice.issueDate).up()
      .ele('cbc:IssueTime').txt(ublInvoice.issueTime).up()
      .ele('cbc:InvoiceTypeCode', { name: this.getInvoiceTypeName(ublInvoice.invoiceTypeCode) })
        .txt(ublInvoice.invoiceTypeCode).up()
      .ele('cbc:DocumentCurrencyCode').txt(ublInvoice.documentCurrencyCode).up();

    // Add additional document references (PIH, QR code)
    if (ublInvoice.additionalDocumentReference) {
      ublInvoice.additionalDocumentReference.forEach((ref: any) => {
        const refEle = doc.ele('cac:AdditionalDocumentReference')
          .ele('cbc:ID').txt(ref.id).up();

        if (ref.uuid) {
          refEle.ele('cbc:UUID').txt(ref.uuid).up();
        }

        if (ref.attachment) {
          refEle.ele('cac:Attachment')
            .ele('cbc:EmbeddedDocumentBinaryObject', { mimeCode: ref.attachment.mimeCode })
              .txt(ref.attachment.content).up()
            .up();
        }

        refEle.up();
      });
    }

    // Add parties
    this.addPartyToXML(doc, 'cac:AccountingSupplierParty', ublInvoice.accountingSupplierParty);

    if (ublInvoice.accountingCustomerParty) {
      this.addPartyToXML(doc, 'cac:AccountingCustomerParty', ublInvoice.accountingCustomerParty);
    }

    // Add delivery
    if (ublInvoice.delivery) {
      doc.ele('cac:Delivery')
        .ele('cbc:ActualDeliveryDate').txt(ublInvoice.delivery.actualDeliveryDate).up()
        .up();
    }

    // Add payment means
    if (ublInvoice.paymentMeans) {
      doc.ele('cac:PaymentMeans')
        .ele('cbc:PaymentMeansCode').txt(ublInvoice.paymentMeans.code).up()
        .up();
    }

    // Add tax total
    ublInvoice.taxTotal.forEach((taxTotal: any) => {
      const taxTotalEle = doc.ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: taxTotal.currencyCode }).txt(taxTotal.taxAmount.toFixed(2)).up();

      taxTotal.taxSubtotal.forEach((subtotal: any) => {
        taxTotalEle.ele('cac:TaxSubtotal')
          .ele('cbc:TaxableAmount', { currencyID: subtotal.currencyCode }).txt(subtotal.taxableAmount.toFixed(2)).up()
          .ele('cbc:TaxAmount', { currencyID: subtotal.currencyCode }).txt(subtotal.taxAmount.toFixed(2)).up()
          .ele('cac:TaxCategory')
            .ele('cbc:ID').txt(subtotal.taxCategory.id).up()
            .ele('cbc:Percent').txt((subtotal.taxCategory.percent * 100).toFixed(2)).up()
            .ele('cac:TaxScheme')
              .ele('cbc:ID').txt('VAT').up()
            .up()
          .up()
        .up();
      });

      taxTotalEle.up();
    });

    // Add legal monetary total
    const lmt = ublInvoice.legalMonetaryTotal;
    doc.ele('cac:LegalMonetaryTotal')
      .ele('cbc:LineExtensionAmount', { currencyID: lmt.currencyCode }).txt(lmt.lineExtensionAmount.toFixed(2)).up()
      .ele('cbc:TaxExclusiveAmount', { currencyID: lmt.currencyCode }).txt(lmt.taxExclusiveAmount.toFixed(2)).up()
      .ele('cbc:TaxInclusiveAmount', { currencyID: lmt.currencyCode }).txt(lmt.taxInclusiveAmount.toFixed(2)).up()
      .ele('cbc:PayableAmount', { currencyID: lmt.currencyCode }).txt(lmt.payableAmount.toFixed(2)).up()
      .up();

    // Add invoice lines
    ublInvoice.invoiceLine.forEach((line: any) => {
      doc.ele('cac:InvoiceLine')
        .ele('cbc:ID').txt(line.id).up()
        .ele('cbc:InvoicedQuantity', { unitCode: line.unitCode }).txt(line.quantity.toFixed(2)).up()
        .ele('cbc:LineExtensionAmount', { currencyID: line.currencyCode }).txt(line.lineExtensionAmount.toFixed(2)).up()
        .ele('cac:TaxTotal')
          .ele('cbc:TaxAmount', { currencyID: line.currencyCode }).txt(line.taxTotal.taxAmount.toFixed(2)).up()
          .ele('cbc:RoundingAmount', { currencyID: line.currencyCode }).txt(line.taxTotal.roundingAmount.toFixed(2)).up()
        .up()
        .ele('cac:Item')
          .ele('cbc:Name').txt(line.item.name).up()
          .ele('cac:ClassifiedTaxCategory')
            .ele('cbc:ID').txt(line.item.taxCategory.id).up()
            .ele('cbc:Percent').txt((line.item.taxCategory.percent * 100).toFixed(2)).up()
            .ele('cac:TaxScheme')
              .ele('cbc:ID').txt('VAT').up()
            .up()
          .up()
        .up()
        .ele('cac:Price')
          .ele('cbc:PriceAmount', { currencyID: line.currencyCode }).txt(line.price.priceAmount.toFixed(2)).up()
        .up()
      .up();
    });

    return doc.end({ prettyPrint: true });
  }

  /**
   * Add party element to XML
   */
  private addPartyToXML(doc: any, tagName: string, party: any): void {
    const partyEle = doc.ele(tagName)
      .ele('cac:Party');

    // Party identification
    if (party.partyIdentification) {
      party.partyIdentification.forEach((id: any) => {
        partyEle.ele('cac:PartyIdentification')
          .ele('cbc:ID', { schemeID: id.schemeID }).txt(id.value).up()
          .up();
      });
    }

    // Postal address
    if (party.postalAddress) {
      const addr = party.postalAddress;
      partyEle.ele('cac:PostalAddress')
        .ele('cbc:StreetName').txt(addr.streetName).up()
        .ele('cbc:BuildingNumber').txt(addr.buildingNumber).up()
        .ele('cbc:CitySubdivisionName').txt(addr.districtName).up()
        .ele('cbc:CityName').txt(addr.cityName).up()
        .ele('cbc:PostalZone').txt(addr.postalCode).up()
        .ele('cac:Country')
          .ele('cbc:IdentificationCode').txt(addr.countryCode).up()
        .up()
      .up();
    }

    // Party tax scheme
    if (party.partyTaxScheme) {
      partyEle.ele('cac:PartyTaxScheme')
        .ele('cbc:CompanyID').txt(party.partyTaxScheme.companyID).up()
        .ele('cac:TaxScheme')
          .ele('cbc:ID').txt('VAT').up()
        .up()
      .up();
    }

    // Party legal entity
    if (party.partyLegalEntity) {
      partyEle.ele('cac:PartyLegalEntity')
        .ele('cbc:RegistrationName').txt(party.partyLegalEntity.registrationName).up()
        .up();
    }

    partyEle.up().up();
  }

  // Helper methods for building UBL components...

  private buildBillingReference(ref: any): any {
    return {
      id: ref.id,
      uuid: ref.uuid,
      issueDate: ref.issueDate ? this.formatDate(ref.issueDate) : undefined,
    };
  }

  private buildAdditionalDocumentReferences(uuid: string, previousInvoiceHash: string): any[] {
    return [
      {
        id: 'ICV',
        uuid: uuid,
      },
      {
        id: 'PIH',
        attachment: {
          mimeCode: 'text/plain',
          content: previousInvoiceHash,
        },
      },
    ];
  }

  private buildParty(party: any, role: string): any {
    return {
      partyIdentification: [
        { schemeID: 'CRN', value: party.commercialRegistrationNumber || '1234567890' },
      ],
      postalAddress: {
        streetName: party.address.streetName,
        buildingNumber: party.address.buildingNumber,
        districtName: party.address.districtName,
        cityName: party.address.cityName,
        postalCode: party.address.postalCode,
        countryCode: party.address.countryCode,
      },
      partyTaxScheme: {
        companyID: party.vatRegistrationNumber,
      },
      partyLegalEntity: {
        registrationName: party.registrationName,
      },
    };
  }

  private buildDelivery(date: Date): any {
    return {
      actualDeliveryDate: this.formatDate(date),
    };
  }

  private buildPaymentMeans(paymentMeans: any): any {
    return {
      code: paymentMeans.paymentMeansCode,
    };
  }

  private buildTaxTotal(taxSubtotals: any[], currency: string): any[] {
    const totalTaxAmount = taxSubtotals.reduce((sum, subtotal) => sum + subtotal.taxAmount, 0);

    return [{
      currencyCode: currency,
      taxAmount: totalTaxAmount,
      taxSubtotal: taxSubtotals.map(subtotal => ({
        currencyCode: currency,
        taxableAmount: subtotal.taxableAmount,
        taxAmount: subtotal.taxAmount,
        taxCategory: {
          id: subtotal.vatCategoryCode,
          percent: subtotal.vatRate,
        },
      })),
    }];
  }

  private buildLegalMonetaryTotal(invoiceData: ZatcaInvoiceData): any {
    return {
      currencyCode: invoiceData.currency,
      lineExtensionAmount: invoiceData.lineExtensionAmount,
      taxExclusiveAmount: invoiceData.taxExclusiveAmount,
      taxInclusiveAmount: invoiceData.taxInclusiveAmount,
      payableAmount: invoiceData.payableAmount,
    };
  }

  private buildInvoiceLines(lines: any[]): any[] {
    return lines.map(line => ({
      id: line.id,
      quantity: line.quantity,
      unitCode: line.measurementUnit || 'PCE',
      lineExtensionAmount: line.netAmount,
      currencyCode: DEFAULTS.CURRENCY,
      taxTotal: {
        taxAmount: line.vatAmount,
        roundingAmount: line.totalAmount,
      },
      item: {
        name: line.name,
        taxCategory: {
          id: line.vatCategoryCode,
          percent: line.vatRate,
        },
      },
      price: {
        priceAmount: line.unitPrice,
      },
    }));
  }

  private getInvoiceTypeName(code: string): string {
    const names: Record<string, string> = {
      '388': '0200000', // Standard/Simplified Invoice
      '381': '0200001', // Standard/Simplified Credit Note
      '383': '0200002', // Standard/Simplified Debit Note
    };
    return names[code] || code;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatTime(date: Date): string {
    return date.toISOString().split('T')[1].split('.')[0];
  }

  private calculateTotalVAT(taxSubtotals: any[]): number {
    return taxSubtotals.reduce((sum, subtotal) => sum + subtotal.taxAmount, 0);
  }
}
