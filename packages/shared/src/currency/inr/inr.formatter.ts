/**
 * INR Currency Formatter
 * Handles Indian Rupee formatting with Indian numbering system (lakhs/crores)
 */

import {
  INR_CONSTANTS,
  DEVANAGARI_NUMERALS,
  INDIAN_NUMBER_NAMES,
  HINDI_NUMBER_NAMES,
} from './inr.constants';

export interface INRFormattingOptions {
  /**
   * Use Devanagari numerals (०१२३४५६७८९)
   * Default: false (uses Western numerals 0123456789)
   */
  useDevanagariNumerals?: boolean;

  /**
   * Include currency symbol
   * Default: true
   */
  includeSymbol?: boolean;

  /**
   * Use alternative symbol (Rs. instead of ₹)
   * Default: false
   */
  useAlternativeSymbol?: boolean;

  /**
   * Locale for number formatting
   * Default: 'en-IN'
   */
  locale?: string;

  /**
   * Number of decimal places to show
   * Default: 2
   */
  decimals?: number;
}

/**
 * Format number with Indian numbering system (lakhs/crores)
 * Pattern: 3 digits, then groups of 2
 * Example: 1,00,00,000 (1 crore)
 */
export function formatIndianNumber(num: number, decimals: number = 2): string {
  const [integerPart, decimalPart] = num.toFixed(decimals).split('.');

  // Reverse the integer part for easier grouping (integerPart always exists after toFixed)
  const reversed = (integerPart ?? '0').split('').reverse().join('');

  // First group of 3, then groups of 2
  const groups: string[] = [];
  let i = 0;

  // First group (rightmost) - 3 digits
  if (reversed.length > 0) {
    groups.push(reversed.slice(0, 3));
    i = 3;
  }

  // Remaining groups - 2 digits each
  while (i < reversed.length) {
    groups.push(reversed.slice(i, i + 2));
    i += 2;
  }

  // Reverse back and join with commas
  const formatted = groups
    .map((group) => group.split('').reverse().join(''))
    .reverse()
    .join(',');

  return decimals > 0 ? `${formatted}.${decimalPart}` : formatted;
}

/**
 * Format amount as INR currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted INR string (e.g., "₹1,00,000.00" or "₹१,००,०००.००")
 */
export function formatINR(amount: number, options: INRFormattingOptions = {}): string {
  const {
    useDevanagariNumerals = false,
    includeSymbol = true,
    useAlternativeSymbol = false,
    decimals = INR_CONSTANTS.decimalDigits,
  } = options;

  // Format with Indian numbering system
  let formatted = formatIndianNumber(Math.abs(amount), decimals);

  // Convert to Devanagari numerals if requested
  if (useDevanagariNumerals) {
    formatted = convertToDevanagariNumerals(formatted);
  }

  // Add negative sign if needed
  if (amount < 0) {
    formatted = '-' + formatted;
  }

  // Add currency symbol
  if (includeSymbol) {
    const symbol = useAlternativeSymbol
      ? INR_CONSTANTS.symbolAlt
      : INR_CONSTANTS.symbolNative;
    // INR symbol goes before the amount
    formatted = `${symbol}${formatted}`;
  }

  return formatted;
}

/**
 * Convert Western numerals to Devanagari numerals
 */
function convertToDevanagariNumerals(value: string): string {
  return value.replace(
    /[0-9]/g,
    (digit) => DEVANAGARI_NUMERALS[digit as keyof typeof DEVANAGARI_NUMERALS]
  );
}

/**
 * Convert Devanagari numerals to Western numerals
 */
function convertToWesternNumerals(value: string): string {
  let result = value;
  Object.entries(DEVANAGARI_NUMERALS).forEach(([western, devanagari]) => {
    result = result.replace(new RegExp(devanagari, 'g'), western);
  });
  return result;
}

/**
 * Parse INR formatted string to number
 * Supports both Western (1,00,000.00) and Devanagari (१,००,०००.००) numerals
 */
