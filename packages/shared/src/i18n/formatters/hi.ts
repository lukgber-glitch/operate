/**
 * Hindi (India) Locale Formatter
 * Handles date, number, currency formatting for Hindi language
 * Uses Indian numbering system (lakhs/crores)
 * Indian fiscal year: April 1 - March 31
 */

import { formatINR, formatIndianNumber, parseINR } from '../../currency/inr/inr.formatter';

/**
 * Hindi locale configuration
 */
export const HINDI_LOCALE = {
  code: 'hi',
  name: 'Hindi',
  nativeName: 'हिन्दी',
  country: 'IN',
  direction: 'ltr' as const,

  // Date and time formatting
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  dateTimeFormat: 'DD/MM/YYYY HH:mm',

  // Number formatting
  decimalSeparator: '.',
  thousandSeparator: ',',

  // Currency
  currency: 'INR',
  currencySymbol: '₹',
  currencyPosition: 'prefix' as const,

  // Numbering system
  numberingSystem: 'indian' as const, // Uses lakhs/crores

  // Fiscal year
  fiscalYearStart: { month: 4, day: 1 }, // April 1
  fiscalYearEnd: { month: 3, day: 31 },   // March 31
} as const;

/**
 * Hindi date format options
 */
export interface HindiDateOptions {
  /**
   * Format style: 'short', 'medium', 'long', 'full'
   * Default: 'medium'
   */
  format?: 'short' | 'medium' | 'long' | 'full';

  /**
   * Use Devanagari numerals
   * Default: false
   */
  useDevanagari?: boolean;

  /**
   * Include day of week
   * Default: false
   */
  includeDay?: boolean;
}

/**
 * Hindi number format options
 */
export interface HindiNumberOptions {
  /**
   * Number of decimal places
   * Default: 2
   */
  decimals?: number;

  /**
   * Use Indian numbering system (lakhs/crores)
   * Default: true
   */
  useIndianSystem?: boolean;

  /**
   * Use Devanagari numerals
   * Default: false
   */
  useDevanagari?: boolean;

  /**
   * Minimum number of digits
   * Default: 1
   */
  minDigits?: number;
}

/**
 * Format date in Hindi locale
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 *
 * @example
 * formatHindiDate(new Date('2024-12-03')) // "03/12/2024"
 * formatHindiDate(new Date('2024-12-03'), { format: 'long' }) // "३ दिसंबर २०२४"
 * formatHindiDate(new Date('2024-12-03'), { includeDay: true }) // "मंगलवार, 03/12/2024"
 */
export function formatHindiDate(date: Date, options: HindiDateOptions = {}): string {
  const { format = 'medium', useDevanagari = false, includeDay = false } = options;

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let formatted: string;

  switch (format) {
    case 'short':
      // DD/MM/YY
      formatted = `${padZero(day)}/${padZero(month)}/${year.toString().slice(-2)}`;
      break;

    case 'long':
      // D MMMM YYYY (e.g., "3 दिसंबर 2024")
      formatted = `${day} ${getHindiMonthName(month)} ${year}`;
      break;

    case 'full':
      // dddd, D MMMM YYYY (e.g., "मंगलवार, 3 दिसंबर 2024")
      const dayName = getHindiDayName(date.getDay());
      formatted = `${dayName}, ${day} ${getHindiMonthName(month)} ${year}`;
      break;

    case 'medium':
    default:
      // DD/MM/YYYY
      formatted = `${padZero(day)}/${padZero(month)}/${year}`;
      break;
  }

  // Convert to Devanagari numerals if requested
  if (useDevanagari && (format === 'long' || format === 'full')) {
    formatted = convertToDevanagariNumerals(formatted);
  }

  // Add day name if requested and not already included
  if (includeDay && format !== 'full') {
    const dayName = getHindiDayName(date.getDay());
    formatted = `${dayName}, ${formatted}`;
  }

  return formatted;
}

