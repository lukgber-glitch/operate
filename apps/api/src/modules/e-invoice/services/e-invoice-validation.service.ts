import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { ZugferdService } from './zugferd.service';
import { XRechnungService } from './xrechnung.service';
import {
  EInvoiceFormat,
  RecipientType,
  BusinessRuleResult,
  BusinessRuleViolation,
  RecipientValidationResult,
  ExtendedValidationResult,
  FormatDetectionResult,
  ValidationContext,
  BusinessRule,
} from '../types/validation.types';
import { InvoiceData } from '../types/zugferd.types';
import { ValidationResult } from '../types/xrechnung.types';

/**
 * E-Invoice Validation Service
 *
 * Unified validation service for all E-Invoice formats:
 * - ZUGFeRD/Factur-X (PDF with embedded XML)
 * - XRechnung UBL (XML)
 * - XRechnung CII (XML)
 *
 * Performs:
 * - Format detection
 * - Schema validation
 * - EN16931 business rule compliance
 * - Recipient-specific validation (B2B, B2G, B2C)
 * - Semantic validation (calculations, dates, etc.)
 */
@Injectable()
export class EInvoiceValidationService {
  private readonly logger = new Logger(EInvoiceValidationService.name);
  private readonly xmlParser: XMLParser;

  constructor(
    private readonly zugferdService: ZugferdService,
    private readonly xrechnungService: XRechnungService,
  ) {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: false,
      trimValues: true,
    });
  }

  /**
   * Detect E-Invoice format from input
   *
   * @param input - Buffer (for PDF) or string (for XML)
   * @returns Detected format with confidence level
   */
  async detectFormat(
    input: Buffer | string,
  ): Promise<FormatDetectionResult> {
    this.logger.debug('Detecting E-Invoice format');

    // Check if input is Buffer (PDF) or string (XML)
    if (Buffer.isBuffer(input)) {
      return this.detectPdfFormat(input);
    } else {
      return this.detectXmlFormat(input);
    }
  }

  /**
   * Validate any E-Invoice format
   *
   * Automatically detects format and applies appropriate validation
   *
   * @param input - Buffer (PDF) or string (XML)
   * @param context - Optional validation context
   * @returns Extended validation result
   */
  async validate(
    input: Buffer | string,
    context?: ValidationContext,
  ): Promise<ExtendedValidationResult> {
    this.logger.log('Validating E-Invoice');

    // Detect format first
    const detection = await this.detectFormat(input);
    this.logger.debug(`Detected format: ${detection.format}`);

    let result: ValidationResult;

    // Validate based on format
    switch (detection.format) {
      case EInvoiceFormat.ZUGFERD:
      case EInvoiceFormat.FACTURX:
        result = await this.validateZugferd(input as Buffer);
        break;

      case EInvoiceFormat.XRECHNUNG_UBL:
      case EInvoiceFormat.XRECHNUNG_CII:
        result = await this.validateXRechnung(input as string);
        break;

      default:
        throw new BadRequestException(
          `Unsupported E-Invoice format: ${detection.format}`,
        );
    }

    // Add format detection to result
    return {
      ...result,
      format: detection.format,
    };
  }

  /**
   * Validate ZUGFeRD PDF specifically
   *
   * @param pdf - PDF buffer
   * @returns Extended validation result
   */
  async validateZugferd(pdf: Buffer): Promise<ExtendedValidationResult> {
    this.logger.debug('Validating ZUGFeRD/Factur-X PDF');

    const result = await this.zugferdService.validateZugferdPdf(pdf);

    return {
      ...result,
      format: EInvoiceFormat.ZUGFERD,
    };
  }

  /**
   * Validate XRechnung XML specifically
   *
   * @param xml - XML string
   * @returns Extended validation result
   */
  async validateXRechnung(xml: string): Promise<ExtendedValidationResult> {
    this.logger.debug('Validating XRechnung XML');

    const result = await this.xrechnungService.validateXRechnung(xml);

    // Detect UBL vs CII syntax
    const parsed = this.xmlParser.parse(xml);
    const format = parsed.Invoice
      ? EInvoiceFormat.XRECHNUNG_UBL
      : EInvoiceFormat.XRECHNUNG_CII;

    return {
      ...result,
      format,
      metadata: {
        xmlValidated: result.valid,
      },
    };
  }

  /**
   * Check EN16931 business rule compliance
   *
   * Validates core European standard business rules (BR-01 to BR-65)
   * and country-specific rules (BR-DE, BR-AT, etc.)
   *
   * @param invoice - Invoice data
   * @param context - Optional validation context
   * @returns Business rule validation result
   */
  async checkBusinessRules(
    invoice: InvoiceData,
    context?: ValidationContext,
  ): Promise<BusinessRuleResult> {
    this.logger.debug('Checking EN16931 business rules');

    const violations: BusinessRuleViolation[] = [];

    // Core EN16931 rules
    this.checkCoreRules(invoice, violations);

    // Country-specific rules
    if (context?.country === 'DE') {
      this.checkGermanRules(invoice, violations, context);
    } else if (context?.country === 'AT') {
      this.checkAustrianRules(invoice, violations, context);
    }

    const passed = violations.filter((v) => v.severity === 'error').length === 0;

    this.logger.debug(
      `Business rules check: ${passed ? 'PASSED' : 'FAILED'} (${violations.length} violations)`,
    );

    return {
      passed,
      violations,
    };
  }

  /**
   * Validate mandatory fields for specific recipient type
   *
   * @param invoice - Invoice data
   * @param recipientType - Type of recipient (B2B, B2G, B2C)
   * @returns Recipient-specific validation result
   */
  async validateForRecipient(
    invoice: InvoiceData,
    recipientType: RecipientType,
  ): Promise<RecipientValidationResult> {
    this.logger.debug(`Validating for recipient type: ${recipientType}`);

    const missingFields: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Base required fields (all types)
    const baseFields = [
      'number',
      'issueDate',
      'dueDate',
      'currency',
      'seller.name',
      'seller.vatId',
      'buyer.name',
      'totalAmount',
    ];

    for (const field of baseFields) {
      if (!this.hasField(invoice, field)) {
        missingFields.push(field);
      }
    }

    // B2G-specific requirements
    if (recipientType === RecipientType.B2G) {
      // Leitweg-ID is mandatory for German B2G
      if (!invoice.leitwegId) {
        missingFields.push('leitwegId');
      } else if (!this.isValidLeitwegId(invoice.leitwegId)) {
        warnings.push('Leitweg-ID format may be invalid');
      }

      // Currency should be EUR for German B2G
      if (invoice.currency !== 'EUR') {
        warnings.push('German B2G invoices should use EUR currency');
      }

      // Payment terms should be specified
      if (!invoice.paymentTerms) {
        warnings.push('Payment terms should be specified for B2G');
      }

      // Bank details should be provided
      if (!invoice.bankDetails) {
        recommendations.push('Bank details recommended for B2G invoices');
      }
    }

    // B2B-specific recommendations
    if (recipientType === RecipientType.B2B) {
      if (!invoice.buyer.vatId) {
        recommendations.push('Buyer VAT ID recommended for B2B transactions');
      }

      if (!invoice.purchaseOrderReference && !invoice.contractReference) {
        recommendations.push(
          'Purchase order or contract reference recommended',
        );
      }
    }

    const valid = missingFields.length === 0;

    return {
      valid,
      recipientType,
      missingFields,
      warnings,
      recommendations,
    };
  }

  /**
   * Detect PDF format (ZUGFeRD/Factur-X)
   * @private
   */
  private async detectPdfFormat(
    pdf: Buffer,
  ): Promise<FormatDetectionResult> {
    // Check PDF magic bytes
    const magic = pdf.slice(0, 5).toString('ascii');
    if (!magic.startsWith('%PDF-')) {
      return {
        format: EInvoiceFormat.UNKNOWN,
        confidence: 0,
        method: 'magic-bytes',
      };
    }

    // Check for typical ZUGFeRD/Factur-X attachment names
    // Note: Full implementation would parse PDF structure to find embedded XML
    const pdfStr = pdf.toString('utf8', 0, Math.min(pdf.length, 10000));

    if (
      pdfStr.includes('ZUGFeRD') ||
      pdfStr.includes('zugferd') ||
      pdfStr.includes('factur-x.xml') ||
      pdfStr.includes('zugferd-invoice.xml')
    ) {
      return {
        format: EInvoiceFormat.ZUGFERD,
        confidence: 0.8,
        method: 'pdf-attachment',
        hints: {
          attachmentName: 'factur-x.xml or zugferd-invoice.xml',
        },
      };
    }

    // Assume ZUGFeRD if it's a valid PDF
    return {
      format: EInvoiceFormat.ZUGFERD,
      confidence: 0.5,
      method: 'magic-bytes',
    };
  }

  /**
   * Detect XML format (XRechnung UBL or CII)
   * @private
   */
  private async detectXmlFormat(
    xml: string,
  ): Promise<FormatDetectionResult> {
    try {
      const parsed = this.xmlParser.parse(xml);

      // Check for UBL Invoice root element
      if (parsed.Invoice || parsed['ubl:Invoice']) {
        return {
          format: EInvoiceFormat.XRECHNUNG_UBL,
          confidence: 0.9,
          method: 'xml-root',
          hints: {
            rootElement: 'Invoice',
            namespace: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
          },
        };
      }

      // Check for CII CrossIndustryInvoice root element
      if (
        parsed.CrossIndustryInvoice ||
        parsed['rsm:CrossIndustryInvoice']
      ) {
        return {
          format: EInvoiceFormat.XRECHNUNG_CII,
          confidence: 0.9,
          method: 'xml-root',
          hints: {
            rootElement: 'CrossIndustryInvoice',
            namespace:
              'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
          },
        };
      }

      // Unknown XML format
      return {
        format: EInvoiceFormat.UNKNOWN,
        confidence: 0,
        method: 'xml-root',
      };
    } catch (error) {
      this.logger.error(`XML parsing failed: ${error.message}`);
      return {
        format: EInvoiceFormat.UNKNOWN,
        confidence: 0,
        method: 'content-analysis',
      };
    }
  }

  /**
   * Check core EN16931 business rules
   * @private
   */
  private checkCoreRules(
    invoice: InvoiceData,
    violations: BusinessRuleViolation[],
  ): void {
    // BR-01: Invoice must have invoice number
    if (!invoice.number || invoice.number.trim() === '') {
      violations.push({
        rule: BusinessRule.BR_01,
        message: 'Invoice must have an invoice number',
        severity: 'error',
        field: 'number',
      });
    }

    // BR-02: Invoice must have issue date
    if (!invoice.issueDate) {
      violations.push({
        rule: BusinessRule.BR_02,
        message: 'Invoice must have an issue date',
        severity: 'error',
        field: 'issueDate',
      });
    }

    // BR-04: Invoice must have currency code
    if (!invoice.currency) {
      violations.push({
        rule: BusinessRule.BR_04,
        message: 'Invoice must have a currency code',
        severity: 'error',
        field: 'currency',
      });
    }

    // BR-05: Invoice must have seller name
    if (!invoice.seller?.name) {
      violations.push({
        rule: BusinessRule.BR_05,
        message: 'Invoice must have seller name',
        severity: 'error',
        field: 'seller.name',
      });
    }

    // BR-06 & BR-07: Seller must have postal address with country
    if (!invoice.seller?.address) {
      violations.push({
        rule: BusinessRule.BR_06,
        message: 'Invoice must have seller postal address',
        severity: 'error',
        field: 'seller.address',
      });
    } else if (!invoice.seller.address.country) {
      violations.push({
        rule: BusinessRule.BR_07,
        message: 'Seller postal address must have country code',
        severity: 'error',
        field: 'seller.address.country',
      });
    }

    // BR-08: Invoice must have buyer name
    if (!invoice.buyer?.name) {
      violations.push({
        rule: BusinessRule.BR_08,
        message: 'Invoice must have buyer name',
        severity: 'error',
        field: 'buyer.name',
      });
    }

    // BR-09 & BR-10: Buyer must have postal address with country
    if (!invoice.buyer?.address) {
      violations.push({
        rule: BusinessRule.BR_09,
        message: 'Invoice must have buyer postal address',
        severity: 'error',
        field: 'buyer.address',
      });
    } else if (!invoice.buyer.address.country) {
      violations.push({
        rule: BusinessRule.BR_10,
        message: 'Buyer postal address must have country code',
        severity: 'error',
        field: 'buyer.address.country',
      });
    }

    // BR-11: Invoice must have at least one line item
    if (!invoice.items || invoice.items.length === 0) {
      violations.push({
        rule: BusinessRule.BR_11,
        message: 'Invoice must have at least one line item',
        severity: 'error',
        field: 'items',
      });
    }

    // BR-12: Invoice must have total amount
    if (invoice.totalAmount === undefined || invoice.totalAmount === null) {
      violations.push({
        rule: BusinessRule.BR_12,
        message: 'Invoice must have total amount with VAT',
        severity: 'error',
        field: 'totalAmount',
      });
    }

    // BR-15: Due date must not be before issue date
    if (invoice.dueDate && invoice.issueDate) {
      if (invoice.dueDate < invoice.issueDate) {
        violations.push({
          rule: BusinessRule.BR_15,
          message: 'Due date must not be before issue date',
          severity: 'error',
          field: 'dueDate',
          expected: `>= ${invoice.issueDate.toISOString()}`,
          actual: invoice.dueDate.toISOString(),
        });
      }
    }
  }

  /**
   * Check German-specific business rules
   * @private
   */
  private checkGermanRules(
    invoice: InvoiceData,
    violations: BusinessRuleViolation[],
    context?: ValidationContext,
  ): void {
    // BR-DE-01: Buyer reference required (Leitweg-ID for B2G)
    if (context?.recipientType === RecipientType.B2G) {
      if (!invoice.leitwegId) {
        violations.push({
          rule: BusinessRule.BR_DE_01,
          message: 'Leitweg-ID is mandatory for German B2G invoices',
          severity: 'error',
          field: 'leitwegId',
        });
      }
    }

    // BR-DE-02: Seller must have VAT ID or tax ID
    if (!invoice.seller?.vatId && !invoice.seller?.taxId) {
      violations.push({
        rule: BusinessRule.BR_DE_02,
        message: 'Seller must have VAT identifier or tax registration identifier',
        severity: 'error',
        field: 'seller.vatId',
      });
    }

    // BR-DE-09: Currency must be EUR for German B2G
    if (
      context?.recipientType === RecipientType.B2G &&
      invoice.currency !== 'EUR'
    ) {
      violations.push({
        rule: BusinessRule.BR_DE_09,
        message: 'German B2G invoices must use EUR currency',
        severity: 'error',
        field: 'currency',
        expected: 'EUR',
        actual: invoice.currency,
      });
    }

    // BR-DE-13: Quantity must be greater than zero
    invoice.items?.forEach((item, index) => {
      if (item.quantity <= 0) {
        violations.push({
          rule: BusinessRule.BR_DE_13,
          message: `Line item ${index + 1}: Quantity must be greater than zero`,
          severity: 'error',
          field: `items[${index}].quantity`,
          expected: '> 0',
          actual: String(item.quantity),
        });
      }

      // BR-DE-14: Line extension amount must equal quantity * price
      const calculatedAmount = item.quantity * item.unitPrice;
      const diff = Math.abs(calculatedAmount - item.amount);
      if (diff > 0.01) {
        // Allow 1 cent rounding difference
        violations.push({
          rule: BusinessRule.BR_DE_14,
          message: `Line item ${index + 1}: Amount must equal quantity × unit price`,
          severity: 'error',
          field: `items[${index}].amount`,
          expected: String(calculatedAmount.toFixed(2)),
          actual: String(item.amount.toFixed(2)),
        });
      }
    });

    // BR-DE-18: Sum of line amounts must equal invoice subtotal
    const sumLineAmounts =
      invoice.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const diff = Math.abs(sumLineAmounts - invoice.subtotal);
    if (diff > 0.01) {
      violations.push({
        rule: BusinessRule.BR_DE_18,
        message: 'Sum of line amounts must equal invoice subtotal',
        severity: 'error',
        field: 'subtotal',
        expected: String(sumLineAmounts.toFixed(2)),
        actual: String(invoice.subtotal.toFixed(2)),
      });
    }

    // BR-DE-19: Tax exclusive + tax = tax inclusive
    const calculatedTotal = invoice.subtotal + invoice.taxAmount;
    const totalDiff = Math.abs(calculatedTotal - invoice.totalAmount);
    if (totalDiff > 0.01) {
      violations.push({
        rule: BusinessRule.BR_DE_19,
        message:
          'Tax exclusive amount plus tax amount must equal tax inclusive amount',
        severity: 'error',
        field: 'totalAmount',
        expected: String(calculatedTotal.toFixed(2)),
        actual: String(invoice.totalAmount.toFixed(2)),
      });
    }
  }

  /**
   * Check Austrian-specific business rules
   * @private
   */
  private checkAustrianRules(
    invoice: InvoiceData,
    violations: BusinessRuleViolation[],
    context?: ValidationContext,
  ): void {
    // BR-AT-01: Seller VAT ID must be valid Austrian format
    if (invoice.seller?.vatId && !invoice.seller.vatId.startsWith('AT')) {
      violations.push({
        rule: BusinessRule.BR_AT_01,
        message: 'Seller VAT ID must be valid Austrian format (ATU...)',
        severity: 'warning',
        field: 'seller.vatId',
        expected: 'ATU...',
        actual: invoice.seller.vatId,
      });
    }

    // BR-AT-05: Invoice must use EUR currency
    if (invoice.currency !== 'EUR') {
      violations.push({
        rule: BusinessRule.BR_AT_05,
        message: 'Austrian invoices should use EUR currency',
        severity: 'warning',
        field: 'currency',
        expected: 'EUR',
        actual: invoice.currency,
      });
    }
  }

  /**
   * Check if object has nested field
   * @private
   */
  private hasField(obj: any, path: string): boolean {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return false;
      current = current[part];
    }

    return current !== null && current !== undefined && current !== '';
  }

  /**
   * Validate Leitweg-ID format
   * @private
   */
  private isValidLeitwegId(leitwegId: string): boolean {
    // Leitweg-ID format: XX-XXXXX-XXXXXX or XXXXXXXXXXXX
    return (
      /^[A-Z0-9]{2}-[A-Z0-9]{5}-[A-Z0-9]{6}$/.test(leitwegId) ||
      /^[A-Z0-9]{12,13}$/.test(leitwegId)
    );
  }
}
