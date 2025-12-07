/**
 * Tax Liability Tracker Service
 * Real-time tax estimates for German freelancers/small businesses (EÜR)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  TaxLiability,
  QuarterlyEstimate,
  VatSummary,
  VatPeriod,
  DeductionsSummary,
  CategoryDeduction,
  SpecialDeduction,
  TaxAlert,
  TaxCalculationOptions,
} from './types/tax-liability.types';
import {
  calculateIncomeTax,
  calculateSolidaritySurcharge,
  VAT_RATES,
  SMALL_BUSINESS_EXEMPTION,
  TRADE_TAX,
} from './rules/german-tax-rules';
import { TaxDeductionAnalyzerService } from './tax-deduction-analyzer.service';
import { TaxCategory } from './types/tax-categories.types';
import { getEurLineInfo } from './rules/eur-line-mapping';

/**
 * German Tax Rates 2024/2025
 */
const GERMAN_TAX_RATES = {
  brackets: [
    { min: 0, max: 11604, rate: 0 },
    { min: 11605, max: 17005, rate: 0.14 },
    { min: 17006, max: 66760, rate: 0.24 },
    { min: 66761, max: 277826, rate: 0.42 },
    { min: 277827, max: Infinity, rate: 0.45 },
  ],
  solidaritySurcharge: {
    threshold: 16956, // Tax amount threshold for singles
    rate: 0.055,
  },
  vat: {
    standard: 0.19,
    reduced: 0.07,
  },
  prepayments: {
    requiredIfTaxOver: 400, // EUR per quarter
  },
} as const;

/**
 * Special deduction limits (in cents)
 */
const DEDUCTION_LIMITS = {
  geschenke: 3500, // 35 EUR per person/year
  bewirtung: 0.7, // 70% deductible
  arbeitszimmer: 126000, // 1,260 EUR home office max
  telefonInternet: 0.5, // 50% if mixed use
  fahrtkosten: 0.3, // 0.30 EUR per km
  abschreibung: {
    computer: 3,
    furniture: 13,
    vehicle: 6,
  },
} as const;

@Injectable()
export class TaxLiabilityTrackerService {
  private readonly logger = new Logger(TaxLiabilityTrackerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taxDeductionAnalyzer: TaxDeductionAnalyzerService,
  ) {
    this.logger.log('Tax Liability Tracker initialized');
  }

  /**
   * Calculate full tax liability for organization
   */
  async calculateTaxLiability(
    organizationId: string,
    year?: number,
    options: TaxCalculationOptions = {},
  ): Promise<TaxLiability> {
    const targetYear = year || new Date().getFullYear();
    this.logger.log(
      `Calculating tax liability for org ${organizationId}, year ${targetYear}`,
    );

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);
    const now = new Date();

