/**
 * Australian Business Number (ABN) and Australian Company Number (ACN) Validation
 * Task: W26-T4 - Canadian/Australian tax rules
 *
 * ABN Format: 11 digits with modulus 89 check algorithm
 * Example: 51 824 753 556
 *
 * ACN Format: 9 digits with check digit algorithm
 * Example: 123 456 789
 */

import {
  AustralianBusinessNumber,
  AustralianCompanyNumber,
} from '@operate/shared/types/tax/australia-tax.types';

/**
 * Validate an Australian Business Number (ABN)
 * Uses modulus 89 algorithm
 */
export function validateABN(abn: string): boolean {
  // Remove spaces and non-digits
  const cleaned = abn.replace(/\s/g, '').replace(/\D/g, '');

  // Check if it's 11 digits
  if (cleaned.length !== 11) {
    return false;
  }

  // Convert to array of digits
  const digits = cleaned.split('').map(Number);

  // Subtract 1 from first digit
  digits[0] -= 1;

  // Weight each digit (10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19)
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

  // Calculate weighted sum
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * weights[i];
  }

  // ABN is valid if sum is divisible by 89
  return sum % 89 === 0;
}

/**
 * Validate an Australian Company Number (ACN)
 * Uses weighted check digit algorithm
 */
export function validateACN(acn: string): boolean {
  // Remove spaces and non-digits
  const cleaned = acn.replace(/\s/g, '').replace(/\D/g, '');

  // Check if it's 9 digits
  if (cleaned.length !== 9) {
    return false;
  }

  // Convert to array of digits
  const digits = cleaned.split('').map(Number);

  // Weights: 8, 7, 6, 5, 4, 3, 2, 1 for first 8 digits
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];

  // Calculate weighted sum of first 8 digits
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights[i];
  }

  // Calculate check digit
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;

  // Compare with the 9th digit
  return checkDigit === digits[8];
}

/**
 * Format ABN with spaces (XX XXX XXX XXX)
 */
export function formatABN(abn: string): string {
  const cleaned = abn.replace(/\D/g, '');

  if (cleaned.length !== 11) {
    return abn;
  }

  return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8, 11)}`;
}

/**
 * Format ACN with spaces (XXX XXX XXX)
 */
export function formatACN(acn: string): string {
  const cleaned = acn.replace(/\D/g, '');

  if (cleaned.length !== 9) {
    return acn;
  }

  return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`;
}

/**
 * Parse and validate ABN
 */
export function parseABN(input: string): AustralianBusinessNumber {
  const cleaned = input.replace(/\D/g, '');
  const valid = validateABN(cleaned);

  return {
    abn: cleaned,
    formatted: valid ? formatABN(cleaned) : cleaned,
    valid,
  };
}

/**
 * Parse and validate ACN
 */
export function parseACN(input: string): AustralianCompanyNumber {
  const cleaned = input.replace(/\D/g, '');
  const valid = validateACN(cleaned);

  return {
    acn: cleaned,
    formatted: valid ? formatACN(cleaned) : cleaned,
    valid,
  };
}

/**
 * Extract ABN from ACN (ABN is ACN with '00' prefix + check digits)
 * Note: Not all companies have an ABN derived from ACN
 */
export function deriveABNFromACN(acn: string): string | null {
  if (!validateACN(acn)) {
    return null;
  }

  const cleaned = acn.replace(/\D/g, '');

  // ABN format: XX XXX XXX XXX (11 digits)
  // When derived from ACN: 00 + ACN (9 digits) = 11 digits
  // But this needs proper check digit calculation

  // Add '00' prefix to ACN
  const abnBase = '00' + cleaned;

  // Validate if this forms a valid ABN
  if (validateABN(abnBase)) {
    return abnBase;
  }

  return null;
}

/**
 * Check if ABN is likely derived from ACN
 */
export function isABNDerivedFromACN(abn: string): boolean {
  const cleaned = abn.replace(/\D/g, '');

  if (cleaned.length !== 11) {
    return false;
  }

  // Check if first two digits are '00'
  return cleaned.startsWith('00');
}

