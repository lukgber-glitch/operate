/**
 * VIES API Response Interface
 * Represents the response from the VIES SOAP service
 */

export interface ViesCheckVatResponse {
  countryCode: string;
  vatNumber: string;
  requestDate: string;
  valid: boolean;
  name?: string;
  address?: string;
}

export interface ViesSoapResponse {
  countryCode: string;
  vatNumber: string;
  requestDate: Date;
  valid: boolean;
  name: string;
  address: string;
}

/**
 * Cached validation result
 */
export interface CachedVatValidation {
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  requestDate: string;
  name?: string;
  address?: string;
  cachedAt: string;
  expiresAt: string;
}

/**
 * EU Member States with VAT
 */
export const EU_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DE', // Germany
  'DK', // Denmark
  'EE', // Estonia
  'EL', // Greece
  'ES', // Spain
  'FI', // Finland
  'FR', // France
  'HR', // Croatia
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LT', // Lithuania
  'LU', // Luxembourg
  'LV', // Latvia
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SE', // Sweden
  'SI', // Slovenia
  'SK', // Slovakia
  'XI', // Northern Ireland
] as const;

export type EuCountryCode = typeof EU_COUNTRIES[number];

/**
 * VIES Service Errors
 */
export enum ViesErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MS_UNAVAILABLE = 'MS_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  SERVER_BUSY = 'SERVER_BUSY',
  INVALID_REQUESTER_INFO = 'INVALID_REQUESTER_INFO',
  GLOBAL_MAX_CONCURRENT_REQ = 'GLOBAL_MAX_CONCURRENT_REQ',
  NON_EU_COUNTRY = 'NON_EU_COUNTRY',
}
