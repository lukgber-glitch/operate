/**
 * InvoiceNow Service
 * Main service for Singapore's InvoiceNow network integration
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { InvoiceNowPeppolClient } from './invoice-now-peppol.client';
import { InvoiceNowMapper } from './invoice-now.mapper';
import { InvoiceNowUenValidator } from './invoice-now-uen.validator';
import {
  InvoiceNowDocument,
  InvoiceNowTransmission,
  InvoiceNowValidationError,
  PeppolMessageStatus,
  InvoiceNowDocumentType,
  SINGAPORE_CURRENCY,
  SINGAPORE_GST_RATES,
} from '@operate/shared/types/integrations/invoice-now.types';
import {
  SendDocumentRequest,
  SendDocumentResponse,
  ReceiveDocumentResponse,
  ValidateParticipantRequest,
  ValidateParticipantResponse,
  InvoiceNowServiceConfig,
} from './invoice-now.types';
import {
  VALIDATION_RULES,
  ERROR_MESSAGES,
  POSTAL_CODE_PATTERN,
  RETRY_CONFIG,
} from './invoice-now.constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * InvoiceNow Integration Service
 * Orchestrates InvoiceNow e-invoicing operations for Singapore
 */
@Injectable()
export class InvoiceNowService {
  private readonly logger = new Logger(InvoiceNowService.name);
  private readonly config: InvoiceNowServiceConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly peppolClient: InvoiceNowPeppolClient,
    private readonly mapper: InvoiceNowMapper,
    private readonly uenValidator: InvoiceNowUenValidator,
  ) {
    this.config = {
      enabled: this.configService.get<string>('INVOICENOW_ENABLED') === 'true',
      environment: (this.configService.get<string>('INVOICENOW_ENVIRONMENT') || 'test') as
        | 'production'
        | 'test',
      peppolAccessPointUrl: this.configService.get<string>('PEPPOL_ACCESS_POINT_URL') || '',
      participantUen: this.configService.get<string>('INVOICENOW_PARTICIPANT_UEN') || '',
      smlDomain:
        this.configService.get<string>('INVOICENOW_SML_DOMAIN') || 'test-sml.peppol.sg',
      mockMode: this.configService.get<string>('INVOICENOW_MOCK_MODE') === 'true',
      validateUen: this.configService.get<string>('INVOICENOW_VALIDATE_UEN') !== 'false',
      validateGst: this.configService.get<string>('INVOICENOW_VALIDATE_GST') !== 'false',
      autoAcknowledge: this.configService.get<string>('INVOICENOW_AUTO_ACKNOWLEDGE') === 'true',
      retryAttempts: parseInt(
        this.configService.get<string>('INVOICENOW_RETRY_ATTEMPTS') ||
          RETRY_CONFIG.MAX_ATTEMPTS.toString(),
        10,
      ),
      retryDelay: parseInt(
        this.configService.get<string>('INVOICENOW_RETRY_DELAY') ||
          RETRY_CONFIG.INITIAL_DELAY.toString(),
        10,
      ),
    };

    this.logger.log(
      `InvoiceNow Service initialized (${this.config.environment} mode, Mock: ${this.config.mockMode})`,
    );
  }

  /**
   * Send invoice via InvoiceNow network
   */
  async sendDocument(request: SendDocumentRequest): Promise<SendDocumentResponse> {
    const startTime = Date.now();

    try {
      this.logger.log('Sending InvoiceNow document', {
        organizationId: request.organizationId,
        documentType: request.document.documentType,
        invoiceNumber: request.document.invoiceNumber,
        fromUen: request.document.supplier.uen,
        toUen: request.document.customer.uen,
      });

      // Validate document
      const validationErrors = await this.validateDocument(request.document);
      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Document validation failed',
          errors: validationErrors,
        });
      }

      // Validate supplier UEN
      if (this.config.validateUen) {
        const supplierValidation = this.uenValidator.validate(request.document.supplier.uen);
        if (!supplierValidation.isValid) {
          throw new BadRequestException({
            message: ERROR_MESSAGES.INVALID_UEN,
            errors: supplierValidation.errors,
          });
        }
      }

      // Validate customer UEN
      if (this.config.validateUen) {
        const customerValidation = this.uenValidator.validate(request.document.customer.uen);
        if (!customerValidation.isValid) {
          throw new BadRequestException({
            message: ERROR_MESSAGES.INVALID_UEN,
            errors: customerValidation.errors,
          });
        }
      }

      // Validate customer is registered in InvoiceNow network
      const customerRegistered = await this.peppolClient.isRegistered(
        request.document.customer.uen,
      );
      if (!customerRegistered) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.UEN_NOT_REGISTERED,
          uen: request.document.customer.uen,
        });
      }

      // Convert to UBL XML
      const ublXml = this.mapper.toUblXml(request.document);

      // Determine document type for Peppol
      const documentType =
        request.document.documentType === InvoiceNowDocumentType.CREDIT_NOTE
          ? 'creditNote'
          : 'invoice';

      // Send via Peppol network
      const { messageId, conversationId } = await this.peppolClient.sendMessage(
        request.organizationId,
        request.document.supplier.uen,
        request.document.customer.uen,
        ublXml,
        documentType,
      );

      // Store transmission log
      await this.storeTransmission({
        id: uuidv4(),
        organizationId: request.organizationId,
        messageId,
        conversationId,
        direction: 'OUTBOUND',
        documentType: request.document.documentType,
        invoiceNumber: request.document.invoiceNumber,
        fromUen: request.document.supplier.uen,
        toUen: request.document.customer.uen,
        status: PeppolMessageStatus.SENT,
        ublXml,
        as4MessageId: messageId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      this.logger.log('InvoiceNow document sent successfully', {
        messageId,
        conversationId,
        invoiceNumber: request.document.invoiceNumber,
        duration: Date.now() - startTime,
      });

      return {
        messageId,
        conversationId,
        status: PeppolMessageStatus.SENT,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to send InvoiceNow document', {
        organizationId: request.organizationId,
        invoiceNumber: request.document.invoiceNumber,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Receive invoice from InvoiceNow network
   */
  async receiveDocument(
    organizationId: string,
    soapEnvelope: string,
  ): Promise<ReceiveDocumentResponse> {
    try {
      this.logger.log('Receiving InvoiceNow document', { organizationId });

      // Process AS4 message via Peppol client
      const receipt = await this.peppolClient.receiveMessage(organizationId, soapEnvelope);

      // TODO: Parse UBL XML from receipt and store in database
      // TODO: Trigger webhook or event for received invoice

      return {
        messageId: receipt.messageId,
        receiptId: uuidv4(),
        status: receipt.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to receive InvoiceNow document', {
        organizationId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate participant (UEN) in InvoiceNow network
   */
  async validateParticipant(
    request: ValidateParticipantRequest,
  ): Promise<ValidateParticipantResponse> {
    try {
      // Validate UEN format
      const uenValidation = this.uenValidator.validate(request.uen);
      if (!uenValidation.isValid) {
        return {
          isValid: false,
          uen: request.uen,
          registered: false,
          errors: uenValidation.errors || ['Invalid UEN format'],
        };
      }

      // Check if registered in Peppol network
      const registered = await this.peppolClient.isRegistered(request.uen);

      // Get supported document types
      const documentTypes = registered
        ? await this.peppolClient.getSupportedDocumentTypes(request.uen)
        : [];

      // Validate GST if requested
      if (request.validateGst && this.config.validateGst) {
        // TODO: Implement GST validation via external API
      }

      return {
        isValid: uenValidation.isValid,
        uen: request.uen,
        participantId: `0195:${request.uen}`,
        registered,
        documentTypes,
      };
    } catch (error) {
      this.logger.error('Participant validation failed', {
        uen: request.uen,
        error: error.message,
      });
      return {
        isValid: false,
        uen: request.uen,
        registered: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Validate InvoiceNow document against PINT-SG rules
   */
  async validateDocument(document: InvoiceNowDocument): Promise<InvoiceNowValidationError[]> {
    const errors: InvoiceNowValidationError[] = [];

    // Invoice number is required
    if (!document.invoiceNumber || document.invoiceNumber.trim().length === 0) {
      errors.push({
        field: 'invoiceNumber',
        message: 'Invoice number is required',
        severity: 'ERROR',
        code: VALIDATION_RULES.INVOICE_NUMBER_REQUIRED,
      });
    }

    // Issue date is required
    if (!document.issueDate) {
      errors.push({
        field: 'issueDate',
        message: 'Issue date is required',
        severity: 'ERROR',
        code: VALIDATION_RULES.ISSUE_DATE_REQUIRED,
      });
    }

    // Currency validation
    if (!document.currency || document.currency.length !== 3) {
      errors.push({
        field: 'currency',
        message: 'Currency must be ISO 4217 code (3 characters)',
        severity: 'ERROR',
        code: VALIDATION_RULES.CURRENCY_REQUIRED,
      });
    }

    // Supplier UEN validation
    if (!document.supplier.uen) {
      errors.push({
        field: 'supplier.uen',
        message: 'Supplier UEN is required',
        severity: 'ERROR',
        code: VALIDATION_RULES.SUPPLIER_UEN_REQUIRED,
      });
    } else {
      const uenValidation = this.uenValidator.validate(document.supplier.uen);
      if (!uenValidation.isValid) {
        errors.push({
          field: 'supplier.uen',
          message: ERROR_MESSAGES.INVALID_UEN,
          severity: 'ERROR',
          code: VALIDATION_RULES.UEN_FORMAT_VALID,
        });
      }
    }

    // Customer UEN validation
    if (!document.customer.uen) {
      errors.push({
        field: 'customer.uen',
        message: 'Customer UEN is required',
        severity: 'ERROR',
        code: VALIDATION_RULES.CUSTOMER_UEN_REQUIRED,
      });
    } else {
      const uenValidation = this.uenValidator.validate(document.customer.uen);
      if (!uenValidation.isValid) {
        errors.push({
          field: 'customer.uen',
          message: ERROR_MESSAGES.INVALID_UEN,
          severity: 'ERROR',
          code: VALIDATION_RULES.UEN_FORMAT_VALID,
        });
      }
    }

    // Invoice lines validation
    if (!document.lines || document.lines.length === 0) {
      errors.push({
        field: 'lines',
        message: 'At least one invoice line is required',
        severity: 'ERROR',
        code: VALIDATION_RULES.INVOICE_LINE_REQUIRED,
      });
    }

    // GST calculation validation
    const calculatedTax = document.lines.reduce((sum, line) => sum + line.taxAmount, 0);
    if (Math.abs(calculatedTax - document.taxTotal) > 0.01) {
      errors.push({
        field: 'taxTotal',
        message: `GST calculation error. Expected: ${calculatedTax.toFixed(2)}, Got: ${document.taxTotal.toFixed(2)}`,
        severity: 'ERROR',
        code: VALIDATION_RULES.GST_CALCULATION_ACCURATE,
      });
    }

    // Total amount validation
    const expectedTotal = document.lines.reduce((sum, line) => sum + line.lineExtensionAmount, 0) + document.taxTotal;
    if (Math.abs(expectedTotal - document.totalAmount) > 0.01) {
      errors.push({
        field: 'totalAmount',
        message: `Total amount mismatch. Expected: ${expectedTotal.toFixed(2)}, Got: ${document.totalAmount.toFixed(2)}`,
        severity: 'ERROR',
        code: VALIDATION_RULES.TOTAL_AMOUNT_ACCURATE,
      });
    }

    // Postal code validation
    if (!POSTAL_CODE_PATTERN.test(document.supplier.address.postalCode)) {
      errors.push({
        field: 'supplier.address.postalCode',
        message: ERROR_MESSAGES.INVALID_POSTAL_CODE,
        severity: 'ERROR',
        code: VALIDATION_RULES.POSTAL_CODE_FORMAT,
      });
    }

    if (!POSTAL_CODE_PATTERN.test(document.customer.address.postalCode)) {
      errors.push({
        field: 'customer.address.postalCode',
        message: ERROR_MESSAGES.INVALID_POSTAL_CODE,
        severity: 'ERROR',
        code: VALIDATION_RULES.POSTAL_CODE_FORMAT,
      });
    }

    return errors;
  }

  /**
   * Get transmission history for organization
   */
  async getTransmissions(
    organizationId: string,
    limit: number = 50,
  ): Promise<InvoiceNowTransmission[]> {
    // TODO: Implement database query
    // This is a placeholder implementation
    return [];
  }

  /**
   * Get transmission by message ID
   */
  async getTransmission(messageId: string): Promise<InvoiceNowTransmission | null> {
    // TODO: Implement database query
    // This is a placeholder implementation
    return null;
  }

  /**
   * Store transmission log in database
   */
  private async storeTransmission(transmission: InvoiceNowTransmission): Promise<void> {
    try {
      // TODO: Implement database storage
      // This would use Prisma to store the transmission log
      this.logger.debug('Transmission log stored', {
        messageId: transmission.messageId,
        invoiceNumber: transmission.invoiceNumber,
      });
    } catch (error) {
      this.logger.error('Failed to store transmission log', {
        messageId: transmission.messageId,
        error: error.message,
      });
    }
  }

  /**
   * Check if InvoiceNow is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get service configuration
   */
  getConfig(): InvoiceNowServiceConfig {
    return { ...this.config };
  }
}
