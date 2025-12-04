import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { XeroMappingService, XeroSyncEntityType } from './xero-mapping.service';
import { XeroClient } from 'xero-node';
import { Payment } from 'xero-node/dist/gen/model/accounting/payment';

/**
 * Xero Payment Sync Service
 * Handles bidirectional sync of payments between Operate and Xero
 */
@Injectable()
export class XeroPaymentSyncService {
  private readonly logger = new Logger(XeroPaymentSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mappingService: XeroMappingService,
  ) {}

  /**
   * Sync all payments from Xero to Operate
   */
  async syncAllFromXero(
    connectionId: string,
    orgId: string,
    xeroPayments: Payment[],
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

    for (const xeroPayment of xeroPayments) {
      try {
        // Check if payment already exists in mapping
        const operateId = await this.mappingService.getOperateId(
          connectionId,
          XeroSyncEntityType.PAYMENT,
          xeroPayment.paymentID!,
        );

        if (operateId) {
          // Update existing payment
          await this.updateOperatePaymentFromXero(orgId, operateId, xeroPayment);
          updated++;
        } else {
          // Create new payment
          const newPaymentId = await this.createOperatePaymentFromXero(
            connectionId,
            orgId,
            xeroPayment,
          );

          // Create mapping
          await this.mappingService.createMapping({
            connectionId,
            orgId,
            entityType: XeroSyncEntityType.PAYMENT,
            operateId: newPaymentId,
            xeroId: xeroPayment.paymentID!,
            metadata: {
              xeroStatus: xeroPayment.status,
              xeroPaymentType: xeroPayment.paymentType,
            },
          });
          created++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to sync payment ${xeroPayment.paymentID}: ${error.message}`,
        );
        failed++;
        errors.push({
          paymentId: xeroPayment.paymentID || 'unknown',
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Payment sync completed: ${created} created, ${updated} updated, ${failed} failed`,
    );

    return { created, updated, failed, errors };
  }

  /**
   * Create Operate payment from Xero payment
   */
  private async createOperatePaymentFromXero(
    connectionId: string,
    orgId: string,
    xeroPayment: Payment,
  ): Promise<string> {
    // Get invoice mapping if payment is linked to invoice
    let invoiceId: string | null = null;
    if (xeroPayment.invoice?.invoiceID) {
      invoiceId = await this.mappingService.getOperateId(
        connectionId,
        XeroSyncEntityType.INVOICE,
        xeroPayment.invoice.invoiceID,
      );

      if (!invoiceId) {
        this.logger.warn(
          `Invoice ${xeroPayment.invoice.invoiceID} not found in mappings for payment ${xeroPayment.paymentID}`,
        );
      }
    }

    // Map Xero payment to Operate payment
    const paymentData = this.mapXeroPaymentToOperate(xeroPayment, invoiceId);

    // Create payment in Operate
    const payment = await this.prisma.payment.create({
      data: {
        orgId,
        ...paymentData,
      },
    });

    this.logger.debug(`Created payment ${payment.id} from Xero payment ${xeroPayment.paymentID}`);

    return payment.id;
  }

  /**
   * Update Operate payment from Xero payment
   */
  private async updateOperatePaymentFromXero(
    orgId: string,
    paymentId: string,
    xeroPayment: Payment,
  ): Promise<void> {
    // Map Xero payment to Operate payment (exclude invoice - don't change it on update)
    const paymentData = this.mapXeroPaymentToOperate(xeroPayment, null);

    // Remove invoiceId from update
    delete paymentData.invoiceId;

    // Update payment in Operate
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: paymentData,
    });

    this.logger.debug(`Updated payment ${paymentId} from Xero payment ${xeroPayment.paymentID}`);
  }

  /**
   * Map Xero payment to Operate payment format
   */
  private mapXeroPaymentToOperate(xeroPayment: Payment, invoiceId: string | null): any {
    return {
      invoiceId: invoiceId || undefined,
      amount: xeroPayment.amount || 0,
      paymentDate: xeroPayment.date ? new Date(xeroPayment.date) : new Date(),
      paymentMethod: this.mapXeroPaymentType(xeroPayment.paymentType),
      reference: xeroPayment.reference || null,
      status: this.mapXeroPaymentStatus(xeroPayment.status),
      currencyCode: xeroPayment.currencyRate ? 'USD' : 'EUR', // TODO: Get from invoice
      metadata: {
        xeroPaymentId: xeroPayment.paymentID,
        xeroPaymentType: xeroPayment.paymentType,
        xeroStatus: xeroPayment.status,
        xeroIsReconciled: xeroPayment.isReconciled,
        xeroAccountCode: xeroPayment.account?.code,
      },
    };
  }

