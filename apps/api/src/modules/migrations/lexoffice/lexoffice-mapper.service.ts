import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  LexofficeContact,
  LexofficeInvoice,
  LexofficeVoucher,
  LexofficeProduct,
  MigrationError,
} from './lexoffice.types';

@Injectable()
export class LexofficeMapperService {
  private readonly logger = new Logger(LexofficeMapperService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Map and import contacts to the database
   */
  async importContacts(
    orgId: string,
    contacts: LexofficeContact[],
    dryRun: boolean = false,
  ): Promise<{ imported: number; skipped: number; errors: MigrationError[]; createdIds: string[] }> {
    const errors: MigrationError[] = [];
    const createdIds: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      try {
        // Check for duplicates by email or contact number
        if (contact.email) {
          const existing = await this.prisma.customer.findFirst({
            where: {
              orgId,
              email: contact.email,
            },
          });

          if (existing) {
            this.logger.debug(`Skipping duplicate contact: ${contact.email}`);
            skipped++;
            continue;
          }
        }

        if (dryRun) {
          imported++;
          continue;
        }

        // Create customer record
        const name = contact.companyName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        const address = this.formatAddress(contact.street, contact.zip, contact.city, contact.country);

        const customer = await this.prisma.customer.create({
          data: {
            orgId,
            name,
            email: contact.email,
            phone: contact.phone || contact.mobile,
            address,
            vatId: contact.vatId,
            isActive: true,
            metadata: {
              lexofficeImport: true,
              contactNumber: contact.contactNumber,
              type: contact.type,
              mobile: contact.mobile,
              website: contact.website,
              taxNumber: contact.taxNumber,
              iban: contact.iban,
              bic: contact.bic,
              bankName: contact.bankName,
              notes: contact.notes,
            },
          },
        });

        createdIds.push(customer.id);
        imported++;
      } catch (error) {
        this.logger.error(`Error importing contact at index ${i}: ${error.message}`, error.stack);
        errors.push({
          row: i + 1,
          message: error.message,
        });
      }
    }

    return { imported, skipped, errors, createdIds };
  }

  /**
   * Map and import invoices to the database
   */
  async importInvoices(
    orgId: string,
    invoices: LexofficeInvoice[],
    dryRun: boolean = false,
  ): Promise<{ imported: number; skipped: number; errors: MigrationError[]; createdIds: string[] }> {
    const errors: MigrationError[] = [];
    const createdIds: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];

