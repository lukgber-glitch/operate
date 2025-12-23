import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { XeroMappingService, XeroSyncEntityType } from './xero-mapping.service';
import { XeroCustomerSyncService } from './xero-customer-sync.service';
import { XeroClient } from 'xero-node';
import { Invoice } from 'xero-node/dist/gen/model/accounting/invoice';
import { LineItem } from 'xero-node/dist/gen/model/accounting/lineItem';

/**
 * Xero Invoice Sync Service
 * Handles bidirectional sync of invoices between Operate and Xero
 */
@Injectable()
export class XeroInvoiceSyncService {
  private readonly logger = new Logger(XeroInvoiceSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mappingService: XeroMappingService,
    private readonly customerSync: XeroCustomerSyncService,
  ) {}

  /**
   * Sync all invoices from Xero to Operate
   */
  async syncAllFromXero(
    connectionId: string,
    orgId: string,
    xeroInvoices: Invoice[],
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

    for (const xeroInvoice of xeroInvoices) {
      try {
        // Check if invoice already exists in mapping
        const operateId = await this.mappingService.getOperateId(
          connectionId,
          XeroSyncEntityType.INVOICE,
          xeroInvoice.invoiceID!,
        );

        if (operateId) {
          // Update existing invoice
          await this.updateOperateInvoiceFromXero(orgId, operateId, xeroInvoice);
          updated++;
        } else {
          // Create new invoice
          const newInvoiceId = await this.createOperateInvoiceFromXero(
            connectionId,
            orgId,
            xeroInvoice,
          );

          // Create mapping
          await this.mappingService.createMapping({
            connectionId,
            orgId,
            entityType: XeroSyncEntityType.INVOICE,
            operateId: newInvoiceId,
            xeroId: xeroInvoice.invoiceID!,
            metadata: {
              xeroInvoiceNumber: xeroInvoice.invoiceNumber,
              xeroStatus: xeroInvoice.status,
              xeroType: xeroInvoice.type,
            },
          });
          created++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to sync invoice ${xeroInvoice.invoiceID}: ${error.message}`,
        );
        failed++;
        errors.push({
          invoiceId: xeroInvoice.invoiceID || 'unknown',
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Invoice sync completed: ${created} created, ${updated} updated, ${failed} failed`,
    );

    return { created, updated, failed, errors };
  }

  /**
   * Create Operate invoice from Xero invoice
   */
  private async createOperateInvoiceFromXero(
    connectionId: string,
    orgId: string,
    xeroInvoice: Invoice,
  ): Promise<string> {
    // Get or create customer mapping
    let customerId: string | null = null;
    if (xeroInvoice.contact?.contactID) {
      customerId = await this.mappingService.getOperateId(
        connectionId,
        XeroSyncEntityType.CONTACT,
        xeroInvoice.contact.contactID,
      );

      if (!customerId) {
        this.logger.warn(
          `Customer ${xeroInvoice.contact.contactID} not found in mappings for invoice ${xeroInvoice.invoiceID}`,
        );
      }
    }

    // Map Xero invoice to Operate invoice
    const invoiceData = this.mapXeroInvoiceToOperate(xeroInvoice, customerId);

    // Create invoice in Operate
    const invoice = await this.prisma.invoice.create({
      data: {
        orgId,
        ...invoiceData,
      },
    });

    this.logger.debug(`Created invoice ${invoice.id} from Xero invoice ${xeroInvoice.invoiceID}`);

    return invoice.id;
  }

  /**
   * Update Operate invoice from Xero invoice
   */
  private async updateOperateInvoiceFromXero(
    orgId: string,
    invoiceId: string,
    xeroInvoice: Invoice,
  ): Promise<void> {
    // Map Xero invoice to Operate invoice (exclude customer - don't change it on update)
    const invoiceData = this.mapXeroInvoiceToOperate(xeroInvoice, null);

    // Remove customerId from update
    delete invoiceData.customerId;

    // Update invoice in Operate
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: invoiceData,
    });

    this.logger.debug(`Updated invoice ${invoiceId} from Xero invoice ${xeroInvoice.invoiceID}`);
  }

  /**
   * Map Xero invoice to Operate invoice format
   */
  private mapXeroInvoiceToOperate(xeroInvoice: Invoice, customerId: string | null): any {
    // Calculate totals
    const subtotal = xeroInvoice.subTotal || 0;
    const taxAmount = xeroInvoice.totalTax || 0;
    const total = xeroInvoice.total || 0;

    return {
      customerId: customerId || undefined,
      invoiceNumber: xeroInvoice.invoiceNumber || '',
      invoiceDate: xeroInvoice.date ? new Date(xeroInvoice.date) : new Date(),
      dueDate: xeroInvoice.dueDate ? new Date(xeroInvoice.dueDate) : null,
      status: this.mapXeroStatusToOperate(xeroInvoice.status!),
      currency: xeroInvoice.currencyCode || 'EUR',
      subtotal,
      taxAmount,
      total,
      amountPaid: xeroInvoice.amountPaid || 0,
      amountDue: xeroInvoice.amountDue || 0,
      reference: xeroInvoice.reference || null,
      // Line items would be stored in a separate table or JSON field
      metadata: {
        xeroInvoiceId: xeroInvoice.invoiceID,
        xeroInvoiceNumber: xeroInvoice.invoiceNumber,
        xeroType: xeroInvoice.type,
        xeroStatus: xeroInvoice.status,
        xeroLineAmountTypes: xeroInvoice.lineAmountTypes,
        xeroBrandingThemeID: xeroInvoice.brandingThemeID,
      },
    };
  }

