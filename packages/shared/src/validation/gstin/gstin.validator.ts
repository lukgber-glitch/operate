/**
 * GSTIN (GST Identification Number) Validator
 *
 * @description
 * Comprehensive validator for Indian GSTIN format.
 *
 * GSTIN Format: 15 characters - 22AAAAA0000A1Z5
 * - Positions 1-2: State code (01-38)
 * - Positions 3-12: PAN (10 characters)
 * - Position 13: Entity number (1-9, A-Z) - registration number within state
 * - Position 14: 'Z' by default (reserved for future use)
 * - Position 15: Check digit (calculated using modified Luhn algorithm)
 *
 * @see https://www.gst.gov.in/
 */

import { isValidStateCode, getStateName } from './state-codes';
import { validatePAN, extractPANFromGSTIN, type PANValidationResult } from './pan.validator';
import { verifyCheckDigit, calculateCheckDigit } from './check-digit';

/**
 * GSTIN validation result
 */
export interface GSTINValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    stateCode: string;
    stateName: string;
    pan: string;
    panDetails: PANValidationResult['details'];
    entityNumber: string;
    defaultChar: string;
    checkDigit: string;
    calculatedCheckDigit?: string;
  };
}

/**
 * Validate GSTIN format and structure
 *
 * @param gstin - GSTIN string to validate
 * @returns Validation result with details
 *
 * @example
 * ```typescript
 * validateGSTIN('22AAAAA0000A1Z5') // Valid Maharashtra GSTIN
 * validateGSTIN('27AAPFU0939F1ZV') // Valid Maharashtra GSTIN (real example)
 * validateGSTIN('29ABCDE1234F1Z5') // Valid Karnataka GSTIN
 * ```
 */