/**
 * Format time in Hindi locale (24-hour format)
 * @param date - Date object
 * @param options - Formatting options
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatHindiTime(date: Date, options: { useDevanagari?: boolean } = {}): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();

  let formatted = `${padZero(hours)}:${padZero(minutes)}`;

  if (options.useDevanagari) {
    formatted = convertToDevanagariNumerals(formatted);
  }

  return formatted;
}

/**
 * Format number in Hindi locale with Indian numbering system
 * @param num - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * formatHindiNumber(100000) // "1,00,000"
 * formatHindiNumber(100000, { useDevanagari: true }) // "१,००,०००"
 * formatHindiNumber(1234.56, { decimals: 2 }) // "1,234.56"
 */
export function formatHindiNumber(num: number, options: HindiNumberOptions = {}): string {
  const {
    decimals = 2,
    useIndianSystem = true,
    useDevanagari = false,
    minDigits = 1,
  } = options;

  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid number provided');
  }

  let formatted: string;

  if (useIndianSystem) {
    // Use Indian numbering system (lakhs/crores)
    formatted = formatIndianNumber(num, decimals);
  } else {
    // Use Western numbering system
    formatted = num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Ensure minimum digits
  if (minDigits > 1) {
    const [integerPart, decimalPart] = formatted.split('.');
    const paddedInteger = (integerPart ?? '0').replace(/,/g, '').padStart(minDigits, '0');
    formatted = decimalPart
      ? `${paddedInteger}.${decimalPart}`
      : paddedInteger;
  }

  // Convert to Devanagari numerals if requested
  if (useDevanagari) {
    formatted = convertToDevanagariNumerals(formatted);
  }

  return formatted;
}

/**
 * Format currency in Hindi locale (INR)
 * @param amount - Amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatHindiCurrency(100000) // "₹1,00,000.00"
 * formatHindiCurrency(100000, { useDevanagari: true }) // "₹१,००,०००.००"
 */
export function formatHindiCurrency(
  amount: number,
  options: {
    decimals?: number;
    useDevanagari?: boolean;
    includeSymbol?: boolean;
  } = {}
): string {
  const { decimals = 2, useDevanagari = false, includeSymbol = true } = options;

  return formatINR(amount, {
    decimals,
    useDevanagariNumerals: useDevanagari,
    includeSymbol,
  });
}

/**
 * Parse Hindi formatted number to number
 * @param value - Formatted number string
 * @returns Parsed number
 */
