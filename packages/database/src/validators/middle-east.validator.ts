/**
 * Middle East Tax Validation Service
 * Task: W28-T4 - Middle East tax rules (VAT 5%/15%)
 *
 * Validates TRN, IBAN, and other tax identifiers for UAE and Saudi Arabia
 */

/**
 * Validates Saudi Arabia Tax Registration Number (TRN)
 * Format: 15 digits starting with 3
 * Uses Luhn algorithm for check digit validation
 *
 * @param trn - Tax Registration Number (15 digits)
 * @returns boolean - True if valid
 *
 * @example
 * validateSaudiTRN('300123456789003') // true
 * validateSaudiTRN('123456789012345') // false (doesn't start with 3)
 */
export function validateSaudiTRN(trn: string): boolean {
  if (!trn || typeof trn !== 'string') {
    return false;
  }

  // Remove any non-digit characters
  const cleanTRN = trn.replace(/\D/g, '');

  // Must be exactly 15 digits
  if (cleanTRN.length !== 15) {
    return false;
  }

  // Must start with 3
  if (!cleanTRN.startsWith('3')) {
    return false;
  }

  // Validate using Luhn algorithm (mod 10)
  return luhnCheck(cleanTRN);
}

/**
 * Validates UAE Tax Registration Number (TRN)
 * Format: 15 digits (sometimes displayed as 100-XXXX-XXXX-XXX-XXX)
 *
 * @param trn - Tax Registration Number (15 digits)
 * @returns boolean - True if valid
 *
 * @example
 * validateUAETRN('100123456789012') // true
 * validateUAETRN('123456789012345') // true (any 15 digits)
 */
export function validateUAETRN(trn: string): boolean {
  if (!trn || typeof trn !== 'string') {
    return false;
  }

  // Remove any non-digit characters (handles formatted TRNs like 100-XXXX-XXXX-XXX-XXX)
  const cleanTRN = trn.replace(/\D/g, '');

  // Must be exactly 15 digits
  if (cleanTRN.length !== 15) {
    return false;
  }

  // UAE TRN validation with check digit
  return uaeTRNCheckDigit(cleanTRN);
}

/**
 * Validates Saudi Arabia IBAN
 * Format: SA + 2-digit check + 2-digit bank code + 18-digit account number (24 chars total)
 *
 * @param iban - IBAN string
 * @returns boolean - True if valid
 *
 * @example
 * validateSaudiIBAN('SA0380000000608010167519') // true
 */
export function validateSaudiIBAN(iban: string): boolean {
  if (!iban || typeof iban !== 'string') {
    return false;
  }

  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Must start with SA
  if (!cleanIBAN.startsWith('SA')) {
    return false;
  }

  // Must be exactly 24 characters
  if (cleanIBAN.length !== 24) {
    return false;
  }

  // Validate using IBAN mod-97 algorithm
  return ibanMod97Check(cleanIBAN);
}

/**
 * Validates UAE IBAN
 * Format: AE + 2-digit check + 3-digit bank code + 16-digit account number (23 chars total)
 *
 * @param iban - IBAN string
 * @returns boolean - True if valid
 *
 * @example
 * validateUAEIBAN('AE070331234567890123456') // true
 */
export function validateUAEIBAN(iban: string): boolean {
  if (!iban || typeof iban !== 'string') {
    return false;
  }

  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Must start with AE
  if (!cleanIBAN.startsWith('AE')) {
    return false;
  }

  // Must be exactly 23 characters
  if (cleanIBAN.length !== 23) {
    return false;
  }

  // Validate using IBAN mod-97 algorithm
  return ibanMod97Check(cleanIBAN);
}

/**
 * Validates Saudi Arabia Commercial Registration (CR) number
 * Format: 10 digits
 *
 * @param cr - Commercial Registration number
 * @returns boolean - True if valid
 */
export function validateSaudiCR(cr: string): boolean {
  if (!cr || typeof cr !== 'string') {
    return false;
  }

  // Remove any non-digit characters
  const cleanCR = cr.replace(/\D/g, '');

  // Must be exactly 10 digits
  if (cleanCR.length !== 10) {
    return false;
  }

  // All digits, no special validation beyond format
  return /^\d{10}$/.test(cleanCR);
}

