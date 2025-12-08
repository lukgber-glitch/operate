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
import { ScheduledPaymentsService } from './scheduled-payments.service';
import { CreateScheduledPaymentDto } from './dto/create-scheduled-payment.dto';
import { UpdateScheduledPaymentDto } from './dto/update-scheduled-payment.dto';
import { ScheduledPaymentFilterDto } from './dto/scheduled-payment-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';

/**
 * Scheduled Payments Controller
 * Handles HTTP endpoints for scheduling and managing bill/invoice payments
 */
@ApiTags('Finance - Scheduled Payments')
@Controller('organisations/:orgId/scheduled-payments')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ScheduledPaymentsController {
  constructor(
    private readonly scheduledPaymentsService: ScheduledPaymentsService,
  ) {}

  /**
   * List all scheduled payments in organisation
   */
  @Get()
  @RequirePermissions(Permission.BILLS_READ)
  @ApiOperation({
    summary: 'List scheduled payments',
    description: 'Get paginated list of scheduled payments with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled payments retrieved successfully',
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
    @Query() query: ScheduledPaymentFilterDto,
  ) {
    return this.scheduledPaymentsService.findAll(orgId, query);
  }

  /**
   * Get payments due today
   */
  @Get('due-today')
  @RequirePermissions(Permission.BILLS_READ)
  @ApiOperation({
    summary: 'Get payments due today',
    description: 'Get all scheduled payments due today',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Due today payments retrieved successfully',
  })
  async getDueToday(@Param('orgId') orgId: string) {
    return this.scheduledPaymentsService.getDueToday(orgId);
  }

  /**
   * Get upcoming payments
   */
  @Get('upcoming')
  @RequirePermissions(Permission.BILLS_READ)
  @ApiOperation({
    summary: 'Get upcoming payments',
    description: 'Get scheduled payments due in next N days (default 7)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming payments retrieved successfully',
  })
  async getUpcoming(
    @Param('orgId') orgId: string,
    @Query('days') days?: number,
  ) {
    return this.scheduledPaymentsService.getUpcoming(orgId, days || 7);
  }

  /**
   * Get single scheduled payment by ID
   */
  @Get(':id')
  @RequirePermissions(Permission.BILLS_READ)
  @ApiOperation({
    summary: 'Get scheduled payment',
    description: 'Retrieve single scheduled payment by ID',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Scheduled payment ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled payment retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled payment not found',
  })
  async findOne(@Param('id') id: string) {
    return this.scheduledPaymentsService.findById(id);
  }

  /**
   * Create new scheduled payment
   */
  @Post()
  @RequirePermissions(Permission.BILLS_CREATE)
  @ApiOperation({
    summary: 'Schedule payment',
    description: 'Create a new scheduled payment for a bill or invoice',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Scheduled payment created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createDto: CreateScheduledPaymentDto,
  ) {
    return this.scheduledPaymentsService.create(orgId, createDto);
  }

  /**
   * Update scheduled payment
   */
  @Patch(':id')
  @RequirePermissions(Permission.BILLS_UPDATE)
  @ApiOperation({
    summary: 'Update scheduled payment',
    description: 'Update scheduled payment details (only PENDING payments)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Scheduled payment ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled payment updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update payment in current status or invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled payment not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateScheduledPaymentDto,
  ) {
    return this.scheduledPaymentsService.update(id, updateDto);
  }

  /**
   * Cancel scheduled payment
   */
  @Post(':id/cancel')
  @RequirePermissions(Permission.BILLS_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel scheduled payment',
    description: 'Cancel a pending scheduled payment',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Scheduled payment ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled payment cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel payment in current status',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled payment not found',
  })
  async cancel(@Param('id') id: string): Promise<{ message: string }> {
    await this.scheduledPaymentsService.cancel(id);
    return { message: 'Scheduled payment cancelled successfully' };
  }

  /**
   * Execute scheduled payment now
   */
  @Post(':id/execute')
  @RequirePermissions(Permission.BILLS_PAY)
  @ApiOperation({
    summary: 'Execute payment now',
    description: 'Execute a scheduled payment immediately instead of waiting',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Scheduled payment ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment executed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot execute payment in current status or execution failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled payment not found',
  })
  async execute(@Param('id') id: string) {
    return this.scheduledPaymentsService.execute(id);
  }

  /**
   * Delete scheduled payment
   */
  @Delete(':id')
  @RequirePermissions(Permission.BILLS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete scheduled payment',
    description: 'Delete scheduled payment (only PENDING or CANCELLED)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Scheduled payment ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Scheduled payment deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete payment in current status',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled payment not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.scheduledPaymentsService.delete(id);
  }
}
