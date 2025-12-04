/**
 * AED Currency Formatter
 * Handles UAE Dirham formatting with support for Arabic numerals and invoice formatting
 */

import { AED_CONSTANTS, ARABIC_NUMERALS } from './aed.constants';

export interface AEDFormattingOptions {
  /**
   * Use Arabic numerals (٠١٢٣٤٥٦٧٨٩)
   * Default: false (uses Western numerals 0123456789)
   */
  useArabicNumerals?: boolean;

  /**
   * Include currency symbol
   * Default: true
   */
  includeSymbol?: boolean;

  /**
   * Use alternative symbol (AED instead of د.إ)
   * Default: false
   */
  useAlternativeSymbol?: boolean;

  /**
   * Locale for number formatting
   * Default: 'en-AE'
   */
  locale?: string;

  /**
   * Number of decimal places to show
   * Default: 2
   */
  decimals?: number;
}

/**
 * Format amount as AED currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted AED string (e.g., "1,234.56 د.إ" or "١٬٢٣٤٫٥٦ د.إ")
 */
export function formatAED(
  amount: number,
  options: AEDFormattingOptions = {}
): string {
  const {
    useArabicNumerals = false,
    includeSymbol = true,
    useAlternativeSymbol = false,
    locale = 'en-AE',
    decimals = AED_CONSTANTS.decimalDigits,
  } = options;

  // Format using Intl.NumberFormat
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  let result = formatted;

  // Convert to Arabic numerals if requested
  if (useArabicNumerals) {
    result = convertToArabicNumerals(result);
  }

  // Add currency symbol
  if (includeSymbol) {
    const symbol = useAlternativeSymbol
      ? AED_CONSTANTS.symbolAlt
      : AED_CONSTANTS.symbolNative;
    // AED symbol goes after the amount
    result = `${result} ${symbol}`;
  }

  return result;
}

/**
 * Convert Western numerals to Arabic numerals
 */
function convertToArabicNumerals(value: string): string {
  return value.replace(/[0-9]/g, (digit) => ARABIC_NUMERALS[digit as keyof typeof ARABIC_NUMERALS]);
}

/**
 * Convert Arabic numerals to Western numerals
 */
function convertToWesternNumerals(value: string): string {
  let result = value;
  Object.entries(ARABIC_NUMERALS).forEach(([western, arabic]) => {
    result = result.replace(new RegExp(arabic, 'g'), western);
  });
  return result;
}

/**
 * Parse AED formatted string to number
 * Supports both Western (1,234.56) and Arabic (١٬٢٣٤٫٥٦) numerals
 */
export function parseAED(value: string): number {
  if (!value || value.trim() === '') {
    return 0;
  }

  let cleanValue = value.trim();

  // Handle negative sign
  const isNegative = cleanValue.startsWith('-') || cleanValue.startsWith('−');
  if (isNegative) {
    cleanValue = cleanValue.substring(1);
  }

  // Convert Arabic numerals to Western if present
  cleanValue = convertToWesternNumerals(cleanValue);

  // Remove currency symbols and separators
  cleanValue = cleanValue
    .replace(/[د.إ]/g, '')
    .replace(/AED/gi, '')
    .replace(/[,،\s]/g, '')
    .trim();

  // Replace Arabic decimal separator with Western
  cleanValue = cleanValue.replace(/٫/g, '.');

  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed * (isNegative ? -1 : 1);
}

/**
 * Format AED for display in compact form (e.g., "1.2K د.إ", "1.5M د.إ")
 */
export function formatAEDCompact(
  amount: number,
  locale: string = 'en-AE',
  useArabicNumerals: boolean = false
): string {
  const formatted = new Intl.NumberFormat(locale, {
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);

  let result = formatted;

  if (useArabicNumerals) {
    result = convertToArabicNumerals(result);
  }

  return `${result} ${AED_CONSTANTS.symbolNative}`;
}

/**
 * Validate AED amount
 */
export function validateAEDAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (!isFinite(amount)) {
    return { valid: false, error: 'Amount must be finite' };
  }

  // Check decimal places (max 2 for AED)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > AED_CONSTANTS.decimalDigits) {
    return {
      valid: false,
      error: `AED amounts cannot have more than ${AED_CONSTANTS.decimalDigits} decimal places`,
    };
  }

  return { valid: true };
}

