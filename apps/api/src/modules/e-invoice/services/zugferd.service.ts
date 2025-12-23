import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { Invoice, InvoiceService } from '@e-invoice-eu/core';
import {
  InvoiceData,
  ZugferdProfile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ZugferdGenerationOptions,
  ZugferdExtractionOptions,
} from '../types/zugferd.types';

/**
 * ZUGFeRD/Factur-X Service
 *
 * Generates and validates ZUGFeRD/Factur-X compliant invoices.
 * ZUGFeRD is a hybrid invoice format that embeds structured XML data
 * inside a PDF/A-3 file for both human and machine readability.
 *
 * Supported Profiles:
 * - MINIMUM: Basic invoice data
 * - BASIC: Standard B2B invoices
 * - BASIC_WL: Basic Without Lines
 * - EN16931: Full European standard (recommended for DACH)
 * - EXTENDED: Extended information
 * - XRECHNUNG: German B2G compliance
 *
 * Note: This service uses @e-invoice-eu/core which requires complex UBL/CII
 * structured data. For production use, consider using a dedicated mapper
 * or manual XML generation for simpler implementation.
 */
@Injectable()
export class ZugferdService {
  private readonly logger = new Logger(ZugferdService.name);
  private readonly xmlParser: XMLParser;
  private readonly xmlBuilder: XMLBuilder;
  private readonly invoiceService: InvoiceService;

