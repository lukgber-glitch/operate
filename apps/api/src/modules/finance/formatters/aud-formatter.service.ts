/**
 * Australian Dollar (AUD) Formatter Service
 *
 * Handles all AUD-specific formatting with support for:
 * - Standard electronic transactions (exact cents)
 * - Cash rounding (5 cent increments)
 * - Rounding indicators
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import {
  AUD_CURRENCY_CONFIG,
  getAUDLocaleConfig,
  validateAUDAmount,
  applyAUDCashRounding,
  needsAUDCashRounding,
  getAUDRoundingAdjustment,
} from '../currencies/aud-currency.config';

export interface AUDFormattingOptions {
  locale?: 'en-AU' | string;
  showSymbol?: boolean;
  showCode?: boolean;
  isCash?: boolean;
  showRounding?: boolean; // Show rounding indicator
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface AUDParsingOptions {
  locale?: 'en-AU' | string;
  strict?: boolean;
  isCash?: boolean;
}

@Injectable()
export class AUDFormatterService {
  /**
   * Format AUD amount for display
   *
   * @param amount - Amount in AUD
   * @param options - Formatting options
   * @returns Formatted string
   *
   * @example
   * formatAmount(1234.56, { isCash: false }) // "A$1,234.56"
   * formatAmount(1234.56, { isCash: true }) // "A$1,234.55" (rounded)
   * formatAmount(1234.56, { isCash: true, showRounding: true }) // "A$1,234.55*"
   */
  formatAmount(amount: number, options?: AUDFormattingOptions): string {
    const isCash = options?.isCash || false;

    // Validate amount
    if (!validateAUDAmount(amount, isCash)) {
      throw new BadRequestException(
        `Invalid AUD amount: ${amount}${isCash ? ' (for cash transaction)' : ''}`,
      );
    }

    // Apply cash rounding if needed
    const finalAmount = isCash ? applyAUDCashRounding(amount) : amount;

    const locale = options?.locale || 'en-AU';
    const showSymbol = options?.showSymbol !== false;
    const showCode = options?.showCode || false;
    const showRounding = options?.showRounding || false;

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: 'AUD',
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      });

      let formatted = formatter.format(finalAmount);

      // Add currency code if requested
      if (showCode && !showSymbol) {
        formatted = `${formatted} AUD`;
      } else if (showCode && showSymbol) {
        formatted = `${formatted} (AUD)`;
      }

      // Add rounding indicator if cash and amount was rounded
      if (showRounding && isCash && needsAUDCashRounding(amount)) {
        formatted = `${formatted}*`;
      }

      return formatted;
    } catch (error) {
      // Fallback formatting
      const localeConfig = getAUDLocaleConfig(locale);
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
   * Parse AUD amount from string
   *
   * Handles various input formats:
   * - "A$1,234.56"
   * - "$1234.56"
   * - "1234.56"
   *
   * @param input - String to parse
   * @param options - Parsing options
   * @returns Parsed amount
   */
  parseAmount(input: string, options?: AUDParsingOptions): number {
    if (!input || typeof input !== 'string') {
      throw new BadRequestException('Invalid input for AUD amount parsing');
    }

    let cleaned = input.trim();

    // Remove currency symbols and codes
    cleaned = cleaned
      .replace(/A\$/g, '')
      .replace(/AU\$/g, '')
      .replace(/\$/g, '')
      .replace(/AUD/gi, '')
      .replace(/\*/g, ''); // Remove rounding indicator

    cleaned = cleaned.trim();

    // Remove thousands separators (commas)
    cleaned = cleaned.replace(/,/g, '');

    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) {
      throw new BadRequestException(
        `Unable to parse AUD amount: "${input}"`,
      );
    }

    // Validate parsed amount
    const isCash = options?.isCash || false;
    if (options?.strict && !validateAUDAmount(parsed, isCash)) {
      throw new BadRequestException(
        `Invalid AUD amount after parsing: ${parsed}${isCash ? ' (for cash transaction)' : ''}`,
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
   * //   original: "A$1,234.56",
   * //   rounded: "A$1,234.55",
   * //   adjustment: "-A$0.01",
   * //   display: "A$1,234.55 (rounded down A$0.01)"
   * // }
   */
  formatWithRoundingDetails(
    amount: number,
    options?: AUDFormattingOptions,
  ): {
    original: string;
    rounded: string;
    adjustment: string;
    needsRounding: boolean;
    display: string;
  } {
    const rounded = applyAUDCashRounding(amount);
    const adjustment = getAUDRoundingAdjustment(amount);
    const needsRounding = needsAUDCashRounding(amount);

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
    return AUD_CURRENCY_CONFIG;
  }

  /**
   * Validate AUD amount
   */
  validate(amount: number, isCash: boolean = false): boolean {
    return validateAUDAmount(amount, isCash);
  }

  /**
   * Apply cash rounding
   */
  applyCashRounding(amount: number): number {
    return applyAUDCashRounding(amount);
  }

  /**
   * Check if amount needs cash rounding
   */
  needsCashRounding(amount: number): boolean {
    return needsAUDCashRounding(amount);
  }

  /**
   * Get rounding adjustment
   */
  getRoundingAdjustment(amount: number): number {
    return getAUDRoundingAdjustment(amount);
  }

  /**
   * Get formatting examples
   */
  getFormattingExamples(): {
    electronic: string;
    cash: string;
    withRounding: string;
  } {
    const testAmount = 1234.57;

    return {
      electronic: this.formatAmount(testAmount, { isCash: false }),
      cash: this.formatAmount(testAmount, { isCash: true }),
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
  formatCompact(amount: number, options?: AUDFormattingOptions): string {
    const locale = options?.locale || 'en-AU';

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'AUD',
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
      rounded: applyAUDCashRounding(original),
      adjustment: getAUDRoundingAdjustment(original),
    }));
  }
}
