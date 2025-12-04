import { Module } from '@nestjs/common';
import { InvoicesModule } from './invoices/invoices.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BankingModule } from './banking/banking.module';
import { BankSyncModule } from './bank-sync/bank-sync.module';

/**
 * Finance Module
 * Main module for all finance-related functionality
 * Imports and re-exports sub-modules for invoices, expenses, banking, and bank synchronization
 */
@Module({
  imports: [InvoicesModule, ExpensesModule, BankingModule, BankSyncModule],
  exports: [InvoicesModule, ExpensesModule, BankingModule, BankSyncModule],
})
export class FinanceModule {}
