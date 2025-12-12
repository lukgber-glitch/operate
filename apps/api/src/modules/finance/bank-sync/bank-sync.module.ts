import { Module, forwardRef, Inject } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BankSyncService } from './bank-sync.service';
import { BankSyncController } from './bank-sync.controller';
import { BanksController } from './banks.controller';
import { DatabaseModule } from '../../database/database.module';
import { TinkModule } from '../../integrations/tink/tink.module';
import type { BankImportJobModule } from './jobs/bank-import.module';

/**
 * Bank Sync Module
 * Provides bank connection management and synchronization services
 *
 * Dependencies:
 * - DatabaseModule: Database access for storing connections, accounts, transactions
 * - TinkModule: Tink Open Banking API integration
 * - ConfigModule: Environment configuration
 * - BankImportJobModule: Background job processing for bank imports
 *
 * Exports:
 * - BankSyncService: For use in other modules (e.g., cron jobs, webhooks)
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    TinkModule,
    forwardRef(() => require('./jobs/bank-import.module').BankImportJobModule), // Use forwardRef with require to avoid circular dependency
  ],
  controllers: [BankSyncController, BanksController],
  providers: [BankSyncService],
  exports: [BankSyncService], // Export for use in other modules
})
export class BankSyncModule {}
