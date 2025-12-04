/**
 * Revenue Recognition Service
 * Handles ASC 606 / IFRS 15 compliant revenue recognition
 * Calculates MRR, ARR, churn metrics, and deferred revenue
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  MrrBreakdown,
  ArrMetrics,
  ChurnMetrics,
  RevenueTierReport,
  RevenueRecognitionEntry,
} from './types/revenue.types';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RevenueRecognitionService {
  private readonly logger = new Logger(RevenueRecognitionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate MRR for a specific month
   */
  async calculateMrr(
    month: Date,
    currency: string = 'EUR',
  ): Promise<MrrBreakdown> {
    const monthStart = this.getMonthStart(month);
    const monthEnd = this.getMonthEnd(month);
    const previousMonthStart = this.getPreviousMonth(monthStart);

    this.logger.debug(
      `Calculating MRR for ${monthStart.toISOString()} (${currency})`,
    );

    // Get MRR movement from database if exists
    const existing = await this.prisma.mrrMovement.findUnique({
      where: {
        month_currency: {
          month: monthStart,
          currency,
        },
      },
    });

    if (existing) {
      return this.convertMrrMovementToBreakdown(existing);
    }

    // Calculate from revenue recognition records
    const currentMonthRevenue = await this.prisma.revenueRecognition.findMany({
      where: {
        recognitionMonth: monthStart,
        currency,
      },
    });

    const previousMonthRevenue = await this.prisma.revenueRecognition.findMany(
      {
        where: {
          recognitionMonth: previousMonthStart,
          currency,
        },
      },
    );

    // Group by organisation to track customer-level changes
    const currentOrgs = this.groupByOrganisation(currentMonthRevenue);
    const previousOrgs = this.groupByOrganisation(previousMonthRevenue);

    let newMrr = 0;
    let expansionMrr = 0;
    let contractionMrr = 0;
    let churnMrr = 0;
    let reactivationMrr = 0;

    const currentOrgIds = new Set(currentOrgs.keys());
    const previousOrgIds = new Set(previousOrgs.keys());

    // Calculate MRR movements
    for (const [orgId, currentAmount] of currentOrgs) {
      const previousAmount = previousOrgs.get(orgId) || 0;

      if (previousAmount === 0) {
        // New customer or reactivation
        if (this.wasCustomerBefore(orgId, previousMonthStart)) {
          reactivationMrr += currentAmount;
        } else {
          newMrr += currentAmount;
        }
      } else if (currentAmount > previousAmount) {
        // Expansion (upgrade)
        expansionMrr += currentAmount - previousAmount;
      } else if (currentAmount < previousAmount) {
        // Contraction (downgrade)
        contractionMrr += previousAmount - currentAmount;
      }
    }

    // Calculate churn (customers in previous month but not current)
    for (const [orgId, previousAmount] of previousOrgs) {
      if (!currentOrgIds.has(orgId)) {
        churnMrr += previousAmount;
      }
    }

    const totalMrr = Array.from(currentOrgs.values()).reduce(
      (sum, amount) => sum + amount,
      0,
    );
    const netNewMrr = newMrr + expansionMrr + reactivationMrr - contractionMrr - churnMrr;

    const breakdown: MrrBreakdown = {
      month: monthStart,
      currency,
      newMrr: this.centsToDecimal(newMrr),
      expansionMrr: this.centsToDecimal(expansionMrr),
      contractionMrr: this.centsToDecimal(contractionMrr),
      churnMrr: this.centsToDecimal(churnMrr),
      reactivationMrr: this.centsToDecimal(reactivationMrr),
      netNewMrr: this.centsToDecimal(netNewMrr),
      totalMrr: this.centsToDecimal(totalMrr),
      customerCount: currentOrgIds.size,
      newCustomers: this.countNewCustomers(currentOrgIds, previousOrgIds),
      churnedCustomers: this.countChurnedCustomers(
        currentOrgIds,
        previousOrgIds,
      ),
      mrrGrowthRate: this.calculateGrowthRate(
        totalMrr,
        previousOrgs.size > 0
          ? Array.from(previousOrgs.values()).reduce((sum, a) => sum + a, 0)
          : 0,
      ),
      customerGrowthRate: this.calculateGrowthRate(
        currentOrgIds.size,
        previousOrgIds.size,
      ),
    };

    return breakdown;
  }

  /**
   * Calculate ARR (Annual Recurring Revenue)
   */
  async calculateArr(
    asOfDate: Date = new Date(),
    currency: string = 'EUR',
  ): Promise<ArrMetrics> {
    const monthStart = this.getMonthStart(asOfDate);

    // Get current MRR
    const mrr = await this.calculateMrr(monthStart, currency);

    return {
      arr: mrr.totalMrr * 12,
      currency,
      asOfDate,
      calculatedFrom: 'mrr',
    };
  }

  /**
   * Calculate churn metrics for a period
   */
  async calculateChurnMetrics(
    month: Date,
    currency: string = 'EUR',
  ): Promise<ChurnMetrics> {
    const monthStart = this.getMonthStart(month);
    const previousMonthStart = this.getPreviousMonth(monthStart);

    const currentMrr = await this.calculateMrr(monthStart, currency);
    const previousMrr = await this.calculateMrr(previousMonthStart, currency);

    const startingMrr = previousMrr.totalMrr;
    const startingCustomers = previousMrr.customerCount;

    // Gross revenue churn rate = Lost MRR / Starting MRR
    const grossRevenueChurnRate =
      startingMrr > 0 ? (currentMrr.churnMrr / startingMrr) * 100 : 0;

    // Net revenue retention = (Starting + Expansion - Contraction - Churn) / Starting
    const netRevenueRetentionRate =
      startingMrr > 0
        ? ((startingMrr +
            currentMrr.expansionMrr -
            currentMrr.contractionMrr -
            currentMrr.churnMrr) /
            startingMrr) *
          100
        : 0;

    // Customer churn rate
    const customerChurnRate =
      startingCustomers > 0
        ? (currentMrr.churnedCustomers / startingCustomers) * 100
        : 0;

    const customerRetentionRate = 100 - customerChurnRate;

    // Expansion and contraction rates
    const expansionRate =
      startingMrr > 0 ? (currentMrr.expansionMrr / startingMrr) * 100 : 0;
    const contractionRate =
      startingMrr > 0 ? (currentMrr.contractionMrr / startingMrr) * 100 : 0;

    return {
      period: monthStart,
      currency,
      grossRevenueChurnRate: this.roundToTwoDecimals(grossRevenueChurnRate),
      netRevenueRetentionRate: this.roundToTwoDecimals(
        netRevenueRetentionRate,
      ),
      customerChurnRate: this.roundToTwoDecimals(customerChurnRate),
      customerRetentionRate: this.roundToTwoDecimals(customerRetentionRate),
      expansionRate: this.roundToTwoDecimals(expansionRate),
      contractionRate: this.roundToTwoDecimals(contractionRate),
    };
  }

  /**
   * Track deferred revenue
   * Creates revenue recognition schedule for subscription payments
   */
  async createDeferredRevenueSchedule(params: {
    organisationId: string;
    invoiceId: string;
    invoiceNumber?: string;
    billingDate: Date;
    recognitionStart: Date;
    recognitionEnd: Date;
    totalAmount: number;
    currency?: string;
    description?: string;
  }): Promise<void> {
    const {
      organisationId,
      invoiceId,
      invoiceNumber,
      billingDate,
      recognitionStart,
      recognitionEnd,
      totalAmount,
      currency = 'EUR',
      description,
    } = params;

    // Create deferred revenue schedule
    await this.prisma.deferredRevenueSchedule.create({
      data: {
        organisationId,
        invoiceId,
        invoiceNumber,
        billingDate,
        recognitionStart,
        recognitionEnd,
        totalAmount: new Decimal(totalAmount).dividedBy(100),
        remainingDeferred: new Decimal(totalAmount).dividedBy(100),
        currency,
        description,
        status: 'ACTIVE',
      },
    });

    // Create monthly revenue recognition entries
    await this.createMonthlyRecognitionEntries({
      organisationId,
      invoiceId,
      recognitionStart,
      recognitionEnd,
      totalAmount,
      currency,
      description,
    });

    this.logger.log(
      `Created deferred revenue schedule for invoice ${invoiceId} (${currency} ${totalAmount / 100})`,
    );
  }

  /**
   * Create monthly revenue recognition entries
   */
  private async createMonthlyRecognitionEntries(params: {
    organisationId: string;
    invoiceId: string;
    recognitionStart: Date;
    recognitionEnd: Date;
    totalAmount: number;
    currency: string;
    description?: string;
  }): Promise<void> {
    const {
      organisationId,
      invoiceId,
      recognitionStart,
      recognitionEnd,
      totalAmount,
      currency,
      description,
    } = params;

    const months = this.getMonthsBetween(recognitionStart, recognitionEnd);
    const amountPerMonth = Math.round(totalAmount / months.length);

    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const isLastMonth = i === months.length - 1;

      // Handle rounding - last month gets remainder
      const recognizedAmount = isLastMonth
        ? totalAmount - amountPerMonth * (months.length - 1)
        : amountPerMonth;

      const deferredAmount = totalAmount - recognizedAmount * (i + 1);

      await this.prisma.revenueRecognition.create({
        data: {
          organisationId,
          invoiceId,
          periodStart: this.getMonthStart(month),
          periodEnd: this.getMonthEnd(month),
          recognitionMonth: this.getMonthStart(month),
          totalAmount: new Decimal(totalAmount).dividedBy(100),
          recognizedAmount: new Decimal(recognizedAmount).dividedBy(100),
          deferredAmount: new Decimal(deferredAmount).dividedBy(100),
          currency,
          description,
        },
      });
    }
  }

  /**
   * Handle prorations and credits
   * Adjusts revenue recognition when subscriptions change mid-period
   */
  async handleProration(params: {
    organisationId: string;
    oldAmount: number;
    newAmount: number;
    changeDate: Date;
    periodEnd: Date;
    currency?: string;
  }): Promise<number> {
    const { organisationId, oldAmount, newAmount, changeDate, periodEnd, currency = 'EUR' } = params;

    const totalDays = this.getDaysBetween(changeDate, periodEnd);
    const remainingDays = this.getDaysBetween(changeDate, periodEnd);

    // Proration = (New Amount - Old Amount) * (Remaining Days / Total Days in Month)
    const proration = Math.round(
      ((newAmount - oldAmount) * remainingDays) / totalDays,
    );

    this.logger.debug(
      `Calculated proration for org ${organisationId}: ${currency} ${proration / 100} (${remainingDays} days remaining)`,
    );

    return proration;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private groupByOrganisation(
    records: any[],
  ): Map<string, number> {
    const grouped = new Map<string, number>();

    for (const record of records) {
      const current = grouped.get(record.organisationId) || 0;
      const amount = this.decimalToCents(record.recognizedAmount);
      grouped.set(record.organisationId, current + amount);
    }

    return grouped;
  }

  private async wasCustomerBefore(
    orgId: string,
    beforeDate: Date,
  ): Promise<boolean> {
    const count = await this.prisma.revenueRecognition.count({
      where: {
        organisationId: orgId,
        recognitionMonth: {
          lt: beforeDate,
        },
      },
    });

    return count > 0;
  }

  private countNewCustomers(
    current: Set<string>,
    previous: Set<string>,
  ): number {
    let count = 0;
    for (const orgId of current) {
      if (!previous.has(orgId)) {
        count++;
      }
    }
    return count;
  }

  private countChurnedCustomers(
    current: Set<string>,
    previous: Set<string>,
  ): number {
    let count = 0;
    for (const orgId of previous) {
      if (!current.has(orgId)) {
        count++;
      }
    }
    return count;
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return this.roundToTwoDecimals(((current - previous) / previous) * 100);
  }

  private convertMrrMovementToBreakdown(movement: any): MrrBreakdown {
    return {
      month: movement.month,
      currency: movement.currency,
      newMrr: this.decimalToNumber(movement.newMrr),
      expansionMrr: this.decimalToNumber(movement.expansionMrr),
      contractionMrr: this.decimalToNumber(movement.contractionMrr),
      churnMrr: this.decimalToNumber(movement.churnMrr),
      reactivationMrr: this.decimalToNumber(movement.reactivationMrr),
      netNewMrr: this.decimalToNumber(movement.netNewMrr),
      totalMrr: this.decimalToNumber(movement.totalMrr),
      customerCount: movement.customerCount,
      newCustomers: movement.newCustomers,
      churnedCustomers: movement.churnedCustomers,
      mrrGrowthRate: this.calculateGrowthRate(
        this.decimalToNumber(movement.totalMrr),
        this.decimalToNumber(movement.totalMrr) -
          this.decimalToNumber(movement.netNewMrr),
      ),
      customerGrowthRate: 0, // Would need previous month data
    };
  }

  private getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  private getPreviousMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() - 1, 1);
  }

  private getMonthsBetween(start: Date, end: Date): Date[] {
    const months: Date[] = [];
    const current = this.getMonthStart(start);
    const endMonth = this.getMonthStart(end);

    while (current <= endMonth) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  private getDaysBetween(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private decimalToCents(decimal: Decimal): number {
    return Math.round(decimal.toNumber() * 100);
  }

  private centsToDecimal(cents: number): number {
    return cents / 100;
  }

  private decimalToNumber(decimal: Decimal): number {
    return decimal.toNumber();
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
