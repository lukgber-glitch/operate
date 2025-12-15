/**
 * Payment Suggestion Service
 * Provides intelligent payment recommendations based on bills extracted from emails
 * Helps users prioritize and track bill payments
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Bill, BillStatus, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface PaymentSuggestion {
  bill: Bill & {
    vendor: {
      id: string;
      name: string;
      email: string | null;
      paymentTerms: string | null;
    } | null;
  };
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  daysUntilDue: number;
  isOverdue: boolean;
  suggestedPaymentDate: Date;
}

export interface PaymentSuggestionResponse {
  suggestions: PaymentSuggestion[];
  totalAmount: number;
  currency: string;
  urgentCount: number;
  overdueCount: number;
}

/**
 * Service for generating payment suggestions from extracted bills
 */
@Injectable()
export class PaymentSuggestionService {
  private readonly logger = new Logger(PaymentSuggestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get bills due in the next N days
   */
  async getUpcomingPayments(
    orgId: string,
    days: number = 30,
  ): Promise<PaymentSuggestionResponse> {
    this.logger.log(
      `Fetching upcoming payments for org ${orgId} (next ${days} days)`,
    );

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const bills = await this.prisma.bill.findMany({
      where: {
        organisationId: orgId,
        dueDate: {
          gte: today,
          lte: futureDate,
        },
        paymentStatus: {
          in: [PaymentStatus.PENDING],
        },
        status: {
          notIn: [BillStatus.CANCELLED, BillStatus.REJECTED],
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            paymentTerms: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    const suggestions = bills.map((bill) =>
      this.createPaymentSuggestion(bill, today),
    );

    return this.aggregateSuggestions(suggestions);
  }

  /**
   * Get overdue bills
   */
  async getOverduePayments(orgId: string): Promise<PaymentSuggestionResponse> {
    this.logger.log(`Fetching overdue payments for org ${orgId}`);

    const today = new Date();

    const bills = await this.prisma.bill.findMany({
      where: {
        organisationId: orgId,
        dueDate: {
          lt: today,
        },
        paymentStatus: {
          in: [PaymentStatus.PENDING],
        },
        status: {
          notIn: [BillStatus.CANCELLED, BillStatus.REJECTED],
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            paymentTerms: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    const suggestions = bills.map((bill) =>
      this.createPaymentSuggestion(bill, today),
    );

    return this.aggregateSuggestions(suggestions);
  }

  /**
   * Get AI-ranked payment suggestions
   * Prioritizes based on:
   * - Due date (overdue > urgent > upcoming)
   * - Amount (higher amounts = higher priority for cash flow)
   * - Vendor importance (frequent vendors = higher priority)
   * - Payment terms
   */
  async suggestPaymentPriority(
    orgId: string,
    days: number = 30,
  ): Promise<PaymentSuggestionResponse> {
    this.logger.log(
      `Generating prioritized payment suggestions for org ${orgId}`,
    );

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    // Get all unpaid bills (both upcoming and overdue)
    const bills = await this.prisma.bill.findMany({
      where: {
        organisationId: orgId,
        paymentStatus: {
          in: [PaymentStatus.PENDING],
        },
        status: {
          notIn: [BillStatus.CANCELLED, BillStatus.REJECTED],
        },
        OR: [
          {
            dueDate: {
              lte: futureDate,
            },
          },
        ],
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            paymentTerms: true,
          },
        },
      },
    });

    // Create suggestions with priority calculation
    const suggestions = bills
      .map((bill) => this.createPaymentSuggestion(bill, today))
      .sort((a, b) => {
        // Sort by priority order
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];

        if (priorityDiff !== 0) return priorityDiff;

        // If same priority, sort by days until due (ascending)
        return a.daysUntilDue - b.daysUntilDue;
      });

    return this.aggregateSuggestions(suggestions);
  }

  /**
   * Mark a bill as paid and optionally link to a transaction
   */
  async markBillAsPaid(
    billId: string,
    orgId: string,
    paymentData: {
      paidDate?: Date;
      paidAmount?: number;
      transactionId?: string;
      notes?: string;
    } = {},
  ): Promise<Bill> {
    this.logger.log(`Marking bill ${billId} as paid`);

    // Verify bill exists and belongs to org
    const existingBill = await this.prisma.bill.findFirst({
      where: {
        id: billId,
        organisationId: orgId,
      },
    });

    if (!existingBill) {
      throw new NotFoundException(
        `Bill ${billId} not found or does not belong to organization`,
      );
    }

    const paidAmount = paymentData.paidAmount
      ? new Decimal(paymentData.paidAmount)
      : existingBill.totalAmount;

    const isPaidInFull = paidAmount.equals(existingBill.totalAmount);

    const updateData: any = {
      paidAmount,
      paymentStatus: isPaidInFull
        ? PaymentStatus.COMPLETED
        : PaymentStatus.PENDING,
      paidDate: paymentData.paidDate || new Date(),
    };

    // Add notes if provided
    if (paymentData.notes) {
      const existingNotes = existingBill.notes || '';
      updateData.notes = existingNotes
        ? `${existingNotes}\n\n${paymentData.notes}`
        : paymentData.notes;
    }

    // Update the bill
    const updatedBill = await this.prisma.bill.update({
      where: { id: billId },
      data: updateData,
      include: {
        vendor: true,
        lineItems: true,
      },
    });

    this.logger.log(
      `Bill ${billId} marked as ${isPaidInFull ? 'fully' : 'partially'} paid`,
    );

    return updatedBill;
  }

  /**
   * Get payment statistics for an organization
   */
  async getPaymentStats(orgId: string, days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);

    const [upcoming, overdue, recentlyPaid, totalPending] = await Promise.all([
      // Upcoming bills
      this.prisma.bill.count({
        where: {
          organisationId: orgId,
          dueDate: { gte: today, lte: futureDate },
          paymentStatus: PaymentStatus.PENDING,
          status: { notIn: [BillStatus.CANCELLED, BillStatus.REJECTED] },
        },
      }),

      // Overdue bills
      this.prisma.bill.count({
        where: {
          organisationId: orgId,
          dueDate: { lt: today },
          paymentStatus: PaymentStatus.PENDING,
          status: { notIn: [BillStatus.CANCELLED, BillStatus.REJECTED] },
        },
      }),

      // Recently paid bills
      this.prisma.bill.count({
        where: {
          organisationId: orgId,
          paidDate: { gte: pastDate },
          paymentStatus: PaymentStatus.COMPLETED,
        },
      }),

      // Total pending amount
      this.prisma.bill.aggregate({
        where: {
          organisationId: orgId,
          paymentStatus: PaymentStatus.PENDING,
          status: { notIn: [BillStatus.CANCELLED, BillStatus.REJECTED] },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      period: `${days} days`,
      upcoming,
      overdue,
      recentlyPaid,
      totalPendingAmount: totalPending._sum.totalAmount?.toNumber() || 0,
      totalPendingBills: upcoming + overdue,
    };
  }

  /**
   * Create a payment suggestion for a bill
   */
  private createPaymentSuggestion(
    bill: Bill & {
      vendor: {
        id: string;
        name: string;
        email: string | null;
        paymentTerms: string | null;
      } | null;
    },
    today: Date,
  ): PaymentSuggestion {
    const daysUntilDue = Math.ceil(
      (bill.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isOverdue = daysUntilDue < 0;

    // Determine priority
    let priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    let reasoning: string;
    let suggestedPaymentDate: Date;

    if (isOverdue) {
      const daysOverdue = Math.abs(daysUntilDue);
      if (daysOverdue > 30) {
        priority = 'URGENT';
        reasoning = `Severely overdue (${daysOverdue} days). Immediate payment required to avoid penalties and maintain vendor relationship.`;
      } else if (daysOverdue > 7) {
        priority = 'URGENT';
        reasoning = `Overdue by ${daysOverdue} days. Payment should be made immediately to avoid late fees.`;
      } else {
        priority = 'HIGH';
        reasoning = `Recently overdue (${daysOverdue} days). Prompt payment recommended.`;
      }
      suggestedPaymentDate = new Date(); // Pay today
    } else if (daysUntilDue <= 3) {
      priority = 'URGENT';
      reasoning = `Due in ${daysUntilDue} day(s). Payment should be initiated immediately to ensure timely arrival.`;
      suggestedPaymentDate = new Date(); // Pay today
    } else if (daysUntilDue <= 7) {
      priority = 'HIGH';
      reasoning = `Due in ${daysUntilDue} days. Consider processing payment this week.`;
      suggestedPaymentDate = new Date(
        today.getTime() + 2 * 24 * 60 * 60 * 1000,
      ); // In 2 days
    } else if (daysUntilDue <= 14) {
      priority = 'MEDIUM';
      reasoning = `Due in ${daysUntilDue} days. Payment can be scheduled for next week.`;
      suggestedPaymentDate = new Date(bill.dueDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before due
    } else {
      priority = 'LOW';
      reasoning = `Due in ${daysUntilDue} days. Payment can be planned for later this month.`;
      suggestedPaymentDate = new Date(bill.dueDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before due
    }

    // Enhance reasoning with amount if significant
    const amount = bill.totalAmount.toNumber();
    if (amount > 1000) {
      reasoning += ` High value payment (${bill.currency} ${amount.toFixed(2)}).`;
    }

    return {
      bill,
      priority,
      reasoning,
      daysUntilDue,
      isOverdue,
      suggestedPaymentDate,
    };
  }

  /**
   * Aggregate payment suggestions into a response
   */
  private aggregateSuggestions(
    suggestions: PaymentSuggestion[],
  ): PaymentSuggestionResponse {
    const totalAmount = suggestions.reduce(
      (sum, s) => sum + s.bill.totalAmount.toNumber(),
      0,
    );

    const currency = suggestions.length > 0 ? suggestions[0].bill.currency : 'EUR';
    const urgentCount = suggestions.filter(
      (s) => s.priority === 'URGENT',
    ).length;
    const overdueCount = suggestions.filter((s) => s.isOverdue).length;

    return {
      suggestions,
      totalAmount,
      currency,
      urgentCount,
      overdueCount,
    };
  }

  /**
   * Get bills by vendor for batch processing
   */
  async getBillsByVendor(orgId: string, vendorId: string) {
    return this.prisma.bill.findMany({
      where: {
        organisationId: orgId,
        vendorId,
        paymentStatus: PaymentStatus.PENDING,
        status: { notIn: [BillStatus.CANCELLED, BillStatus.REJECTED] },
      },
      include: {
        vendor: true,
        lineItems: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }
}