  constructor() {
    // Initialize XML parser with ZUGFeRD-compatible options
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      trimValues: true,
    });

    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      suppressEmptyNode: true,
    });

    // Initialize InvoiceService with logger
    this.invoiceService = new InvoiceService(this.logger);
  }

  /**
   * Generate ZUGFeRD/Factur-X PDF with embedded XML
   *
   * @param invoice - Invoice data to convert
   * @param profile - ZUGFeRD profile level
   * @param existingPdf - Optional existing PDF to embed XML into
   * @returns Buffer containing the ZUGFeRD PDF
   */
  async generateZugferdInvoice(
    invoice: InvoiceData,
    profile: ZugferdProfile = ZugferdProfile.EN16931,
    existingPdf?: Buffer,
  ): Promise<Buffer> {
    try {
      this.logger.log(
        `Generating ZUGFeRD invoice ${invoice.number} with profile ${profile}`,
      );

      // Map our internal format to UBL Invoice format
      const ublInvoice = this.mapToUBLInvoice(invoice);

      // Get format name for the profile
      const format = this.getFormatName(profile);

      // Generate the ZUGFeRD PDF with embedded XML
      const result = await this.invoiceService.generate(ublInvoice, {
        format,
        lang: 'de-DE',
        pdf: existingPdf
          ? {
              buffer: existingPdf,
              filename: `${invoice.number}.pdf`,
              mimetype: 'application/pdf',
            }
          : undefined,
      });

      // Convert result to Buffer
      const buffer =
        result instanceof Uint8Array
          ? Buffer.from(result)
          : Buffer.from(result as string, 'utf-8');

      this.logger.log(
        `Successfully generated ZUGFeRD invoice ${invoice.number}`,
      );

      return buffer;
    } catch (error) {
      this.logger.error(
        `Failed to generate ZUGFeRD invoice: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `ZUGFeRD generation failed: ${error.message}`,
      );
    }
  }

  /**
   * Extract XML from existing ZUGFeRD PDF
   *
   * @param pdf - PDF buffer to extract from
   * @param options - Extraction options
   * @returns Extracted XML as string
   */
  async extractXmlFromPdf(
    pdf: Buffer,
    options?: ZugferdExtractionOptions,
  ): Promise<string> {
    try {
      this.logger.log('Extracting XML from ZUGFeRD PDF');

      // Note: Full PDF embedded file extraction requires complex PDF parsing
      // For production, consider using node-zugferd library or pdf-parse
      this.logger.warn(
        'XML extraction from PDF structure not yet fully implemented',
      );

      throw new Error(
        'Direct XML extraction requires more robust PDF parsing - use node-zugferd library',
      );
    } catch (error) {
      this.logger.error(
        `Failed to extract XML from PDF: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `XML extraction failed: ${error.message}`,
      );
    }
  }

  /**
   * Validate ZUGFeRD PDF compliance
   *
   * @param pdf - PDF buffer to validate
   * @returns Validation result with errors and warnings
   */
  async validateZugferdPdf(pdf: Buffer): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let hasEmbeddedXml = false;
    let isPdfA3 = false;
    let xmlValidated = false;
    let detectedProfile: ZugferdProfile | undefined;

    try {
      this.logger.log('Validating ZUGFeRD PDF');

      const pdfDoc = await PDFDocument.load(pdf);

      // Basic PDF structure validation
      const pageCount = pdfDoc.getPageCount();
      if (pageCount === 0) {
        errors.push({
          code: 'INVALID_PDF',
          message: 'PDF contains no pages',
          severity: 'error',
        });
      }

      // Note: Full validation would require:
      // 1. PDF/A-3 compliance checking
      // 2. Embedded XML extraction and validation
      // 3. Profile detection from XML content

      warnings.push({
        code: 'PARTIAL_VALIDATION',
        message: 'Full ZUGFeRD validation not yet implemented',
        severity: 'warning',
      });

      const valid = errors.length === 0;

      this.logger.log(
        `Validation complete: ${valid ? 'VALID' : 'INVALID'} (${errors.length} errors, ${warnings.length} warnings)`,
      );

      return {
        valid,
        errors,
        warnings,
        profile: detectedProfile,
        metadata: {
          hasEmbeddedXml,
          isPdfA3,
          xmlValidated,
        },
      };
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`, error.stack);
      errors.push({
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${error.message}`,
        severity: 'error',
      });

      return {
        valid: false,
        errors,
        warnings,
        metadata: {
          hasEmbeddedXml,
          isPdfA3,
          xmlValidated,
        },
      };
    }
  }

  /**
   * Generate just the XML part without PDF
   *
   * @param invoice - Invoice data
   * @param profile - ZUGFeRD profile
   * @returns XML string
   */
  async generateXml(
    invoice: InvoiceData,
    profile: ZugferdProfile = ZugferdProfile.EN16931,
  ): Promise<string> {
    try {
      this.logger.log(
        `Generating ZUGFeRD XML for invoice ${invoice.number} with profile ${profile}`,
      );

      const ublInvoice = this.mapToUBLInvoice(invoice);
      const format = this.getFormatName(profile);

      // Generate without PDF (XML only)
      const result = await this.invoiceService.generate(ublInvoice, {
        format,
        lang: 'de-DE',
        pdf: undefined,
      });

      const xml =
        typeof result === 'string'
          ? result
          : Buffer.from(result as Uint8Array).toString('utf-8');

      this.logger.log(
        `Successfully generated XML for invoice ${invoice.number}`,
      );

      return xml;
    } catch (error) {
      this.logger.error(
        `Failed to generate XML: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`XML generation failed: ${error.message}`);
    }
  }

  /**
   * Map internal invoice format to UBL Invoice format
   *
   * This is a simplified mapping. For production use, a complete
   * mapping to the UBL/CII structure is required.
   *
   * @param invoice - Internal invoice data
   * @returns UBL Invoice object
   */
  private mapToUBLInvoice(invoice: InvoiceData): Invoice {
    // Build UBL-compliant Invoice structure
    // This is a minimal implementation - full UBL mapping is extensive
    const currency = (invoice.currency || 'EUR') as any;
    const invoiceTypeCode = this.getInvoiceTypeCode(invoice.type) as any;
    const sellerCountryCode = this.normalizeCountryCode(
      invoice.seller.address?.country || 'DE',
    ) as any;
    const buyerCountryCode = this.normalizeCountryCode(
      invoice.buyer.address?.country || 'DE',
    ) as any;

    const ublInvoice: Invoice = {
      'ubl:Invoice': {
        'cbc:ID': invoice.number,
        'cbc:IssueDate': invoice.issueDate.toISOString().split('T')[0],
        'cbc:InvoiceTypeCode': invoiceTypeCode,
        'cbc:DocumentCurrencyCode': currency,

        'cac:AccountingSupplierParty': {
          'cac:Party': {
            'cbc:EndpointID': invoice.seller.email || '',
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.seller.address?.line1 || '',
              'cbc:CityName': invoice.seller.address?.city || '',
              'cbc:PostalZone': invoice.seller.address?.postalCode || '',
              'cac:Country': {
                'cbc:IdentificationCode': sellerCountryCode,
              },
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': invoice.seller.name,
            },
          },
        },

        'cac:AccountingCustomerParty': {
          'cac:Party': {
            'cbc:EndpointID': invoice.buyer.email || '',
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.buyer.address?.line1 || '',
              'cbc:CityName': invoice.buyer.address?.city || '',
              'cbc:PostalZone': invoice.buyer.address?.postalCode || '',
              'cac:Country': {
                'cbc:IdentificationCode': buyerCountryCode,
              },
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': invoice.buyer.name,
            },
          },
        },

        'cac:TaxTotal': [
          {
            'cbc:TaxAmount': invoice.taxAmount.toString(),
            'cbc:TaxAmount@currencyID': currency,
          },
        ],

        'cac:LegalMonetaryTotal': {
          'cbc:LineExtensionAmount': invoice.subtotal.toString(),
          'cbc:LineExtensionAmount@currencyID': currency,
          'cbc:TaxExclusiveAmount': invoice.subtotal.toString(),
          'cbc:TaxExclusiveAmount@currencyID': currency,
          'cbc:TaxInclusiveAmount': invoice.totalAmount.toString(),
          'cbc:TaxInclusiveAmount@currencyID': currency,
          'cbc:PayableAmount': invoice.totalAmount.toString(),
          'cbc:PayableAmount@currencyID': currency,
        },

        'cac:InvoiceLine': invoice.items.map((item, index) => ({
          'cbc:ID': (index + 1).toString(),
          'cbc:InvoicedQuantity': item.quantity.toString(),
          'cbc:InvoicedQuantity@unitCode': item.unit || 'C62',
          'cbc:LineExtensionAmount': item.amount.toString(),
          'cbc:LineExtensionAmount@currencyID': currency,
          'cac:Item': {
            'cbc:Name': item.description,
          },
          'cac:Price': {
            'cbc:PriceAmount': item.unitPrice.toString(),
            'cbc:PriceAmount@currencyID': currency,
          },
        })) as any,
      },
    };

    return ublInvoice;
  }

  /**
   * Get format name for ZUGFeRD profile
   *
   * @param profile - ZUGFeRD profile
   * @returns Format name string for InvoiceService
   */
  private getFormatName(profile: ZugferdProfile): string {
    // Map our profile enum to the format names used by @e-invoice-eu/core
    switch (profile) {
      case ZugferdProfile.MINIMUM:
        return 'Factur-X-Minimum';
      case ZugferdProfile.BASIC:
        return 'Factur-X-Basic';
      case ZugferdProfile.BASIC_WL:
        return 'Factur-X-Basic-WL';
      case ZugferdProfile.EN16931:
        return 'Factur-X-EN16931';
      case ZugferdProfile.EXTENDED:
        return 'Factur-X-Extended';
      case ZugferdProfile.XRECHNUNG:
        return 'Factur-X-XRechnung';
      default:
        this.logger.warn(
          `Unknown profile ${profile}, defaulting to Factur-X-EN16931`,
        );
        return 'Factur-X-EN16931';
    }
  }

  /**
   * Get invoice type code for ZUGFeRD
   *
   * @param type - Internal invoice type
   * @returns ZUGFeRD type code
   */
  private getInvoiceTypeCode(type?: string): string {
    switch (type) {
      case 'CREDIT_NOTE':
        return '381'; // Credit note
      case 'DEBIT_NOTE':
        return '383'; // Debit note
      case 'STANDARD':
      default:
        return '380'; // Commercial invoice
    }
  }

  /**
   * Normalize country code to ISO 3166-1 alpha-2
   *
   * @param country - Country name or code
   * @returns ISO 3166-1 alpha-2 code
   */
  private normalizeCountryCode(country: string): string {
    // Simple normalization - expand as needed
    const normalized = country.toUpperCase().trim();

    // Already a 2-letter code
    if (normalized.length === 2) {
      return normalized;
    }

    // Common mappings
    const countryMap: Record<string, string> = {
      GERMANY: 'DE',
      DEUTSCHLAND: 'DE',
      AUSTRIA: 'AT',
      ÖSTERREICH: 'AT',
      SWITZERLAND: 'CH',
      SCHWEIZ: 'CH',
      FRANCE: 'FR',
      FRANKREICH: 'FR',
      'UNITED KINGDOM': 'GB',
      UK: 'GB',
      NETHERLANDS: 'NL',
      NIEDERLANDE: 'NL',
      BELGIUM: 'BE',
      BELGIEN: 'BE',
    };

    return countryMap[normalized] || normalized.substring(0, 2);
  }
}
