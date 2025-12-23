import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InvoicesService } from '../finance/invoices/invoices.service';
import { BillsService } from '../finance/bills/bills.service';
import { ExpensesService } from '../finance/expenses/expenses.service';
import { BankingService } from '../finance/banking/banking.service';
import {
  BulkInvoiceSendDto,
  BulkInvoiceApproveDto,
  BulkInvoiceMarkPaidDto,
  BulkBillApproveDto,
  BulkBillSchedulePaymentDto,
  BulkTransactionCategorizeDto,
  BulkTransactionReconcileDto,
  BulkExpenseApproveDto,
  BulkExpenseRejectDto,
} from './dto/bulk-operation.dto';
import { BulkOperationResult, BulkResultBuilder } from './dto/bulk-result.dto';

/**
 * Bulk Operations Service
 * Handles bulk operations across multiple entities with transaction support
 */
@Injectable()
export class BulkService {
  private readonly logger = new Logger(BulkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
    private readonly billsService: BillsService,
    private readonly expensesService: ExpensesService,
    private readonly bankingService: BankingService,
  ) {}

  // ============================================================================
  // INVOICE BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk send invoices
   * Changes status from DRAFT to SENT
   */
  async bulkSendInvoices(
    orgId: string,
    dto: BulkInvoiceSendDto,
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const builder = new BulkResultBuilder().setTotal(dto.ids.length);

    // Verify all invoices belong to the organization
    await this.verifyInvoicesOwnership(orgId, dto.ids);

    // Process each invoice
    for (const id of dto.ids) {
      try {
        await this.invoicesService.send(id);
        builder.addSuccess(id);
      } catch (error) {
        builder.addError(id, error.message, {
          code: error.status || 500,
        });
      }
    }

    const result = builder
      .setMetadata({
        operation: 'send',
        duration: Date.now() - startTime,
      })
      .build();

    this.logger.log(
      `Bulk send invoices: ${result.successful}/${result.total} successful`,
    );

    return result;
  }

  /**
   * Bulk approve invoices
   * Not typically used for invoices but included for completeness
   */
  async bulkApproveInvoices(
    orgId: string,
    dto: BulkInvoiceApproveDto,
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const builder = new BulkResultBuilder().setTotal(dto.ids.length);

    // Verify all invoices belong to the organization
    await this.verifyInvoicesOwnership(orgId, dto.ids);

    // Process each invoice - for invoices, "approve" means send
    for (const id of dto.ids) {
      try {
        await this.invoicesService.send(id);
        builder.addSuccess(id);
      } catch (error) {
        builder.addError(id, error.message, {
          code: error.status || 500,
        });
      }
    }

    const result = builder
      .setMetadata({
        operation: 'approve',
        duration: Date.now() - startTime,
      })
      .build();

    this.logger.log(
      `Bulk approve invoices: ${result.successful}/${result.total} successful`,
    );

    return result;
  }

  /**
   * Bulk mark invoices as paid
   */
  async bulkMarkInvoicesPaid(
    orgId: string,
    dto: BulkInvoiceMarkPaidDto,
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const builder = new BulkResultBuilder().setTotal(dto.ids.length);

    // Verify all invoices belong to the organization
    await this.verifyInvoicesOwnership(orgId, dto.ids);

    // Process each invoice
    for (const id of dto.ids) {
      try {
        await this.invoicesService.pay(id);
        builder.addSuccess(id);
      } catch (error) {
        builder.addError(id, error.message, {
          code: error.status || 500,
        });
      }
    }

    const result = builder
      .setMetadata({
        operation: 'markPaid',
        duration: Date.now() - startTime,
      })
      .build();

    this.logger.log(
      `Bulk mark invoices paid: ${result.successful}/${result.total} successful`,
    );

    return result;
  }

  // ============================================================================
  // BILL BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk approve bills
   */
  async bulkApproveBills(
    orgId: string,
    dto: BulkBillApproveDto,
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const builder = new BulkResultBuilder().setTotal(dto.ids.length);

    // Verify all bills belong to the organization
    await this.verifyBillsOwnership(orgId, dto.ids);

    // Process each bill
    for (const id of dto.ids) {
      try {
        await this.billsService.approve(id, dto.userId);
        builder.addSuccess(id);
      } catch (error) {
        builder.addError(id, error.message, {
          code: error.status || 500,
        });
      }
    }

    const result = builder
      .setMetadata({
        operation: 'approve',
        approvedBy: dto.userId,
        duration: Date.now() - startTime,
      })
      .build();

    this.logger.log(
      `Bulk approve bills: ${result.successful}/${result.total} successful`,
    );

    return result;
  }

