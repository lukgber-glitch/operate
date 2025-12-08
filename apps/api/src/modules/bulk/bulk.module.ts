import { Module } from '@nestjs/common';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';
import { DatabaseModule } from '../database/database.module';
import { FinanceModule } from '../finance/finance.module';

/**
 * Bulk Operations Module
 * Provides bulk operation capabilities for invoices, bills, transactions, and expenses
 */
@Module({
  imports: [
    DatabaseModule,
    FinanceModule, // Imports InvoicesModule, BillsModule, ExpensesModule, BankingModule
  ],
  controllers: [BulkController],
  providers: [BulkService],
  exports: [BulkService],
})
export class BulkModule {}
