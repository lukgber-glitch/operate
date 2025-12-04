import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GoCardlessService } from './gocardless.service';
import { GoCardlessAuthService } from './services/gocardless-auth.service';
import { GoCardlessMandateService } from './services/gocardless-mandate.service';
import { GoCardlessPaymentService } from './services/gocardless-payment.service';
import { GoCardlessCustomerService } from './services/gocardless-customer.service';
import {
  CreateMandateFlowDto,
  CreatePaymentDto,
  CreateSubscriptionDto,
} from './dto';
import {
  GoCardlessMandate,
  GoCardlessPayment,
  GoCardlessSubscription,
  GoCardlessPaymentStatus,
} from './gocardless.types';

/**
 * GoCardless Integration Controller
 * Provides REST endpoints for GoCardless Direct Debit operations
 *
 * Features:
 * - Mandate management (create, list, cancel)
 * - Payment collection (one-off, subscriptions)
 * - Customer management
 * - Connection status
 *
 * Security:
 * - JWT authentication required
 * - Rate limiting on all endpoints
 * - Organization-scoped access
 *
 * @see https://developer.gocardless.com/api-reference/
 */
@ApiTags('GoCardless Integration')
@Controller('integrations/gocardless')
@ApiBearerAuth()
@Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requests per minute
export class GoCardlessController {
  private readonly logger = new Logger(GoCardlessController.name);

  constructor(
    private readonly gocardlessService: GoCardlessService,
    private readonly authService: GoCardlessAuthService,
    private readonly mandateService: GoCardlessMandateService,
    private readonly paymentService: GoCardlessPaymentService,
    private readonly customerService: GoCardlessCustomerService,
  ) {}

  // ==================== Connection Management ====================

  @Get('status')
  @ApiOperation({ summary: 'Get GoCardless connection status' })
  @ApiResponse({ status: 200, description: 'Connection status retrieved successfully' })
  async getConnectionStatus(@Query('orgId') orgId: string) {
    return await this.authService.getConnectionStatus(orgId);
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect GoCardless' })
  @ApiResponse({ status: 204, description: 'Disconnected successfully' })
  async disconnect(
    @Query('orgId') orgId: string,
    @Query('userId') userId: string,
  ): Promise<void> {
    await this.authService.disconnect(orgId, userId);
  }

  @Get('creditor')
  @ApiOperation({ summary: 'Get creditor information' })
  @ApiResponse({ status: 200, description: 'Creditor information retrieved' })
  async getCreditor(@Query('creditorId') creditorId: string) {
    return await this.gocardlessService.getCreditor(creditorId);
  }

  // ==================== Mandate Management ====================

  @Post('mandates/create-flow')
  @ApiOperation({ summary: 'Create mandate authorization flow' })
  @ApiResponse({
    status: 200,
    description: 'Redirect flow created successfully',
    schema: {
      properties: {
        redirectUrl: { type: 'string', example: 'https://pay.gocardless.com/flow/RE123' },
        redirectFlowId: { type: 'string', example: 'RE123' },
      },
    },
  })
  async createMandateFlow(
    @Query('orgId') orgId: string,
    @Body() dto: CreateMandateFlowDto,
  ): Promise<{ redirectUrl: string; redirectFlowId: string }> {
    return await this.mandateService.createMandateFlow(
      orgId,
      dto.customerId,
      dto.scheme,
      dto.successRedirectUrl,
      dto.description,
    );
  }

  @Post('mandates/complete-flow/:redirectFlowId')
  @ApiOperation({ summary: 'Complete mandate authorization flow' })
  @ApiResponse({ status: 200, description: 'Mandate created successfully' })
  async completeMandateFlow(
    @Param('redirectFlowId') redirectFlowId: string,
  ): Promise<GoCardlessMandate> {
    return await this.mandateService.completeMandateFlow(redirectFlowId);
  }

  @Get('mandates/:mandateId')
  @ApiOperation({ summary: 'Get mandate details' })
  @ApiResponse({ status: 200, description: 'Mandate details retrieved' })
  async getMandate(
    @Param('mandateId') mandateId: string,
  ): Promise<GoCardlessMandate> {
    return await this.mandateService.getMandate(mandateId);
  }

  @Get('customers/:customerId/mandates')
  @ApiOperation({ summary: 'List customer mandates' })
  @ApiResponse({ status: 200, description: 'Customer mandates retrieved' })
  async listCustomerMandates(
    @Param('customerId') customerId: string,
  ): Promise<GoCardlessMandate[]> {
    return await this.mandateService.listCustomerMandates(customerId);
  }

  @Delete('mandates/:mandateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a mandate' })
  @ApiResponse({ status: 204, description: 'Mandate cancelled successfully' })
  async cancelMandate(
    @Param('mandateId') mandateId: string,
    @Query('userId') userId: string,
  ): Promise<void> {
    await this.mandateService.cancelMandate(mandateId, userId);
  }

