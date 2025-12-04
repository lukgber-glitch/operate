import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { FreeeOAuthService } from './freee-oauth.service';
import { FreeeService } from './freee.service';
import { FreeeController } from './freee.controller';
import { DatabaseModule } from '../../database/database.module';

// Mappers
import { FreeeContactMapper } from './mappers/contact.mapper';
import { FreeeInvoiceMapper } from './mappers/invoice.mapper';
import { FreeeTransactionMapper } from './mappers/transaction.mapper';

import freeeConfig from './freee.config';

/**
 * freee Integration Module
 * Provides OAuth2-based integration with freee API and bidirectional data sync
 *
 * Features:
 * - OAuth2 with PKCE authorization flow
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh mechanism
 * - Multi-company support (connect multiple freee companies)
 * - Bidirectional data synchronization (Operate <-> freee)
 * - Real-time entity sync
 * - Scheduled background sync jobs (BullMQ)
 * - Rate limiting (600 requests per 10 minutes per company)
 * - Comprehensive audit logging
 * - Connection status management
 * - Japanese fiscal year support (April-March)
 *
 * Sync Capabilities:
 * - Partners/Contacts (取引先) - customers, vendors, employees
 * - Invoices (請求書) - sales invoices with line items
 * - Deals (取引) - income/expense transactions
 * - Wallet Transactions (明細) - bank/credit card transactions
 * - Full sync: Import all data from freee
 * - Incremental sync: Only changed data since last sync
 * - Realtime sync: Push single entity changes to freee
 * - Conflict detection: Identify when both sides modified
 *
 * Security:
 * - PKCE (Proof Key for Code Exchange) for enhanced OAuth security
 * - State parameter validation for CSRF protection
 * - Encrypted token storage in database
 * - Token refresh before expiry
 * - Secure token revocation on disconnect
 *
 * Environment Variables Required:
 * - FREEE_CLIENT_ID: freee app client ID
 * - FREEE_CLIENT_SECRET: freee app client secret
 * - FREEE_REDIRECT_URI: OAuth callback URL
 * - FREEE_WEBHOOK_SECRET: Webhook signature key (optional)
 * - FREEE_ENCRYPTION_KEY: Master key for token encryption (min 32 chars)
 * - REDIS_HOST: Redis host for BullMQ (optional, default: localhost)
 * - REDIS_PORT: Redis port for BullMQ (optional, default: 6379)
 *
 * API Scopes:
 * - read: Read access to accounting data
 * - write: Write access to accounting data
 *
 * Rate Limits:
 * - 600 requests per 10 minutes per company
 * - 1 request per second (conservative to avoid bursts)
 */
@Module({
  imports: [
    ConfigModule.forFeature(freeeConfig),
    DatabaseModule,
    ScheduleModule.forRoot(), // Enable scheduled jobs
    // BullMQ for background sync jobs
    BullModule.registerQueue({
      name: 'freee-sync',
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
  ],
  controllers: [FreeeController],
  providers: [
    // OAuth service
    FreeeOAuthService,

    // Main API service
    FreeeService,

    // Mappers
    FreeeContactMapper,
    FreeeInvoiceMapper,
    FreeeTransactionMapper,

    // Background job processor will be added in future
    // FreeeSyncProcessor,
  ],
  exports: [
    FreeeOAuthService,
    FreeeService,
    FreeeContactMapper,
    FreeeInvoiceMapper,
    FreeeTransactionMapper,
  ],
})
export class FreeeModule {}
