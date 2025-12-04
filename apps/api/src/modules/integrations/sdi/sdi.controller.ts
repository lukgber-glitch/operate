import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { SDIService } from './sdi.service';
import {
  SendSDIInvoiceDto,
  ValidateFiscalCodeDto,
  ValidatePartitaIVADto,
  SDINotificationDto,
  QueryInvoiceStatusDto,
} from './dto';

/**
 * SDI Controller
 * HTTP endpoints for Italian SDI integration
 *
 * Endpoints:
 * - POST /sdi/send - Send invoice to SDI
 * - POST /sdi/webhook - Receive SDI notifications
 * - POST /sdi/validate/codice-fiscale - Validate fiscal code
 * - POST /sdi/validate/partita-iva - Validate VAT number
 * - GET /sdi/status - Query invoice status
 * - GET /sdi/transmissions - Get transmission history
 * - GET /sdi/transmissions/:id - Get specific transmission
 * - POST /sdi/retry/:id - Retry failed transmission
 * - GET /sdi/health - Health check
 */
@Controller('integrations/sdi')
export class SDIController {
  private readonly logger = new Logger(SDIController.name);

  constructor(private readonly sdiService: SDIService) {}

  /**
   * Send invoice to SDI
   *
   * POST /integrations/sdi/send
   */
  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendInvoice(@Body() dto: SendSDIInvoiceDto) {
    this.logger.log('Received request to send invoice to SDI', {
      organizationId: dto.organizationId,
      numero: dto.numero,
      tipoDocumento: dto.tipoDocumento,
    });

    try {
      const result = await this.sdiService.sendInvoice(dto);

      return {
        success: true,
        data: result,
        message: result.success
          ? 'Invoice sent successfully to SDI'
          : 'Invoice submission failed',
      };
    } catch (error) {
      this.logger.error('Failed to send invoice to SDI', error);
      throw error;
    }
  }

  /**
   * Receive notification from SDI (webhook)
   *
   * POST /integrations/sdi/webhook
   *
   * This endpoint receives XML notifications from SDI
   * (RC, NS, MC, NE, EC, DT)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async receiveNotification(
    @Headers('content-type') contentType: string,
    @Body() body: any,
    @Query('organizationId') organizationId?: string,
  ) {
    this.logger.log('Received SDI webhook notification', {
      contentType,
      organizationId,
    });

    // Validate content type
    if (!contentType || !contentType.includes('xml')) {
      throw new BadRequestException('Invalid content type. Expected XML');
    }

    // Organization ID is required
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    // Body should be XML string
    const xmlPayload = typeof body === 'string' ? body : JSON.stringify(body);

    try {
      // Parse filename and identificativoSdI from query or XML
      const nomeFile = 'notification.xml'; // Would be extracted from headers or query
      const identificativoSdI = ''; // Would be extracted from XML

      const notification = await this.sdiService.receiveNotification(
        organizationId,
        identificativoSdI,
        nomeFile,
        xmlPayload,
      );

      return {
        success: true,
        data: {
          notificationType: notification.notificationType,
          messageId: notification.messageId,
        },
        message: 'Notification processed successfully',
      };
    } catch (error) {
      this.logger.error('Failed to process SDI notification', error);
      throw error;
    }
  }

  /**
   * Validate Codice Fiscale
   *
   * POST /integrations/sdi/validate/codice-fiscale
   */
  @Post('validate/codice-fiscale')
  @HttpCode(HttpStatus.OK)
  async validateCodiceFiscale(@Body() dto: ValidateFiscalCodeDto) {
    this.logger.log('Validating Codice Fiscale', {
      codiceFiscale: dto.codiceFiscale,
    });

    try {
      const result = this.sdiService.validateCodiceFiscale(dto.codiceFiscale);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Codice Fiscale validation failed', error);
      throw error;
    }
  }

