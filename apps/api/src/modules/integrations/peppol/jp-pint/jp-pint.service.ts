/**
 * JP-PINT Service
 *
 * Japan Peppol International (JP-PINT) connector
 * Extends base Peppol service with Japanese-specific functionality
 *
 * Features:
 * - JP-PINT UBL 2.1 document format
 * - Corporate Number (法人番号) validation
 * - Invoice Registry Number support (T+13 digits)
 * - Japanese tax handling (standard 10%, reduced 8%)
 * - TLS 1.3 enforcement
 * - Japanese address format support
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { PeppolService } from '../peppol.service';
import { PeppolCertificateService } from '../services/peppol-certificate.service';
import { PeppolParticipantService } from '../services/peppol-participant.service';
import { PeppolMessageService } from '../services/peppol-message.service';
import {
  AS4Message,
  PeppolDocumentId,
  PeppolProcessId,
  PeppolConfig,
} from '../types/peppol.types';
import {
  JPPINTInvoice,
  JPPINTSendDocumentDto,
  JPPINTValidationResult,
  JPPINTConfig,
} from './jp-pint.types';
import {
  JP_PINT_DOCUMENT_ID,
  JP_PINT_PROCESS_ID,
  JP_PINT_CUSTOMIZATION_ID,
  JP_PINT_PROFILE_ID,
  JP_PEPPOL_SCHEME,
  JP_CURRENCY,
  JP_TLS_CONFIG,
} from './jp-pint.constants';
import { JPPINTValidator } from './jp-pint.validator';
import { JPPINTMapper } from './jp-pint.mapper';

/**
 * JP-PINT Service
 */