export function validateGSTIN(gstin: string): GSTINValidationResult {
  // Remove whitespace and convert to uppercase
  const cleanGSTIN = gstin?.trim().toUpperCase();

  // Check if GSTIN is provided
  if (!cleanGSTIN) {
    return {
      isValid: false,
      error: 'GSTIN is required',
    };
  }

  // Check length
  if (cleanGSTIN.length !== 15) {
    return {
      isValid: false,
      error: `GSTIN must be exactly 15 characters, got ${cleanGSTIN.length}`,
    };
  }

  // Validate basic format: 2 digits, 10 alphanumeric (PAN), 1 alphanumeric, Z, 1 alphanumeric
  const gstinRegex = /^[0-9]{2}[A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  if (!gstinRegex.test(cleanGSTIN)) {
    return {
      isValid: false,
      error: 'Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5',
    };
  }

  // Extract components
  const stateCode = cleanGSTIN.substring(0, 2);
  const pan = cleanGSTIN.substring(2, 12);
  const entityNumber = cleanGSTIN.charAt(12);
  const defaultChar = cleanGSTIN.charAt(13);
  const checkDigit = cleanGSTIN.charAt(14);

  // Validate state code
  if (!isValidStateCode(stateCode)) {
    return {
      isValid: false,
      error: `Invalid state code '${stateCode}'. Must be a valid Indian state/UT code (01-38, 97, 99)`,
    };
  }

  // Validate PAN
  const panValidation = validatePAN(pan);
  if (!panValidation.isValid) {
    return {
      isValid: false,
      error: `Invalid PAN in GSTIN: ${panValidation.error}`,
    };
  }

  // Validate entity number (1-9 or A-Z, excluding 0)
  if (!/^[1-9A-Z]$/.test(entityNumber)) {
    return {
      isValid: false,
      error: `Invalid entity number '${entityNumber}'. Must be 1-9 or A-Z`,
    };
  }

  // Validate default character (should be 'Z')
  if (defaultChar !== 'Z') {
    return {
      isValid: false,
      error: `Invalid character at position 14. Expected 'Z', got '${defaultChar}'`,
    };
  }

  // Validate check digit
  const calculatedCheckDigit = calculateCheckDigit(cleanGSTIN.substring(0, 14));
  const isCheckDigitValid = verifyCheckDigit(cleanGSTIN);

  if (!isCheckDigitValid) {
    return {
      isValid: false,
      error: `Invalid check digit. Expected '${calculatedCheckDigit}', got '${checkDigit}'`,
    };
  }

  // Get state name
  const stateName = getStateName(stateCode) || 'Unknown';

  return {
    isValid: true,
    details: {
      stateCode,
      stateName,
      pan,
      panDetails: panValidation.details,
      entityNumber,
      defaultChar,
      checkDigit,
      calculatedCheckDigit,
    },
  };
}

/**
 * Check if a string is a valid GSTIN
 *
 * @param gstin - GSTIN string to validate
 * @returns True if valid GSTIN
 */
export function isValidGSTIN(gstin: string): boolean {
  return validateGSTIN(gstin).isValid;
}

/**
 * Format GSTIN for display
 *
 * @param gstin - GSTIN string
 * @param separator - Optional separator (default: none)
 * @returns Formatted GSTIN
 *
 * @example
 * ```typescript
 * formatGSTIN('22aaaaa0000a1z5') // '22AAAAA0000A1Z5'
 * formatGSTIN('22aaaaa0000a1z5', '-') // '22-AAAAA0000A-1Z5'
 * formatGSTIN('22aaaaa0000a1z5', ' ') // '22 AAAAA0000A 1Z5'
 * ```
 */
export function formatGSTIN(gstin: string, separator: string = ''): string {
  const cleanGSTIN = gstin?.trim().toUpperCase();

  if (cleanGSTIN?.length === 15) {
    if (separator) {
      const stateCode = cleanGSTIN.substring(0, 2);
      const pan = cleanGSTIN.substring(2, 12);
      const suffix = cleanGSTIN.substring(12);
      return `${stateCode}${separator}${pan}${separator}${suffix}`;
    }
    return cleanGSTIN;
  }

  return gstin;
}

/**
 * Parse GSTIN into components
 *
 * @param gstin - GSTIN string
 * @returns Object with GSTIN components or null if invalid
 */
export function parseGSTIN(gstin: string): {
  stateCode: string;
  stateName: string;
  pan: string;
  entityNumber: string;
  defaultChar: string;
  checkDigit: string;
} | null {
  const validation = validateGSTIN(gstin);

  if (!validation.isValid || !validation.details) {
    return null;
  }

  return {
    stateCode: validation.details.stateCode,
    stateName: validation.details.stateName,
    pan: validation.details.pan,
    entityNumber: validation.details.entityNumber,
    defaultChar: validation.details.defaultChar,
    checkDigit: validation.details.checkDigit,
  };
}

/**
 * Generate a GSTIN from components
 *
 * @param stateCode - Two-digit state code
 * @param pan - 10-character PAN
 * @param entityNumber - Entity number (1-9, A-Z)
 * @returns Complete 15-character GSTIN with check digit
 *
 * @example
 * ```typescript
 * generateGSTIN('22', 'AAAAA0000A', '1') // Returns '22AAAAA0000A1Z5'
 * ```
 */
export function generateGSTIN(
  stateCode: string,
  pan: string,
  entityNumber: string = '1',
): string {
  // Validate inputs
  if (!isValidStateCode(stateCode)) {
    throw new Error(`Invalid state code: ${stateCode}`);
  }

  const panValidation = validatePAN(pan);
  if (!panValidation.isValid) {
    throw new Error(`Invalid PAN: ${panValidation.error}`);
  }

  if (!/^[1-9A-Z]$/.test(entityNumber)) {
    throw new Error(`Invalid entity number: ${entityNumber}`);
  }

  // Construct GSTIN without check digit
  const gstinWithoutCheck = `${stateCode}${pan.toUpperCase()}${entityNumber.toUpperCase()}Z`;

  // Calculate and append check digit
  const checkDigit = calculateCheckDigit(gstinWithoutCheck);

  return gstinWithoutCheck + checkDigit;
}

/**
 * Validate multiple GSTINs
 *
 * @param gstins - Array of GSTIN strings
 * @returns Array of validation results
 */
export function validateMultipleGSTINs(gstins: string[]): GSTINValidationResult[] {
  return gstins.map(gstin => validateGSTIN(gstin));
}

/**
 * Extract state code from GSTIN
 *
 * @param gstin - GSTIN string
 * @returns State code or null if invalid
 */
export function extractStateCode(gstin: string): string | null {
  const cleanGSTIN = gstin?.trim().toUpperCase();
  if (cleanGSTIN?.length >= 2) {
    const stateCode = cleanGSTIN.substring(0, 2);
    return isValidStateCode(stateCode) ? stateCode : null;
  }
  return null;
}

/**
 * Check if GSTIN belongs to a specific state
 *
 * @param gstin - GSTIN string
 * @param stateCode - State code to check
 * @returns True if GSTIN belongs to the state
 */
export function isGSTINFromState(gstin: string, stateCode: string): boolean {
  const extractedStateCode = extractStateCode(gstin);
  return extractedStateCode === stateCode;
}

/**
 * Get entity type from GSTIN (via embedded PAN)
 *
 * @param gstin - GSTIN string
 * @returns Entity type character or null
 */
export function getEntityTypeFromGSTIN(gstin: string): string | null {
  const pan = extractPANFromGSTIN(gstin);
  if (pan && pan.length === 10) {
    return pan.charAt(3); // 4th character of PAN is entity type
  }
  return null;
}