  /**
   * Map Xero invoice status to Operate status
   */
  private mapXeroStatusToOperate(xeroStatus: string): string {
    const statusMap: Record<string, string> = {
      DRAFT: 'DRAFT',
      SUBMITTED: 'SENT',
      AUTHORISED: 'SENT',
      PAID: 'PAID',
      VOIDED: 'CANCELLED',
      DELETED: 'CANCELLED',
    };

    return statusMap[xeroStatus] || 'DRAFT';
  }

  /**
   * Sync a single invoice from Operate to Xero
   */
  async syncInvoiceToXero(
    invoiceId: string,
    xeroClient: XeroClient,
    tenantId: string,
    connectionId: string,
    orgId: string,
  ): Promise<string> {
    // Get invoice from Operate
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: true, // Assuming invoice has line items
      },
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    // Ensure customer is synced to Xero
    let xeroContactId: string | null = null;
    if (invoice.customerId) {
      xeroContactId = await this.mappingService.getXeroId(
        connectionId,
        XeroSyncEntityType.CONTACT,
        invoice.customerId,
      );

      if (!xeroContactId && invoice.customer) {
        // Sync customer first
        xeroContactId = await this.customerSync.syncCustomerToXero(
          invoice.customerId,
          xeroClient,
          tenantId,
          connectionId,
          orgId,
        );
      }
    }

    if (!xeroContactId) {
      throw new Error(`Cannot sync invoice ${invoiceId}: customer not synced to Xero`);
    }

    // Check if invoice already synced
    const xeroId = await this.mappingService.getXeroId(
      connectionId,
      XeroSyncEntityType.INVOICE,
      invoiceId,
    );

    // Map Operate invoice to Xero invoice
    const xeroInvoice = this.mapOperateInvoiceToXero(invoice, xeroContactId);

    if (xeroId) {
      // Update existing invoice in Xero
      xeroInvoice.invoiceID = xeroId;
      const response = await xeroClient.accountingApi.updateInvoice(
        tenantId,
        xeroId,
        { invoices: [xeroInvoice] },
      );

      this.logger.debug(`Updated Xero invoice ${xeroId} from invoice ${invoiceId}`);
      return xeroId;
    } else {
      // Create new invoice in Xero
      const response = await xeroClient.accountingApi.createInvoices(tenantId, {
        invoices: [xeroInvoice],
      });

      const newXeroId = response.body.invoices![0].invoiceID!;

      // Create mapping
      await this.mappingService.createMapping({
        connectionId,
        orgId,
        entityType: XeroSyncEntityType.INVOICE,
        operateId: invoiceId,
        xeroId: newXeroId,
        metadata: {
          xeroInvoiceNumber: response.body.invoices![0].invoiceNumber,
          xeroStatus: response.body.invoices![0].status,
        },
      });

      this.logger.debug(`Created Xero invoice ${newXeroId} from invoice ${invoiceId}`);
      return newXeroId;
    }
  }

  /**
   * Map Operate invoice to Xero invoice format
   */
  private mapOperateInvoiceToXero(invoice: any, xeroContactId: string): Invoice {
    const xeroInvoice: Invoice = {
      type: 'ACCREC' as Prisma.InputJsonValue, // Accounts Receivable (sales invoice)
      contact: {
        contactID: xeroContactId,
      },
      date: invoice.invoiceDate?.toISOString().split('T')[0],
      dueDate: invoice.dueDate?.toISOString().split('T')[0],
      lineAmountTypes: 'Exclusive' as Prisma.InputJsonValue, // Tax is calculated on top of line amounts
      invoiceNumber: invoice.invoiceNumber,
      reference: invoice.reference || undefined,
      currencyCode: invoice.currency || 'EUR',
      status: this.mapOperateStatusToXero(invoice.status),
      lineItems: this.mapLineItems(invoice.items || []),
    };

    return xeroInvoice;
  }

  /**
   * Map Operate invoice status to Xero status
   */
  private mapOperateStatusToXero(operateStatus: string): any {
    const statusMap: Record<string, string> = {
      DRAFT: 'DRAFT',
      SENT: 'AUTHORISED',
      PAID: 'PAID',
      CANCELLED: 'VOIDED',
      OVERDUE: 'AUTHORISED',
    };

    return statusMap[operateStatus] || 'DRAFT';
  }

  /**
   * Map invoice line items to Xero format
   */
  private mapLineItems(items: any[]): LineItem[] {
    return items.map((item) => ({
      description: item.description || '',
      quantity: item.quantity || 1,
      unitAmount: item.unitPrice || 0,
      accountCode: item.accountCode || undefined,
      taxType: item.taxRate ? 'OUTPUT' : 'NONE',
      taxAmount: item.taxAmount || undefined,
      lineAmount: item.amount || 0,
    }));
  }

  /**
   * Delete invoice mapping when invoice is deleted in Operate
   */
  async handleInvoiceDeleted(invoiceId: string, connectionId: string): Promise<void> {
    await this.mappingService.deleteMapping(
      connectionId,
      XeroSyncEntityType.INVOICE,
      invoiceId,
    );
  }
}
