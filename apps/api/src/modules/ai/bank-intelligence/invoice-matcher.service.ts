import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { Invoice, InvoiceStatus } from '@prisma/client';
import {
  MatchResult,
  InvoiceMatch,
  PaymentInput,
  MatchType,
  SuggestedAction,
  MatchCriteria,
  DEFAULT_MATCH_CRITERIA,
} from './types/invoice-matching.types';
import { AmountMatcher } from './matchers/amount-matcher';
import { NameMatcher } from './matchers/name-matcher';
import { ReferenceMatcher } from './matchers/reference-matcher';

/**
 * Invoice Matcher Service
 * Auto-reconciles incoming payments with sent invoices
 */
@Injectable()
export class InvoiceMatcherService {
  private readonly logger = new Logger(InvoiceMatcherService.name);
  private readonly amountMatcher: AmountMatcher;
  private readonly nameMatcher: NameMatcher;
  private readonly referenceMatcher: ReferenceMatcher;
  private readonly criteria: MatchCriteria;

  constructor(private readonly prisma: PrismaService) {
    this.criteria = DEFAULT_MATCH_CRITERIA;
    this.amountMatcher = new AmountMatcher(this.criteria);
    this.nameMatcher = new NameMatcher(this.criteria.fuzzyMatchThreshold);
    this.referenceMatcher = new ReferenceMatcher();
  }

