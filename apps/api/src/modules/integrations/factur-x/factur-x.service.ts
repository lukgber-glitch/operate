import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { PeppolService } from '../peppol/peppol.service';
import { ZugferdService } from '../../e-invoice/services/zugferd.service';
import { FacturXGeneratorService } from './services/factur-x-generator.service';
import { FacturXParserService } from './services/factur-x-parser.service';
import { FacturXValidatorService } from './services/factur-x-validator.service';
import { FacturXPdfService } from './services/factur-x-pdf.service';
import {
  FacturXInvoiceData,
  FacturXProfile,
  FacturXGenerationOptions,
  FacturXValidationResult,
  FacturXParseResult,
  FacturXTransmissionResult,
  FacturXPeppolOptions,
} from './types/factur-x.types';

/**
 * Factur-X Service (France)
 *
 * Main service for French electronic invoicing using the Factur-X standard.
 *
 * Features:
 * - Generate Factur-X compliant invoices (EN 16931)
 * - Create hybrid PDF/A-3 + XML format
 * - Support all 3 profiles: MINIMUM, BASIC, EN16931
 * - Parse incoming Factur-X documents
 * - French-specific validations (SIRET, TVA)
 * - Integration with Peppol for transmission
 * - Chorus Pro support (French B2G)
 *
 * Standards:
 * - EN 16931-1:2017 (European e-invoicing)
 * - Cross Industry Invoice D16B (CII)
 * - PDF/A-3 (ISO 19005-3)
 * - French tax regulations
 */
@Injectable()
export class FacturXService {
  private readonly logger = new Logger(FacturXService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly peppolService: PeppolService,
    private readonly zugferdService: ZugferdService,
    private readonly generatorService: FacturXGeneratorService,
    private readonly parserService: FacturXParserService,
    private readonly validatorService: FacturXValidatorService,
    private readonly pdfService: FacturXPdfService,
  ) {
    this.logger.log('Factur-X Service initialized');
  }

