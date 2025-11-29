import { Module } from '@nestjs/common';
import { InvoicesModule } from './invoices/invoices.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BankingModule } from './banking/banking.module';

/**
 * Finance Module
 * Main module for all finance-related functionality
 * Imports and re-exports sub-modules for invoices, expenses, and banking
 */
@Module({
  imports: [InvoicesModule, ExpensesModule, BankingModule],
  exports: [InvoicesModule, ExpensesModule, BankingModule],
})
export class FinanceModule {}