  /**
   * Validate Partita IVA
   *
   * POST /integrations/sdi/validate/partita-iva
   */
  @Post('validate/partita-iva')
  @HttpCode(HttpStatus.OK)
  async validatePartitaIVA(@Body() dto: ValidatePartitaIVADto) {
    this.logger.log('Validating Partita IVA', {
      partitaIVA: dto.partitaIVA,
    });

    try {
      const result = this.sdiService.validatePartitaIVA(dto.partitaIVA);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Partita IVA validation failed', error);
      throw error;
    }
  }

  /**
   * Query invoice status
   *
   * GET /integrations/sdi/status?organizationId=xxx&identificativoSdI=xxx
   */
  @Get('status')
  async queryInvoiceStatus(@Query() query: QueryInvoiceStatusDto) {
    this.logger.log('Querying invoice status', {
      organizationId: query.organizationId,
      identificativoSdI: query.identificativoSdI,
      invoiceId: query.invoiceId,
    });

    try {
      const result = await this.sdiService.queryInvoiceStatus(query);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to query invoice status', error);
      throw error;
    }
  }

  /**
   * Get transmission history
   *
   * GET /integrations/sdi/transmissions?organizationId=xxx&limit=50
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
      const transmissions = await this.sdiService.getTransmissions(
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
   * Get specific transmission
   *
   * GET /integrations/sdi/transmissions/:id
   */
  @Get('transmissions/:id')
  async getTransmission(@Param('id') transmissionId: string) {
    this.logger.log('Fetching transmission', { transmissionId });

    try {
      const transmission = await this.sdiService.getTransmission(transmissionId);

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
   * Retry failed transmission
   *
   * POST /integrations/sdi/retry/:id
   */
  @Post('retry/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  async retryTransmission(@Param('id') transmissionId: string) {
    this.logger.log('Retrying transmission', { transmissionId });

    try {
      const result = await this.sdiService.retryTransmission(transmissionId);

      return {
        success: true,
        data: result,
        message: 'Transmission retry initiated',
      };
    } catch (error) {
      this.logger.error('Failed to retry transmission', error);
      throw error;
    }
  }

  /**
   * Get SDI statistics
   *
   * GET /integrations/sdi/statistics?organizationId=xxx&from=2024-01-01&to=2024-12-31
   */
  @Get('statistics')
  async getStatistics(
    @Query('organizationId') organizationId: string,
    @Query('from') fromDate: string,
    @Query('to') toDate: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    if (!fromDate || !toDate) {
      throw new BadRequestException('Date range is required (from, to)');
    }

    this.logger.log('Fetching SDI statistics', {
      organizationId,
      fromDate,
      toDate,
    });

    try {
      const statistics = await this.sdiService.getStatistics(
        organizationId,
        new Date(fromDate),
        new Date(toDate),
      );

      return {
        success: true,
        data: statistics,
      };
    } catch (error) {
      this.logger.error('Failed to fetch statistics', error);
      throw error;
    }
  }

  /**
   * Health check
   *
   * GET /integrations/sdi/health
   */
  @Get('health')
  async healthCheck() {
    this.logger.log('Performing SDI health check');

    try {
      const health = await this.sdiService.healthCheck();

      return {
        success: health.status !== 'unhealthy',
        data: health,
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        success: false,
        data: {
          status: 'unhealthy',
          checks: {
            certificate: false,
            sdiEndpoint: false,
            database: false,
          },
          message: error.message,
        },
      };
    }
  }

  /**
   * Validate certificate status
   *
   * GET /integrations/sdi/certificate/validate
   */
  @Get('certificate/validate')
  async validateCertificate() {
    this.logger.log('Validating digital certificate');

    try {
      const result = await this.sdiService.validateCertificate();

      return {
        success: true,
        data: result,
        message: result.valid
          ? 'Certificate is valid'
          : 'Certificate is invalid or expired',
      };
    } catch (error) {
      this.logger.error('Certificate validation failed', error);
      throw error;
    }
  }
}
