import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { TransactionStatus } from '@prisma/client';

/**
 * Tax filing report by jurisdiction
 */
export interface TaxFilingReport {
  jurisdiction: {
    state: string;
    county?: string;
    city?: string;
    jurisType: string;
    jurisName: string;
  };
  taxCollected: number;
  taxableAmount: number;
  exemptAmount: number;
  transactionCount: number;
  filingFrequency: string;
  dueDate: Date;
}

/**
 * Tax summary for a period
 */
export interface TaxPeriodSummary {
  startDate: Date;
  endDate: Date;
  totalTaxCollected: number;
  totalTaxableAmount: number;
  totalExemptAmount: number;
  transactionCount: number;
  byState: Record<string, {
    taxCollected: number;
    taxableAmount: number;
    exemptAmount: number;
    transactionCount: number;
  }>;
  byJurisdiction: TaxFilingReport[];
}

/**
 * Avalara filing export format
 */
export interface AvalaraFilingExport {
  period: {
    year: number;
    month: number;
    quarter?: number;
  };
  filings: Array<{
    jurisdiction: string;
    taxCollected: number;
    taxableAmount: number;
    exemptAmount: number;
    transactionCount: number;
    transactions: Array<{
      transactionCode: string;
      transactionDate: string;
      customerCode: string;
      totalAmount: number;
      totalTax: number;
      documentType: string;
    }>;
  }>;
}

/**
 * Tax Reporting Service
 * Handles tax reporting and filing preparation
 * Aggregates tax data by jurisdiction for filing purposes
 */
