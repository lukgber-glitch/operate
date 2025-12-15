/**
 * Indian Fiscal Year Configuration
 * Handles Financial Year (FY) and Assessment Year (AY) for India
 */

/**
 * Financial Year in India runs from April 1 to March 31
 * Assessment Year is the year following the Financial Year
 * Example: FY 2023-24 (Apr 1, 2023 - Mar 31, 2024) -> AY 2024-25
 */

export interface FiscalYear {
  financialYear: string; // e.g., "2023-24"
  assessmentYear: string; // e.g., "2024-25"
  startDate: Date;
  endDate: Date;
  year: number; // Starting year (e.g., 2023 for FY 2023-24)
}

export interface FiscalQuarter {
  quarter: number; // 1-4
  name: string; // "Q1", "Q2", "Q3", "Q4"
  startDate: Date;
  endDate: Date;
  financialYear: string;
}

export interface GSTReturnPeriod {
  type: 'monthly' | 'quarterly';
  period: string; // "Apr-2024", "Q1-2024"
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  financialYear: string;
}

/**
 * Get the current Financial Year
 */
export function getCurrentFinancialYear(): FiscalYear {
  const now = new Date();
  return getFinancialYearForDate(now);
}

/**
 * Get Financial Year for a specific date
 */
export function getFinancialYearForDate(date: Date): FiscalYear {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11

  // If month is Jan-Mar (0-2), FY started previous year
  // If month is Apr-Dec (3-11), FY started current year
  const fyStartYear = month < 3 ? year - 1 : year;

  return {
    financialYear: `${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`,
    assessmentYear: `${fyStartYear + 1}-${(fyStartYear + 2).toString().slice(-2)}`,
    startDate: new Date(fyStartYear, 3, 1), // April 1
    endDate: new Date(fyStartYear + 1, 2, 31), // March 31
    year: fyStartYear,
  };
}

/**
 * Get Financial Year by year
 * @param year - Starting year of FY (e.g., 2023 for FY 2023-24)
 */
export function getFinancialYear(year: number): FiscalYear {
  return {
    financialYear: `${year}-${(year + 1).toString().slice(-2)}`,
    assessmentYear: `${year + 1}-${(year + 2).toString().slice(-2)}`,
    startDate: new Date(year, 3, 1), // April 1
    endDate: new Date(year + 1, 2, 31), // March 31
    year,
  };
}

/**
 * Get Assessment Year from Financial Year
 * @param financialYear - e.g., "2023-24"
 * @returns Assessment Year - e.g., "2024-25"
 */
export function getAssessmentYear(financialYear: string): string {
  const [startYear] = financialYear.split('-').map(Number);
  const year = startYear ?? 0;
  return `${year + 1}-${(year + 2).toString().slice(-2)}`;
}

/**
 * Get Financial Year from Assessment Year
 * @param assessmentYear - e.g., "2024-25"
 * @returns Financial Year - e.g., "2023-24"
 */
export function getFinancialYearFromAY(assessmentYear: string): string {
  const [startYear] = assessmentYear.split('-').map(Number);
  const year = startYear ?? 0;
  return `${year - 1}-${year.toString().slice(-2)}`;
}

/**
 * Get all quarters for a Financial Year
 */
export function getQuarters(financialYear: string): FiscalQuarter[] {
  const [startYear] = financialYear.split('-').map(Number);
  const year = startYear ?? 0;

  return [
    {
      quarter: 1,
      name: 'Q1',
      startDate: new Date(year, 3, 1), // Apr 1
      endDate: new Date(year, 5, 30), // Jun 30
      financialYear,
    },
    {
      quarter: 2,
      name: 'Q2',
      startDate: new Date(year, 6, 1), // Jul 1
      endDate: new Date(year, 8, 30), // Sep 30
      financialYear,
    },
    {
      quarter: 3,
      name: 'Q3',
      startDate: new Date(year, 9, 1), // Oct 1
      endDate: new Date(year, 11, 31), // Dec 31
      financialYear,
    },
    {
      quarter: 4,
      name: 'Q4',
      startDate: new Date(year + 1, 0, 1), // Jan 1
      endDate: new Date(year + 1, 2, 31), // Mar 31
      financialYear,
    },
  ];
}

