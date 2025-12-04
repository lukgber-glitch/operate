import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { Builder } from 'xml2js';
import {
  PeppolParticipantId,
  PeppolDocumentId,
  PeppolProcessId,
  PeppolDocumentType,
  AS4Message,
  AS4Receipt,
  UBLInvoice,
  PeppolValidationResult,
  PeppolValidationError,
  PeppolTransmission,
  PeppolMessageStatus,
  PeppolConfig,
  PeppolAuditAction,
} from './types/peppol.types';
import { PeppolCertificateService } from './services/peppol-certificate.service';
import { PeppolParticipantService } from './services/peppol-participant.service';
import { PeppolMessageService } from './services/peppol-message.service';
import { SendDocumentDto } from './dto';

/**
 * Peppol Integration Service
 * Main orchestrator for Peppol e-invoicing and document exchange
 *
 * Features:
 * - Send invoices via Peppol network
 * - Receive documents from Peppol network
 * - UBL document generation
 * - Participant validation and SMP lookup
 * - Message acknowledgment handling
 */
@Injectable()
export class PeppolService {
  private readonly logger = new Logger(PeppolService.name);
  private readonly config: PeppolConfig;
  private readonly xmlBuilder: Builder;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly certificateService: PeppolCertificateService,
    private readonly participantService: PeppolParticipantService,
    private readonly messageService: PeppolMessageService,
  ) {
    this.config = {
      accessPointUrl: this.configService.get<string>('PEPPOL_ACCESS_POINT_URL') || '',
      participantId: this.configService.get<string>('PEPPOL_PARTICIPANT_ID') || '',
      certificatePath: this.configService.get<string>('PEPPOL_CERTIFICATE_PATH') || '',
      privateKeyPath: this.configService.get<string>('PEPPOL_PRIVATE_KEY_PATH') || '',
      certificatePassword: this.configService.get<string>('PEPPOL_CERTIFICATE_PASSWORD') || '',
      smlDomain: this.configService.get<string>('PEPPOL_SML_DOMAIN') || 'isml.peppol.eu',
      environment: (this.configService.get<string>('PEPPOL_ENVIRONMENT') || 'test') as 'production' | 'test',
      mockMode: this.configService.get<string>('PEPPOL_MOCK_MODE') === 'true',
      tlsMinVersion: 'TLSv1.3',
      certificatePinning: this.configService.get<string>('PEPPOL_CERTIFICATE_PINNING') !== 'false',
    };

    // Initialize XML builder
    this.xmlBuilder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' },
    });

    this.logger.log(
      `Peppol Service initialized (${this.config.environment} mode, Mock: ${this.config.mockMode})`,
    );
  }

  /**
   * Send document via Peppol network
   */
  async sendDocument(dto: SendDocumentDto): Promise<{ messageId: string; status: string }> {
    const startTime = Date.now();

    try {
      this.logger.log('Sending Peppol document', {
        organizationId: dto.organizationId,
        documentType: dto.documentType,
        invoiceNumber: dto.invoiceNumber,
        customer: dto.customer.participantId,
      });

      // Validate customer participant ID
      const customerParticipantId = this.participantService.validateParticipantId(
        dto.customer.participantId.scheme,
        dto.customer.participantId.identifier,
      );

      // Validate supplier participant ID
      const supplierParticipantId = this.participantService.validateParticipantId(
        dto.supplier.participantId.scheme,
        dto.supplier.participantId.identifier,
      );

      // Generate UBL document
      const ublDocument = this.generateUBLInvoice(dto);

      // Validate UBL document
      const validation = this.validateUBLDocument(ublDocument);
      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Document validation failed',
          errors: validation.errors,
        });
      }

      // Convert UBL to XML
      const ublXml = this.convertUBLToXML(ublDocument);

      // Lookup customer endpoint via SMP
      const documentId: PeppolDocumentId = {
        scheme: 'busdox-docid-qns',
        identifier:
          'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1',
      };

      const endpoint = await this.participantService.lookupEndpoint(
        customerParticipantId,
        documentId,
      );

      // Create AS4 message
      const message: AS4Message = {
        messageId: uuidv4(),
        conversationId: uuidv4(),
        timestamp: new Date(),
        from: supplierParticipantId,
        to: customerParticipantId,
        documentId,
        processId: {
          scheme: 'cenbii-procid-ubl',
          identifier: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
        },
        payload: ublXml,
      };

      // Send message
      const messageId = await this.messageService.sendMessage(
        dto.organizationId,
        message,
        endpoint,
      );

      this.logger.log('Peppol document sent successfully', {
        messageId,
        invoiceNumber: dto.invoiceNumber,
        duration: Date.now() - startTime,
      });

      return {
        messageId,
        status: 'SENT',
      };
    } catch (error) {
      this.logger.error('Failed to send Peppol document', {
        error: error.message,
        organizationId: dto.organizationId,
        invoiceNumber: dto.invoiceNumber,
      });
      throw error;
    }
  }

  /**
   * Receive document from Peppol network (webhook handler)
   */
  async receiveDocument(
    organizationId: string,
    soapEnvelope: string,
  ): Promise<AS4Receipt> {
    try {
      this.logger.log('Receiving Peppol document', { organizationId });

      const receipt = await this.messageService.receiveMessage(
        organizationId,
        soapEnvelope,
      );

      return receipt;
    } catch (error) {
      this.logger.error('Failed to receive Peppol document', error);
      throw error;
    }
  }

  /**
   * Validate participant (check if participant exists in Peppol network)
   */
  async validateParticipant(
    scheme: string,
    identifier: string,
  ): Promise<{ valid: boolean; participantId?: PeppolParticipantId }> {
    try {
      const participantId = this.participantService.validateParticipantId(
        scheme,
        identifier,
      );

      // Lookup participant in SMP
      const smpResponse = await this.participantService.lookupParticipant(participantId);

      return {
        valid: smpResponse.documentTypes.length > 0,
        participantId,
      };
    } catch (error) {
      this.logger.error('Participant validation failed', error);
      return { valid: false };
    }
  }

  /**
   * Get transmission history
   */
  async getTransmissions(
    organizationId: string,
    limit: number = 50,
  ): Promise<PeppolTransmission[]> {
    const transmissions = await this.prisma.$queryRaw<PeppolTransmission[]>`
      SELECT * FROM peppol_transmissions
      WHERE organization_id = ${organizationId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return transmissions;
  }

  /**
   * Get transmission by message ID
   */
  async getTransmission(messageId: string): Promise<PeppolTransmission | null> {
    const result = await this.prisma.$queryRaw<PeppolTransmission[]>`
      SELECT * FROM peppol_transmissions
      WHERE message_id = ${messageId}
      LIMIT 1
    `;

    return result && result.length > 0 ? result[0] : null;
  }

  /**
   * Generate UBL Invoice from DTO
   */
  private generateUBLInvoice(dto: SendDocumentDto): UBLInvoice {
    return {
      invoiceNumber: dto.invoiceNumber,
      issueDate: new Date(dto.issueDate),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      currency: dto.currency,
      supplier: {
        participantId: {
          scheme: dto.supplier.participantId.scheme,
          identifier: dto.supplier.participantId.identifier,
          formatted: `${dto.supplier.participantId.scheme}:${dto.supplier.participantId.identifier}`,
        },
        name: dto.supplier.name,
        address: dto.supplier.address,
        vatId: dto.supplier.vatId,
        contact: dto.supplier.contact,
      },
      customer: {
        participantId: {
          scheme: dto.customer.participantId.scheme,
          identifier: dto.customer.participantId.identifier,
          formatted: `${dto.customer.participantId.scheme}:${dto.customer.participantId.identifier}`,
        },
        name: dto.customer.name,
        address: dto.customer.address,
        vatId: dto.customer.vatId,
        contact: dto.customer.contact,
      },
      lines: dto.lines,
      taxTotal: dto.taxTotal,
      totalAmount: dto.totalAmount,
      paymentMeans: dto.paymentMeans,
    };
  }

  /**
   * Validate UBL document
   */
  private validateUBLDocument(invoice: UBLInvoice): PeppolValidationResult {
    const errors: PeppolValidationError[] = [];
    const warnings: PeppolValidationError[] = [];

    // Validate invoice number
    if (!invoice.invoiceNumber || invoice.invoiceNumber.length === 0) {
      errors.push({
        field: 'invoiceNumber',
        message: 'Invoice number is required',
        severity: 'ERROR',
        code: 'BR-02',
      });
    }

    // Validate issue date
    if (!invoice.issueDate) {
      errors.push({
        field: 'issueDate',
        message: 'Issue date is required',
        severity: 'ERROR',
        code: 'BR-03',
      });
    }

    // Validate currency
    if (!invoice.currency || invoice.currency.length !== 3) {
      errors.push({
        field: 'currency',
        message: 'Currency must be ISO 4217 code (3 characters)',
        severity: 'ERROR',
        code: 'BR-04',
      });
    }

    // Validate supplier
    if (!invoice.supplier.participantId) {
      errors.push({
        field: 'supplier.participantId',
        message: 'Supplier participant ID is required',
        severity: 'ERROR',
        code: 'BR-06',
      });
    }

    // Validate customer
    if (!invoice.customer.participantId) {
      errors.push({
        field: 'customer.participantId',
        message: 'Customer participant ID is required',
        severity: 'ERROR',
        code: 'BR-07',
      });
    }

    // Validate lines
    if (!invoice.lines || invoice.lines.length === 0) {
      errors.push({
        field: 'lines',
        message: 'At least one invoice line is required',
        severity: 'ERROR',
        code: 'BR-16',
      });
    }

    // Validate amounts
    if (invoice.totalAmount <= 0) {
      errors.push({
        field: 'totalAmount',
        message: 'Total amount must be greater than zero',
        severity: 'ERROR',
        code: 'BR-12',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Convert UBL Invoice to XML
   */
  private convertUBLToXML(invoice: UBLInvoice): string {
    const ublInvoice = {
      Invoice: {
        $: {
          xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
          'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
          'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        },
        'cbc:CustomizationID':
          'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0',
        'cbc:ProfileID': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
        'cbc:ID': invoice.invoiceNumber,
        'cbc:IssueDate': invoice.issueDate.toISOString().split('T')[0],
        'cbc:DueDate': invoice.dueDate
          ? invoice.dueDate.toISOString().split('T')[0]
          : undefined,
        'cbc:InvoiceTypeCode': '380',
        'cbc:DocumentCurrencyCode': invoice.currency,
        'cac:AccountingSupplierParty': {
          'cac:Party': {
            'cbc:EndpointID': {
              $: { schemeID: invoice.supplier.participantId.scheme },
              _: invoice.supplier.participantId.identifier,
            },
            'cac:PartyName': {
              'cbc:Name': invoice.supplier.name,
            },
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.supplier.address.streetName,
              'cbc:CityName': invoice.supplier.address.cityName,
              'cbc:PostalZone': invoice.supplier.address.postalZone,
              'cac:Country': {
                'cbc:IdentificationCode': invoice.supplier.address.countryCode,
              },
            },
            'cac:PartyTaxScheme': invoice.supplier.vatId
              ? {
                  'cbc:CompanyID': invoice.supplier.vatId,
                  'cac:TaxScheme': {
                    'cbc:ID': 'VAT',
                  },
                }
              : undefined,
          },
        },
        'cac:AccountingCustomerParty': {
          'cac:Party': {
            'cbc:EndpointID': {
              $: { schemeID: invoice.customer.participantId.scheme },
              _: invoice.customer.participantId.identifier,
            },
            'cac:PartyName': {
              'cbc:Name': invoice.customer.name,
            },
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.customer.address.streetName,
              'cbc:CityName': invoice.customer.address.cityName,
              'cbc:PostalZone': invoice.customer.address.postalZone,
              'cac:Country': {
                'cbc:IdentificationCode': invoice.customer.address.countryCode,
              },
            },
            'cac:PartyTaxScheme': invoice.customer.vatId
              ? {
                  'cbc:CompanyID': invoice.customer.vatId,
                  'cac:TaxScheme': {
                    'cbc:ID': 'VAT',
                  },
                }
              : undefined,
          },
        },
        'cac:PaymentMeans': invoice.paymentMeans
          ? {
              'cbc:PaymentMeansCode': invoice.paymentMeans.paymentMeansCode,
              'cbc:PaymentID': invoice.paymentMeans.paymentId,
              'cac:PayeeFinancialAccount': {
                'cbc:ID': invoice.paymentMeans.iban,
                'cac:FinancialInstitutionBranch': {
                  'cbc:ID': invoice.paymentMeans.bic,
                },
              },
            }
          : undefined,
        'cac:TaxTotal': {
          'cbc:TaxAmount': {
            $: { currencyID: invoice.currency },
            _: invoice.taxTotal.toFixed(2),
          },
        },
        'cac:LegalMonetaryTotal': {
          'cbc:LineExtensionAmount': {
            $: { currencyID: invoice.currency },
            _: (invoice.totalAmount - invoice.taxTotal).toFixed(2),
          },
          'cbc:TaxExclusiveAmount': {
            $: { currencyID: invoice.currency },
            _: (invoice.totalAmount - invoice.taxTotal).toFixed(2),
          },
          'cbc:TaxInclusiveAmount': {
            $: { currencyID: invoice.currency },
            _: invoice.totalAmount.toFixed(2),
          },
          'cbc:PayableAmount': {
            $: { currencyID: invoice.currency },
            _: invoice.totalAmount.toFixed(2),
          },
        },
        'cac:InvoiceLine': invoice.lines.map((line, index) => ({
          'cbc:ID': line.id,
          'cbc:InvoicedQuantity': {
            $: { unitCode: line.unitCode },
            _: line.quantity,
          },
          'cbc:LineExtensionAmount': {
            $: { currencyID: invoice.currency },
            _: line.lineExtensionAmount.toFixed(2),
          },
          'cac:Item': {
            'cbc:Description': line.description,
            'cac:ClassifiedTaxCategory': {
              'cbc:ID': 'S',
              'cbc:Percent': line.taxPercent,
              'cac:TaxScheme': {
                'cbc:ID': 'VAT',
              },
            },
          },
          'cac:Price': {
            'cbc:PriceAmount': {
              $: { currencyID: invoice.currency },
              _: line.priceAmount.toFixed(2),
            },
          },
        })),
      },
    };

    const xml = this.xmlBuilder.buildObject(ublInvoice);
    return xml;
  }
}
