import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  CURRENCIES,
  CurrencyConfig,
  SUPPORTED_CURRENCY_CODES,
  COUNTRY_TO_CURRENCY,
} from './currency.config';

/**
 * Multi-Currency Service
 *
 * Handles all currency-related operations across the platform:
 * - Currency metadata and configuration
 * - Currency conversion (with exchange rates from exchange-rate.service)
 * - Amount formatting (locale-aware)
 * - Amount parsing
 * - Currency rounding
 * - Country to currency mapping
 */
@Injectable()
export class MultiCurrencyService {
  private readonly logger = new Logger(MultiCurrencyService.name);

  /**
   * Get all supported currencies
   */
  getAllCurrencies(): CurrencyConfig[] {
    return Object.values(CURRENCIES);
  }

  /**
   * Get list of all supported currency codes
   */
  getSupportedCurrencyCodes(): string[] {
    return SUPPORTED_CURRENCY_CODES;
  }

  /**
   * Get currency configuration by code
   */
  getCurrency(code: string): CurrencyConfig {
    const upperCode = code.toUpperCase();

    if (!CURRENCIES[upperCode]) {
      throw new BadRequestException(
        `Unsupported currency code: ${code}. Supported currencies: ${SUPPORTED_CURRENCY_CODES.join(', ')}`,
      );
    }

    return CURRENCIES[upperCode];
  }

  /**
   * Check if a currency code is supported
   */
  isCurrencySupported(code: string): boolean {
    return SUPPORTED_CURRENCY_CODES.includes(code.toUpperCase());
  }

  /**
   * Get currency by country code (ISO 3166-1 alpha-2)
   */
  getCurrencyByCountry(countryCode: string): CurrencyConfig | null {
    const upperCountryCode = countryCode.toUpperCase();
    const currencyCode = COUNTRY_TO_CURRENCY[upperCountryCode];

    if (!currencyCode) {
      this.logger.warn(`No currency found for country code: ${countryCode}`);
      return null;
    }

    return this.getCurrency(currencyCode);
  }

