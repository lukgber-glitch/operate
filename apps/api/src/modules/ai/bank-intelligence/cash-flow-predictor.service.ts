import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  addDays,
  startOfDay,
  endOfDay,
  differenceInDays,
  differenceInMonths,
  format,
  isWeekend,
  subMonths,
  eachDayOfInterval,
} from 'date-fns';
import {
  CashFlowForecast,
  CashFlowItem,
  DailyProjection,
  LowestCashPoint,
  RunwayAnalysis,
  CashFlowAlert,
  Scenario,
  RecurringPayment,
  HistoricalPattern,
  CustomerPaymentBehavior,
  CASH_FLOW_THRESHOLDS,
  PAYMENT_PROBABILITY,
} from './types/cash-flow.types';
import { InvoiceStatus, BillStatus } from '@prisma/client';

/**
 * Cash Flow Predictor Service
 * Predicts future cash flow based on:
 * - Historical transactions
 * - Recurring payments
 * - Pending invoices
 * - Pending bills
 */
@Injectable()
export class CashFlowPredictorService {
  private readonly logger = new Logger(CashFlowPredictorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Predict cash flow for the next N days
   * Supports multi-month forecasting (up to 180 days / 6 months)
   */
  async predictCashFlow(
    organizationId: string,
    days: number = 30,
  ): Promise<CashFlowForecast> {
    // Ensure we don't exceed 6 months (180 days)
    const forecastDays = Math.min(days, 180);
    this.logger.log(`Predicting cash flow for org ${organizationId} for ${forecastDays} days`);

    try {
      // 1. Get current bank balance
      const currentBalance = await this.getCurrentBalance(organizationId);
      this.logger.log(`Current balance: €${currentBalance}`);

      // 2. Get pending invoices (expected income)
      const pendingInvoices = await this.getPendingInvoicesWithProbability(organizationId);
      this.logger.log(`Found ${pendingInvoices.length} pending invoices`);

      // 3. Get pending bills (expected outflow)
      const pendingBills = await this.getPendingBills(organizationId);
      this.logger.log(`Found ${pendingBills.length} pending bills`);

      // 4. Get recurring patterns (extended for multi-month)
      const recurringPayments = await this.detectRecurringPayments(organizationId, forecastDays);
      this.logger.log(`Detected ${recurringPayments.length} recurring payments`);

      // 5. Get recurring income patterns
      const recurringIncome = await this.detectRecurringIncome(organizationId, forecastDays);
      this.logger.log(`Detected ${recurringIncome.length} recurring income patterns`);

      // 6. Predict based on historical patterns
      const historicalPredictions = await this.predictFromHistory(organizationId, forecastDays);

      // 7. Detect seasonal patterns (for multi-month forecasts)
      const seasonalPatterns = forecastDays > 60
        ? await this.detectSeasonalPatterns(organizationId)
        : [];

      // 8. Build daily projections
      const dailyProjections = this.buildDailyProjections(
        currentBalance,
        pendingInvoices,
        pendingBills,
        recurringPayments,
        recurringIncome,
        historicalPredictions,
        seasonalPatterns,
        forecastDays,
      );

      // 9. Find lowest point
      const lowestPoint = this.findLowestPoint(dailyProjections);

      // 10. Generate alerts
      const alerts = this.generateAlerts(dailyProjections, lowestPoint, currentBalance);

      // 11. Calculate summary
      const summary = this.calculateSummary(pendingInvoices, pendingBills, recurringPayments, recurringIncome);

      const projectedBalance =
        dailyProjections.length > 0
          ? dailyProjections[dailyProjections.length - 1].closingBalance
          : currentBalance;

      const recurringIncomeTotal = recurringIncome.reduce((sum, item) => sum + item.amount, 0);

      const forecast: CashFlowForecast = {
        organizationId,
        generatedAt: new Date(),
        forecastDays,
        currentBalance,
        projectedBalance,
        summary,
        inflows: {
          pendingInvoices: pendingInvoices.reduce((sum, item) => sum + item.amount, 0),
          expectedRecurringIncome: recurringIncomeTotal,
          predictedIncome: historicalPredictions
            .filter((p) => p.averageInflow > 0)
            .reduce((sum, p) => sum + p.averageInflow, 0),
          total: pendingInvoices.reduce((sum, item) => sum + item.amount, 0) + recurringIncomeTotal,
          breakdown: [...pendingInvoices, ...this.convertRecurringIncomeToItems(recurringIncome)],
        },
        outflows: {
          pendingBills: pendingBills.reduce((sum, item) => sum + item.amount, 0),
          recurringExpenses: recurringPayments.reduce((sum, item) => sum + item.amount, 0),
          predictedExpenses: historicalPredictions
            .filter((p) => p.averageOutflow > 0)
            .reduce((sum, p) => sum + p.averageOutflow, 0),
          total:
            pendingBills.reduce((sum, item) => sum + item.amount, 0) +
            recurringPayments.reduce((sum, item) => sum + item.amount, 0),
          breakdown: [...pendingBills, ...this.convertRecurringToItems(recurringPayments)],
        },
        dailyProjections,
        lowestPoint,
        alerts,
        confidence: this.calculateConfidence(
          pendingInvoices.length,
          pendingBills.length,
          recurringPayments.length,
        ),
      };

      return forecast;
    } catch (error) {
      this.logger.error(`Error predicting cash flow: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get day-by-day projections
   */
  async getDailyProjections(
    organizationId: string,
    days: number = 30,
  ): Promise<DailyProjection[]> {
    const forecast = await this.predictCashFlow(organizationId, days);
    return forecast.dailyProjections;
  }

  /**
   * Get the lowest cash point in the forecast period
   */
  async getLowestCashPoint(
    organizationId: string,
    days: number = 30,
  ): Promise<LowestCashPoint> {
    const forecast = await this.predictCashFlow(organizationId, days);
    return forecast.lowestPoint;
  }

  /**
   * Calculate runway (how long until cash runs out)
   */
  async calculateRunway(organizationId: string): Promise<RunwayAnalysis> {
    this.logger.log(`Calculating runway for org ${organizationId}`);

    try {
      const currentBalance = await this.getCurrentBalance(organizationId);

      // Look at last 3 months for burn rate calculation
      const threeMonthsAgo = subMonths(new Date(), 3);

      const transactions = await this.prisma.bankTransaction.findMany({
        where: {
          bankAccount: { orgId: organizationId },
          date: { gte: threeMonthsAgo },
        },
        orderBy: { date: 'asc' },
      });

      // Calculate monthly metrics
      const monthlyExpenses: number[] = [];
      const monthlyIncome: number[] = [];
      let currentMonth = transactions[0]?.date.getMonth() ?? new Date().getMonth();
      let monthExpense = 0;
      let monthIncome = 0;

      for (const txn of transactions) {
        if (txn.date.getMonth() !== currentMonth) {
          monthlyExpenses.push(monthExpense);
          monthlyIncome.push(monthIncome);
          currentMonth = txn.date.getMonth();
          monthExpense = 0;
          monthIncome = 0;
        }

        const amount = Number(txn.amount);
        if (txn.type === 'debit' || amount < 0) {
          monthExpense += Math.abs(amount);
        } else {
          monthIncome += amount;
        }
      }

      // Add last incomplete month
      if (monthExpense > 0 || monthIncome > 0) {
        monthlyExpenses.push(monthExpense);
        monthlyIncome.push(monthIncome);
      }

      const averageMonthlyExpenses =
        monthlyExpenses.length > 0
          ? monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length
          : 0;

      const averageMonthlyIncome =
        monthlyIncome.length > 0
          ? monthlyIncome.reduce((a, b) => a + b, 0) / monthlyIncome.length
          : 0;

      const monthlyBurnRate = averageMonthlyExpenses;
      const netMonthlyChange = averageMonthlyIncome - averageMonthlyExpenses;

      let runwayMonths = 0;
      let runwayDate: Date | null = null;
      let status: 'healthy' | 'caution' | 'critical' = 'healthy';

      if (netMonthlyChange < 0) {
        // Burning money
        runwayMonths = currentBalance / Math.abs(netMonthlyChange);
        runwayDate = addDays(new Date(), runwayMonths * 30);

        if (runwayMonths < CASH_FLOW_THRESHOLDS.runwayCriticalMonths) {
          status = 'critical';
        } else if (runwayMonths < CASH_FLOW_THRESHOLDS.runwayWarningMonths) {
          status = 'caution';
        }
      } else {
        // Profitable or breaking even
        runwayMonths = Infinity;
        status = 'healthy';
      }

      // Generate recommendations
      const recommendations = this.generateRunwayRecommendations(
        status,
        runwayMonths,
        averageMonthlyIncome,
        averageMonthlyExpenses,
      );

      return {
        currentBalance,
        monthlyBurnRate,
        averageMonthlyIncome,
        netMonthlyChange,
        runwayMonths: runwayMonths === Infinity ? 999 : Math.round(runwayMonths * 10) / 10,
        runwayDate,
        status,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Error calculating runway: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get scenario analysis (what-if)
   */
  async getScenarioAnalysis(
    organizationId: string,
    scenario: Scenario,
  ): Promise<CashFlowForecast> {
    this.logger.log(`Running scenario analysis: ${scenario.name}`);

    // Get base forecast
    const baseForecast = await this.predictCashFlow(organizationId, 30);

    // Apply adjustments
    const adjustedForecast = { ...baseForecast };

    if (scenario.adjustments.additionalIncome) {
      const additionalItem: CashFlowItem = {
        description: 'Scenario: Additional Income',
        amount: scenario.adjustments.additionalIncome,
        expectedDate: new Date(),
        type: 'predicted',
        confidence: 100,
        source: scenario.name,
      };
      adjustedForecast.inflows.breakdown.push(additionalItem);
      adjustedForecast.inflows.total += scenario.adjustments.additionalIncome;
    }

    if (scenario.adjustments.additionalExpense) {
      const additionalItem: CashFlowItem = {
        description: 'Scenario: Additional Expense',
        amount: scenario.adjustments.additionalExpense,
        expectedDate: new Date(),
        type: 'predicted',
        confidence: 100,
        source: scenario.name,
      };
      adjustedForecast.outflows.breakdown.push(additionalItem);
      adjustedForecast.outflows.total += scenario.adjustments.additionalExpense;
    }

    // Rebuild daily projections with adjustments
    adjustedForecast.dailyProjections = this.applyScenarioToProjections(
      baseForecast.dailyProjections,
      scenario,
    );

    // Recalculate summary
    adjustedForecast.summary = {
      totalInflows: adjustedForecast.inflows.total,
      totalOutflows: adjustedForecast.outflows.total,
      netChange: adjustedForecast.inflows.total - adjustedForecast.outflows.total,
    };

    adjustedForecast.projectedBalance =
      baseForecast.currentBalance + adjustedForecast.summary.netChange;

    // Recalculate lowest point
    adjustedForecast.lowestPoint = this.findLowestPoint(adjustedForecast.dailyProjections);

    // Regenerate alerts
    adjustedForecast.alerts = this.generateAlerts(
      adjustedForecast.dailyProjections,
      adjustedForecast.lowestPoint,
      baseForecast.currentBalance,
    );

    return adjustedForecast;
  }

  /**
   * Get current balance from all bank accounts
   */
  private async getCurrentBalance(organizationId: string): Promise<number> {
    const accounts = await this.prisma.bankAccount.findMany({
      where: {
        orgId: organizationId,
        isActive: true,
      },
    });

    return accounts.reduce((sum, account) => {
      return sum + (account.currentBalance ? Number(account.currentBalance) : 0);
    }, 0);
  }

  /**
   * Get pending invoices with payment probability
   */
  private async getPendingInvoicesWithProbability(
    organizationId: string,
  ): Promise<CashFlowItem[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organizationId,
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Calculate payment behavior for each customer
    const customerBehaviors = await this.getCustomerPaymentBehaviors(organizationId);

    return invoices.map((invoice) => {
      const behavior = customerBehaviors.get(invoice.customerId || '');
      const daysOverdue = differenceInDays(new Date(), invoice.dueDate);

      let expectedDate = invoice.dueDate;
      let probability = PAYMENT_PROBABILITY.onTimeCustomer;

      if (behavior) {
        // Adjust based on customer behavior
        expectedDate = addDays(invoice.dueDate, behavior.typicalDelay);
        probability = behavior.paymentProbability;
      }

      // Decrease probability for overdue invoices
      if (daysOverdue > 0) {
        const weeksOverdue = Math.floor(daysOverdue / 7);
        probability = Math.max(
          PAYMENT_PROBABILITY.minProbability,
          probability - weeksOverdue * PAYMENT_PROBABILITY.overdueDecayRate,
        );
      }

      return {
        description: `Invoice ${invoice.number} - ${invoice.customerName}`,
        amount: Number(invoice.totalAmount),
        expectedDate: new Date(expectedDate),
        type: 'invoice' as const,
        confidence: Math.round(probability * 100),
        source: invoice.id,
      };
    });
  }

  /**
   * Get pending bills
   */
  private async getPendingBills(organizationId: string): Promise<CashFlowItem[]> {
    const bills = await this.prisma.bill.findMany({
      where: {
        organisationId: organizationId,
        status: {
          in: [BillStatus.APPROVED, BillStatus.PENDING],
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return bills.map((bill) => ({
      description: `Bill ${bill.billNumber || ''} - ${bill.vendorName}`,
      amount: Number(bill.totalAmount) - Number(bill.paidAmount),
      expectedDate: new Date(bill.dueDate),
      type: 'bill' as const,
      confidence: 95, // High confidence for bills
      source: bill.id,
    }));
  }

  /**
   * Detect recurring payments
   */
  private async detectRecurringPayments(
    organizationId: string,
    forecastDays: number,
  ): Promise<RecurringPayment[]> {
    const sixMonthsAgo = subMonths(new Date(), 6);

    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccount: { orgId: organizationId },
        date: { gte: sixMonthsAgo },
        type: 'debit',
      },
      orderBy: { date: 'asc' },
    });

    // Group by counterparty
    const groupedByVendor = new Map<string, typeof transactions>();

    for (const txn of transactions) {
      const vendor = txn.counterpartyName || 'Unknown';
      if (!groupedByVendor.has(vendor)) {
        groupedByVendor.set(vendor, []);
      }
      groupedByVendor.get(vendor)!.push(txn);
    }

    const recurringPayments: RecurringPayment[] = [];

    // Analyze each vendor's transactions
    for (const [vendor, txns] of groupedByVendor.entries()) {
      if (txns.length < 2) continue; // Need at least 2 occurrences

      // Check for regular intervals
      const intervals: number[] = [];
      for (let i = 1; i < txns.length; i++) {
        const daysBetween = differenceInDays(txns[i].date, txns[i - 1].date);
        intervals.push(daysBetween);
      }

      // Calculate average interval
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalStdDev = Math.sqrt(
        intervals.reduce((sq, n) => sq + Math.pow(n - avgInterval, 2), 0) / intervals.length,
      );

      // If interval is consistent (low std dev), it's likely recurring
      const isRecurring = intervalStdDev < avgInterval * 0.2; // Within 20% variation

      if (isRecurring) {
        const avgAmount = txns.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) / txns.length;
        const lastTxn = txns[txns.length - 1];
        const nextExpectedDate = addDays(lastTxn.date, avgInterval);

        // Determine frequency
        let frequency: RecurringPayment['frequency'] = 'monthly';
        if (avgInterval <= 1) frequency = 'daily';
        else if (avgInterval <= 7) frequency = 'weekly';
        else if (avgInterval <= 16) frequency = 'biweekly';
        else if (avgInterval <= 35) frequency = 'monthly';
        else if (avgInterval <= 100) frequency = 'quarterly';
        else frequency = 'yearly';

        // Only include if next payment is within forecast period
        if (differenceInDays(nextExpectedDate, new Date()) <= forecastDays) {
          recurringPayments.push({
            vendorName: vendor,
            amount: avgAmount,
            frequency,
            nextExpectedDate,
            confidence: Math.round(Math.max(0, 100 - intervalStdDev)),
            lastOccurrence: lastTxn.date,
            category: lastTxn.category || undefined,
          });
        }
      }
    }

    return recurringPayments;
  }

  /**
   * Predict from historical patterns
   */
  private async predictFromHistory(
    organizationId: string,
    forecastDays: number,
  ): Promise<HistoricalPattern[]> {
    const threeMonthsAgo = subMonths(new Date(), 3);

    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccount: { orgId: organizationId },
        date: { gte: threeMonthsAgo },
      },
    });

    // Group by day of week
    const byDayOfWeek = new Map<string, { inflows: number[]; outflows: number[] }>();

    for (const txn of transactions) {
      const dayOfWeek = format(txn.date, 'EEEE');
      if (!byDayOfWeek.has(dayOfWeek)) {
        byDayOfWeek.set(dayOfWeek, { inflows: [], outflows: [] });
      }

      const amount = Number(txn.amount);
      if (txn.type === 'credit' || amount > 0) {
        byDayOfWeek.get(dayOfWeek)!.inflows.push(Math.abs(amount));
      } else {
        byDayOfWeek.get(dayOfWeek)!.outflows.push(Math.abs(amount));
      }
    }

    const patterns: HistoricalPattern[] = [];

    for (const [dayOfWeek, data] of byDayOfWeek.entries()) {
      const avgInflow =
        data.inflows.length > 0
          ? data.inflows.reduce((a, b) => a + b, 0) / data.inflows.length
          : 0;

      const avgOutflow =
        data.outflows.length > 0
          ? data.outflows.reduce((a, b) => a + b, 0) / data.outflows.length
          : 0;

      patterns.push({
        dayOfWeek,
        averageInflow: avgInflow,
        averageOutflow: avgOutflow,
        transactionCount: data.inflows.length + data.outflows.length,
        confidence: Math.min(100, (data.inflows.length + data.outflows.length) * 5),
      });
    }

    return patterns;
  }

  /**
   * Build daily projections with support for recurring income and seasonal patterns
   */
  private buildDailyProjections(
    currentBalance: number,
    pendingInvoices: CashFlowItem[],
    pendingBills: CashFlowItem[],
    recurringPayments: RecurringPayment[],
    recurringIncome: RecurringPayment[],
    historicalPatterns: HistoricalPattern[],
    seasonalPatterns: any[],
    days: number,
  ): DailyProjection[] {
    const projections: DailyProjection[] = [];
    const startDate = startOfDay(new Date());

    let runningBalance = currentBalance;

    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const dayOfWeek = format(date, 'EEEE');
      const items: CashFlowItem[] = [];
      let dailyInflows = 0;
      let dailyOutflows = 0;

      // Add invoices due on this day
      const dueInvoices = pendingInvoices.filter(
        (inv) => startOfDay(inv.expectedDate).getTime() === startOfDay(date).getTime(),
      );
      for (const invoice of dueInvoices) {
        items.push(invoice);
        dailyInflows += invoice.amount * (invoice.confidence / 100);
      }

      // Add bills due on this day
      const dueBills = pendingBills.filter(
        (bill) => startOfDay(bill.expectedDate).getTime() === startOfDay(date).getTime(),
      );
      for (const bill of dueBills) {
        items.push(bill);
        dailyOutflows += bill.amount;
      }

      // Add recurring payments (expenses) due on this day
      const dueRecurringPayments = recurringPayments.filter(
        (rec) =>
          startOfDay(rec.nextExpectedDate).getTime() === startOfDay(date).getTime(),
      );
      for (const recurring of dueRecurringPayments) {
        const item: CashFlowItem = {
          description: `Recurring Payment: ${recurring.vendorName}`,
          amount: recurring.amount,
          expectedDate: date,
          type: 'recurring',
          confidence: recurring.confidence,
          source: recurring.vendorName,
        };
        items.push(item);
        dailyOutflows += recurring.amount;
      }

      // Add recurring income due on this day
      const dueRecurringIncome = recurringIncome.filter(
        (rec) =>
          startOfDay(rec.nextExpectedDate).getTime() === startOfDay(date).getTime(),
      );
      for (const recurring of dueRecurringIncome) {
        const item: CashFlowItem = {
          description: `Recurring Income: ${recurring.vendorName}`,
          amount: recurring.amount,
          expectedDate: date,
          type: 'recurring',
          confidence: recurring.confidence,
          source: recurring.vendorName,
        };
        items.push(item);
        dailyInflows += recurring.amount * (recurring.confidence / 100);
      }

      // Add historical predictions (with low weight if no specific transactions)
      if (items.length === 0) {
        const pattern = historicalPatterns.find((p) => p.dayOfWeek === dayOfWeek);
        if (pattern && pattern.confidence > 30) {
          // Only use if decent confidence
          dailyInflows += pattern.averageInflow * 0.3; // Conservative 30% weight
          dailyOutflows += pattern.averageOutflow * 0.3;
        }
      }

      const openingBalance = runningBalance;
      const closingBalance = openingBalance + dailyInflows - dailyOutflows;
      runningBalance = closingBalance;

      projections.push({
        date,
        dayOfWeek,
        openingBalance,
        inflows: dailyInflows,
        outflows: dailyOutflows,
        closingBalance,
        items,
        isWeekend: isWeekend(date),
        isPayday: this.isPayday(date),
      });
    }

    return projections;
  }

  /**
   * Find lowest cash point
   */
  private findLowestPoint(projections: DailyProjection[]): LowestCashPoint {
    if (projections.length === 0) {
      return {
        date: new Date(),
        projectedBalance: 0,
        daysFromNow: 0,
        isCritical: true,
        riskFactors: ['No projections available'],
      };
    }

    let lowest = projections[0];
    for (const projection of projections) {
      if (projection.closingBalance < lowest.closingBalance) {
        lowest = projection;
      }
    }

    const riskFactors: string[] = [];

    // Analyze risk factors
    if (lowest.outflows > CASH_FLOW_THRESHOLDS.largeOutflowThreshold * lowest.openingBalance) {
      riskFactors.push(
        `Large outflow of €${lowest.outflows.toFixed(2)} (${Math.round((lowest.outflows / lowest.openingBalance) * 100)}% of balance)`,
      );
    }

    const largeItems = lowest.items.filter((item) => item.amount > 1000);
    if (largeItems.length > 0) {
      riskFactors.push(`${largeItems.length} large payment(s) due`);
      largeItems.forEach((item) => {
        riskFactors.push(`  - ${item.description}: €${item.amount.toFixed(2)}`);
      });
    }

    return {
      date: lowest.date,
      projectedBalance: lowest.closingBalance,
      daysFromNow: differenceInDays(lowest.date, new Date()),
      isCritical: lowest.closingBalance < CASH_FLOW_THRESHOLDS.lowBalanceCritical,
      riskFactors,
    };
  }

  /**
   * Generate cash flow alerts
   */
  private generateAlerts(
    projections: DailyProjection[],
    lowestPoint: LowestCashPoint,
    currentBalance: number,
  ): CashFlowAlert[] {
    const alerts: CashFlowAlert[] = [];

    // Low balance warning
    if (
      lowestPoint.projectedBalance < CASH_FLOW_THRESHOLDS.lowBalanceWarning &&
      lowestPoint.projectedBalance >= CASH_FLOW_THRESHOLDS.lowBalanceCritical
    ) {
      alerts.push({
        type: 'low_balance',
        severity: 'warning',
        message: `Balance projected to drop to €${lowestPoint.projectedBalance.toFixed(2)} on ${format(lowestPoint.date, 'MMM dd')}`,
        date: lowestPoint.date,
        amount: lowestPoint.projectedBalance,
        actionRequired: 'Follow up on outstanding invoices to improve cash position',
      });
    }

    // Critical low balance
    if (lowestPoint.projectedBalance < CASH_FLOW_THRESHOLDS.lowBalanceCritical) {
      alerts.push({
        type: 'low_balance',
        severity: 'critical',
        message: `CRITICAL: Balance projected to drop to €${lowestPoint.projectedBalance.toFixed(2)} on ${format(lowestPoint.date, 'MMM dd')}`,
        date: lowestPoint.date,
        amount: lowestPoint.projectedBalance,
        actionRequired: 'Urgent action needed: Secure additional funding or delay payments',
      });
    }

    // Large outflows
    for (const projection of projections) {
      if (
        projection.outflows >
        CASH_FLOW_THRESHOLDS.largeOutflowThreshold * projection.openingBalance
      ) {
        alerts.push({
          type: 'large_outflow',
          severity: 'warning',
          message: `Large outflow of €${projection.outflows.toFixed(2)} expected on ${format(projection.date, 'MMM dd')}`,
          date: projection.date,
          amount: projection.outflows,
          actionRequired: 'Ensure sufficient funds are available',
        });
      }
    }

    // Missed income (if projections show consistently low inflows)
    const avgInflow =
      projections.reduce((sum, p) => sum + p.inflows, 0) / Math.max(projections.length, 1);
    const lowInflowDays = projections.filter((p) => p.inflows < avgInflow * 0.5).length;

    if (lowInflowDays > projections.length * 0.5) {
      alerts.push({
        type: 'missed_income',
        severity: 'info',
        message: `${lowInflowDays} days with below-average income expected`,
        date: new Date(),
        actionRequired: 'Consider accelerating invoicing or following up on overdue payments',
      });
    }

    return alerts;
  }

  /**
   * Calculate summary
   */
  private calculateSummary(
    pendingInvoices: CashFlowItem[],
    pendingBills: CashFlowItem[],
    recurringPayments: RecurringPayment[],
    recurringIncome: RecurringPayment[],
  ) {
    const totalInflows =
      pendingInvoices.reduce(
        (sum, item) => sum + item.amount * (item.confidence / 100),
        0,
      ) +
      recurringIncome.reduce((sum, item) => sum + item.amount, 0);

    const totalOutflows =
      pendingBills.reduce((sum, item) => sum + item.amount, 0) +
      recurringPayments.reduce((sum, item) => sum + item.amount, 0);

    return {
      totalInflows,
      totalOutflows,
      netChange: totalInflows - totalOutflows,
    };
  }

  /**
   * Calculate forecast confidence
   */
  private calculateConfidence(
    invoiceCount: number,
    billCount: number,
    recurringCount: number,
  ): number {
    // More data = higher confidence
    let confidence = 50; // Base confidence

    confidence += Math.min(invoiceCount * 5, 20);
    confidence += Math.min(billCount * 5, 20);
    confidence += Math.min(recurringCount * 2, 10);

    return Math.min(confidence, 100);
  }

  /**
   * Get customer payment behaviors
   */
  private async getCustomerPaymentBehaviors(
    organizationId: string,
  ): Promise<Map<string, CustomerPaymentBehavior>> {
    const behaviors = new Map<string, CustomerPaymentBehavior>();

    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organizationId,
        status: InvoiceStatus.PAID,
        paidDate: { not: null },
      },
      select: {
        customerId: true,
        customerName: true,
        dueDate: true,
        paidDate: true,
      },
    });

    // Group by customer
    const byCustomer = new Map<string, typeof paidInvoices>();
    for (const invoice of paidInvoices) {
      const customerId = invoice.customerId || invoice.customerName;
      if (!byCustomer.has(customerId)) {
        byCustomer.set(customerId, []);
      }
      byCustomer.get(customerId)!.push(invoice);
    }

    // Calculate behavior for each customer
    for (const [customerId, invoices] of byCustomer.entries()) {
      const delays = invoices
        .filter((inv) => inv.paidDate)
        .map((inv) => differenceInDays(inv.paidDate!, inv.dueDate));

      const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
      const onTimeCount = delays.filter((d) => d <= 7).length; // Within 7 days is "on time"
      const onTimeRate = onTimeCount / delays.length;

      behaviors.set(customerId, {
        customerId,
        customerName: invoices[0].customerName,
        averageDaysToPayment: Math.round(avgDelay),
        onTimePaymentRate: onTimeRate,
        typicalDelay: Math.max(0, Math.round(avgDelay)),
        paymentProbability:
          onTimeRate > 0.8 ? PAYMENT_PROBABILITY.onTimeCustomer : PAYMENT_PROBABILITY.lateCustomer,
      });
    }

    return behaviors;
  }

  /**
   * Check if date is a common payday (1st or 15th)
   */
  private isPayday(date: Date): boolean {
    const day = date.getDate();
    return day === 1 || day === 15;
  }

  /**
   * Convert recurring payments to cash flow items
   */
  private convertRecurringToItems(recurringPayments: RecurringPayment[]): CashFlowItem[] {
    return recurringPayments.map((recurring) => ({
      description: `Recurring: ${recurring.vendorName} (${recurring.frequency})`,
      amount: recurring.amount,
      expectedDate: recurring.nextExpectedDate,
      type: 'recurring' as const,
      confidence: recurring.confidence,
      source: recurring.vendorName,
    }));
  }

  /**
   * Apply scenario to projections
   */
  private applyScenarioToProjections(
    baseProjections: DailyProjection[],
    scenario: Scenario,
  ): DailyProjection[] {
    return baseProjections.map((projection, index) => {
      const adjusted = { ...projection };

      // Apply additional income/expense to first day
      if (index === 0) {
        if (scenario.adjustments.additionalIncome) {
          adjusted.inflows += scenario.adjustments.additionalIncome;
        }
        if (scenario.adjustments.additionalExpense) {
          adjusted.outflows += scenario.adjustments.additionalExpense;
        }
      }

      // Recalculate balance
      adjusted.closingBalance = adjusted.openingBalance + adjusted.inflows - adjusted.outflows;

      // Update subsequent opening balances
      if (index > 0 && baseProjections[index - 1]) {
        adjusted.openingBalance = baseProjections[index - 1].closingBalance;
        adjusted.closingBalance = adjusted.openingBalance + adjusted.inflows - adjusted.outflows;
      }

      return adjusted;
    });
  }

  /**
   * Generate runway recommendations
   */
  private generateRunwayRecommendations(
    status: 'healthy' | 'caution' | 'critical',
    runwayMonths: number,
    avgIncome: number,
    avgExpenses: number,
  ): string[] {
    const recommendations: string[] = [];

    if (status === 'critical') {
      recommendations.push('URGENT: Secure additional funding immediately');
      recommendations.push('Delay non-essential expenses');
      recommendations.push('Follow up on all outstanding invoices');
      recommendations.push('Consider short-term financing options');
    } else if (status === 'caution') {
      recommendations.push('Monitor cash flow closely');
      recommendations.push('Accelerate invoice collection');
      recommendations.push('Review and reduce discretionary spending');
      recommendations.push('Build cash reserves when possible');
    } else {
      recommendations.push('Maintain current financial discipline');
      recommendations.push('Consider investing excess cash');
      recommendations.push('Continue monitoring key metrics');
    }

    // Income-specific recommendations
    if (avgIncome < avgExpenses) {
      recommendations.push('Explore opportunities to increase revenue');
      recommendations.push('Review pricing strategy');
    }

    // Expense-specific recommendations
    if (avgExpenses > avgIncome * 0.8) {
      recommendations.push('Review recurring expenses for optimization');
      recommendations.push('Identify areas for cost reduction');
    }

    return recommendations;
  }

  /**
   * Detect recurring income patterns (NEW for multi-month forecasting)
   * Analyzes credit transactions to identify recurring revenue streams
   */
  private async detectRecurringIncome(
    organizationId: string,
    forecastDays: number,
  ): Promise<RecurringPayment[]> {
    const sixMonthsAgo = subMonths(new Date(), 6);

    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccount: { orgId: organizationId },
        date: { gte: sixMonthsAgo },
        type: 'credit', // Income transactions
      },
      orderBy: { date: 'asc' },
    });

    // Group by counterparty/customer
    const groupedByCustomer = new Map<string, typeof transactions>();

    for (const txn of transactions) {
      const customer = txn.counterpartyName || 'Unknown';
      if (!groupedByCustomer.has(customer)) {
        groupedByCustomer.set(customer, []);
      }
      groupedByCustomer.get(customer)!.push(txn);
    }

    const recurringIncome: RecurringPayment[] = [];

    // Analyze each customer's transactions
    for (const [customer, txns] of groupedByCustomer.entries()) {
      if (txns.length < 2) continue; // Need at least 2 occurrences

      // Check for regular intervals
      const intervals: number[] = [];
      for (let i = 1; i < txns.length; i++) {
        const daysBetween = differenceInDays(txns[i].date, txns[i - 1].date);
        intervals.push(daysBetween);
      }

      // Calculate average interval
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalStdDev = Math.sqrt(
        intervals.reduce((sq, n) => sq + Math.pow(n - avgInterval, 2), 0) / intervals.length,
      );

      // If interval is consistent (low std dev), it's likely recurring
      const isRecurring = intervalStdDev < avgInterval * 0.2; // Within 20% variation

      if (isRecurring) {
        const avgAmount = txns.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) / txns.length;
        const lastTxn = txns[txns.length - 1];
        const nextExpectedDate = addDays(lastTxn.date, avgInterval);

        // Determine frequency
        let frequency: RecurringPayment['frequency'] = 'monthly';
        if (avgInterval <= 1) frequency = 'daily';
        else if (avgInterval <= 7) frequency = 'weekly';
        else if (avgInterval <= 16) frequency = 'biweekly';
        else if (avgInterval <= 35) frequency = 'monthly';
        else if (avgInterval <= 100) frequency = 'quarterly';
        else frequency = 'yearly';

        // Only include if next payment is within forecast period
        if (differenceInDays(nextExpectedDate, new Date()) <= forecastDays) {
          recurringIncome.push({
            vendorName: customer, // Customer name in this case
            amount: avgAmount,
            frequency,
            nextExpectedDate,
            confidence: Math.round(Math.max(0, 100 - intervalStdDev)),
            lastOccurrence: lastTxn.date,
            category: lastTxn.category || undefined,
          });
        }
      }
    }

    return recurringIncome;
  }

  /**
   * Detect seasonal patterns (NEW for multi-month forecasting)
   * Analyzes historical data to identify seasonal trends
   */
  private async detectSeasonalPatterns(organizationId: string): Promise<any[]> {
    const oneYearAgo = subMonths(new Date(), 12);

    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccount: { orgId: organizationId },
        date: { gte: oneYearAgo },
      },
    });

    // Group by month
    const byMonth = new Map<number, { inflows: number; outflows: number }>();

    for (const txn of transactions) {
      const month = txn.date.getMonth(); // 0-11
      if (!byMonth.has(month)) {
        byMonth.set(month, { inflows: 0, outflows: 0 });
      }

      const amount = Number(txn.amount);
      if (txn.type === 'credit' || amount > 0) {
        byMonth.get(month)!.inflows += Math.abs(amount);
      } else {
        byMonth.get(month)!.outflows += Math.abs(amount);
      }
    }

    const patterns: any[] = [];

    for (const [month, data] of byMonth.entries()) {
      patterns.push({
        month,
        monthName: format(new Date(2024, month, 1), 'MMMM'),
        avgInflow: data.inflows,
        avgOutflow: data.outflows,
        netChange: data.inflows - data.outflows,
      });
    }

    return patterns;
  }

  /**
   * Convert recurring income to cash flow items
   */
  private convertRecurringIncomeToItems(recurringIncome: RecurringPayment[]): CashFlowItem[] {
    return recurringIncome.map((recurring) => ({
      description: `Recurring Income: ${recurring.vendorName} (${recurring.frequency})`,
      amount: recurring.amount,
      expectedDate: recurring.nextExpectedDate,
      type: 'recurring' as const,
      confidence: recurring.confidence,
      source: recurring.vendorName,
    }));
  }
}
