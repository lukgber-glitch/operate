import { BadRequestException } from '@nestjs/common';
import { EU_COUNTRIES } from '../interfaces/vies-response.interface';

/**
 * VAT Number Parser Utility
 * Provides functions to parse and normalize VAT numbers
 */

export interface ParsedVatNumber {
  countryCode: string;
  vatNumber: string;
  originalInput: string;
  normalized: string;
}

/**
 * Parse VAT number from various input formats
 * Handles formats like:
 * - DE123456789
 * - DE 123456789
 * - DE-123456789
 * - 123456789 (with separate country code)
 */
export function parseVatNumber(
  input: string,
  countryCode?: string,
): ParsedVatNumber {
  if (!input) {
    throw new BadRequestException('VAT number is required');
  }

  const originalInput = input;

  // Normalize input: remove spaces, dashes, dots
  const normalized = normalizeVatNumber(input);

  // If country code is provided separately
  if (countryCode) {
    const upperCountryCode = countryCode.toUpperCase();

    // Validate country code format
    if (!/^[A-Z]{2}$/.test(upperCountryCode)) {
      throw new BadRequestException(
        'Country code must be 2 uppercase letters',
      );
    }

    // Check if it's an EU country
    if (!EU_COUNTRIES.includes(upperCountryCode as any)) {
      throw new BadRequestException(
        `${upperCountryCode} is not an EU member state`,
      );
    }

    return {
      countryCode: upperCountryCode,
      vatNumber: normalized,
      originalInput,
      normalized: upperCountryCode + normalized,
    };
  }

  // Extract country code from VAT number (first 2 characters)
  if (normalized.length >= 3 && /^[A-Z]{2}/.test(normalized)) {
    const extractedCountry = normalized.substring(0, 2);
    const extractedNumber = normalized.substring(2);

    // Check if it's an EU country
    if (!EU_COUNTRIES.includes(extractedCountry as any)) {
      throw new BadRequestException(
        `${extractedCountry} is not an EU member state`,
      );
    }

    return {
      countryCode: extractedCountry,
      vatNumber: extractedNumber,
      originalInput,
      normalized,
    };
  }

  throw new BadRequestException(
    'Invalid VAT number format. Please provide country code or include it in the VAT number (e.g., DE123456789)',
  );
}

/**
 * Normalize VAT number by removing spaces, dashes, and dots
 */
export function normalizeVatNumber(vatNumber: string): string {
  if (!vatNumber) {
    return '';
  }

  return vatNumber
    .replace(/[\s\-\.]/g, '') // Remove spaces, dashes, dots
    .toUpperCase(); // Convert to uppercase
}

/**
 * Format VAT number for display
 * Examples:
 * - DE123456789 -> DE 123456789
 * - FR12345678901 -> FR 12 345 678 901
 */
export function formatVatNumber(
  countryCode: string,
  vatNumber: string,
): string {
  const normalized = normalizeVatNumber(vatNumber);

  switch (countryCode.toUpperCase()) {
    case 'AT': // Austria: ATU12345678
      return `${countryCode}U${normalized}`;

    case 'BE': // Belgium: BE0123456789
      return `${countryCode} ${normalized.substring(0, 4)} ${normalized.substring(4)}`;

    case 'DE': // Germany: DE123456789
      return `${countryCode} ${normalized}`;

    case 'FR': // France: FRXX123456789
      return `${countryCode} ${normalized.substring(0, 2)} ${normalized.substring(2)}`;

    case 'IT': // Italy: IT12345678901
      return `${countryCode} ${normalized.substring(0, 5)} ${normalized.substring(5)}`;

    case 'NL': // Netherlands: NL123456789B01
      return `${countryCode} ${normalized.substring(0, 9)} ${normalized.substring(9)}`;

    case 'ES': // Spain: ESX12345678
      return `${countryCode} ${normalized}`;

    case 'SE': // Sweden: SE123456789012
      return `${countryCode} ${normalized.substring(0, 6)} ${normalized.substring(6)}`;

    default:
      return `${countryCode} ${normalized}`;
  }
}

/**
 * Extract country-specific VAT number format
 * Removes country prefix and returns clean number
 */
export function extractVatNumber(fullVatNumber: string): {
  countryCode: string;
  vatNumber: string;
} {
  const normalized = normalizeVatNumber(fullVatNumber);

  if (normalized.length >= 3 && /^[A-Z]{2}/.test(normalized)) {
    return {
      countryCode: normalized.substring(0, 2),
      vatNumber: normalized.substring(2),
    };
  }

  throw new BadRequestException(
    'Invalid VAT number format. Must start with 2-letter country code.',
  );
}

/**
 * Check if a string looks like a VAT number
 */
export function isVatNumberFormat(input: string): boolean {
  if (!input) {
    return false;
  }

  const normalized = normalizeVatNumber(input);

  // Should start with 2 letters (country code) followed by numbers/letters
  return /^[A-Z]{2}[A-Z0-9]+$/.test(normalized) && normalized.length >= 5;
}

/**
 * Parse multiple VAT numbers from various formats
 */
export function parseVatNumbers(
  inputs: string[],
  defaultCountryCode?: string,
): ParsedVatNumber[] {
  return inputs.map((input) => parseVatNumber(input, defaultCountryCode));
}
