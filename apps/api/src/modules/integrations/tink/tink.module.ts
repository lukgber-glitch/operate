import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TinkService } from './tink.service';
import { TinkController } from './tink.controller';
import { TinkWebhookController } from './tink-webhook.controller';
import { DatabaseModule } from '../../database/database.module';
import tinkConfig from './tink.config';

/**
 * Tink Open Banking Integration Module
 * Provides PSD2-compliant EU bank connection capabilities
 *
 * Features:
 * - OAuth2 with PKCE authorization flow
 * - AES-256-GCM encrypted token storage
 * - Account and transaction data retrieval
 * - Real-time webhook support for transactions and balances
 * - Multi-country support (EU markets)
 * - Mock mode for development
 * - Comprehensive audit logging
 */
@Module({
  imports: [
    ConfigModule.forFeature(tinkConfig),
    DatabaseModule,
  ],
  controllers: [TinkController, TinkWebhookController],
  providers: [TinkService],
  exports: [TinkService],
})
export class TinkModule {}
