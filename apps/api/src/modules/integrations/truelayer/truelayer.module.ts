import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TrueLayerService } from './truelayer.service';
import { TrueLayerBankingService } from './services/truelayer-banking.service';
import { TrueLayerTransactionMatcherService } from './services/truelayer-transaction-matcher.service';
import { TrueLayerController } from './truelayer.controller';
import { TrueLayerSyncProcessor } from './jobs/truelayer-sync.job';
import { TrueLayerBalanceRefreshProcessor } from './jobs/truelayer-balance-refresh.job';
import { DatabaseModule } from '../../database/database.module';
import trueLayerConfig from './truelayer.config';

/**
 * TrueLayer Integration Module
 * Provides UK bank connection capabilities via Open Banking (PSD2 compliant)
 *
 * Features:
 * - OAuth2 PKCE flow for secure authorization
 * - AES-256-GCM encrypted access token storage
 * - Account and transaction data retrieval
 * - Automatic token refresh handling
 * - Background sync jobs (BullMQ)
 * - Webhook handling for real-time updates
 * - Comprehensive audit logging
 * - Rate limiting on all endpoints
 *
 * Security:
 * - OAuth2 PKCE (Proof Key for Code Exchange)
 * - Access and refresh tokens encrypted before database storage
 * - Webhook signature verification
 * - No sensitive data in logs
 * - Rate limiting on all endpoints
 * - Comprehensive audit logging
 *
 * Background Jobs (Planned):
 * - Daily transaction sync
 * - Balance refresh
 * - Webhook processing
 * - Auto-matching transactions to invoices/expenses
 *
 * @see https://docs.truelayer.com/
 */
@Module({
  imports: [
    ConfigModule.forFeature(trueLayerConfig),
    DatabaseModule,
    BullModule.registerQueue(
      { name: 'truelayer-sync' },
      { name: 'truelayer-balance' },
      { name: 'truelayer-webhook' },
    ),
  ],
  controllers: [TrueLayerController],
  providers: [
    TrueLayerService,
    TrueLayerBankingService,
    TrueLayerTransactionMatcherService,
    TrueLayerSyncProcessor,
    TrueLayerBalanceRefreshProcessor,
  ],
  exports: [
    TrueLayerService,
    TrueLayerBankingService,
    TrueLayerTransactionMatcherService,
  ],
})
export class TrueLayerModule {}