      try {
        // Check for duplicate invoice number
        const existing = await this.prisma.invoice.findFirst({
          where: {
            orgId,
            number: invoice.invoiceNumber,
          },
        });

        if (existing) {
          this.logger.debug(`Skipping duplicate invoice: ${invoice.invoiceNumber}`);
          skipped++;
          continue;
        }

        if (dryRun) {
          imported++;
          continue;
        }

        // Find or create customer
        let customerId: string | undefined;
        if (invoice.customerEmail) {
          const customer = await this.findOrCreateCustomer(orgId, {
            name: invoice.customerName,
            email: invoice.customerEmail,
            address: invoice.customerAddress,
            vatId: invoice.customerVatId,
          });
          customerId = customer?.id;
        }

        // Map status
        const status = this.mapInvoiceStatus(invoice.status);

        // Create invoice
        const createdInvoice = await this.prisma.invoice.create({
          data: {
            orgId,
            number: invoice.invoiceNumber,
            type: 'STANDARD',
            status,
            customerId,
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            customerAddress: invoice.customerAddress,
            customerVatId: invoice.customerVatId,
            issueDate: new Date(invoice.invoiceDate),
            dueDate: new Date(invoice.dueDate),
            paidDate: invoice.paidDate ? new Date(invoice.paidDate) : undefined,
            subtotal: invoice.subtotal,
            taxAmount: invoice.taxAmount,
            totalAmount: invoice.totalAmount,
            currency: invoice.currency,
            vatRate: invoice.items[0]?.taxRate,
            paymentTerms: invoice.paymentTerms,
            paymentMethod: invoice.paymentMethod,
            notes: invoice.notes,
            metadata: {
              lexofficeImport: true,
              customerNumber: invoice.customerNumber,
              deliveryDate: invoice.deliveryDate,
              introduction: invoice.introduction,
            },
            items: {
              create: invoice.items.map((item, index) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
                taxRate: item.taxRate,
                taxAmount: item.taxAmount,
                productCode: item.productNumber,
                unit: item.unit,
                sortOrder: index,
              })),
            },
          },
        });

        createdIds.push(createdInvoice.id);
        imported++;
      } catch (error) {
        this.logger.error(`Error importing invoice at index ${i}: ${error.message}`, error.stack);
        errors.push({
          row: i + 1,
          message: error.message,
        });
      }
    }

    return { imported, skipped, errors, createdIds };
  }

  /**
   * Map and import vouchers/expenses to the database
   */
  async importVouchers(
    orgId: string,
    vouchers: LexofficeVoucher[],
    dryRun: boolean = false,
  ): Promise<{ imported: number; skipped: number; errors: MigrationError[]; createdIds: string[] }> {
    const errors: MigrationError[] = [];
    const createdIds: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < vouchers.length; i++) {
      const voucher = vouchers[i];

      try {
        // Check for duplicate voucher number
        if (voucher.voucherNumber) {
          const existing = await this.prisma.expense.findFirst({
            where: {
              orgId,
              receiptNumber: voucher.voucherNumber,
            },
          });

          if (existing) {
            this.logger.debug(`Skipping duplicate voucher: ${voucher.voucherNumber}`);
            skipped++;
            continue;
          }
        }

        if (dryRun) {
          imported++;
          continue;
        }

        // Map category
        const category = this.mapExpenseCategory(voucher.category);

        // Map status
        const status = this.mapExpenseStatus(voucher.status);

        // Create expense
        const expense = await this.prisma.expense.create({
          data: {
            orgId,
            description: voucher.description,
            amount: voucher.amount,
            currency: voucher.currency,
            date: new Date(voucher.date),
            category,
            vendorName: voucher.vendorName,
            vendorVatId: voucher.vendorVatId,
            receiptNumber: voucher.voucherNumber || voucher.receiptNumber,
            receiptUrl: voucher.attachmentUrl,
            status,
            vatAmount: voucher.taxAmount,
            vatRate: voucher.taxRate,
            paymentMethod: voucher.paymentMethod,
            isDeductible: true,
            metadata: {
              lexofficeImport: true,
              voucherType: voucher.type,
            },
          },
        });

        createdIds.push(expense.id);
        imported++;
      } catch (error) {
        this.logger.error(`Error importing voucher at index ${i}: ${error.message}`, error.stack);
        errors.push({
          row: i + 1,
          message: error.message,
        });
      }
    }

    return { imported, skipped, errors, createdIds };
  }

  /**
   * Map and import products to metadata (no dedicated Product table yet)
   */
  async importProducts(
    orgId: string,
    products: LexofficeProduct[],
    dryRun: boolean = false,
  ): Promise<{ imported: number; skipped: number; errors: MigrationError[]; createdIds: string[] }> {
    const errors: MigrationError[] = [];
    const createdIds: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Since there's no dedicated Product table, we'll store in organisation metadata
    if (dryRun) {
      return { imported: products.length, skipped: 0, errors, createdIds };
    }

    try {
      const org = await this.prisma.organisation.findUnique({
        where: { id: orgId },
        select: { settings: true },
      });

      const settings = (org?.settings as any) || {};
      const existingProducts = settings.lexofficeProducts || [];

      for (const product of products) {
        // Check for duplicate by product number
        if (product.productNumber) {
          const exists = existingProducts.some(
            (p: any) => p.productNumber === product.productNumber,
          );

          if (exists) {
            skipped++;
            continue;
          }
        }

        existingProducts.push({
          id: `lexoffice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...product,
          importedAt: new Date().toISOString(),
        });

        imported++;
      }

      // Update organisation settings
      await this.prisma.organisation.update({
        where: { id: orgId },
        data: {
          settings: {
            ...settings,
            lexofficeProducts: existingProducts,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error importing products: ${error.message}`, error.stack);
      errors.push({
        row: 0,
        message: error.message,
      });
    }

    return { imported, skipped, errors, createdIds };
  }

  /**
   * Find or create customer
   */
  private async findOrCreateCustomer(
    orgId: string,
    data: { name: string; email?: string; address?: string; vatId?: string },
  ) {
    if (!data.email) return null;

    let customer = await this.prisma.customer.findFirst({
      where: {
        orgId,
        email: data.email,
      },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          orgId,
          name: data.name,
          email: data.email,
          address: data.address,
          vatId: data.vatId,
          isActive: true,
          metadata: {
            autoCreated: true,
            source: 'lexoffice-invoice-import',
          },
        },
      });
    }

    return customer;
  }

  /**
   * Format address string
   */
  private formatAddress(
    street?: string,
    zip?: string,
    city?: string,
    country?: string,
  ): string | undefined {
    const parts = [street, zip && city ? `${zip} ${city}` : zip || city, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  /**
   * Map invoice status from lexoffice to Prisma enum
   */
  private mapInvoiceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'DRAFT',
      open: 'SENT',
      paid: 'PAID',
      cancelled: 'CANCELLED',
      overdue: 'OVERDUE',
    };

    return statusMap[status.toLowerCase()] || 'SENT';
  }

  /**
   * Map expense status from lexoffice to Prisma enum
   */
  private mapExpenseStatus(status?: string): string {
    if (!status) return 'PENDING';

    const statusMap: Record<string, string> = {
      pending: 'PENDING',
      approved: 'APPROVED',
      rejected: 'REJECTED',
    };

    return statusMap[status.toLowerCase()] || 'PENDING';
  }

  /**
   * Map expense category
   */
  private mapExpenseCategory(category?: string): string {
    if (!category) return 'OTHER';

    const categoryMap: Record<string, string> = {
      reise: 'TRAVEL',
      büro: 'OFFICE',
      software: 'SOFTWARE',
      ausrüstung: 'EQUIPMENT',
      mahlzeiten: 'MEALS',
      unterhaltung: 'ENTERTAINMENT',
      versorgung: 'UTILITIES',
      miete: 'RENT',
      versicherung: 'INSURANCE',
      dienstleistungen: 'PROFESSIONAL_SERVICES',
    };

    const key = category.toLowerCase();
    return categoryMap[key] || 'OTHER';
  }
}