  /**
   * Generate complete Factur-X invoice (PDF/A-3 with embedded XML)
   */
  async generateFacturXInvoice(
    invoice: FacturXInvoiceData,
    options?: FacturXGenerationOptions,
  ): Promise<Buffer> {
    const startTime = Date.now();

    try {
      this.logger.log(`Generating Factur-X invoice ${invoice.number}`);

      const profile = options?.profile || FacturXProfile.EN16931;

      // Validate invoice data
      if (options?.validateSIRET !== false || options?.validateTVA !== false) {
        const validation = await this.validateInvoice(invoice);
        if (!validation.valid) {
          throw new BadRequestException({
            message: 'Invoice validation failed',
            errors: validation.errors,
          });
        }
      }

      // Generate XML
      const xml = await this.generatorService.generateXml(invoice, profile);

      // Generate PDF with embedded XML
      const pdfBuffer = await this.pdfService.createPdfWithEmbeddedXml(
        xml,
        profile,
        options?.pdfTemplate,
        invoice,
      );

      this.logger.log(
        `Successfully generated Factur-X invoice ${invoice.number} (${Date.now() - startTime}ms)`,
      );

      return pdfBuffer;
    } catch (error) {
      this.logger.error(
        `Failed to generate Factur-X invoice: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate only the XML part (without PDF)
   */
  async generateXmlOnly(
    invoice: FacturXInvoiceData,
    profile: FacturXProfile = FacturXProfile.EN16931,
  ): Promise<string> {
    try {
      this.logger.log(`Generating Factur-X XML for invoice ${invoice.number}`);

      // Validate
      const validation = await this.validateInvoice(invoice);
      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Invoice validation failed',
          errors: validation.errors,
        });
      }

      // Generate XML
      const xml = await this.generatorService.generateXml(invoice, profile);

      this.logger.log(
        `Successfully generated XML for invoice ${invoice.number}`,
      );
      return xml;
    } catch (error) {
      this.logger.error(`Failed to generate XML: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Parse Factur-X PDF to extract invoice data
   */
  async parseFacturXPdf(pdf: Buffer): Promise<FacturXParseResult> {
    try {
      this.logger.log('Parsing Factur-X PDF');

      // Extract XML from PDF
      const xml = await this.pdfService.extractXmlFromPdf(pdf);
      if (!xml) {
        return {
          success: false,
          errors: [
            {
              code: 'NO_XML',
              message: 'No Factur-X XML found in PDF',
              severity: 'error',
            },
          ],
        };
      }

      // Parse XML
      const result = await this.parserService.parseXml(xml);

      this.logger.log('Successfully parsed Factur-X PDF');
      return result;
    } catch (error) {
      this.logger.error(`Failed to parse PDF: ${error.message}`, error.stack);
      return {
        success: false,
        errors: [
          {
            code: 'PARSE_ERROR',
            message: error.message,
            severity: 'error',
          },
        ],
      };
    }
  }

  /**
   * Parse Factur-X XML to extract invoice data
   */
  async parseFacturXXml(xml: string): Promise<FacturXParseResult> {
    try {
      this.logger.log('Parsing Factur-X XML');
      return await this.parserService.parseXml(xml);
    } catch (error) {
      this.logger.error(`Failed to parse XML: ${error.message}`, error.stack);
      return {
        success: false,
        errors: [
          {
            code: 'PARSE_ERROR',
            message: error.message,
            severity: 'error',
          },
        ],
      };
    }
  }

  /**
   * Validate Factur-X invoice data
   */
  async validateInvoice(
    invoice: FacturXInvoiceData,
  ): Promise<FacturXValidationResult> {
    return await this.validatorService.validateInvoice(invoice);
  }

  /**
   * Validate Factur-X PDF compliance
   */
  async validateFacturXPdf(pdf: Buffer): Promise<FacturXValidationResult> {
    try {
      this.logger.log('Validating Factur-X PDF');

      // Check PDF/A-3 compliance
      const pdfCompliance =
        await this.pdfService.validatePdfA3Compliance(pdf);

      const errors = pdfCompliance.issues.map((issue) => ({
        code: 'PDF_COMPLIANCE',
        message: issue,
        severity: 'error' as const,
      }));

      // Extract and validate XML
      const xml = await this.pdfService.extractXmlFromPdf(pdf);
      if (xml) {
        const parseResult = await this.parserService.parseXml(xml);
        if (parseResult.success && parseResult.invoice) {
          const invoiceValidation = await this.validateInvoice(
            parseResult.invoice,
          );
          errors.push(...invoiceValidation.errors);
        }
      }

      return {
        valid: errors.length === 0 && pdfCompliance.compliant,
        errors,
        warnings: [],
        metadata: {
          hasEmbeddedXml: xml !== null,
          isPdfA3: pdfCompliance.compliant,
          xmlValidated: xml !== null,
          frenchComplianceChecked: true,
        },
      };
    } catch (error) {
      this.logger.error(
        `Validation failed: ${error.message}`,
        error.stack,
      );
      return {
        valid: false,
        errors: [
          {
            code: 'VALIDATION_ERROR',
            message: error.message,
            severity: 'error',
          },
        ],
        warnings: [],
        metadata: {
          hasEmbeddedXml: false,
          isPdfA3: false,
          xmlValidated: false,
          frenchComplianceChecked: false,
        },
      };
    }
  }

  /**
   * Send Factur-X invoice via Peppol
   */
  async sendViaPeppol(
    invoice: FacturXInvoiceData,
    options: FacturXPeppolOptions,
  ): Promise<FacturXTransmissionResult> {
    try {
      this.logger.log(
        `Sending Factur-X invoice ${invoice.number} via Peppol`,
      );

      if (!options.recipientParticipantId || !options.recipientScheme) {
        throw new BadRequestException(
          'Recipient Peppol participant ID and scheme are required',
        );
      }

      // Generate Factur-X invoice
      const facturXPdf = await this.generateFacturXInvoice(invoice, {
        profile: FacturXProfile.EN16931,
        validateSIRET: true,
        validateTVA: true,
      });

      // Generate XML for Peppol (UBL format)
      // Note: Peppol uses UBL, not CII. We need to convert or generate UBL separately
      // For now, we'll use the existing Peppol service which handles UBL generation

      // Map to Peppol format
      const peppolDto = this.mapFacturXToPeppol(invoice, options);

      // Send via Peppol
      const peppolResult = await this.peppolService.sendDocument(peppolDto);

      this.logger.log(
        `Successfully sent Factur-X invoice ${invoice.number} via Peppol`,
      );

      return {
        success: true,
        peppolMessageId: peppolResult.messageId,
        status: peppolResult.status as any,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send via Peppol: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        status: 'FAILED',
        timestamp: new Date(),
        errors: [error.message],
      };
    }
  }

  /**
   * Generate Factur-X using ZUGFeRD service (alternative method)
   *
   * Since Factur-X and ZUGFeRD are essentially the same standard,
   * we can leverage the existing ZUGFeRD service.
   */
  async generateUsingZugferd(
    invoice: FacturXInvoiceData,
    profile: FacturXProfile = FacturXProfile.EN16931,
  ): Promise<Buffer> {
    try {
      this.logger.log(
        `Generating Factur-X invoice ${invoice.number} using ZUGFeRD service`,
      );

      // Map Factur-X profile to ZUGFeRD profile
      const zugferdProfile = this.mapFacturXToZugferdProfile(profile);

      // Map invoice data to ZUGFeRD format
      const zugferdInvoice = this.mapFacturXToZugferd(invoice);

      // Generate using ZUGFeRD service
      const pdfBuffer = await this.zugferdService.generateZugferdInvoice(
        zugferdInvoice,
        zugferdProfile,
      );

      this.logger.log(
        `Successfully generated Factur-X invoice ${invoice.number} using ZUGFeRD`,
      );

      return pdfBuffer;
    } catch (error) {
      this.logger.error(
        `Failed to generate using ZUGFeRD: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Map Factur-X profile to ZUGFeRD profile
   */
  private mapFacturXToZugferdProfile(profile: FacturXProfile): any {
    // Import ZugferdProfile enum
    const { ZugferdProfile } = require('../../e-invoice/types/zugferd.types');

    switch (profile) {
      case FacturXProfile.MINIMUM:
        return ZugferdProfile.MINIMUM;
      case FacturXProfile.BASIC_WL:
        return ZugferdProfile.BASIC_WL;
      case FacturXProfile.BASIC:
        return ZugferdProfile.BASIC;
      case FacturXProfile.EN16931:
        return ZugferdProfile.EN16931;
      case FacturXProfile.EXTENDED:
        return ZugferdProfile.EXTENDED;
      default:
        return ZugferdProfile.EN16931;
    }
  }

  /**
   * Map Factur-X invoice to ZUGFeRD format
   */
  private mapFacturXToZugferd(invoice: FacturXInvoiceData): any {
    return {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate || invoice.issueDate,
      type: this.mapInvoiceType(invoice.type),
      currency: invoice.currency,
      seller: {
        name: invoice.seller.name,
        address: {
          line1: invoice.seller.address.line1,
          line2: invoice.seller.address.line2,
          city: invoice.seller.address.city,
          postalCode: invoice.seller.address.postalCode,
          country: invoice.seller.address.country,
        },
        vatId: invoice.seller.identifiers?.tva,
        taxId: invoice.seller.identifiers?.siret,
        email: invoice.seller.contact?.email,
        phone: invoice.seller.contact?.phone,
      },
      buyer: {
        name: invoice.buyer.name,
        address: {
          line1: invoice.buyer.address.line1,
          line2: invoice.buyer.address.line2,
          city: invoice.buyer.address.city,
          postalCode: invoice.buyer.address.postalCode,
          country: invoice.buyer.address.country,
        },
        vatId: invoice.buyer.identifiers?.tva,
        email: invoice.buyer.contact?.email,
        phone: invoice.buyer.contact?.phone,
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.netAmount,
        taxRate: item.vat.rate,
        taxAmount: item.vat.amount,
        unit: item.unit,
        productCode: item.productCode,
      })),
      subtotal: invoice.subtotal,
      taxAmount: invoice.totalVAT,
      totalAmount: invoice.totalAmount,
      paymentTerms: invoice.paymentTerms,
      notes: invoice.notes,
    };
  }

  /**
   * Map invoice type
   */
  private mapInvoiceType(type: any): string {
    if (type.toString().includes('381')) return 'CREDIT_NOTE';
    if (type.toString().includes('383')) return 'DEBIT_NOTE';
    return 'STANDARD';
  }

  /**
   * Map Factur-X to Peppol format
   */
  private mapFacturXToPeppol(
    invoice: FacturXInvoiceData,
    options: FacturXPeppolOptions,
  ): any {
    // This is a simplified mapping - full implementation would need complete UBL mapping
    return {
      organizationId: 'org-id', // Would come from context
      documentType: 'Invoice',
      invoiceNumber: invoice.number,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString(),
      currency: invoice.currency,
      supplier: {
        participantId: {
          scheme: options.recipientScheme || '0002',
          identifier: invoice.seller.identifiers?.siret || '',
        },
        name: invoice.seller.name,
        address: {
          streetName: invoice.seller.address.line1,
          cityName: invoice.seller.address.city,
          postalZone: invoice.seller.address.postalCode,
          countryCode: invoice.seller.address.country,
        },
        vatId: invoice.seller.identifiers?.tva,
      },
      customer: {
        participantId: {
          scheme: options.recipientScheme,
          identifier: options.recipientParticipantId,
        },
        name: invoice.buyer.name,
        address: {
          streetName: invoice.buyer.address.line1,
          cityName: invoice.buyer.address.city,
          postalZone: invoice.buyer.address.postalCode,
          countryCode: invoice.buyer.address.country,
        },
        vatId: invoice.buyer.identifiers?.tva,
      },
      lines: invoice.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitCode: item.unit,
        description: item.description,
        priceAmount: item.unitPrice,
        lineExtensionAmount: item.netAmount,
        taxPercent: item.vat.rate,
        taxAmount: item.vat.amount,
      })),
      taxTotal: invoice.totalVAT,
      totalAmount: invoice.totalAmount,
    };
  }
}