  /**
   * Convert amount from one currency to another
   *
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   * @param exchangeRate - Optional fixed rate (if not provided, uses 1:1 default)
   * @returns Converted amount rounded to target currency decimals
   */
  convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRate?: number,
  ): number {
    // Validate currencies
    const from = this.getCurrency(fromCurrency);
    const to = this.getCurrency(toCurrency);

    // Same currency, no conversion needed
    if (from.code === to.code) {
      return this.roundToDecimals(amount, to.code);
    }

    // Use provided rate or default to 1:1
    // In production, this will integrate with exchange-rate.service (W20-T4)
    const rate = exchangeRate ?? 1;

    if (rate <= 0) {
      throw new BadRequestException('Exchange rate must be positive');
    }

    const convertedAmount = amount * rate;

    // Round to target currency decimals
    return this.roundToDecimals(convertedAmount, to.code);
  }

  /**
   * Format amount for display with currency symbol and locale-aware formatting
   *
   * @param amount - Amount to format
   * @param currencyCode - Currency code
   * @param locale - Optional locale (defaults to currency default)
   * @param options - Formatting options
   * @returns Formatted string (e.g., "$1,234.56", "1.234,56 €")
   */
  formatAmount(
    amount: number,
    currencyCode: string,
    locale?: string,
    options?: {
      showSymbol?: boolean;
      showCode?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    },
  ): string {
    const currency = this.getCurrency(currencyCode);
    const targetLocale = locale || currency.locale || 'en-US';

    const showSymbol = options?.showSymbol !== false; // Default true
    const showCode = options?.showCode ?? false; // Default false

    try {
      const formatter = new Intl.NumberFormat(targetLocale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: currency.code,
        minimumFractionDigits:
          options?.minimumFractionDigits ?? currency.decimals,
        maximumFractionDigits:
          options?.maximumFractionDigits ?? currency.decimals,
      });

      let formatted = formatter.format(amount);

      // Add currency code if requested
      if (showCode && !showSymbol) {
        formatted = `${formatted} ${currency.code}`;
      } else if (showCode && showSymbol) {
        formatted = `${formatted} (${currency.code})`;
      }

      return formatted;
    } catch (error) {
      this.logger.error(
        `Error formatting amount: ${error.message}`,
        error.stack,
      );
      // Fallback to simple formatting
      return `${currency.symbol}${amount.toFixed(currency.decimals)}`;
    }
  }

  /**
   * Parse amount from string input
   *
   * Handles various input formats:
   * - "1234.56"
   * - "$1,234.56"
   * - "1.234,56 €"
   * - "1 234,56"
   *
   * @param input - String to parse
   * @param currencyCode - Currency code for context
   * @param locale - Optional locale for parsing rules
   * @returns Parsed numeric amount
   */
  parseAmount(input: string, currencyCode: string, locale?: string): number {
    const currency = this.getCurrency(currencyCode);

    // Remove currency symbols and codes
    let cleaned = input.trim();

    // Remove currency symbol
    cleaned = cleaned.replace(new RegExp(currency.symbol, 'g'), '');

    // Remove currency code
    cleaned = cleaned.replace(new RegExp(currency.code, 'gi'), '');

    // Remove whitespace
    cleaned = cleaned.trim();

    // Detect decimal separator based on locale or currency
    const targetLocale = locale || currency.locale || 'en-US';
    const usesCommaDecimal = targetLocale.startsWith('de') ||
      targetLocale.startsWith('fr') ||
      targetLocale.startsWith('es') ||
      targetLocale.startsWith('it') ||
      targetLocale.startsWith('pt') ||
      targetLocale.startsWith('nl') ||
      targetLocale.startsWith('pl') ||
      targetLocale.startsWith('cs') ||
      targetLocale.startsWith('hu') ||
      targetLocale.startsWith('ro') ||
      targetLocale.startsWith('sv') ||
      targetLocale.startsWith('no') ||
      targetLocale.startsWith('da');

    if (usesCommaDecimal) {
      // European format: 1.234,56 or 1 234,56
      // Remove thousand separators (. or space)
      cleaned = cleaned.replace(/[\.\s]/g, '');
      // Replace comma decimal with dot
      cleaned = cleaned.replace(',', '.');
    } else {
      // US/UK format: 1,234.56
      // Remove thousand separators (,)
      cleaned = cleaned.replace(/,/g, '');
    }

    // Parse the number
    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) {
      throw new BadRequestException(
        `Unable to parse amount: "${input}". Expected format: ${currency.symbol}1234.56`,
      );
    }

    return this.roundToDecimals(parsed, currency.code);
  }

  /**
   * Round amount to currency-specific decimal places
   *
   * @param amount - Amount to round
   * @param currencyCode - Currency code
   * @returns Rounded amount
   */
  roundToDecimals(amount: number, currencyCode: string): number {
    const currency = this.getCurrency(currencyCode);

    if (currency.decimals === 0) {
      return Math.round(amount);
    }

    // Handle cash rounding for CHF (0.05 increments)
    if (currency.rounding === 'cash' && currency.code === 'CHF') {
      return Math.round(amount * 20) / 20; // Round to nearest 0.05
    }

    // Standard rounding
    const multiplier = Math.pow(10, currency.decimals);
    return Math.round(amount * multiplier) / multiplier;
  }

  /**
   * Get currency details with formatted examples
   *
   * Useful for UI currency pickers
   */
  getCurrencyWithExamples(code: string): CurrencyConfig & {
    examples: {
      small: string;
      medium: string;
      large: string;
    };
  } {
    const currency = this.getCurrency(code);

    return {
      ...currency,
      examples: {
        small: this.formatAmount(9.99, code),
        medium: this.formatAmount(1234.56, code),
        large: this.formatAmount(999999.99, code),
      },
    };
  }

  /**
   * Get all currencies grouped by region
   */
  getCurrenciesByRegion(): Record<string, CurrencyConfig[]> {
    const regions = {
      'North America': ['USD', 'CAD', 'MXN'],
      Europe: [
        'EUR',
        'GBP',
        'CHF',
        'SEK',
        'NOK',
        'DKK',
        'PLN',
        'CZK',
        'HUF',
        'RON',
        'RUB',
        'TRY',
      ],
      Asia: [
        'JPY',
        'CNY',
        'INR',
        'KRW',
        'HKD',
        'SGD',
        'THB',
        'MYR',
        'IDR',
        'PHP',
        'VND',
      ],
      Oceania: ['AUD', 'NZD'],
      'Middle East': ['AED', 'SAR', 'ILS'],
      'South America': ['BRL'],
      Africa: ['ZAR', 'NGN'],
    };

    const result: Record<string, CurrencyConfig[]> = {};

    Object.entries(regions).forEach(([region, codes]) => {
      result[region] = codes
        .filter((code) => this.isCurrencySupported(code))
        .map((code) => this.getCurrency(code));
    });

    return result;
  }

  /**
   * Validate currency code
   */
  validateCurrencyCode(code: string): void {
    if (!this.isCurrencySupported(code)) {
      throw new BadRequestException(
        `Unsupported currency code: ${code}. Supported currencies: ${SUPPORTED_CURRENCY_CODES.join(', ')}`,
      );
    }
  }

  /**
   * Get currency comparison
   * Useful for displaying exchange rate context
   */
  compareCurrencies(
    code1: string,
    code2: string,
  ): {
    currency1: CurrencyConfig;
    currency2: CurrencyConfig;
    sameDecimals: boolean;
    conversionNote: string;
  } {
    const currency1 = this.getCurrency(code1);
    const currency2 = this.getCurrency(code2);

    return {
      currency1,
      currency2,
      sameDecimals: currency1.decimals === currency2.decimals,
      conversionNote:
        currency1.decimals !== currency2.decimals
          ? `Note: ${currency1.code} uses ${currency1.decimals} decimals, ${currency2.code} uses ${currency2.decimals} decimals`
          : '',
    };
  }
}
