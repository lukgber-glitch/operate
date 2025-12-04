import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WiseService } from './wise.service';
import { WiseTransferService } from './services/wise-transfer.service';
import { WiseBalanceService } from './services/wise-balance.service';
import { WiseController } from './wise.controller';
import { WiseWebhookController } from './wise-webhook.controller';
import wiseConfig from './wise.config';

/**
 * Wise Business Integration Module
 * Provides international money transfer and multi-currency account capabilities
 *
 * Features:
 * - Real-time exchange rate quotes
 * - International transfers (50+ currencies)
 * - Multi-currency borderless accounts
 * - Recipient account management
 * - Balance management and conversions
 * - Transaction statements
 * - Webhook handling for real-time updates
 * - Comprehensive audit logging
 *
 * Security:
 * - API tokens encrypted before storage (AES-256-GCM)
 * - Webhook signature verification (X-Signature-SHA256)
 * - No sensitive data in logs
 * - Comprehensive audit logging
 *
 * Use Cases:
 * - International supplier payments
 * - Multi-currency payroll
 * - Freelancer payments
 * - Cross-border invoice settlement
 * - Currency hedging
 * - International collections
 *
 * @see https://api-docs.wise.com/
 */
@Module({
  imports: [
    ConfigModule.forFeature(wiseConfig),
  ],
  controllers: [
    WiseController,
    WiseWebhookController,
  ],
  providers: [
    WiseService,
    WiseTransferService,
    WiseBalanceService,
  ],
  exports: [
    WiseService,
    WiseTransferService,
    WiseBalanceService,
  ],
})
export class WiseModule {}
