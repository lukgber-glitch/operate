/**
 * JPY Currency Formatter
 * Handles Japanese Yen formatting with support for standard and traditional large number formats
 */

import { JPY_CONSTANTS } from './jpy.constants';

export interface JPYFormattingOptions {
  /**
   * Use traditional large number format (e.g., 123万4,567円)
   * Default: false (uses ¥1,234,567)
   */
  useTraditionalFormat?: boolean;

  /**
   * Include currency symbol
   * Default: true
   */
  includeSymbol?: boolean;

  /**
   * Use kanji yen symbol (円) instead of ¥
   * Only applies when useTraditionalFormat is true
   * Default: false
   */
  useKanjiYenSymbol?: boolean;

  /**
   * Locale for number formatting
   * Default: 'ja-JP'
   */
  locale?: string;
}

/**
 * Format amount as JPY currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted JPY string (e.g., "¥1,234,567" or "123万4,567円")
 */
export function formatJPY(
  amount: number,
  options: JPYFormattingOptions = {}
): string {
  const {
    useTraditionalFormat = false,
    includeSymbol = true,
    useKanjiYenSymbol = false,
    locale = 'ja-JP',
  } = options;

  // Round to whole number (JPY has no decimal places)
  const roundedAmount = Math.round(amount);

  if (useTraditionalFormat) {
    return formatJPYTraditional(roundedAmount, includeSymbol, useKanjiYenSymbol);
  }

  // Standard international format using Intl.NumberFormat
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: JPY_CONSTANTS.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedAmount);

  if (!includeSymbol) {
    return formatted.replace(/[¥円]/g, '').trim();
  }

  return formatted;
}

/**
 * Format JPY in traditional Japanese style with 万 (man) and 億 (oku)
 * Examples:
 * - 12,345 -> 1万2,345円
 * - 123,456,789 -> 1億2,345万6,789円
 */
function formatJPYTraditional(
  amount: number,
  includeSymbol: boolean,
  useKanjiSymbol: boolean
): string {
  if (amount === 0) {
    return includeSymbol
      ? useKanjiSymbol
        ? '0円'
        : '¥0'
      : '0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let parts: string[] = [];

  // Handle 兆 (cho) - trillions
  if (absAmount >= JPY_CONSTANTS.largeNumbers.cho) {
    const cho = Math.floor(absAmount / JPY_CONSTANTS.largeNumbers.cho);
    parts.push(`${cho.toLocaleString('ja-JP')}${JPY_CONSTANTS.kanji.cho}`);
  }

  // Handle 億 (oku) - hundred millions
  const remainingAfterCho = absAmount % JPY_CONSTANTS.largeNumbers.cho;
  if (remainingAfterCho >= JPY_CONSTANTS.largeNumbers.oku) {
    const oku = Math.floor(remainingAfterCho / JPY_CONSTANTS.largeNumbers.oku);
    parts.push(`${oku.toLocaleString('ja-JP')}${JPY_CONSTANTS.kanji.oku}`);
  }

  // Handle 万 (man) - ten thousands
  const remainingAfterOku = remainingAfterCho % JPY_CONSTANTS.largeNumbers.oku;
  if (remainingAfterOku >= JPY_CONSTANTS.largeNumbers.man) {
    const man = Math.floor(remainingAfterOku / JPY_CONSTANTS.largeNumbers.man);
    parts.push(`${man.toLocaleString('ja-JP')}${JPY_CONSTANTS.kanji.man}`);
  }

  // Handle remaining units
  const units = remainingAfterOku % JPY_CONSTANTS.largeNumbers.man;
  if (units > 0 || parts.length === 0) {
    parts.push(units.toLocaleString('ja-JP'));
  }

  let result = parts.join('');

  if (includeSymbol) {
    if (useKanjiSymbol) {
      result += JPY_CONSTANTS.kanji.yen;
    } else {
      result = JPY_CONSTANTS.symbol + result;
    }
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Parse JPY formatted string to number
 * Supports both standard (¥1,234,567) and traditional (123万4,567円) formats
 */
export function parseJPY(value: string): number {
  if (!value || value.trim() === '') {
    return 0;
  }

  let cleanValue = value.trim();
  const isNegative = cleanValue.startsWith('-');
  if (isNegative) {
    cleanValue = cleanValue.substring(1);
  }

  // Remove symbols
  cleanValue = cleanValue.replace(/[¥円,\s]/g, '');

  // Check if it contains traditional notation
  if (cleanValue.includes('兆') || cleanValue.includes('億') || cleanValue.includes('万')) {
    return parseJPYTraditional(cleanValue) * (isNegative ? -1 : 1);
  }

  // Parse as standard number
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : Math.round(parsed) * (isNegative ? -1 : 1);
}

/**
 * Parse traditional Japanese number format
 */
function parseJPYTraditional(value: string): number {
  let total = 0;

  // Extract 兆 (cho)
  const choMatch = value.match(/(\d+)兆/);
  if (choMatch?.[1]) {
    total += parseInt(choMatch[1], 10) * JPY_CONSTANTS.largeNumbers.cho;
  }

  // Extract 億 (oku)
  const okuMatch = value.match(/(\d+)億/);
  if (okuMatch?.[1]) {
    total += parseInt(okuMatch[1], 10) * JPY_CONSTANTS.largeNumbers.oku;
  }

  // Extract 万 (man)
  const manMatch = value.match(/(\d+)万/);
  if (manMatch?.[1]) {
    total += parseInt(manMatch[1], 10) * JPY_CONSTANTS.largeNumbers.man;
  }

  // Extract remaining units (after the last kanji)
  const lastKanjiIndex = Math.max(
    value.lastIndexOf('兆'),
    value.lastIndexOf('億'),
    value.lastIndexOf('万')
  );

  if (lastKanjiIndex >= 0 && lastKanjiIndex < value.length - 1) {
    const remainingStr = value.substring(lastKanjiIndex + 1);
    const remaining = parseInt(remainingStr);
    if (!isNaN(remaining)) {
      total += remaining;
    }
  } else if (lastKanjiIndex === -1) {
    // No kanji found, parse as regular number
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      total = parsed;
    }
  }

  return total;
}

/**
 * Format JPY for display in compact form (e.g., "¥1.2M" for English, "123万円" for Japanese)
 */
export function formatJPYCompact(amount: number, locale: string = 'ja-JP'): string {
  const roundedAmount = Math.round(amount);

  if (locale.startsWith('ja')) {
    // Use traditional format for Japanese locale
    return formatJPY(roundedAmount, {
      useTraditionalFormat: true,
      useKanjiYenSymbol: true,
    });
  }

  // Use compact notation for other locales
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: JPY_CONSTANTS.code,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(roundedAmount);
}

/**
 * Validate JPY amount
 */
export function validateJPYAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (!isFinite(amount)) {
    return { valid: false, error: 'Amount must be finite' };
  }

  // Check if amount has decimal places (JPY should be whole numbers)
  if (amount !== Math.round(amount)) {
    return { valid: false, error: 'JPY amounts cannot have decimal places' };
  }

  return { valid: true };
}