@Injectable()
export class TaxReportingService {
  private readonly logger = new Logger(TaxReportingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate tax filing report for a period
   */
  async generateFilingReport(
    orgId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TaxPeriodSummary> {
    this.logger.debug(`Generating tax filing report for ${orgId} from ${startDate} to ${endDate}`);

    // Fetch all committed transactions in the period
    const transactions = await this.prisma.taxTransaction.findMany({
      where: {
        orgId,
        status: TransactionStatus.COMMITTED,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    if (transactions.length === 0) {
      this.logger.warn(`No transactions found for period ${startDate} to ${endDate}`);
      return this.emptyPeriodSummary(startDate, endDate);
    }

    // Aggregate by jurisdiction
    const jurisdictionMap = new Map<string, TaxFilingReport>();
    const stateMap = new Map<string, {
      taxCollected: number;
      taxableAmount: number;
      exemptAmount: number;
      transactionCount: number;
    }>();

    for (const tx of transactions) {
      const summary = tx.jurisdictionSummary as any[];

      if (!summary || !Array.isArray(summary)) {
        continue;
      }

      for (const juris of summary) {
        const key = `${juris.region}-${juris.jurisType}-${juris.jurisName}`;

        if (!jurisdictionMap.has(key)) {
          jurisdictionMap.set(key, {
            jurisdiction: {
              state: juris.region,
              jurisType: juris.jurisType,
              jurisName: juris.jurisName,
            },
            taxCollected: 0,
            taxableAmount: 0,
            exemptAmount: 0,
            transactionCount: 0,
            filingFrequency: this.getFilingFrequency(juris.region),
            dueDate: this.calculateDueDate(juris.region, endDate),
          });
        }

        const report = jurisdictionMap.get(key)!;
        report.taxCollected += Number(juris.tax || 0);
        report.taxableAmount += Number(juris.taxable || 0);
        report.exemptAmount += Number(juris.exemption || 0);
        report.transactionCount++;

        // Aggregate by state
        const state = juris.region;
        if (!stateMap.has(state)) {
          stateMap.set(state, {
            taxCollected: 0,
            taxableAmount: 0,
            exemptAmount: 0,
            transactionCount: 0,
          });
        }

        const stateData = stateMap.get(state)!;
        stateData.taxCollected += Number(juris.tax || 0);
        stateData.taxableAmount += Number(juris.taxable || 0);
        stateData.exemptAmount += Number(juris.exemption || 0);
        stateData.transactionCount++;
      }
    }

    const byState = Object.fromEntries(stateMap);
    const byJurisdiction = Array.from(jurisdictionMap.values());

    const totalTaxCollected = byJurisdiction.reduce((sum, j) => sum + j.taxCollected, 0);
    const totalTaxableAmount = byJurisdiction.reduce((sum, j) => sum + j.taxableAmount, 0);
    const totalExemptAmount = byJurisdiction.reduce((sum, j) => sum + j.exemptAmount, 0);

    this.logger.log(
      `Generated filing report: ${transactions.length} transactions, $${totalTaxCollected.toFixed(2)} tax collected`,
    );

    return {
      startDate,
      endDate,
      totalTaxCollected,
      totalTaxableAmount,
      totalExemptAmount,
      transactionCount: transactions.length,
      byState,
      byJurisdiction,
    };
  }

  /**
   * Generate monthly filing report
   */
  async generateMonthlyReport(orgId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return await this.generateFilingReport(orgId, startDate, endDate);
  }

  /**
   * Generate quarterly filing report
   */
  async generateQuarterlyReport(orgId: string, year: number, quarter: number) {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);

    return await this.generateFilingReport(orgId, startDate, endDate);
  }

  /**
   * Generate annual filing report
   */
  async generateAnnualReport(orgId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return await this.generateFilingReport(orgId, startDate, endDate);
  }

  /**
   * Export for Avalara automated filing
   */
  async exportForAvalaraFiling(
    orgId: string,
    year: number,
    month: number,
  ): Promise<AvalaraFilingExport> {
    const report = await this.generateMonthlyReport(orgId, year, month);

    const filings = report.byJurisdiction.map(juris => ({
      jurisdiction: `${juris.jurisdiction.state}-${juris.jurisdiction.jurisName}`,
      taxCollected: juris.taxCollected,
      taxableAmount: juris.taxableAmount,
      exemptAmount: juris.exemptAmount,
      transactionCount: juris.transactionCount,
      transactions: [] as any[], // Populated separately if needed
    }));

    // Fetch transaction details if needed
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.prisma.taxTransaction.findMany({
      where: {
        orgId,
        status: TransactionStatus.COMMITTED,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        transactionCode: true,
        transactionDate: true,
        customerCode: true,
        totalAmount: true,
        totalTax: true,
        documentType: true,
        jurisdictionSummary: true,
      },
    });

    // Group transactions by jurisdiction
    for (const tx of transactions) {
      const summary = tx.jurisdictionSummary as any[];
      if (!summary || !Array.isArray(summary)) continue;

      for (const juris of summary) {
        const jurisdictionKey = `${juris.region}-${juris.jurisName}`;
        const filing = filings.find(f => f.jurisdiction === jurisdictionKey);

        if (filing) {
          filing.transactions.push({
            transactionCode: tx.transactionCode,
            transactionDate: tx.transactionDate.toISOString().split('T')[0],
            customerCode: tx.customerCode,
            totalAmount: Number(tx.totalAmount),
            totalTax: Number(juris.tax || 0),
            documentType: tx.documentType,
          });
        }
      }
    }

    this.logger.log(`Exported Avalara filing data for ${year}-${month}`);

    return {
      period: {
        year,
        month,
        quarter: Math.ceil(month / 3),
      },
      filings,
    };
  }

  /**
   * Get upcoming filing deadlines
   */
  async getUpcomingFilingDeadlines(orgId: string, daysAhead: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    // Get all active nexus states
    const nexusStates = await this.prisma.taxNexus.findMany({
      where: {
        orgId,
        status: 'ACTIVE',
      },
    });

    const deadlines = nexusStates.map(nexus => {
      const frequency = this.getFilingFrequency(nexus.state);
      const nextDueDate = this.calculateNextDueDate(nexus.state, today);

      return {
        state: nexus.state,
        filingFrequency: frequency,
        nextDueDate,
        daysUntilDue: Math.ceil(
          (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        ),
      };
    }).filter(d => d.nextDueDate <= futureDate);

    this.logger.debug(`Found ${deadlines.length} upcoming filing deadlines`);

    return deadlines.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  }

  /**
   * Track tax collected for nexus monitoring
   */
  async trackTaxForNexus(orgId: string, state: string, taxAmount: number, saleAmount: number) {
    const nexus = await this.prisma.taxNexus.findUnique({
      where: {
        orgId_state: { orgId, state },
      },
    });

    if (nexus) {
      await this.prisma.taxNexus.update({
        where: {
          orgId_state: { orgId, state },
        },
        data: {
          currentSales: {
            increment: saleAmount,
          },
          currentTransactions: {
            increment: 1,
          },
        },
      });
    }
  }

  /**
   * Private helper methods
   */

  private emptyPeriodSummary(startDate: Date, endDate: Date): TaxPeriodSummary {
    return {
      startDate,
      endDate,
      totalTaxCollected: 0,
      totalTaxableAmount: 0,
      totalExemptAmount: 0,
      transactionCount: 0,
      byState: {},
      byJurisdiction: [],
    };
  }

  private getFilingFrequency(state: string): string {
    // State-specific filing frequencies
    const monthlyStates = ['CA', 'NY', 'TX', 'FL'];
    const quarterlyStates = ['WA', 'OR', 'NV', 'AZ'];

    if (monthlyStates.includes(state)) {
      return 'monthly';
    } else if (quarterlyStates.includes(state)) {
      return 'quarterly';
    }
    return 'monthly'; // Default
  }

  private calculateDueDate(state: string, periodEndDate: Date): Date {
    // Most states: 20th of the following month
    const dueDate = new Date(periodEndDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(20);

    // State-specific adjustments
    if (state === 'CA') {
      dueDate.setDate(15); // California is 15th
    } else if (state === 'TX') {
      dueDate.setDate(20); // Texas is 20th
    }

    return dueDate;
  }

  private calculateNextDueDate(state: string, fromDate: Date): Date {
    const frequency = this.getFilingFrequency(state);
    const nextPeriodEnd = new Date(fromDate);

    if (frequency === 'monthly') {
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
      nextPeriodEnd.setDate(0); // Last day of current month
    } else if (frequency === 'quarterly') {
      const currentQuarter = Math.floor(nextPeriodEnd.getMonth() / 3);
      nextPeriodEnd.setMonth((currentQuarter + 1) * 3);
      nextPeriodEnd.setDate(0); // Last day of quarter
    }

    return this.calculateDueDate(state, nextPeriodEnd);
  }
}
