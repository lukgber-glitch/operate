import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  Logger,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { PeppolService } from './peppol.service';
import { SendDocumentDto, ValidateParticipantDto, PeppolWebhookDto } from './dto';
import { AS4Receipt } from './types/peppol.types';

/**
 * Peppol Controller
 * Handles HTTP endpoints for Peppol integration
 *
 * Endpoints:
 * - POST /peppol/send - Send document via Peppol
 * - POST /peppol/webhook - Receive document from Peppol (webhook)
 * - POST /peppol/validate-participant - Validate participant ID
 * - GET /peppol/transmissions - Get transmission history
 * - GET /peppol/transmissions/:messageId - Get specific transmission
 */
@Controller('integrations/peppol')
export class PeppolController {
  private readonly logger = new Logger(PeppolController.name);

  constructor(private readonly peppolService: PeppolService) {}

  /**
   * Send document via Peppol network
   *
   * POST /integrations/peppol/send
   */
  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendDocument(@Body() dto: SendDocumentDto) {
    this.logger.log('Received request to send Peppol document', {
      organizationId: dto.organizationId,
      documentType: dto.documentType,
      invoiceNumber: dto.invoiceNumber,
    });

    try {
      const result = await this.peppolService.sendDocument(dto);

      return {
        success: true,
        data: result,
        message: 'Document sent successfully via Peppol network',
      };
    } catch (error) {
      this.logger.error('Failed to send Peppol document', error);
      throw error;
    }
  }

  /**
   * Receive document from Peppol network (webhook)
   *
   * POST /integrations/peppol/webhook
   *
   * This endpoint receives AS4 messages from the Peppol Access Point
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async receiveDocument(
    @Headers('content-type') contentType: string,
    @Body() soapEnvelope: string,
    @Query('organizationId') organizationId?: string,
  ) {
    this.logger.log('Received Peppol webhook', {
      contentType,
      organizationId,
    });

    // Validate content type
    if (!contentType || !contentType.includes('application/soap+xml')) {
      throw new BadRequestException('Invalid content type. Expected application/soap+xml');
    }

    // Organization ID should be in query params or extracted from certificate
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    try {
      const receipt: AS4Receipt = await this.peppolService.receiveDocument(
        organizationId,
        soapEnvelope,
      );

      // Return AS4 receipt/MDN
      return this.buildReceiptResponse(receipt);
    } catch (error) {
      this.logger.error('Failed to process Peppol webhook', error);

      // Return error receipt
      const errorReceipt: AS4Receipt = {
        messageId: '',
        timestamp: new Date(),
        status: 'FAILURE',
        errorCode: 'PROCESSING_ERROR',
        errorDescription: error.message,
      };

      return this.buildReceiptResponse(errorReceipt);
    }
  }

  /**
   * Validate participant ID
   *
   * POST /integrations/peppol/validate-participant
   */
  @Post('validate-participant')
  @HttpCode(HttpStatus.OK)
  async validateParticipant(@Body() dto: ValidateParticipantDto) {
    this.logger.log('Validating Peppol participant', {
      scheme: dto.scheme,
      identifier: dto.identifier,
    });

    try {
      const result = await this.peppolService.validateParticipant(
        dto.scheme,
        dto.identifier,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Participant validation failed', error);
      throw error;
    }
  }

  /**
   * Get transmission history
   *
   * GET /integrations/peppol/transmissions?organizationId=xxx&limit=50
   */
  @Get('transmissions')
  async getTransmissions(
    @Query('organizationId') organizationId: string,
    @Query('limit') limit?: number,
  ) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    this.logger.log('Fetching transmission history', {
      organizationId,
      limit,
    });

    try {
      const transmissions = await this.peppolService.getTransmissions(
        organizationId,
        limit ? parseInt(limit.toString()) : 50,
      );

      return {
        success: true,
        data: transmissions,
        count: transmissions.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch transmission history', error);
      throw error;
    }
  }

  /**
   * Get specific transmission by message ID
   * SECURITY: Requires organizationId to prevent cross-tenant data access
   *
   * GET /integrations/peppol/transmissions/:messageId?organizationId=xxx
   */
  @Get('transmissions/:messageId')
  async getTransmission(
    @Param('messageId') messageId: string,
    @Query('organizationId') organizationId: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    this.logger.log('Fetching transmission', { messageId, organizationId });

    try {
      const transmission = await this.peppolService.getTransmission(organizationId, messageId);

      if (!transmission) {
        return {
          success: false,
          message: 'Transmission not found',
        };
      }

      return {
        success: true,
        data: transmission,
      };
    } catch (error) {
      this.logger.error('Failed to fetch transmission', error);
      throw error;
    }
  }

  /**
   * Build AS4 receipt/MDN response
   */
  private buildReceiptResponse(receipt: AS4Receipt): string {
    const timestamp = new Date().toISOString();

    // Build SOAP envelope with receipt
    const receiptXml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
               xmlns:eb="http://docs.oasis-open.org/ebxml-msg/ebms/v3.0/ns/core/200704/">
  <soap:Header>
    <eb:Messaging soap:mustUnderstand="true">
      <eb:SignalMessage>
        <eb:MessageInfo>
          <eb:Timestamp>${timestamp}</eb:Timestamp>
          <eb:MessageId>${receipt.messageId}</eb:MessageId>
          <eb:RefToMessageId>${receipt.messageId}</eb:RefToMessageId>
        </eb:MessageInfo>
        ${
          receipt.status === 'SUCCESS'
            ? `<eb:Receipt>
          <eb:NonRepudiationInformation>
            <eb:MessagePartNRInformation>
              <eb:Reference>cid:payload</eb:Reference>
            </eb:MessagePartNRInformation>
          </eb:NonRepudiationInformation>
        </eb:Receipt>`
            : `<eb:Error errorCode="${receipt.errorCode}" severity="failure">
          <eb:Description xml:lang="en">${receipt.errorDescription}</eb:Description>
        </eb:Error>`
        }
      </eb:SignalMessage>
    </eb:Messaging>
  </soap:Header>
  <soap:Body/>
</soap:Envelope>`;

    return receiptXml;
  }
}
