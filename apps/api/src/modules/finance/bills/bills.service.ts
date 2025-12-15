import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BillsRepository } from './bills.repository';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { BillFilterDto } from './dto/bill-filter.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { Prisma, BillStatus, PaymentStatus, AuditEntityType, AuditAction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FinancialAuditService } from '../../audit/financial-audit.service';
import { PrismaService } from '../../database/prisma.service';

/**
 * Bills Service
 * Business logic for bill (accounts payable) management
 */
@Injectable()
export class BillsService {
  private readonly logger = new Logger(BillsService.name);

  constructor(
    private readonly billsRepository: BillsRepository,
    private readonly auditService: FinancialAuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Find all bills with pagination and filters
   */
  async findAll(organisationId: string, query: BillFilterDto) {
    const {
      search,
      status,
      paymentStatus,
      vendorId,
      sourceType,
      categoryId,
      fromDate,
      toDate,
      fromDueDate,
      toDueDate,
      overdue,
      taxDeductible,
      page = 1,
      pageSize = 20,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = query;

    // Build where clause
    const where: Prisma.BillWhereInput = {
      organisationId,
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(vendorId && { vendorId }),
      ...(sourceType && { sourceType }),
      ...(categoryId && { categoryId }),
      ...(taxDeductible !== undefined && { taxDeductible }),
      ...(search && {
        OR: [
          { billNumber: { contains: search, mode: 'insensitive' } },
          { vendorName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Issue date range filter
    if (fromDate || toDate) {
      where.issueDate = {};
      if (fromDate) {
        where.issueDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.issueDate.lte = new Date(toDate);
      }
    }

    // Due date range filter
    if (fromDueDate || toDueDate) {
      where.dueDate = {};
      if (fromDueDate) {
        where.dueDate.gte = new Date(fromDueDate);
      }
      if (toDueDate) {
        where.dueDate.lte = new Date(toDueDate);
      }
    }

    // Overdue filter
    if (overdue) {
      where.dueDate = { lt: new Date() };
      where.paymentStatus = { not: PaymentStatus.COMPLETED };
    }

    const skip = (page - 1) * pageSize;

    const [bills, total] = await Promise.all([
      this.billsRepository.findAll({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
          vendor: true,
        },
      }),
      this.billsRepository.count(where),
    ]);

    return {
      data: bills,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Find bill by ID
   */
  async findById(id: string, userId?: string) {
    const bill = await this.billsRepository.findById(id, {
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
      vendor: true,
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    });

    if (!bill) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }

    // Audit log: READ access
    await this.auditService.logAccess({
      userId,
      organisationId: bill.organisationId,
      entityType: AuditEntityType.INVOICE, // Using INVOICE as placeholder - Bills may need their own entity type
      entityId: id,
    });

    return bill;
  }

  /**
   * Create new bill
   */
  async create(organisationId: string, dto: CreateBillDto, userId?: string) {
    // Calculate total amount if not provided
    let totalAmount = dto.totalAmount;
    if (!totalAmount) {
      const taxAmount = dto.taxAmount || 0;
      totalAmount = dto.amount + taxAmount;
    }

    // Validate total amount
    if (dto.taxAmount && totalAmount < dto.amount + dto.taxAmount) {
      throw new BadRequestException(
        'Total amount must be greater than or equal to amount + tax',
      );
    }

    // Calculate due date from vendor payment terms if vendor is specified
    let dueDate = new Date(dto.dueDate);
    if (dto.vendorId) {
      const vendor = await this.billsRepository.findVendorById(dto.vendorId);
      if (vendor) {
        // If due date is not explicitly set or matches issue date, use vendor payment terms
        const issueDate = new Date(dto.issueDate);
        if (
          dto.dueDate === dto.issueDate ||
          !dto.dueDate
        ) {
          dueDate = new Date(issueDate);
          dueDate.setDate(dueDate.getDate() + vendor.paymentTerms);
        }
      }
    }

    // Prepare bill data
    const billData: Prisma.BillCreateInput = {
      organisation: { connect: { id: organisationId } },
      ...(dto.vendorId && { vendor: { connect: { id: dto.vendorId } } }),
      vendorName: dto.vendorName,
      billNumber: dto.billNumber,
      reference: dto.reference,
      description: dto.description,
      amount: new Decimal(dto.amount),
      currency: dto.currency || 'EUR',
      taxAmount: new Decimal(dto.taxAmount || 0),
      totalAmount: new Decimal(totalAmount),
      paidAmount: new Decimal(0),
      status: dto.status || BillStatus.DRAFT,
      paymentStatus: dto.paymentStatus || PaymentStatus.PENDING,
      issueDate: new Date(dto.issueDate),
      dueDate,
      sourceType: dto.sourceType || 'MANUAL',
      sourceEmailId: dto.sourceEmailId,
      sourceAttachmentId: dto.sourceAttachmentId,
      extractedDataId: dto.extractedDataId,
      categoryId: dto.categoryId,
      taxDeductible: dto.taxDeductible !== undefined ? dto.taxDeductible : true,
      deductionCategory: dto.deductionCategory,
      vatRate: dto.vatRate ? new Decimal(dto.vatRate) : undefined,
      notes: dto.notes,
      internalNotes: dto.internalNotes,
      attachmentUrls: dto.attachmentUrls || [],
      metadata: dto.metadata ?? undefined,
    };

    // Prepare line items data
    let lineItemsData: Prisma.BillLineItemCreateManyBillInput[] = [];
    if (dto.lineItems && dto.lineItems.length > 0) {
      lineItemsData = dto.lineItems.map((item, index) => {
        const itemAmount = item.quantity * item.unitPrice;
        const itemTaxRate = item.taxRate ?? dto.vatRate ?? 0;
        const itemTaxAmount = (itemAmount * itemTaxRate) / 100;

        return {
          description: item.description,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          amount: new Decimal(itemAmount),
          taxRate: itemTaxRate ? new Decimal(itemTaxRate) : undefined,
          taxAmount: itemTaxAmount ? new Decimal(itemTaxAmount) : undefined,
          category: item.category,
          productCode: item.productCode,
          sortOrder: item.sortOrder ?? index + 1,
        };
      });
    }

    const bill = await this.billsRepository.create(billData, lineItemsData);

    this.logger.log(
      `Created bill ${bill.id} for organisation ${organisationId}`,
    );

    // Audit log: CREATE
    await this.auditService.logCreate({
      userId,
      organisationId,
      entityType: AuditEntityType.INVOICE, // Using INVOICE as placeholder
      entityId: bill.id,
      newState: bill,
    });

    // Auto-mark as overdue if already past due date
    if (dueDate < new Date() && bill.paymentStatus !== PaymentStatus.COMPLETED) {
      await this.markOverdue(bill.id);
    }

    return bill;
  }

  /**
   * Update bill (only DRAFT bills can be fully updated)
   */
  async update(id: string, dto: UpdateBillDto, userId?: string) {
    const existing = await this.billsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }

    // Only DRAFT bills can be fully updated
    if (existing.status !== BillStatus.DRAFT) {
      // For non-draft bills, only allow certain fields to be updated
      const allowedFields = [
        'categoryId',
        'taxDeductible',
        'deductionCategory',
        'notes',
        'internalNotes',
        'attachmentUrls',
        'metadata',
      ];
      const attemptedFields = Object.keys(dto);
      const disallowedFields = attemptedFields.filter(
        (field) => !allowedFields.includes(field),
      );

      if (disallowedFields.length > 0) {
        throw new BadRequestException(
          `Cannot update fields [${disallowedFields.join(', ')}] for bill with status ${existing.status}. Only DRAFT bills can be fully updated.`,
        );
      }
    }

    const updateData: Prisma.BillUpdateInput = {};

    // Update basic fields
    if (dto.vendorId !== undefined) {
      updateData.vendor = dto.vendorId ? { connect: { id: dto.vendorId } } : { disconnect: true };
    }
    if (dto.vendorName) updateData.vendorName = dto.vendorName;
    if (dto.billNumber !== undefined) updateData.billNumber = dto.billNumber;
    if (dto.reference !== undefined) updateData.reference = dto.reference;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.currency) updateData.currency = dto.currency;
    if (dto.status) updateData.status = dto.status;
    if (dto.paymentStatus) updateData.paymentStatus = dto.paymentStatus;
    if (dto.issueDate) updateData.issueDate = new Date(dto.issueDate);
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.taxDeductible !== undefined)
      updateData.taxDeductible = dto.taxDeductible;
    if (dto.deductionCategory !== undefined)
      updateData.deductionCategory = dto.deductionCategory;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.internalNotes !== undefined)
      updateData.internalNotes = dto.internalNotes;
    if (dto.attachmentUrls !== undefined)
      updateData.attachmentUrls = dto.attachmentUrls;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata ?? undefined;

    // Update amounts and recalculate if needed
    if (dto.amount !== undefined) updateData.amount = new Decimal(dto.amount);
    if (dto.taxAmount !== undefined)
      updateData.taxAmount = new Decimal(dto.taxAmount);
    if (dto.vatRate !== undefined)
      updateData.vatRate = dto.vatRate ? new Decimal(dto.vatRate) : null;

    // Recalculate total if amount or tax changed
    if (dto.amount !== undefined || dto.taxAmount !== undefined) {
      const amount = dto.amount ?? Number(existing.amount);
      const taxAmount = dto.taxAmount ?? Number(existing.taxAmount);
      updateData.totalAmount = new Decimal(amount + taxAmount);
    } else if (dto.totalAmount !== undefined) {
      updateData.totalAmount = new Decimal(dto.totalAmount);
    }

    // If line items are being updated, handle them separately
    let lineItemsData: any[] | undefined;
    if (dto.lineItems) {
      lineItemsData = dto.lineItems.map((item, index) => {
        const itemAmount = item.quantity * item.unitPrice;
        const itemTaxRate = item.taxRate ?? dto.vatRate ?? Number(existing.vatRate) ?? 0;
        const itemTaxAmount = (itemAmount * itemTaxRate) / 100;

        return {
          description: item.description,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          amount: new Decimal(itemAmount),
          taxRate: itemTaxRate ? new Decimal(itemTaxRate) : undefined,
          taxAmount: itemTaxAmount ? new Decimal(itemTaxAmount) : undefined,
          category: item.category,
          productCode: item.productCode,
          sortOrder: item.sortOrder ?? index + 1,
        };
      });
    }

    const bill = await this.billsRepository.updateWithItems(
      id,
      updateData,
      lineItemsData,
    );

    this.logger.log(`Updated bill ${id}`);

    // Audit log: UPDATE
    await this.auditService.logUpdate({
      userId,
      organisationId: existing.organisationId,
      entityType: AuditEntityType.INVOICE, // Using INVOICE as placeholder
      entityId: id,
      previousState: existing,
      newState: bill,
      changes: updateData,
    });

    return bill;
  }

  /**
   * Delete bill (only DRAFT bills)
   */
  async delete(id: string, userId?: string): Promise<void> {
    const existing = await this.billsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }

    if (existing.status !== BillStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot delete bill with status ${existing.status}. Only DRAFT bills can be deleted.`,
      );
    }

    await this.billsRepository.delete(id);

    this.logger.log(`Deleted bill ${id}`);

    // Audit log: DELETE
    await this.auditService.logDelete({
      userId,
      organisationId: existing.organisationId,
      entityType: AuditEntityType.INVOICE, // Using INVOICE as placeholder
      entityId: id,
      previousState: existing,
    });
  }

  /**
   * Approve bill
   */
  async approve(id: string, userId: string) {
    const existing = await this.billsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }

    if (existing.status === BillStatus.APPROVED) {
      throw new BadRequestException('Bill is already approved');
    }

    if (existing.status === BillStatus.PAID) {
      throw new BadRequestException('Cannot approve a paid bill');
    }

    if (existing.status === BillStatus.CANCELLED) {
      throw new BadRequestException('Cannot approve a cancelled bill');
    }

    const bill = await this.billsRepository.update(id, {
      status: BillStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionNotes: null,
    });

    this.logger.log(`Approved bill ${id} by user ${userId}`);

    // Audit log: APPROVE
    await this.auditService.logApproval({
      userId,
      organisationId: existing.organisationId,
      entityType: AuditEntityType.INVOICE,
      entityId: id,
      action: AuditAction.APPROVE,
      previousState: existing,
      newState: bill,
    });

    // TODO S2-04: Emit event for notifications

    return bill;
  }

  /**
   * Reject bill
   */
  async reject(id: string, userId: string, rejectionNotes?: string) {
    const existing = await this.billsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }

    if (existing.status === BillStatus.PAID) {
      throw new BadRequestException('Cannot reject a paid bill');
    }

    if (existing.status === BillStatus.CANCELLED) {
      throw new BadRequestException('Bill is already cancelled');
    }

    const bill = await this.billsRepository.update(id, {
      status: BillStatus.CANCELLED,
      rejectedBy: userId,
      rejectedAt: new Date(),
      rejectionNotes,
      approvedBy: null,
      approvedAt: null,
    });

    this.logger.log(`Rejected bill ${id} by user ${userId}`);

    // Audit log: REJECT
    await this.auditService.logApproval({
      userId,
      organisationId: existing.organisationId,
      entityType: AuditEntityType.INVOICE,
      entityId: id,
      action: AuditAction.REJECT,
      previousState: existing,
      newState: bill,
      metadata: { rejectionNotes },
    });

    // TODO S2-04: Emit event for notifications

    return bill;
  }

  /**
   * Record payment for bill
   */
  async recordPayment(id: string, dto: RecordPaymentDto) {
    const bill = await this.billsRepository.findById(id, {
      payments: true,
    });

    if (!bill) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }

    if (bill.status === BillStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payment for cancelled bill');
    }

    // Calculate total paid so far
    const currentPaidAmount = Number(bill.paidAmount);
    const totalAmount = Number(bill.totalAmount);
    const newPaidAmount = currentPaidAmount + dto.amount;

    // Validate payment amount
    if (newPaidAmount > totalAmount) {
      throw new BadRequestException(
        `Payment amount ${dto.amount} would exceed remaining balance. Outstanding: ${totalAmount - currentPaidAmount}`,
      );
    }

    // Create payment record
    const paymentData: Prisma.BillPaymentCreateInput = {
      bill: { connect: { id } },
      amount: new Decimal(dto.amount),
      paymentDate: new Date(dto.paymentDate),
      paymentMethod: dto.paymentMethod,
      transactionId: dto.transactionId,
      bankTransactionId: dto.bankTransactionId,
      reference: dto.reference,
      notes: dto.notes,
      metadata: dto.metadata ?? undefined,
    };

    await this.billsRepository.createPayment(paymentData);

    // Update bill payment status and paid amount
    let paymentStatus: PaymentStatus;
    let billStatus = bill.status;
    let paidDate: Date | undefined;

    if (newPaidAmount >= totalAmount) {
      paymentStatus = PaymentStatus.COMPLETED;
      billStatus = BillStatus.PAID;
      paidDate = new Date(dto.paymentDate);
    } else if (newPaidAmount > 0) {
      paymentStatus = PaymentStatus.PENDING; // Partial payment
    } else {
      paymentStatus = PaymentStatus.PENDING;
    }

    const updatedBill = await this.billsRepository.update(id, {
      paidAmount: new Decimal(newPaidAmount),
      paymentStatus,
      status: billStatus,
      paidDate,
    });

    this.logger.log(
      `Recorded payment of ${dto.amount} for bill ${id}. New total paid: ${newPaidAmount}/${totalAmount}`,
    );

    // TODO S2-04: Emit event for notifications

    return updatedBill;
  }

  /**
   * Get overdue bills
   */
  async getOverdue(organisationId: string) {
    return this.billsRepository.getOverdueBills(organisationId);
  }

  /**
   * Get bills due soon (next 7 days)
   */
  async getDueSoon(organisationId: string, days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.billsRepository.findAll({
      where: {
        organisationId,
        dueDate: {
          gte: today,
          lte: futureDate,
        },
        paymentStatus: { not: PaymentStatus.COMPLETED },
      },
      include: {
        vendor: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  /**
   * Get bill summary statistics
   */
  async getSummary(organisationId: string) {
    const stats = await this.billsRepository.getStatisticsByStatus(
      organisationId,
    );

    const overdue = await this.billsRepository.getOverdueBills(organisationId);
    const dueSoon = await this.getDueSoon(organisationId, 7);

    return {
      byStatus: stats,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce(
        (sum, bill) => sum + Number(bill.totalAmount) - Number(bill.paidAmount),
        0,
      ),
      dueSoonCount: dueSoon.length,
      dueSoonAmount: dueSoon.reduce(
        (sum, bill) => sum + Number(bill.totalAmount) - Number(bill.paidAmount),
        0,
      ),
    };
  }

  /**
   * Mark bill as overdue (internal method, can be called by cron job)
   */
  private async markOverdue(id: string) {
    const bill = await this.billsRepository.findById(id);

    if (!bill) {
      return;
    }

    if (
      bill.dueDate < new Date() &&
      bill.paymentStatus !== PaymentStatus.COMPLETED &&
      bill.status !== BillStatus.OVERDUE
    ) {
      await this.billsRepository.update(id, {
        status: BillStatus.OVERDUE,
      });

      this.logger.log(`Marked bill ${id} as overdue`);
    }
  }

  /**
   * Batch mark overdue bills (to be called by scheduled job)
   * Optimized: Uses single updateMany instead of individual updates
   */
  async batchMarkOverdue(organisationId: string) {
    const where = {
      organisationId,
      dueDate: { lt: new Date() },
      paymentStatus: { not: PaymentStatus.COMPLETED },
      status: { notIn: [BillStatus.OVERDUE, BillStatus.CANCELLED] },
    };

    // Get bill IDs for return value before updating
    const overdueBills = await this.billsRepository.findAll({
      where,
      select: { id: true },
    });

    // Use batch update for better performance
    const updateResult = await this.prisma.bill.updateMany({
      where,
      data: {
        status: BillStatus.OVERDUE,
      },
    });

    this.logger.log(
      `Marked ${updateResult.count} bills as overdue for organisation ${organisationId}`,
    );

    return {
      count: updateResult.count,
      billIds: overdueBills.map((b) => b.id),
    };
  }
}
