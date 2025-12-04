import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QuickBooksMappingService } from './quickbooks-mapping.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * QuickBooks Payment Object (subset)
 */
interface QuickBooksPayment {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  CustomerRef: {
    value: string;
    name?: string;
  };
  PaymentMethodRef?: {
    value: string;
    name?: string;
  };
  Line: Array<{
    Amount: number;
    LinkedTxn?: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
}

/**
 * QuickBooks Payment Sync Service
 * Handles bidirectional sync of payments between QuickBooks and Operate
 */
@Injectable()
export class QuickBooksPaymentSyncService {
  private readonly logger = new Logger(QuickBooksPaymentSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mappingService: QuickBooksMappingService,
  ) {}

  /**
   * Sync payment from QuickBooks to Operate
   */
  async syncFromQuickBooks(
    connectionId: string,
    orgId: string,
    qbPayment: QuickBooksPayment,
  ): Promise<{ paymentId: string; isNew: boolean }> {
    try {
      // Check if payment already exists in mapping
      const existingOperateId = await this.mappingService.getOperateId(
        connectionId,
        'PAYMENT',
        qbPayment.Id,
      );

      // Get mapped customer ID
      const customerId = await this.mappingService.getOperateId(
        connectionId,
        'CUSTOMER',
        qbPayment.CustomerRef.value,
      );

      if (!customerId) {
        throw new Error(
          `Customer mapping not found for QuickBooks customer ${qbPayment.CustomerRef.value}`,
        );
      }

      // Extract linked invoice if available
      let invoiceId: string | null = null;
      let invoiceNumber: string | null = null;

      if (qbPayment.Line?.length > 0 && qbPayment.Line[0].LinkedTxn) {
        const linkedTxn = qbPayment.Line[0].LinkedTxn.find(
          (txn) => txn.TxnType === 'Invoice',
        );

        if (linkedTxn) {
          const mappedInvoiceId = await this.mappingService.getOperateId(
            connectionId,
            'INVOICE',
            linkedTxn.TxnId,
          );

          if (mappedInvoiceId) {
            invoiceId = mappedInvoiceId;

            // Get invoice number
            const invoice = await this.prisma.invoice.findUnique({
              where: { id: mappedInvoiceId },
              select: { number: true },
            });
            invoiceNumber = invoice?.number || null;
          }
        }
      }

      const paymentData = {
        clientId: customerId,
        amount: new Decimal(qbPayment.TotalAmt),
        currency: 'USD', // Would need to get from QB company info
        status: 'COMPLETED' as const,
        invoiceId,
        invoiceNumber,
        paymentMethod: qbPayment.PaymentMethodRef?.name || null,
        paidAt: new Date(qbPayment.TxnDate),
        reference: qbPayment.Id,
        notes: `Synced from QuickBooks`,
      };

      let paymentId: string;
      let isNew: boolean;

      if (existingOperateId) {
        // Update existing payment
        const payment = await this.prisma.clientPayment.update({
          where: { id: existingOperateId },
          data: paymentData,
        });
        paymentId = payment.id;
        isNew = false;
        this.logger.debug(`Updated existing payment ${paymentId} from QB ${qbPayment.Id}`);
      } else {
        // Create new payment
        const payment = await this.prisma.clientPayment.create({
          data: paymentData,
        });
        paymentId = payment.id;
        isNew = true;
        this.logger.debug(`Created new payment ${paymentId} from QB ${qbPayment.Id}`);

        // If payment is linked to an invoice, update invoice status
        if (invoiceId) {
          await this.updateInvoiceStatus(invoiceId);
        }
      }

      // Create/update mapping
      await this.mappingService.createMapping({
        connectionId,
        orgId,
        entityType: 'PAYMENT',
        operateId: paymentId,
        quickbooksId: qbPayment.Id,
        metadata: {
          amount: qbPayment.TotalAmt,
          txnDate: qbPayment.TxnDate,
        },
      });

      return { paymentId, isNew };
    } catch (error) {
      this.logger.error(`Failed to sync payment from QuickBooks: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Update invoice status based on payment
   */
  private async updateInvoiceStatus(invoiceId: string): Promise<void> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return;
      }

      // Get all payments for this invoice
      const payments = await this.prisma.clientPayment.findMany({
        where: {
          invoiceId,
          status: 'COMPLETED',
        },
      });

      const totalPaid = payments.reduce(
        (sum, payment) => sum.add(payment.amount),
        new Decimal(0),
      );

      // Update invoice status
      let newStatus: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' = 'SENT';

      if (totalPaid.greaterThanOrEqualTo(invoice.totalAmount)) {
        newStatus = 'PAID';
      } else if (new Date() > invoice.dueDate) {
        newStatus = 'OVERDUE';
      }

      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus,
          paidDate: newStatus === 'PAID' ? new Date() : null,
        },
      });

      this.logger.debug(`Updated invoice ${invoiceId} status to ${newStatus}`);
    } catch (error) {
      this.logger.error(`Failed to update invoice status: ${error.message}`);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Sync payment from Operate to QuickBooks
   */
  async syncToQuickBooks(
    connectionId: string,
    paymentId: string,
    accessToken: string,
    companyId: string,
  ): Promise<{ quickbooksId: string; isNew: boolean }> {
    try {
      // Get payment from Operate
      const payment = await this.prisma.clientPayment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      // Get QuickBooks customer ID
      const qbCustomerId = await this.mappingService.getQuickBooksId(
        connectionId,
        'CUSTOMER',
        payment.clientId,
      );

      if (!qbCustomerId) {
        throw new Error(
          `QuickBooks customer mapping not found for ${payment.clientId}`,
        );
      }

      // Get QuickBooks invoice ID if linked
      let qbInvoiceId: string | undefined;
      if (payment.invoiceId) {
        const mappedInvoiceId = await this.mappingService.getQuickBooksId(
          connectionId,
          'INVOICE',
          payment.invoiceId,
        );
        qbInvoiceId = mappedInvoiceId || undefined;
      }

      // Check if payment already exists in QuickBooks
      const existingQbId = await this.mappingService.getQuickBooksId(
        connectionId,
        'PAYMENT',
        paymentId,
      );

      // Map Operate payment to QuickBooks format
      const qbPaymentData: Partial<QuickBooksPayment> = {
        TxnDate: payment.paidAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        TotalAmt: Number(payment.amount),
        CustomerRef: {
          value: qbCustomerId,
        },
        Line: [
          {
            Amount: Number(payment.amount),
            ...(qbInvoiceId && {
              LinkedTxn: [
                {
                  TxnId: qbInvoiceId,
                  TxnType: 'Invoice',
                },
              ],
            }),
          },
        ],
      };

      // TODO: Call QuickBooks API to create/update payment

      const quickbooksId = existingQbId || `QB-PMT-${Date.now()}`;
      const isNew = !existingQbId;

      // Create/update mapping
      await this.mappingService.createMapping({
        connectionId,
        orgId: '', // Would need to get from payment context
        entityType: 'PAYMENT',
        operateId: paymentId,
        quickbooksId,
        metadata: {
          amount: Number(payment.amount),
        },
      });

      return { quickbooksId, isNew };
    } catch (error) {
      this.logger.error(`Failed to sync payment to QuickBooks: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Sync all payments from QuickBooks to Operate
   */
  async syncAllFromQuickBooks(
    connectionId: string,
    orgId: string,
    qbPayments: QuickBooksPayment[],
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ paymentId: string; error: string }>;
  }> {
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ paymentId: string; error: string }> = [];

    for (const qbPayment of qbPayments) {
      try {
        const result = await this.syncFromQuickBooks(connectionId, orgId, qbPayment);
        if (result.isNew) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        failed++;
        errors.push({
          paymentId: qbPayment.Id,
          error: error.message,
        });
        this.logger.error(`Failed to sync payment ${qbPayment.Id}: ${error.message}`);
      }
    }

    this.logger.log(
      `Payment sync completed: ${created} created, ${updated} updated, ${failed} failed`,
    );

    return { created, updated, failed, errors };
  }

  /**
   * Get payments modified since a specific date
   */
  async getModifiedPayments(orgId: string, since: Date): Promise<any[]> {
    return this.prisma.clientPayment.findMany({
      where: {
        updatedAt: {
          gt: since,
        },
      },
      include: {
        client: {
          select: {
            orgId: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}