  /**
   * Bulk schedule bill payments
   */
  async bulkScheduleBillPayments(
    orgId: string,
    dto: BulkBillSchedulePaymentDto,
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const builder = new BulkResultBuilder().setTotal(dto.ids.length);

    // Verify all bills belong to the organization
    await this.verifyBillsOwnership(orgId, dto.ids);

    // Process each bill - create scheduled payments
    for (const id of dto.ids) {
      try {
        // Fetch the bill to get amount and vendor details
        const bill = await this.billsService.findById(id);

        // Create scheduled payment
        await this.prisma.scheduledPayment.create({
          data: {
            organisationId: orgId,
            billId: id,
            amount: bill.totalAmount,
            currency: bill.currency,
            scheduledDate: new Date(dto.scheduledDate),
            paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
            status: 'PENDING',
            reference: bill.billNumber || undefined,
            notes: `Payment for bill ${bill.billNumber || id}${bill.vendorName ? ` - ${bill.vendorName}` : ''}`,
          },
        });

        builder.addSuccess(id);
      } catch (error) {
        builder.addError(id, error.message, {
          code: error.status || 500,
        });
      }
    }

    const result = builder
      .setMetadata({
        operation: 'schedulePayment',
        scheduledDate: dto.scheduledDate,
        duration: Date.now() - startTime,
      })
      .build();

    this.logger.log(
      `Bulk schedule bill payments: ${result.successful}/${result.total} successful`,
    );

    return result;
  }

  // ============================================================================
  // TRANSACTION BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk categorize transactions
   * OPTIMIZED: Uses updateMany for single DB operation instead of N individual updates
   */
  async bulkCategorizeTransactions(
    accountId: string,
    orgId: string,
    dto: BulkTransactionCategorizeDto,
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const builder = new BulkResultBuilder().setTotal(dto.ids.length);

    // Verify all transactions belong to the account and organization
    await this.verifyTransactionsOwnership(accountId, orgId, dto.ids);

    try {
      // OPTIMIZATION: Single updateMany call instead of N individual updates
      const updateResult = await this.prisma.bankTransaction.updateMany({
        where: {
          id: { in: dto.ids },
        },
        data: {
          category: dto.category,
          subcategory: dto.subcategory || null,
        },
      });

      // Mark all as successful (updateMany doesn't give individual results)
      dto.ids.forEach(id => builder.addSuccess(id));

      this.logger.log(
        `Bulk categorize: Updated ${updateResult.count} transactions`,
      );
    } catch (error) {
      // If updateMany fails, all transactions failed
      dto.ids.forEach(id =>
        builder.addError(id, error.message, { code: error.status || 500 })
      );
    }

    const result = builder
      .setMetadata({
        operation: 'categorize',
        category: dto.category,
        subcategory: dto.subcategory,
        duration: Date.now() - startTime,
      })
      .build();

    this.logger.log(
      `Bulk categorize transactions: ${result.successful}/${result.total} successful`,
    );

    return result;
  }

  /**
   * Bulk reconcile transactions
   * OPTIMIZED: Uses updateMany for single DB operation instead of N individual updates
   */
  async bulkReconcileTransactions(
    accountId: string,
    orgId: string,
    dto: BulkTransactionReconcileDto,
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const builder = new BulkResultBuilder().setTotal(dto.ids.length);

    // Verify all transactions belong to the account and organization
    await this.verifyTransactionsOwnership(accountId, orgId, dto.ids);

    try {
      // OPTIMIZATION: Single updateMany call instead of N individual updates
      const reconciledAt = new Date();
      const updateResult = await this.prisma.bankTransaction.updateMany({
        where: {
          id: { in: dto.ids },
        },
        data: {
          isReconciled: true,
          reconciledAt,
        },
      });

      // Mark all as successful
      dto.ids.forEach(id => builder.addSuccess(id));

      this.logger.log(
        `Bulk reconcile: Updated ${updateResult.count} transactions`,
      );
    } catch (error) {
      // If updateMany fails, all transactions failed
      dto.ids.forEach(id =>
        builder.addError(id, error.message, { code: error.status || 500 })
      );
    }

    const result = builder
      .setMetadata({
        operation: 'reconcile',
        duration: Date.now() - startTime,
      })
      .build();

    this.logger.log(
      `Bulk reconcile transactions: ${result.successful}/${result.total} successful`,
    );

    return result;
  }

