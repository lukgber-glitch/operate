import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ChorusProService } from './chorus-pro.service';
import { SubmitInvoiceDto, QueryStatusDto, LookupEntityDto } from './dto';
import {
  ChorusProSubmitInvoiceRequest,
  ChorusProDocumentFormat,
} from './types/chorus-pro.types';

/**
 * Chorus Pro Controller
 *
 * REST API endpoints for Chorus Pro integration (French B2G e-invoicing).
 *
 * All endpoints require authentication.
 */
@ApiTags('Chorus Pro (France B2G)')
@Controller('integrations/chorus-pro')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Uncomment when auth is configured
export class ChorusProController {
  constructor(private readonly chorusProService: ChorusProService) {}

  /**
   * Submit invoice to Chorus Pro
   */
  @Post('invoices/submit')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit invoice to Chorus Pro',
    description:
      'Submit a Factur-X invoice to the French government portal for B2G invoicing',
  })
  @ApiBody({
    description: 'Invoice data and Factur-X document',
    schema: {
      type: 'object',
      properties: {
        invoiceData: {
          type: 'string',
          description: 'JSON string of SubmitInvoiceDto',
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Factur-X PDF document',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice successfully submitted',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        chorusInvoiceId: { type: 'string' },
        depositNumber: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async submitInvoice(
    @Body('invoiceData') invoiceDataJson: string,
    @UploadedFile() document: Express.Multer.File,
  ) {
    try {
      const invoiceData: SubmitInvoiceDto = JSON.parse(invoiceDataJson);

      if (!document) {
        throw new BadRequestException('Invoice document is required');
      }

      const request: ChorusProSubmitInvoiceRequest = {
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: new Date(invoiceData.invoiceDate),
        invoiceType: invoiceData.invoiceType,
        supplierSiret: invoiceData.supplierSiret,
        supplierName: invoiceData.supplierName,
        recipientSiret: invoiceData.recipientSiret,
        recipientName: invoiceData.recipientName,
        serviceReference: invoiceData.serviceReference,
        engagement: invoiceData.engagement,
        amountExcludingTax: invoiceData.amountExcludingTax,
        vatAmount: invoiceData.vatAmount,
        amountIncludingTax: invoiceData.amountIncludingTax,
        documentFormat: invoiceData.documentFormat,
        documentData: document.buffer,
        purchaseOrderNumber: invoiceData.purchaseOrderNumber,
        contractReference: invoiceData.contractReference,
        customerReference: invoiceData.customerReference,
        comments: invoiceData.comments,
        structureId: invoiceData.structureId,
        routingMode: invoiceData.routingMode,
      };

      return await this.chorusProService.submitInvoice(request);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON in invoiceData');
      }
      throw error;
    }
  }

  /**
   * Get invoice status by Chorus Pro ID
   */
  @Get('invoices/:chorusInvoiceId/status')
  @ApiOperation({
    summary: 'Get invoice status',
    description: 'Retrieve the current status of an invoice in Chorus Pro',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceStatus(@Param('chorusInvoiceId') chorusInvoiceId: string) {
    return await this.chorusProService.getInvoiceStatus(chorusInvoiceId);
  }

  /**
   * Query invoices by criteria
   */
  @Post('invoices/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query invoices',
    description: 'Search invoices by various criteria (SIRET, date range, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Query results returned successfully',
  })
  async queryInvoices(@Body() queryDto: QueryStatusDto) {
    return await this.chorusProService.queryInvoices({
      chorusInvoiceId: queryDto.chorusInvoiceId,
      invoiceNumber: queryDto.invoiceNumber,
      supplierSiret: queryDto.supplierSiret,
      recipientSiret: queryDto.recipientSiret,
      dateFrom: queryDto.dateFrom,
      dateTo: queryDto.dateTo,
    });
  }

  /**
   * Get invoices by supplier SIRET
   */
  @Get('invoices/supplier/:siret')
  @ApiOperation({
    summary: 'Get invoices by supplier',
    description: 'Retrieve all invoices for a specific supplier SIRET',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoices retrieved successfully',
  })
  async getInvoicesBySupplier(
    @Param('siret') siret: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return await this.chorusProService.getInvoicesBySupplier(
      siret,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  /**
   * Get rejected invoices for a supplier
   */
  @Get('invoices/supplier/:siret/rejected')
  @ApiOperation({
    summary: 'Get rejected invoices',
    description: 'Retrieve all rejected invoices for a supplier',
  })
  @ApiResponse({
    status: 200,
    description: 'Rejected invoices retrieved successfully',
  })
  async getRejectedInvoices(
    @Param('siret') siret: string,
    @Query('dateFrom') dateFrom?: string,
  ) {
    return await this.chorusProService.getRejectedInvoices(
      siret,
      dateFrom ? new Date(dateFrom) : undefined,
    );
  }

  /**
   * Get paid invoices for a supplier
   */
  @Get('invoices/supplier/:siret/paid')
  @ApiOperation({
    summary: 'Get paid invoices',
    description: 'Retrieve all paid invoices for a supplier',
  })
  @ApiResponse({
    status: 200,
    description: 'Paid invoices retrieved successfully',
  })
  async getPaidInvoices(
    @Param('siret') siret: string,
    @Query('dateFrom') dateFrom?: string,
  ) {
    return await this.chorusProService.getPaidInvoices(
      siret,
      dateFrom ? new Date(dateFrom) : undefined,
    );
  }

  /**
   * Get pending invoices for a supplier
   */
  @Get('invoices/supplier/:siret/pending')
  @ApiOperation({
    summary: 'Get pending invoices',
    description: 'Retrieve all pending (not yet paid or rejected) invoices for a supplier',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending invoices retrieved successfully',
  })
  async getPendingInvoices(@Param('siret') siret: string) {
    return await this.chorusProService.getPendingInvoices(siret);
  }

  /**
   * Download invoice from Chorus Pro
   */
  @Get('invoices/:chorusInvoiceId/download')
  @ApiOperation({
    summary: 'Download invoice',
    description: 'Download invoice document from Chorus Pro',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice downloaded successfully',
  })
  async downloadInvoice(
    @Param('chorusInvoiceId') chorusInvoiceId: string,
    @Query('format') format?: string,
  ) {
    return await this.chorusProService.downloadInvoice({
      chorusInvoiceId,
      format: (format as any) || 'FACTURX',
    });
  }

  /**
   * Lookup public entity by SIRET
   */
  @Post('entities/lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lookup public entity',
    description: 'Find a public entity in Chorus Pro by SIRET and get service codes',
  })
  @ApiResponse({
    status: 200,
    description: 'Entity found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        entity: {
          type: 'object',
          properties: {
            siret: { type: 'string' },
            name: { type: 'string' },
            services: { type: 'array' },
            isRegistered: { type: 'boolean' },
            acceptsInvoices: { type: 'boolean' },
          },
        },
      },
    },
  })
  async lookupEntity(@Body() lookupDto: LookupEntityDto) {
    return await this.chorusProService.lookupEntity({
      siret: lookupDto.siret,
      name: lookupDto.name,
    });
  }

  /**
   * Check if entity accepts electronic invoices
   */
  @Get('entities/:siret/accepts-einvoices')
  @ApiOperation({
    summary: 'Check if entity accepts e-invoices',
    description: 'Verify if a public entity accepts electronic invoices via Chorus Pro',
  })
  @ApiResponse({
    status: 200,
    description: 'Check completed',
    schema: {
      type: 'object',
      properties: {
        siret: { type: 'string' },
        acceptsEInvoices: { type: 'boolean' },
      },
    },
  })
  async acceptsEInvoices(@Param('siret') siret: string) {
    const accepts = await this.chorusProService.entityAcceptsEInvoices(siret);
    return { siret, acceptsEInvoices: accepts };
  }

  /**
   * Get service codes for an entity
   */
  @Get('entities/:siret/services')
  @ApiOperation({
    summary: 'Get entity service codes',
    description: 'Retrieve all service codes for a public entity',
  })
  @ApiResponse({
    status: 200,
    description: 'Service codes retrieved successfully',
  })
  async getServiceCodes(@Param('siret') siret: string) {
    return await this.chorusProService.getServiceCodes(siret);
  }

  /**
   * Get statistics for supplier
   */
  @Get('statistics/supplier/:siret')
  @ApiOperation({
    summary: 'Get supplier statistics',
    description:
      'Retrieve statistics (submission count, payment times, etc.) for a supplier',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(
    @Param('siret') siret: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return await this.chorusProService.getStatistics(
      siret,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  /**
   * Test Chorus Pro connectivity
   */
  @Get('health/test-connection')
  @ApiOperation({
    summary: 'Test connection',
    description: 'Test connectivity to Chorus Pro API and authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection test result',
    schema: {
      type: 'object',
      properties: {
        connected: { type: 'boolean' },
        authenticated: { type: 'boolean' },
      },
    },
  })
  async testConnection() {
    const connected = await this.chorusProService.testConnection();
    const authStatus = this.chorusProService.getAuthStatus();

    return {
      connected,
      authenticated: authStatus.hasToken && authStatus.isValid,
      authStatus,
    };
  }
}
