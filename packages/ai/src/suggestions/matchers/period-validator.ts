/**
 * Period Validator
 *
 * Validates tax period relevance for deductions
 */

/**
 * Check if transaction date is within tax year
 */
export function isWithinTaxYear(
  transactionDate: Date,
  taxYear: number,
  fiscalYearStart: string = '01-01',
): boolean {
  const [month, day] = fiscalYearStart.split('-').map(Number);

  if (month === undefined || day === undefined) {
    throw new Error('Invalid fiscal year start format');
  }

  // Create fiscal year start and end dates
  const fiscalStart = new Date(taxYear, month - 1, day);
  const fiscalEnd = new Date(taxYear + 1, month - 1, day - 1);

  return transactionDate >= fiscalStart && transactionDate <= fiscalEnd;
}

/**
 * Get tax year from transaction date
 */
export function getTaxYear(
  transactionDate: Date,
  fiscalYearStart: string = '01-01',
): number {
  const [month, day] = fiscalYearStart.split('-').map(Number);

  if (month === undefined || day === undefined) {
    throw new Error('Invalid fiscal year start format');
  }

  const transYear = transactionDate.getFullYear();
  const transMonth = transactionDate.getMonth() + 1;
  const transDay = transactionDate.getDate();

  // If transaction is before fiscal year start, it belongs to previous tax year
  if (transMonth < month || (transMonth === month && transDay < day)) {
    return transYear - 1;
  }

  return transYear;
}

/**
 * Check if deduction is still claimable
 */
export function isClaimable(
  transactionDate: Date,
  currentDate: Date = new Date(),
  yearsAllowed: number = 4,
): boolean {
  const yearsDiff = currentDate.getFullYear() - transactionDate.getFullYear();
  return yearsDiff <= yearsAllowed;
}

/**
 * Get fiscal year start date
 */
export function getFiscalYearStart(
  taxYear: number,
  fiscalYearStart: string = '01-01',
): Date {
  const [month, day] = fiscalYearStart.split('-').map(Number);

  if (month === undefined || day === undefined) {
    throw new Error('Invalid fiscal year start format');
  }

  return new Date(taxYear, month - 1, day);
}

/**
 * Get fiscal year end date
 */
export function getFiscalYearEnd(
  taxYear: number,
  fiscalYearStart: string = '01-01',
): Date {
  const [month, day] = fiscalYearStart.split('-').map(Number);

  if (month === undefined || day === undefined) {
    throw new Error('Invalid fiscal year start format');
  }

  return new Date(taxYear + 1, month - 1, day - 1);
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date, referenceDate: Date = new Date()): boolean {
  return date > referenceDate;
}

/**
 * Get quarter from date
 */
export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

/**
 * Get month name
 */
export function getMonthName(date: Date, locale: string = 'de-DE'): string {
  return date.toLocaleDateString(locale, { month: 'long' });
}

/**
 * Format date range
 */
export function formatDateRange(
  startDate: Date,
  endDate: Date,
  locale: string = 'de-DE',
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}
