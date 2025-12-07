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
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { BillFilterDto } from './dto/bill-filter.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';

/**
 * Bills Controller
 * Handles HTTP endpoints for bill (accounts payable) management
 */
@ApiTags('Finance - Bills')
@Controller('organisations/:orgId/bills')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  /**
   * List all bills in organisation
   */
  @Get()
  @RequirePermissions(Permission.BILLS_READ)
  @ApiOperation({
    summary: 'List bills',
    description: 'Get paginated list of bills with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Bills retrieved successfully',
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
    @Query() query: BillFilterDto,
  ) {
    return this.billsService.findAll(orgId, query);
  }

  /**
   * Get bill summary statistics
   */
  @Get('summary')
  @RequirePermissions(Permission.BILLS_READ)
  @ApiOperation({
    summary: 'Get bill summary',
    description: 'Get dashboard summary stats for bills',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved successfully',
  })
  async getSummary(@Param('orgId') orgId: string) {
    return this.billsService.getSummary(orgId);
  }

  /**
   * Get overdue bills
   */
  @Get('overdue')
  @RequirePermissions(Permission.BILLS_READ)
  @ApiOperation({
    summary: 'Get overdue bills',
    description: 'Get all bills past due date',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue bills retrieved successfully',
  })
  async getOverdue(@Param('orgId') orgId: string) {
    return this.billsService.getOverdue(orgId);
  }

  /**
   * Get bills due soon
   */
  @Get('due-soon')
  @RequirePermissions(Permission.BILLS_READ)
  @ApiOperation({
    summary: 'Get bills due soon',
    description: 'Get bills due in next 7 days',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Due soon bills retrieved successfully',
  })
  async getDueSoon(
    @Param('orgId') orgId: string,
    @Query('days') days?: number,
  ) {
    return this.billsService.getDueSoon(orgId, days || 7);
  }

  /**
   * Get single bill by ID
   */
  @Get(':id')
  @RequirePermissions(Permission.BILLS_READ)
  @ApiOperation({
    summary: 'Get bill',
    description: 'Retrieve single bill by ID with line items and payments',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bill ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Bill retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Bill not found',
  })
  async findOne(@Param('id') id: string) {
    return this.billsService.findById(id);
  }

  /**
   * Create new bill
   */
  @Post()
  @RequirePermissions(Permission.BILLS_CREATE)
  @ApiOperation({
    summary: 'Create bill',
    description: 'Create a new bill with optional line items',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Bill created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createBillDto: CreateBillDto,
  ) {
    return this.billsService.create(orgId, createBillDto);
  }

  /**
   * Update bill
   */
  @Patch(':id')
  @RequirePermissions(Permission.BILLS_UPDATE)
  @ApiOperation({
    summary: 'Update bill',
    description:
      'Update bill details (only DRAFT bills can be fully updated, others have limited fields)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bill ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Bill updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update non-draft bill or invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'Bill not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateBillDto: UpdateBillDto,
  ) {
    return this.billsService.update(id, updateBillDto);
  }

  /**
   * Delete bill
   */
  @Delete(':id')
  @RequirePermissions(Permission.BILLS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete bill',
    description: 'Delete bill (only DRAFT bills)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bill ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Bill deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete non-draft bill',
  })
  @ApiResponse({
    status: 404,
    description: 'Bill not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.billsService.delete(id);
  }

  /**
   * Approve bill
   */
  @Post(':id/approve')
  @RequirePermissions(Permission.BILLS_APPROVE)
  @ApiOperation({
    summary: 'Approve bill',
    description: 'Approve a bill for payment',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bill ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Bill approved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot approve bill in current status',
  })
  @ApiResponse({
    status: 404,
    description: 'Bill not found',
  })
  async approve(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.billsService.approve(id, userId);
  }

  /**
   * Reject bill
   */
  @Post(':id/reject')
  @RequirePermissions(Permission.BILLS_APPROVE)
  @ApiOperation({
    summary: 'Reject bill',
    description: 'Reject a bill with optional notes',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bill ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Bill rejected successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot reject bill in current status',
  })
  @ApiResponse({
    status: 404,
    description: 'Bill not found',
  })
  async reject(
    @Param('id') id: string,
    @Body('rejectionNotes') rejectionNotes: string,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.billsService.reject(id, userId, rejectionNotes);
  }

  /**
   * Record payment for bill
   */
  @Post(':id/pay')
  @RequirePermissions(Permission.BILLS_PAY)
  @ApiOperation({
    summary: 'Record bill payment',
    description:
      'Record a payment for a bill (supports partial payments)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bill ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment recorded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment amount or bill status',
  })
  @ApiResponse({
    status: 404,
    description: 'Bill not found',
  })
  async pay(@Param('id') id: string, @Body() paymentDto: RecordPaymentDto) {
    return this.billsService.recordPayment(id, paymentDto);
  }
}
