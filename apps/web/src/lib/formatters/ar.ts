/**
 * Arabic Formatters
 *
 * Provides formatting utilities for Arabic locale including:
 * - Number formatting (with optional Arabic-Indic numerals)
 * - Currency formatting (SAR, AED, etc.)
 * - Date formatting (Gregorian and Hijri)
 * - Percentage formatting
 * - Address formatting
 */

// Currency symbols for common Middle East currencies
const CURRENCY_SYMBOLS: Record<string, string> = {
  SAR: 'ر.س', // Saudi Riyal
  AED: 'د.إ', // UAE Dirham
  KWD: 'د.ك', // Kuwaiti Dinar
  BHD: 'د.ب', // Bahraini Dinar
  OMR: 'ر.ع', // Omani Rial
  QAR: 'ر.ق', // Qatari Riyal
  EGP: 'ج.م', // Egyptian Pound
  JOD: 'د.أ', // Jordanian Dinar
  LBP: 'ل.ل', // Lebanese Pound
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// Arabic-Indic numerals mapping
const ARABIC_INDIC_NUMERALS: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

/**
 * Convert Western numerals to Arabic-Indic numerals
 */
export function toArabicIndic(text: string): string {
  return text.replace(/[0-9]/g, (digit) => ARABIC_INDIC_NUMERALS[digit] || digit);
}

/**
 * Format number in Arabic locale
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  options: {
    useArabicIndic?: boolean;
    decimals?: number;
    useGrouping?: boolean;
  } = {}
): string {
  const {
    useArabicIndic = false,
    decimals = 0,
    useGrouping = true,
  } = options;

  const formatted = new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping,
  }).format(value);

  return useArabicIndic ? toArabicIndic(formatted) : formatted;
}

/**
 * Format currency in Arabic locale
 * @param value - Amount to format
 * @param currency - Currency code (SAR, AED, etc.)
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'SAR',
  options: {
    useArabicIndic?: boolean;
    showSymbol?: boolean;
    decimals?: number;
  } = {}
): string {
  const {
    useArabicIndic = false,
    showSymbol = true,
    decimals = 2,
  } = options;

  const formatted = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  if (!showSymbol) {
    // Remove currency symbol
    return formatted.replace(/[^\d\s,.٫٬]/g, '').trim();
  }

  // Replace with custom symbol if available
  const symbol = CURRENCY_SYMBOLS[currency];
  if (symbol) {
    const numericPart = formatted.replace(/[^\d\s,.٫٬]/g, '').trim();
    const result = `${numericPart} ${symbol}`;
    return useArabicIndic ? toArabicIndic(result) : result;
  }

  return useArabicIndic ? toArabicIndic(formatted) : formatted;
}

/**
 * Format percentage in Arabic locale
 * @param value - Value to format (0-1 or 0-100)
 * @param options - Formatting options
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  options: {
    useArabicIndic?: boolean;
    decimals?: number;
    isDecimal?: boolean; // If true, value is 0-1, else 0-100
  } = {}
): string {
  const {
    useArabicIndic = false,
    decimals = 0,
    isDecimal = false,
  } = options;

  const percentValue = isDecimal ? value * 100 : value;

  const formatted = new Intl.NumberFormat('ar-SA', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(isDecimal ? value : value / 100);

  return useArabicIndic ? toArabicIndic(formatted) : formatted;
}

/**
 * Format date in Arabic locale (Gregorian)
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: {
    useArabicIndic?: boolean;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    includeTime?: boolean;
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
  } = {}
): string {
  const {
    useArabicIndic = false,
    dateStyle = 'medium',
    includeTime = false,
    timeStyle = 'short',
  } = options;

  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle,
  };

  if (includeTime) {
    formatOptions.timeStyle = timeStyle;
  }

  const formatted = new Intl.DateTimeFormat('ar-SA', formatOptions).format(dateObj);

  return useArabicIndic ? toArabicIndic(formatted) : formatted;
}

/**
 * Format time in Arabic locale
 * @param date - Date to format time from
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string | number,
  options: {
    useArabicIndic?: boolean;
    hour12?: boolean;
    includeSeconds?: boolean;
  } = {}
): string {
  const {
    useArabicIndic = false,
    hour12 = true,
    includeSeconds = false,
  } = options;

  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const formatted = new Intl.DateTimeFormat('ar-SA', {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12,
  }).format(dateObj);

  return useArabicIndic ? toArabicIndic(formatted) : formatted;
}

/**
 * Format relative time in Arabic (e.g., "منذ 5 دقائق")
 * @param date - Date to compare
 * @param baseDate - Base date for comparison (default: now)
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: Date | string | number,
  baseDate: Date = new Date()
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const diffInSeconds = Math.floor((baseDate.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat('ar-SA', { numeric: 'auto' });

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (Math.abs(diffInSeconds) < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (Math.abs(diffInSeconds) < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (Math.abs(diffInSeconds) < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (Math.abs(diffInSeconds) < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  } else if (Math.abs(diffInSeconds) < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Format address in Middle East style
 * @param address - Address components
 * @returns Formatted address string
 */
export function formatAddress(address: {
  street?: string;
  building?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  country?: string;
}): string {
  const parts: string[] = [];

  if (address.building) parts.push(address.building);
  if (address.street) parts.push(address.street);
  if (address.district) parts.push(address.district);
  if (address.city) parts.push(address.city);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);

  return parts.filter(Boolean).join('، ');
}

