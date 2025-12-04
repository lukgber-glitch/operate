import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesRepository } from './invoices.repository';
import { InvoiceCurrencyHelper } from './helpers/invoice-currency.helper';
import { RbacModule } from '../../auth/rbac/rbac.module';
import { PaymentReminderModule } from './reminders/payment-reminder.module';
import { EInvoiceModule } from '../../e-invoice/e-invoice.module';
import { CurrencyModule } from '../../currency/currency.module';

/**
 * Invoices Module
 * Manages invoice operations including payment reminders, E-Invoice generation, and multi-currency support
 */
@Module({
  imports: [
    RbacModule,
    PaymentReminderModule,
    EInvoiceModule, // Import E-Invoice module for ZUGFeRD and XRechnung support
    CurrencyModule, // Import Currency module for multi-currency support
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesRepository, InvoiceCurrencyHelper],
  exports: [InvoicesService, InvoicesRepository],
})
export class InvoicesModule {}
