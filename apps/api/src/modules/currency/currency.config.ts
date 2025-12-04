/**
 * Currency Configuration
 *
 * Comprehensive currency metadata for all supported currencies.
 * Based on ISO 4217 currency codes.
 */

export interface CurrencyConfig {
  code: string;           // ISO 4217 code (USD, EUR, etc.)
  symbol: string;         // Currency symbol ($, €, £, etc.)
  name: string;          // Full name (US Dollar, Euro, etc.)
  decimals: number;      // Number of decimal places (2 for most, 0 for JPY, KRW)
  countries: string[];   // ISO 3166-1 alpha-2 country codes
  flag: string;          // Emoji flag (primary country)
  format: 'before' | 'after'; // Symbol position relative to amount
  locale?: string;       // Default locale for formatting (e.g., 'en-US', 'de-DE')
  rounding?: 'standard' | 'cash'; // Rounding method (cash for 0.05 increments in CHF)
}

/**
 * All supported currencies with complete metadata
 */
export const CURRENCIES: Record<string, CurrencyConfig> = {
  // Major Global Currencies
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    countries: ['US', 'PR', 'GU', 'VI', 'AS', 'MP', 'FM', 'MH', 'PW'],
    flag: '🇺🇸',
    format: 'before',
    locale: 'en-US',
    rounding: 'standard',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    countries: [
      'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'GR', 'FI',
      'IE', 'LU', 'SI', 'CY', 'MT', 'SK', 'EE', 'LV', 'LT', 'HR',
    ],
    flag: '🇪🇺',
    format: 'after',
    locale: 'de-DE',
    rounding: 'standard',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound Sterling',
    decimals: 2,
    countries: ['GB', 'IM', 'JE', 'GG'],
    flag: '🇬🇧',
    format: 'before',
    locale: 'en-GB',
    rounding: 'standard',
  },

  // DACH Region
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimals: 2,
    countries: ['CH', 'LI'],
    flag: '🇨🇭',
    format: 'after',
    locale: 'de-CH',
    rounding: 'cash', // Switzerland uses 0.05 rounding for cash
  },

  // Commonwealth & Anglo Countries
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    decimals: 2,
    countries: ['CA'],
    flag: '🇨🇦',
    format: 'before',
    locale: 'en-CA',
    rounding: 'standard',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimals: 2,
    countries: ['AU', 'CX', 'CC', 'NF'],
    flag: '🇦🇺',
    format: 'before',
    locale: 'en-AU',
    rounding: 'standard',
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    decimals: 2,
    countries: ['NZ', 'CK', 'NU', 'PN', 'TK'],
    flag: '🇳🇿',
    format: 'before',
    locale: 'en-NZ',
    rounding: 'standard',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimals: 2,
    countries: ['SG'],
    flag: '🇸🇬',
    format: 'before',
    locale: 'en-SG',
    rounding: 'standard',
  },

  // Asian Currencies
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0, // No decimal places
    countries: ['JP'],
    flag: '🇯🇵',
    format: 'before',
    locale: 'ja-JP',
    rounding: 'standard',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimals: 2,
    countries: ['CN'],
    flag: '🇨🇳',
    format: 'before',
    locale: 'zh-CN',
    rounding: 'standard',
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    decimals: 0, // No decimal places
    countries: ['KR'],
    flag: '🇰🇷',
    format: 'before',
    locale: 'ko-KR',
    rounding: 'standard',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimals: 2,
    countries: ['IN'],
    flag: '🇮🇳',
    format: 'before',
    locale: 'en-IN',
    rounding: 'standard',
  },
  HKD: {
    code: 'HKD',
    symbol: 'HK$',
    name: 'Hong Kong Dollar',
    decimals: 2,
    countries: ['HK'],
    flag: '🇭🇰',
    format: 'before',
    locale: 'en-HK',
    rounding: 'standard',
  },

  // Middle East
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    decimals: 2,
    countries: ['AE'],
    flag: '🇦🇪',
    format: 'after',
    locale: 'ar-AE',
    rounding: 'standard',
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    decimals: 2,
    countries: ['SA'],
    flag: '🇸🇦',
    format: 'after',
    locale: 'ar-SA',
    rounding: 'standard',
  },

  // Nordic Countries
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    decimals: 2,
    countries: ['SE'],
    flag: '🇸🇪',
    format: 'after',
    locale: 'sv-SE',
    rounding: 'standard',
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    decimals: 2,
    countries: ['NO', 'SJ', 'BV'],
    flag: '🇳🇴',
    format: 'after',
    locale: 'nb-NO',
    rounding: 'standard',
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    decimals: 2,
    countries: ['DK', 'FO', 'GL'],
    flag: '🇩🇰',
    format: 'after',
    locale: 'da-DK',
    rounding: 'standard',
  },

  // Eastern European
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Złoty',
    decimals: 2,
    countries: ['PL'],
    flag: '🇵🇱',
    format: 'after',
    locale: 'pl-PL',
    rounding: 'standard',
  },
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    name: 'Czech Koruna',
    decimals: 2,
    countries: ['CZ'],
    flag: '🇨🇿',
    format: 'after',
    locale: 'cs-CZ',
    rounding: 'standard',
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft',
    name: 'Hungarian Forint',
    decimals: 0, // No decimal places
    countries: ['HU'],
    flag: '🇭🇺',
    format: 'after',
    locale: 'hu-HU',
    rounding: 'standard',
  },
  RON: {
    code: 'RON',
    symbol: 'lei',
    name: 'Romanian Leu',
    decimals: 2,
    countries: ['RO'],
    flag: '🇷🇴',
    format: 'after',
    locale: 'ro-RO',
    rounding: 'standard',
  },

  // Latin America
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    decimals: 2,
    countries: ['MX'],
    flag: '🇲🇽',
    format: 'before',
    locale: 'es-MX',
    rounding: 'standard',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    decimals: 2,
    countries: ['BR'],
    flag: '🇧🇷',
    format: 'before',
    locale: 'pt-BR',
    rounding: 'standard',
  },

  // Other European
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    decimals: 2,
    countries: ['RU'],
    flag: '🇷🇺',
    format: 'after',
    locale: 'ru-RU',
    rounding: 'standard',
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    decimals: 2,
    countries: ['TR'],
    flag: '🇹🇷',
    format: 'after',
    locale: 'tr-TR',
    rounding: 'standard',
  },

  // Southeast Asia
  THB: {
    code: 'THB',
    symbol: '฿',
    name: 'Thai Baht',
    decimals: 2,
    countries: ['TH'],
    flag: '🇹🇭',
    format: 'before',
    locale: 'th-TH',
    rounding: 'standard',
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    name: 'Malaysian Ringgit',
    decimals: 2,
    countries: ['MY'],
    flag: '🇲🇾',
    format: 'before',
    locale: 'ms-MY',
    rounding: 'standard',
  },
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    decimals: 0, // No decimal places
    countries: ['ID'],
    flag: '🇮🇩',
    format: 'before',
    locale: 'id-ID',
    rounding: 'standard',
  },
  PHP: {
    code: 'PHP',
    symbol: '₱',
    name: 'Philippine Peso',
    decimals: 2,
    countries: ['PH'],
    flag: '🇵🇭',
    format: 'before',
    locale: 'en-PH',
    rounding: 'standard',
  },
  VND: {
    code: 'VND',
    symbol: '₫',
    name: 'Vietnamese Dong',
    decimals: 0, // No decimal places
    countries: ['VN'],
    flag: '🇻🇳',
    format: 'after',
    locale: 'vi-VN',
    rounding: 'standard',
  },

  // Africa
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    decimals: 2,
    countries: ['ZA', 'LS', 'NA'],
    flag: '🇿🇦',
    format: 'before',
    locale: 'en-ZA',
    rounding: 'standard',
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    decimals: 2,
    countries: ['NG'],
    flag: '🇳🇬',
    format: 'before',
    locale: 'en-NG',
    rounding: 'standard',
  },

  // Other
  ILS: {
    code: 'ILS',
    symbol: '₪',
    name: 'Israeli New Shekel',
    decimals: 2,
    countries: ['IL', 'PS'],
    flag: '🇮🇱',
    format: 'before',
    locale: 'he-IL',
    rounding: 'standard',
  },
};

