/**
 * Currency formatting utilities
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'Fr',
  JPY: '¥',
  CNY: '¥',
};

export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for invalid currency codes
    const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export function formatCurrencyCompact(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'en-US'
): string {
  try {
    if (Math.abs(amount) >= 1000000) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.toUpperCase(),
        notation: 'compact',
        compactDisplay: 'short',
      }).format(amount);
    }
    return formatCurrency(amount, currency, locale);
  } catch (error) {
    return formatCurrency(amount, currency, locale);
  }
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
}

export function parseCurrencyAmount(value: string): number {
  // Remove currency symbols and whitespace
  const cleaned = value.replace(/[^0-9.,\-]/g, '');
  // Handle European format (comma as decimal separator)
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
}
