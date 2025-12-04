/**
 * Xero Migration Module
 * Provides full data migration wizard from Xero to Operate
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { XeroMigrationController } from './xero-migration.controller';
import { XeroMigrationService } from './xero-migration.service';
import { XeroDataFetcherService } from './xero-data-fetcher.service';
import { XeroMapperService } from './xero-mapper.service';
import { DatabaseModule } from '../../database/database.module';
import { XeroModule } from '../../integrations/xero/xero.module';

/**
 * Xero Migration Module
 *
 * Features:
 * - Full data migration from Xero to Operate
 * - Multi-tenant support (select which Xero organization to migrate)
 * - Entity mapping configuration
 * - Conflict resolution strategies (skip, overwrite, create new, merge)
 * - Progress tracking with WebSocket updates
 * - Resumable migrations (pause/resume capability)
 * - Rate limiting (60 calls/minute per Xero API limits)
 * - Comprehensive audit logging
 * - Batch processing for large datasets
 *
 * Supported Entities:
 * - Contacts (Customers & Suppliers)
 * - Items (Products/Services)
 * - Invoices (Sales & Purchase)
 * - Credit Notes
 * - Payments
 * - Bank Transactions
 * - Chart of Accounts
 * - Tax Rates
 * - Tracking Categories
 *
 * Usage:
 * 1. Connect to Xero via OAuth (using XeroModule)
 * 2. List available organizations (GET /migrations/xero/organizations)
 * 3. Start migration (POST /migrations/xero/start)
 * 4. Monitor progress (GET /migrations/xero/status/:migrationId)
 * 5. Pause/Resume as needed (POST /migrations/xero/pause/:migrationId)
 *
 * WebSocket Events:
 * - migration.started
 * - migration.progress
 * - migration.entity_complete
 * - migration.completed
 * - migration.paused
 * - migration.failed
 */
@Module({
  imports: [
    DatabaseModule,
    XeroModule, // For OAuth and API access
    EventEmitterModule.forRoot(), // For WebSocket progress updates
  ],
  controllers: [XeroMigrationController],
  providers: [
    XeroMigrationService,
    XeroDataFetcherService,
    XeroMapperService,
  ],
  exports: [
    XeroMigrationService,
  ],
})
export class XeroMigrationModule {}