export function parseINR(value: string): number {
  if (!value || value.trim() === '') {
    return 0;
  }

  let cleanValue = value.trim();

  // Handle negative sign
  const isNegative = cleanValue.startsWith('-') || cleanValue.startsWith('−');
  if (isNegative) {
    cleanValue = cleanValue.substring(1);
  }

  // Convert Devanagari numerals to Western if present
  cleanValue = convertToWesternNumerals(cleanValue);

  // Remove currency symbols and separators
  cleanValue = cleanValue
    .replace(/[₹]/g, '')
    .replace(/Rs\.?/gi, '')
    .replace(/INR/gi, '')
    .replace(/[,\s]/g, '')
    .trim();

  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed * (isNegative ? -1 : 1);
}

/**
 * Format INR in compact form with Indian units
 * Examples: ₹1.5L (1.5 lakhs), ₹2.5Cr (2.5 crores)
 */
export function formatINRCompact(
  amount: number,
  useDevanagariNumerals: boolean = false
): string {
  const absAmount = Math.abs(amount);
  let formatted: string;
  let unit: string;

  if (absAmount >= INR_CONSTANTS.units.crore.value) {
    // Format in crores
    const crores = absAmount / INR_CONSTANTS.units.crore.value;
    formatted = crores.toFixed(crores >= 100 ? 0 : 1);
    unit = INR_CONSTANTS.units.crore.symbol;
  } else if (absAmount >= INR_CONSTANTS.units.lakh.value) {
    // Format in lakhs
    const lakhs = absAmount / INR_CONSTANTS.units.lakh.value;
    formatted = lakhs.toFixed(lakhs >= 100 ? 0 : 1);
    unit = INR_CONSTANTS.units.lakh.symbol;
  } else if (absAmount >= INR_CONSTANTS.units.thousand.value) {
    // Format in thousands
    const thousands = absAmount / INR_CONSTANTS.units.thousand.value;
    formatted = thousands.toFixed(thousands >= 100 ? 0 : 1);
    unit = INR_CONSTANTS.units.thousand.symbol;
  } else {
    // Less than 1000
    formatted = absAmount.toFixed(0);
    unit = '';
  }

  if (useDevanagariNumerals) {
    formatted = convertToDevanagariNumerals(formatted);
  }

  const sign = amount < 0 ? '-' : '';
  return `${sign}${INR_CONSTANTS.symbolNative}${formatted}${unit}`;
}

/**
 * Validate INR amount
 */
export function validateINRAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (!isFinite(amount)) {
    return { valid: false, error: 'Amount must be finite' };
  }

  // Check decimal places (max 2 for INR)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > INR_CONSTANTS.decimalDigits) {
    return {
      valid: false,
      error: `INR amounts cannot have more than ${INR_CONSTANTS.decimalDigits} decimal places`,
    };
  }

  return { valid: true };
}

/**
 * Format INR amount in words (English)
 * Example: 100000 -> "One Lakh Rupees Only"
 */
export function formatINRInWords(amount: number, language: 'en' | 'hi' = 'en'): string {
  const wholePart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - wholePart) * 100);

  const isNegative = amount < 0;

  if (language === 'hi') {
    const wholeWords = numberToHindiWords(wholePart);
    let result = '';

    if (isNegative) {
      result = 'ऋण ';
    }

    result += wholeWords + ' ' + INR_CONSTANTS.namePluralHindi;

    if (decimalPart > 0) {
      const decimalWords = numberToHindiWords(decimalPart);
      result +=
        ' और ' +
        decimalWords +
        ' ' +
        (decimalPart === 1
          ? INR_CONSTANTS.minorUnit.nameHindi
          : INR_CONSTANTS.minorUnit.namePluralHindi);
    }

    result += ' मात्र';
    return result;
  } else {
    // English
    const wholeWords = numberToEnglishWords(wholePart);
    let result = '';

    if (isNegative) {
      result = 'Negative ';
    }

    result +=
      wholeWords +
      ' ' +
      (wholePart === 1 ? INR_CONSTANTS.name : INR_CONSTANTS.namePlural);

    if (decimalPart > 0) {
      const decimalWords = numberToEnglishWords(decimalPart);
      result +=
        ' and ' +
        decimalWords +
        ' ' +
        (decimalPart === 1
          ? INR_CONSTANTS.minorUnit.name
          : INR_CONSTANTS.minorUnit.namePlural);
    }

    result += ' Only';
    return result;
  }
}

/**
 * Convert number to English words (Indian system)
 */