export function parseHindiNumber(value: string): number {
  if (!value || value.trim() === '') {
    return 0;
  }

  // Convert Devanagari numerals to Western if present
  let cleanValue = convertToWesternNumerals(value.trim());

  // Remove thousand separators and parse
  cleanValue = cleanValue.replace(/,/g, '');

  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse Hindi formatted currency to number
 * @param value - Formatted currency string
 * @returns Parsed amount
 */
export function parseHindiCurrency(value: string): number {
  return parseINR(value);
}

/**
 * Get fiscal year for a given date (India: April 1 - March 31)
 * @param date - Date to check
 * @returns Fiscal year string (e.g., "FY 2024-25")
 *
 * @example
 * getIndianFiscalYear(new Date('2024-05-15')) // "FY 2024-25"
 * getIndianFiscalYear(new Date('2024-01-15')) // "FY 2023-24"
 */
export function getIndianFiscalYear(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  if (month >= 4) {
    // April to December: FY starts this year
    return `FY ${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    // January to March: FY started last year
    return `FY ${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Get fiscal year in Hindi
 * @param date - Date to check
 * @returns Fiscal year string in Hindi
 */
export function getHindiFiscalYear(date: Date): string {
  const fy = getIndianFiscalYear(date);
  return `वित्तीय वर्ष ${fy.replace('FY ', '')}`;
}

/**
 * Get fiscal quarter for a given date (India)
 * Q1: April-June, Q2: July-September, Q3: October-December, Q4: January-March
 * @param date - Date to check
 * @returns Quarter information
 */
export function getIndianFiscalQuarter(date: Date): {
  quarter: number;
  label: string;
  labelHindi: string;
  startMonth: number;
  endMonth: number;
} {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  const month = date.getMonth() + 1; // 1-12

  if (month >= 4 && month <= 6) {
    return {
      quarter: 1,
      label: 'Q1 (Apr-Jun)',
      labelHindi: 'तिमाही 1 (अप्रैल-जून)',
      startMonth: 4,
      endMonth: 6,
    };
  } else if (month >= 7 && month <= 9) {
    return {
      quarter: 2,
      label: 'Q2 (Jul-Sep)',
      labelHindi: 'तिमाही 2 (जुलाई-सितंबर)',
      startMonth: 7,
      endMonth: 9,
    };
  } else if (month >= 10 && month <= 12) {
    return {
      quarter: 3,
      label: 'Q3 (Oct-Dec)',
      labelHindi: 'तिमाही 3 (अक्टूबर-दिसंबर)',
      startMonth: 10,
      endMonth: 12,
    };
  } else {
    return {
      quarter: 4,
      label: 'Q4 (Jan-Mar)',
      labelHindi: 'तिमाही 4 (जनवरी-मार्च)',
      startMonth: 1,
      endMonth: 3,
    };
  }
}

/**
 * Helper: Get Hindi month name
 */
function getHindiMonthName(month: number): string {
  const months = [
    'जनवरी',
    'फरवरी',
    'मार्च',
    'अप्रैल',
    'मई',
    'जून',
    'जुलाई',
    'अगस्त',
    'सितंबर',
    'अक्टूबर',
    'नवंबर',
    'दिसंबर',
  ];
  return months[month - 1] || '';
}

/**
 * Helper: Get Hindi day name
 */
function getHindiDayName(day: number): string {
  const days = [
    'रविवार',
    'सोमवार',
    'मंगलवार',
    'बुधवार',
    'गुरुवार',
    'शुक्रवार',
    'शनिवार',
  ];
  return days[day] || '';
}

/**
 * Helper: Pad number with zero
 */
function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Devanagari numerals mapping
 */
const DEVANAGARI_NUMERALS: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

/**
 * Helper: Convert Western numerals to Devanagari
 */
function convertToDevanagariNumerals(value: string): string {
  return value.replace(/[0-9]/g, (digit) => DEVANAGARI_NUMERALS[digit] || digit);
}

/**
 * Helper: Convert Devanagari numerals to Western
 */
function convertToWesternNumerals(value: string): string {
  let result = value;
  Object.entries(DEVANAGARI_NUMERALS).forEach(([western, devanagari]) => {
    result = result.replace(new RegExp(devanagari, 'g'), western);
  });
  return result;
}

/**
 * Validate date is within Indian fiscal year
 */
export function isWithinFiscalYear(date: Date, fiscalYear: string): boolean {
  const fy = getIndianFiscalYear(date);
  return fy === fiscalYear;
}

/**
 * Get start and end dates of fiscal year
 */
export function getFiscalYearDates(fiscalYear: string): {
  start: Date;
  end: Date;
} {
  // Parse "FY 2024-25" or "वित्तीय वर्ष 2024-25"
  const match = fiscalYear.match(/(\d{4})-(\d{2})/);
  if (!match?.[1] || !match[2]) {
    throw new Error('Invalid fiscal year format');
  }

  const startYear = parseInt(match[1], 10);
  const endYear = parseInt(`20${match[2]}`, 10);

  return {
    start: new Date(startYear, 3, 1), // April 1
    end: new Date(endYear, 2, 31),    // March 31
  };
}

/**
 * Export all formatting functions
 */
export default {
  HINDI_LOCALE,
  formatHindiDate,
  formatHindiTime,
  formatHindiNumber,
  formatHindiCurrency,
  parseHindiNumber,
  parseHindiCurrency,
  getIndianFiscalYear,
  getHindiFiscalYear,
  getIndianFiscalQuarter,
  isWithinFiscalYear,
  getFiscalYearDates,
};
