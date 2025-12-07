import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Bill, Vendor, BillPayment, Prisma, BillStatus } from '@prisma/client';

/**
 * Bills Repository
 * Data access layer for bills and related entities
 */
@Injectable()
export class BillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all bills with filters
   */
  async findAll(params: {
    where?: Prisma.BillWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.BillOrderByWithRelationInput;
    include?: Prisma.BillInclude;
    select?: Prisma.BillSelect;
  }): Promise<Bill[]> {
    const { where, skip, take, orderBy, include, select } = params;

    return this.prisma.bill.findMany({
      where,
      skip,
      take,
      orderBy,
      include,
      select,
    });
  }

  /**
   * Count bills matching filters
   */
  async count(where?: Prisma.BillWhereInput): Promise<number> {
    return this.prisma.bill.count({ where });
  }

  /**
   * Find bill by ID
   */
  async findById(
    id: string,
    include?: Prisma.BillInclude,
  ): Promise<Bill | null> {
    return this.prisma.bill.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find vendor by ID
   */
  async findVendorById(id: string): Promise<Vendor | null> {
    return this.prisma.vendor.findUnique({
      where: { id },
    });
  }

  /**
   * Create new bill with line items in a transaction
   */
  async create(
    billData: Prisma.BillCreateInput,
    items: Prisma.BillLineItemCreateManyBillInput[],
  ): Promise<Bill> {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.create({
        data: billData,
      });

      // Create bill line items if provided
      if (items.length > 0) {
        await tx.billLineItem.createMany({
          data: items.map((item) => ({
            ...item,
            billId: bill.id,
          })),
        });
      }

      // Fetch complete bill with items and vendor
      return tx.bill.findUnique({
        where: { id: bill.id },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
          vendor: true,
        },
      }) as Promise<Bill>;
    });
  }

  /**
   * Update bill by ID
   */
  async update(id: string, data: Prisma.BillUpdateInput): Promise<Bill> {
    return this.prisma.bill.update({
      where: { id },
      data,
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        vendor: true,
      },
    });
  }

  /**
   * Update bill with line items in a transaction
   */
  async updateWithItems(
    id: string,
    billData: Prisma.BillUpdateInput,
    items?: Prisma.BillLineItemCreateManyBillInput[],
  ): Promise<Bill> {
    return this.prisma.$transaction(async (tx) => {
      // Update bill
      const bill = await tx.bill.update({
        where: { id },
        data: billData,
      });

      // If items are provided, replace all existing items
      if (items !== undefined) {
        // Delete existing items
        await tx.billLineItem.deleteMany({
          where: { billId: id },
        });

        // Create new items
        if (items.length > 0) {
          await tx.billLineItem.createMany({
            data: items.map((item) => ({
              ...item,
              billId: id,
            })),
          });
        }
      }

      // Fetch complete bill with items and vendor
      return tx.bill.findUnique({
        where: { id },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
          vendor: true,
        },
      }) as Promise<Bill>;
    });
  }

  /**
   * Delete bill by ID
   */
  async delete(id: string): Promise<Bill> {
    return this.prisma.$transaction(async (tx) => {
      // Delete bill line items first
      await tx.billLineItem.deleteMany({
        where: { billId: id },
      });

      // Delete bill payments
      await tx.billPayment.deleteMany({
        where: { billId: id },
      });

      // Delete bill
      return tx.bill.delete({
        where: { id },
      });
    });
  }

  /**
   * Create bill payment
   */
  async createPayment(
    paymentData: Prisma.BillPaymentCreateInput,
  ): Promise<BillPayment> {
    return this.prisma.billPayment.create({
      data: paymentData,
    });
  }

  /**
   * Get bill statistics by status
   */
  async getStatisticsByStatus(organisationId: string): Promise<
    Array<{
      status: BillStatus;
      count: number;
      totalAmount: number;
      paidAmount: number;
      outstandingAmount: number;
    }>
  > {
    const stats = await this.prisma.bill.groupBy({
      by: ['status'],
      where: {
        organisationId,
      },
      _count: {
        _all: true,
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    return stats.map((stat) => {
      const totalAmount = Number(stat._sum?.totalAmount || 0);
      const paidAmount = Number(stat._sum?.paidAmount || 0);
      return {
        status: stat.status,
        count: stat._count._all,
        totalAmount,
        paidAmount,
        outstandingAmount: totalAmount - paidAmount,
      };
    });
  }

  /**
   * Get overdue bills
   */
  async getOverdueBills(organisationId: string): Promise<Bill[]> {
    return this.prisma.bill.findMany({
      where: {
        organisationId,
        dueDate: {
          lt: new Date(),
        },
        paymentStatus: {
          not: 'COMPLETED',
        },
      },
      include: {
        vendor: true,
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  /**
   * Find bills by vendor ID
   */
  async findByVendor(
    vendorId: string,
    organisationId: string,
  ): Promise<Bill[]> {
    return this.prisma.bill.findMany({
      where: {
        vendorId,
        organisationId,
      },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }
}