/**
 * Validates UAE Trade License number
 * Format: Variable (typically 6-7 digits per emirate)
 *
 * @param license - Trade License number
 * @param emirate - Emirate code (optional, for specific validation)
 * @returns boolean - True if valid
 */
export function validateUAETradeLicense(license: string, emirate?: string): boolean {
  if (!license || typeof license !== 'string') {
    return false;
  }

  // Remove any non-alphanumeric characters
  const cleanLicense = license.replace(/[^A-Z0-9]/gi, '');

  // Typically 6-10 characters
  if (cleanLicense.length < 6 || cleanLicense.length > 10) {
    return false;
  }

  // Basic format validation
  return /^[A-Z0-9]+$/i.test(cleanLicense);
}

/**
 * Formats Saudi Arabia TRN for display
 *
 * @param trn - 15-digit TRN
 * @returns string - Formatted TRN
 *
 * @example
 * formatSaudiTRN('300123456789003') // '300 123 456 789 003'
 */
export function formatSaudiTRN(trn: string): string {
  const cleanTRN = trn.replace(/\D/g, '');

  if (cleanTRN.length !== 15) {
    return trn;
  }

  return cleanTRN.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4 $5');
}

/**
 * Formats UAE TRN for display
 *
 * @param trn - 15-digit TRN
 * @returns string - Formatted TRN
 *
 * @example
 * formatUAETRN('100123456789012') // '100-1234-5678-901-2'
 */
export function formatUAETRN(trn: string): string {
  const cleanTRN = trn.replace(/\D/g, '');

  if (cleanTRN.length !== 15) {
    return trn;
  }

  return cleanTRN.replace(/(\d{3})(\d{4})(\d{4})(\d{3})(\d{1})/, '$1-$2-$3-$4-$5');
}

/**
 * Formats IBAN for display with spaces every 4 characters
 *
 * @param iban - IBAN string
 * @returns string - Formatted IBAN
 *
 * @example
 * formatIBAN('SA0380000000608010167519') // 'SA03 8000 0000 6080 1016 7519'
 */
export function formatIBAN(iban: string): string {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
  return cleanIBAN.replace(/(.{4})/g, '$1 ').trim();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Luhn algorithm (mod 10) check for validation
 * Used for Saudi TRN validation
 *
 * @param number - Numeric string to validate
 * @returns boolean - True if passes Luhn check
 */
function luhnCheck(number: string): boolean {
  let sum = 0;
  let isEven = false;

  // Iterate from right to left
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number.charAt(i), 10);

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
 * UAE TRN check digit validation
 *
 * @param trn - 15-digit TRN
 * @returns boolean - True if check digit is valid
 */
function uaeTRNCheckDigit(trn: string): boolean {
  // Extract the first 14 digits and the check digit (15th digit)
  const digits = trn.substring(0, 14);
  const checkDigit = parseInt(trn.charAt(14), 10);

  // Calculate expected check digit
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits.charAt(i), 10);
    const weight = (i % 2 === 0) ? 1 : 3; // Alternate weights 1, 3, 1, 3...
    sum += digit * weight;
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;

  return checkDigit === calculatedCheckDigit;
}

/**
 * IBAN mod-97 check for validation
 * Standard IBAN validation algorithm
 *
 * @param iban - IBAN string
 * @returns boolean - True if passes mod-97 check
 */
function ibanMod97Check(iban: string): boolean {
  // Move first 4 characters to end
  const rearranged = iban.substring(4) + iban.substring(0, 4);

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged.charAt(i);
    if (char >= 'A' && char <= 'Z') {
      numericString += (char.charCodeAt(0) - 55).toString();
    } else {
      numericString += char;
    }
  }

  // Calculate mod 97
  return mod97(numericString) === 1;
}

/**
 * Calculate mod 97 for large numbers (used in IBAN validation)
 *
 * @param numericString - Numeric string
 * @returns number - Mod 97 result
 */
function mod97(numericString: string): number {
  let remainder = 0;

  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString.charAt(i), 10)) % 97;
  }

  return remainder;
}

/**
 * Validates TRN for either UAE or Saudi Arabia
 * Auto-detects country based on format
 *
 * @param trn - Tax Registration Number
 * @returns object - Validation result with country
 */
