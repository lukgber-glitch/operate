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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RecurringInvoiceService } from './recurring-invoice.service';
import {
  CreateRecurringInvoiceDto,
  UpdateRecurringInvoiceDto,
  RecurringInvoiceFiltersDto,
} from './dto/recurring-invoice.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../auth/rbac/permissions.decorator';

@ApiTags('Recurring Invoices')
@ApiBearerAuth()
@Controller('organisations/:orgId/invoices/recurring')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RecurringInvoiceController {
  constructor(
    private readonly recurringInvoiceService: RecurringInvoiceService,
  ) {}

  @Post()
  @RequirePermissions('invoices:create')
  @ApiOperation({ summary: 'Create a recurring invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recurring invoice created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation ID' })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateRecurringInvoiceDto,
    @Request() req: any,
  ) {
    return this.recurringInvoiceService.create(orgId, req.user.id, dto);
  }

  @Get()
  @RequirePermissions('invoices:read')
  @ApiOperation({ summary: 'Get all recurring invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of recurring invoices',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation ID' })
  async findAll(
    @Param('orgId') orgId: string,
    @Query() filters: RecurringInvoiceFiltersDto,
  ) {
    return this.recurringInvoiceService.findAll(orgId, filters);
  }

  @Get(':id')
  @RequirePermissions('invoices:read')
  @ApiOperation({ summary: 'Get a recurring invoice by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring invoice details',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring invoice not found',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation ID' })
  @ApiParam({ name: 'id', description: 'Recurring invoice ID' })
  async findOne(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.recurringInvoiceService.findOne(id, orgId);
  }

  @Patch(':id')
  @RequirePermissions('invoices:update')
  @ApiOperation({ summary: 'Update a recurring invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring invoice updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring invoice not found',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation ID' })
  @ApiParam({ name: 'id', description: 'Recurring invoice ID' })
  async update(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Body() dto: UpdateRecurringInvoiceDto,
  ) {
    return this.recurringInvoiceService.update(id, orgId, dto);
  }

  @Delete(':id')
  @RequirePermissions('invoices:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a recurring invoice' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Recurring invoice deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring invoice not found',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation ID' })
  @ApiParam({ name: 'id', description: 'Recurring invoice ID' })
  async delete(@Param('id') id: string, @Param('orgId') orgId: string) {
    await this.recurringInvoiceService.delete(id, orgId);
  }

  @Post(':id/activate')
  @RequirePermissions('invoices:update')
  @ApiOperation({ summary: 'Activate a recurring invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring invoice activated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring invoice not found',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation ID' })
  @ApiParam({ name: 'id', description: 'Recurring invoice ID' })
  async activate(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.recurringInvoiceService.activate(id, orgId);
  }

  @Post(':id/deactivate')
  @RequirePermissions('invoices:update')
  @ApiOperation({ summary: 'Deactivate a recurring invoice' }}
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring invoice deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring invoice not found',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation ID' })
  @ApiParam({ name: 'id', description: 'Recurring invoice ID' })
  async deactivate(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.recurringInvoiceService.deactivate(id, orgId);
  }

  @Post(':id/generate-now')
  @RequirePermissions('invoices:create')
  @ApiOperation({ summary: 'Manually generate an invoice from template now' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring invoice not found',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation ID' })
  @ApiParam({ name: 'id', description: 'Recurring invoice ID' })
  async generateNow(@Param('id') id: string, @Param('orgId') orgId: string) {
    const recurringInvoice = await this.recurringInvoiceService.findOne(
      id,
      orgId,
    );
    return this.recurringInvoiceService.generateInvoice(recurringInvoice);
  }
}