/**
 * Extract ACN from ABN if derived
 */
export function extractACNFromABN(abn: string): string | null {
  const cleaned = abn.replace(/\D/g, '');

  if (!isABNDerivedFromACN(cleaned)) {
    return null;
  }

  // Extract last 9 digits
  const acn = cleaned.substring(2);

  // Validate the ACN
  if (validateACN(acn)) {
    return acn;
  }

  return null;
}

/**
 * Comprehensive ABN validation with error details
 */
export function validateABNWithErrors(abn: string): {
  valid: boolean;
  errors?: string[];
  formatted?: string;
} {
  const errors: string[] = [];
  const cleaned = abn.replace(/\D/g, '');

  // Check length
  if (cleaned.length !== 11) {
    errors.push('ABN must be exactly 11 digits');
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(cleaned)) {
    errors.push('ABN must contain only digits');
  }

  // Validate using modulus 89
  if (cleaned.length === 11 && !validateABN(cleaned)) {
    errors.push('Invalid ABN (failed modulus 89 check)');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    formatted: errors.length === 0 ? formatABN(cleaned) : undefined,
  };
}

/**
 * Comprehensive ACN validation with error details
 */
export function validateACNWithErrors(acn: string): {
  valid: boolean;
  errors?: string[];
  formatted?: string;
} {
  const errors: string[] = [];
  const cleaned = acn.replace(/\D/g, '');

  // Check length
  if (cleaned.length !== 9) {
    errors.push('ACN must be exactly 9 digits');
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(cleaned)) {
    errors.push('ACN must contain only digits');
  }

  // Validate using check digit
  if (cleaned.length === 9 && !validateACN(cleaned)) {
    errors.push('Invalid ACN (failed check digit validation)');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    formatted: errors.length === 0 ? formatACN(cleaned) : undefined,
  };
}

/**
 * Determine if input is ABN or ACN
 */
export function identifyAustralianBusinessNumber(input: string): {
  type: 'ABN' | 'ACN' | 'UNKNOWN';
  valid: boolean;
  formatted?: string;
} {
  const cleaned = input.replace(/\D/g, '');

  if (cleaned.length === 11) {
    const valid = validateABN(cleaned);
    return {
      type: 'ABN',
      valid,
      formatted: valid ? formatABN(cleaned) : undefined,
    };
  }

  if (cleaned.length === 9) {
    const valid = validateACN(cleaned);
    return {
      type: 'ACN',
      valid,
      formatted: valid ? formatACN(cleaned) : undefined,
    };
  }

  return {
    type: 'UNKNOWN',
    valid: false,
  };
}

/**
 * Generate check digit for ACN (for testing purposes)
 */
export function generateACNCheckDigit(firstEightDigits: string): number | null {
  const cleaned = firstEightDigits.replace(/\D/g, '');

  if (cleaned.length !== 8) {
    return null;
  }

  const digits = cleaned.split('').map(Number);
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Normalize Australian business number (ABN or ACN)
 */
export function normalizeAustralianBusinessNumber(input: string): {
  valid: boolean;
  type?: 'ABN' | 'ACN';
  normalized?: string;
  formatted?: string;
  errors?: string[];
} {
  const identified = identifyAustralianBusinessNumber(input);

  if (identified.type === 'UNKNOWN') {
    return {
      valid: false,
      errors: ['Unable to identify as ABN or ACN'],
    };
  }

  const cleaned = input.replace(/\D/g, '');

  if (identified.type === 'ABN') {
    const validation = validateABNWithErrors(cleaned);
    return {
      valid: validation.valid,
      type: 'ABN',
      normalized: cleaned,
      formatted: validation.formatted,
      errors: validation.errors,
    };
  }

  if (identified.type === 'ACN') {
    const validation = validateACNWithErrors(cleaned);
    return {
      valid: validation.valid,
      type: 'ACN',
      normalized: cleaned,
      formatted: validation.formatted,
      errors: validation.errors,
    };
  }

  return {
    valid: false,
    errors: ['Invalid business number'],
  };
}
