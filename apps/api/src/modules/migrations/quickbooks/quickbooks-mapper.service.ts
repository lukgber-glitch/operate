/**
 * QuickBooks Mapper Service
 * Maps QuickBooks entities to Operate database schema
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  QBCustomer,
  QBVendor,
  QBItem,
  QBInvoice,
  QBBill,
  QBPayment,
  QBAccount,
  QBTaxRate,
  QBAddress,
  ConflictResolutionStrategy,
} from './quickbooks-migration.types';

interface MapResult {
  success: boolean;
  operateId?: string;
  error?: string;
  skipped?: boolean;
  action?: 'created' | 'updated' | 'skipped';
}

@Injectable()
export class QuickBooksMapperService {
  private readonly logger = new Logger(QuickBooksMapperService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Map and create/update Customer
   */
  async mapCustomer(
    qbCustomer: QBCustomer,
    orgId: string,
    connectionId: string,
    strategy: ConflictResolutionStrategy,
  ): Promise<MapResult> {
    try {
      // Check if customer already exists
      const existingMapping = await this.prisma.quickBooksEntityMapping.findFirst({
        where: {
          connectionId,
          entityType: 'CUSTOMER',
          quickbooksId: qbCustomer.Id,
        },
      });

      // Handle conflicts
      if (existingMapping) {
        switch (strategy) {
          case ConflictResolutionStrategy.SKIP:
            return { success: true, skipped: true, action: 'skipped' };

          case ConflictResolutionStrategy.OVERWRITE:
            // Will update below
            break;

          case ConflictResolutionStrategy.MERGE:
            // For now, treat merge as update (could be enhanced)
            break;

          case ConflictResolutionStrategy.CREATE_NEW:
            // Create with suffix
            qbCustomer.DisplayName = `${qbCustomer.DisplayName} (QB Import)`;
            break;
        }
      }

      // Map customer data
      const customerData = {
        orgId,
        name: qbCustomer.DisplayName,
        email: qbCustomer.PrimaryEmailAddr?.Address || null,
        phone: qbCustomer.PrimaryPhone?.FreeFormNumber || null,
        billingAddress: this.mapAddress(qbCustomer.BillAddr),
        shippingAddress: this.mapAddress(qbCustomer.ShipAddr),
        taxId: qbCustomer.TaxIdentifier || null,
        notes: `Imported from QuickBooks. QB ID: ${qbCustomer.Id}`,
        metadata: {
          quickbooksId: qbCustomer.Id,
          quickbooksSyncToken: qbCustomer.SyncToken,
          quickbooksBalance: qbCustomer.Balance,
          quickbooksActive: qbCustomer.Active,
          importedAt: new Date().toISOString(),
        },
      };

      let customer;
      let action: 'created' | 'updated';

      if (existingMapping) {
        // Update existing customer
        customer = await this.prisma.customer.update({
          where: { id: existingMapping.operateEntityId },
          data: customerData,
        });
        action = 'updated';
      } else {
        // Create new customer
        customer = await this.prisma.customer.create({
          data: customerData,
        });
        action = 'created';

        // Create entity mapping
        await this.prisma.quickBooksEntityMapping.create({
          data: {
            connectionId,
            entityType: 'CUSTOMER',
            quickbooksId: qbCustomer.Id,
            operateEntityId: customer.id,
            syncToken: qbCustomer.SyncToken,
            lastSyncedAt: new Date(),
            metadata: {
              displayName: qbCustomer.DisplayName,
              companyName: qbCustomer.CompanyName,
            },
          },
        });
      }

      return {
        success: true,
        operateId: customer.id,
        action,
      };
    } catch (error) {
      this.logger.error(
        `Error mapping customer ${qbCustomer.Id}: ${error.message}`,
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Map and create/update Vendor
   */
  async mapVendor(
    qbVendor: QBVendor,
    orgId: string,
    connectionId: string,
    strategy: ConflictResolutionStrategy,
  ): Promise<MapResult> {
    try {
      const existingMapping = await this.prisma.quickBooksEntityMapping.findFirst({
        where: {
          connectionId,
          entityType: 'VENDOR',
          quickbooksId: qbVendor.Id,
        },
      });

      if (existingMapping && strategy === ConflictResolutionStrategy.SKIP) {
        return { success: true, skipped: true, action: 'skipped' };
      }

      const vendorData = {
        orgId,
        name: qbVendor.DisplayName,
        companyName: qbVendor.CompanyName || null,
        email: qbVendor.PrimaryEmailAddr?.Address || null,
        phone: qbVendor.PrimaryPhone?.FreeFormNumber || null,
        address: this.mapAddress(qbVendor.BillAddr),
        taxId: qbVendor.TaxIdentifier || null,
        accountNumber: qbVendor.AcctNum || null,
        is1099Vendor: qbVendor.Vendor1099 || false,
        notes: `Imported from QuickBooks. QB ID: ${qbVendor.Id}`,
        metadata: {
          quickbooksId: qbVendor.Id,
          quickbooksSyncToken: qbVendor.SyncToken,
          quickbooksBalance: qbVendor.Balance,
          importedAt: new Date().toISOString(),
        },
      };

      let vendor;
      let action: 'created' | 'updated';

      if (existingMapping) {
        vendor = await this.prisma.vendor.update({
          where: { id: existingMapping.operateEntityId },
          data: vendorData,
        });
        action = 'updated';
      } else {
        vendor = await this.prisma.vendor.create({
          data: vendorData,
        });
        action = 'created';

        await this.prisma.quickBooksEntityMapping.create({
          data: {
            connectionId,
            entityType: 'VENDOR',
            quickbooksId: qbVendor.Id,
            operateEntityId: vendor.id,
            syncToken: qbVendor.SyncToken,
            lastSyncedAt: new Date(),
            metadata: {
              displayName: qbVendor.DisplayName,
            },
          },
        });
      }

      return { success: true, operateId: vendor.id, action };
    } catch (error) {
      this.logger.error(`Error mapping vendor ${qbVendor.Id}: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Map and create/update Item (Product/Service)
   */
  async mapItem(
    qbItem: QBItem,
    orgId: string,
    connectionId: string,
    strategy: ConflictResolutionStrategy,
  ): Promise<MapResult> {
    try {
      const existingMapping = await this.prisma.quickBooksEntityMapping.findFirst({
        where: {
          connectionId,
          entityType: 'ITEM',
          quickbooksId: qbItem.Id,
        },
      });

      if (existingMapping && strategy === ConflictResolutionStrategy.SKIP) {
        return { success: true, skipped: true, action: 'skipped' };
      }

      const itemData = {
        orgId,
        name: qbItem.Name,
        description: qbItem.Description || null,
        type: this.mapItemType(qbItem.Type),
        unitPrice: qbItem.UnitPrice || 0,
        purchaseCost: qbItem.PurchaseCost || null,
        quantityOnHand: qbItem.QtyOnHand || 0,
        trackInventory: qbItem.TrackQtyOnHand || false,
        active: qbItem.Active,
        metadata: {
          quickbooksId: qbItem.Id,
          quickbooksType: qbItem.Type,
          importedAt: new Date().toISOString(),
        },
      };

      let item;
      let action: 'created' | 'updated';

      if (existingMapping) {
        item = await this.prisma.product.update({
          where: { id: existingMapping.operateEntityId },
          data: itemData,
        });
        action = 'updated';
      } else {
        item = await this.prisma.product.create({
          data: itemData,
        });
        action = 'created';

        await this.prisma.quickBooksEntityMapping.create({
          data: {
            connectionId,
            entityType: 'ITEM',
            quickbooksId: qbItem.Id,
            operateEntityId: item.id,
            syncToken: qbItem.SyncToken,
            lastSyncedAt: new Date(),
            metadata: { name: qbItem.Name },
          },
        });
      }

      return { success: true, operateId: item.id, action };
    } catch (error) {
      this.logger.error(`Error mapping item ${qbItem.Id}: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Map and create/update Invoice
   */
  async mapInvoice(
    qbInvoice: QBInvoice,
    orgId: string,
    connectionId: string,
    strategy: ConflictResolutionStrategy,
  ): Promise<MapResult> {
    try {
      const existingMapping = await this.prisma.quickBooksEntityMapping.findFirst({
        where: {
          connectionId,
          entityType: 'INVOICE',
          quickbooksId: qbInvoice.Id,
        },
      });

      if (existingMapping && strategy === ConflictResolutionStrategy.SKIP) {
        return { success: true, skipped: true, action: 'skipped' };
      }

      // Find mapped customer
      const customerMapping = await this.prisma.quickBooksEntityMapping.findFirst({
        where: {
          connectionId,
          entityType: 'CUSTOMER',
          quickbooksId: qbInvoice.CustomerRef.value,
        },
      });

      if (!customerMapping) {
        return {
          success: false,
          error: `Customer not found for QB ID ${qbInvoice.CustomerRef.value}`,
        };
      }

      const invoiceData = {
        orgId,
        customerId: customerMapping.operateEntityId,
        invoiceNumber: qbInvoice.DocNumber,
        invoiceDate: new Date(qbInvoice.TxnDate),
        dueDate: qbInvoice.DueDate ? new Date(qbInvoice.DueDate) : null,
        subtotal: this.calculateSubtotal(qbInvoice),
        taxAmount: qbInvoice.TxnTaxDetail?.TotalTax || 0,
        totalAmount: qbInvoice.TotalAmt,
        balanceDue: qbInvoice.Balance,
        status: this.determineInvoiceStatus(qbInvoice),
        notes: qbInvoice.CustomerMemo?.value || null,
        metadata: {
          quickbooksId: qbInvoice.Id,
          quickbooksSyncToken: qbInvoice.SyncToken,
          importedAt: new Date().toISOString(),
        },
      };

      let invoice;
      let action: 'created' | 'updated';

      if (existingMapping) {
        invoice = await this.prisma.invoice.update({
          where: { id: existingMapping.operateEntityId },
          data: invoiceData,
        });
        action = 'updated';

        // Delete old line items
        await this.prisma.invoiceLineItem.deleteMany({
          where: { invoiceId: invoice.id },
        });
      } else {
        invoice = await this.prisma.invoice.create({
          data: invoiceData,
        });
        action = 'created';

        await this.prisma.quickBooksEntityMapping.create({
          data: {
            connectionId,
            entityType: 'INVOICE',
            quickbooksId: qbInvoice.Id,
            operateEntityId: invoice.id,
            syncToken: qbInvoice.SyncToken,
            lastSyncedAt: new Date(),
            metadata: { docNumber: qbInvoice.DocNumber },
          },
        });
      }

      // Create line items
      await this.createInvoiceLineItems(qbInvoice, invoice.id, connectionId);

      return { success: true, operateId: invoice.id, action };
    } catch (error) {
      this.logger.error(`Error mapping invoice ${qbInvoice.Id}: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Map and create/update Payment
   */
  async mapPayment(
    qbPayment: QBPayment,
    orgId: string,
    connectionId: string,
    strategy: ConflictResolutionStrategy,
  ): Promise<MapResult> {
    try {
      const existingMapping = await this.prisma.quickBooksEntityMapping.findFirst({
        where: {
          connectionId,
          entityType: 'PAYMENT',
          quickbooksId: qbPayment.Id,
        },
      });

      if (existingMapping && strategy === ConflictResolutionStrategy.SKIP) {
        return { success: true, skipped: true, action: 'skipped' };
      }

      // Find mapped customer
      const customerMapping = await this.prisma.quickBooksEntityMapping.findFirst({
        where: {
          connectionId,
          entityType: 'CUSTOMER',
          quickbooksId: qbPayment.CustomerRef.value,
        },
      });

      if (!customerMapping) {
        return {
          success: false,
          error: `Customer not found for QB ID ${qbPayment.CustomerRef.value}`,
        };
      }

      const paymentData = {
        orgId,
        customerId: customerMapping.operateEntityId,
        amount: qbPayment.TotalAmt,
        paymentDate: new Date(qbPayment.TxnDate),
        paymentMethod: qbPayment.PaymentMethodRef?.name || 'Other',
        referenceNumber: qbPayment.Id,
        notes: `Imported from QuickBooks. QB ID: ${qbPayment.Id}`,
        metadata: {
          quickbooksId: qbPayment.Id,
          unappliedAmount: qbPayment.UnappliedAmt,
          processPayment: qbPayment.ProcessPayment,
          importedAt: new Date().toISOString(),
        },
      };

      let payment;
      let action: 'created' | 'updated';

      if (existingMapping) {
        payment = await this.prisma.payment.update({
          where: { id: existingMapping.operateEntityId },
          data: paymentData,
        });
        action = 'updated';
      } else {
        payment = await this.prisma.payment.create({
          data: paymentData,
        });
        action = 'created';

        await this.prisma.quickBooksEntityMapping.create({
          data: {
            connectionId,
            entityType: 'PAYMENT',
            quickbooksId: qbPayment.Id,
            operateEntityId: payment.id,
            syncToken: qbPayment.SyncToken,
            lastSyncedAt: new Date(),
            metadata: { amount: qbPayment.TotalAmt },
          },
        });
      }

      return { success: true, operateId: payment.id, action };
    } catch (error) {
      this.logger.error(`Error mapping payment ${qbPayment.Id}: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Map QuickBooks address to string
   */
  private mapAddress(address?: QBAddress): string | null {
    if (!address) return null;

    const parts = [
      address.Line1,
      address.Line2,
      address.City,
      address.CountrySubDivisionCode,
      address.PostalCode,
      address.Country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
  }

  /**
   * Helper: Map QuickBooks item type to Operate product type
   */
  private mapItemType(qbType: string): string {
    const typeMap: Record<string, string> = {
      Service: 'SERVICE',
      Inventory: 'PRODUCT',
      NonInventory: 'PRODUCT',
      Category: 'CATEGORY',
    };

    return typeMap[qbType] || 'PRODUCT';
  }

  /**
   * Helper: Calculate invoice subtotal
   */
  private calculateSubtotal(invoice: QBInvoice): number {
    return invoice.Line.reduce((sum, line) => {
      if (line.DetailType === 'SalesItemLineDetail') {
        return sum + line.Amount;
      }
      return sum;
    }, 0);
  }

  /**
   * Helper: Determine invoice status
   */
  private determineInvoiceStatus(invoice: QBInvoice): string {
    if (invoice.Balance === 0) {
      return 'PAID';
    }
    if (invoice.Balance < invoice.TotalAmt) {
      return 'PARTIALLY_PAID';
    }
    const dueDate = invoice.DueDate ? new Date(invoice.DueDate) : null;
    if (dueDate && dueDate < new Date()) {
      return 'OVERDUE';
    }
    return 'UNPAID';
  }

  /**
   * Helper: Create invoice line items
   */
  private async createInvoiceLineItems(
    qbInvoice: QBInvoice,
    invoiceId: string,
    connectionId: string,
  ): Promise<void> {
    const lineItems = qbInvoice.Line.filter(
      (line) => line.DetailType === 'SalesItemLineDetail',
    );

    for (const line of lineItems) {
      const detail = line.SalesItemLineDetail;
      if (!detail) continue;

      // Find mapped product
      const productMapping = await this.prisma.quickBooksEntityMapping.findFirst({
        where: {
          connectionId,
          entityType: 'ITEM',
          quickbooksId: detail.ItemRef.value,
        },
      });

      await this.prisma.invoiceLineItem.create({
        data: {
          invoiceId,
          productId: productMapping?.operateEntityId || null,
          description: line.Description || detail.ItemRef.name || '',
          quantity: detail.Qty,
          unitPrice: detail.UnitPrice,
          amount: line.Amount,
          sortOrder: line.LineNum,
        },
      });
    }
  }
}
