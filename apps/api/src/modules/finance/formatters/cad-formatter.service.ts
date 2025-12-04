/**
 * Canadian Dollar (CAD) Formatter Service
 *
 * Handles all CAD-specific formatting with support for:
 * - English Canadian locale (en-CA)
 * - French Canadian locale (fr-CA)
 * - Cash rounding (optional)
 * - Bilingual display options
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CAD_CURRENCY_CONFIG,
  getCADLocaleConfig,
  validateCADAmount,
  applyCADCashRounding,
} from '../currencies/cad-currency.config';

export interface CADFormattingOptions {
  locale?: 'en-CA' | 'fr-CA' | string;
  showSymbol?: boolean;
  showCode?: boolean;
  isCash?: boolean;
  bilingual?: boolean; // Show both English and French
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface CADParsingOptions {
  locale?: 'en-CA' | 'fr-CA' | string;
  strict?: boolean; // Strict validation
}

@Injectable()
export class CADFormatterService {
  /**
   * Format CAD amount for display
   *
   * @param amount - Amount in CAD
   * @param options - Formatting options
   * @returns Formatted string
   *
   * @example
   * formatAmount(1234.56, { locale: 'en-CA' }) // "C$1,234.56"
   * formatAmount(1234.56, { locale: 'fr-CA' }) // "1 234,56 $"
   * formatAmount(1234.56, { bilingual: true }) // "C$1,234.56 / 1 234,56 $"
   */
  formatAmount(amount: number, options?: CADFormattingOptions): string {
    // Validate amount
    if (!validateCADAmount(amount)) {
      throw new BadRequestException(`Invalid CAD amount: ${amount}`);
    }

    // Apply cash rounding if requested
    const finalAmount = options?.isCash ? applyCADCashRounding(amount) : amount;

    // Bilingual format
    if (options?.bilingual) {
      const englishFormat = this.formatSingleLocale(finalAmount, {
        ...options,
        locale: 'en-CA',
      });
      const frenchFormat = this.formatSingleLocale(finalAmount, {
        ...options,
        locale: 'fr-CA',
      });
      return `${englishFormat} / ${frenchFormat}`;
    }

    // Single locale format
    return this.formatSingleLocale(finalAmount, options);
  }

  /**
   * Format amount for a single locale
   */
  private formatSingleLocale(
    amount: number,
    options?: CADFormattingOptions,
  ): string {
    const locale = options?.locale || 'en-CA';
    const showSymbol = options?.showSymbol !== false;
    const showCode = options?.showCode || false;

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: 'CAD',
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      });

      let formatted = formatter.format(amount);

      // Add currency code if requested
      if (showCode && !showSymbol) {
        formatted = `${formatted} CAD`;
      } else if (showCode && showSymbol) {
        formatted = `${formatted} (CAD)`;
      }

      return formatted;
    } catch (error) {
      // Fallback formatting
      const localeConfig = getCADLocaleConfig(locale);
      const fixedAmount = amount.toFixed(2);

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
   * Parse CAD amount from string
   *
   * Handles various input formats:
   * - "C$1,234.56" (English)
   * - "1 234,56 $" (French)
   * - "$1234.56"
   * - "1234.56"
   *
   * @param input - String to parse
   * @param options - Parsing options
   * @returns Parsed amount
   */
  parseAmount(input: string, options?: CADParsingOptions): number {
    if (!input || typeof input !== 'string') {
      throw new BadRequestException('Invalid input for CAD amount parsing');
    }

    let cleaned = input.trim();

    // Remove currency symbols
    cleaned = cleaned
      .replace(/C\$/g, '')
      .replace(/CA\$/g, '')
      .replace(/\$/g, '')
      .replace(/CAD/gi, '');

    cleaned = cleaned.trim();

    // Detect locale based on decimal separator
    const locale = options?.locale || this.detectLocale(cleaned);

    // Parse based on locale
    if (locale.startsWith('fr')) {
      // French format: 1 234,56
      cleaned = cleaned.replace(/\s/g, ''); // Remove spaces
      cleaned = cleaned.replace(',', '.'); // Replace comma with dot
    } else {
      // English format: 1,234.56
      cleaned = cleaned.replace(/,/g, ''); // Remove commas
    }

    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) {
      throw new BadRequestException(
        `Unable to parse CAD amount: "${input}"`,
      );
    }

    // Validate parsed amount
    if (options?.strict && !validateCADAmount(parsed)) {
      throw new BadRequestException(
        `Invalid CAD amount after parsing: ${parsed}`,
      );
    }

    return parsed;
  }

  /**
   * Detect locale from input string
   */
  private detectLocale(input: string): string {
    // Check for comma as decimal separator (French)
    if (/\d,\d{2}/.test(input)) {
      return 'fr-CA';
    }

    // Check for period as decimal separator (English)
    if (/\d\.\d{2}/.test(input)) {
      return 'en-CA';
    }

    // Default to English
    return 'en-CA';
  }

  /**
   * Format amount with cash rounding indicator
   *
   * @example
   * formatWithRounding(1234.56) // "C$1,234.55 (rounded)"
   */
  formatWithRoundingIndicator(
    amount: number,
    options?: CADFormattingOptions,
  ): string {
    const rounded = applyCADCashRounding(amount);
    const formatted = this.formatAmount(rounded, options);

    if (Math.abs(rounded - amount) > 0.001) {
      return `${formatted} (rounded from ${this.formatAmount(amount, options)})`;
    }

    return formatted;
  }

  /**
   * Get currency configuration
   */
  getCurrencyConfig() {
    return CAD_CURRENCY_CONFIG;
  }

  /**
   * Validate CAD amount
   */
  validate(amount: number): boolean {
    return validateCADAmount(amount);
  }

  /**
   * Apply cash rounding
   */
  applyCashRounding(amount: number): number {
    return applyCADCashRounding(amount);
  }

  /**
   * Get formatting examples
   */
  getFormattingExamples(): {
    english: string;
    french: string;
    bilingual: string;
  } {
    const testAmount = 1234.56;

    return {
      english: this.formatAmount(testAmount, { locale: 'en-CA' }),
      french: this.formatAmount(testAmount, { locale: 'fr-CA' }),
      bilingual: this.formatAmount(testAmount, { bilingual: true }),
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
  formatCompact(amount: number, options?: CADFormattingOptions): string {
    const locale = options?.locale || 'en-CA';

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'CAD',
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
}
