import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { MultiCurrencyService } from '../../../currency/multi-currency.service';

/**
 * Invoice Currency Helper
 *
 * Handles all currency-related calculations and formatting for invoices:
 * - Line item amount calculations in different currencies
 * - Tax amount calculations with proper rounding
 * - Invoice total formatting for display
 * - Currency-specific decimal handling
 */
@Injectable()
export class InvoiceCurrencyHelper {
  private readonly logger = new Logger(InvoiceCurrencyHelper.name);

  constructor(private readonly multiCurrencyService: MultiCurrencyService) {}

  /**
   * Calculate line item amount in specified currency
   *
   * @param quantity - Item quantity
   * @param unitPrice - Unit price
   * @param currency - Currency code
   * @returns Properly rounded amount
   */
  calculateLineItemAmount(
    quantity: number,
    unitPrice: number,
    currency: string,
  ): number {
    const amount = quantity * unitPrice;
    return this.multiCurrencyService.roundToDecimals(amount, currency);
  }

  /**
   * Calculate tax amount for a line item
   *
   * @param amount - Line item amount (before tax)
   * @param taxRate - Tax rate percentage
   * @param currency - Currency code
   * @returns Properly rounded tax amount
   */
  calculateTaxAmount(
    amount: number,
    taxRate: number,
    currency: string,
  ): number {
    const taxAmount = (amount * taxRate) / 100;
    return this.multiCurrencyService.roundToDecimals(taxAmount, currency);
  }

  /**
   * Calculate invoice totals from line items
   *
   * @param items - Array of line items with quantity, unitPrice, taxRate
   * @param currency - Invoice currency
   * @param reverseCharge - Whether reverse charge applies (no tax)
   * @returns Object with subtotal, taxAmount, totalAmount
   */
  calculateInvoiceTotals(
    items: Array<{
      quantity: number;
      unitPrice: number;
      taxRate?: number;
    }>,
    currency: string,
    defaultTaxRate: number = 0,
    reverseCharge: boolean = false,
  ): {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      // Calculate item amount
      const itemAmount = this.calculateLineItemAmount(
        item.quantity,
        item.unitPrice,
        currency,
      );
      subtotal += itemAmount;

      // Calculate tax (unless reverse charge)
      if (!reverseCharge) {
        const itemTaxRate = item.taxRate ?? defaultTaxRate;
        const itemTax = this.calculateTaxAmount(
          itemAmount,
          itemTaxRate,
          currency,
        );
        taxAmount += itemTax;
      }
    }

    // Round subtotal and tax to currency decimals
    subtotal = this.multiCurrencyService.roundToDecimals(subtotal, currency);
    taxAmount = this.multiCurrencyService.roundToDecimals(taxAmount, currency);

    const totalAmount = this.multiCurrencyService.roundToDecimals(
      subtotal + taxAmount,
      currency,
    );

