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

/**
 * Map of currency codes to their preferred locales
 * This ensures locale-aware formatting (e.g., EUR uses de-DE for proper European formatting)
 */
const CURRENCY_LOCALES: Record<string, string> = {
  EUR: 'de-DE',
  USD: 'en-US',
  GBP: 'en-GB',
  CHF: 'de-CH',
  CAD: 'en-CA',
  AUD: 'en-AU',
  NZD: 'en-NZ',
  SGD: 'en-SG',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  KRW: 'ko-KR',
  INR: 'en-IN',
  HKD: 'zh-HK',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  PLN: 'pl-PL',
  CZK: 'cs-CZ',
  HUF: 'hu-HU',
  RON: 'ro-RO',
  MXN: 'es-MX',
  BRL: 'pt-BR',
  RUB: 'ru-RU',
  TRY: 'tr-TR',
  THB: 'th-TH',
  MYR: 'ms-MY',
  IDR: 'id-ID',
  PHP: 'en-PH',
  VND: 'vi-VN',
  ZAR: 'en-ZA',
  NGN: 'en-NG',
  ILS: 'he-IL',
};

export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale?: string
): string {
  try {
    const currencyCode = currency.toUpperCase();
    // Use currency-specific locale if not provided
    const selectedLocale = locale || CURRENCY_LOCALES[currencyCode] || 'en-US';

    return new Intl.NumberFormat(selectedLocale, {
      style: 'currency',
      currency: currencyCode,
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
  locale?: string
): string {
  try {
    const currencyCode = currency.toUpperCase();
    // Use currency-specific locale if not provided
    const selectedLocale = locale || CURRENCY_LOCALES[currencyCode] || 'en-US';

    if (Math.abs(amount) >= 1000000) {
      return new Intl.NumberFormat(selectedLocale, {
        style: 'currency',
        currency: currencyCode,
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
