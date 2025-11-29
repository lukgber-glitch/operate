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
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';

/**
 * Invoices Controller
 * Handles invoice management operations
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
    return this.invoicesService.findAll(orgId, query);
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
    return this.invoicesService.getStatistics(orgId);
  }

  /**
   * Get overdue invoices
   */
  @Get('overdue')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'Get overdue invoices',
    description: 'Get all invoices past due date',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue invoices retrieved successfully',
  })
  async getOverdue(@Param('orgId') orgId: string) {
    return this.invoicesService.getOverdue(orgId);
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
    return this.invoicesService.findById(id);
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
}
