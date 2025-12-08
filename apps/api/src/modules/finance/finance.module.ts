import { Module } from '@nestjs/common';
import { InvoicesModule } from './invoices/invoices.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BankingModule } from './banking/banking.module';
import { BankSyncModule } from './bank-sync/bank-sync.module';
import { BillsModule } from './bills/bills.module';
import { ScheduledPaymentsModule } from './scheduled-payments/scheduled-payments.module';

/**
 * Finance Module
 * Main module for all finance-related functionality
 * Imports and re-exports sub-modules for invoices, expenses, banking, bills, and scheduled payments
 */
@Module({
  imports: [
    InvoicesModule,
    ExpensesModule,
    BankingModule,
    BankSyncModule,
    BillsModule,
    ScheduledPaymentsModule,
  ],
  exports: [
    InvoicesModule,
    ExpensesModule,
    BankingModule,
    BankSyncModule,
    BillsModule,
    ScheduledPaymentsModule,
  ],
})
export class FinanceModule {}