/**
 * Format AED amount in words for invoices (Arabic)
 * Example: 1234.56 AED -> "ألف ومائتان وأربعة وثلاثون درهماً إماراتياً وستة وخمسون فلساً"
 */
export function formatAEDInWords(amount: number, language: 'ar' | 'en' = 'ar'): string {
  const wholePart = Math.floor(amount);
  const decimalPart = Math.round((amount - wholePart) * 100);

  if (language === 'ar') {
    const wholeWords = numberToArabicWords(wholePart);
    const decimalWords = decimalPart > 0 ? numberToArabicWords(decimalPart) : '';

    let result = wholeWords + ' ' + AED_CONSTANTS.nameArabic;

    if (decimalPart > 0) {
      result += ' و' + decimalWords + ' ' + AED_CONSTANTS.minorUnit.nameArabic;
    }

    return result;
  } else {
    // English
    const wholeWords = numberToEnglishWords(wholePart);
    const decimalWords = decimalPart > 0 ? numberToEnglishWords(decimalPart) : '';

    let result = wholeWords + ' ' + (wholePart === 1 ? AED_CONSTANTS.name : AED_CONSTANTS.namePlural);

    if (decimalPart > 0) {
      result += ' and ' + decimalWords + ' ' + (decimalPart === 1 ? AED_CONSTANTS.minorUnit.name : AED_CONSTANTS.minorUnit.name + 's');
    }

    return result;
  }
}

/**
 * Convert number to Arabic words
 * Simplified implementation for common amounts
 */
function numberToArabicWords(num: number): string {
  if (num === 0) return 'صفر';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثماني مائة', 'تسعمائة'];
  const thousands = ['', 'ألف', 'ألفان', 'آلاف'];

  let result = [];

  // Millions
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    result.push(millions === 1 ? 'مليون' : millions === 2 ? 'مليونان' : ones[millions] + ' ملايين');
    num %= 1000000;
  }

  // Thousands
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    if (thousand === 1) {
      result.push('ألف');
    } else if (thousand === 2) {
      result.push('ألفان');
    } else if (thousand <= 10) {
      result.push(ones[thousand] + ' آلاف');
    } else {
      result.push(convertBelowThousand(thousand) + ' ألف');
    }
    num %= 1000;
  }

  // Below thousand
  if (num > 0) {
    result.push(convertBelowThousand(num));
  }

  return result.filter(Boolean).join(' و');

  function convertBelowThousand(n: number): string {
    const parts = [];

    const h = Math.floor(n / 100);
    if (h > 0) {
      parts.push(hundreds[h]);
    }

    n %= 100;

    if (n >= 11 && n <= 19) {
      const teens = ['', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
      parts.push(teens[n - 10]);
    } else {
      const t = Math.floor(n / 10);
      const o = n % 10;

      if (o > 0) {
        parts.push(ones[o]);
      }
      if (t > 0) {
        parts.push(tens[t]);
      }
    }

    return parts.filter(Boolean).join(' و');
  }
}

/**
 * Convert number to English words
 * Simplified implementation for common amounts
 */
function numberToEnglishWords(num: number): string {
  if (num === 0) return 'zero';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  let result = [];

  // Millions
  if (num >= 1000000) {
    result.push(convertBelowThousand(Math.floor(num / 1000000)) + ' million');
    num %= 1000000;
  }

  // Thousands
  if (num >= 1000) {
    result.push(convertBelowThousand(Math.floor(num / 1000)) + ' thousand');
    num %= 1000;
  }

  // Below thousand
  if (num > 0) {
    result.push(convertBelowThousand(num));
  }

  return result.filter(Boolean).join(' ');

  function convertBelowThousand(n: number): string {
    const parts = [];

    const h = Math.floor(n / 100);
    if (h > 0) {
      parts.push(ones[h] + ' hundred');
    }

    n %= 100;

    if (n >= 10 && n < 20) {
      parts.push(teens[n - 10]);
    } else {
      const t = Math.floor(n / 10);
      const o = n % 10;

      if (t > 0) {
        parts.push(tens[t] + (o > 0 ? '-' + ones[o] : ''));
      } else if (o > 0) {
        parts.push(ones[o]);
      }
    }

    return parts.filter(Boolean).join(' ');
  }
}
