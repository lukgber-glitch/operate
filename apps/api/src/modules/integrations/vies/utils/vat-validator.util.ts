import { BadRequestException } from '@nestjs/common';
import { normalizeVatNumber } from './vat-parser.util';

/**
 * VAT Number Validator Utility
 * Provides format validation for EU VAT numbers by country
 */

export interface VatValidationPattern {
  pattern: RegExp;
  description: string;
  example: string;
}

/**
 * VAT number format patterns by country
 * Based on official EU VAT number formats
 */
export const VAT_PATTERNS: Record<string, VatValidationPattern> = {
  AT: {
    pattern: /^U\d{8}$/,
    description: 'Austria: U followed by 8 digits',
    example: 'ATU12345678',
  },
  BE: {
    pattern: /^(0|1)\d{9}$/,
    description: 'Belgium: 0 or 1 followed by 9 digits',
    example: 'BE0123456789',
  },
  BG: {
    pattern: /^\d{9,10}$/,
    description: 'Bulgaria: 9 or 10 digits',
    example: 'BG123456789',
  },
  CY: {
    pattern: /^\d{8}[A-Z]$/,
    description: 'Cyprus: 8 digits followed by 1 letter',
    example: 'CY12345678A',
  },
  CZ: {
    pattern: /^\d{8,10}$/,
    description: 'Czech Republic: 8 to 10 digits',
    example: 'CZ12345678',
  },
  DE: {
    pattern: /^\d{9}$/,
    description: 'Germany: 9 digits',
    example: 'DE123456789',
  },
  DK: {
    pattern: /^\d{8}$/,
    description: 'Denmark: 8 digits',
    example: 'DK12345678',
  },
  EE: {
    pattern: /^\d{9}$/,
    description: 'Estonia: 9 digits',
    example: 'EE123456789',
  },
  EL: {
    pattern: /^\d{9}$/,
    description: 'Greece: 9 digits',
    example: 'EL123456789',
  },
  ES: {
    pattern: /^[A-Z0-9]\d{7}[A-Z0-9]$/,
    description: 'Spain: 1 letter/digit, 7 digits, 1 letter/digit',
    example: 'ESX12345678',
  },
  FI: {
    pattern: /^\d{8}$/,
    description: 'Finland: 8 digits',
    example: 'FI12345678',
  },
  FR: {
    pattern: /^[A-Z0-9]{2}\d{9}$/,
    description: 'France: 2 letters/digits followed by 9 digits',
    example: 'FRXX123456789',
  },
  HR: {
    pattern: /^\d{11}$/,
    description: 'Croatia: 11 digits',
    example: 'HR12345678901',
  },
  HU: {
    pattern: /^\d{8}$/,
    description: 'Hungary: 8 digits',
    example: 'HU12345678',
  },
  IE: {
    pattern: /^(\d{7}[A-Z]{1,2}|\d[A-Z]\d{5}[A-Z])$/,
    description: 'Ireland: 7 digits + 1-2 letters, or special format',
    example: 'IE1234567X',
  },
  IT: {
    pattern: /^\d{11}$/,
    description: 'Italy: 11 digits',
    example: 'IT12345678901',
  },
  LT: {
    pattern: /^(\d{9}|\d{12})$/,
    description: 'Lithuania: 9 or 12 digits',
    example: 'LT123456789',
  },
  LU: {
    pattern: /^\d{8}$/,
    description: 'Luxembourg: 8 digits',
    example: 'LU12345678',
  },
  LV: {
    pattern: /^\d{11}$/,
    description: 'Latvia: 11 digits',
    example: 'LV12345678901',
  },
  MT: {
    pattern: /^\d{8}$/,
    description: 'Malta: 8 digits',
    example: 'MT12345678',
  },
  NL: {
    pattern: /^\d{9}B\d{2}$/,
    description: 'Netherlands: 9 digits + B + 2 digits',
    example: 'NL123456789B01',
  },
  PL: {
    pattern: /^\d{10}$/,
    description: 'Poland: 10 digits',
    example: 'PL1234567890',
  },
  PT: {
    pattern: /^\d{9}$/,
    description: 'Portugal: 9 digits',
    example: 'PT123456789',
  },
  RO: {
    pattern: /^\d{2,10}$/,
    description: 'Romania: 2 to 10 digits',
    example: 'RO12345678',
  },
  SE: {
    pattern: /^\d{12}$/,
    description: 'Sweden: 12 digits',
    example: 'SE123456789012',
  },
  SI: {
    pattern: /^\d{8}$/,
    description: 'Slovenia: 8 digits',
    example: 'SI12345678',
  },
  SK: {
    pattern: /^\d{10}$/,
    description: 'Slovakia: 10 digits',
    example: 'SK1234567890',
  },
  XI: {
    pattern: /^(\d{9}|\d{12}|(GD|HA)\d{3})$/,
    description: 'Northern Ireland: 9 or 12 digits, or GD/HA + 3 digits',
    example: 'XI123456789',
  },
};

