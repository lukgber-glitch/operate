/**
 * ATO Integration Helper Functions
 *
 * Utility functions for ATO data formatting and validation
 */

/**
 * Format ABN for display (XX XXX XXX XXX)
 */
export function formatAbn(abn: string): string {
  const cleaned = abn.replace(/\s/g, '');
  if (cleaned.length !== 11) {
    return abn;
  }
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
}

/**
 * Format TFN for display (XXX XXX XXX)
 */
export function formatTfn(tfn: string): string {
  const cleaned = tfn.replace(/\s/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
  } else if (cleaned.length === 8) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)}`;
  }
  return tfn;
}

/**
 * Calculate Australian financial year from date
 * Financial year runs from 1 July to 30 June
 */
export function getFinancialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-indexed

  if (month >= 7) {
    // July onwards is next financial year
    return `${year}-${year + 1}`;
  } else {
    // Jan-June is current financial year
    return `${year - 1}-${year}`;
  }
}

/**
 * Get current Australian financial year
 */
export function getCurrentFinancialYear(): string {
  return getFinancialYear(new Date());
}

/**
 * Get BAS quarter from date
 * Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
 */
export function getBasQuarter(date: Date): string {
  const month = date.getMonth() + 1;

  if (month >= 7 && month <= 9) {
    return 'Q1';
  } else if (month >= 10 && month <= 12) {
    return 'Q2';
  } else if (month >= 1 && month <= 3) {
    return 'Q3';
  } else {
    return 'Q4';
  }
}

/**
 * Get BAS period string from date
 */
export function getBasPeriod(date: Date, periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (periodType === 'MONTHLY') {
    return `${year}-${month.toString().padStart(2, '0')}`;
  } else if (periodType === 'QUARTERLY') {
    const quarter = getBasQuarter(date);
    const fyYear = month >= 7 ? year : year - 1;
    return `${fyYear}-${quarter}`;
  } else {
    // Annual
    return month >= 7 ? year.toString() : (year - 1).toString();
  }
}

/**
 * Calculate BAS due date
 */
export function getBasDueDate(period: string, periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'): Date {
  if (periodType === 'MONTHLY') {
    const [year, month] = period.split('-').map(Number);
    // Due 21st of following month
    const dueMonth = month === 12 ? 1 : month + 1;
    const dueYear = month === 12 ? year + 1 : year;
    return new Date(dueYear, dueMonth - 1, 21);
  } else if (periodType === 'QUARTERLY') {
    const [year, quarter] = period.split('-');
    const quarterNum = parseInt(quarter.replace('Q', ''));

    // Due 28th of month following quarter
    const dueMonths = {
      1: 10, // Q1 (Jul-Sep) due 28 Oct
      2: 2,  // Q2 (Oct-Dec) due 28 Feb
      3: 4,  // Q3 (Jan-Mar) due 28 Apr
      4: 7,  // Q4 (Apr-Jun) due 28 Jul
    };

    const dueMonth = dueMonths[quarterNum];
    const dueYear = quarterNum === 1 ? parseInt(year) : parseInt(year) + 1;

    return new Date(dueYear, dueMonth - 1, 28);
  } else {
    // Annual - due 31 October following financial year
    const year = parseInt(period);
    return new Date(year + 1, 9, 31); // October (month 9)
  }
}

/**
 * Calculate STP finalisation due date (14 July)
 */
export function getStpFinalisationDueDate(financialYear: string): Date {
  const [startYear, endYear] = financialYear.split('-').map(Number);
  return new Date(endYear, 6, 14); // 14 July (month 6)
}

/**
 * Calculate TPAR due date (28 August)
 */
export function getTparDueDate(financialYear: string): Date {
  const [startYear, endYear] = financialYear.split('-').map(Number);
  return new Date(endYear, 7, 28); // 28 August (month 7)
}

/**
 * Check if date is overdue
 */
export function isOverdue(dueDate: Date): boolean {
  return new Date() > dueDate;
}

/**
 * Calculate days until due date
 */
export function daysUntilDue(dueDate: Date): number {
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format Australian currency
 */
export function formatAud(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

/**
 * Validate ABN checksum
 * ABN checksum validation using weighted sum algorithm
 */
export function validateAbnChecksum(abn: string): boolean {
  const cleaned = abn.replace(/\s/g, '');

  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;

  // Subtract 1 from first digit
  const firstDigit = parseInt(cleaned[0]) - 1;
  sum += firstDigit * weights[0];

  // Process remaining digits
  for (let i = 1; i < 11; i++) {
    sum += parseInt(cleaned[i]) * weights[i];
  }

  // ABN is valid if sum is divisible by 89
  return sum % 89 === 0;
}

/**
 * Calculate superannuation guarantee percentage
 * Returns current SG rate (11.5% as of 2024-25)
 */
export function getSuperGuaranteeRate(date: Date): number {
  const year = date.getFullYear();

  // SG rates over time
  if (year >= 2025) return 0.12;    // 12% from 2025-26
  if (year >= 2024) return 0.115;   // 11.5% from 2024-25
  if (year >= 2023) return 0.11;    // 11% from 2023-24
  if (year >= 2022) return 0.105;   // 10.5% from 2022-23
  if (year >= 2021) return 0.10;    // 10% from 2021-22

  return 0.095; // 9.5% historical
}

/**
 * Calculate superannuation guarantee amount
 */
export function calculateSuperGuarantee(ordinaryTimeEarnings: number, date: Date): number {
  const rate = getSuperGuaranteeRate(date);
  return Math.round(ordinaryTimeEarnings * rate * 100) / 100;
}

/**
 * Get Australian state name from code
 */
export function getStateName(code: string): string {
  const states = {
    NSW: 'New South Wales',
    VIC: 'Victoria',
    QLD: 'Queensland',
    SA: 'South Australia',
    WA: 'Western Australia',
    TAS: 'Tasmania',
    NT: 'Northern Territory',
    ACT: 'Australian Capital Territory',
  };

  return states[code.toUpperCase()] || code;
}

/**
 * Validate Australian postcode for state
 */
export function isValidPostcodeForState(postcode: string, state: string): boolean {
  const ranges = {
    NSW: { min: 2000, max: 2999 },
    ACT: { min: 2600, max: 2639 },
    VIC: { min: 3000, max: 3999 },
    QLD: { min: 4000, max: 4999 },
    SA: { min: 5000, max: 5999 },
    WA: { min: 6000, max: 6999 },
    TAS: { min: 7000, max: 7999 },
    NT: { min: 800, max: 899 },
  };

  const code = parseInt(postcode);
  const range = ranges[state.toUpperCase()];

  if (!range) return false;

  return code >= range.min && code <= range.max;
}

/**
 * Calculate tax-free threshold amount
 * Returns annual tax-free threshold
 */
export function getTaxFreeThreshold(financialYear: string): number {
  // Tax-free threshold is $18,200 per annum
  return 18200;
}

/**
 * Format period for display
 */
export function formatPeriod(period: string, periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'): string {
  if (periodType === 'MONTHLY') {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  } else if (periodType === 'QUARTERLY') {
    const [year, quarter] = period.split('-');
    return `${quarter} ${year}-${parseInt(year) + 1}`;
  } else {
    // Annual/Financial year
    return `${period}-${parseInt(period) + 1}`;
  }
}

/**
 * Generate unique filing reference
 */
export function generateFilingReference(type: 'BAS' | 'STP' | 'TPAR'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`.toUpperCase();
}
