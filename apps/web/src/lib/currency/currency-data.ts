import type { Currency, CurrencyCode, CurrencyRegion } from '@/types/currency';

/**
 * Static currency data
 * In production, this could be fetched from backend
 */
export const CURRENCY_DATA: Record<CurrencyCode, Currency> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    countries: ['US'],
    flag: '🇺🇸',
    format: 'before',
    locale: 'en-US',
    region: 'North America',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT'],
    flag: '🇪🇺',
    format: 'after',
    locale: 'de-DE',
    region: 'Europe',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    countries: ['GB'],
    flag: '🇬🇧',
    format: 'before',
    locale: 'en-GB',
    region: 'Europe',
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimals: 2,
    countries: ['CH'],
    flag: '🇨🇭',
    format: 'before',
    locale: 'de-CH',
    region: 'Europe',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimals: 2,
    countries: ['CA'],
    flag: '🇨🇦',
    format: 'before',
    locale: 'en-CA',
    region: 'North America',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimals: 2,
    countries: ['AU'],
    flag: '🇦🇺',
    format: 'before',
    locale: 'en-AU',
    region: 'Oceania',
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    decimals: 2,
    countries: ['NZ'],
    flag: '🇳🇿',
    format: 'before',
    locale: 'en-NZ',
    region: 'Oceania',
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
    region: 'Asia',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0,
    countries: ['JP'],
    flag: '🇯🇵',
    format: 'before',
    locale: 'ja-JP',
    region: 'Asia',
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
    region: 'Asia',
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    decimals: 0,
    countries: ['KR'],
    flag: '🇰🇷',
    format: 'before',
    locale: 'ko-KR',
    region: 'Asia',
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
    region: 'Asia',
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
    region: 'Asia',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    decimals: 2,
    countries: ['AE'],
    flag: '🇦🇪',
    format: 'before',
    locale: 'ar-AE',
    region: 'Middle East',
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    decimals: 2,
    countries: ['SA'],
    flag: '🇸🇦',
    format: 'before',
    locale: 'ar-SA',
    region: 'Middle East',
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    decimals: 2,
    countries: ['SE'],
    flag: '🇸🇪',
    format: 'after',
    locale: 'sv-SE',
    region: 'Europe',
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    decimals: 2,
    countries: ['NO'],
    flag: '🇳🇴',
    format: 'after',
    locale: 'nb-NO',
    region: 'Europe',
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    decimals: 2,
    countries: ['DK'],
    flag: '🇩🇰',
    format: 'after',
    locale: 'da-DK',
    region: 'Europe',
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Złoty',
    decimals: 2,
    countries: ['PL'],
    flag: '🇵🇱',
    format: 'after',
    locale: 'pl-PL',
    region: 'Europe',
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
    region: 'Europe',
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft',
    name: 'Hungarian Forint',
    decimals: 0,
    countries: ['HU'],
    flag: '🇭🇺',
    format: 'after',
    locale: 'hu-HU',
    region: 'Europe',
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
    region: 'Europe',
  },
  MXN: {
    code: 'MXN',
    symbol: 'Mex$',
    name: 'Mexican Peso',
    decimals: 2,
    countries: ['MX'],
    flag: '🇲🇽',
    format: 'before',
    locale: 'es-MX',
    region: 'North America',
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
    region: 'South America',
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    decimals: 2,
    countries: ['RU'],
    flag: '🇷🇺',
    format: 'after',
    locale: 'ru-RU',
    region: 'Europe',
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    decimals: 2,
    countries: ['TR'],
    flag: '🇹🇷',
    format: 'before',
    locale: 'tr-TR',
    region: 'Middle East',
  },
  THB: {
    code: 'THB',
    symbol: '฿',
    name: 'Thai Baht',
    decimals: 2,
    countries: ['TH'],
    flag: '🇹🇭',
    format: 'before',
    locale: 'th-TH',
    region: 'Asia',
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
    region: 'Asia',
  },
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    decimals: 0,
    countries: ['ID'],
    flag: '🇮🇩',
    format: 'before',
    locale: 'id-ID',
    region: 'Asia',
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
    region: 'Asia',
  },
  VND: {
    code: 'VND',
    symbol: '₫',
    name: 'Vietnamese Dong',
    decimals: 0,
    countries: ['VN'],
    flag: '🇻🇳',
    format: 'after',
    locale: 'vi-VN',
    region: 'Asia',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    decimals: 2,
    countries: ['ZA'],
    flag: '🇿🇦',
    format: 'before',
    locale: 'en-ZA',
    region: 'Africa',
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
    region: 'Africa',
  },
  ILS: {
    code: 'ILS',
    symbol: '₪',
    name: 'Israeli Shekel',
    decimals: 2,
    countries: ['IL'],
    flag: '🇮🇱',
    format: 'before',
    locale: 'he-IL',
    region: 'Middle East',
  },
};

/**
 * Popular currencies shown at the top
 */
export const POPULAR_CURRENCIES: CurrencyCode[] = [
  'USD',
  'EUR',
  'GBP',
  'CHF',
  'JPY',
  'CAD',
];

/**
 * Get currencies grouped by region
 */
export function getCurrenciesByRegion(): Record<CurrencyRegion, Currency[]> {
  const grouped: Partial<Record<CurrencyRegion, Currency[]>> = {};

  Object.values(CURRENCY_DATA).forEach((currency) => {
    const region = currency.region || 'Europe';
    if (!grouped[region]) {
      grouped[region] = [];
    }
    grouped[region]!.push(currency);
  });

  // Sort currencies within each region by name
  Object.keys(grouped).forEach((region) => {
    grouped[region as CurrencyRegion]!.sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped as Record<CurrencyRegion, Currency[]>;
}

/**
 * Get currency by code
 */
export function getCurrency(code: CurrencyCode): Currency | undefined {
  return CURRENCY_DATA[code];
}

/**
 * Get all currencies as array
 */
export function getAllCurrencies(): Currency[] {
  return Object.values(CURRENCY_DATA);
}

/**
 * Search currencies by code or name
 */
export function searchCurrencies(query: string): Currency[] {
  const searchTerm = query.toLowerCase();
  return getAllCurrencies().filter(
    (currency) =>
      currency.code.toLowerCase().includes(searchTerm) ||
      currency.name.toLowerCase().includes(searchTerm)
  );
}
