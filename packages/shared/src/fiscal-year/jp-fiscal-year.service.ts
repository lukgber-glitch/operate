/**
 * Japanese Fiscal Year Service
 * Handles Japanese fiscal year calculations (April 1 - March 31)
 */

import { toJapaneseYear, formatJapaneseDate, JapaneseYear } from './japanese-era';

export interface FiscalYearPeriod {
  fiscalYear: number; // The fiscal year number
  startDate: Date;
  endDate: Date;
  japaneseYear?: JapaneseYear;
  formatted: string; // e.g., "2024年度" or "令和6年度"
}

export interface FiscalYearConfig {
  /**
   * Starting month of fiscal year (1-12)
   * Default: 4 (April) for Japan
   */
  startMonth?: number;

  /**
   * Use Japanese era naming
   * Default: true
   */
  useJapaneseEra?: boolean;

  /**
   * Fiscal year naming convention
   * 'start' - Use the year when fiscal year starts (default for Japan)
   * 'end' - Use the year when fiscal year ends
   */
  yearNamingConvention?: 'start' | 'end';
}

export class JapaneseFiscalYearService {
  private readonly config: Required<FiscalYearConfig>;

  constructor(config: FiscalYearConfig = {}) {
    this.config = {
      startMonth: config.startMonth ?? 4, // April
      useJapaneseEra: config.useJapaneseEra ?? true,
      yearNamingConvention: config.yearNamingConvention ?? 'start',
    };
  }

  /**
   * Get fiscal year for a given date
   */
  getFiscalYear(date: Date = new Date()): FiscalYearPeriod {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed to 1-indexed

    // Determine fiscal year
    let fiscalYear: number;
    if (month >= this.config.startMonth) {
      // We're in the fiscal year that started this calendar year
      fiscalYear =
        this.config.yearNamingConvention === 'start' ? year : year + 1;
    } else {
      // We're in the fiscal year that started last calendar year
      fiscalYear =
        this.config.yearNamingConvention === 'start' ? year - 1 : year;
    }

    // Calculate start and end dates
    const { startDate, endDate } = this.getFiscalYearDates(fiscalYear);

    // Get Japanese era year if enabled
    let japaneseYear: JapaneseYear | undefined;
    if (this.config.useJapaneseEra) {
      japaneseYear =
        toJapaneseYear(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          startDate.getDate()
        ) || undefined;
    }

    // Format fiscal year
    const formatted = this.formatFiscalYear(fiscalYear, japaneseYear);

    return {
      fiscalYear,
      startDate,
      endDate,
      japaneseYear,
      formatted,
    };
  }

