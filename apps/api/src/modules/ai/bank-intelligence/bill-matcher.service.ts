import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { Bill, BillStatus, BillSourceType, Vendor } from '@prisma/client';
import {
  BillMatchResult,
  BillMatch,
  OutgoingPaymentInput,
  BillMatchType,
  BillSuggestedAction,
  BillMatchCriteria,
  DEFAULT_BILL_MATCH_CRITERIA,
  RecurringPaymentInfo,
} from './types/bill-matching.types';
import { AmountMatcher } from './matchers/amount-matcher';
import { VendorMatcher } from './matchers/vendor-matcher';
import { ReferenceMatcher } from './matchers/reference-matcher';

/**
 * Bill Matcher Service
 * Auto-reconciles outgoing payments with vendor bills
 */
@Injectable()
export class BillMatcherService {
  private readonly logger = new Logger(BillMatcherService.name);
  private readonly amountMatcher: AmountMatcher;
  private readonly vendorMatcher: VendorMatcher;
  private readonly referenceMatcher: ReferenceMatcher;
  private readonly criteria: BillMatchCriteria;

  constructor(private readonly prisma: PrismaService) {
    this.criteria = DEFAULT_BILL_MATCH_CRITERIA;
    this.amountMatcher = new AmountMatcher({
      amountTolerance: this.criteria.amountTolerance,
      minAmountToleranceEuro: this.criteria.minAmountToleranceEuro,
      maxInvoiceAgeDays: this.criteria.maxBillAgeDays,
      minConfidenceForAutoMatch: this.criteria.minConfidenceForAutoMatch,
      fuzzyMatchThreshold: this.criteria.fuzzyMatchThreshold,
    });
    this.vendorMatcher = new VendorMatcher(this.criteria.fuzzyMatchThreshold);
    this.referenceMatcher = new ReferenceMatcher();
  }