    // Calculate revenue from invoices
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organizationId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: options.confirmedOnly ? ['PAID'] : ['DRAFT', 'SENT', 'PAID'],
        },
      },
      select: {
        totalAmount: true,
        taxAmount: true,
        subtotal: true,
        status: true,
      },
    });

    // Calculate revenue and VAT collected
    let totalRevenue = 0;
    let collectedVat = 0;

    for (const invoice of invoices) {
      const total = Number(invoice.totalAmount) * 100; // Convert to cents
      const tax = Number(invoice.taxAmount) * 100;
      const net = Number(invoice.subtotal) * 100;

      totalRevenue += net; // Net revenue (before VAT)
      collectedVat += tax; // VAT collected from customers
    }

    // Calculate expenses and deductions from transactions
    const expenses = await this.prisma.$queryRaw<
      Array<{
        taxCategory: string;
        totalAmount: bigint;
        deductibleAmount: bigint;
        vatReclaimable: bigint;
        count: bigint;
      }>
    >`
      SELECT
        metadata->>'taxCategory' as "taxCategory",
        SUM(ABS(amount)) as "totalAmount",
        SUM(COALESCE(CAST(metadata->>'deductibleAmount' as NUMERIC), 0)) as "deductibleAmount",
        SUM(COALESCE(CAST(metadata->>'vatReclaimable' as NUMERIC), 0)) as "vatReclaimable",
        COUNT(*) as count
      FROM "Transaction"
      WHERE "orgId" = ${organizationId}
        AND EXTRACT(YEAR FROM date) = ${targetYear}
        AND amount < 0
        AND metadata->>'taxCategory' IS NOT NULL
      GROUP BY metadata->>'taxCategory'
    `;

    let totalDeductions = 0;
    let paidVat = 0;

    for (const expense of expenses) {
      totalDeductions += Number(expense.deductibleAmount || 0);
      paidVat += Number(expense.vatReclaimable || 0);
    }

    // Calculate net profit (EÜR basis)
    const netProfit = totalRevenue - totalDeductions;

    // Calculate income tax
    const taxableIncomeEur = netProfit / 100; // Convert to EUR
    const {
      tax: incomeTaxEur,
      effectiveRate,
      bracket,
    } = calculateIncomeTax(taxableIncomeEur);
    const estimatedIncomeTax = Math.round(incomeTaxEur * 100); // Back to cents

    // Calculate solidarity surcharge
    const soliEur = calculateSolidaritySurcharge(
      incomeTaxEur,
      options.isMarried,
    );
    const estimatedSoli = Math.round(soliEur * 100); // To cents

    // Calculate total tax
    const estimatedTotalTax = estimatedIncomeTax + estimatedSoli;

    // Check for prepayments (Vorauszahlungen)
    const prepayments = await this.prisma.transaction.findMany({
      where: {
        orgId: organizationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        description: {
          contains: 'Finanzamt',
          mode: 'insensitive',
        },
        amount: {
          lt: 0, // Payments (negative)
        },
      },
      select: {
        amount: true,
      },
    });

    const alreadyPaidIncomeTax = prepayments.reduce(
      (sum: number, p: { amount: any }) => sum + Math.abs(Number(p.amount) * 100),
      0,
    );

    // Check for VAT submissions
    const vatSubmissions = await this.prisma.transaction.findMany({
      where: {
        orgId: organizationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        description: {
          contains: 'Umsatzsteuer',
          mode: 'insensitive',
        },
        amount: {
          lt: 0, // Payments
        },
      },
      select: {
        amount: true,
      },
    });

    const alreadySubmittedVat = vatSubmissions.reduce(
      (sum: number, v: { amount: any }) => sum + Math.abs(Number(v.amount) * 100),
      0,
    );

    // Calculate VAT balance
    const netVatDue = options.isKleinunternehmer ? 0 : collectedVat - paidVat;
    const vatStillOwed = Math.max(0, netVatDue - alreadySubmittedVat);

    // Calculate next payment
    const stillOwedIncomeTax = Math.max(
      0,
      estimatedIncomeTax - alreadyPaidIncomeTax,
    );
    const totalStillOwed = stillOwedIncomeTax + estimatedSoli + vatStillOwed;

    // Determine next payment due
    const { nextPaymentDue, nextPaymentAmount } =
      await this.getNextPaymentDue(
        organizationId,
        targetYear,
        options.vatFrequency || 'quarterly',
      );

    // Calculate confidence based on data completeness
    const monthsElapsed = now.getMonth() + 1;
    const dataCompleteness = Math.min(monthsElapsed / 12, 1);
    const hasInvoices = invoices.length > 0;
    const hasExpenses = expenses.length > 0;
    const confidence = dataCompleteness * (hasInvoices && hasExpenses ? 0.9 : 0.6);

    // Build notes
    const notes: string[] = [];
    if (now.getFullYear() === targetYear && monthsElapsed < 12) {
      notes.push(
        `Schätzung basierend auf ${monthsElapsed} Monaten von ${targetYear}`,
      );
    }
    if (options.isKleinunternehmer) {
      notes.push('Kleinunternehmerregelung (§19 UStG) - keine MwSt');
    }
    if (!hasInvoices) {
      notes.push('Keine Rechnungen gefunden - Einnahmen möglicherweise unvollständig');
    }
    if (!hasExpenses) {
      notes.push('Keine kategorisierten Ausgaben gefunden');
    }

    return {
      organizationId,
      year: targetYear,
      asOfDate: now,
      income: {
        totalRevenue,
        totalDeductions,
        netProfit,
      },
      incomeTax: {
        taxableIncome: netProfit,
        estimatedTax: estimatedIncomeTax,
        effectiveRate,
        bracket,
        alreadyPaid: alreadyPaidIncomeTax,
        stillOwed: stillOwedIncomeTax,
      },
      solidaritySurcharge: {
        rate: GERMAN_TAX_RATES.solidaritySurcharge.rate,
        amount: estimatedSoli,
      },
      vat: {
        collectedVat,
        paidVat,
        netVatDue,
        alreadySubmitted: alreadySubmittedVat,
        stillOwed: vatStillOwed,
      },
      total: {
        estimatedTotalTax,
        alreadyPaid: alreadyPaidIncomeTax + alreadySubmittedVat,
        stillOwed: totalStillOwed,
        nextPaymentDue,
        nextPaymentAmount,
      },
      confidence,
      notes,
    };
  }

  /**
   * Get quarterly tax estimates
   */
  async getQuarterlyEstimates(
    organizationId: string,
    year?: number,
  ): Promise<QuarterlyEstimate[]> {
    const targetYear = year || new Date().getFullYear();
    this.logger.log(`Getting quarterly estimates for org ${organizationId}, year ${targetYear}`);

    const quarters: QuarterlyEstimate[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    for (let q = 1; q <= 4; q++) {
      const startMonth = (q - 1) * 3;
      const endMonth = startMonth + 2;
      const startDate = new Date(targetYear, startMonth, 1);
      const endDate = new Date(targetYear, endMonth + 1, 0, 23, 59, 59);

      // Determine status
      let status: 'projected' | 'in_progress' | 'completed';
      if (targetYear < currentYear || (targetYear === currentYear && q < currentQuarter)) {
        status = 'completed';
      } else if (targetYear === currentYear && q === currentQuarter) {
        status = 'in_progress';
      } else {
        status = 'projected';
      }

      // Get revenue for quarter
      const invoices = await this.prisma.invoice.aggregate({
        where: {
          orgId: organizationId,
          issueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          subtotal: true,
          taxAmount: true,
        },
      });

      const revenue = Math.round(Number(invoices._sum.subtotal || 0) * 100);
      const vatCollected = Math.round(Number(invoices._sum.taxAmount || 0) * 100);

      // Get expenses for quarter
      const expensesResult = await this.prisma.$queryRaw<
        Array<{
          totalDeductible: bigint;
          totalVat: bigint;
        }>
      >`
        SELECT
          SUM(COALESCE(CAST(metadata->>'deductibleAmount' as NUMERIC), 0)) as "totalDeductible",
          SUM(COALESCE(CAST(metadata->>'vatReclaimable' as NUMERIC), 0)) as "totalVat"
        FROM "Transaction"
        WHERE "orgId" = ${organizationId}
          AND date >= ${startDate}
          AND date <= ${endDate}
          AND amount < 0
      `;

      const expenses = Number(expensesResult[0]?.totalDeductible || 0);
      const vatPaid = Number(expensesResult[0]?.totalVat || 0);

      // Calculate profit and tax
      const netProfit = revenue - expenses;
      const taxableIncomeEur = netProfit / 100;
      const { tax: incomeTaxEur } = calculateIncomeTax(taxableIncomeEur);
      const estimatedIncomeTax = Math.round(incomeTaxEur * 100);

      quarters.push({
        quarter: q as 1 | 2 | 3 | 4,
        year: targetYear,
        startDate,
        endDate,
        revenue,
        expenses,
        netProfit,
        estimatedIncomeTax,
        vatCollected,
        vatPaid,
        netVat: vatCollected - vatPaid,
        status,
      });
    }

    return quarters;
  }

  /**
   * Get VAT summary by period
   */
  async getVatSummary(
    organizationId: string,
    period: 'monthly' | 'quarterly' | 'yearly',
    year?: number,
  ): Promise<VatSummary> {
    const targetYear = year || new Date().getFullYear();
    this.logger.log(
      `Getting ${period} VAT summary for org ${organizationId}, year ${targetYear}`,
    );

    const periods: VatPeriod[] = [];
    let totalCollected = 0;
    let totalPaid = 0;

    if (period === 'quarterly') {
      for (let q = 1; q <= 4; q++) {
        const vatPeriod = await this.getVatPeriodQuarterly(
          organizationId,
          q,
          targetYear,
        );
        periods.push(vatPeriod);
        totalCollected += vatPeriod.vatCollected;
        totalPaid += vatPeriod.vatPaid;
      }
    } else if (period === 'monthly') {
      for (let m = 1; m <= 12; m++) {
        const vatPeriod = await this.getVatPeriodMonthly(
          organizationId,
          m,
          targetYear,
        );
        periods.push(vatPeriod);
        totalCollected += vatPeriod.vatCollected;
        totalPaid += vatPeriod.vatPaid;
      }
    } else {
      // Yearly
      const vatPeriod = await this.getVatPeriodYearly(organizationId, targetYear);
      periods.push(vatPeriod);
      totalCollected = vatPeriod.vatCollected;
      totalPaid = vatPeriod.vatPaid;
    }

    const netDue = totalCollected - totalPaid;

    // Find next deadline
    const nextDuePeriod = periods.find(
      (p) => p.status === 'due' || p.status === 'upcoming',
    );

    return {
      period,
      periods,
      totalCollected,
      totalPaid,
      netDue,
      nextDeadline: nextDuePeriod?.submissionDeadline || null,
      nextAmount: nextDuePeriod?.netVat || 0,
    };
  }

  /**
   * Get deductions summary
   */
  async getDeductionsSummary(
    organizationId: string,
    year?: number,
  ): Promise<DeductionsSummary> {
    const targetYear = year || new Date().getFullYear();
    this.logger.log(
      `Getting deductions summary for org ${organizationId}, year ${targetYear}`,
    );

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    // Get expenses by category
    const expenses = await this.prisma.$queryRaw<
      Array<{
        taxCategory: string;
        totalAmount: bigint;
        deductibleAmount: bigint;
        count: bigint;
      }>
    >`
      SELECT
        metadata->>'taxCategory' as "taxCategory",
        SUM(ABS(amount)) as "totalAmount",
        SUM(COALESCE(CAST(metadata->>'deductibleAmount' as NUMERIC), 0)) as "deductibleAmount",
        COUNT(*) as count
      FROM "Transaction"
      WHERE "orgId" = ${organizationId}
        AND date >= ${startDate}
        AND date <= ${endDate}
        AND amount < 0
        AND metadata->>'taxCategory' IS NOT NULL
      GROUP BY metadata->>'taxCategory'
      ORDER BY "deductibleAmount" DESC
    `;

    let totalDeductions = 0;
    const categories: CategoryDeduction[] = [];

    for (const expense of expenses) {
      const category = expense.taxCategory as TaxCategory;
      const amount = Number(expense.totalAmount) * 100;
      const deductible = Number(expense.deductibleAmount || 0);
      const count = Number(expense.count);

      totalDeductions += deductible;

      const eurInfo = getEurLineInfo(category);
      const deductionRate = amount > 0 ? deductible / amount : 0;

      categories.push({
        category: eurInfo.germanDescription,
        eurLine: eurInfo.lineNumber.toString(),
        amount,
        transactionCount: count,
        deductionRate,
        effectiveDeduction: deductible,
      });
    }

    // Build special items (gifts, home office, etc.)
    const specialItems: SpecialDeduction[] = [];

    // Home office (Arbeitszimmer)
    const homeOfficeExpenses = expenses.find(
      (e: { taxCategory: string }) => e.taxCategory === TaxCategory.MIETE_PACHT,
    );
    if (homeOfficeExpenses) {
      const claimed = Math.min(
        Number(homeOfficeExpenses.deductibleAmount || 0),
        DEDUCTION_LIMITS.arbeitszimmer,
      );
      specialItems.push({
        name: 'Häusliches Arbeitszimmer',
        amount: Number(homeOfficeExpenses.totalAmount) * 100,
        limit: DEDUCTION_LIMITS.arbeitszimmer,
        claimed,
        remaining: Math.max(0, DEDUCTION_LIMITS.arbeitszimmer - claimed),
        note: 'Pauschale 1.260€/Jahr oder anteilige Miete',
      });
    }

    // Business meals (Bewirtung)
    const bewirtungExpenses = expenses.find(
      (e: { taxCategory: string }) => e.taxCategory === TaxCategory.BEWIRTUNG,
    );
    if (bewirtungExpenses) {
      const amount = Number(bewirtungExpenses.totalAmount) * 100;
      const claimed = Math.round(amount * DEDUCTION_LIMITS.bewirtung);
      specialItems.push({
        name: 'Bewirtungskosten',
        amount,
        limit: null,
        claimed,
        remaining: null,
        note: 'Nur 70% abzugsfähig',
      });
    }

    return {
      year: targetYear,
      totalDeductions,
      categories,
      specialItems,
    };
  }

  /**
   * Get tax alerts and notifications
   */
  async getTaxAlerts(organizationId: string): Promise<TaxAlert[]> {
    this.logger.log(`Getting tax alerts for org ${organizationId}`);

    const alerts: TaxAlert[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;

    // Check quarterly VAT deadline
    const nextVatDeadline = this.getNextVatDeadline('quarterly');
    if (nextVatDeadline) {
      const daysUntil = Math.ceil(
        (nextVatDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntil <= 10 && daysUntil > 0) {
        alerts.push({
          id: `vat-q${currentQuarter}-${currentYear}`,
          type: 'deadline',
          severity: daysUntil <= 3 ? 'urgent' : 'warning',
          title: 'Umsatzsteuervoranmeldung fällig',
          message: `Die Umsatzsteuervoranmeldung für Q${currentQuarter} ist am ${nextVatDeadline.toLocaleDateString('de-DE')} fällig`,
          dueDate: nextVatDeadline,
          actionRequired: 'ELSTER-Formular einreichen',
        });
      }
    }

    // Check quarterly income tax prepayment
    const quarterlyDueDates = [
      new Date(currentYear, 2, 10), // Q1: March 10
      new Date(currentYear, 5, 10), // Q2: June 10
      new Date(currentYear, 8, 10), // Q3: September 10
      new Date(currentYear, 11, 10), // Q4: December 10
    ];

    for (const dueDate of quarterlyDueDates) {
      if (dueDate > now) {
        const daysUntil = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntil <= 10) {
          const quarter = Math.floor(dueDate.getMonth() / 3) + 1;
          alerts.push({
            id: `income-tax-q${quarter}-${currentYear}`,
            type: 'payment_due',
            severity: daysUntil <= 3 ? 'urgent' : 'warning',
            title: 'Einkommensteuer-Vorauszahlung fällig',
            message: `Vorauszahlung für Q${quarter} fällig am ${dueDate.toLocaleDateString('de-DE')}`,
            dueDate,
            actionRequired: 'Vorauszahlung überweisen',
          });
          break;
        }
      }
    }

    // Check annual tax return deadline (July 31)
    const taxReturnDeadline = new Date(currentYear, 6, 31); // July 31
    const daysUntilTaxReturn = Math.ceil(
      (taxReturnDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilTaxReturn > 0 && daysUntilTaxReturn <= 30) {
      alerts.push({
        id: `tax-return-${currentYear - 1}`,
        type: 'deadline',
        severity: daysUntilTaxReturn <= 7 ? 'urgent' : 'warning',
        title: 'Steuererklärung fällig',
        message: `Steuererklärung für ${currentYear - 1} fällig am ${taxReturnDeadline.toLocaleDateString('de-DE')}`,
        dueDate: taxReturnDeadline,
        actionRequired: 'EÜR und Steuererklärung einreichen',
      });
    }

    // Check quarterly estimate reminder
    if (now.getDate() === 1 && [0, 3, 6, 9].includes(currentMonth)) {
      alerts.push({
        id: `quarterly-estimate-${currentYear}-q${currentQuarter}`,
        type: 'quarterly_estimate',
        severity: 'info',
        title: 'Quartalszahlen aktualisieren',
        message: `Überprüfen Sie Ihre Steuerschätzung für Q${currentQuarter}`,
        actionRequired: 'Einnahmen und Ausgaben überprüfen',
      });
    }

    return alerts;
  }

  /**
   * Private helper: Get VAT period for a quarter
   */
  private async getVatPeriodQuarterly(
    organizationId: string,
    quarter: number,
    year: number,
  ): Promise<VatPeriod> {
    const startMonth = (quarter - 1) * 3;
    const endMonth = startMonth + 2;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, endMonth + 1, 0, 23, 59, 59);

    // Submission deadline: 10th of month after quarter end
    const submissionDeadline = new Date(year, endMonth + 1, 10);

    const invoices = await this.prisma.invoice.aggregate({
      where: {
        orgId: organizationId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        taxAmount: true,
      },
      _count: true,
    });

    const expenses = await this.prisma.$queryRaw<
      Array<{
        totalVat: bigint;
        count: bigint;
      }>
    >`
      SELECT
        SUM(COALESCE(CAST(metadata->>'vatReclaimable' as NUMERIC), 0)) as "totalVat",
        COUNT(*) as count
      FROM "Transaction"
      WHERE "orgId" = ${organizationId}
        AND date >= ${startDate}
        AND date <= ${endDate}
        AND amount < 0
    `;

    const vatCollected = Math.round(Number(invoices._sum.taxAmount || 0) * 100);
    const vatPaid = Number(expenses[0]?.totalVat || 0);

    const now = new Date();
    let status: 'submitted' | 'due' | 'upcoming';
    if (now > submissionDeadline) {
      status = 'submitted'; // Assume submitted if past deadline
    } else if (now > endDate) {
      status = 'due';
    } else {
      status = 'upcoming';
    }

    return {
      label: `Q${quarter} ${year}`,
      startDate,
      endDate,
      invoicesIssued: invoices._count || 0,
      vatCollected,
      expensesClaimed: Number(expenses[0]?.count || 0),
      vatPaid,
      netVat: vatCollected - vatPaid,
      status,
      submissionDeadline,
    };
  }

  /**
   * Private helper: Get VAT period for a month
   */
  private async getVatPeriodMonthly(
    organizationId: string,
    month: number,
    year: number,
  ): Promise<VatPeriod> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Submission deadline: 10th of following month
    const submissionDeadline = new Date(year, month, 10);

    const invoices = await this.prisma.invoice.aggregate({
      where: {
        orgId: organizationId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        taxAmount: true,
      },
      _count: true,
    });

    const expenses = await this.prisma.$queryRaw<
      Array<{
        totalVat: bigint;
        count: bigint;
      }>
    >`
      SELECT
        SUM(COALESCE(CAST(metadata->>'vatReclaimable' as NUMERIC), 0)) as "totalVat",
        COUNT(*) as count
      FROM "Transaction"
      WHERE "orgId" = ${organizationId}
        AND date >= ${startDate}
        AND date <= ${endDate}
        AND amount < 0
    `;

    const vatCollected = Math.round(Number(invoices._sum.taxAmount || 0) * 100);
    const vatPaid = Number(expenses[0]?.totalVat || 0);

    const now = new Date();
    let status: 'submitted' | 'due' | 'upcoming';
    if (now > submissionDeadline) {
      status = 'submitted';
    } else if (now > endDate) {
      status = 'due';
    } else {
      status = 'upcoming';
    }

    const monthNames = [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ];

    return {
      label: `${monthNames[month - 1]} ${year}`,
      startDate,
      endDate,
      invoicesIssued: invoices._count || 0,
      vatCollected,
      expensesClaimed: Number(expenses[0]?.count || 0),
      vatPaid,
      netVat: vatCollected - vatPaid,
      status,
      submissionDeadline,
    };
  }

  /**
   * Private helper: Get VAT period for a year
   */
  private async getVatPeriodYearly(
    organizationId: string,
    year: number,
  ): Promise<VatPeriod> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Annual deadline: July 31 of following year
    const submissionDeadline = new Date(year + 1, 6, 31);

    const invoices = await this.prisma.invoice.aggregate({
      where: {
        orgId: organizationId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        taxAmount: true,
      },
      _count: true,
    });

    const expenses = await this.prisma.$queryRaw<
      Array<{
        totalVat: bigint;
        count: bigint;
      }>
    >`
      SELECT
        SUM(COALESCE(CAST(metadata->>'vatReclaimable' as NUMERIC), 0)) as "totalVat",
        COUNT(*) as count
      FROM "Transaction"
      WHERE "orgId" = ${organizationId}
        AND date >= ${startDate}
        AND date <= ${endDate}
        AND amount < 0
    `;

    const vatCollected = Math.round(Number(invoices._sum.taxAmount || 0) * 100);
    const vatPaid = Number(expenses[0]?.totalVat || 0);

    const now = new Date();
    let status: 'submitted' | 'due' | 'upcoming';
    if (now > submissionDeadline) {
      status = 'submitted';
    } else if (now > endDate) {
      status = 'due';
    } else {
      status = 'upcoming';
    }

    return {
      label: `${year}`,
      startDate,
      endDate,
      invoicesIssued: invoices._count || 0,
      vatCollected,
      expensesClaimed: Number(expenses[0]?.count || 0),
      vatPaid,
      netVat: vatCollected - vatPaid,
      status,
      submissionDeadline,
    };
  }

  /**
   * Private helper: Get next payment due date and amount
   */
  private async getNextPaymentDue(
    organizationId: string,
    year: number,
    vatFrequency: 'monthly' | 'quarterly' | 'yearly',
  ): Promise<{ nextPaymentDue: Date | null; nextPaymentAmount: number }> {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;

    if (vatFrequency === 'quarterly') {
      // Next quarterly deadline
      const deadlines = [
        new Date(year, 3, 10), // Q1: April 10
        new Date(year, 6, 10), // Q2: July 10
        new Date(year, 9, 10), // Q3: October 10
        new Date(year + 1, 0, 10), // Q4: January 10 next year
      ];

      const nextDeadline = deadlines.find((d) => d > now);
      if (nextDeadline) {
        // Calculate amount for the completed quarter
        const quarter =
          nextDeadline.getMonth() === 0 ? 4 : Math.floor(nextDeadline.getMonth() / 3);
        const period = await this.getVatPeriodQuarterly(
          organizationId,
          quarter,
          quarter === 4 ? year : year,
        );
        return {
          nextPaymentDue: nextDeadline,
          nextPaymentAmount: period.netVat,
        };
      }
    }

    return {
      nextPaymentDue: null,
      nextPaymentAmount: 0,
    };
  }

  /**
   * Private helper: Get next VAT deadline
   */
  private getNextVatDeadline(
    frequency: 'monthly' | 'quarterly' | 'yearly',
  ): Date | null {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (frequency === 'quarterly') {
      const deadlines = [
        new Date(currentYear, 3, 10), // April 10
        new Date(currentYear, 6, 10), // July 10
        new Date(currentYear, 9, 10), // October 10
        new Date(currentYear + 1, 0, 10), // January 10
      ];
      return deadlines.find((d) => d > now) || null;
    }

    if (frequency === 'monthly') {
      // 10th of next month
      return new Date(currentYear, currentMonth + 1, 10);
    }

    // Yearly: July 31 of next year
    return new Date(currentYear + 1, 6, 31);
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    return !!this.prisma && !!this.taxDeductionAnalyzer;
  }
}
