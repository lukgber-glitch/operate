/**
 * GSTIN Check Digit Calculator
 *
 * @description
 * Implements the GSTIN check digit algorithm based on a modified Luhn algorithm.
 * The check digit is calculated using characters 0-9 and A-Z mapped to values 0-35,
 * with alternating weights applied to each position.
 *
 * Algorithm:
 * 1. Map each character to its value (0-9 = 0-9, A-Z = 10-35)
 * 2. Apply alternating weights (2, 1, 2, 1, ...) from right to left
 * 3. If weighted value > 35, add quotient and remainder
 * 4. Sum all weighted values
 * 5. Check digit = (36 - (sum % 36)) % 36
 *
 * @see https://www.gst.gov.in/
 */

/**
 * Character to value mapping for GSTIN check digit calculation
 * 0-9 maps to 0-9, A-Z maps to 10-35
 */
const CHAR_VALUES: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14,
  'F': 15, 'G': 16, 'H': 17, 'I': 18, 'J': 19,
  'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24,
  'P': 25, 'Q': 26, 'R': 27, 'S': 28, 'T': 29,
  'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34,
  'Z': 35,
};

/**
 * Value to character mapping (reverse of CHAR_VALUES)
 */
const VALUE_CHARS = Object.entries(CHAR_VALUES).reduce((acc, [char, value]) => {
  acc[value] = char;
  return acc;
}, {} as Record<number, string>);

/**
 * Get character value for check digit calculation
 *
 * @param char - Character to convert
 * @returns Numeric value (0-35)
 * @throws Error if character is invalid
 */
function getCharValue(char: string): number {
  const value = CHAR_VALUES[char.toUpperCase()];
  if (value === undefined) {
    throw new Error(`Invalid character for check digit calculation: ${char}`);
  }
  return value;
}

/**
 * Get character from value
 *
 * @param value - Numeric value (0-35)
 * @returns Character representation
 * @throws Error if value is invalid
 */
function getCharFromValue(value: number): string {
  const char = VALUE_CHARS[value];
  if (char === undefined) {
    throw new Error(`Invalid value for character conversion: ${value}`);
  }
  return char;
}

/**
 * Calculate GSTIN check digit
 *
 * @param gstinWithoutCheckDigit - First 14 characters of GSTIN
 * @returns Check digit character (0-9 or A-Z)
 *
 * @example
 * ```typescript
 * calculateCheckDigit('22AAAAA0000A1Z') // Returns '5'
 * calculateCheckDigit('27AAPFU0939F1Z') // Returns 'V'
 * ```
 */
export function calculateCheckDigit(gstinWithoutCheckDigit: string): string {
  // Validate input length
  if (gstinWithoutCheckDigit.length !== 14) {
    throw new Error('GSTIN without check digit must be exactly 14 characters');
  }

  const upperInput = gstinWithoutCheckDigit.toUpperCase();
  let sum = 0;

  // Process each character from left to right
  for (let i = 0; i < 14; i++) {
    const char = upperInput[i]!;
    const charValue = getCharValue(char);

    // Determine weight: positions 0, 2, 4, 6, 8, 10, 12 get weight 2, others get weight 1
    const weight = (i % 2 === 0) ? 2 : 1;

    // Apply weight
    let weightedValue = charValue * weight;

    // If weighted value exceeds 35, add quotient and remainder
    if (weightedValue > 35) {
      const quotient = Math.floor(weightedValue / 36);
      const remainder = weightedValue % 36;
      weightedValue = quotient + remainder;
    }

    sum += weightedValue;
  }

  // Calculate check digit: (36 - (sum % 36)) % 36
  const checkDigitValue = (36 - (sum % 36)) % 36;

  return getCharFromValue(checkDigitValue);
}

/**
 * Verify GSTIN check digit
 *
 * @param gstin - Complete 15-character GSTIN
 * @returns True if check digit is valid
 *
 * @example
 * ```typescript
 * verifyCheckDigit('22AAAAA0000A1Z5') // true
 * verifyCheckDigit('22AAAAA0000A1Z4') // false
 * ```
 */
export function verifyCheckDigit(gstin: string): boolean {
  if (gstin.length !== 15) {
    return false;
  }

  try {
    const gstinWithoutCheck = gstin.substring(0, 14);
    const providedCheckDigit = gstin.charAt(14).toUpperCase();
    const calculatedCheckDigit = calculateCheckDigit(gstinWithoutCheck);

    return providedCheckDigit === calculatedCheckDigit;
  } catch (error) {
    return false;
  }
}

/**
 * Generate GSTIN with check digit
 *
 * @param gstinWithoutCheckDigit - First 14 characters of GSTIN
 * @returns Complete 15-character GSTIN with check digit
 *
 * @example
 * ```typescript
 * generateGSTINWithCheckDigit('22AAAAA0000A1Z') // Returns '22AAAAA0000A1Z5'
 * ```
 */
export function generateGSTINWithCheckDigit(gstinWithoutCheckDigit: string): string {
  const checkDigit = calculateCheckDigit(gstinWithoutCheckDigit);
  return gstinWithoutCheckDigit.toUpperCase() + checkDigit;
}

/**
 * Calculate check digit value for debugging
 *
 * @param gstinWithoutCheckDigit - First 14 characters of GSTIN
 * @returns Object with calculation details
 */
export function calculateCheckDigitWithDetails(gstinWithoutCheckDigit: string): {
  checkDigit: string;
  sum: number;
  checkDigitValue: number;
  calculations: Array<{
    position: number;
    char: string;
    charValue: number;
    weight: number;
    weightedValue: number;
    adjustedValue: number;
  }>;
} {
  if (gstinWithoutCheckDigit.length !== 14) {
    throw new Error('GSTIN without check digit must be exactly 14 characters');
  }

  const upperInput = gstinWithoutCheckDigit.toUpperCase();
  const calculations: Array<{
    position: number;
    char: string;
    charValue: number;
    weight: number;
    weightedValue: number;
    adjustedValue: number;
  }> = [];

  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const char = upperInput[i]!;
    const charValue = getCharValue(char);
    const weight = (i % 2 === 0) ? 2 : 1;
    const weightedValue = charValue * weight;

    let adjustedValue = weightedValue;
    if (weightedValue > 35) {
      const quotient = Math.floor(weightedValue / 36);
      const remainder = weightedValue % 36;
      adjustedValue = quotient + remainder;
    }

    sum += adjustedValue;

    calculations.push({
      position: i,
      char,
      charValue,
      weight,
      weightedValue,
      adjustedValue,
    });
  }

  const checkDigitValue = (36 - (sum % 36)) % 36;
  const checkDigit = getCharFromValue(checkDigitValue);

  return {
    checkDigit,
    sum,
    checkDigitValue,
    calculations,
  };
}