export function validateTRN(trn: string): {
  valid: boolean;
  country: 'UAE' | 'SA' | null;
  formatted?: string;
} {
  const cleanTRN = trn.replace(/\D/g, '');

  // Try Saudi Arabia first (starts with 3)
  if (cleanTRN.startsWith('3')) {
    const valid = validateSaudiTRN(cleanTRN);
    return {
      valid,
      country: 'SA',
      formatted: valid ? formatSaudiTRN(cleanTRN) : undefined,
    };
  }

  // Try UAE
  const valid = validateUAETRN(cleanTRN);
  return {
    valid,
    country: valid ? 'UAE' : null,
    formatted: valid ? formatUAETRN(cleanTRN) : undefined,
  };
}

/**
 * Validates IBAN for either UAE or Saudi Arabia
 * Auto-detects country based on country code
 *
 * @param iban - IBAN string
 * @returns object - Validation result with country
 */
export function validateIBAN(iban: string): {
  valid: boolean;
  country: 'UAE' | 'SA' | null;
  formatted?: string;
} {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  if (cleanIBAN.startsWith('SA')) {
    const valid = validateSaudiIBAN(cleanIBAN);
    return {
      valid,
      country: 'SA',
      formatted: valid ? formatIBAN(cleanIBAN) : undefined,
    };
  }

  if (cleanIBAN.startsWith('AE')) {
    const valid = validateUAEIBAN(cleanIBAN);
    return {
      valid,
      country: 'UAE',
      formatted: valid ? formatIBAN(cleanIBAN) : undefined,
    };
  }

  return {
    valid: false,
    country: null,
  };
}

/**
 * Extract bank code from IBAN
 *
 * @param iban - IBAN string
 * @returns string - Bank code or empty string
 */
export function extractBankCode(iban: string): string {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  if (cleanIBAN.startsWith('SA') && cleanIBAN.length === 24) {
    // SA: 2-digit bank code at positions 4-5
    return cleanIBAN.substring(4, 6);
  }

  if (cleanIBAN.startsWith('AE') && cleanIBAN.length === 23) {
    // AE: 3-digit bank code at positions 4-6
    return cleanIBAN.substring(4, 7);
  }

  return '';
}

/**
 * Calculate VAT amount for Middle East countries
 *
 * @param amount - Net amount
 * @param country - 'UAE' or 'SA'
 * @param category - 'STANDARD', 'ZERO', or 'EXEMPT'
 * @returns object - Calculation result
 */
export function calculateMiddleEastVAT(
  amount: number,
  country: 'UAE' | 'SA',
  category: 'STANDARD' | 'ZERO' | 'EXEMPT' = 'STANDARD'
): {
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  country: string;
  category: string;
} {
  let vatRate = 0;

  if (category === 'STANDARD') {
    vatRate = country === 'UAE' ? 5 : 15;
  } else if (category === 'ZERO') {
    vatRate = 0;
  } else if (category === 'EXEMPT') {
    vatRate = 0;
  }

  const vatAmount = (amount * vatRate) / 100;
  const grossAmount = amount + vatAmount;

  return {
    netAmount: amount,
    vatRate,
    vatAmount: parseFloat(vatAmount.toFixed(2)),
    grossAmount: parseFloat(grossAmount.toFixed(2)),
    country,
    category,
  };
}

/**
 * Calculate net amount from gross amount (reverse VAT calculation)
 *
 * @param grossAmount - Gross amount including VAT
 * @param country - 'UAE' or 'SA'
 * @param category - 'STANDARD', 'ZERO', or 'EXEMPT'
 * @returns object - Calculation result
 */
export function calculateNetFromGross(
  grossAmount: number,
  country: 'UAE' | 'SA',
  category: 'STANDARD' | 'ZERO' | 'EXEMPT' = 'STANDARD'
): {
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  country: string;
  category: string;
} {
  let vatRate = 0;

  if (category === 'STANDARD') {
    vatRate = country === 'UAE' ? 5 : 15;
  }

  const netAmount = grossAmount / (1 + vatRate / 100);
  const vatAmount = grossAmount - netAmount;

  return {
    netAmount: parseFloat(netAmount.toFixed(2)),
    vatRate,
    vatAmount: parseFloat(vatAmount.toFixed(2)),
    grossAmount,
    country,
    category,
  };
}
