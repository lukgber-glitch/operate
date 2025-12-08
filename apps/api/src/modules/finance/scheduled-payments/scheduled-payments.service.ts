import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ScheduledPayment,
  ScheduledPaymentStatus,
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateScheduledPaymentDto } from './dto/create-scheduled-payment.dto';
import { UpdateScheduledPaymentDto } from './dto/update-scheduled-payment.dto';
import { ScheduledPaymentFilterDto } from './dto/scheduled-payment-filter.dto';

/**
 * Scheduled Payments Service
 * Business logic for scheduling and managing bill/invoice payments
 */
@Injectable()
export class ScheduledPaymentsService {
  private readonly logger = new Logger(ScheduledPaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all scheduled payments with pagination and filters
   */
  async findAll(organisationId: string, query: ScheduledPaymentFilterDto) {
    const {
      status,
      billId,
      invoiceId,
      bankAccountId,
      fromDate,
      toDate,
      paymentMethod,
      search,
      page = 1,
      pageSize = 20,
      sortBy = 'scheduledDate',
      sortOrder = 'asc',
    } = query;

    // Build where clause
    const where: Prisma.ScheduledPaymentWhereInput = {
      organisationId,
      ...(status && { status }),
      ...(billId && { billId }),
      ...(invoiceId && { invoiceId }),
      ...(bankAccountId && { bankAccountId }),
      ...(paymentMethod && { paymentMethod }),
      ...(search && {
        OR: [
          { reference: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Date range filter
    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) {
        where.scheduledDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.scheduledDate.lte = new Date(toDate);
      }
    }

    const skip = (page - 1) * pageSize;

    const [scheduledPayments, total] = await Promise.all([
      this.prisma.scheduledPayment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          bill: {
            select: {
              id: true,
              billNumber: true,
              vendorName: true,
              totalAmount: true,
              dueDate: true,
            },
          },
          bankAccount: {
            select: {
              id: true,
              name: true,
              accountNumber: true,
              iban: true,
            },
          },
        },
      }),
      this.prisma.scheduledPayment.count({ where }),
    ]);

    return {
      data: scheduledPayments,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Find scheduled payment by ID
   */
  async findById(id: string): Promise<ScheduledPayment> {
    const payment = await this.prisma.scheduledPayment.findUnique({
      where: { id },
      include: {
        bill: {
          select: {
            id: true,
            billNumber: true,
            vendorName: true,
            totalAmount: true,
            paidAmount: true,
            dueDate: true,
            status: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            iban: true,
            currency: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `Scheduled payment with ID ${id} not found`,
      );
    }

    return payment;
  }

  /**
   * Create new scheduled payment
   */
  async create(
    organisationId: string,
    dto: CreateScheduledPaymentDto,
  ): Promise<ScheduledPayment> {
    // Validate that at least one of billId or invoiceId is provided
    if (!dto.billId && !dto.invoiceId) {
      throw new BadRequestException(
        'Either billId or invoiceId must be provided',
      );
    }

    // Validate bill if billId is provided
    if (dto.billId) {
      const bill = await this.prisma.bill.findUnique({
        where: { id: dto.billId },
      });

      if (!bill) {
        throw new NotFoundException(`Bill with ID ${dto.billId} not found`);
      }

      if (bill.organisationId !== organisationId) {
        throw new BadRequestException('Bill does not belong to organisation');
      }

      // Check if bill is already paid
      if (bill.status === 'PAID') {
        throw new BadRequestException('Bill is already paid');
      }

      // Validate amount doesn't exceed remaining balance
      const remainingBalance =
        Number(bill.totalAmount) - Number(bill.paidAmount);
      if (dto.amount > remainingBalance) {
        throw new BadRequestException(
          `Payment amount ${dto.amount} exceeds remaining balance ${remainingBalance}`,
        );
      }
    }

    // Validate bank account if provided
    if (dto.bankAccountId) {
      const bankAccount = await this.prisma.bankAccount.findUnique({
        where: { id: dto.bankAccountId },
      });

      if (!bankAccount) {
        throw new NotFoundException(
          `Bank account with ID ${dto.bankAccountId} not found`,
        );
      }

      if (bankAccount.orgId !== organisationId) {
        throw new BadRequestException(
          'Bank account does not belong to organisation',
        );
      }
    }

    // Validate scheduled date is not in the past
    const scheduledDate = new Date(dto.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduledDate < today) {
      throw new BadRequestException('Scheduled date cannot be in the past');
    }

    const scheduledPayment = await this.prisma.scheduledPayment.create({
      data: {
        organisationId,
        billId: dto.billId,
        invoiceId: dto.invoiceId,
        amount: new Decimal(dto.amount),
        currency: dto.currency || 'EUR',
        scheduledDate,
        paymentMethod: dto.paymentMethod,
        bankAccountId: dto.bankAccountId,
        reference: dto.reference,
        notes: dto.notes,
        metadata: dto.metadata ?? undefined,
      },
      include: {
        bill: {
          select: {
            id: true,
            billNumber: true,
            vendorName: true,
            totalAmount: true,
            dueDate: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            name: true,
            iban: true,
          },
        },
      },
    });

    this.logger.log(
      `Created scheduled payment ${scheduledPayment.id} for organisation ${organisationId}`,
    );

    return scheduledPayment;
  }

  /**
   * Update scheduled payment
   */
  async update(
    id: string,
    dto: UpdateScheduledPaymentDto,
  ): Promise<ScheduledPayment> {
    const existing = await this.prisma.scheduledPayment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        `Scheduled payment with ID ${id} not found`,
      );
    }

    // Cannot update completed, failed, or cancelled payments
    if (
      existing.status === ScheduledPaymentStatus.COMPLETED ||
      existing.status === ScheduledPaymentStatus.FAILED ||
      existing.status === ScheduledPaymentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update payment with status ${existing.status}`,
      );
    }

    // Cannot update a payment that is currently processing
    if (existing.status === ScheduledPaymentStatus.PROCESSING) {
      throw new BadRequestException(
        'Cannot update payment that is currently processing',
      );
    }

    const updateData: Prisma.ScheduledPaymentUpdateInput = {};

    if (dto.amount !== undefined) updateData.amount = new Decimal(dto.amount);
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.scheduledDate !== undefined) {
      const scheduledDate = new Date(dto.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (scheduledDate < today) {
        throw new BadRequestException('Scheduled date cannot be in the past');
      }
      updateData.scheduledDate = scheduledDate;
    }
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.paymentMethod !== undefined)
      updateData.paymentMethod = dto.paymentMethod;
    if (dto.bankAccountId !== undefined) {
      updateData.bankAccount = dto.bankAccountId
        ? { connect: { id: dto.bankAccountId } }
        : { disconnect: true };
    }
    if (dto.reference !== undefined) updateData.reference = dto.reference;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.failureReason !== undefined)
      updateData.failureReason = dto.failureReason;
    if (dto.metadata !== undefined)
      updateData.metadata = dto.metadata ?? undefined;

    const scheduledPayment = await this.prisma.scheduledPayment.update({
      where: { id },
      data: updateData,
      include: {
        bill: {
          select: {
            id: true,
            billNumber: true,
            vendorName: true,
            totalAmount: true,
            dueDate: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            name: true,
            iban: true,
          },
        },
      },
    });

    this.logger.log(`Updated scheduled payment ${id}`);

    return scheduledPayment;
  }

  /**
   * Cancel scheduled payment
   */
  async cancel(id: string): Promise<void> {
    const existing = await this.prisma.scheduledPayment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        `Scheduled payment with ID ${id} not found`,
      );
    }

    // Cannot cancel completed payments
    if (existing.status === ScheduledPaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed payment');
    }

    // Cannot cancel already cancelled payments
    if (existing.status === ScheduledPaymentStatus.CANCELLED) {
      throw new BadRequestException('Payment is already cancelled');
    }

    // Cannot cancel payments that are currently processing
    if (existing.status === ScheduledPaymentStatus.PROCESSING) {
      throw new BadRequestException(
        'Cannot cancel payment that is currently processing',
      );
    }

    await this.prisma.scheduledPayment.update({
      where: { id },
      data: {
        status: ScheduledPaymentStatus.CANCELLED,
      },
    });

    this.logger.log(`Cancelled scheduled payment ${id}`);
  }

  /**
   * Delete scheduled payment (only PENDING or CANCELLED)
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.scheduledPayment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        `Scheduled payment with ID ${id} not found`,
      );
    }

    // Only allow deletion of PENDING or CANCELLED payments
    if (
      existing.status !== ScheduledPaymentStatus.PENDING &&
      existing.status !== ScheduledPaymentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot delete payment with status ${existing.status}. Only PENDING or CANCELLED payments can be deleted.`,
      );
    }

    await this.prisma.scheduledPayment.delete({
      where: { id },
    });

    this.logger.log(`Deleted scheduled payment ${id}`);
  }

  /**
   * Execute scheduled payment now (instead of waiting for scheduled date)
   */
  async execute(id: string): Promise<ScheduledPayment> {
    const payment = await this.prisma.scheduledPayment.findUnique({
      where: { id },
      include: {
        bill: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `Scheduled payment with ID ${id} not found`,
      );
    }

    // Can only execute PENDING payments
    if (payment.status !== ScheduledPaymentStatus.PENDING) {
      throw new BadRequestException(
        `Cannot execute payment with status ${payment.status}. Only PENDING payments can be executed.`,
      );
    }

    // Mark as processing
    await this.prisma.scheduledPayment.update({
      where: { id },
      data: {
        status: ScheduledPaymentStatus.PROCESSING,
      },
    });

    try {
      // TODO: In a real implementation, this would:
      // 1. Initiate the actual payment via banking API
      // 2. Wait for confirmation or use a webhook
      // 3. Record the payment on the bill
      // For now, we just mark it as completed and record the payment

      if (payment.billId && payment.bill) {
        // Record payment on bill
        await this.prisma.billPayment.create({
          data: {
            billId: payment.billId,
            amount: payment.amount,
            paymentDate: new Date(),
            paymentMethod: payment.paymentMethod || 'bank_transfer',
            reference: payment.reference,
            notes: payment.notes,
            metadata: {
              scheduledPaymentId: payment.id,
              executedManually: true,
            },
          },
        });

        // Update bill paid amount and status
        const newPaidAmount =
          Number(payment.bill.paidAmount) + Number(payment.amount);
        const totalAmount = Number(payment.bill.totalAmount);

        await this.prisma.bill.update({
          where: { id: payment.billId },
          data: {
            paidAmount: new Decimal(newPaidAmount),
            paymentStatus:
              newPaidAmount >= totalAmount ? 'COMPLETED' : 'PENDING',
            status: newPaidAmount >= totalAmount ? 'PAID' : payment.bill.status,
            paidDate: newPaidAmount >= totalAmount ? new Date() : null,
          },
        });
      }

      // Mark scheduled payment as completed
      const updatedPayment = await this.prisma.scheduledPayment.update({
        where: { id },
        data: {
          status: ScheduledPaymentStatus.COMPLETED,
          executedAt: new Date(),
        },
        include: {
          bill: {
            select: {
              id: true,
              billNumber: true,
              vendorName: true,
              totalAmount: true,
              paidAmount: true,
              status: true,
            },
          },
          bankAccount: {
            select: {
              id: true,
              name: true,
              iban: true,
            },
          },
        },
      });

      this.logger.log(`Executed scheduled payment ${id}`);

      return updatedPayment;
    } catch (error) {
      // Mark as failed if execution fails
      await this.prisma.scheduledPayment.update({
        where: { id },
        data: {
          status: ScheduledPaymentStatus.FAILED,
          failureReason: error.message || 'Unknown error during execution',
        },
      });

      this.logger.error(
        `Failed to execute scheduled payment ${id}: ${error.message}`,
      );

      throw new BadRequestException(
        `Failed to execute payment: ${error.message}`,
      );
    }
  }

  /**
   * Get payments due today
   */
  async getDueToday(organisationId: string): Promise<ScheduledPayment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.scheduledPayment.findMany({
      where: {
        organisationId,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        status: ScheduledPaymentStatus.PENDING,
      },
      include: {
        bill: {
          select: {
            id: true,
            billNumber: true,
            vendorName: true,
            totalAmount: true,
            dueDate: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            name: true,
            iban: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });
  }

  /**
   * Get upcoming payments (next N days)
   */
  async getUpcoming(
    organisationId: string,
    days: number = 7,
  ): Promise<ScheduledPayment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.scheduledPayment.findMany({
      where: {
        organisationId,
        scheduledDate: {
          gte: today,
          lte: futureDate,
        },
        status: ScheduledPaymentStatus.PENDING,
      },
      include: {
        bill: {
          select: {
            id: true,
            billNumber: true,
            vendorName: true,
            totalAmount: true,
            dueDate: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            name: true,
            iban: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });
  }
}
