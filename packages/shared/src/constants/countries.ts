/**
 * Country-related constants
 */

export const SUPPORTED_COUNTRIES = {
  DE: {
    code: 'DE',
    code3: 'DEU',
    name: 'Germany',
    nameNative: 'Deutschland',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    timezone: 'Europe/Berlin',
    fiscalYearStart: '01-01',
  },
  AT: {
    code: 'AT',
    code3: 'AUT',
    name: 'Austria',
    nameNative: 'Österreich',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-AT',
    timezone: 'Europe/Vienna',
    fiscalYearStart: '01-01',
  },
  CH: {
    code: 'CH',
    code3: 'CHE',
    name: 'Switzerland',
    nameNative: 'Schweiz',
    currency: 'CHF',
    currencySymbol: 'CHF',
    locale: 'de-CH',
    timezone: 'Europe/Zurich',
    fiscalYearStart: '01-01',
  },
  JP: {
    code: 'JP',
    code3: 'JPN',
    name: 'Japan',
    nameNative: '日本',
    currency: 'JPY',
    currencySymbol: '¥',
    locale: 'ja-JP',
    timezone: 'Asia/Tokyo',
    fiscalYearStart: '04-01', // Japan fiscal year starts April 1
  },
} as const;

export type CountryCode = keyof typeof SUPPORTED_COUNTRIES;