  /**
   * Match an incoming payment to invoice(s)
   */
  async matchPaymentToInvoice(payment: PaymentInput, orgId: string): Promise<MatchResult> {
    this.logger.log(
      `Matching payment: €${payment.amount} from "${payment.counterparty}" - ${payment.description}`,
    );

    try {
      // Step 1: Find potential invoice matches
      const potentialMatches = await this.findPotentialMatches(payment, orgId);

      if (potentialMatches.length === 0) {
        this.logger.log('No potential matches found');
        return {
          matched: false,
          matchType: MatchType.NONE,
          confidence: 0,
          suggestedAction: SuggestedAction.CREATE_CUSTOMER,
          matchReasons: ['No open invoices found matching criteria'],
        };
      }

      // Step 2: Sort matches by confidence
      const sortedMatches = potentialMatches.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = sortedMatches[0];

      if (!bestMatch) {
        return {
          matched: false,
          matchType: MatchType.NONE,
          confidence: 0,
          suggestedAction: SuggestedAction.CREATE_CUSTOMER,
          matchReasons: ['No matches found after scoring'],
        };
      }

      this.logger.log(
        `Best match: Invoice ${bestMatch.invoice.number} (${bestMatch.confidence}% confidence)`,
      );

      // Step 3: Check if we should auto-reconcile
      const shouldAutoReconcile =
        bestMatch.matchType === MatchType.EXACT &&
        bestMatch.confidence >= this.criteria.minConfidenceForAutoMatch;

      // Step 4: Check for multi-invoice match (overpayment scenario)
      if (
        bestMatch.matchType === MatchType.EXACT &&
        bestMatch.confidence < 90 &&
        payment.amount > Number(bestMatch.invoice.totalAmount)
      ) {
        const multiMatch = await this.checkMultiInvoiceMatch(payment, sortedMatches, orgId);
        if (multiMatch) {
          return multiMatch;
        }
      }

      return {
        matched: bestMatch.confidence > 50,
        matchType: bestMatch.matchType,
        invoice: bestMatch.invoice,
        confidence: bestMatch.confidence,
        suggestedAction: shouldAutoReconcile
          ? SuggestedAction.AUTO_RECONCILE
          : bestMatch.suggestedAction,
        matchReasons: bestMatch.matchReasons,
        amountRemaining:
          bestMatch.matchType === MatchType.PARTIAL ? bestMatch.amountDifference : undefined,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error matching payment: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Find potential invoice matches for a payment
   */
  async findPotentialMatches(payment: PaymentInput, orgId: string): Promise<InvoiceMatch[]> {
    // Get open invoices (SENT or OVERDUE)
    const maxAge = new Date();
    maxAge.setDate(maxAge.getDate() - this.criteria.maxInvoiceAgeDays);

    const openInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId,
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
        },
        issueDate: {
          gte: maxAge,
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    this.logger.log(`Found ${openInvoices.length} open invoices to check`);

    if (openInvoices.length === 0) {
      return [];
    }

    // Score each invoice
    const matches: InvoiceMatch[] = [];

    for (const invoice of openInvoices) {
      const match = this.scoreInvoiceMatch(invoice, payment);
      if (match.confidence > 30) {
        // Only include reasonable matches
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Score how well an invoice matches a payment
   */
  private scoreInvoiceMatch(invoice: Invoice, payment: PaymentInput): InvoiceMatch {
    const matchReasons: string[] = [];
    let totalConfidence = 0;
    let weightSum = 0;

    // 1. Amount matching (weight: 40%)
    const amountMatch = this.amountMatcher.matchAmount(
      payment.amount,
      Number(invoice.totalAmount),
    );
    totalConfidence += amountMatch.confidence * 0.4;
    weightSum += 0.4;
    if (amountMatch.matches) {
      matchReasons.push(amountMatch.reason);
    }

    // 2. Reference matching (weight: 30%)
    const refMatch = this.referenceMatcher.matchInvoiceNumber(
      invoice.number,
      payment.description || '',
    );
    if (refMatch.matches) {
      totalConfidence += refMatch.confidence * 0.3;
      weightSum += 0.3;
      matchReasons.push(refMatch.reason);
    }

    // 3. Customer name matching (weight: 25%)
    if (payment.counterparty && invoice.customerName) {
      const nameMatch = this.nameMatcher.matchNames(payment.counterparty, invoice.customerName);
      if (nameMatch.matches) {
        totalConfidence += nameMatch.confidence * 0.25;
        weightSum += 0.25;
        matchReasons.push(nameMatch.reason);
      }
    }

    // 4. Date proximity (weight: 5%)
    const daysSinceIssue = Math.floor(
      (payment.date.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceIssue >= 0 && daysSinceIssue <= 90) {
      const dateConfidence = Math.max(100 - daysSinceIssue, 50);
      totalConfidence += dateConfidence * 0.05;
      weightSum += 0.05;
      matchReasons.push(`Payment ${daysSinceIssue} days after invoice issue`);
    }

    // Normalize confidence
    const finalConfidence = weightSum > 0 ? Math.round(totalConfidence / weightSum) : 0;

    // Determine match type
    let matchType: MatchType;
    if (amountMatch.matchType === 'EXACT' && finalConfidence >= 90) {
      matchType = MatchType.EXACT;
    } else if (amountMatch.matchType === 'PARTIAL') {
      matchType = MatchType.PARTIAL;
    } else if (finalConfidence >= 70) {
      matchType = MatchType.PROBABLE;
    } else {
      matchType = MatchType.NONE;
    }

    // Determine suggested action
    let suggestedAction: SuggestedAction;
    if (matchType === MatchType.EXACT && finalConfidence >= this.criteria.minConfidenceForAutoMatch) {
      suggestedAction = SuggestedAction.AUTO_RECONCILE;
    } else if (matchType === MatchType.PARTIAL) {
      suggestedAction = SuggestedAction.PARTIAL_PAYMENT;
    } else {
      suggestedAction = SuggestedAction.REVIEW;
    }

    return {
      invoice,
      matchType,
      confidence: finalConfidence,
      matchReasons,
      suggestedAction,
      amountDifference: amountMatch.difference,
    };
  }

  /**
   * Check if payment matches multiple invoices (overpayment scenario)
   */
  private async checkMultiInvoiceMatch(
    payment: PaymentInput,
    sortedMatches: InvoiceMatch[],
    orgId: string,
  ): Promise<MatchResult | null> {
    const invoiceAmounts = sortedMatches.map((m) => Number(m.invoice.totalAmount));
    const multiMatch = this.amountMatcher.matchMultipleInvoices(payment.amount, invoiceAmounts);

    if (multiMatch.matches && multiMatch.invoiceIndices.length > 1) {
      const matchedInvoices = multiMatch.invoiceIndices
        .map((i) => sortedMatches[i]?.invoice)
        .filter((invoice): invoice is NonNullable<typeof invoice> => invoice !== undefined);

      this.logger.log(
        `Multi-invoice match: ${matchedInvoices.length} invoices totaling €${multiMatch.totalAmount}`,
      );

      return {
        matched: true,
        matchType: MatchType.EXACT,
        invoices: matchedInvoices,
        confidence: multiMatch.confidence,
        suggestedAction: SuggestedAction.MULTI_INVOICE,
        matchReasons: [
          `Payment matches ${matchedInvoices.length} invoices`,
          `Total: €${multiMatch.totalAmount}, Difference: €${multiMatch.difference}`,
        ],
        amountRemaining: multiMatch.difference,
      };
    }

    return null;
  }

  /**
   * Auto-reconcile a payment with an invoice
   */
  async autoReconcile(
    transactionId: string,
    invoiceId: string,
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Auto-reconciling transaction ${transactionId} with invoice ${invoiceId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Update invoice status to PAID
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: InvoiceStatus.PAID,
            paidDate: new Date(),
          },
        });

        // Create reconciliation record (if you have this model)
        // await tx.reconciliation.create({...});

        this.logger.log(`Successfully reconciled invoice ${invoiceId}`);
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error auto-reconciling: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Record a partial payment
   */
  async recordPartialPayment(
    transactionId: string,
    invoiceId: string,
    amount: number,
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Recording partial payment of €${amount} for invoice ${invoiceId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
        });

        if (!invoice) {
          throw new Error(`Invoice ${invoiceId} not found`);
        }

        const remaining = Number(invoice.totalAmount) - amount;

        // Update invoice (you might want to add a 'paidAmount' field)
        // For now, we'll keep status as SENT if not fully paid
        if (remaining <= 0) {
          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              status: InvoiceStatus.PAID,
              paidDate: new Date(),
            },
          });
        }

        // Create partial payment record (if you have this model)
        // await tx.partialPayment.create({...});

        this.logger.log(`Partial payment recorded: €${amount}, remaining: €${remaining}`);
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error recording partial payment: ${err.message}`, err.stack);
      throw error;
    }
  }
}
