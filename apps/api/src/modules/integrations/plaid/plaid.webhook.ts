import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PlaidWebhookHandler {
  private readonly logger = new Logger(PlaidWebhookHandler.name);

  async handleWebhook(payload: any): Promise<{ received: boolean }> {
    const { webhook_type, webhook_code, item_id } = payload;
    this.logger.log(
      `Received Plaid webhook: ${webhook_type}/${webhook_code} for item ${item_id}`,
    );

    try {
      switch (webhook_type) {
        case 'TRANSACTIONS':
          await this.handleTransactionsWebhook(webhook_code, payload);
          break;
        case 'ITEM':
          await this.handleItemWebhook(webhook_code, payload);
          break;
        default:
          this.logger.warn(`Unknown webhook type: ${webhook_type}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing Plaid webhook ${webhook_type}/${webhook_code}:`,
        error.stack,
      );
      // Still return success to acknowledge receipt
    }

    return { received: true };
  }

  private async handleTransactionsWebhook(
    code: string,
    payload: any,
  ): Promise<void> {
    const { item_id, new_transactions, removed_transactions } = payload;

    switch (code) {
      case 'SYNC_UPDATES_AVAILABLE':
        this.logger.log(
          `Transaction sync updates available for item ${item_id}`,
        );
        // TODO: Trigger transaction sync job
        break;

      case 'DEFAULT_UPDATE':
        this.logger.log(
          `Default transaction update for item ${item_id}. New: ${new_transactions || 0}, Removed: ${removed_transactions || 0}`,
        );
        // TODO: Process new and removed transactions
        break;

      case 'INITIAL_UPDATE':
        this.logger.log(`Initial transaction update for item ${item_id}`);
        // TODO: Trigger initial transaction fetch
        break;

      case 'HISTORICAL_UPDATE':
        this.logger.log(`Historical transaction update for item ${item_id}`);
        // TODO: Process historical transactions
        break;

      default:
        this.logger.warn(`Unknown transaction webhook code: ${code}`);
    }
  }

  private async handleItemWebhook(code: string, payload: any): Promise<void> {
    const { item_id, error } = payload;

    switch (code) {
      case 'ERROR':
        this.logger.error(
          `Item error for ${item_id}: ${error?.error_code} - ${error?.error_message}`,
        );
        // TODO: Update item status to error, notify user
        break;

      case 'PENDING_EXPIRATION':
        const { consent_expiration_time } = payload;
        this.logger.warn(
          `Item ${item_id} access will expire at ${consent_expiration_time}`,
        );
        // TODO: Notify user to re-authenticate
        break;

      case 'USER_PERMISSION_REVOKED':
        this.logger.warn(`User revoked permissions for item ${item_id}`);
        // TODO: Mark item as disconnected, notify user
        break;

      case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
        this.logger.log(`Webhook update acknowledged for item ${item_id}`);
        break;

      default:
        this.logger.warn(`Unknown item webhook code: ${code}`);
    }
  }
}