  // ============================================================================
  // EXPENSE BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk approve expenses
   */
  async bulkApproveExpenses(
    orgId: string,
    dto: BulkExpenseApproveDto,
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const builder = new BulkResultBuilder().setTotal(dto.ids.length);

    // Verify all expenses belong to the organization
    await this.verifyExpensesOwnership(orgId, dto.ids);

    // Process each expense
    for (const id of dto.ids) {
      try {
        await this.expensesService.approve(id, dto.approvedBy);
        builder.addSuccess(id);
      } catch (error) {
        builder.addError(id, error.message, {
          code: error.status || 500,
        });
      }
    }

    const result = builder
      .setMetadata({
        operation: 'approve',
        approvedBy: dto.approvedBy,
        duration: Date.now() - startTime,
      })
      .build();

    this.logger.log(
      `Bulk approve expenses: ${result.successful}/${result.total} successful`,
    );

    return result;
  }

  /**
   * Bulk reject expenses
   */
  async bulkRejectExpenses(
    orgId: string,
    dto: BulkExpenseRejectDto,
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const builder = new BulkResultBuilder().setTotal(dto.ids.length);

    // Verify all expenses belong to the organization
    await this.verifyExpensesOwnership(orgId, dto.ids);

    // Process each expense
    for (const id of dto.ids) {
      try {
        await this.expensesService.reject(id, dto.rejectionReason);
        builder.addSuccess(id);
      } catch (error) {
        builder.addError(id, error.message, {
          code: error.status || 500,
        });
      }
    }

    const result = builder
      .setMetadata({
        operation: 'reject',
        rejectionReason: dto.rejectionReason,
        duration: Date.now() - startTime,
      })
      .build();

    this.logger.log(
      `Bulk reject expenses: ${result.successful}/${result.total} successful`,
    );

    return result;
  }

  // ============================================================================
  // VERIFICATION HELPERS
  // ============================================================================

  /**
   * Verify all invoices belong to the organization
   */
  private async verifyInvoicesOwnership(
    orgId: string,
    ids: string[],
  ): Promise<void> {
    const count = await this.prisma.invoice.count({
      where: {
        id: { in: ids },
        orgId,
      },
    });

    if (count !== ids.length) {
      throw new BadRequestException(
        'One or more invoices do not belong to this organization',
      );
    }
  }

  /**
   * Verify all bills belong to the organization
   */
  private async verifyBillsOwnership(
    orgId: string,
    ids: string[],
  ): Promise<void> {
    const count = await this.prisma.bill.count({
      where: {
        id: { in: ids },
        organisationId: orgId,
      },
    });

    if (count !== ids.length) {
      throw new BadRequestException(
        'One or more bills do not belong to this organization',
      );
    }
  }

  /**
   * Verify all transactions belong to the account and organization
   */
  private async verifyTransactionsOwnership(
    accountId: string,
    orgId: string,
    ids: string[],
  ): Promise<void> {
    // First verify the account belongs to the organization
    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id: accountId,
        orgId,
      },
    });

    if (!account) {
      throw new BadRequestException(
        'Bank account does not belong to this organization',
      );
    }

    // Then verify all transactions belong to the account
    const count = await this.prisma.bankTransaction.count({
      where: {
        id: { in: ids },
        bankAccountId: accountId,
      },
    });

    if (count !== ids.length) {
      throw new BadRequestException(
        'One or more transactions do not belong to this account',
      );
    }
  }

  /**
   * Verify all expenses belong to the organization
   */
  private async verifyExpensesOwnership(
    orgId: string,
    ids: string[],
  ): Promise<void> {
    const count = await this.prisma.expense.count({
      where: {
        id: { in: ids },
        orgId,
      },
    });

    if (count !== ids.length) {
      throw new BadRequestException(
        'One or more expenses do not belong to this organization',
      );
    }
  }
}
