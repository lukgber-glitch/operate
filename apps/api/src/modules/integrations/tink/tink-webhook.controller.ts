import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TinkService } from './tink.service';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Public } from '../../../common/decorators/public.decorator';
import {
  TinkWebhookPayload,
  TinkWebhookEventType,
  TinkWebhookTransaction,
  TinkWebhookAccount,
} from './dto/tink-webhook.dto';
import * as crypto from 'crypto';
import { ReconciliationStatus } from '@prisma/client';

/**
 * Tink Webhook Controller
 * Handles real-time webhook events from Tink for transaction and account updates
 *
 * Events Supported:
 * - TRANSACTION_CREATED: New transaction detected
 * - TRANSACTION_UPDATED: Existing transaction updated
 * - ACCOUNT_BALANCE_UPDATED: Account balance changed
 *
 * Security:
 * - HMAC-SHA256 signature verification
 * - Idempotency handling (duplicate event prevention)
 * - Rate limiting
 *
 * Flow:
 * 1. Verify webhook signature
 * 2. Check for duplicate events
 * 3. Store webhook event
 * 4. Process event based on type
 * 5. Trigger classification pipeline for transactions
 * 6. Emit real-time events for UI updates
 *
 * @see https://docs.tink.com/api/webhooks
 */
@Controller('webhooks/tink')
export class TinkWebhookController {
  private readonly logger = new Logger(TinkWebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly tinkService: TinkService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    // Get webhook secret for signature verification
    this.webhookSecret = this.configService.get<string>('TINK_WEBHOOK_SECRET') || '';

    if (!this.webhookSecret) {
      this.logger.warn('TINK_WEBHOOK_SECRET not configured - webhook signature verification will fail');
    }
  }

