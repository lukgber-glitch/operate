/**
 * Xero Mapper Service
 * Maps Xero entities to Operate entities
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  XeroContact,
  XeroItem,
  XeroInvoice,
  XeroCreditNote,
  XeroPayment,
  XeroBankTransaction,
  XeroAccount,
  XeroTaxRate,
  XeroTrackingCategory,
  MappedEntity,
  XeroEntityType,
  ConflictStrategy,
} from './xero-migration.types';

@Injectable()
export class XeroMapperService {
  private readonly logger = new Logger(XeroMapperService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Map Xero Contact to Operate Contact/Customer
   */
  async mapContact(
    xeroContact: XeroContact,
    orgId: string,
    conflictStrategy: ConflictStrategy,
  ): Promise<MappedEntity> {
    try {
      // Check for existing contact by Xero ID
      const existing = await this.prisma.customer.findFirst({
        where: {
          orgId,
          externalId: xeroContact.ContactID,
          externalSystem: 'XERO',
        },
      });

      if (existing) {
        if (conflictStrategy === ConflictStrategy.SKIP) {
          return {
            xeroId: xeroContact.ContactID,
            operateId: existing.id,
            entityType: XeroEntityType.CONTACTS,
            status: 'SKIPPED',
            xeroData: xeroContact,
            conflictDetected: true,
            conflictResolution: ConflictStrategy.SKIP,
          };
        }
      }

      // Get primary address and phone
      const primaryAddress = xeroContact.Addresses?.find(
        (a) => a.AddressType === 'STREET',
      );
      const primaryPhone = xeroContact.Phones?.find(
        (p) => p.PhoneType === 'DEFAULT',
      );

      // Create or update customer
      const customer = existing
        ? await this.prisma.customer.update({
            where: { id: existing.id },
            data: {
              name: xeroContact.Name,
              email: xeroContact.EmailAddress,
              phone: primaryPhone?.PhoneNumber,
              taxNumber: xeroContact.TaxNumber,
              addressLine1: primaryAddress?.AddressLine1,
              addressLine2: primaryAddress?.AddressLine2,
              city: primaryAddress?.City,
              state: primaryAddress?.Region,
              postalCode: primaryAddress?.PostalCode,
              country: primaryAddress?.Country,
              currency: xeroContact.DefaultCurrency,
              isActive: xeroContact.ContactStatus === 'ACTIVE',
              externalMetadata: {
                xeroContactNumber: xeroContact.ContactNumber,
                xeroAccountNumber: xeroContact.AccountNumber,
                isSupplier: xeroContact.IsSupplier,
                isCustomer: xeroContact.IsCustomer,
              },
            },
          })
        : await this.prisma.customer.create({
            data: {
              orgId,
              name: xeroContact.Name,
              email: xeroContact.EmailAddress,
              phone: primaryPhone?.PhoneNumber,
              taxNumber: xeroContact.TaxNumber,
              addressLine1: primaryAddress?.AddressLine1,
              addressLine2: primaryAddress?.AddressLine2,
              city: primaryAddress?.City,
              state: primaryAddress?.Region,
              postalCode: primaryAddress?.PostalCode,
              country: primaryAddress?.Country,
              currency: xeroContact.DefaultCurrency || 'USD',
              isActive: xeroContact.ContactStatus === 'ACTIVE',
              externalId: xeroContact.ContactID,
              externalSystem: 'XERO',
              externalMetadata: {
                xeroContactNumber: xeroContact.ContactNumber,
                xeroAccountNumber: xeroContact.AccountNumber,
                isSupplier: xeroContact.IsSupplier,
                isCustomer: xeroContact.IsCustomer,
              },
            },
          });

      return {
        xeroId: xeroContact.ContactID,
        operateId: customer.id,
        entityType: XeroEntityType.CONTACTS,
        status: 'SUCCESS',
        xeroData: xeroContact,
        operateData: customer,
      };
    } catch (error) {
      this.logger.error(
        `Failed to map contact ${xeroContact.ContactID}: ${error.message}`,
      );
      return {
        xeroId: xeroContact.ContactID,
        entityType: XeroEntityType.CONTACTS,
        status: 'FAILED',
        error: error.message,
        xeroData: xeroContact,
      };
    }
  }

  /**
   * Map Xero Item to Operate Product
   */
  async mapItem(
    xeroItem: XeroItem,
    orgId: string,
    conflictStrategy: ConflictStrategy,
  ): Promise<MappedEntity> {
    try {
      const existing = await this.prisma.product.findFirst({
        where: {
          orgId,
          OR: [
            { externalId: xeroItem.ItemID },
            { sku: xeroItem.Code },
          ],
        },
      });

      if (existing && conflictStrategy === ConflictStrategy.SKIP) {
        return {
          xeroId: xeroItem.ItemID,
          operateId: existing.id,
          entityType: XeroEntityType.ITEMS,
          status: 'SKIPPED',
          xeroData: xeroItem,
          conflictDetected: true,
        };
      }

      const product = existing
        ? await this.prisma.product.update({
            where: { id: existing.id },
            data: {
              name: xeroItem.Name,
              description: xeroItem.Description,
              sku: xeroItem.Code,
              salesPrice: xeroItem.SalesDetails?.UnitPrice,
              purchasePrice: xeroItem.PurchaseDetails?.UnitPrice,
              isActive: true,
              externalMetadata: {
                isSold: xeroItem.IsSold,
                isPurchased: xeroItem.IsPurchased,
                isTrackedAsInventory: xeroItem.IsTrackedAsInventory,
                quantityOnHand: xeroItem.QuantityOnHand,
              },
            },
          })
        : await this.prisma.product.create({
            data: {
              orgId,
              name: xeroItem.Name,
              description: xeroItem.Description,
              sku: xeroItem.Code,
              salesPrice: xeroItem.SalesDetails?.UnitPrice || 0,
              purchasePrice: xeroItem.PurchaseDetails?.UnitPrice,
              isActive: true,
              externalId: xeroItem.ItemID,
              externalSystem: 'XERO',
              externalMetadata: {
                isSold: xeroItem.IsSold,
                isPurchased: xeroItem.IsPurchased,
                isTrackedAsInventory: xeroItem.IsTrackedAsInventory,
                quantityOnHand: xeroItem.QuantityOnHand,
              },
            },
          });

      return {
        xeroId: xeroItem.ItemID,
        operateId: product.id,
        entityType: XeroEntityType.ITEMS,
        status: 'SUCCESS',
        xeroData: xeroItem,
        operateData: product,
      };
    } catch (error) {
      this.logger.error(
        `Failed to map item ${xeroItem.ItemID}: ${error.message}`,
      );
      return {
        xeroId: xeroItem.ItemID,
        entityType: XeroEntityType.ITEMS,
        status: 'FAILED',
        error: error.message,
        xeroData: xeroItem,
      };
    }
  }

  /**
   * Map Xero Invoice to Operate Invoice
   */
  async mapInvoice(
    xeroInvoice: XeroInvoice,
    orgId: string,
    conflictStrategy: ConflictStrategy,
  ): Promise<MappedEntity> {
    try {
      const existing = await this.prisma.invoice.findFirst({
        where: {
          orgId,
          externalId: xeroInvoice.InvoiceID,
        },
      });

      if (existing && conflictStrategy === ConflictStrategy.SKIP) {
        return {
          xeroId: xeroInvoice.InvoiceID,
          operateId: existing.id,
          entityType: XeroEntityType.INVOICES,
          status: 'SKIPPED',
          xeroData: xeroInvoice,
          conflictDetected: true,
        };
      }

      // Find mapped customer
      const customer = await this.prisma.customer.findFirst({
        where: {
          orgId,
          externalId: xeroInvoice.Contact.ContactID,
        },
      });

      if (!customer) {
        return {
          xeroId: xeroInvoice.InvoiceID,
          entityType: XeroEntityType.INVOICES,
          status: 'FAILED',
          error: `Customer not found: ${xeroInvoice.Contact.ContactID}`,
          xeroData: xeroInvoice,
        };
      }

      // Map invoice type
      const invoiceType = xeroInvoice.Type === 'ACCREC' ? 'SALES' : 'PURCHASE';
      const invoiceStatus = this.mapInvoiceStatus(xeroInvoice.Status);

      const invoice = existing
        ? await this.prisma.invoice.update({
            where: { id: existing.id },
            data: {
              invoiceNumber: xeroInvoice.InvoiceNumber,
              type: invoiceType,
              status: invoiceStatus,
              issueDate: new Date(xeroInvoice.Date),
              dueDate: xeroInvoice.DueDate
                ? new Date(xeroInvoice.DueDate)
                : undefined,
              subtotal: xeroInvoice.SubTotal,
              taxAmount: xeroInvoice.TotalTax,
              total: xeroInvoice.Total,
              amountDue: xeroInvoice.AmountDue,
              currency: xeroInvoice.CurrencyCode,
              notes: xeroInvoice.Reference,
              externalMetadata: {
                xeroLineAmountTypes: xeroInvoice.LineAmountTypes,
                xeroUrl: xeroInvoice.Url,
              },
            },
          })
        : await this.prisma.invoice.create({
            data: {
              orgId,
              customerId: customer.id,
              invoiceNumber: xeroInvoice.InvoiceNumber || `XER-${xeroInvoice.InvoiceID.substring(0, 8)}`,
              type: invoiceType,
              status: invoiceStatus,
              issueDate: new Date(xeroInvoice.Date),
              dueDate: xeroInvoice.DueDate
                ? new Date(xeroInvoice.DueDate)
                : undefined,
              subtotal: xeroInvoice.SubTotal,
              taxAmount: xeroInvoice.TotalTax,
              total: xeroInvoice.Total,
              amountDue: xeroInvoice.AmountDue,
              currency: xeroInvoice.CurrencyCode,
              notes: xeroInvoice.Reference,
              externalId: xeroInvoice.InvoiceID,
              externalSystem: 'XERO',
              externalMetadata: {
                xeroLineAmountTypes: xeroInvoice.LineAmountTypes,
                xeroUrl: xeroInvoice.Url,
              },
            },
          });

      // Map line items
      await this.mapInvoiceLineItems(invoice.id, xeroInvoice.LineItems, orgId);

      return {
        xeroId: xeroInvoice.InvoiceID,
        operateId: invoice.id,
        entityType: XeroEntityType.INVOICES,
        status: 'SUCCESS',
        xeroData: xeroInvoice,
        operateData: invoice,
      };
    } catch (error) {
      this.logger.error(
        `Failed to map invoice ${xeroInvoice.InvoiceID}: ${error.message}`,
      );
      return {
        xeroId: xeroInvoice.InvoiceID,
        entityType: XeroEntityType.INVOICES,
        status: 'FAILED',
        error: error.message,
        xeroData: xeroInvoice,
      };
    }
  }

  /**
   * Map invoice line items
   */
  private async mapInvoiceLineItems(
    invoiceId: string,
    lineItems: any[],
    orgId: string,
  ): Promise<void> {
    // Delete existing line items
    await this.prisma.invoiceLineItem.deleteMany({
      where: { invoiceId },
    });

    // Create new line items
    for (const item of lineItems) {
      // Try to find mapped product
      let productId: string | undefined;
      if (item.ItemCode) {
        const product = await this.prisma.product.findFirst({
          where: {
            orgId,
            sku: item.ItemCode,
          },
        });
        productId = product?.id;
      }

      await this.prisma.invoiceLineItem.create({
        data: {
          invoiceId,
          productId,
          description: item.Description,
          quantity: item.Quantity,
          unitPrice: item.UnitAmount,
          taxAmount: item.TaxAmount,
          lineTotal: item.LineAmount,
          discountPercent: item.DiscountRate,
        },
      });
    }
  }

  /**
   * Map Xero Payment to Operate Payment
   */
  async mapPayment(
    xeroPayment: XeroPayment,
    orgId: string,
    conflictStrategy: ConflictStrategy,
  ): Promise<MappedEntity> {
    try {
      const existing = await this.prisma.payment.findFirst({
        where: {
          orgId,
          externalId: xeroPayment.PaymentID,
        },
      });

      if (existing && conflictStrategy === ConflictStrategy.SKIP) {
        return {
          xeroId: xeroPayment.PaymentID,
          operateId: existing.id,
          entityType: XeroEntityType.PAYMENTS,
          status: 'SKIPPED',
          xeroData: xeroPayment,
          conflictDetected: true,
        };
      }

      // Find mapped invoice
      let invoice;
      if (xeroPayment.Invoice) {
        invoice = await this.prisma.invoice.findFirst({
          where: {
            orgId,
            externalId: xeroPayment.Invoice.InvoiceID,
          },
        });
      }

      if (!invoice && xeroPayment.Invoice) {
        return {
          xeroId: xeroPayment.PaymentID,
          entityType: XeroEntityType.PAYMENTS,
          status: 'FAILED',
          error: `Invoice not found: ${xeroPayment.Invoice.InvoiceID}`,
          xeroData: xeroPayment,
        };
      }

      const payment = existing
        ? await this.prisma.payment.update({
            where: { id: existing.id },
            data: {
              amount: xeroPayment.Amount,
              paymentDate: new Date(xeroPayment.Date),
              reference: xeroPayment.Reference,
              isReconciled: xeroPayment.IsReconciled,
            },
          })
        : await this.prisma.payment.create({
            data: {
              orgId,
              invoiceId: invoice?.id,
              amount: xeroPayment.Amount,
              paymentDate: new Date(xeroPayment.Date),
              paymentMethod: 'BANK_TRANSFER',
              reference: xeroPayment.Reference,
              isReconciled: xeroPayment.IsReconciled,
              externalId: xeroPayment.PaymentID,
              externalSystem: 'XERO',
            },
          });

      return {
        xeroId: xeroPayment.PaymentID,
        operateId: payment.id,
        entityType: XeroEntityType.PAYMENTS,
        status: 'SUCCESS',
        xeroData: xeroPayment,
        operateData: payment,
      };
    } catch (error) {
      this.logger.error(
        `Failed to map payment ${xeroPayment.PaymentID}: ${error.message}`,
      );
      return {
        xeroId: xeroPayment.PaymentID,
        entityType: XeroEntityType.PAYMENTS,
        status: 'FAILED',
        error: error.message,
        xeroData: xeroPayment,
      };
    }
  }

  /**
   * Map Xero invoice status to Operate status
   */
  private mapInvoiceStatus(xeroStatus: string): string {
    const statusMap: Record<string, string> = {
      DRAFT: 'DRAFT',
      SUBMITTED: 'PENDING',
      AUTHORISED: 'SENT',
      PAID: 'PAID',
      VOIDED: 'CANCELLED',
    };
    return statusMap[xeroStatus] || 'DRAFT';
  }

  /**
   * Batch map entities
   */
  async batchMapEntities(
    entityType: XeroEntityType,
    entities: any[],
    orgId: string,
    conflictStrategy: ConflictStrategy,
  ): Promise<MappedEntity[]> {
    const results: MappedEntity[] = [];

    for (const entity of entities) {
      let mapped: MappedEntity;

      switch (entityType) {
        case XeroEntityType.CONTACTS:
          mapped = await this.mapContact(entity, orgId, conflictStrategy);
          break;
        case XeroEntityType.ITEMS:
          mapped = await this.mapItem(entity, orgId, conflictStrategy);
          break;
        case XeroEntityType.INVOICES:
          mapped = await this.mapInvoice(entity, orgId, conflictStrategy);
          break;
        case XeroEntityType.PAYMENTS:
          mapped = await this.mapPayment(entity, orgId, conflictStrategy);
          break;
        default:
          mapped = {
            xeroId: entity.id || 'unknown',
            entityType,
            status: 'FAILED',
            error: `Mapping not implemented for ${entityType}`,
            xeroData: entity,
          };
      }

      results.push(mapped);
    }

    return results;
  }
}