/**
 * Get the quarter for a specific date
 */
export function getQuarterForDate(date: Date): FiscalQuarter {
  const fy = getFinancialYearForDate(date);
  const quarters = getQuarters(fy.financialYear);
  const firstQuarter = quarters[0];

  return quarters.find(
    (q) => date >= q.startDate && date <= q.endDate
  ) ?? firstQuarter!;
}

/**
 * Check if a date is in a specific Financial Year
 */
export function isDateInFinancialYear(date: Date, financialYear: string): boolean {
  const yearStr = financialYear.split('-')[0] ?? '0';
  const fy = getFinancialYear(parseInt(yearStr, 10));
  return date >= fy.startDate && date <= fy.endDate;
}

/**
 * Get GST return periods (monthly)
 * GST returns are filed monthly (GSTR-1, GSTR-3B)
 */
export function getMonthlyGSTReturnPeriods(financialYear: string): GSTReturnPeriod[] {
  const [startYearRaw] = financialYear.split('-').map(Number);
  const startYear = startYearRaw ?? 0;
  const periods: GSTReturnPeriod[] = [];

  const months = [
    { name: 'Apr', month: 3 },
    { name: 'May', month: 4 },
    { name: 'Jun', month: 5 },
    { name: 'Jul', month: 6 },
    { name: 'Aug', month: 7 },
    { name: 'Sep', month: 8 },
    { name: 'Oct', month: 9 },
    { name: 'Nov', month: 10 },
    { name: 'Dec', month: 11 },
    { name: 'Jan', month: 0, nextYear: true },
    { name: 'Feb', month: 1, nextYear: true },
    { name: 'Mar', month: 2, nextYear: true },
  ];

  months.forEach(({ name, month, nextYear }) => {
    const year = nextYear ? startYear + 1 : startYear;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month

    // Due date is typically 20th of next month for GSTR-3B, 11th for GSTR-1
    const dueDate = new Date(year, month + 1, 20);

    periods.push({
      type: 'monthly',
      period: `${name}-${year}`,
      startDate,
      endDate,
      dueDate,
      financialYear,
    });
  });

  return periods;
}

/**
 * Get GST return periods (quarterly) - for composition scheme
 * Composition dealers file quarterly returns
 */
export function getQuarterlyGSTReturnPeriods(financialYear: string): GSTReturnPeriod[] {
  const quarters = getQuarters(financialYear);

  return quarters.map((q) => {
    // Due date is 18th of month following the quarter
    const dueDate = new Date(q.endDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(18);

    return {
      type: 'quarterly',
      period: `Q${q.quarter}-${q.financialYear}`,
      startDate: q.startDate,
      endDate: q.endDate,
      dueDate,
      financialYear: q.financialYear,
    };
  });
}

/**
 * Get current GST return period
 */
export function getCurrentGSTReturnPeriod(
  type: 'monthly' | 'quarterly' = 'monthly'
): GSTReturnPeriod {
  const now = new Date();
  const fy = getCurrentFinancialYear();

  if (type === 'monthly') {
    const periods = getMonthlyGSTReturnPeriods(fy.financialYear);
    const firstPeriod = periods[0];
    // Return previous month's period (since current month is not yet complete)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return periods.find(
      (p) => previousMonth >= p.startDate && previousMonth <= p.endDate
    ) ?? firstPeriod!;
  } else {
    const quarter = getQuarterForDate(now);
    const periods = getQuarterlyGSTReturnPeriods(fy.financialYear);
    const firstPeriod = periods[0];
    return periods.find((p) => p.period === `Q${quarter.quarter}-${fy.financialYear}`) ?? firstPeriod!;
  }
}