/**
 * Format phone number for Middle East region
 * @param phone - Phone number
 * @param countryCode - Country code (e.g., 'SA', 'AE')
 * @returns Formatted phone number
 */
export function formatPhone(
  phone: string,
  countryCode?: string,
  options: { useArabicIndic?: boolean } = {}
): string {
  const { useArabicIndic = false } = options;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Format based on country
  let formatted = '';

  if (countryCode === 'SA' && digits.length === 10) {
    // Saudi format: 05XX XXX XXXX
    formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (countryCode === 'AE' && digits.length === 9) {
    // UAE format: 05X XXX XXXX
    formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length >= 10) {
    // Generic format: XXX XXX XXXX
    const lastTenDigits = digits.slice(-10);
    formatted = `${lastTenDigits.slice(0, 3)} ${lastTenDigits.slice(3, 6)} ${lastTenDigits.slice(6)}`;
  } else {
    formatted = digits;
  }

  return useArabicIndic ? toArabicIndic(formatted) : formatted;
}

/**
 * Format file size in Arabic
 * @param bytes - File size in bytes
 * @param options - Formatting options
 * @returns Formatted file size string
 */
export function formatFileSize(
  bytes: number,
  options: { useArabicIndic?: boolean; decimals?: number } = {}
): string {
  const { useArabicIndic = false, decimals = 2 } = options;

  const units = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت', 'تيرابايت'];

  if (bytes === 0) return `0 ${units[0]}`;

  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  const formatted = `${value.toFixed(decimals)} ${units[i]}`;

  return useArabicIndic ? toArabicIndic(formatted) : formatted;
}

/**
 * Format ordinal numbers in Arabic
 * @param num - Number to format
 * @param gender - Gender for agreement ('m' or 'f')
 * @returns Ordinal string
 */
export function formatOrdinal(
  num: number,
  gender: 'm' | 'f' = 'm'
): string {
  const ordinals: Record<number, { m: string; f: string }> = {
    1: { m: 'الأول', f: 'الأولى' },
    2: { m: 'الثاني', f: 'الثانية' },
    3: { m: 'الثالث', f: 'الثالثة' },
    4: { m: 'الرابع', f: 'الرابعة' },
    5: { m: 'الخامس', f: 'الخامسة' },
    6: { m: 'السادس', f: 'السادسة' },
    7: { m: 'السابع', f: 'السابعة' },
    8: { m: 'الثامن', f: 'الثامنة' },
    9: { m: 'التاسع', f: 'التاسعة' },
    10: { m: 'العاشر', f: 'العاشرة' },
  };

  return ordinals[num]?.[gender] || `${num}`;
}

export default {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatAddress,
  formatPhone,
  formatFileSize,
  formatOrdinal,
  toArabicIndic,
};