function numberToEnglishWords(num: number): string {
  if (num === 0) return 'Zero';

  const { ones, teens, tens, units } = INDIAN_NUMBER_NAMES;

  const parts: string[] = [];

  // Crores (10,000,000)
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    parts.push(convertBelowHundred(crores, ones, teens, tens) + ' ' + units.crore);
    num %= 10000000;
  }

  // Lakhs (100,000)
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    parts.push(convertBelowHundred(lakhs, ones, teens, tens) + ' ' + units.lakh);
    num %= 100000;
  }

  // Thousands (1,000)
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    parts.push(convertBelowHundred(thousands, ones, teens, tens) + ' ' + units.thousand);
    num %= 1000;
  }

  // Hundreds
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    parts.push((ones[hundreds] ?? '') + ' ' + units.hundred);
    num %= 100;
  }

  // Below 100
  if (num > 0) {
    parts.push(convertBelowHundred(num, ones, teens, tens));
  }

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Convert number to Hindi words (Indian system)
 */
function numberToHindiWords(num: number): string {
  if (num === 0) return 'शून्य';

  const { ones, teens, tens, units } = HINDI_NUMBER_NAMES;

  const parts: string[] = [];

  // Crores (10,000,000)
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    parts.push(convertBelowHundredHindi(crores, ones, teens, tens) + ' ' + units.crore);
    num %= 10000000;
  }

  // Lakhs (100,000)
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    parts.push(convertBelowHundredHindi(lakhs, ones, teens, tens) + ' ' + units.lakh);
    num %= 100000;
  }

  // Thousands (1,000)
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    parts.push(convertBelowHundredHindi(thousands, ones, teens, tens) + ' ' + units.thousand);
    num %= 1000;
  }

  // Hundreds
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    parts.push((ones[hundreds] ?? '') + ' ' + units.hundred);
    num %= 100;
  }

  // Below 100
  if (num > 0) {
    parts.push(convertBelowHundredHindi(num, ones, teens, tens));
  }

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Helper to convert numbers below 100 to English words
 */
function convertBelowHundred(
  num: number,
  ones: readonly string[],
  teens: readonly string[],
  tens: readonly string[]
): string {
  if (num === 0) return '';
  if (num < 10) return ones[num] ?? '';
  if (num < 20) return teens[num - 10] ?? '';

  const tensDigit = Math.floor(num / 10);
  const onesDigit = num % 10;

  if (onesDigit === 0) {
    return tens[tensDigit] ?? '';
  }
  return (tens[tensDigit] ?? '') + '-' + (ones[onesDigit] ?? '');
}

/**
 * Helper to convert numbers below 100 to Hindi words
 */
function convertBelowHundredHindi(
  num: number,
  ones: readonly string[],
  teens: readonly string[],
  tens: readonly string[]
): string {
  if (num === 0) return '';
  if (num < 10) return ones[num] ?? '';
  if (num < 20) return teens[num - 10] ?? '';

  const tensDigit = Math.floor(num / 10);
  const onesDigit = num % 10;

  if (onesDigit === 0) {
    return tens[tensDigit] ?? '';
  }
  return (tens[tensDigit] ?? '') + ' ' + (ones[onesDigit] ?? '');
}

/**
 * Get amount in lakhs
 */
export function getAmountInLakhs(amount: number): number {
  return amount / INR_CONSTANTS.units.lakh.value;
}

/**
 * Get amount in crores
 */
export function getAmountInCrores(amount: number): number {
  return amount / INR_CONSTANTS.units.crore.value;
}

/**
 * Format amount with unit (Lakh/Crore) for display
 */
export function formatINRWithUnit(amount: number, decimals: number = 2): string {
  const absAmount = Math.abs(amount);

  if (absAmount >= INR_CONSTANTS.units.crore.value) {
    const crores = absAmount / INR_CONSTANTS.units.crore.value;
    return `₹${crores.toFixed(decimals)} ${INR_CONSTANTS.units.crore.name}${crores !== 1 ? 's' : ''}`;
  } else if (absAmount >= INR_CONSTANTS.units.lakh.value) {
    const lakhs = absAmount / INR_CONSTANTS.units.lakh.value;
    return `₹${lakhs.toFixed(decimals)} ${INR_CONSTANTS.units.lakh.name}${lakhs !== 1 ? 's' : ''}`;
  } else {
    return formatINR(amount, { decimals });
  }
}
