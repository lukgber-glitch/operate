/**
 * InvoiceNow Controller
 * REST API endpoints for InvoiceNow integration
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { InvoiceNowService } from './invoice-now.service';
import { SendInvoiceDto, ValidateUenDto, InvoiceNowWebhookDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

/**
 * InvoiceNow API Controller
 * Handles HTTP requests for InvoiceNow operations
 */
@Controller('integrations/invoice-now')
@UseGuards(JwtAuthGuard)
export class InvoiceNowController {
  private readonly logger = new Logger(InvoiceNowController.name);

  constructor(private readonly invoiceNowService: InvoiceNowService) {}

  /**
   * Send invoice via InvoiceNow network
   * POST /integrations/invoice-now/send
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendInvoice(
    @Body() dto: SendInvoiceDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log('Send invoice request', {
      organizationId: user.organizationId,
      invoiceNumber: dto.invoiceNumber,
    });

    const result = await this.invoiceNowService.sendDocument({
      organizationId: user.organizationId,
      document: dto as any, // Map DTO to InvoiceNowDocument
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Validate Singapore UEN
   * POST /integrations/invoice-now/validate-uen
   */
  @Post('validate-uen')
  @HttpCode(HttpStatus.OK)
  async validateUen(@Body() dto: ValidateUenDto) {
    this.logger.log('Validate UEN request', { uen: dto.uen });

    const result = await this.invoiceNowService.validateParticipant({
      uen: dto.uen,
      validateGst: dto.validateGst,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get transmission history
   * GET /integrations/invoice-now/transmissions
   */
  @Get('transmissions')
  async getTransmissions(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    const transmissions = await this.invoiceNowService.getTransmissions(
      user.organizationId,
      limit || 50,
    );

    return {
      success: true,
      data: transmissions,
    };
  }

  /**
   * Get transmission by message ID
   * GET /integrations/invoice-now/transmissions/:messageId
   */
  @Get('transmissions/:messageId')
  async getTransmission(@Param('messageId') messageId: string) {
    const transmission = await this.invoiceNowService.getTransmission(messageId);

    if (!transmission) {
      return {
        success: false,
        error: 'Transmission not found',
      };
    }

    return {
      success: true,
      data: transmission,
    };
  }

  /**
   * Webhook endpoint for receiving invoices
   * POST /integrations/invoice-now/webhook
   * (This would typically not be protected by JWT auth)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() dto: InvoiceNowWebhookDto) {
    this.logger.log('Webhook received', {
      messageId: dto.messageId,
    });

    // Process incoming AS4 message
    const result = await this.invoiceNowService.receiveDocument(
      dto.organizationId,
      dto.soapEnvelope,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Health check
   * GET /integrations/invoice-now/health
   */
  @Get('health')
  async healthCheck() {
    const enabled = this.invoiceNowService.isEnabled();
    const config = this.invoiceNowService.getConfig();

    return {
      success: true,
      data: {
        enabled,
        environment: config.environment,
        mockMode: config.mockMode,
        status: enabled ? 'operational' : 'disabled',
      },
    };
  }
}
