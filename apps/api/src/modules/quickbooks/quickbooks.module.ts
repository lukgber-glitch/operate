import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { QuickBooksAuthService } from './quickbooks-auth.service';
import { QuickBooksController } from './quickbooks.controller';
import { DatabaseModule } from '../database/database.module';
import quickbooksConfig from './quickbooks.config';

// Sync services
import { QuickBooksMappingService } from './services/quickbooks-mapping.service';
import { QuickBooksCustomerSyncService } from './services/quickbooks-customer-sync.service';
import { QuickBooksInvoiceSyncService } from './services/quickbooks-invoice-sync.service';
import { QuickBooksPaymentSyncService } from './services/quickbooks-payment-sync.service';
import { QuickBooksSyncService } from './services/quickbooks-sync.service';

// Background jobs
import { QuickBooksSyncJob } from './jobs/quickbooks-sync.job';

/**
 * QuickBooks Online Integration Module
 * Provides OAuth2-based integration with QuickBooks Online API
 *
 * Features:
 * - OAuth2 with PKCE authorization flow
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh mechanism
 * - Bidirectional data synchronization
 * - Entity mapping and conflict resolution
 * - Comprehensive audit logging
 * - Connection status management
 * - Multi-organization support
 * - Background sync jobs
 *
 * Security:
 * - PKCE (Proof Key for Code Exchange) for enhanced OAuth security
 * - State parameter validation for CSRF protection
 * - Encrypted token storage in database
 * - Token refresh before expiry
 * - Secure token revocation on disconnect
 *
 * Sync Capabilities:
 * - Full sync: Import all data from QuickBooks
 * - Incremental sync: Sync only changes since last sync
 * - Real-time sync: Webhook-based instant updates
 * - Conflict detection and resolution
 * - Entity mappings (Customers, Invoices, Payments)
 *
 * Environment Variables Required:
 * - QUICKBOOKS_CLIENT_ID: QuickBooks app client ID
 * - QUICKBOOKS_CLIENT_SECRET: QuickBooks app client secret
 * - QUICKBOOKS_REDIRECT_URI: OAuth callback URL
 * - QUICKBOOKS_ENVIRONMENT: 'sandbox' or 'production'
 * - QUICKBOOKS_ENCRYPTION_KEY: Master key for token encryption (min 32 chars)
 *
 * Optional Environment Variables:
 * - QUICKBOOKS_MINOR_VERSION: QuickBooks API minor version (default: 65)
 * - QUICKBOOKS_WEBHOOK_TOKEN: Webhook verifier token for webhooks
 */
@Module({
  imports: [
    ConfigModule.forFeature(quickbooksConfig),
    DatabaseModule,
    ScheduleModule.forRoot(), // Enable scheduled jobs
  ],
  controllers: [QuickBooksController],
  providers: [
    // Auth service
    QuickBooksAuthService,

    // Sync services
    QuickBooksMappingService,
    QuickBooksCustomerSyncService,
    QuickBooksInvoiceSyncService,
    QuickBooksPaymentSyncService,
    QuickBooksSyncService,

    // Background jobs
    QuickBooksSyncJob,
  ],
  exports: [
    QuickBooksAuthService,
    QuickBooksSyncService,
    QuickBooksMappingService,
  ],
})
export class QuickBooksModule {}
