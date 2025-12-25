import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TrueLayerWebhookHandler {
  private readonly logger = new Logger(TrueLayerWebhookHandler.name);

  async handleWebhook(
    payload: any,
    signature?: string,
  ): Promise<{ received: boolean }> {
    try {
      this.logger.log(`Received TrueLayer webhook: ${payload.type}`);

      // Validate webhook signature if present
      if (signature) {
        this.logger.debug('Webhook signature validation not yet implemented');
        // TODO: Implement signature validation using TrueLayer public key
        // This ensures the webhook actually came from TrueLayer
      }

      // Route by event type
      switch (payload.type) {
        case 'transactions_updated':
          await this.handleTransactionsUpdated(payload);
          break;

        case 'balance_updated':
          await this.handleBalanceUpdated(payload);
          break;

        case 'account_error':
          await this.handleAccountError(payload);
          break;

        default:
          this.logger.warn(`Unknown webhook type: ${payload.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(
        `Error handling TrueLayer webhook: ${error.message}`,
        error.stack,
      );
      // Still return received: true to acknowledge receipt to TrueLayer
      // Prevents webhook retry storms
      return { received: true };
    }
  }

  private async handleTransactionsUpdated(payload: any): Promise<void> {
    this.logger.log(
      `Processing transactions_updated webhook for account: ${payload.account_id}`,
    );
    // TODO: Fetch new transactions from TrueLayer API
    // TODO: Store/update transactions in database
    // TODO: Trigger auto-classification pipeline
  }

  private async handleBalanceUpdated(payload: any): Promise<void> {
    this.logger.log(
      `Processing balance_updated webhook for account: ${payload.account_id}`,
    );
    // TODO: Fetch updated balance from TrueLayer API
    // TODO: Update balance in database
    // TODO: Trigger cash flow alerts if needed
  }

  private async handleAccountError(payload: any): Promise<void> {
    this.logger.error(
      `Account error received for account: ${payload.account_id}`,
      payload.error,
    );
    // TODO: Mark account as needing reconnection
    // TODO: Notify user about account connection issue
    // TODO: Store error details for troubleshooting
  }
}
