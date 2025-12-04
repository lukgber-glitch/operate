import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StripeConnectService } from './services/stripe-connect.service';
import { StripePaymentsService } from './services/stripe-payments.service';
import {
  CreateConnectAccountDto,
  CreateOnboardingLinkDto,
  ConfigurePayoutsDto,
  CreatePaymentIntentDto,
  ConfirmPaymentIntentDto,
  CreateTransferDto,
  CreateRefundDto,
} from './dto';

/**
 * Stripe Controller
 * REST endpoints for Stripe Connect operations
 *
 * Features:
 * - Connect account creation and management
 * - Onboarding link generation
 * - Payment processing
 * - Transfers and refunds
 * - Account status checking
 */
@ApiTags('stripe')
@Controller('integrations/stripe')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeConnectService: StripeConnectService,
    private readonly stripePaymentsService: StripePaymentsService,
  ) {}

  // Connect Account Endpoints

  @Post('connect/accounts')
  @ApiOperation({ summary: 'Create a Stripe Connect account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createConnectAccount(
    @Request() req,
    @Body() createAccountDto: CreateConnectAccountDto,
  ) {
    this.logger.log(`Creating Connect account for user ${req.user.id}`);

    return this.stripeConnectService.createConnectAccount({
      ...createAccountDto,
      userId: req.user.id,
    });
  }

  @Get('connect/accounts/:accountId')
  @ApiOperation({ summary: 'Get Connect account details' })
  @ApiResponse({ status: 200, description: 'Account details retrieved' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getConnectAccount(@Param('accountId') accountId: string) {
    return this.stripeConnectService.getAccount(accountId);
  }

  @Get('connect/accounts')
  @ApiOperation({ summary: 'Get current user Connect account' })
  @ApiResponse({ status: 200, description: 'Account details retrieved' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getCurrentUserAccount(@Request() req) {
    return this.stripeConnectService.getAccountByUserId(req.user.id);
  }

  @Delete('connect/accounts/:accountId')
  @ApiOperation({ summary: 'Delete (deactivate) Connect account' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConnectAccount(@Param('accountId') accountId: string) {
    await this.stripeConnectService.deleteAccount(accountId);
  }

  @Post('connect/accounts/:accountId/onboarding')
  @ApiOperation({ summary: 'Create onboarding link for Connect account' })
  @ApiResponse({ status: 200, description: 'Onboarding link created' })
  async createOnboardingLink(
    @Param('accountId') accountId: string,
    @Body() createLinkDto: CreateOnboardingLinkDto,
  ) {
    return this.stripeConnectService.createOnboardingLink({
      accountId,
      ...createLinkDto,
    });
  }

  @Post('connect/accounts/:accountId/update-link')
  @ApiOperation({ summary: 'Create account update link' })
  @ApiResponse({ status: 200, description: 'Update link created' })
  async createAccountUpdateLink(
    @Param('accountId') accountId: string,
    @Body() body: { refreshUrl: string; returnUrl: string },
  ) {
    return this.stripeConnectService.createAccountUpdateLink(
      accountId,
      body.refreshUrl,
      body.returnUrl,
    );
  }

  @Post('connect/accounts/:accountId/payouts/configure')
  @ApiOperation({ summary: 'Configure payout schedule' })
  @ApiResponse({ status: 200, description: 'Payout schedule configured' })
  async configurePayouts(
    @Param('accountId') accountId: string,
    @Body() configDto: ConfigurePayoutsDto,
  ) {
    await this.stripeConnectService.configurePayouts({
      accountId,
      ...configDto,
    });
    return { success: true };
  }

  @Get('connect/accounts/:accountId/balance')
  @ApiOperation({ summary: 'Get Connect account balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved' })
  async getAccountBalance(@Param('accountId') accountId: string) {
    return this.stripeConnectService.getAccountBalance(accountId);
  }

  @Get('connect/accounts/:accountId/capabilities')
  @ApiOperation({ summary: 'Check account capabilities' })
  @ApiResponse({ status: 200, description: 'Capabilities checked' })
  async checkCapabilities(@Param('accountId') accountId: string) {
    const [canAcceptPayments, canReceivePayouts] = await Promise.all([
      this.stripeConnectService.canAcceptPayments(accountId),
      this.stripeConnectService.canReceivePayouts(accountId),
    ]);

    return {
      canAcceptPayments,
      canReceivePayouts,
    };
  }

  // Payment Endpoints

  @Post('payments/intents')
  @ApiOperation({ summary: 'Create a payment intent' })
  @ApiResponse({ status: 201, description: 'Payment intent created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createPaymentIntent(
    @Request() req,
    @Body() createPaymentDto: CreatePaymentIntentDto,
  ) {
    this.logger.log(`Creating payment intent for user ${req.user.id}`);

    return this.stripePaymentsService.createPaymentIntent({
      ...createPaymentDto,
      userId: req.user.id,
    });
  }

  @Get('payments/intents/:paymentIntentId')
  @ApiOperation({ summary: 'Get payment intent details' })
  @ApiResponse({ status: 200, description: 'Payment intent retrieved' })
  async getPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
    return this.stripePaymentsService.getPaymentIntent(paymentIntentId);
  }

  @Post('payments/intents/:paymentIntentId/confirm')
  @ApiOperation({ summary: 'Confirm a payment intent' })
  @ApiResponse({ status: 200, description: 'Payment intent confirmed' })
  async confirmPaymentIntent(
    @Param('paymentIntentId') paymentIntentId: string,
    @Body() confirmDto?: ConfirmPaymentIntentDto,
  ) {
    return this.stripePaymentsService.confirmPaymentIntent(
      paymentIntentId,
      confirmDto?.paymentMethodId,
    );
  }

  @Post('payments/intents/:paymentIntentId/cancel')
  @ApiOperation({ summary: 'Cancel a payment intent' })
  @ApiResponse({ status: 204, description: 'Payment intent canceled' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
    await this.stripePaymentsService.cancelPaymentIntent(paymentIntentId);
  }

  // Transfer Endpoints

  @Post('transfers')
  @ApiOperation({ summary: 'Create a transfer to connected account' })
  @ApiResponse({ status: 201, description: 'Transfer created' })
  async createTransfer(
    @Request() req,
    @Body() createTransferDto: CreateTransferDto,
  ) {
    return this.stripePaymentsService.createTransfer({
      ...createTransferDto,
      userId: req.user.id,
    });
  }

  // Refund Endpoints

  @Post('refunds')
  @ApiOperation({ summary: 'Create a refund for a payment' })
  @ApiResponse({ status: 201, description: 'Refund created' })
  async createRefund(
    @Request() req,
    @Body() createRefundDto: CreateRefundDto,
  ) {
    return this.stripePaymentsService.createRefund({
      ...createRefundDto,
      userId: req.user.id,
    });
  }
}
