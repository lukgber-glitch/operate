import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TrueLayerPISService } from './services/truelayer-pis.service';
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  ListPaymentsResponse,
  PaymentInitiationStatus,
  PaymentSourceType,
} from './truelayer-pis.types';
import { CreatePaymentDto } from './dto';
import { Request } from 'express';

/**
 * TrueLayer Payment Initiation Service (PIS) Controller
 * Handles payment initiation via Open Banking
 *
 * Endpoints:
 * - POST /integrations/truelayer/payments - Create new payment
 * - GET /integrations/truelayer/payments/:id - Get payment status
 * - GET /integrations/truelayer/payments - List all payments
 * - DELETE /integrations/truelayer/payments/:id - Cancel payment
 *
 * Security:
 * - JWT authentication required
 * - Organization-scoped access
 * - Audit logging
 *
 * @see https://docs.truelayer.com/docs/single-immediate-payments
 */
@Controller('integrations/truelayer/payments')
@UseGuards(JwtAuthGuard)
export class TrueLayerPISController {
  private readonly logger = new Logger(TrueLayerPISController.name);

  constructor(private readonly pisService: TrueLayerPISService) {}

  /**
   * Create a new payment initiation
   *
   * POST /integrations/truelayer/payments
   *
   * Request body:
   * {
   *   "amount": 100.50,
   *   "currency": "GBP",
   *   "beneficiaryName": "ACME Corp",
   *   "beneficiaryIban": "GB29NWBK60161331926819",
   *   "reference": "Invoice #1234",
   *   "description": "Payment for services",
   *   "sourceType": "INVOICE",
   *   "invoiceId": "invoice-uuid"
   * }
   *
   * Response:
   * {
   *   "paymentId": "payment-uuid",
   *   "truelayerPaymentId": "truelayer-payment-id",
   *   "authorizationUri": "https://payment.truelayer.com/...",
   *   "status": "AUTHORIZATION_REQUIRED",
   *   "expiresAt": "2024-01-01T12:00:00Z"
   * }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body() body: CreatePaymentDto,
    @Req() req: Request,
  ): Promise<CreatePaymentResponse> {
    this.logger.log(
      `Creating payment: ${body.amount} ${body.currency} for user ${req.user['userId']}`,
    );

    const request: CreatePaymentRequest = {
      userId: req.user['userId'],
      orgId: req.user['orgId'],
      amount: body.amount,
      currency: body.currency || 'GBP',
      beneficiaryName: body.beneficiaryName,
      beneficiaryIban: body.beneficiaryIban,
      beneficiarySortCode: body.beneficiarySortCode,
      beneficiaryAccountNumber: body.beneficiaryAccountNumber,
      reference: body.reference,
      description: body.description,
      redirectUri: body.redirectUri,
      sourceType: body.sourceType,
      billId: body.billId,
      expenseId: body.expenseId,
      invoiceId: body.invoiceId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.pisService.createPayment(request);
  }

  /**
   * Get payment status
   *
   * GET /integrations/truelayer/payments/:id
   *
   * Response:
   * {
   *   "paymentId": "payment-uuid",
   *   "truelayerPaymentId": "truelayer-payment-id",
   *   "status": "EXECUTED",
   *   "amount": 100.50,
   *   "currency": "GBP",
   *   "beneficiaryName": "ACME Corp",
   *   "reference": "Invoice #1234",
   *   "createdAt": "2024-01-01T10:00:00Z",
   *   "executedAt": "2024-01-01T10:05:00Z"
   * }
   */
  @Get(':id')
  async getPaymentStatus(
    @Param('id') paymentId: string,
    @Req() req: Request,
  ): Promise<PaymentStatusResponse> {
    this.logger.log(`Getting payment status for ${paymentId}`);

    return this.pisService.getPaymentStatus(
      paymentId,
      req.user['userId'],
      req.user['orgId'],
    );
  }

  /**
   * List all payments for organization
   *
   * GET /integrations/truelayer/payments?status=EXECUTED&sourceType=INVOICE&limit=50&offset=0
   *
   * Response:
   * {
   *   "payments": [...],
   *   "total": 150,
   *   "limit": 50,
   *   "offset": 0
   * }
   */
  @Get()
  async listPayments(
    @Query('status') status?: PaymentInitiationStatus,
    @Query('sourceType') sourceType?: PaymentSourceType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: Request,
  ): Promise<ListPaymentsResponse> {
    this.logger.log(`Listing payments for org ${req.user['orgId']}`);

    return this.pisService.listPayments({
      userId: req.user['userId'],
      orgId: req.user['orgId'],
      status,
      sourceType,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * Cancel a payment (if still pending)
   *
   * DELETE /integrations/truelayer/payments/:id
   *
   * Response: 204 No Content
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelPayment(
    @Param('id') paymentId: string,
    @Body('reason') reason?: string,
    @Req() req?: Request,
  ): Promise<void> {
    this.logger.log(`Cancelling payment ${paymentId}`);

    await this.pisService.cancelPayment({
      paymentId,
      userId: req.user['userId'],
      orgId: req.user['orgId'],
      reason,
    });
  }
}