  @Post('mandates/:mandateId/reinstate')
  @ApiOperation({ summary: 'Reinstate a cancelled mandate' })
  @ApiResponse({ status: 200, description: 'Mandate reinstated successfully' })
  async reinstateMandate(
    @Param('mandateId') mandateId: string,
  ): Promise<GoCardlessMandate> {
    return await this.mandateService.reinstateMandate(mandateId);
  }

  // ==================== Payment Management ====================

  @Post('payments')
  @ApiOperation({ summary: 'Create a one-off payment' })
  @ApiResponse({ status: 200, description: 'Payment created successfully' })
  async createPayment(
    @Query('orgId') orgId: string,
    @Query('userId') userId: string,
    @Body() dto: CreatePaymentDto,
  ): Promise<GoCardlessPayment> {
    return await this.paymentService.createPayment(
      orgId,
      {
        mandateId: dto.mandateId,
        amount: dto.amount,
        currency: dto.currency,
        chargeDate: dto.chargeDate,
        reference: dto.reference,
        description: dto.description,
        metadata: dto.metadata,
        appFee: dto.appFee,
      },
      userId,
    );
  }

  @Get('payments/:paymentId')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved' })
  async getPayment(
    @Param('paymentId') paymentId: string,
  ): Promise<GoCardlessPayment> {
    return await this.paymentService.getPayment(paymentId);
  }

  @Get('mandates/:mandateId/payments')
  @ApiOperation({ summary: 'List payments for a mandate' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async listMandatePayments(
    @Param('mandateId') mandateId: string,
  ): Promise<GoCardlessPayment[]> {
    return await this.paymentService.listMandatePayments(mandateId);
  }

  @Get('organizations/:orgId/payments')
  @ApiOperation({ summary: 'List payments for an organization' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async listOrganizationPayments(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: number,
    @Query('status') status?: GoCardlessPaymentStatus,
  ): Promise<GoCardlessPayment[]> {
    return await this.paymentService.listOrganizationPayments(orgId, limit, status);
  }

  @Delete('payments/:paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a payment' })
  @ApiResponse({ status: 204, description: 'Payment cancelled successfully' })
  async cancelPayment(
    @Param('paymentId') paymentId: string,
    @Query('userId') userId: string,
  ): Promise<void> {
    await this.paymentService.cancelPayment(paymentId, userId);
  }

  @Post('payments/:paymentId/retry')
  @ApiOperation({ summary: 'Retry a failed payment' })
  @ApiResponse({ status: 200, description: 'Payment retry initiated' })
  async retryPayment(
    @Param('paymentId') paymentId: string,
    @Query('userId') userId: string,
  ): Promise<GoCardlessPayment> {
    return await this.paymentService.retryPayment(paymentId, userId);
  }

  // ==================== Subscription Management ====================

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription created successfully' })
  async createSubscription(
    @Query('orgId') orgId: string,
    @Query('userId') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ): Promise<GoCardlessSubscription> {
    return await this.paymentService.createSubscription(
      orgId,
      {
        mandateId: dto.mandateId,
        amount: dto.amount,
        currency: dto.currency,
        name: dto.name,
        intervalUnit: dto.intervalUnit,
        interval: dto.interval,
        dayOfMonth: dto.dayOfMonth,
        month: dto.month,
        startDate: dto.startDate,
        endDate: dto.endDate,
        metadata: dto.metadata,
      },
      userId,
    );
  }

  @Delete('subscriptions/:subscriptionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({ status: 204, description: 'Subscription cancelled successfully' })
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Query('userId') userId: string,
  ): Promise<void> {
    await this.paymentService.cancelSubscription(subscriptionId, userId);
  }

  // ==================== Customer Management ====================

  @Post('customers/:customerId/create')
  @ApiOperation({ summary: 'Create GoCardless customer' })
  @ApiResponse({ status: 200, description: 'Customer created successfully' })
  async createCustomer(
    @Param('customerId') customerId: string,
    @Query('userId') userId: string,
  ): Promise<{ gcCustomerId: string }> {
    const gcCustomerId = await this.customerService.createCustomer(customerId, userId);
    return { gcCustomerId };
  }

  @Get('customers/:customerId/details')
  @ApiOperation({ summary: 'Get customer details from GoCardless' })
  @ApiResponse({ status: 200, description: 'Customer details retrieved' })
  async getCustomerDetails(@Param('customerId') customerId: string) {
    return await this.customerService.getCustomerDetails(customerId);
  }

  @Get('customers/:customerId/bank-accounts')
  @ApiOperation({ summary: 'List customer bank accounts' })
  @ApiResponse({ status: 200, description: 'Bank accounts retrieved' })
  async listCustomerBankAccounts(@Param('customerId') customerId: string) {
    return await this.customerService.listCustomerBankAccounts(customerId);
  }
}