@Injectable()
export class JPPINTService {
  private readonly logger = new Logger(JPPINTService.name);
  private readonly peppolConfig: PeppolConfig;
  private readonly jpPintConfig: JPPINTConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly peppolService: PeppolService,
    private readonly certificateService: PeppolCertificateService,
    private readonly participantService: PeppolParticipantService,
    private readonly messageService: PeppolMessageService,
    private readonly validator: JPPINTValidator,
    private readonly mapper: JPPINTMapper,
  ) {
    this.peppolConfig = {
      accessPointUrl: this.configService.get<string>('PEPPOL_ACCESS_POINT_URL') || '',
      participantId: this.configService.get<string>('PEPPOL_PARTICIPANT_ID') || '',
      certificatePath: this.configService.get<string>('PEPPOL_CERTIFICATE_PATH') || '',
      privateKeyPath: this.configService.get<string>('PEPPOL_PRIVATE_KEY_PATH') || '',
      certificatePassword:
        this.configService.get<string>('PEPPOL_CERTIFICATE_PASSWORD') || '',
      smlDomain: this.configService.get<string>('PEPPOL_SML_DOMAIN') || 'isml.peppol.eu',
      environment:
        (this.configService.get<string>('PEPPOL_ENVIRONMENT') || 'test') as
          | 'production'
          | 'test',
      mockMode: this.configService.get<string>('PEPPOL_MOCK_MODE') === 'true',
      tlsMinVersion: 'TLSv1.3',
      certificatePinning:
        this.configService.get<string>('PEPPOL_CERTIFICATE_PINNING') !== 'false',
    };

    this.jpPintConfig = {
      enableStrictValidation:
        this.configService.get<string>('JP_PINT_STRICT_VALIDATION') !== 'false',
      requireInvoiceRegistryNumber:
        this.configService.get<string>('JP_PINT_REQUIRE_INVOICE_REGISTRY') !== 'false',
      requireTimestamp: true,
      validateCorporateNumber: true,
      validateCheckDigit: true,
      defaultTaxRate: 10.0,
      reducedTaxRate: 8.0,
    };

    this.logger.log(
      `JP-PINT Service initialized (${this.peppolConfig.environment} mode, Strict: ${this.jpPintConfig.enableStrictValidation})`,
    );
  }

  /**
   * Send JP-PINT invoice via Peppol network
   */
  async sendJPPINTInvoice(
    dto: JPPINTSendDocumentDto,
  ): Promise<{ messageId: string; status: string }> {
    const startTime = Date.now();

    try {
      this.logger.log('Sending JP-PINT invoice', {
        organizationId: dto.organizationId,
        invoiceNumber: dto.invoiceNumber,
        supplier: dto.supplier.corporateNumber,
        customer: dto.customer.corporateNumber,
      });

      // Validate that this is for Japan
      this.validateJapanContext(dto);

      // Map DTO to JP-PINT invoice
      const jpPintInvoice = this.mapper.mapDtoToInvoice(dto);

      // Validate JP-PINT invoice
      const validation = await this.validateJPPINTInvoice(jpPintInvoice);
      if (!validation.valid) {
        throw new BadRequestException({
          message: 'JP-PINT invoice validation failed',
          errors: validation.errors,
          jpSpecificErrors: validation.jpSpecificErrors,
        });
      }

      // Convert to UBL XML
      const ublXml = this.mapper.convertToUBLXML(jpPintInvoice);

      // Lookup customer endpoint via SMP
      const customerParticipantId = this.participantService.validateParticipantId(
        JP_PEPPOL_SCHEME,
        dto.customer.corporateNumber,
      );

      const endpoint = await this.participantService.lookupEndpoint(
        customerParticipantId,
        JP_PINT_DOCUMENT_ID,
      );

      // Validate TLS 1.3
      this.validateTLSVersion(endpoint.endpointUrl);

      // Create AS4 message
      const message: AS4Message = {
        messageId: uuidv4(),
        conversationId: uuidv4(),
        timestamp: new Date(),
        from: this.participantService.validateParticipantId(
          JP_PEPPOL_SCHEME,
          dto.supplier.corporateNumber,
        ),
        to: customerParticipantId,
        documentId: JP_PINT_DOCUMENT_ID,
        processId: JP_PINT_PROCESS_ID,
        payload: ublXml,
      };

      // Send message via Peppol message service
      const messageId = await this.messageService.sendMessage(
        dto.organizationId,
        message,
        endpoint,
      );

      this.logger.log('JP-PINT invoice sent successfully', {
        messageId,
        invoiceNumber: dto.invoiceNumber,
        duration: Date.now() - startTime,
      });

      return {
        messageId,
        status: 'SENT',
      };
    } catch (error) {
      this.logger.error('Failed to send JP-PINT invoice', {
        error: error.message,
        organizationId: dto.organizationId,
        invoiceNumber: dto.invoiceNumber,
      });
      throw error;
    }
  }

  /**
   * Receive JP-PINT invoice (webhook handler)
   */
  async receiveJPPINTInvoice(
    organizationId: string,
    soapEnvelope: string,
  ): Promise<{ messageId: string; status: string }> {
    const startTime = Date.now();

    try {
      this.logger.log('Receiving JP-PINT invoice', { organizationId });

      // Receive via base Peppol service
      const receipt = await this.peppolService.receiveDocument(
        organizationId,
        soapEnvelope,
      );

      // Additional JP-PINT specific processing would go here
      // - Extract and validate Japanese business identifiers
      // - Validate tax calculations
      // - Store Japan-specific metadata

      this.logger.log('JP-PINT invoice received successfully', {
        messageId: receipt.messageId,
        duration: Date.now() - startTime,
      });

      return {
        messageId: receipt.messageId,
        status: receipt.status,
      };
    } catch (error) {
      this.logger.error('Failed to receive JP-PINT invoice', error);
      throw error;
    }
  }

  /**
   * Validate participant exists in Japanese Peppol network
   */
  async validateJapaneseParticipant(corporateNumber: string): Promise<{
    valid: boolean;
    participantId?: any;
    corporateNumberValidation?: any;
  }> {
    try {
      // Validate corporate number format
      const corpValidation = this.validator.validateCorporateNumber(corporateNumber);
      if (!corpValidation.isValid) {
        return {
          valid: false,
          corporateNumberValidation: corpValidation,
        };
      }

      // Validate participant in Peppol network
      const peppolValidation = await this.peppolService.validateParticipant(
        JP_PEPPOL_SCHEME,
        corporateNumber,
      );

      return {
        valid: peppolValidation.valid,
        participantId: peppolValidation.participantId,
        corporateNumberValidation: corpValidation,
      };
    } catch (error) {
      this.logger.error('Japanese participant validation failed', error);
      return { valid: false };
    }
  }

  /**
   * Validate invoice registry number
   */
  validateInvoiceRegistryNumber(registryNumber: string): {
    valid: boolean;
    details?: any;
    error?: string;
  } {
    const validation = this.validator.validateInvoiceRegistryNumber(registryNumber);

    return {
      valid: validation.isValid,
      details: validation,
      error: validation.error,
    };
  }

  /**
   * Validate corporate number
   */
  validateCorporateNumber(corporateNumber: string): {
    valid: boolean;
    details?: any;
    error?: string;
  } {
    const validation = this.validator.validateCorporateNumber(corporateNumber);

    return {
      valid: validation.isValid,
      details: validation,
      error: validation.error,
    };
  }

  /**
   * Get JP-PINT document metadata
   */
  getDocumentMetadata(): {
    documentId: PeppolDocumentId;
    processId: PeppolProcessId;
    customizationId: string;
    profileId: string;
  } {
    return {
      documentId: JP_PINT_DOCUMENT_ID,
      processId: JP_PINT_PROCESS_ID,
      customizationId: JP_PINT_CUSTOMIZATION_ID,
      profileId: JP_PINT_PROFILE_ID,
    };
  }

  /**
   * Validate JP-PINT invoice
   */
  private async validateJPPINTInvoice(
    invoice: JPPINTInvoice,
  ): Promise<JPPINTValidationResult> {
    const validation = this.validator.validateJPPINTInvoice(invoice);

    // Additional asynchronous validations can be added here
    // e.g., check invoice registry number against NTA registry

    return validation;
  }

  /**
   * Validate Japan context
   */
  private validateJapanContext(dto: JPPINTSendDocumentDto): void {
    // Validate currency
    if (dto.currency !== JP_CURRENCY) {
      throw new BadRequestException(
        `JP-PINT requires currency to be ${JP_CURRENCY}`,
      );
    }

    // Validate participant schemes
    if (dto.supplier.participantId.scheme !== JP_PEPPOL_SCHEME) {
      throw new BadRequestException(
        `Supplier participant scheme must be ${JP_PEPPOL_SCHEME} for JP-PINT`,
      );
    }

    if (dto.customer.participantId.scheme !== JP_PEPPOL_SCHEME) {
      throw new BadRequestException(
        `Customer participant scheme must be ${JP_PEPPOL_SCHEME} for JP-PINT`,
      );
    }

    // Validate timestamp is present
    if (!dto.timestamp) {
      throw new BadRequestException('Timestamp is required for JP-PINT invoices');
    }

    // Validate invoice registry number if required
    if (this.jpPintConfig.requireInvoiceRegistryNumber) {
      if (!dto.supplier.invoiceRegistryNumber) {
        throw new BadRequestException(
          'Supplier invoice registry number is required for JP-PINT',
        );
      }
    }
  }

  /**
   * Validate TLS version
   */
  private validateTLSVersion(endpointUrl: string): void {
    // In production, enforce TLS 1.3
    if (this.peppolConfig.environment === 'production') {
      // This would be validated at the HTTP client level
      this.logger.debug('TLS 1.3 validation for endpoint', { endpointUrl });
      // Implementation note: TLS validation is handled by the HTTPS agent
      // configured in PeppolMessageService
    }
  }

  /**
   * Get JP-PINT configuration
   */
  getConfiguration(): JPPINTConfig {
    return { ...this.jpPintConfig };
  }

  /**
   * Format corporate number with separators
   */
  formatCorporateNumber(corporateNumber: string): string {
    return this.validator.formatCorporateNumber(corporateNumber);
  }

  /**
   * Format postal code
   */
  formatPostalCode(postalCode: string): string {
    return this.validator.formatPostalCode(postalCode);
  }

  /**
   * Calculate tax breakdown from invoice lines
   */
  calculateTaxBreakdown(lines: any[]): any[] {
    return this.mapper.calculateTaxBreakdown(lines);
  }
}
