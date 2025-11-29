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
} as const;

export type CountryCode = keyof typeof SUPPORTED_COUNTRIES;
