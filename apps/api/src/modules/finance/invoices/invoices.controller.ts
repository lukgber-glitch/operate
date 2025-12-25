import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { ConvertInvoiceDto } from './dto/convert-invoice.dto';
import {
  GenerateEInvoiceDto,
  EInvoiceFormat,
  ZugferdProfile,
  XRechnungSyntax,
} from './dto/generate-einvoice.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';

/**
 * Invoices Controller
 * Handles invoice management operations with E-Invoice support
 */
@ApiTags('Finance - Invoices')
@Controller('organisations/:orgId/invoices')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  /**
   * List all invoices in organisation
   */
  @Get()
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'List invoices',
    description: 'Get paginated list of invoices with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoices retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(
    @Param('orgId') orgId: string,
    @Query() query: InvoiceQueryDto,
  ) {
    try {
      return await this.invoicesService.findAll(orgId, query);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoice statistics
   */
  @Get('statistics')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'Get invoice statistics',
    description: 'Get totals by status',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Param('orgId') orgId: string) {
    try {
      return await this.invoicesService.getStatistics(orgId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get overdue invoices
   */
  @Get('overdue')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'Get overdue invoices',
    description: 'Get all invoices past due date with limit',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    required: false,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue invoices retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              clientName: { type: 'string' },
              amount: { type: 'number' },
              dueDate: { type: 'string', format: 'date-time' },
              daysPastDue: { type: 'number' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  async getOverdue(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: number,
  ) {
    try {
      return await this.invoicesService.getOverdue(orgId, limit || 5);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single invoice by ID
   */
  @Get(':id')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'Get invoice',
    description: 'Retrieve single invoice by ID with items',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async findOne(@Param('id') id: string) {
    try {
      return await this.invoicesService.findById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new invoice
   */
  @Post()
  @RequirePermissions(Permission.INVOICES_CREATE)
  @ApiOperation({
    summary: 'Create invoice',
    description: 'Create a new invoice with items (auto-generates invoice number)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(orgId, createInvoiceDto);
  }

  /**
   * Update invoice
   */
  @Patch(':id')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  @ApiOperation({
    summary: 'Update invoice',
    description: 'Update invoice details (only DRAFT invoices)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update non-draft invoice',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  /**
   * Mark invoice as sent
   */
  @Post(':id/send')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  @ApiOperation({
    summary: 'Send invoice',
    description: 'Mark invoice as sent',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice marked as sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot send non-draft invoice',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async send(@Param('id') id: string) {
    return this.invoicesService.send(id);
  }

  /**
   * Mark invoice as paid
   */
  @Post(':id/pay')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  @ApiOperation({
    summary: 'Mark invoice as paid',
    description: 'Record payment for invoice',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice marked as paid',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid invoice status for payment',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async pay(@Param('id') id: string) {
    return this.invoicesService.pay(id);
  }

  /**
   * Cancel invoice
   */
  @Post(':id/cancel')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  @ApiOperation({
    summary: 'Cancel invoice',
    description: 'Cancel an invoice',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice cancelled',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel paid invoice',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }

  /**
   * Delete invoice
   */
  @Delete(':id')
  @RequirePermissions(Permission.INVOICES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete invoice',
    description: 'Delete invoice (only DRAFT invoices)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Invoice deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete non-draft invoice',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.invoicesService.delete(id);
  }

  /**
   * Generate PDF for invoice (DEPRECATED - use /generate endpoint)
   */
  @Post(':id/pdf')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'Generate invoice PDF',
    description: 'Generate and download PDF version of invoice (deprecated - use /generate)',
    deprecated: true,
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async generatePdf(@Param('id') id: string, @Param('orgId') orgId: string) {
    const pdfBuffer = await this.invoicesService.generatePdf(id);

    return {
      buffer: pdfBuffer.toString('base64'),
      contentType: 'application/pdf',
      filename: `invoice-${id}.pdf`,
    };
  }

  /**
   * Generate invoice with E-Invoice format support
   */
  @Get(':id/generate')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'Generate invoice with format selection',
    description:
      'Generate invoice as PDF, ZUGFeRD/Factur-X (PDF+XML), or XRechnung (XML)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'format',
    description: 'Invoice format',
    enum: EInvoiceFormat,
    required: false,
  })
  @ApiQuery({
    name: 'zugferdProfile',
    description: 'ZUGFeRD profile (only for zugferd/facturx format)',
    enum: ZugferdProfile,
    required: false,
  })
  @ApiQuery({
    name: 'xrechnungSyntax',
    description: 'XRechnung syntax (only for xrechnung format)',
    enum: XRechnungSyntax,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'object',
          properties: {
            buffer: { type: 'string', format: 'base64' },
            contentType: { type: 'string', example: 'application/pdf' },
            filename: { type: 'string', example: 'invoice-123-zugferd.pdf' },
          },
        },
      },
      'application/xml': {
        schema: {
          type: 'object',
          properties: {
            buffer: { type: 'string', format: 'base64' },
            contentType: { type: 'string', example: 'application/xml' },
            filename: { type: 'string', example: 'invoice-123-xrechnung.xml' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid format or generation failed',
  })
  async generateInvoice(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Query() query: GenerateEInvoiceDto,
  ) {
    const result = await this.invoicesService.generateInvoiceWithFormat(
      id,
      query.format,
      query.zugferdProfile,
      query.xrechnungSyntax,
    );

    return {
      buffer: result.buffer.toString('base64'),
      contentType: result.contentType,
      filename: result.filename,
    };
  }

  /**
   * Duplicate invoice
   */
  @Post(':id/duplicate')
  @RequirePermissions(Permission.INVOICES_CREATE)
  @ApiOperation({
    summary: 'Duplicate invoice',
    description:
      'Create a copy of an existing invoice with new invoice number and DRAFT status',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID to duplicate',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice duplicated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Source invoice not found',
  })
  async duplicate(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.invoicesService.duplicate(id, orgId);
  }

  /**
   * Convert invoice amount to different currency
   */
  @Post(':id/convert')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'Convert invoice to different currency',
    description:
      'Calculate invoice amount in a different currency using specified or default exchange rate',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion calculated successfully',
    schema: {
      type: 'object',
      properties: {
        originalAmount: { type: 'number', example: 1234.56 },
        originalCurrency: { type: 'string', example: 'EUR' },
        convertedAmount: { type: 'number', example: 1320.45 },
        convertedCurrency: { type: 'string', example: 'USD' },
        exchangeRate: { type: 'number', example: 1.07 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async convertInvoice(
    @Param('id') id: string,
    @Body() dto: ConvertInvoiceDto,
  ) {
    return this.invoicesService.convertInvoiceAmount(
      id,
      dto.targetCurrency,
      dto.exchangeRate,
    );
  }

  /**
   * Recalculate base currency amount
   */
  @Post(':id/recalculate-base-currency')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  @ApiOperation({
    summary: 'Recalculate base currency amount',
    description:
      'Update the base currency amount for an invoice using a new exchange rate',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'exchangeRate',
    description: 'New exchange rate to use',
    required: false,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Base currency amount recalculated',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async recalculateBaseCurrency(
    @Param('id') id: string,
    @Query('exchangeRate') exchangeRate?: number,
  ) {
    return this.invoicesService.recalculateBaseCurrency(id, exchangeRate);
  }

  /**
   * Get invoice totals in specific currency
   */
  @Get('totals/currency/:currency')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'Get invoice totals in specific currency',
    description:
      'Calculate total amounts for all invoices converted to a specific currency',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'currency',
    description: 'Target currency code (ISO 4217)',
    type: 'string',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by invoice status',
    required: false,
  })
  @ApiQuery({
    name: 'type',
    description: 'Filter by invoice type',
    required: false,
  })
  @ApiQuery({
    name: 'customerId',
    description: 'Filter by customer ID',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Totals calculated successfully',
    schema: {
      type: 'object',
      properties: {
        currency: { type: 'string', example: 'EUR' },
        totalInvoices: { type: 'number', example: 42 },
        subtotal: { type: 'number', example: 50000.0 },
        taxAmount: { type: 'number', example: 9500.0 },
        totalAmount: { type: 'number', example: 59500.0 },
      },
    },
  })
  async getTotalsInCurrency(
    @Param('orgId') orgId: string,
    @Param('currency') currency: string,
    @Query() query: InvoiceQueryDto,
  ) {
    return this.invoicesService.getTotalsInCurrency(orgId, currency, query);
  }
}
