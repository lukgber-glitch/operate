import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { addDays, addMonths, setDate, startOfMonth, endOfMonth, format, startOfYear, endOfYear } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  TaxDeadline,
  TaxDeadlineStatus,
  TaxFilingFrequency,
  OrganizationTaxSettings,
  TaxCalendarFilters,
} from './types';

/**
 * Tax Calendar Service
 * Generates automatic tax calendars based on organization country and tax obligations
 */
@Injectable()
export class TaxCalendarService {
  private readonly logger = new Logger(TaxCalendarService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all tax deadlines for an organization
   */
  async getDeadlines(organizationId: string, year?: number): Promise<TaxDeadline[]> {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organizationId },
      select: {
        country: true,
        vatNumber: true,
        settings: true,
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    const targetYear = year || new Date().getFullYear();
    const deadlines: TaxDeadline[] = [];

    // Parse tax settings from org.settings JSON
    const settings = (org.settings as Prisma.InputJsonValue) || {};
    const taxSettings: OrganizationTaxSettings = {
      country: org.country,
      taxFilingFrequency: settings.taxFilingFrequency || 'quarterly',
      vatRegistered: !!org.vatNumber,
      vatNumber: org.vatNumber || undefined,
    };

    switch (org.country) {
      case 'DE':
        deadlines.push(...this.getGermanDeadlines(organizationId, targetYear, taxSettings));
        break;
      case 'AT':
        deadlines.push(...this.getAustrianDeadlines(organizationId, targetYear, taxSettings));
        break;
      case 'GB':
      case 'UK':
        deadlines.push(...this.getUKDeadlines(organizationId, targetYear, taxSettings));
        break;
      default:
        this.logger.warn(`No specific tax calendar for country: ${org.country}, using generic deadlines`);
        deadlines.push(...this.getGenericDeadlines(organizationId, targetYear, taxSettings));
    }

    // Enrich with completion status from database
    return this.enrichWithCompletionStatus(organizationId, deadlines);
  }

  /**
   * Get upcoming deadlines within N days
   */
  async getUpcomingDeadlines(organizationId: string, days: number = 30): Promise<TaxDeadline[]> {
    const allDeadlines = await this.getDeadlines(organizationId);
    const now = new Date();
    const cutoff = addDays(now, days);

    return allDeadlines
      .filter(d => d.dueDate >= now && d.dueDate <= cutoff && d.status !== 'completed')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Get overdue deadlines
   */
  async getOverdueDeadlines(organizationId: string): Promise<TaxDeadline[]> {
    const allDeadlines = await this.getDeadlines(organizationId);
    const now = new Date();

    return allDeadlines
      .filter(d => d.dueDate < now && d.status !== 'completed')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Get deadlines by filters
   */
  async getDeadlinesByFilters(
    organizationId: string,
    filters: TaxCalendarFilters,
  ): Promise<TaxDeadline[]> {
    let deadlines = await this.getDeadlines(organizationId, filters.year);

    if (filters.type) {
      deadlines = deadlines.filter(d => d.type === filters.type);
    }

    if (filters.status) {
      deadlines = deadlines.filter(d => d.status === filters.status);
    }

    if (filters.country) {
      deadlines = deadlines.filter(d => d.country === filters.country);
    }

    return deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * German tax deadlines (EÜR system)
   */
  private getGermanDeadlines(
    orgId: string,
    year: number,
    settings: OrganizationTaxSettings,
  ): TaxDeadline[] {
    const deadlines: TaxDeadline[] = [];
    const frequency = settings.taxFilingFrequency || 'quarterly';

    // VAT returns (Umsatzsteuer-Voranmeldung)
    if (settings.vatRegistered !== false) {
      if (frequency === 'monthly') {
        // Monthly VAT - due by 10th of following month
        for (let month = 1; month <= 12; month++) {
          const periodEnd = endOfMonth(new Date(year, month - 1));
          const dueDate = new Date(year, month, 10); // 10th of next month

          deadlines.push({
            id: `vat-${year}-${month.toString().padStart(2, '0')}`,
            type: 'vat_return',
            title: `USt-Voranmeldung ${format(periodEnd, 'MMMM yyyy', { locale: de })}`,
            description: `Monatliche Umsatzsteuer-Voranmeldung für ${format(periodEnd, 'MMMM yyyy', { locale: de })}`,
            dueDate,
            periodStart: startOfMonth(new Date(year, month - 1)),
            periodEnd,
            country: 'DE',
            filingType: 'monthly',
            status: this.getDeadlineStatus(dueDate),
            reminderDays: [14, 7, 3, 1],
            actionUrl: '/tax/elster',
          });
        }
      } else {
        // Quarterly VAT
        const quarters = [
          { q: 1, months: [1, 2, 3], due: new Date(year, 3, 10) }, // Q1: Jan-Mar, due Apr 10
          { q: 2, months: [4, 5, 6], due: new Date(year, 6, 10) }, // Q2: Apr-Jun, due Jul 10
          { q: 3, months: [7, 8, 9], due: new Date(year, 9, 10) }, // Q3: Jul-Sep, due Oct 10
          { q: 4, months: [10, 11, 12], due: new Date(year + 1, 0, 10) }, // Q4: Oct-Dec, due Jan 10
        ];

        quarters.forEach(({ q, months, due }) => {
          deadlines.push({
            id: `vat-${year}-Q${q}`,
            type: 'vat_return',
            title: `USt-Voranmeldung Q${q} ${year}`,
            description: `Quartalsmäßige Umsatzsteuer-Voranmeldung für Q${q} ${year}`,
            dueDate: due,
            periodStart: new Date(year, months[0] - 1, 1),
            periodEnd: endOfMonth(new Date(year, months[2] - 1)),
            country: 'DE',
            filingType: 'quarterly',
            status: this.getDeadlineStatus(due),
            reminderDays: [14, 7, 3, 1],
            actionUrl: '/tax/elster',
          });
        });
      }

      // Annual VAT return (Umsatzsteuerjahreserklärung)
      deadlines.push({
        id: `vat-annual-${year}`,
        type: 'vat_return',
        title: `Umsatzsteuerjahreserklärung ${year}`,
        description: `Jährliche Umsatzsteuererklärung für ${year}`,
        dueDate: new Date(year + 1, 6, 31), // July 31 of following year
        periodStart: startOfYear(new Date(year, 0, 1)),
        periodEnd: endOfYear(new Date(year, 0, 1)),
        country: 'DE',
        filingType: 'yearly',
        status: this.getDeadlineStatus(new Date(year + 1, 6, 31)),
        reminderDays: [60, 30, 14, 7],
        actionUrl: '/tax/elster',
      });
    }

    // Income tax prepayments (Einkommensteuer-Vorauszahlung)
    const prepaymentDates = [
      { q: 'Q1', date: new Date(year, 2, 10) }, // March 10
      { q: 'Q2', date: new Date(year, 5, 10) }, // June 10
      { q: 'Q3', date: new Date(year, 8, 10) }, // September 10
      { q: 'Q4', date: new Date(year, 11, 10) }, // December 10
    ];

    prepaymentDates.forEach(({ q, date }) => {
      deadlines.push({
        id: `income-prepay-${year}-${q}`,
        type: 'prepayment',
        title: `ESt-Vorauszahlung ${q} ${year}`,
        description: `Einkommensteuer-Vorauszahlung für ${q} ${year}`,
        dueDate: date,
        country: 'DE',
        filingType: 'quarterly',
        status: this.getDeadlineStatus(date),
        reminderDays: [14, 7, 3, 1],
      });
    });

    // Annual tax return (Einkommensteuererklärung)
    deadlines.push({
      id: `annual-return-${year}`,
      type: 'annual_return',
      title: `Einkommensteuererklärung ${year}`,
      description: `Jährliche Einkommensteuererklärung für ${year}`,
      dueDate: new Date(year + 1, 6, 31), // July 31 of following year
      periodStart: startOfYear(new Date(year, 0, 1)),
      periodEnd: endOfYear(new Date(year, 0, 1)),
      country: 'DE',
      filingType: 'yearly',
      status: this.getDeadlineStatus(new Date(year + 1, 6, 31)),
      reminderDays: [90, 60, 30, 14, 7],
      actionUrl: '/tax/annual',
    });

    // Trade tax prepayments (Gewerbesteuer-Vorauszahlung)
    prepaymentDates.forEach(({ q, date }) => {
      deadlines.push({
        id: `trade-tax-prepay-${year}-${q}`,
        type: 'prepayment',
        title: `GewSt-Vorauszahlung ${q} ${year}`,
        description: `Gewerbesteuer-Vorauszahlung für ${q} ${year}`,
        dueDate: date,
        country: 'DE',
        filingType: 'quarterly',
        status: this.getDeadlineStatus(date),
        reminderDays: [14, 7, 3, 1],
      });
    });

    return deadlines;
  }

  /**
   * Austrian tax deadlines
   */
  private getAustrianDeadlines(
    orgId: string,
    year: number,
    settings: OrganizationTaxSettings,
  ): TaxDeadline[] {
    const deadlines: TaxDeadline[] = [];
    const frequency = settings.taxFilingFrequency || 'quarterly';

    // VAT returns (Umsatzsteuervoranmeldung - UVA)
    if (settings.vatRegistered !== false) {
      if (frequency === 'monthly') {
        // Monthly VAT - due by 15th of following month
        for (let month = 1; month <= 12; month++) {
          const periodEnd = endOfMonth(new Date(year, month - 1));
          const dueDate = new Date(year, month, 15); // 15th of next month

          deadlines.push({
            id: `vat-${year}-${month.toString().padStart(2, '0')}`,
            type: 'vat_return',
            title: `UVA ${format(periodEnd, 'MMMM yyyy', { locale: de })}`,
            description: `Monatliche Umsatzsteuervoranmeldung für ${format(periodEnd, 'MMMM yyyy', { locale: de })}`,
            dueDate,
            periodStart: startOfMonth(new Date(year, month - 1)),
            periodEnd,
            country: 'AT',
            filingType: 'monthly',
            status: this.getDeadlineStatus(dueDate),
            reminderDays: [14, 7, 3, 1],
            actionUrl: '/tax/finanzonline',
          });
        }
      } else {
        // Quarterly VAT - due by 15th of month after quarter
        const quarters = [
          { q: 1, months: [1, 2, 3], due: new Date(year, 3, 15) },
          { q: 2, months: [4, 5, 6], due: new Date(year, 6, 15) },
          { q: 3, months: [7, 8, 9], due: new Date(year, 9, 15) },
          { q: 4, months: [10, 11, 12], due: new Date(year + 1, 0, 15) },
        ];

        quarters.forEach(({ q, months, due }) => {
          deadlines.push({
            id: `vat-${year}-Q${q}`,
            type: 'vat_return',
            title: `UVA Q${q} ${year}`,
            description: `Quartalsmäßige Umsatzsteuervoranmeldung für Q${q} ${year}`,
            dueDate: due,
            periodStart: new Date(year, months[0] - 1, 1),
            periodEnd: endOfMonth(new Date(year, months[2] - 1)),
            country: 'AT',
            filingType: 'quarterly',
            status: this.getDeadlineStatus(due),
            reminderDays: [14, 7, 3, 1],
            actionUrl: '/tax/finanzonline',
          });
        });
      }

      // Annual VAT return (Umsatzsteuerjahreserklärung)
      deadlines.push({
        id: `vat-annual-${year}`,
        type: 'vat_return',
        title: `Umsatzsteuerjahreserklärung ${year}`,
        description: `Jährliche Umsatzsteuererklärung für ${year}`,
        dueDate: new Date(year + 1, 5, 30), // June 30 of following year
        periodStart: startOfYear(new Date(year, 0, 1)),
        periodEnd: endOfYear(new Date(year, 0, 1)),
        country: 'AT',
        filingType: 'yearly',
        status: this.getDeadlineStatus(new Date(year + 1, 5, 30)),
        reminderDays: [60, 30, 14, 7],
        actionUrl: '/tax/finanzonline',
      });
    }

    // Income tax prepayments (Einkommensteuervorauszahlung)
    const prepaymentDates = [
      { q: 'Q1', date: new Date(year, 1, 15) }, // February 15
      { q: 'Q2', date: new Date(year, 4, 15) }, // May 15
      { q: 'Q3', date: new Date(year, 7, 15) }, // August 15
      { q: 'Q4', date: new Date(year, 10, 15) }, // November 15
    ];

    prepaymentDates.forEach(({ q, date }) => {
      deadlines.push({
        id: `income-prepay-${year}-${q}`,
        type: 'prepayment',
        title: `ESt-Vorauszahlung ${q} ${year}`,
        description: `Einkommensteuervorauszahlung für ${q} ${year}`,
        dueDate: date,
        country: 'AT',
        filingType: 'quarterly',
        status: this.getDeadlineStatus(date),
        reminderDays: [14, 7, 3, 1],
      });
    });

    // Annual tax return (Einkommensteuererklärung)
    deadlines.push({
      id: `annual-return-${year}`,
      type: 'annual_return',
      title: `Einkommensteuererklärung ${year}`,
      description: `Jährliche Einkommensteuererklärung für ${year}`,
      dueDate: new Date(year + 1, 5, 30), // June 30 of following year
      periodStart: startOfYear(new Date(year, 0, 1)),
      periodEnd: endOfYear(new Date(year, 0, 1)),
      country: 'AT',
      filingType: 'yearly',
      status: this.getDeadlineStatus(new Date(year + 1, 5, 30)),
      reminderDays: [90, 60, 30, 14, 7],
      actionUrl: '/tax/annual',
    });

    return deadlines;
  }

  /**
   * UK tax deadlines
   */
  private getUKDeadlines(
    orgId: string,
    year: number,
    settings: OrganizationTaxSettings,
  ): TaxDeadline[] {
    const deadlines: TaxDeadline[] = [];

    // VAT returns (quarterly for most businesses)
    if (settings.vatRegistered !== false) {
      const quarters = [
        { q: 1, months: [1, 2, 3], due: new Date(year, 4, 7) }, // Jan-Mar, due May 7
        { q: 2, months: [4, 5, 6], due: new Date(year, 7, 7) }, // Apr-Jun, due Aug 7
        { q: 3, months: [7, 8, 9], due: new Date(year, 10, 7) }, // Jul-Sep, due Nov 7
        { q: 4, months: [10, 11, 12], due: new Date(year + 1, 1, 7) }, // Oct-Dec, due Feb 7
      ];

      quarters.forEach(({ q, months, due }) => {
        deadlines.push({
          id: `vat-${year}-Q${q}`,
          type: 'vat_return',
          title: `VAT Return Q${q} ${year}`,
          description: `Quarterly VAT return for Q${q} ${year}`,
          dueDate: due,
          periodStart: new Date(year, months[0] - 1, 1),
          periodEnd: endOfMonth(new Date(year, months[2] - 1)),
          country: 'GB',
          filingType: 'quarterly',
          status: this.getDeadlineStatus(due),
          reminderDays: [14, 7, 3, 1],
          actionUrl: '/tax/mtd-vat',
        });
      });
    }

    // Self Assessment tax return (UK tax year: April 6 to April 5)
    deadlines.push({
      id: `self-assessment-${year}`,
      type: 'annual_return',
      title: `Self Assessment Tax Return ${year - 1}/${year}`,
      description: `Annual Self Assessment for tax year ${year - 1}/${year}`,
      dueDate: new Date(year + 1, 0, 31), // January 31 following year
      periodStart: new Date(year, 3, 6), // April 6
      periodEnd: new Date(year + 1, 3, 5), // April 5 following year
      country: 'GB',
      filingType: 'yearly',
      status: this.getDeadlineStatus(new Date(year + 1, 0, 31)),
      reminderDays: [90, 60, 30, 14, 7],
      actionUrl: '/tax/self-assessment',
    });

    return deadlines;
  }

  /**
   * Generic deadlines for other countries
   */
  private getGenericDeadlines(
    orgId: string,
    year: number,
    settings: OrganizationTaxSettings,
  ): TaxDeadline[] {
    const deadlines: TaxDeadline[] = [];

    // Generic quarterly VAT returns
    if (settings.vatRegistered !== false) {
      const quarters = [
        { q: 1, months: [1, 2, 3], due: new Date(year, 3, 15) },
        { q: 2, months: [4, 5, 6], due: new Date(year, 6, 15) },
        { q: 3, months: [7, 8, 9], due: new Date(year, 9, 15) },
        { q: 4, months: [10, 11, 12], due: new Date(year + 1, 0, 15) },
      ];

      quarters.forEach(({ q, months, due }) => {
        deadlines.push({
          id: `vat-${year}-Q${q}`,
          type: 'vat_return',
          title: `VAT Return Q${q} ${year}`,
          description: `Quarterly VAT return for Q${q} ${year}`,
          dueDate: due,
          periodStart: new Date(year, months[0] - 1, 1),
          periodEnd: endOfMonth(new Date(year, months[2] - 1)),
          country: settings.country,
          filingType: 'quarterly',
          status: this.getDeadlineStatus(due),
          reminderDays: [14, 7, 3, 1],
        });
      });
    }

    // Generic annual tax return
    deadlines.push({
      id: `annual-return-${year}`,
      type: 'annual_return',
      title: `Annual Tax Return ${year}`,
      description: `Annual income tax return for ${year}`,
      dueDate: new Date(year + 1, 3, 30), // April 30 of following year
      periodStart: startOfYear(new Date(year, 0, 1)),
      periodEnd: endOfYear(new Date(year, 0, 1)),
      country: settings.country,
      filingType: 'yearly',
      status: this.getDeadlineStatus(new Date(year + 1, 3, 30)),
      reminderDays: [90, 60, 30, 14, 7],
    });

    return deadlines;
  }

  /**
   * Determine deadline status based on due date
   */
  private getDeadlineStatus(dueDate: Date): TaxDeadlineStatus {
    const now = new Date();
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'due_soon';
    return 'upcoming';
  }

  /**
   * Enrich deadlines with completion status from database
   */
  private async enrichWithCompletionStatus(
    orgId: string,
    deadlines: TaxDeadline[],
  ): Promise<TaxDeadline[]> {
    // Check for completed ELSTER filings
    const elsterFilings = await this.prisma.elsterFiling.findMany({
      where: {
        organisationId: orgId,
        status: 'submitted',
      },
      select: {
        taxType: true,
        taxYear: true,
        taxPeriod: true,
        submittedAt: true,
      },
    });

    // Map ELSTER filings to deadline IDs
    const completedDeadlineIds = new Set<string>();

    elsterFilings.forEach(filing => {
      if (filing.taxType === 'USt' || filing.taxType === 'UVA') {
        // VAT filing
        if (filing.taxPeriod) {
          const periodMatch = filing.taxPeriod.match(/Q(\d)/);
          if (periodMatch) {
            const quarter = periodMatch[1];
            completedDeadlineIds.add(`vat-${filing.taxYear}-Q${quarter}`);
          } else {
            // Monthly period
            completedDeadlineIds.add(`vat-${filing.taxYear}-${filing.taxPeriod}`);
          }
        }
      } else if (filing.taxType === 'ESt') {
        // Income tax
        completedDeadlineIds.add(`annual-return-${filing.taxYear}`);
      }
    });

    // Mark deadlines as completed
    return deadlines.map(deadline => {
      if (completedDeadlineIds.has(deadline.id)) {
        return {
          ...deadline,
          status: 'completed' as TaxDeadlineStatus,
        };
      }
      return deadline;
    });
  }
}