/**
 * Get list of all supported currency codes
 */
export const SUPPORTED_CURRENCY_CODES = Object.keys(CURRENCIES);

/**
 * Country to currency mapping (ISO 3166-1 alpha-2 to ISO 4217)
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = (() => {
  const map: Record<string, string> = {};

  Object.entries(CURRENCIES).forEach(([code, config]) => {
    config.countries.forEach((country) => {
      // First currency wins (for countries with multiple currencies)
      if (!map[country]) {
        map[country] = code;
      }
    });
  });

  return map;
})();

/**
 * Common currency pairs for exchange rate tracking
 * Format: [base, quote] - e.g., ['EUR', 'USD'] means 1 EUR = X USD
 */
export const COMMON_CURRENCY_PAIRS: [string, string][] = [
  // Major pairs with USD
  ['EUR', 'USD'],
  ['GBP', 'USD'],
  ['JPY', 'USD'],
  ['CHF', 'USD'],
  ['CAD', 'USD'],
  ['AUD', 'USD'],

  // Major pairs with EUR
  ['GBP', 'EUR'],
  ['CHF', 'EUR'],
  ['JPY', 'EUR'],

  // Regional pairs
  ['EUR', 'GBP'],
  ['EUR', 'CHF'],
  ['USD', 'CAD'],
  ['USD', 'MXN'],
  ['EUR', 'PLN'],
  ['EUR', 'CZK'],
  ['EUR', 'HUF'],
  ['EUR', 'SEK'],
  ['EUR', 'NOK'],
  ['EUR', 'DKK'],

  // Asian pairs
  ['USD', 'CNY'],
  ['USD', 'INR'],
  ['USD', 'SGD'],
  ['USD', 'HKD'],
  ['USD', 'THB'],

  // Middle East pairs
  ['USD', 'AED'],
  ['USD', 'SAR'],
  ['AED', 'SAR'],
  ['EUR', 'AED'],
  ['EUR', 'SAR'],
  ['GBP', 'AED'],
  ['GBP', 'SAR'],
];
