/**
 * Payment Suggestion Controller
 * REST API endpoints for accessing payment suggestions and managing bill payments
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentSuggestionService } from './payment-suggestion.service';
import { MarkBillPaidDto } from './dto/mark-bill-paid.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Payment Suggestions')
@ApiBearerAuth()
@Controller('payment-suggestions')
@UseGuards(JwtAuthGuard)
export class PaymentSuggestionController {
  constructor(
    private readonly paymentSuggestionService: PaymentSuggestionService,
  ) {}

  /**
   * Get bills due in the next N days
   */
  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming bills due for payment',
    description:
      'Returns bills that are due within the specified number of days (default: 30 days)',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to look ahead',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming bills with payment suggestions',
  })
  async getUpcomingPayments(
    @Request() req,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    const orgId = req.user.organisationId;
    return this.paymentSuggestionService.getUpcomingPayments(
      orgId,
      days || 30,
    );
  }

  /**
   * Get overdue bills
   */
  @Get('overdue')
  @ApiOperation({
    summary: 'Get overdue bills',
    description: 'Returns all bills that are past their due date and unpaid',
  })
  @ApiResponse({
    status: 200,
    description: 'List of overdue bills with payment suggestions',
  })
  async getOverduePayments(@Request() req) {
    const orgId = req.user.organisationId;
    return this.paymentSuggestionService.getOverduePayments(orgId);
  }

  /**
   * Get AI-prioritized payment suggestions
   */
  @Get('priority')
  @ApiOperation({
    summary: 'Get AI-ranked payment suggestions',
    description:
      'Returns intelligently prioritized payment suggestions based on due dates, amounts, and vendor importance',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to include in suggestions',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Prioritized list of payment suggestions',
  })
  async suggestPaymentPriority(
    @Request() req,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    const orgId = req.user.organisationId;
    return this.paymentSuggestionService.suggestPaymentPriority(
      orgId,
      days || 30,
    );
  }

  /**
   * Get payment statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get payment statistics',
    description:
      'Returns payment statistics including upcoming, overdue, and recently paid bills',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days for statistics period',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment statistics summary',
  })
  async getPaymentStats(
    @Request() req,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    const orgId = req.user.organisationId;
    return this.paymentSuggestionService.getPaymentStats(orgId, days || 30);
  }

  /**
   * Mark a bill as paid
   */
  @Post(':billId/mark-paid')
  @ApiOperation({
    summary: 'Mark a bill as paid',
    description:
      'Updates a bill payment status and optionally links it to a bank transaction',
  })
  @ApiResponse({
    status: 200,
    description: 'Bill successfully marked as paid',
  })
  @ApiResponse({
    status: 404,
    description: 'Bill not found',
  })
  async markBillAsPaid(
    @Request() req,
    @Param('billId') billId: string,
    @Body() markPaidDto: MarkBillPaidDto,
  ) {
    const orgId = req.user.organisationId;

    const paymentData: any = {};

    if (markPaidDto.paidDate) {
      paymentData.paidDate = new Date(markPaidDto.paidDate);
    }

    if (markPaidDto.paidAmount !== undefined) {
      paymentData.paidAmount = markPaidDto.paidAmount;
    }

    if (markPaidDto.transactionId) {
      paymentData.transactionId = markPaidDto.transactionId;
    }

    if (markPaidDto.notes) {
      paymentData.notes = markPaidDto.notes;
    }

    return this.paymentSuggestionService.markBillAsPaid(
      billId,
      orgId,
      paymentData,
    );
  }

  /**
   * Get bills by vendor
   */
  @Get('vendor/:vendorId')
  @ApiOperation({
    summary: 'Get unpaid bills for a specific vendor',
    description: 'Returns all unpaid bills for the specified vendor',
  })
  @ApiResponse({
    status: 200,
    description: 'List of unpaid bills for the vendor',
  })
  async getBillsByVendor(
    @Request() req,
    @Param('vendorId') vendorId: string,
  ) {
    const orgId = req.user.organisationId;
    return this.paymentSuggestionService.getBillsByVendor(orgId, vendorId);
  }
}
