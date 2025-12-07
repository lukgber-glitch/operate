import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PlaidService } from './plaid.service';
import { PlaidController } from './plaid.controller';
import { DatabaseModule } from '../../database/database.module';
import plaidConfig from './plaid.config';

// Services
import { PlaidBankService } from './services/plaid-bank.service';
import { PlaidTransactionMatcherService } from './services/plaid-transaction-matcher.service';
import { PlaidRateLimiterService } from './services/plaid-rate-limiter.service';

// Job processors
import {
  PlaidDailySyncProcessor,
  PlaidBalanceRefreshProcessor,
  PlaidWebhookProcessor,
  PlaidAutoMatchProcessor,
} from './jobs/plaid-sync.job';

/**
 * Plaid Integration Module
 * Provides US bank connection capabilities via Plaid Link
 *
 * Features:
 * - OAuth2-compliant authorization flow
 * - AES-256-GCM encrypted access token storage
 * - Account and transaction data retrieval
 * - Transaction sync with incremental updates
 * - Intelligent transaction matching (invoices/expenses)
 * - Background sync jobs (BullMQ)
 * - Webhook handling for real-time updates
 * - Comprehensive audit logging
 * - Rate limiting on all endpoints
 *
 * Security:
 * - Access tokens encrypted before database storage
 * - Webhook signature verification
 * - No sensitive data in logs
 * - Rate limiting on all endpoints
 * - Comprehensive audit logging
 *
 * Background Jobs:
 * - Daily transaction sync
 * - Balance refresh
 * - Webhook processing
 * - Auto-matching transactions to invoices/expenses
 *
 * @see https://plaid.com/docs/
 */
@Module({
  imports: [
    ConfigModule.forFeature(plaidConfig),
    DatabaseModule,
    BullModule.registerQueue(
      { name: 'plaid-sync' },
      { name: 'plaid-balance' },
      { name: 'plaid-webhook' },
      { name: 'plaid-auto-match' },
    ),
  ],
  controllers: [PlaidController],
  providers: [
    // Core service
    PlaidService,

    // Bank services
    PlaidBankService,
    PlaidTransactionMatcherService,
    PlaidRateLimiterService,

    // Job processors
    PlaidDailySyncProcessor,
    PlaidBalanceRefreshProcessor,
    PlaidWebhookProcessor,
    PlaidAutoMatchProcessor,
  ],
  exports: [
    PlaidService,
    PlaidBankService,
    PlaidTransactionMatcherService,
    PlaidRateLimiterService,
  ],
})
export class PlaidModule {}
