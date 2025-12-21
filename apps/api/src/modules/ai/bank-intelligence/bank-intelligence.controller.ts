import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { InvoiceMatcherService } from './invoice-matcher.service';
import { BillMatcherService } from './bill-matcher.service';

/**
 * DTOs for reconciliation requests
 */
export class AutoReconcileInvoiceDto {
  transactionId!: string;
  invoiceId!: string;
  userId?: string;
}

export class AutoReconcileBillDto {
  transactionId!: string;
  billId!: string;
  userId?: string;
}

export class PartialPaymentInvoiceDto {
  transactionId!: string;
  invoiceId!: string;
  amount!: number;
  userId?: string;
}

export class PartialPaymentBillDto {
  transactionId!: string;
  billId!: string;
  amount!: number;
  userId?: string;
}

/**
 * Bank Intelligence Controller
 * Provides endpoints for auto-reconciliation and bank intelligence features
 */
@ApiTags('Bank Intelligence')
@ApiBearerAuth()
@Controller('bank-intelligence')
@UseGuards(JwtAuthGuard)
export class BankIntelligenceController {
  constructor(
    private readonly invoiceMatcherService: InvoiceMatcherService,
    private readonly billMatcherService: BillMatcherService,
  ) {}

  /**
   * Auto-reconcile a transaction with an invoice
   */
  @Post('auto-reconcile/invoice')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-reconcile a transaction with an invoice' })
  @ApiResponse({ status: 200, description: 'Successfully reconciled' })
  @ApiResponse({ status: 404, description: 'Transaction or invoice not found' })
  async autoReconcileInvoice(@Body() dto: AutoReconcileInvoiceDto): Promise<{ success: boolean }> {
    await this.invoiceMatcherService.autoReconcile(
      dto.transactionId,
      dto.invoiceId,
      dto.userId,
    );
    return { success: true };
  }

  /**
   * Auto-reconcile a transaction with a bill
   */
  @Post('auto-reconcile/bill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-reconcile a transaction with a bill' })
  @ApiResponse({ status: 200, description: 'Successfully reconciled' })
  @ApiResponse({ status: 404, description: 'Transaction or bill not found' })
  async autoReconcileBill(@Body() dto: AutoReconcileBillDto): Promise<{ success: boolean }> {
    await this.billMatcherService.autoReconcileBill(
      dto.transactionId,
      dto.billId,
      dto.userId,
    );
    return { success: true };
  }

  /**
   * Record a partial payment for an invoice
   */
  @Post('partial-payment/invoice')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a partial payment for an invoice' })
  @ApiResponse({ status: 200, description: 'Partial payment recorded' })
  @ApiResponse({ status: 404, description: 'Transaction or invoice not found' })
  async recordPartialPaymentInvoice(
    @Body() dto: PartialPaymentInvoiceDto,
  ): Promise<{ success: boolean }> {
    await this.invoiceMatcherService.recordPartialPayment(
      dto.transactionId,
      dto.invoiceId,
      dto.amount,
      dto.userId,
    );
    return { success: true };
  }

  /**
   * Record a partial payment for a bill
   */
  @Post('partial-payment/bill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a partial payment for a bill' })
  @ApiResponse({ status: 200, description: 'Partial payment recorded' })
  @ApiResponse({ status: 404, description: 'Transaction or bill not found' })
  async recordPartialPaymentBill(
    @Body() dto: PartialPaymentBillDto,
  ): Promise<{ success: boolean }> {
    await this.billMatcherService.recordPartialBillPayment(
      dto.transactionId,
      dto.billId,
      dto.amount,
      dto.userId,
    );
    return { success: true };
  }
}
