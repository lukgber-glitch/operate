/**
 * Singapore Dollar (SGD) Formatter Service
 *
 * Handles all SGD-specific formatting with support for:
 * - Standard electronic transactions (exact cents)
 * - Cash rounding (5 cent increments, since 2002)
 * - Multi-language support (English, Chinese, Malay, Tamil)
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import {
  SGD_CURRENCY_CONFIG,
  getSGDLocaleConfig,
  validateSGDAmount,
  applySGDCashRounding,
  needsSGDCashRounding,
  getSGDRoundingAdjustment,
  formatSGDAmount,
} from '../currencies/sgd-currency.config';

export interface SGDFormattingOptions {
  locale?: 'en-SG' | 'zh-SG' | string;
  showSymbol?: boolean;
  showCode?: boolean;
  isCash?: boolean;
  showRounding?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface SGDParsingOptions {
  locale?: 'en-SG' | 'zh-SG' | string;
  strict?: boolean;
  isCash?: boolean;
}

@Injectable()
export class SGDFormatterService {
  /**
   * Format SGD amount for display
   *
   * @param amount - Amount in SGD
   * @param options - Formatting options
   * @returns Formatted string
   *
   * @example
   * formatAmount(1234.56, { isCash: false }) // "S$1,234.56"
   * formatAmount(1234.56, { isCash: true }) // "S$1,234.55" (rounded)
   * formatAmount(1234.56, { locale: 'zh-SG' }) // "S$1,234.56"
   */
  formatAmount(amount: number, options?: SGDFormattingOptions): string {
    const isCash = options?.isCash || false;

    // Validate amount
    if (!validateSGDAmount(amount, isCash)) {
      throw new BadRequestException(
        `Invalid SGD amount: ${amount}${isCash ? ' (for cash transaction)' : ''}`,
      );
    }

    // Apply cash rounding if needed
    const finalAmount = isCash ? applySGDCashRounding(amount) : amount;

    const locale = options?.locale || 'en-SG';
    const showSymbol = options?.showSymbol !== false;
    const showCode = options?.showCode || false;
    const showRounding = options?.showRounding || false;

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: 'SGD',
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      });

      let formatted = formatter.format(finalAmount);

      // Add currency code if requested
      if (showCode && !showSymbol) {
        formatted = `${formatted} SGD`;
      } else if (showCode && showSymbol) {
        formatted = `${formatted} (SGD)`;
      }

      // Add rounding indicator if cash and amount was rounded
      if (showRounding && isCash && needsSGDCashRounding(amount)) {
        formatted = `${formatted}*`;
      }

      return formatted;
    } catch (error) {
      // Fallback formatting
      const localeConfig = getSGDLocaleConfig(locale);
      const fixedAmount = finalAmount.toFixed(2);

      if (localeConfig.format === 'before') {
        return showSymbol
          ? `${localeConfig.symbol}${fixedAmount}`
          : fixedAmount;
      } else {
        return showSymbol
          ? `${fixedAmount} ${localeConfig.symbol}`
          : fixedAmount;
      }
    }
  }

  /**
   * Parse SGD amount from string
   *
   * Handles various input formats:
   * - "S$1,234.56"
   * - "$1234.56"
   * - "1234.56"
   *
   * @param input - String to parse
   * @param options - Parsing options
   * @returns Parsed amount
   */
  parseAmount(input: string, options?: SGDParsingOptions): number {
    if (!input || typeof input !== 'string') {
      throw new BadRequestException('Invalid input for SGD amount parsing');
    }

    let cleaned = input.trim();

    // Remove currency symbols and codes
    cleaned = cleaned
      .replace(/S\$/g, '')
      .replace(/SG\$/g, '')
      .replace(/\$/g, '')
      .replace(/SGD/gi, '')
      .replace(/\*/g, ''); // Remove rounding indicator

    cleaned = cleaned.trim();

    // Remove thousands separators (commas)
    cleaned = cleaned.replace(/,/g, '');

    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) {
      throw new BadRequestException(
        `Unable to parse SGD amount: "${input}"`,
      );
    }

    // Validate parsed amount
    const isCash = options?.isCash || false;
    if (options?.strict && !validateSGDAmount(parsed, isCash)) {
      throw new BadRequestException(
        `Invalid SGD amount after parsing: ${parsed}${isCash ? ' (for cash transaction)' : ''}`,
      );
    }

    return parsed;
  }

  /**
   * Format amount with detailed rounding information
   *
   * @example
   * formatWithRoundingDetails(1234.56)
   * // {
   * //   original: "S$1,234.56",
   * //   rounded: "S$1,234.55",
   * //   adjustment: "-S$0.01",
   * //   display: "S$1,234.55 (rounded down S$0.01)"
   * // }
   */
  formatWithRoundingDetails(
    amount: number,
    options?: SGDFormattingOptions,
  ): {
    original: string;
    rounded: string;
    adjustment: string;
    needsRounding: boolean;
    display: string;
  } {
    const rounded = applySGDCashRounding(amount);
    const adjustment = getSGDRoundingAdjustment(amount);
    const needsRounding = needsSGDCashRounding(amount);

    const originalFormatted = this.formatAmount(amount, {
      ...options,
      isCash: false,
    });
    const roundedFormatted = this.formatAmount(rounded, {
      ...options,
      isCash: true,
    });
    const adjustmentFormatted = this.formatAmount(Math.abs(adjustment), {
      ...options,
      isCash: false,
    });

    let display = roundedFormatted;
    if (needsRounding) {
      const direction = adjustment > 0 ? 'up' : 'down';
      display = `${roundedFormatted} (rounded ${direction} ${adjustmentFormatted})`;
    }

    return {
      original: originalFormatted,
      rounded: roundedFormatted,
      adjustment: adjustmentFormatted,
      needsRounding,
      display,
    };
  }

  /**
   * Get currency configuration
   */
  getCurrencyConfig() {
    return SGD_CURRENCY_CONFIG;
  }

  /**
   * Validate SGD amount
   */
  validate(amount: number, isCash: boolean = false): boolean {
    return validateSGDAmount(amount, isCash);
  }

  /**
   * Apply cash rounding
   */
  applyCashRounding(amount: number): number {
    return applySGDCashRounding(amount);
  }

  /**
   * Check if amount needs cash rounding
   */
  needsCashRounding(amount: number): boolean {
    return needsSGDCashRounding(amount);
  }

  /**
   * Get rounding adjustment
   */
  getRoundingAdjustment(amount: number): number {
    return getSGDRoundingAdjustment(amount);
  }

  /**
   * Get formatting examples in multiple languages
   */
  getFormattingExamples(): {
    english: string;
    chinese: string;
    electronicEnglish: string;
    cashEnglish: string;
    withRounding: string;
  } {
    const testAmount = 1234.57;

    return {
      english: this.formatAmount(testAmount, { locale: 'en-SG' }),
      chinese: this.formatAmount(testAmount, { locale: 'zh-SG' }),
      electronicEnglish: this.formatAmount(testAmount, { isCash: false }),
      cashEnglish: this.formatAmount(testAmount, { isCash: true }),
      withRounding: this.formatWithRoundingDetails(testAmount).display,
    };
  }

  /**
   * Convert amount to cents
   */
  toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert cents to amount
   */
  fromCents(cents: number): number {
    return cents / 100;
  }

  /**
   * Format compact (e.g., "1.2K", "1.5M")
   */
  formatCompact(amount: number, options?: SGDFormattingOptions): string {
    const locale = options?.locale || 'en-SG';

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'SGD',
        notation: 'compact',
        compactDisplay: 'short',
      });

      return formatter.format(amount);
    } catch (error) {
      // Fallback for older environments
      if (amount >= 1000000) {
        return this.formatAmount(amount / 1000000, options) + 'M';
      } else if (amount >= 1000) {
        return this.formatAmount(amount / 1000, options) + 'K';
      }
      return this.formatAmount(amount, options);
    }
  }

  /**
   * Get cash rounding table for documentation
   */
  getCashRoundingTable(): Array<{
    original: number;
    rounded: number;
    adjustment: number;
  }> {
    const examples = [
      1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.10,
    ];

    return examples.map((original) => ({
      original,
      rounded: applySGDCashRounding(original),
      adjustment: getSGDRoundingAdjustment(original),
    }));
  }

  /**
   * Format for official documents (always shows code)
   */
  formatOfficial(amount: number, options?: SGDFormattingOptions): string {
    return this.formatAmount(amount, {
      ...options,
      showCode: true,
      showSymbol: true,
    });
  }

  /**
   * Format for receipts (shows rounding if applicable)
   */
  formatReceipt(amount: number, isCash: boolean = false): string {
    if (isCash && needsSGDCashRounding(amount)) {
      const details = this.formatWithRoundingDetails(amount);
      return `${details.original}\nCash Rounded: ${details.rounded}`;
    }

    return this.formatAmount(amount, { isCash });
  }
}
