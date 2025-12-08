/**
 * Tax Deadline Service
 * Tracks tax deadlines by country and generates proactive reminders
 *
 * Features:
 * - Multi-country tax deadline registry
 * - Upcoming deadline tracking
 * - Proactive reminder generation (30, 14, 7, 3, 1 days before)
 * - Priority-based notifications
 * - Integration with TaxCalendarService for dynamic deadline calculation
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { addDays, differenceInDays, startOfDay } from 'date-fns';
import { TaxDeadline, UpcomingDeadline, TaxReminder, CountryDeadlines, ReminderPriority } from './types';

@Injectable()
export class TaxDeadlineService {
  private readonly logger = new Logger(TaxDeadlineService.name);

  // Tax deadline registry by country
  private readonly deadlines: CountryDeadlines = {
    DE: [
      {
        type: 'VAT_ADVANCE',
        name: 'USt-Voranmeldung',
        schedule: 'MONTHLY',
        dayOfMonth: 10,
        description: 'Monthly VAT advance return due by the 10th of following month',
      },
      {
        type: 'VAT_QUARTERLY',
        name: 'USt-Voranmeldung (Quarterly)',
        schedule: 'QUARTERLY',
        dayOfMonth: 10,
        description: 'Quarterly VAT advance return due by the 10th after quarter end',
      },
      {
        type: 'ANNUAL_RETURN',
        name: 'Jahreserklärung',
        schedule: 'ANNUAL',
        month: 7,
        day: 31,
        description: 'Annual tax return due July 31 of following year',
      },
      {
        type: 'ANNUAL_VAT',
        name: 'Umsatzsteuerjahreserklärung',
        schedule: 'ANNUAL',
        month: 7,
        day: 31,
        description: 'Annual VAT return due July 31 of following year',
      },
    ],
    AT: [
      {
        type: 'VAT_ADVANCE',
        name: 'Umsatzsteuervoranmeldung (UVA)',
        schedule: 'MONTHLY',
        dayOfMonth: 15,
        description: 'Monthly VAT advance return due by the 15th of following month',
      },
      {
        type: 'VAT_QUARTERLY',
        name: 'UVA (Quarterly)',
        schedule: 'QUARTERLY',
        dayOfMonth: 15,
        description: 'Quarterly VAT advance return due by the 15th after quarter end',
      },
      {
        type: 'ANNUAL_VAT',
        name: 'Umsatzsteuerjahreserklärung',
        schedule: 'ANNUAL',
        month: 6,
        day: 30,
        description: 'Annual VAT return due June 30 of following year',
      },
      {
        type: 'ANNUAL_RETURN',
        name: 'Einkommensteuererklärung',
        schedule: 'ANNUAL',
        month: 6,
        day: 30,
        description: 'Annual income tax return due June 30 of following year',
      },
    ],
    UK: [
      {
        type: 'VAT_RETURN',
        name: 'VAT Return',
        schedule: 'QUARTERLY',
        daysAfterPeriod: 37,
        description: 'VAT return due 1 month + 7 days after quarter end',
      },
      {
        type: 'SELF_ASSESSMENT',
        name: 'Self Assessment',
        schedule: 'ANNUAL',
        month: 1,
        day: 31,
        description: 'Self Assessment tax return due January 31',
      },
    ],
    GB: [
      {
        type: 'VAT_RETURN',
        name: 'VAT Return',
        schedule: 'QUARTERLY',
        daysAfterPeriod: 37,
        description: 'VAT return due 1 month + 7 days after quarter end',
      },
      {
        type: 'SELF_ASSESSMENT',
        name: 'Self Assessment',
        schedule: 'ANNUAL',
        month: 1,
        day: 31,
        description: 'Self Assessment tax return due January 31',
      },
    ],
    US: [
      {
        type: 'ESTIMATED_TAX',
        name: 'Quarterly Estimated Tax',
        schedule: 'QUARTERLY',
        quarters: [
          { month: 4, day: 15 }, // April 15
          { month: 6, day: 15 }, // June 15
          { month: 9, day: 15 }, // September 15
          { month: 1, day: 15 }, // January 15 (next year)
        ],
        description: 'Quarterly estimated tax payment',
      },
      {
        type: 'ANNUAL_RETURN',
        name: 'Annual Tax Return',
        schedule: 'ANNUAL',
        month: 4,
        day: 15,
        description: 'Annual tax return due April 15',
      },
    ],
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get upcoming deadlines for an organization
   * @param orgId Organization ID
   * @param daysAhead Number of days to look ahead (default: 30)
   * @returns Array of upcoming deadlines with days remaining
   */
  async getUpcomingDeadlines(
    orgId: string,
    daysAhead: number = 30,
  ): Promise<UpcomingDeadline[]> {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      select: { country: true, settings: true, vatNumber: true },
    });

    if (!org?.country) {
      this.logger.warn(`Organization ${orgId} has no country code set`);
      return [];
    }

    // Map country code variations (UK/GB, etc.)
    const countryCode = org.country === 'UK' ? 'GB' : org.country;
    const countryDeadlines = this.deadlines[countryCode];

    if (!countryDeadlines) {
      this.logger.debug(`No deadline rules for country: ${countryCode}`);
      return [];
    }

    // Parse organization settings
    const settings = (org.settings as Prisma.InputJsonValue) || {};
    const taxFilingFrequency = settings.taxFilingFrequency || 'quarterly';
    const isVatRegistered = !!org.vatNumber;

    const upcoming: UpcomingDeadline[] = [];
    const now = startOfDay(new Date());
    const futureLimit = addDays(now, daysAhead);

    for (const deadline of countryDeadlines) {
      // Skip VAT deadlines if not VAT registered
      if (
        (deadline.type.includes('VAT') || deadline.type.includes('USt') || deadline.type.includes('UVA')) &&
        !isVatRegistered
      ) {
        continue;
      }

      // Filter by filing frequency
      if (deadline.schedule === 'MONTHLY' && taxFilingFrequency !== 'monthly') {
        continue;
      }

      const nextDue = this.calculateNextDueDate(deadline, now);

      if (nextDue && nextDue >= now && nextDue <= futureLimit) {
        const daysRemaining = differenceInDays(nextDue, now);
        upcoming.push({
          ...deadline,
          dueDate: nextDue,
          daysRemaining,
        });
      }
    }

    return upcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Generate tax deadline reminders for an organization
   * Checks for deadlines at key intervals: 30, 14, 7, 3, 1 days before
   * @param orgId Organization ID
   * @returns Array of tax reminders to be shown/sent
   */
  async generateReminders(orgId: string): Promise<TaxReminder[]> {
    const reminders: TaxReminder[] = [];
    const reminderDays = [30, 14, 7, 3, 1];

    // Get upcoming deadlines for next 31 days
    const upcoming = await this.getUpcomingDeadlines(orgId, 31);

    for (const deadline of upcoming) {
      // Only generate reminders at specific day intervals
      if (reminderDays.includes(deadline.daysRemaining)) {
        const priority = this.getPriority(deadline.daysRemaining);

        reminders.push({
          type: 'TAX_DEADLINE',
          priority,
          title: this.getReminderTitle(deadline),
          description: deadline.description,
          dueDate: deadline.dueDate,
          actionUrl: this.getActionUrl(deadline.type),
          daysRemaining: deadline.daysRemaining,
        });
      }
    }

    return reminders;
  }

  /**
   * Get all deadlines for a specific country
   * @param countryCode ISO country code (DE, AT, UK, US, etc.)
   * @returns Array of deadline definitions
   */
  getDeadlinesByCountry(countryCode: string): TaxDeadline[] {
    const normalizedCode = countryCode === 'UK' ? 'GB' : countryCode;
    return this.deadlines[normalizedCode] || [];
  }

  /**
   * Calculate the next due date for a deadline rule
   * @param deadline Deadline definition
   * @param fromDate Calculate from this date (default: today)
   * @returns Next due date or null if cannot be calculated
   */
  private calculateNextDueDate(deadline: TaxDeadline, fromDate: Date = new Date()): Date | null {
    const now = startOfDay(fromDate);
    const currentYear = now.getFullYear();

    if (deadline.schedule === 'ANNUAL') {
      if (deadline.month && deadline.day) {
        // Annual deadline with specific date (e.g., July 31)
        let dueDate = new Date(currentYear, deadline.month - 1, deadline.day);

        // If the date has passed this year, use next year
        if (dueDate < now) {
          dueDate = new Date(currentYear + 1, deadline.month - 1, deadline.day);
        }

        return dueDate;
      }
    } else if (deadline.schedule === 'QUARTERLY') {
      if (deadline.quarters) {
        // US-style quarterly deadlines with specific dates
        const quarterDates = deadline.quarters.map(q => {
          let year = currentYear;
          // January deadline is for previous year's Q4
          if (q.month === 1) {
            year = currentYear + 1;
          }
          return new Date(year, q.month - 1, q.day);
        });

        // Find next upcoming quarter deadline
        const nextQuarter = quarterDates.find(d => d >= now);
        return nextQuarter || quarterDates[0]; // If all passed, return first of next year
      } else if (deadline.dayOfMonth) {
        // European-style quarterly (10th/15th after quarter end)
        const quarters = [
          { end: new Date(currentYear, 2, 31), dueMonth: 3 }, // Q1: Jan-Mar, due Apr
          { end: new Date(currentYear, 5, 30), dueMonth: 6 }, // Q2: Apr-Jun, due Jul
          { end: new Date(currentYear, 8, 30), dueMonth: 8 }, // Q3: Jul-Sep, due Oct
          { end: new Date(currentYear, 11, 31), dueMonth: 0 }, // Q4: Oct-Dec, due Jan+1
        ];

        for (const q of quarters) {
          let year = currentYear;
          let month = q.dueMonth;

          // Q4 due date is in next year
          if (month === 0) {
            year = currentYear + 1;
          }

          const dueDate = new Date(year, month, deadline.dayOfMonth);

          if (dueDate >= now) {
            return dueDate;
          }
        }

        // If all quarters passed, return Q1 of next year
        return new Date(currentYear + 1, 3, deadline.dayOfMonth);
      } else if (deadline.daysAfterPeriod) {
        // UK-style (37 days after quarter end)
        const quarters = [
          new Date(currentYear, 2, 31), // Q1 end: Mar 31
          new Date(currentYear, 5, 30), // Q2 end: Jun 30
          new Date(currentYear, 8, 30), // Q3 end: Sep 30
          new Date(currentYear, 11, 31), // Q4 end: Dec 31
        ];

        for (const quarterEnd of quarters) {
          const dueDate = addDays(quarterEnd, deadline.daysAfterPeriod);
          if (dueDate >= now) {
            return dueDate;
          }
        }

        // If all passed, use Q1 of next year
        const nextYearQ1End = new Date(currentYear + 1, 2, 31);
        return addDays(nextYearQ1End, deadline.daysAfterPeriod);
      }
    } else if (deadline.schedule === 'MONTHLY') {
      if (deadline.dayOfMonth) {
        // Monthly deadline (e.g., 10th of following month)
        const currentMonth = now.getMonth();
        let dueMonth = currentMonth + 1;
        let dueYear = currentYear;

        // Handle year rollover
        if (dueMonth > 11) {
          dueMonth = 0;
          dueYear = currentYear + 1;
        }

        const dueDate = new Date(dueYear, dueMonth, deadline.dayOfMonth);

        // If due date has passed, use next month
        if (dueDate < now) {
          dueMonth += 1;
          if (dueMonth > 11) {
            dueMonth = 0;
            dueYear += 1;
          }
          return new Date(dueYear, dueMonth, deadline.dayOfMonth);
        }

        return dueDate;
      }
    }

    return null;
  }

  /**
   * Determine priority based on days remaining
   * @param daysRemaining Days until deadline
   * @returns Priority level
   */
  private getPriority(daysRemaining: number): ReminderPriority {
    if (daysRemaining <= 3) return 'HIGH';
    if (daysRemaining <= 7) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate user-friendly reminder title
   * @param deadline Deadline with days remaining
   * @returns Formatted title string
   */
  private getReminderTitle(deadline: UpcomingDeadline): string {
    const days = deadline.daysRemaining;
    const dayText = days === 1 ? 'day' : 'days';

    if (days === 0) {
      return `${deadline.name} due TODAY`;
    } else if (days === 1) {
      return `${deadline.name} due TOMORROW`;
    } else {
      return `${deadline.name} due in ${days} ${dayText}`;
    }
  }

  /**
   * Get action URL based on deadline type
   * @param type Deadline type
   * @returns Frontend route for action
   */
  private getActionUrl(type: string): string {
    if (type.includes('VAT') || type.includes('USt') || type.includes('UVA')) {
      return '/tax/vat-return';
    } else if (type.includes('ELSTER')) {
      return '/tax/elster';
    } else if (type.includes('ANNUAL')) {
      return '/tax/annual-return';
    } else if (type.includes('ESTIMATED')) {
      return '/tax/estimated';
    } else if (type.includes('SELF_ASSESSMENT')) {
      return '/tax/self-assessment';
    }

    return '/tax/filings';
  }

  /**
   * Get summary statistics for an organization's tax deadlines
   * @param orgId Organization ID
   * @returns Summary object with counts and next deadline
   */
  async getDeadlineSummary(orgId: string): Promise<{
    total: number;
    upcoming: number;
    urgent: number;
    nextDeadline?: UpcomingDeadline;
  }> {
    const upcoming = await this.getUpcomingDeadlines(orgId, 90);

    return {
      total: upcoming.length,
      upcoming: upcoming.filter(d => d.daysRemaining > 7).length,
      urgent: upcoming.filter(d => d.daysRemaining <= 7).length,
      nextDeadline: upcoming[0],
    };
  }
}