  /**
   * Map Xero payment type to Operate payment method
   */
  private mapXeroPaymentType(xeroType?: string): string {
    const typeMap: Record<string, string> = {
      ACCRECPAYMENT: 'BANK_TRANSFER',
      ACCPAYPAYMENT: 'BANK_TRANSFER',
      ARCREDITPAYMENT: 'CREDIT',
      APCREDITPAYMENT: 'CREDIT',
      AROVERPAYMENTPAYMENT: 'OVERPAYMENT',
      ARPREPAYMENTPAYMENT: 'PREPAYMENT',
    };

    return typeMap[xeroType || ''] || 'OTHER';
  }

  /**
   * Map Xero payment status to Operate status
   */
  private mapXeroPaymentStatus(xeroStatus?: string): string {
    const statusMap: Record<string, string> = {
      AUTHORISED: 'COMPLETED',
      DELETED: 'CANCELLED',
    };

    return statusMap[xeroStatus || ''] || 'PENDING';
  }

  /**
   * Sync a single payment from Operate to Xero
   */
  async syncPaymentToXero(
    paymentId: string,
    xeroClient: XeroClient,
    tenantId: string,
    connectionId: string,
    orgId: string,
  ): Promise<string> {
    // Get payment from Operate
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    // Get Xero invoice ID if payment is linked to invoice
    let xeroInvoiceId: string | null = null;
    if (payment.invoiceId) {
      xeroInvoiceId = await this.mappingService.getXeroId(
        connectionId,
        XeroSyncEntityType.INVOICE,
        payment.invoiceId,
      );

      if (!xeroInvoiceId) {
        throw new Error(
          `Cannot sync payment ${paymentId}: invoice not synced to Xero`,
        );
      }
    }

    // Check if payment already synced
    const xeroId = await this.mappingService.getXeroId(
      connectionId,
      XeroSyncEntityType.PAYMENT,
      paymentId,
    );

    // Map Operate payment to Xero payment
    const xeroPayment = this.mapOperatePaymentToXero(payment, xeroInvoiceId);

    if (xeroId) {
      // Payments are generally immutable in Xero, so we just return the existing ID
      this.logger.debug(
        `Payment ${paymentId} already synced to Xero as ${xeroId}`,
      );
      return xeroId;
    } else {
      // Create new payment in Xero
      const response = await xeroClient.accountingApi.createPayment(tenantId, {
        payments: [xeroPayment],
      });

      const newXeroId = response.body.payments![0].paymentID!;

      // Create mapping
      await this.mappingService.createMapping({
        connectionId,
        orgId,
        entityType: XeroSyncEntityType.PAYMENT,
        operateId: paymentId,
        xeroId: newXeroId,
        metadata: {
          xeroStatus: response.body.payments![0].status,
        },
      });

      this.logger.debug(`Created Xero payment ${newXeroId} from payment ${paymentId}`);
      return newXeroId;
    }
  }

  /**
   * Map Operate payment to Xero payment format
   */
  private mapOperatePaymentToXero(payment: any, xeroInvoiceId: string | null): Payment {
    const xeroPayment: Payment = {
      invoice: xeroInvoiceId
        ? {
            invoiceID: xeroInvoiceId,
          }
        : undefined,
      account: {
        code: '200', // Default bank account code (adjust as needed)
      },
      date: payment.paymentDate?.toISOString().split('T')[0],
      amount: payment.amount,
      reference: payment.reference || undefined,
    };

    return xeroPayment;
  }

  /**
   * Delete payment mapping when payment is deleted in Operate
   */
  async handlePaymentDeleted(paymentId: string, connectionId: string): Promise<void> {
    await this.mappingService.deleteMapping(
      connectionId,
      XeroSyncEntityType.PAYMENT,
      paymentId,
    );
  }
}
