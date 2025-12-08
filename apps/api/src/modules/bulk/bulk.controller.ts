import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RequestWithUser } from '../../common/types/request.types';
import { BulkService } from './bulk.service';
import {
  BulkInvoiceSendDto,
  BulkInvoiceApproveDto,
  BulkInvoiceMarkPaidDto,
  BulkBillApproveDto,
  BulkBillSchedulePaymentDto,
  BulkTransactionCategorizeDto,
  BulkTransactionReconcileDto,
  BulkExpenseApproveDto,
  BulkExpenseRejectDto,
} from './dto/bulk-operation.dto';
import { BulkOperationResult } from './dto/bulk-result.dto';

/**
 * Bulk Operations Controller
 * Handles bulk operations for invoices, bills, transactions, and expenses
 */
@ApiTags('Bulk Operations')
@Controller('bulk')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Uncomment when auth is fully configured
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  // ============================================================================
  // INVOICE BULK OPERATIONS
  // ============================================================================

  @Post('invoices/send')
  @ApiOperation({
    summary: 'Bulk send invoices',
    description: 'Send multiple invoices at once (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResult,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request or ownership verification failed',
  })
  async bulkSendInvoices(
    @Request() req: RequestWithUser,
    @Body() dto: BulkInvoiceSendDto,
  ): Promise<BulkOperationResult> {
    const orgId = req.user.orgId;
    return this.bulkService.bulkSendInvoices(orgId, dto);
  }

  @Post('invoices/approve')
  @ApiOperation({
    summary: 'Bulk approve invoices',
    description: 'Approve multiple invoices at once (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResult,
  })
  async bulkApproveInvoices(
    @Request() req: RequestWithUser,
    @Body() dto: BulkInvoiceApproveDto,
  ): Promise<BulkOperationResult> {
    const orgId = req.user.orgId;
    return this.bulkService.bulkApproveInvoices(orgId, dto);
  }

  @Post('invoices/mark-paid')
  @ApiOperation({
    summary: 'Bulk mark invoices as paid',
    description: 'Mark multiple invoices as paid at once (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResult,
  })
  async bulkMarkInvoicesPaid(
    @Request() req: RequestWithUser,
    @Body() dto: BulkInvoiceMarkPaidDto,
  ): Promise<BulkOperationResult> {
    const orgId = req.user.orgId;
    return this.bulkService.bulkMarkInvoicesPaid(orgId, dto);
  }

  // ============================================================================
  // BILL BULK OPERATIONS
  // ============================================================================

  @Post('bills/approve')
  @ApiOperation({
    summary: 'Bulk approve bills',
    description: 'Approve multiple bills at once (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResult,
  })
  async bulkApproveBills(
    @Request() req: RequestWithUser,
    @Body() dto: BulkBillApproveDto,
  ): Promise<BulkOperationResult> {
    const orgId = req.user.orgId;
    return this.bulkService.bulkApproveBills(orgId, dto);
  }

  @Post('bills/schedule-payment')
  @ApiOperation({
    summary: 'Bulk schedule bill payments',
    description: 'Schedule payments for multiple bills at once (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResult,
  })
  async bulkScheduleBillPayments(
    @Request() req: RequestWithUser,
    @Body() dto: BulkBillSchedulePaymentDto,
  ): Promise<BulkOperationResult> {
    const orgId = req.user.orgId;
    return this.bulkService.bulkScheduleBillPayments(orgId, dto);
  }

  // ============================================================================
  // TRANSACTION BULK OPERATIONS
  // ============================================================================

  @Post('transactions/:accountId/categorize')
  @ApiOperation({
    summary: 'Bulk categorize transactions',
    description: 'Categorize multiple transactions at once (max 100)',
  })
  @ApiParam({
    name: 'accountId',
    description: 'Bank account ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResult,
  })
  async bulkCategorizeTransactions(
    @Request() req: RequestWithUser,
    @Param('accountId') accountId: string,
    @Body() dto: BulkTransactionCategorizeDto,
  ): Promise<BulkOperationResult> {
    const orgId = req.user.orgId;
    return this.bulkService.bulkCategorizeTransactions(accountId, orgId, dto);
  }

  @Post('transactions/:accountId/reconcile')
  @ApiOperation({
    summary: 'Bulk reconcile transactions',
    description: 'Reconcile multiple transactions at once (max 100)',
  })
  @ApiParam({
    name: 'accountId',
    description: 'Bank account ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResult,
  })
  async bulkReconcileTransactions(
    @Request() req: RequestWithUser,
    @Param('accountId') accountId: string,
    @Body() dto: BulkTransactionReconcileDto,
  ): Promise<BulkOperationResult> {
    const orgId = req.user.orgId;
    return this.bulkService.bulkReconcileTransactions(accountId, orgId, dto);
  }

  // ============================================================================
  // EXPENSE BULK OPERATIONS
  // ============================================================================

  @Post('expenses/approve')
  @ApiOperation({
    summary: 'Bulk approve expenses',
    description: 'Approve multiple expenses at once (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResult,
  })
  async bulkApproveExpenses(
    @Request() req: RequestWithUser,
    @Body() dto: BulkExpenseApproveDto,
  ): Promise<BulkOperationResult> {
    const orgId = req.user.orgId;
    return this.bulkService.bulkApproveExpenses(orgId, dto);
  }

  @Post('expenses/reject')
  @ApiOperation({
    summary: 'Bulk reject expenses',
    description: 'Reject multiple expenses at once (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResult,
  })
  async bulkRejectExpenses(
    @Request() req: RequestWithUser,
    @Body() dto: BulkExpenseRejectDto,
  ): Promise<BulkOperationResult> {
    const orgId = req.user.orgId;
    return this.bulkService.bulkRejectExpenses(orgId, dto);
  }
}