  /**
   * Match an outgoing payment to bill(s)
   */
  async matchPaymentToBill(
    payment: OutgoingPaymentInput,
    orgId: string,
  ): Promise<BillMatchResult> {
    this.logger.log(
      `Matching outgoing payment: €${payment.amount} to "${payment.counterparty}" - ${payment.description}`,
    );

    try {
      // Step 1: Find potential bill matches
      const potentialMatches = await this.findPotentialBillMatches(payment, orgId);

      if (potentialMatches.length === 0) {
        this.logger.log('No potential bill matches found');

        // Check if we can detect recurring payment
        const recurringInfo = await this.detectRecurringPayment(payment, orgId);

        return {
          matched: false,
          matchType: BillMatchType.NONE,
          confidence: 0,
          suggestedAction: BillSuggestedAction.CREATE_BILL,
          matchReasons: [
            'No open bills found matching criteria',
            recurringInfo.isRecurring
              ? `Possible recurring payment (${recurringInfo.frequency})`
              : 'Not identified as recurring payment',
          ],
        };
      }

      // Step 2: Sort matches by confidence
      const sortedMatches = potentialMatches.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = sortedMatches[0];

      this.logger.log(
        `Best match: Bill ${bestMatch.bill.billNumber || bestMatch.bill.id} (${bestMatch.confidence}% confidence)`,
      );

      // Step 3: Check if we should auto-reconcile
      const shouldAutoReconcile =
        bestMatch.matchType === BillMatchType.EXACT &&
        bestMatch.confidence >= this.criteria.minConfidenceForAutoMatch;

      // Step 4: Check for multi-bill match (overpayment scenario)
      if (
        bestMatch.matchType === BillMatchType.EXACT &&
        bestMatch.confidence < 90 &&
        payment.amount > Number(bestMatch.bill.totalAmount)
      ) {
        const multiMatch = await this.checkMultiBillMatch(payment, sortedMatches, orgId);
        if (multiMatch) {
          return multiMatch;
        }
      }

      return {
        matched: bestMatch.confidence > 50,
        matchType: bestMatch.matchType,
        bill: bestMatch.bill,
        confidence: bestMatch.confidence,
        suggestedAction: shouldAutoReconcile
          ? BillSuggestedAction.AUTO_RECONCILE
          : bestMatch.suggestedAction,
        matchReasons: bestMatch.matchReasons,
        amountRemaining:
          bestMatch.matchType === BillMatchType.PARTIAL ? bestMatch.amountDifference : undefined,
      };
    } catch (error) {
      this.logger.error(`Error matching payment to bill: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find potential bill matches for a payment
   */
  async findPotentialBillMatches(
    payment: OutgoingPaymentInput,
    orgId: string,
  ): Promise<BillMatch[]> {
    // Get open bills (PENDING, APPROVED, or OVERDUE - not PAID, CANCELLED, or DRAFT)
    const maxAge = new Date();
    maxAge.setDate(maxAge.getDate() - this.criteria.maxBillAgeDays);

    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + this.criteria.maxDueDateFutureDays);

    const openBills = await this.prisma.bill.findMany({
      where: {
        organisationId: orgId,
        status: {
          in: [BillStatus.PENDING, BillStatus.APPROVED, BillStatus.OVERDUE],
        },
        issueDate: {
          gte: maxAge,
        },
        dueDate: {
          lte: maxFutureDate,
        },
      },
      include: {
        vendor: true,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    this.logger.log(`Found ${openBills.length} open bills to check`);

    if (openBills.length === 0) {
      return [];
    }

    // Score each bill
    const matches: BillMatch[] = [];

    for (const bill of openBills) {
      const match = this.scoreBillMatch(bill, payment);
      if (match.confidence > 30) {
        // Only include reasonable matches
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Score how well a bill matches a payment
   */
  private scoreBillMatch(
    bill: Bill & { vendor?: Vendor | null },
    payment: OutgoingPaymentInput,
  ): BillMatch {
    const matchReasons: string[] = [];
    let totalConfidence = 0;
    let weightSum = 0;

    // 1. Amount matching (weight: 40%)
    const amountMatch = this.amountMatcher.matchAmount(
      payment.amount,
      Number(bill.totalAmount),
    );
    totalConfidence += amountMatch.confidence * 0.4;
    weightSum += 0.4;
    if (amountMatch.matches) {
      matchReasons.push(amountMatch.reason);
    }

    // 2. Vendor name matching (weight: 35%)
    if (payment.counterparty && bill.vendorName) {
      const vendorMatch = this.vendorMatcher.matchVendors(payment.counterparty, bill.vendorName);
      if (vendorMatch.matches) {
        totalConfidence += vendorMatch.confidence * 0.35;
        weightSum += 0.35;
        matchReasons.push(vendorMatch.reason);
      }
    }

    // 3. Bill reference matching (weight: 20%)
    if (bill.billNumber) {
      const refMatch = this.referenceMatcher.matchInvoiceNumber(
        bill.billNumber,
        payment.description || '',
      );
      if (refMatch.matches) {
        totalConfidence += refMatch.confidence * 0.2;
        weightSum += 0.2;
        matchReasons.push(refMatch.reason);
      }
    }

    // 4. Date proximity (weight: 5%)
    const daysSinceIssue = Math.floor(
      (payment.date.getTime() - bill.issueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysToDue = Math.floor(
      (bill.dueDate.getTime() - payment.date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceIssue >= 0 && daysToDue >= -30 && daysToDue <= 30) {
      // Payment within 30 days of due date
      const dateConfidence = Math.max(100 - Math.abs(daysToDue), 50);
      totalConfidence += dateConfidence * 0.05;
      weightSum += 0.05;
      matchReasons.push(
        `Payment ${daysToDue >= 0 ? `${daysToDue} days before` : `${Math.abs(daysToDue)} days after`} due date`,
      );
    }

    // Normalize confidence
    const finalConfidence = weightSum > 0 ? Math.round(totalConfidence / weightSum) : 0;

    // Determine match type
    let matchType: BillMatchType;
    if (amountMatch.matchType === 'EXACT' && finalConfidence >= 90) {
      matchType = BillMatchType.EXACT;
    } else if (amountMatch.matchType === 'PARTIAL') {
      matchType = BillMatchType.PARTIAL;
    } else if (finalConfidence >= 70) {
      matchType = BillMatchType.PROBABLE;
    } else {
      matchType = BillMatchType.NONE;
    }

    // Determine suggested action
    let suggestedAction: BillSuggestedAction;
    if (
      matchType === BillMatchType.EXACT &&
      finalConfidence >= this.criteria.minConfidenceForAutoMatch
    ) {
      suggestedAction = BillSuggestedAction.AUTO_RECONCILE;
    } else if (matchType === BillMatchType.PARTIAL) {
      suggestedAction = BillSuggestedAction.PARTIAL_PAYMENT;
    } else {
      suggestedAction = BillSuggestedAction.REVIEW;
    }

    return {
      bill,
      matchType,
      confidence: finalConfidence,
      matchReasons,
      suggestedAction,
      amountDifference: amountMatch.difference,
    };
  }

  /**
   * Check if payment matches multiple bills (overpayment scenario)
   */
  private async checkMultiBillMatch(
    payment: OutgoingPaymentInput,
    sortedMatches: BillMatch[],
    orgId: string,
  ): Promise<BillMatchResult | null> {
    const billAmounts = sortedMatches.map((m) => Number(m.bill.totalAmount));
    const multiMatch = this.amountMatcher.matchMultipleInvoices(payment.amount, billAmounts);

    if (multiMatch.matches && multiMatch.invoiceIndices.length > 1) {
      const matchedBills = multiMatch.invoiceIndices.map((i) => sortedMatches[i].bill);

      this.logger.log(
        `Multi-bill match: ${matchedBills.length} bills totaling €${multiMatch.totalAmount}`,
      );

      return {
        matched: true,
        matchType: BillMatchType.EXACT,
        bills: matchedBills,
        confidence: multiMatch.confidence,
        suggestedAction: BillSuggestedAction.MULTI_BILL,
        matchReasons: [
          `Payment matches ${matchedBills.length} bills`,
          `Total: €${multiMatch.totalAmount}, Difference: €${multiMatch.difference}`,
        ],
        amountRemaining: multiMatch.difference,
      };
    }

    return null;
  }

  /**
   * Auto-reconcile a payment with a bill
   */
  async autoReconcileBill(
    transactionId: string,
    billId: string,
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Auto-reconciling transaction ${transactionId} with bill ${billId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        const bill = await tx.bill.findUnique({
          where: { id: billId },
        });

        if (!bill) {
          throw new Error(`Bill ${billId} not found`);
        }

        // Update bill status to PAID
        await tx.bill.update({
          where: { id: billId },
          data: {
            status: BillStatus.PAID,
            paidAmount: bill.totalAmount,
            paidDate: new Date(),
          },
        });

        // TODO: Create reconciliation record if you have this model
        // await tx.reconciliation.create({
        //   data: {
        //     transactionId,
        //     billId,
        //     amount: Number(bill.totalAmount),
        //     reconciledAt: new Date(),
        //     reconciledBy: userId,
        //   },
        // });

        this.logger.log(`Successfully reconciled bill ${billId}`);
      });
    } catch (error) {
      this.logger.error(`Error auto-reconciling bill: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Record a partial payment for a bill
   */
  async recordPartialBillPayment(
    transactionId: string,
    billId: string,
    amount: number,
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Recording partial payment of €${amount} for bill ${billId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        const bill = await tx.bill.findUnique({
          where: { id: billId },
        });

        if (!bill) {
          throw new Error(`Bill ${billId} not found`);
        }

        const newPaidAmount = Number(bill.paidAmount) + amount;
        const remaining = Number(bill.totalAmount) - newPaidAmount;

        // Update bill
        if (remaining <= 0) {
          // Fully paid
          await tx.bill.update({
            where: { id: billId },
            data: {
              status: BillStatus.PAID,
              paidAmount: bill.totalAmount,
              paidDate: new Date(),
            },
          });
        } else {
          // Partially paid - keep status as PENDING or APPROVED
          await tx.bill.update({
            where: { id: billId },
            data: {
              paidAmount: newPaidAmount,
            },
          });
        }

        // TODO: Create partial payment record if you have this model
        // await tx.partialPayment.create({...});

        this.logger.log(`Partial payment recorded: €${amount}, remaining: €${remaining}`);
      });
    } catch (error) {
      this.logger.error(`Error recording partial bill payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a bill from an unmatched payment
   */
  async createBillFromPayment(
    payment: OutgoingPaymentInput,
    vendorId: string,
    orgId: string,
    userId?: string,
  ): Promise<Bill> {
    this.logger.log(`Creating bill from payment: €${payment.amount} to vendor ${vendorId}`);

    try {
      // Get vendor info
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId },
      });

      if (!vendor) {
        throw new Error(`Vendor ${vendorId} not found`);
      }

      // Extract bill number from payment description if possible
      const refExtraction = this.referenceMatcher.extractReferences(payment.description);
      const billNumber = refExtraction.found ? refExtraction.references[0] : undefined;

      // Create bill
      const bill = await this.prisma.bill.create({
        data: {
          organisationId: orgId,
          vendorId: vendor.id,
          vendorName: vendor.name,
          billNumber: billNumber,
          description: payment.description || `Payment to ${vendor.name}`,
          amount: payment.amount,
          currency: 'EUR',
          taxAmount: 0,
          totalAmount: payment.amount,
          paidAmount: payment.amount,
          status: BillStatus.PAID,
          issueDate: payment.date,
          dueDate: payment.date,
          paidDate: payment.date,
          sourceType: BillSourceType.API_IMPORT, // Created from bank transaction
        },
      });

      this.logger.log(`Created bill ${bill.id} from payment`);

      return bill;
    } catch (error) {
      this.logger.error(`Error creating bill from payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Detect if a payment is recurring (e.g., monthly AWS bills)
   */
  async detectRecurringPayment(
    payment: OutgoingPaymentInput,
    orgId: string,
  ): Promise<RecurringPaymentInfo> {
    try {
      if (!payment.counterparty) {
        return { isRecurring: false, confidence: 0 };
      }

      // Look for similar payments in the past 12 months
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Find vendors that match the counterparty
      const vendors = await this.prisma.vendor.findMany({
        where: {
          organisationId: orgId,
          name: {
            contains: payment.counterparty,
            mode: 'insensitive',
          },
        },
      });

      if (vendors.length === 0) {
        return { isRecurring: false, confidence: 0 };
      }

      const vendorIds = vendors.map((v) => v.id);

      // Get bills from these vendors
      const historicalBills = await this.prisma.bill.findMany({
        where: {
          organisationId: orgId,
          vendorId: {
            in: vendorIds,
          },
          status: BillStatus.PAID,
          paidDate: {
            gte: oneYearAgo,
            lt: payment.date,
          },
        },
        orderBy: {
          paidDate: 'desc',
        },
        take: 12,
      });

      if (historicalBills.length < 2) {
        return {
          isRecurring: false,
          confidence: 0,
          vendorId: vendors[0]?.id,
          vendorName: vendors[0]?.name,
        };
      }

      // Calculate intervals between payments
      const intervals: number[] = [];
      for (let i = 1; i < historicalBills.length; i++) {
        const days = Math.floor(
          (historicalBills[i - 1].paidDate!.getTime() - historicalBills[i].paidDate!.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        intervals.push(days);
      }

      // Calculate average interval
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // Determine frequency
      let frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | undefined;
      let confidence = 0;

      if (avgInterval >= 25 && avgInterval <= 35) {
        // ~30 days
        frequency = 'MONTHLY';
        confidence = 85;
      } else if (avgInterval >= 80 && avgInterval <= 100) {
        // ~90 days
        frequency = 'QUARTERLY';
        confidence = 80;
      } else if (avgInterval >= 350 && avgInterval <= 380) {
        // ~365 days
        frequency = 'YEARLY';
        confidence = 80;
      }

      // Calculate average amount
      const amounts = historicalBills.map((b) => Number(b.totalAmount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

      // Check amount consistency
      const amountVariance = Math.max(...amounts) - Math.min(...amounts);
      const amountVariancePercent = (amountVariance / avgAmount) * 100;

      // Reduce confidence if amounts vary too much
      if (amountVariancePercent > 20) {
        confidence -= 20;
      }

      // Check if current payment amount is consistent
      const currentAmountDiff = Math.abs(payment.amount - avgAmount);
      const currentAmountDiffPercent = (currentAmountDiff / avgAmount) * 100;

      if (currentAmountDiffPercent > 20) {
        confidence -= 15;
      }

      const isRecurring = confidence >= 60 && frequency !== undefined;

      // Predict next payment date
      let predictedNextDate: Date | undefined;
      if (isRecurring && frequency) {
        predictedNextDate = new Date(payment.date);
        switch (frequency) {
          case 'MONTHLY':
            predictedNextDate.setMonth(predictedNextDate.getMonth() + 1);
            break;
          case 'QUARTERLY':
            predictedNextDate.setMonth(predictedNextDate.getMonth() + 3);
            break;
          case 'YEARLY':
            predictedNextDate.setFullYear(predictedNextDate.getFullYear() + 1);
            break;
        }
      }

      return {
        isRecurring,
        confidence,
        frequency,
        vendorId: vendors[0]?.id,
        vendorName: vendors[0]?.name,
        averageAmount: avgAmount,
        lastPaymentDate: historicalBills[0]?.paidDate || undefined,
        predictedNextDate,
      };
    } catch (error) {
      this.logger.error(`Error detecting recurring payment: ${error.message}`, error.stack);
      return { isRecurring: false, confidence: 0 };
    }
  }
}
