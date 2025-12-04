import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { XeroAuthService } from './xero-auth.service';
import { XeroController } from './xero.controller';
import { DatabaseModule } from '../../database/database.module';

// Sync services
import { XeroSyncService } from './services/xero-sync.service';
import { XeroMappingService } from './services/xero-mapping.service';
import { XeroCustomerSyncService } from './services/xero-customer-sync.service';
import { XeroInvoiceSyncService } from './services/xero-invoice-sync.service';
import { XeroPaymentSyncService } from './services/xero-payment-sync.service';

// Background jobs
import { XeroSyncProcessor } from './jobs/xero-sync.job';

import xeroConfig from './xero.config';

/**
 * Xero Integration Module
 * Provides OAuth2-based integration with Xero API and bidirectional data sync
 *
 * Features:
 * - OAuth2 with PKCE authorization flow
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh mechanism
 * - Multi-tenant support (connect multiple Xero organizations)
 * - Bidirectional data synchronization (Operate <-> Xero)
 * - Real-time entity sync
 * - Scheduled background sync jobs (BullMQ)
 * - Rate limiting (60 requests/minute)
 * - Webhook signature verification
 * - Comprehensive audit logging
 * - Connection status management
 *
 * Sync Capabilities:
 * - Contacts (customers/suppliers)
 * - Invoices (sales invoices)
 * - Payments
 * - Full sync: Import all data from Xero
 * - Incremental sync: Only changed data since last sync
 * - Realtime sync: Push single entity changes to Xero
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
 * - XERO_CLIENT_ID: Xero app client ID
 * - XERO_CLIENT_SECRET: Xero app client secret
 * - XERO_REDIRECT_URI: OAuth callback URL
 * - XERO_WEBHOOK_KEY: Webhook signature key for webhook verification
 * - XERO_ENCRYPTION_KEY: Master key for token encryption (min 32 chars)
 * - REDIS_HOST: Redis host for BullMQ (optional, default: localhost)
 * - REDIS_PORT: Redis port for BullMQ (optional, default: 6379)
 *
 * API Scopes:
 * - openid: OpenID Connect
 * - profile: User profile
 * - email: User email
 * - accounting.transactions: Read/write accounting transactions
 * - accounting.contacts: Read/write contacts
 * - accounting.settings: Read accounting settings
 * - offline_access: Refresh token access
 */
@Module({
  imports: [
    ConfigModule.forFeature(xeroConfig),
    DatabaseModule,
    ScheduleModule.forRoot(), // Enable scheduled jobs
    // BullMQ for background sync jobs
    BullModule.registerQueue({
      name: 'xero-sync',
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
  ],
  controllers: [XeroController],
  providers: [
    // Auth service
    XeroAuthService,
    
    // Sync services
    XeroSyncService,
    XeroMappingService,
    XeroCustomerSyncService,
    XeroInvoiceSyncService,
    XeroPaymentSyncService,
    
    // Background job processor
    XeroSyncProcessor,
  ],
  exports: [
    XeroAuthService,
    XeroSyncService,
    XeroMappingService,
  ],
})
export class XeroModule {}
