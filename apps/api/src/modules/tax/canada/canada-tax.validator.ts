/**
 * Canadian Business Number (BN) Validation
 * Task: W26-T4 - Canadian/Australian tax rules
 *
 * BN Format: 123456789 (9 digits)
 * Extended formats:
 * - GST/HST: 123456789 RC 0001
 * - Payroll: 123456789 RP 0001
 * - Corporate Tax: 123456789 RT 0001
 * - Import/Export: 123456789 RM 0001
 * - Information Returns: 123456789 RZ 0001
 */

import { CanadianBusinessNumber } from '@operate/shared/types/tax/canada-tax.types';

/**
 * Program account identifiers
 */
const PROGRAM_IDENTIFIERS = ['RC', 'RP', 'RT', 'RM', 'RZ'] as const;
type ProgramIdentifier = (typeof PROGRAM_IDENTIFIERS)[number];

/**
 * Validate a Canadian Business Number (BN)
 * Uses the Luhn mod-10 algorithm with weights [9,8,7,6,5,4,3,2,1]
 */
export function validateBusinessNumber(bn: string): boolean {
  // Remove spaces and dashes
  const cleaned = bn.replace(/[\s-]/g, '');

  // Check if it's 9 digits
  if (!/^\d{9}$/.test(cleaned)) {
    return false;
  }

  // Apply Luhn algorithm with custom weights
  const digits = cleaned.split('').map(Number);
  const weights = [9, 8, 7, 6, 5, 4, 3, 2, 1];

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }

  // Check digit is valid if sum is divisible by 11
  return sum % 11 === 0;
}

/**
 * Parse a Canadian Business Number with optional program identifier
 */
export function parseBusinessNumber(input: string): CanadianBusinessNumber | null {
  // Clean input
  const cleaned = input.trim().toUpperCase().replace(/[\s-]/g, ' ').trim();

  // Extract components
  const parts = cleaned.split(/\s+/);

  if (parts.length === 0 || parts.length > 3) {
    return null;
  }

  const bn = parts[0].replace(/\D/g, '');

  // Validate BN
  if (!validateBusinessNumber(bn)) {
    return {
      bn,
      formatted: bn,
      valid: false,
    };
  }

  // Check for program identifier
  let programIdentifier: ProgramIdentifier | undefined;
  let referenceNumber: string | undefined;

  if (parts.length >= 2) {
    const identifier = parts[1].toUpperCase();
    if (PROGRAM_IDENTIFIERS.includes(identifier as ProgramIdentifier)) {
      programIdentifier = identifier as ProgramIdentifier;
    }
  }

  if (parts.length === 3 && programIdentifier) {
    const ref = parts[2].replace(/\D/g, '');
    if (ref.length === 4) {
      referenceNumber = ref;
    }
  }

  // Format the number
  let formatted = bn;
  if (programIdentifier) {
    formatted += ` ${programIdentifier}`;
    if (referenceNumber) {
      formatted += ` ${referenceNumber}`;
    }
  }

  return {
    bn,
    programIdentifier,
    referenceNumber,
    formatted,
    valid: true,
  };
}

/**
 * Validate a GST/HST number (BN + RC + reference)
 */
export function validateGSTHSTNumber(gstNumber: string): boolean {
  const parsed = parseBusinessNumber(gstNumber);

  if (!parsed || !parsed.valid) {
    return false;
  }

  // GST/HST numbers should have RC identifier
  return parsed.programIdentifier === 'RC';
}

/**
 * Format a Business Number with proper spacing
 */
export function formatBusinessNumber(
  bn: string,
  programIdentifier?: ProgramIdentifier,
  referenceNumber?: string,
): string {
  const cleaned = bn.replace(/\D/g, '');

  if (cleaned.length !== 9) {
    return bn;
  }

  let formatted = cleaned;

  if (programIdentifier) {
    formatted += ` ${programIdentifier}`;
    if (referenceNumber && referenceNumber.length === 4) {
      formatted += ` ${referenceNumber}`;
    }
  }

  return formatted;
}

/**
 * Generate a GST/HST number from a Business Number
 */
export function generateGSTHSTNumber(bn: string, referenceNumber = '0001'): string | null {
  if (!validateBusinessNumber(bn)) {
    return null;
  }

  const cleaned = bn.replace(/\D/g, '');
  const ref = referenceNumber.padStart(4, '0');

  return `${cleaned} RC ${ref}`;
}

/**
 * Extract Business Number from full GST/HST number
 */
export function extractBusinessNumber(fullNumber: string): string | null {
  const parsed = parseBusinessNumber(fullNumber);
  return parsed?.valid ? parsed.bn : null;
}

/**
 * Get program identifier description
 */
export function getProgramIdentifierDescription(
  identifier: ProgramIdentifier,
): string {
  const descriptions: Record<ProgramIdentifier, string> = {
    RC: 'GST/HST Account',
    RP: 'Payroll Deductions Account',
    RT: 'Corporate Income Tax Account',
    RM: 'Import/Export Account',
    RZ: 'Information Returns Account',
  };

  return descriptions[identifier];
}

/**
 * Check if a Business Number is valid for GST/HST registration
 */
export function isValidForGSTHST(bn: string): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  // Remove spaces and dashes
  const cleaned = bn.replace(/[\s-]/g, '');

  // Check length
  if (cleaned.length !== 9) {
    errors.push('Business Number must be exactly 9 digits');
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(cleaned)) {
    errors.push('Business Number must contain only digits');
  }

  // Validate using Luhn algorithm
  if (!validateBusinessNumber(cleaned)) {
    errors.push('Invalid Business Number (failed checksum validation)');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validate and normalize a Canadian tax number
 */
export function normalizeCanadianTaxNumber(input: string): {
  valid: boolean;
  normalized?: string;
  type?: 'BN' | 'GST/HST' | 'PAYROLL' | 'CORPORATE' | 'IMPORT/EXPORT' | 'INFO_RETURNS';
  components?: {
    bn: string;
    programIdentifier?: ProgramIdentifier;
    referenceNumber?: string;
  };
  errors?: string[];
} {
  const parsed = parseBusinessNumber(input);

  if (!parsed || !parsed.valid) {
    return {
      valid: false,
      errors: ['Invalid Business Number format or checksum'],
    };
  }

  let type: 'BN' | 'GST/HST' | 'PAYROLL' | 'CORPORATE' | 'IMPORT/EXPORT' | 'INFO_RETURNS' = 'BN';

  if (parsed.programIdentifier) {
    switch (parsed.programIdentifier) {
      case 'RC':
        type = 'GST/HST';
        break;
      case 'RP':
        type = 'PAYROLL';
        break;
      case 'RT':
        type = 'CORPORATE';
        break;
      case 'RM':
        type = 'IMPORT/EXPORT';
        break;
      case 'RZ':
        type = 'INFO_RETURNS';
        break;
    }
  }

  return {
    valid: true,
    normalized: parsed.formatted,
    type,
    components: {
      bn: parsed.bn,
      programIdentifier: parsed.programIdentifier,
      referenceNumber: parsed.referenceNumber,
    },
  };
}
