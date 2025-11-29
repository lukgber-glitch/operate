import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Invoice, InvoiceItem, Prisma, InvoiceStatus } from '@prisma/client';

/**
 * Invoices Repository
 * Handles all database operations for Invoice entity
 */
@Injectable()
export class InvoicesRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all invoices for an organisation with filters
   */
  async findAll(params: {
    where?: Prisma.InvoiceWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.InvoiceOrderByWithRelationInput;
    include?: Prisma.InvoiceInclude;
  }): Promise<Invoice[]> {
    const { where, skip, take, orderBy, include } = params;

    return this.prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy,
      include,
    });
  }

  /**
   * Count invoices matching filters
   */
  async count(where?: Prisma.InvoiceWhereInput): Promise<number> {
    return this.prisma.invoice.count({ where });
  }

  /**
   * Find invoice by ID
   */
  async findById(
    id: string,
    include?: Prisma.InvoiceInclude,
  ): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find invoice by number within organisation
   */
  async findByNumber(
    orgId: string,
    number: string,
  ): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: {
        orgId_number: {
          orgId,
          number,
        },
      },
    });
  }

  /**
   * Create new invoice with items in a transaction
   */
  async create(
    invoiceData: Prisma.InvoiceCreateInput,
    items: Prisma.InvoiceItemCreateManyInvoiceInput[],
  ): Promise<Invoice> {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: invoiceData,
      });

      // Create invoice items
      if (items.length > 0) {
        await tx.invoiceItem.createMany({
          data: items.map((item) => ({
            ...item,
            invoiceId: invoice.id,
          })),
        });
      }

      // Fetch complete invoice with items
      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { items: true },
      }) as Promise<Invoice>;
    });
  }

  /**
   * Update invoice by ID
   */
  async update(
    id: string,
    data: Prisma.InvoiceUpdateInput,
  ): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Update invoice with items in a transaction
   */
  async updateWithItems(
    id: string,
    invoiceData: Prisma.InvoiceUpdateInput,
    items?: Prisma.InvoiceItemCreateManyInvoiceInput[],
  ): Promise<Invoice> {
    return this.prisma.$transaction(async (tx) => {
      // Update invoice
      const invoice = await tx.invoice.update({
        where: { id },
        data: invoiceData,
      });

      // If items are provided, replace all existing items
      if (items !== undefined) {
        // Delete existing items
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        // Create new items
        if (items.length > 0) {
          await tx.invoiceItem.createMany({
            data: items.map((item) => ({
              ...item,
              invoiceId: id,
            })),
          });
        }
      }

      // Fetch complete invoice with items
      return tx.invoice.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }) as Promise<Invoice>;
    });
  }

  /**
   * Delete invoice by ID (only draft invoices)
   */
  async delete(id: string): Promise<Invoice> {
    return this.prisma.$transaction(async (tx) => {
      // Delete invoice items first
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Delete invoice
      return tx.invoice.delete({
        where: { id },
      });
    });
  }

  /**
   * Get next invoice number for organisation
   */
  async getNextInvoiceNumber(orgId: string, year: number): Promise<string> {
    // Get the latest invoice number for this year
    const latestInvoice = await this.prisma.invoice.findFirst({
      where: {
        orgId,
        number: {
          startsWith: `INV-${year}-`,
        },
      },
      orderBy: {
        number: 'desc',
      },
    });

    if (!latestInvoice) {
      return `INV-${year}-001`;
    }

    // Extract number from format INV-YYYY-NNN
    const parts = latestInvoice.number.split('-');
    const lastNumber = parseInt(parts[2] || '0', 10);
    const nextNumber = lastNumber + 1;

    return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Get invoice statistics by status
   */
  async getStatisticsByStatus(orgId: string): Promise<
    Array<{
      status: InvoiceStatus;
      count: number;
      totalAmount: number;
    }>
  > {
    const stats = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: {
        orgId,
      },
      _count: {
        _all: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    return stats.map((stat) => ({
      status: stat.status,
      count: stat._count._all,
      totalAmount: Number(stat._sum?.totalAmount || 0),
    }));
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(orgId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        orgId,
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
        },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  /**
   * Check if invoice number exists in organisation
   */
  async numberExists(
    orgId: string,
    number: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.invoice.count({
      where: {
        orgId,
        number,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }
}