/**
 * Important Indian fiscal dates
 */
export const INDIAN_FISCAL_DATES = {
  // Financial Year
  fyStart: { month: 3, day: 1 }, // April 1
  fyEnd: { month: 2, day: 31 }, // March 31

  // Income Tax Return filing deadlines
  itr_individual_deadline: { month: 6, day: 31 }, // July 31
  itr_audit_deadline: { month: 9, day: 31 }, // October 31 (for audited accounts)

  // Advance Tax Payment dates
  advance_tax_q1: { month: 5, day: 15 }, // June 15 (15% of tax)
  advance_tax_q2: { month: 8, day: 15 }, // September 15 (45% cumulative)
  advance_tax_q3: { month: 11, day: 15 }, // December 15 (75% cumulative)
  advance_tax_q4: { month: 2, day: 15 }, // March 15 (100%)

  // TDS Return filing deadlines (quarterly)
  tds_q1_deadline: { month: 6, day: 31 }, // July 31 (for Apr-Jun)
  tds_q2_deadline: { month: 9, day: 31 }, // October 31 (for Jul-Sep)
  tds_q3_deadline: { month: 0, day: 31 }, // January 31 (for Oct-Dec, next year)
  tds_q4_deadline: { month: 4, day: 31 }, // May 31 (for Jan-Mar)

  // GST deadlines (vary by turnover)
  gst_gstr1_monthly: { day: 11 }, // 11th of next month
  gst_gstr3b_monthly: { day: 20 }, // 20th of next month
  gst_gstr1_quarterly: { day: 13 }, // 13th of month after quarter
  gst_cmp08_quarterly: { day: 18 }, // 18th of month after quarter (composition)

  // Annual GST return
  gst_gstr9_annual: { month: 11, day: 31 }, // December 31 of next FY
} as const;

/**
 * Check if current date is in a specific quarter
 */
export function isCurrentQuarter(quarter: FiscalQuarter): boolean {
  const now = new Date();
  return now >= quarter.startDate && now <= quarter.endDate;
}

/**
 * Get days remaining in current Financial Year
 */
export function getDaysRemainingInFY(): number {
  const now = new Date();
  const fy = getCurrentFinancialYear();
  const diff = fy.endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get days elapsed in current Financial Year
 */
export function getDaysElapsedInFY(): number {
  const now = new Date();
  const fy = getCurrentFinancialYear();
  const diff = now.getTime() - fy.startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format Financial Year for display
 */
export function formatFinancialYear(fy: string): string {
  return `FY ${fy}`;
}

/**
 * Format Assessment Year for display
 */
export function formatAssessmentYear(ay: string): string {
  return `AY ${ay}`;
}

/**
 * Parse Financial Year string (e.g., "2023-24" or "FY 2023-24")
 */
export function parseFinancialYear(fyString: string): number {
  const cleaned = fyString.replace(/[^0-9-]/g, '');
  const [startYear] = cleaned.split('-').map(Number);
  return startYear ?? 0;
}

/**
 * Get previous Financial Year
 */
export function getPreviousFinancialYear(fy?: string): FiscalYear {
  const current = fy ? parseFinancialYear(fy) : getCurrentFinancialYear().year;
  return getFinancialYear(current - 1);
}

/**
 * Get next Financial Year
 */
export function getNextFinancialYear(fy?: string): FiscalYear {
  const current = fy ? parseFinancialYear(fy) : getCurrentFinancialYear().year;
  return getFinancialYear(current + 1);
}

/**
 * Get list of Financial Years (for dropdowns)
 * @param count - Number of years to return
 * @param startFrom - Year to start from (default: current FY)
 */
export function getFinancialYearsList(count: number = 5, startFrom?: number): FiscalYear[] {
  const startYear = startFrom || getCurrentFinancialYear().year;
  const years: FiscalYear[] = [];

  for (let i = 0; i < count; i++) {
    years.push(getFinancialYear(startYear - i));
  }

  return years;
}