/**
 * Validate VAT number format for a specific country
 */
export function validateVatFormat(
  countryCode: string,
  vatNumber: string,
): {
  valid: boolean;
  error?: string;
} {
  const upperCountryCode = countryCode.toUpperCase();
  const normalized = normalizeVatNumber(vatNumber);

  // Get pattern for country
  const pattern = VAT_PATTERNS[upperCountryCode];

  if (!pattern) {
    return {
      valid: false,
      error: `No validation pattern available for country ${upperCountryCode}`,
    };
  }

  // Test against pattern
  if (!pattern.pattern.test(normalized)) {
    return {
      valid: false,
      error: `Invalid VAT format for ${upperCountryCode}. Expected: ${pattern.description}. Example: ${pattern.example}`,
    };
  }

  return { valid: true };
}

/**
 * Validate VAT number format and throw if invalid
 */
export function assertValidVatFormat(
  countryCode: string,
  vatNumber: string,
): void {
  const result = validateVatFormat(countryCode, vatNumber);

  if (!result.valid) {
    throw new BadRequestException(result.error);
  }
}

/**
 * Get VAT format information for a country
 */
export function getVatFormatInfo(countryCode: string): VatValidationPattern | null {
  return VAT_PATTERNS[countryCode.toUpperCase()] || null;
}

/**
 * Check if VAT number passes basic format validation
 * (Does not verify with VIES, only format check)
 */
export function isValidVatFormat(
  countryCode: string,
  vatNumber: string,
): boolean {
  const result = validateVatFormat(countryCode, vatNumber);
  return result.valid;
}

/**
 * Get all supported country codes
 */
export function getSupportedCountries(): string[] {
  return Object.keys(VAT_PATTERNS);
}

/**
 * Validate multiple VAT numbers format
 */
export function validateMultipleVatFormats(
  entries: Array<{ countryCode: string; vatNumber: string }>,
): Array<{
  countryCode: string;
  vatNumber: string;
  valid: boolean;
  error?: string;
}> {
  return entries.map((entry) => {
    const result = validateVatFormat(entry.countryCode, entry.vatNumber);
    return {
      countryCode: entry.countryCode,
      vatNumber: entry.vatNumber,
      ...result,
    };
  });
}

/**
 * Perform Luhn check (MOD 10) algorithm
 * Used by some countries for checksum validation
 */
export function luhnCheck(digits: string): boolean {
  let sum = 0;
  let isEven = false;

  // Process digits from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Advanced validation for specific countries with checksums
 * This can be extended to add country-specific checksum algorithms
 */
export function validateVatChecksum(
  countryCode: string,
  vatNumber: string,
): {
  valid: boolean;
  error?: string;
} {
  const upperCountryCode = countryCode.toUpperCase();
  const normalized = normalizeVatNumber(vatNumber);

  // Add country-specific checksum validation here
  // For now, this is a placeholder for future enhancements

  switch (upperCountryCode) {
    case 'DE':
      // German VAT numbers have a specific checksum algorithm
      // This is a simplified version - actual implementation would be more complex
      return { valid: true }; // Placeholder

    case 'NL':
      // Dutch VAT numbers have a MOD 11 checksum
      // This is a placeholder for actual implementation
      return { valid: true }; // Placeholder

    default:
      // Most countries don't have easily verifiable checksums
      return { valid: true };
  }
}