    return {
      subtotal,
      taxAmount,
      totalAmount,
    };
  }

  /**
   * Convert invoice amounts to a different currency
   *
   * @param amounts - Object with subtotal, taxAmount, totalAmount
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param exchangeRate - Exchange rate (optional, uses 1:1 if not provided)
   * @returns Converted amounts
   */
  convertInvoiceAmounts(
    amounts: {
      subtotal: number;
      taxAmount: number;
      totalAmount: number;
    },
    fromCurrency: string,
    toCurrency: string,
    exchangeRate?: number,
  ): {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    exchangeRate: number;
  } {
    const rate = exchangeRate ?? 1;

    return {
      subtotal: this.multiCurrencyService.convert(
        amounts.subtotal,
        fromCurrency,
        toCurrency,
        rate,
      ),
      taxAmount: this.multiCurrencyService.convert(
        amounts.taxAmount,
        fromCurrency,
        toCurrency,
        rate,
      ),
      totalAmount: this.multiCurrencyService.convert(
        amounts.totalAmount,
        fromCurrency,
        toCurrency,
        rate,
      ),
      exchangeRate: rate,
    };
  }

  /**
   * Format invoice amount for display
   *
   * @param amount - Amount to format
   * @param currency - Currency code
   * @param locale - Optional locale (defaults to currency's default)
   * @returns Formatted string (e.g., "$1,234.56", "1.234,56 €")
   */
  formatAmount(
    amount: number | Decimal,
    currency: string,
    locale?: string,
  ): string {
    const numericAmount = typeof amount === 'number' ? amount : Number(amount);
    return this.multiCurrencyService.formatAmount(
      numericAmount,
      currency,
      locale,
    );
  }

  /**
   * Format invoice totals for display with labels
   *
   * @param subtotal - Subtotal amount
   * @param taxAmount - Tax amount
   * @param totalAmount - Total amount
   * @param currency - Currency code
   * @param locale - Optional locale
   * @returns Object with formatted strings
   */
  formatInvoiceTotals(
    subtotal: number | Decimal,
    taxAmount: number | Decimal,
    totalAmount: number | Decimal,
    currency: string,
    locale?: string,
  ): {
    subtotal: string;
    taxAmount: string;
    totalAmount: string;
  } {
    return {
      subtotal: this.formatAmount(subtotal, currency, locale),
      taxAmount: this.formatAmount(taxAmount, currency, locale),
      totalAmount: this.formatAmount(totalAmount, currency, locale),
    };
  }

  /**
   * Get currency-specific decimal places
   *
   * @param currency - Currency code
   * @returns Number of decimal places
   */
  getCurrencyDecimals(currency: string): number {
    const currencyConfig = this.multiCurrencyService.getCurrency(currency);
    return currencyConfig.decimals;
  }

  /**
   * Validate that all line items use the same currency as the invoice
   *
   * @param invoiceCurrency - Invoice currency
   * @param items - Line items (currently items don't have currency, but this is for future-proofing)
   * @throws Error if currencies don't match
   */
  validateLineItemCurrencies(
    invoiceCurrency: string,
    items: Array<{ currency?: string }>,
  ): void {
    for (const item of items) {
      if (item.currency && item.currency !== invoiceCurrency) {
        throw new Error(
          `Line item currency ${item.currency} does not match invoice currency ${invoiceCurrency}`,
        );
      }
    }
  }

  /**
   * Calculate base currency amount for reporting
   *
   * Converts invoice amount to organization's base currency using current or provided exchange rate
   *
   * @param amount - Amount in invoice currency
   * @param invoiceCurrency - Invoice currency code
   * @param baseCurrency - Organization's base currency code
   * @param exchangeRate - Optional exchange rate (uses 1:1 if not provided)
   * @returns Amount in base currency
   */
  calculateBaseCurrencyAmount(
    amount: number,
    invoiceCurrency: string,
    baseCurrency: string,
    exchangeRate?: number,
  ): number {
    if (invoiceCurrency === baseCurrency) {
      return this.multiCurrencyService.roundToDecimals(amount, baseCurrency);
    }

    return this.multiCurrencyService.convert(
      amount,
      invoiceCurrency,
      baseCurrency,
      exchangeRate,
    );
  }

  /**
   * Create amount object with multiple currency representations
   *
   * Useful for API responses that need to show amounts in different currencies
   *
   * @param amount - Original amount
   * @param currency - Original currency
   * @param convertToCurrency - Optional currency to convert to
   * @param exchangeRate - Optional exchange rate
   * @returns Amount object with original and converted values
   */
  createMultiCurrencyAmount(
    amount: number,
    currency: string,
    convertToCurrency?: string,
    exchangeRate?: number,
  ): {
    amount: number;
    currency: string;
    formatted: string;
    converted?: {
      amount: number;
      currency: string;
      formatted: string;
      exchangeRate: number;
    };
  } {
    const result: any = {
      amount,
      currency,
      formatted: this.formatAmount(amount, currency),
    };

    if (convertToCurrency && convertToCurrency !== currency) {
      const rate = exchangeRate ?? 1;
      const convertedAmount = this.multiCurrencyService.convert(
        amount,
        currency,
        convertToCurrency,
        rate,
      );

      result.converted = {
        amount: convertedAmount,
        currency: convertToCurrency,
        formatted: this.formatAmount(convertedAmount, convertToCurrency),
        exchangeRate: rate,
      };
    }

    return result;
  }

  /**
   * Validate currency code
   *
   * @param currency - Currency code to validate
   * @throws Error if currency is not supported
   */
  validateCurrency(currency: string): void {
    this.multiCurrencyService.validateCurrencyCode(currency);
  }

  /**
   * Parse decimal values for database storage
   *
   * Converts number to Decimal with proper precision
   *
   * @param value - Number value
   * @returns Decimal object
   */
  toDecimal(value: number): Decimal {
    return new Decimal(value);
  }

  /**
   * Convert Decimal to number for calculations
   *
   * @param value - Decimal value
   * @returns Number
   */
  fromDecimal(value: Decimal): number {
    return Number(value);
  }
}
