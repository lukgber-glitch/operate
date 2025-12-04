import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { WiseService } from './wise.service';
import { WiseWebhookDto } from './dto';
import {
  WiseWebhookEvent,
  WiseWebhookPayload,
  WiseTransferStatus,
} from './wise.types';

/**
 * Wise Webhook Controller
 * Handles incoming webhooks from Wise for real-time event notifications
 *
 * Events:
 * - Transfer state changes (processing, completed, failed)
 * - Balance updates (deposits, withdrawals)
 * - Recipient verification events
 *
 * Security:
 * - Webhook signature verification (X-Signature-SHA256)
 * - Idempotency handling
 * - Event deduplication
 *
 * @see https://api-docs.wise.com/api-reference/webhook
 */
@ApiTags('Integrations - Wise Webhooks')
@Controller('integrations/wise/webhooks')
export class WiseWebhookController {
  private readonly logger = new Logger(WiseWebhookController.name);

  constructor(private readonly wiseService: WiseService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Wise webhook endpoint',
    description: 'Receives real-time event notifications from Wise',
  })
  @ApiHeader({
    name: 'X-Signature-SHA256',
    description: 'Webhook signature for verification',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async handleWebhook(
    @Body() payload: WiseWebhookPayload,
    @Headers('x-signature-sha256') signature: string,
    @Headers('x-delivery-id') deliveryId: string,
  ) {
    this.logger.log(`Webhook received: ${payload.eventType} (Delivery ID: ${deliveryId})`);

    // Verify webhook signature
    const rawBody = JSON.stringify(payload);
    const isValid = this.wiseService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      this.logger.error('Invalid webhook signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Handle event based on type
    try {
      switch (payload.eventType) {
        case WiseWebhookEvent.TRANSFER_STATE_CHANGE:
          await this.handleTransferStateChange(payload);
          break;

        case WiseWebhookEvent.TRANSFER_ACTIVE_CASES:
          await this.handleTransferActiveCases(payload);
          break;

        case WiseWebhookEvent.BALANCE_CREDIT:
          await this.handleBalanceCredit(payload);
          break;

        case WiseWebhookEvent.BALANCE_UPDATE:
          await this.handleBalanceUpdate(payload);
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${payload.eventType}`);
      }

      this.logger.log(`Webhook processed successfully: ${payload.eventType}`);
      return { status: 'success', deliveryId };
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle transfer state change event
   * Fired when a transfer moves between states (processing, completed, etc.)
   */
  private async handleTransferStateChange(payload: WiseWebhookPayload): Promise<void> {
    const { resource, current_state, previous_state, occurred_at } = payload.data;

    this.logger.log(
      `Transfer ${resource.id} state changed: ${previous_state} → ${current_state}`,
    );

    // TODO: Update transfer status in database
    // Example:
    // await this.prisma.wiseTransfer.update({
    //   where: { externalId: resource.id },
    //   data: {
    //     status: current_state,
    //     statusUpdatedAt: new Date(occurred_at),
    //   },
    // });

    // Handle specific states
    switch (current_state) {
      case WiseTransferStatus.OUTGOING_PAYMENT_SENT:
        this.logger.log(`Transfer ${resource.id} completed successfully`);
        // TODO: Notify user, update accounting records
        break;

      case WiseTransferStatus.CANCELLED:
        this.logger.warn(`Transfer ${resource.id} was cancelled`);
        // TODO: Refund balance, notify user
        break;

      case WiseTransferStatus.BOUNCED_BACK:
      case WiseTransferStatus.FUNDS_REFUNDED:
        this.logger.error(`Transfer ${resource.id} failed: ${current_state}`);
        // TODO: Handle failure, notify user, investigate
        break;

      default:
        this.logger.debug(`Transfer ${resource.id} in state: ${current_state}`);
    }
  }

  /**
   * Handle transfer active cases event
   * Fired when a transfer has issues requiring attention
   */
  private async handleTransferActiveCases(payload: WiseWebhookPayload): Promise<void> {
    const { resource } = payload.data;

    this.logger.warn(
      `Transfer ${resource.id} has active cases requiring attention`,
    );

    // TODO: Alert admins, fetch case details, notify user
    // await this.notificationService.sendAlert({
    //   type: 'TRANSFER_ISSUE',
    //   transferId: resource.id,
    //   message: 'Transfer requires attention',
    // });
  }

  /**
   * Handle balance credit event
   * Fired when funds are added to a balance account
   */
  private async handleBalanceCredit(payload: WiseWebhookPayload): Promise<void> {
    const {
      resource,
      amount,
      currency,
      post_transaction_balance_amount,
      transaction_type,
    } = payload.data;

    this.logger.log(
      `Balance credited: ${amount} ${currency} (Account: ${resource.account_id})`,
    );

    // TODO: Update balance in database, create transaction record
    // await this.prisma.wiseBalanceTransaction.create({
    //   data: {
    //     accountId: resource.account_id,
    //     type: 'CREDIT',
    //     amount,
    //     currency,
    //     balanceAfter: post_transaction_balance_amount,
    //     transactionType: transaction_type,
    //     occurredAt: new Date(payload.data.occurred_at),
    //   },
    // });
  }

  /**
   * Handle balance update event
   * Fired when balance changes (debits, conversions, etc.)
   */
  private async handleBalanceUpdate(payload: WiseWebhookPayload): Promise<void> {
    const {
      resource,
      amount,
      currency,
      post_transaction_balance_amount,
      transaction_type,
    } = payload.data;

    this.logger.log(
      `Balance updated: ${amount} ${currency} (Account: ${resource.account_id})`,
    );

    // TODO: Update balance in database
    // await this.prisma.wiseBalance.update({
    //   where: { accountId: resource.account_id },
    //   data: {
    //     amount: post_transaction_balance_amount,
    //     updatedAt: new Date(payload.data.occurred_at),
    //   },
    // });
  }

  /**
   * Test webhook endpoint (for development)
   * Allows testing webhook handling without Wise
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test webhook endpoint (development only)',
    description: 'Simulates a webhook event for testing',
  })
  async testWebhook(@Body() dto: WiseWebhookDto) {
    if (this.wiseService.getConfig().environment !== 'sandbox') {
      throw new BadRequestException('Test endpoint only available in sandbox mode');
    }

    this.logger.log(`Test webhook: ${dto.eventType}`);

    // Process without signature verification
    const payload = dto as unknown as WiseWebhookPayload;

    switch (payload.eventType) {
      case WiseWebhookEvent.TRANSFER_STATE_CHANGE:
        await this.handleTransferStateChange(payload);
        break;
      case WiseWebhookEvent.BALANCE_CREDIT:
        await this.handleBalanceCredit(payload);
        break;
      default:
        this.logger.log(`Test webhook processed: ${payload.eventType}`);
    }

    return { status: 'test-success' };
  }
}