  /**
   * Handle incoming Tink webhook events
   * POST /webhooks/tink
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: TinkWebhookPayload,
    @Headers('x-tink-signature') signature: string,
    @Req() req: any,
  ): Promise<{ success: boolean; eventId?: string }> {
    try {
      // Verify webhook signature
      const rawBody = req.rawBody || Buffer.from(JSON.stringify(payload));
      if (!this.verifySignature(rawBody, signature)) {
        this.logger.error('Invalid webhook signature', { signature });
        throw new BadRequestException('Invalid webhook signature');
      }

      this.logger.log('Received Tink webhook event', {
        eventType: payload.eventType,
        userId: payload.userId,
        timestamp: payload.timestamp,
      });

      // Process the webhook event
      const eventId = await this.processWebhookEvent(payload);

      return { success: true, eventId };
    } catch (error) {
      this.logger.error('Failed to process Tink webhook', {
        error: error.message,
        stack: error.stack,
      });

      // Return 200 even on error to prevent Tink from retrying invalid events
      // But log the error for investigation
      if (error instanceof BadRequestException) {
        throw error;
      }

      return { success: false };
    }
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  private verifySignature(rawBody: Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping signature verification');
      return true; // Allow in development/testing
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }

  /**
   * Process individual webhook event
   */
  private async processWebhookEvent(payload: TinkWebhookPayload): Promise<string> {
    const eventId = `${payload.eventType}_${payload.userId}_${payload.timestamp}`;

    // Check for duplicate events using raw SQL (table may not exist in Prisma schema yet)
    try {
      const existing = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM tink_webhook_events
        WHERE event_id = ${eventId}
        LIMIT 1
      `;

      if (existing && existing.length > 0) {
        this.logger.log('Duplicate webhook event, skipping', { eventId });
        return eventId;
      }
    } catch (error) {
      // Table might not exist yet, continue processing
      this.logger.warn('Could not check for duplicate events', error.message);
    }

    // Store webhook event (use raw SQL in case table doesn't exist)
    try {
      await this.prisma.$executeRaw`
        INSERT INTO tink_webhook_events (event_id, event_type, user_id, payload, created_at)
        VALUES (${eventId}, ${payload.eventType}, ${payload.userId}, ${JSON.stringify(payload)}::jsonb, NOW())
        ON CONFLICT (event_id) DO NOTHING
      `;
    } catch (error) {
      this.logger.warn('Could not store webhook event', error.message);
    }

    // Route to appropriate handler based on event type
    switch (payload.eventType) {
      case TinkWebhookEventType.TRANSACTION_CREATED:
      case TinkWebhookEventType.TRANSACTION_UPDATED:
        await this.handleTransactionEvent(payload);
        break;

      case TinkWebhookEventType.ACCOUNT_BALANCE_UPDATED:
      case TinkWebhookEventType.ACCOUNT_UPDATED:
        await this.handleAccountEvent(payload);
        break;

      case TinkWebhookEventType.CREDENTIALS_UPDATED:
      case TinkWebhookEventType.CREDENTIALS_REFRESH_FAILED:
        await this.handleCredentialsEvent(payload);
        break;

      default:
        this.logger.log('Unhandled webhook event type', {
          eventType: payload.eventType,
        });
    }

    // Emit event for real-time UI updates
    this.eventEmitter.emit(`tink.webhook.${payload.eventType}`, payload);

    return eventId;
  }

  /**
   * Handle transaction events (created/updated)
   */
  private async handleTransactionEvent(payload: TinkWebhookPayload): Promise<void> {
    const transaction = payload.data.transaction as TinkWebhookTransaction;

    if (!transaction) {
      this.logger.warn('Transaction event missing transaction data', { payload });
      return;
    }

    try {
      // Find the organization for this Tink user
      const credentials = await this.prisma.$queryRaw<any[]>`
        SELECT organization_id, user_id
        FROM tink_credentials
        WHERE user_id = ${payload.userId}
        LIMIT 1
      `;

      if (!credentials || credentials.length === 0) {
        this.logger.warn('No credentials found for Tink userId', { userId: payload.userId });
        return;
      }

      const { organization_id: orgId } = credentials[0];

      // Find the bank account for this transaction via BankConnection
      const bankAccount = await this.prisma.bankAccountNew.findFirst({
        where: {
          accountId: transaction.accountId,
          bankConnection: {
            provider: 'TINK',
            orgId,
          },
        },
        include: {
          bankConnection: true,
        },
      });

      if (!bankAccount) {
        this.logger.warn('Bank account not found for transaction', {
          accountId: transaction.accountId,
        });
        return;
      }

      // Calculate actual amount from unscaled value
      const amount = transaction.amount.value.unscaledValue / Math.pow(10, transaction.amount.value.scale);

      // Find existing transaction
      const existingTransaction = await this.prisma.bankTransactionNew.findFirst({
        where: {
          transactionId: transaction.id,
          bankAccountId: bankAccount.id,
        },
      });

      // Upsert transaction
      const bankTransaction = existingTransaction
        ? await this.prisma.bankTransactionNew.update({
            where: {
              id: existingTransaction.id,
            },
            data: {
              amount: amount,
              description: transaction.descriptions.display || transaction.descriptions.original,
              merchantName: transaction.merchantInformation?.merchantName,
              merchantCategory: transaction.merchantInformation?.merchantCategoryCode,
              metadata: {
                tink: {
                  transactionId: transaction.id,
                  type: transaction.types.type,
                  financialInstitutionType: transaction.types.financialInstitutionType,
                  providerTransactionId: transaction.identifiers?.providerTransactionId,
                  rawStatus: transaction.status,
                },
              },
            },
          })
        : await this.prisma.bankTransactionNew.create({
            data: {
              transactionId: transaction.id,
              bankAccountId: bankAccount.id,
              amount: amount,
              currency: transaction.amount.currencyCode,
              description: transaction.descriptions.display || transaction.descriptions.original,
              merchantName: transaction.merchantInformation?.merchantName,
              merchantCategory: transaction.merchantInformation?.merchantCategoryCode,
              bookingDate: new Date(transaction.dates.booked),
              valueDate: transaction.dates.value ? new Date(transaction.dates.value) : new Date(transaction.dates.booked),
              transactionType: 'DEBIT', // Will need to determine from amount
              status: 'BOOKED',
              reconciliationStatus: ReconciliationStatus.UNMATCHED,
              metadata: {
                tink: {
                  transactionId: transaction.id,
                  type: transaction.types.type,
                  financialInstitutionType: transaction.types.financialInstitutionType,
                  providerTransactionId: transaction.identifiers?.providerTransactionId,
                  rawStatus: transaction.status,
                },
              },
            },
          });

      this.logger.log('Transaction synced from webhook', {
        transactionId: bankTransaction.id,
        externalId: transaction.id,
        amount,
        currency: transaction.amount.currencyCode,
      });

      // Emit event to trigger classification pipeline
      this.eventEmitter.emit('tink.transaction.synced', {
        transactionId: bankTransaction.id,
        orgId,
        accountId: bankAccount.id,
        isNew: payload.eventType === TinkWebhookEventType.TRANSACTION_CREATED,
        timestamp: new Date(),
      });

      // For new transactions, trigger real-time classification
      if (payload.eventType === TinkWebhookEventType.TRANSACTION_CREATED) {
        this.eventEmitter.emit('transaction.needs.classification', {
          transactionId: bankTransaction.id,
          orgId,
          priority: 'high', // Real-time webhook = high priority
        });
      }
    } catch (error) {
      this.logger.error('Failed to process transaction event', {
        error: error.message,
        transactionId: transaction.id,
      });
      throw error;
    }
  }

  /**
   * Handle account events (balance updated)
   */
  private async handleAccountEvent(payload: TinkWebhookPayload): Promise<void> {
    const account = payload.data.account as TinkWebhookAccount;

    if (!account) {
      this.logger.warn('Account event missing account data', { payload });
      return;
    }

    try {
      // Calculate actual balance from unscaled value
      const bookedBalance = account.balances.booked.amount.value.unscaledValue /
        Math.pow(10, account.balances.booked.amount.value.scale);

      const availableBalance = account.balances.available
        ? account.balances.available.amount.value.unscaledValue /
          Math.pow(10, account.balances.available.amount.value.scale)
        : null;

      // Find and update bank account balance
      const bankAccount = await this.prisma.bankAccountNew.findFirst({
        where: {
          accountId: account.id,
        },
        include: {
          bankConnection: true,
        },
      });

      if (!bankAccount) {
        this.logger.warn('Bank account not found for balance update', {
          accountId: account.id,
        });
        return;
      }

      await this.prisma.bankAccountNew.update({
        where: {
          id: bankAccount.id,
        },
        data: {
          currentBalance: bookedBalance,
          availableBalance: availableBalance,
          lastBalanceUpdate: new Date(account.dates.lastRefreshed),
        },
      });

      this.logger.log('Account balance updated from webhook', {
        accountId: bankAccount.id,
        externalId: account.id,
        bookedBalance,
        availableBalance,
      });

      // Emit event for real-time UI updates
      this.eventEmitter.emit('tink.account.balance.updated', {
        accountId: bankAccount.id,
        orgId: bankAccount.bankConnection.orgId,
        bookedBalance,
        availableBalance,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to process account event', {
        error: error.message,
        accountId: account.id,
      });
      throw error;
    }
  }

  /**
   * Handle credentials events (updated/refresh failed)
   */
  private async handleCredentialsEvent(payload: TinkWebhookPayload): Promise<void> {
    const credentialsId = payload.data.credentialsId;

    this.logger.log('Credentials event received', {
      eventType: payload.eventType,
      credentialsId,
      userId: payload.userId,
    });

    try {
      // Find credentials
      const credentials = await this.prisma.$queryRaw<any[]>`
        SELECT organization_id, user_id
        FROM tink_credentials
        WHERE user_id = ${payload.userId}
        LIMIT 1
      `;

      if (!credentials || credentials.length === 0) {
        this.logger.warn('No credentials found for event', { userId: payload.userId });
        return;
      }

      const { organization_id: orgId, user_id: userId } = credentials[0];

      // Emit event based on type
      if (payload.eventType === TinkWebhookEventType.CREDENTIALS_REFRESH_FAILED) {
        this.eventEmitter.emit('tink.credentials.refresh.failed', {
          orgId,
          userId,
          credentialsId,
          reason: payload.data,
          timestamp: new Date(),
        });

        // Log audit entry
        await this.prisma.$executeRaw`
          INSERT INTO tink_audit_logs
          (organization_id, user_id, action, endpoint, method, status_code, duration, metadata, timestamp)
          VALUES
          (${orgId}, ${userId}, 'credentials:refresh_failed', '/webhooks/tink', 'POST', 200, 0,
           ${JSON.stringify(payload.data)}::jsonb, NOW())
        `;
      } else {
        this.eventEmitter.emit('tink.credentials.updated', {
          orgId,
          userId,
          credentialsId,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Failed to process credentials event', {
        error: error.message,
        credentialsId,
      });
    }
  }
}
