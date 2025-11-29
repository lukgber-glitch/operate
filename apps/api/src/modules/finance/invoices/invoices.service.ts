import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InvoicesRepository } from './invoices.repository';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Invoices Service
 * Business logic for invoice management operations
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private repository: InvoicesRepository) {}

  /**
   * Find all invoices with pagination and filters
   */
  async findAll(orgId: string, query: InvoiceQueryDto) {
    const {
      search,
      status,
      type,
      customerId,
      fromDate,
      toDate,
      page = 1,
      pageSize = 20,
      sortBy = 'issueDate',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.InvoiceWhereInput = {
      orgId,
      ...(status && { status }),
      ...(type && { type }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Date range filter
    if (fromDate || toDate) {
      where.issueDate = {};
      if (fromDate) {
        where.issueDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.issueDate.lte = new Date(toDate);
      }
    }

    const skip = (page - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      this.repository.findAll({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.repository.count(where),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get invoice statistics by status
   */
  async getStatistics(orgId: string) {
    return this.repository.getStatisticsByStatus(orgId);
  }

  /**
   * Get overdue invoices
   */
  async getOverdue(orgId: string) {
    return this.repository.getOverdueInvoices(orgId);
  }

  /**
   * Find invoice by ID
   */
  async findById(id: string) {
    const invoice = await this.repository.findById(id, {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  /**
   * Create new invoice
   */
  async create(orgId: string, dto: CreateInvoiceDto) {
    // Validate that items array is not empty
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // Generate invoice number
    const issueDate = new Date(dto.issueDate);
    const year = issueDate.getFullYear();
    const invoiceNumber = await this.repository.getNextInvoiceNumber(
      orgId,
      year,
    );

    // Calculate totals
    const { subtotal, taxAmount, totalAmount } = this.calculateTotals(
      dto.items,
      dto.vatRate || 0,
    );

    // Prepare invoice data
    const invoiceData: Prisma.InvoiceCreateInput = {
      orgId,
      number: invoiceNumber,
      type: dto.type,
      status: InvoiceStatus.DRAFT,
      customerId: dto.customerId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerAddress: dto.customerAddress,
      customerVatId: dto.customerVatId,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      subtotal: new Decimal(subtotal),
      taxAmount: new Decimal(taxAmount),
      totalAmount: new Decimal(totalAmount),
      currency: dto.currency || 'EUR',
      vatRate: dto.vatRate,
      reverseCharge: dto.reverseCharge || false,
      paymentTerms: dto.paymentTerms,
      paymentMethod: dto.paymentMethod,
      bankReference: dto.bankReference,
      notes: dto.notes,
      internalNotes: dto.internalNotes,
      metadata: dto.metadata ?? undefined,
    };

    // Prepare items data
    const itemsData = dto.items.map((item, index) => {
      const itemTaxRate = item.taxRate ?? dto.vatRate ?? 0;
      const amount = item.quantity * item.unitPrice;
      const itemTaxAmount = dto.reverseCharge ? 0 : (amount * itemTaxRate) / 100;

      return {
        description: item.description,
        quantity: new Decimal(item.quantity),
        unitPrice: new Decimal(item.unitPrice),
        amount: new Decimal(amount),
        taxRate: itemTaxRate,
        taxAmount: new Decimal(itemTaxAmount),
        productCode: item.productCode,
        unit: item.unit,
        sortOrder: item.sortOrder ?? index + 1,
      };
    });

    const invoice = await this.repository.create(invoiceData, itemsData);

    this.logger.log(
      `Created invoice ${invoice.number} for organisation ${orgId}`,
    );

    return invoice;
  }

  /**
   * Update invoice (only DRAFT invoices)
   */
  async update(id: string, dto: UpdateInvoiceDto) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot update invoice with status ${existing.status}. Only DRAFT invoices can be updated.`,
      );
    }

    const updateData: Prisma.InvoiceUpdateInput = {};

    // Update basic fields
    if (dto.customerName) updateData.customerName = dto.customerName;
    if (dto.customerEmail !== undefined)
      updateData.customerEmail = dto.customerEmail;
    if (dto.customerAddress !== undefined)
      updateData.customerAddress = dto.customerAddress;
    if (dto.customerVatId !== undefined)
      updateData.customerVatId = dto.customerVatId;
    if (dto.issueDate) updateData.issueDate = new Date(dto.issueDate);
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.paymentTerms !== undefined)
      updateData.paymentTerms = dto.paymentTerms;
    if (dto.paymentMethod !== undefined)
      updateData.paymentMethod = dto.paymentMethod;
    if (dto.bankReference !== undefined)
      updateData.bankReference = dto.bankReference;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.internalNotes !== undefined)
      updateData.internalNotes = dto.internalNotes;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata ?? undefined;

    // If items are being updated, recalculate totals
    let itemsData: any[] | undefined;
    if (dto.items) {
      if (dto.items.length === 0) {
        throw new BadRequestException('Invoice must have at least one item');
      }

      const { subtotal, taxAmount, totalAmount } = this.calculateTotals(
        dto.items,
        Number(existing.vatRate || 0),
      );

      updateData.subtotal = new Decimal(subtotal);
      updateData.taxAmount = new Decimal(taxAmount);
      updateData.totalAmount = new Decimal(totalAmount);

      itemsData = dto.items.map((item, index) => {
        const itemTaxRate = item.taxRate ?? Number(existing.vatRate) ?? 0;
        const amount = item.quantity * item.unitPrice;
        const itemTaxAmount = existing.reverseCharge
          ? 0
          : (amount * Number(itemTaxRate)) / 100;

        return {
          description: item.description,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          amount: new Decimal(amount),
          taxRate: itemTaxRate,
          taxAmount: new Decimal(itemTaxAmount),
          productCode: item.productCode,
          unit: item.unit,
          sortOrder: item.sortOrder ?? index + 1,
        };
      });
    }

    const invoice = await this.repository.updateWithItems(
      id,
      updateData,
      itemsData,
    );

    this.logger.log(`Updated invoice ${id}`);

    return invoice;
  }

  /**
   * Mark invoice as sent
   */
  async send(id: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot send invoice with status ${existing.status}`,
      );
    }

    const invoice = await this.repository.update(id, {
      status: InvoiceStatus.SENT,
    });

    this.logger.log(`Marked invoice ${id} as sent`);

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  async pay(id: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (
      existing.status !== InvoiceStatus.SENT &&
      existing.status !== InvoiceStatus.OVERDUE
    ) {
      throw new BadRequestException(
        `Cannot mark invoice with status ${existing.status} as paid`,
      );
    }

    const invoice = await this.repository.update(id, {
      status: InvoiceStatus.PAID,
      paidDate: new Date(),
    });

    this.logger.log(`Marked invoice ${id} as paid`);

    return invoice;
  }

  /**
   * Cancel invoice
   */
  async cancel(id: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existing.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    const invoice = await this.repository.update(id, {
      status: InvoiceStatus.CANCELLED,
    });

    this.logger.log(`Cancelled invoice ${id}`);

    return invoice;
  }

  /**
   * Delete invoice (only DRAFT invoices)
   */
  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot delete invoice with status ${existing.status}. Only DRAFT invoices can be deleted.`,
      );
    }

    await this.repository.delete(id);

    this.logger.log(`Deleted invoice ${id}`);
  }

  /**
   * Calculate invoice totals from items
   */
  private calculateTotals(
    items: Array<{ quantity: number; unitPrice: number; taxRate?: number }>,
    defaultTaxRate: number,
  ): { subtotal: number; taxAmount: number; totalAmount: number } {
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      const itemAmount = item.quantity * item.unitPrice;
      const itemTaxRate = item.taxRate ?? defaultTaxRate;
      const itemTaxAmount = (itemAmount * itemTaxRate) / 100;

      subtotal += itemAmount;
      taxAmount += itemTaxAmount;
    }

    const totalAmount = subtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }
}