  /**
   * Get start and end dates for a specific fiscal year
   */
  getFiscalYearDates(fiscalYear: number): {
    startDate: Date;
    endDate: Date;
  } {
    let startYear: number;
    if (this.config.yearNamingConvention === 'start') {
      startYear = fiscalYear;
    } else {
      startYear = fiscalYear - 1;
    }

    const startDate = new Date(
      startYear,
      this.config.startMonth - 1,
      1,
      0,
      0,
      0,
      0
    );

    // End date is one day before next fiscal year starts
    const endDate = new Date(startYear + 1, this.config.startMonth - 1, 0, 23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * Format fiscal year according to configuration
   */
  private formatFiscalYear(
    fiscalYear: number,
    japaneseYear?: JapaneseYear
  ): string {
    if (this.config.useJapaneseEra && japaneseYear) {
      return `${japaneseYear.eraNameJa}${japaneseYear.eraYear}年度`;
    }
    return `${fiscalYear}年度`;
  }

  /**
   * Get current fiscal year
   */
  getCurrentFiscalYear(): FiscalYearPeriod {
    return this.getFiscalYear(new Date());
  }

  /**
   * Get fiscal year for a specific year number
   */
  getFiscalYearByNumber(fiscalYear: number): FiscalYearPeriod {
    const { startDate, endDate } = this.getFiscalYearDates(fiscalYear);

    let japaneseYear: JapaneseYear | undefined;
    if (this.config.useJapaneseEra) {
      japaneseYear =
        toJapaneseYear(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          startDate.getDate()
        ) || undefined;
    }

    const formatted = this.formatFiscalYear(fiscalYear, japaneseYear);

    return {
      fiscalYear,
      startDate,
      endDate,
      japaneseYear,
      formatted,
    };
  }

  /**
   * Get previous fiscal year
   */
  getPreviousFiscalYear(date: Date = new Date()): FiscalYearPeriod {
    const current = this.getFiscalYear(date);
    return this.getFiscalYearByNumber(current.fiscalYear - 1);
  }

  /**
   * Get next fiscal year
   */
  getNextFiscalYear(date: Date = new Date()): FiscalYearPeriod {
    const current = this.getFiscalYear(date);
    return this.getFiscalYearByNumber(current.fiscalYear + 1);
  }

  /**
   * Get fiscal quarters for a fiscal year
   */
  getFiscalQuarters(fiscalYear: number): FiscalYearPeriod[] {
    const { startDate } = this.getFiscalYearDates(fiscalYear);
    const quarters: FiscalYearPeriod[] = [];

    for (let q = 0; q < 4; q++) {
      const qStartDate = new Date(startDate);
      qStartDate.setMonth(startDate.getMonth() + q * 3);

      const qEndDate = new Date(qStartDate);
      qEndDate.setMonth(qStartDate.getMonth() + 3);
      qEndDate.setDate(0); // Last day of previous month
      qEndDate.setHours(23, 59, 59, 999);

      let japaneseYear: JapaneseYear | undefined;
      if (this.config.useJapaneseEra) {
        japaneseYear =
          toJapaneseYear(
            qStartDate.getFullYear(),
            qStartDate.getMonth() + 1,
            qStartDate.getDate()
          ) || undefined;
      }

      quarters.push({
        fiscalYear,
        startDate: qStartDate,
        endDate: qEndDate,
        japaneseYear,
        formatted: `${this.formatFiscalYear(fiscalYear, japaneseYear)} Q${q + 1}`,
      });
    }

    return quarters;
  }

  /**
   * Get fiscal months for a fiscal year
   */
  getFiscalMonths(fiscalYear: number): FiscalYearPeriod[] {
    const { startDate } = this.getFiscalYearDates(fiscalYear);
    const months: FiscalYearPeriod[] = [];

    for (let m = 0; m < 12; m++) {
      const mStartDate = new Date(startDate);
      mStartDate.setMonth(startDate.getMonth() + m);

      const mEndDate = new Date(mStartDate);
      mEndDate.setMonth(mStartDate.getMonth() + 1);
      mEndDate.setDate(0); // Last day of month
      mEndDate.setHours(23, 59, 59, 999);

      let japaneseYear: JapaneseYear | undefined;
      if (this.config.useJapaneseEra) {
        japaneseYear =
          toJapaneseYear(
            mStartDate.getFullYear(),
            mStartDate.getMonth() + 1,
            mStartDate.getDate()
          ) || undefined;
      }

      months.push({
        fiscalYear,
        startDate: mStartDate,
        endDate: mEndDate,
        japaneseYear,
        formatted: `${this.formatFiscalYear(fiscalYear, japaneseYear)} ${mStartDate.getMonth() + 1}月`,
      });
    }

    return months;
  }

  /**
   * Check if a date is within a fiscal year
   */
  isDateInFiscalYear(date: Date, fiscalYear: number): boolean {
    const { startDate, endDate } = this.getFiscalYearDates(fiscalYear);
    return date >= startDate && date <= endDate;
  }

  /**
   * Get the number of days in a fiscal year
   */
  getFiscalYearDays(fiscalYear: number): number {
    const { startDate, endDate } = this.getFiscalYearDates(fiscalYear);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Get the number of business days in a fiscal year (excluding weekends)
   */
  getFiscalYearBusinessDays(fiscalYear: number): number {
    const { startDate, endDate } = this.getFiscalYearDates(fiscalYear);
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Format date range for fiscal year
   */
  formatFiscalYearRange(fiscalYear: number, locale: string = 'ja-JP'): string {
    const { startDate, endDate } = this.getFiscalYearDates(fiscalYear);

    if (locale === 'ja-JP' && this.config.useJapaneseEra) {
      const startFormatted = formatJapaneseDate(startDate, 'full');
      const endFormatted = formatJapaneseDate(endDate, 'full');
      return `${startFormatted} 〜 ${endFormatted}`;
    }

    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
  }

  /**
   * Get fiscal year progress (0-1)
   */
  getFiscalYearProgress(date: Date = new Date()): number {
    const fiscalYear = this.getFiscalYear(date);
    const { startDate, endDate } = fiscalYear;

    const totalTime = endDate.getTime() - startDate.getTime();
    const elapsedTime = date.getTime() - startDate.getTime();

    return Math.max(0, Math.min(1, elapsedTime / totalTime));
  }
}

/**
 * Create a standard Japanese fiscal year service (April-March)
 */
export function createStandardJapaneseFiscalYear(): JapaneseFiscalYearService {
  return new JapaneseFiscalYearService({
    startMonth: 4, // April
    useJapaneseEra: true,
    yearNamingConvention: 'start',
  });
}

/**
 * Create a custom fiscal year service
 */
export function createCustomFiscalYear(
  config: FiscalYearConfig
): JapaneseFiscalYearService {
  return new JapaneseFiscalYearService(config);
}
