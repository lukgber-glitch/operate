/**
 * Validator for Japan's Qualified Invoice Registration Numbers
 * Format: T + 13 numeric digits (Corporate Number - 法人番号)
 *
 * The 13-digit corporate number uses a modulus 9 check digit algorithm
 */

import { RegistrationNumber, RegistrationNumberValidationResult } from './qualified-invoice.types';

/**
 * Weights for check digit calculation (positions 1-12)
 */
const CHECK_DIGIT_WEIGHTS = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2] as const;

/**
 * Calculate the check digit for a 12-digit corporate number
 * Uses modulus 9 algorithm
 *
 * @param digits12 - First 12 digits of the corporate number
 * @returns Check digit (0-9)
 */
export function calculateCheckDigit(digits12: string): number {
  if (digits12.length !== 12) {
    throw new Error('Input must be exactly 12 digits');
  }

  let sum = 0;

  for (let i = 0; i < 12; i++) {
    const digitChar = digits12.charAt(i);
    const digit = parseInt(digitChar, 10);
    const weight = CHECK_DIGIT_WEIGHTS[i] as number;
    const product = digit * weight;

    // Add each digit of the product to the sum
    if (product >= 10) {
      sum += Math.floor(product / 10) + (product % 10);
    } else {
      sum += product;
    }
  }

  // Check digit is 9 - (sum mod 9)
  const checkDigit = 9 - (sum % 9);

  // If check digit is 9, use 0 instead
  return checkDigit === 9 ? 0 : checkDigit;
}

/**
 * Validate the format of a registration number
 * Must be T followed by 13 digits
 *
 * @param registrationNumber - Registration number to validate
 * @returns True if format is valid
 */
export function isValidFormat(registrationNumber: string): boolean {
  if (!registrationNumber) {
    return false;
  }

  // Must start with T
  if (!registrationNumber.startsWith('T')) {
    return false;
  }

  // Must be exactly 14 characters (T + 13 digits)
  if (registrationNumber.length !== 14) {
    return false;
  }

  // Remaining 13 characters must be digits
  const digits = registrationNumber.substring(1);
  return /^\d{13}$/.test(digits);
}

/**
 * Validate the check digit of a corporate number
 *
 * @param corporateNumber - 13-digit corporate number
 * @returns True if check digit is valid
 */
export function isValidCheckDigit(corporateNumber: string): boolean {
  if (corporateNumber.length !== 13) {
    return false;
  }

  const first12Digits = corporateNumber.substring(0, 12);
  const lastDigitChar = corporateNumber.charAt(12);
  const providedCheckDigit = parseInt(lastDigitChar, 10);
  const calculatedCheckDigit = calculateCheckDigit(first12Digits);

  return providedCheckDigit === calculatedCheckDigit;
}

/**
 * Validate a complete registration number
 * Checks both format and check digit
 *
 * @param registrationNumber - Registration number to validate (T + 13 digits)
 * @returns Validation result with details
 */
export function validateRegistrationNumber(registrationNumber: string): RegistrationNumberValidationResult {
  // Check format
  if (!isValidFormat(registrationNumber)) {
    return {
      valid: false,
      error: 'Invalid format. Must be T followed by 13 digits (e.g., T1234567890123)',
      details: {
        formatValid: false,
        checkDigitValid: false,
      },
    };
  }

  // Extract corporate number
  const corporateNumber = registrationNumber.substring(1);

  // Validate check digit
  const first12Digits = corporateNumber.substring(0, 12);
  const calculatedCheckDigit = calculateCheckDigit(first12Digits);
  const lastDigitChar = corporateNumber.charAt(12);
  const providedCheckDigit = parseInt(lastDigitChar, 10);
  const checkDigitValid = providedCheckDigit === calculatedCheckDigit;

  if (!checkDigitValid) {
    return {
      valid: false,
      error: `Invalid check digit. Expected ${calculatedCheckDigit}, got ${providedCheckDigit}`,
      details: {
        formatValid: true,
        checkDigitValid: false,
        calculatedCheckDigit,
      },
    };
  }

  return {
    valid: true,
    details: {
      formatValid: true,
      checkDigitValid: true,
      calculatedCheckDigit,
    },
  };
}

/**
 * Parse and validate a registration number
 * Returns a RegistrationNumber object with validation details
 *
 * @param registrationNumber - Registration number to parse
 * @returns Parsed registration number with validation status
 */
export function parseRegistrationNumber(registrationNumber: string): RegistrationNumber {
  const validation = validateRegistrationNumber(registrationNumber);

  return {
    value: registrationNumber,
    corporateNumber: registrationNumber.startsWith('T') ? registrationNumber.substring(1) : '',
    isValid: validation.valid,
    error: validation.error,
  };
}

/**
 * Generate a valid registration number from a 12-digit base
 * Calculates and appends the check digit
 *
 * @param digits12 - First 12 digits of the corporate number
 * @returns Complete registration number (T + 13 digits)
 * @throws Error if input is not exactly 12 digits
 */
export function generateRegistrationNumber(digits12: string): string {
  if (!/^\d{12}$/.test(digits12)) {
    throw new Error('Input must be exactly 12 numeric digits');
  }

  const checkDigit = calculateCheckDigit(digits12);
  return `T${digits12}${checkDigit}`;
}

/**
 * Format a registration number for display
 * Adds spaces for readability: T 1234 5678 9012 3
 *
 * @param registrationNumber - Registration number to format
 * @returns Formatted registration number
 */
export function formatRegistrationNumber(registrationNumber: string): string {
  if (!isValidFormat(registrationNumber)) {
    return registrationNumber;
  }

  const corporateNumber = registrationNumber.substring(1);
  const part1 = corporateNumber.substring(0, 4);
  const part2 = corporateNumber.substring(4, 8);
  const part3 = corporateNumber.substring(8, 12);
  const checkDigit = corporateNumber.charAt(12);
  return `T ${part1} ${part2} ${part3} ${checkDigit}`;
}
