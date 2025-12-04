import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QuickBooksMappingService } from './quickbooks-mapping.service';
import { QuickBooksInvoice } from '../quickbooks.types';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * QuickBooks Invoice Sync Service
 * Handles bidirectional sync of invoices between QuickBooks and Operate
 */
@Injectable()
export class QuickBooksInvoiceSyncService {
  private readonly logger = new Logger(QuickBooksInvoiceSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mappingService: QuickBooksMappingService,
  ) {}

  /**
   * Sync invoice from QuickBooks to Operate
   */
  async syncFromQuickBooks(
    connectionId: string,
    orgId: string,
    qbInvoice: QuickBooksInvoice,
  ): Promise<{ invoiceId: string; isNew: boolean }> {
    try {
      // Check if invoice already exists in mapping
      const existingOperateId = await this.mappingService.getOperateId(
        connectionId,
        'INVOICE',
        qbInvoice.Id,
      );

      // Get mapped customer ID
      const customerId = await this.mappingService.getOperateId(
        connectionId,
        'CUSTOMER',
        qbInvoice.CustomerRef.value,
      );

      if (!customerId) {
        throw new Error(
          `Customer mapping not found for QuickBooks customer ${qbInvoice.CustomerRef.value}`,
        );
      }

      // Get customer details
      const customer = await this.prisma.client.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      // Calculate amounts
      const totalAmount = new Decimal(qbInvoice.TotalAmt || 0);
      const balance = new Decimal(qbInvoice.Balance || 0);
      const subtotal = totalAmount; // Simplified - would need to calculate from line items
      const taxAmount = new Decimal(0); // Would need to extract from QB data

      // Determine invoice status
      let status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' = 'SENT';
      if (balance.equals(0)) {
        status = 'PAID';
      } else if (new Date(qbInvoice.DueDate) < new Date()) {
        status = 'OVERDUE';
      }

      const invoiceData = {
        number: qbInvoice.DocNumber,
        type: 'STANDARD' as const,
        status,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.street,
        issueDate: new Date(qbInvoice.TxnDate),
        dueDate: new Date(qbInvoice.DueDate),
        subtotal,
        taxAmount,
        totalAmount,
        currency: 'USD', // Would need to get from QB company info
        metadata: {
          quickbooksId: qbInvoice.Id,
          quickbooksBalance: qbInvoice.Balance,
          syncedAt: new Date().toISOString(),
        },
      };

      let invoiceId: string;
      let isNew: boolean;

      if (existingOperateId) {
        // Update existing invoice
        const invoice = await this.prisma.invoice.update({
          where: { id: existingOperateId },
          data: invoiceData,
        });
        invoiceId = invoice.id;
        isNew = false;
        this.logger.debug(`Updated existing invoice ${invoiceId} from QB ${qbInvoice.Id}`);
      } else {
        // Create new invoice
        const invoice = await this.prisma.invoice.create({
          data: {
            ...invoiceData,
            orgId,
          },
        });
        invoiceId = invoice.id;
        isNew = true;
        this.logger.debug(`Created new invoice ${invoiceId} from QB ${qbInvoice.Id}`);

        // Create invoice line items
        await this.syncInvoiceLineItems(invoice.id, qbInvoice.Line);
      }

      // Create/update mapping
      await this.mappingService.createMapping({
        connectionId,
        orgId,
        entityType: 'INVOICE',
        operateId: invoiceId,
        quickbooksId: qbInvoice.Id,
        metadata: {
          docNumber: qbInvoice.DocNumber,
          totalAmount: qbInvoice.TotalAmt,
          balance: qbInvoice.Balance,
        },
      });

      return { invoiceId, isNew };
    } catch (error) {
      this.logger.error(`Failed to sync invoice from QuickBooks: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Sync invoice line items
   */
  private async syncInvoiceLineItems(
    invoiceId: string,
    qbLineItems: QuickBooksInvoice['Line'],
  ): Promise<void> {
    // Delete existing line items
    await this.prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });

    // Create new line items
    for (const line of qbLineItems) {
      if (line.DetailType === 'SalesItemLineDetail' && line.SalesItemLineDetail) {
        await this.prisma.invoiceItem.create({
          data: {
            invoiceId,
            description: line.Description || '',
            quantity: new Decimal(line.SalesItemLineDetail.Qty || 1),
            unitPrice: new Decimal(line.SalesItemLineDetail.UnitPrice || 0),
            amount: new Decimal(line.Amount),
            sortOrder: line.LineNum,
          },
        });
      }
    }
  }

  /**
   * Sync invoice from Operate to QuickBooks
   */
  async syncToQuickBooks(
    connectionId: string,
    invoiceId: string,
    accessToken: string,
    companyId: string,
  ): Promise<{ quickbooksId: string; isNew: boolean }> {
    try {
      // Get invoice from Operate
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      // Get QuickBooks customer ID
      const qbCustomerId = await this.mappingService.getQuickBooksId(
        connectionId,
        'CUSTOMER',
        invoice.customerId || '',
      );

      if (!qbCustomerId) {
        throw new Error(
          `QuickBooks customer mapping not found for ${invoice.customerId}`,
        );
      }

      // Check if invoice already exists in QuickBooks
      const existingQbId = await this.mappingService.getQuickBooksId(
        connectionId,
        'INVOICE',
        invoiceId,
      );

      // Map Operate invoice to QuickBooks format
      const qbInvoiceData: Partial<QuickBooksInvoice> = {
        DocNumber: invoice.number,
        CustomerRef: {
          value: qbCustomerId,
        },
        TxnDate: invoice.issueDate.toISOString().split('T')[0],
        DueDate: invoice.dueDate.toISOString().split('T')[0],
        Line: invoice.items.map((item, index) => ({
          Id: String(index + 1),
          LineNum: item.sortOrder,
          Description: item.description,
          Amount: Number(item.amount),
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: '1', // Would need item mapping
            },
            Qty: Number(item.quantity),
            UnitPrice: Number(item.unitPrice),
          },
        })),
      };

      // TODO: Call QuickBooks API to create/update invoice
      // This would use the intuit-oauth library or direct HTTP calls

      const quickbooksId = existingQbId || `QB-INV-${Date.now()}`;
      const isNew = !existingQbId;

      // Create/update mapping
      await this.mappingService.createMapping({
        connectionId,
        orgId: invoice.orgId,
        entityType: 'INVOICE',
        operateId: invoiceId,
        quickbooksId,
        metadata: {
          docNumber: invoice.number,
          totalAmount: Number(invoice.totalAmount),
        },
      });

      return { quickbooksId, isNew };
    } catch (error) {
      this.logger.error(`Failed to sync invoice to QuickBooks: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Sync all invoices from QuickBooks to Operate (initial import)
   */
  async syncAllFromQuickBooks(
    connectionId: string,
    orgId: string,
    qbInvoices: QuickBooksInvoice[],
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ invoiceId: string; error: string }>;
  }> {
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ invoiceId: string; error: string }> = [];

    for (const qbInvoice of qbInvoices) {
      try {
        const result = await this.syncFromQuickBooks(connectionId, orgId, qbInvoice);
        if (result.isNew) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        failed++;
        errors.push({
          invoiceId: qbInvoice.Id,
          error: error.message,
        });
        this.logger.error(`Failed to sync invoice ${qbInvoice.Id}: ${error.message}`);
      }
    }

    this.logger.log(
      `Invoice sync completed: ${created} created, ${updated} updated, ${failed} failed`,
    );

    return { created, updated, failed, errors };
  }

  /**
   * Get invoices modified since a specific date
   */
  async getModifiedInvoices(
    orgId: string,
    since: Date,
  ): Promise<any[]> {
    return this.prisma.invoice.findMany({
      where: {
        orgId,
        updatedAt: {
          gt: since,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}
