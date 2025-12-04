/**
 * PAN (Permanent Account Number) Validator
 *
 * @description
 * Validates PAN format used in India for tax identification.
 * PAN format: AAAPL1234C
 * - First 3 chars: Alphabetic sequence (AAA-ZZZ)
 * - 4th char: Entity type indicator
 * - 5th char: First letter of name/surname
 * - Next 4 chars: Numeric (0001-9999)
 * - Last char: Alphabetic check digit
 *
 * @see https://www.incometax.gov.in/
 */

/**
 * PAN entity type codes
 */
export enum PANEntityType {
  INDIVIDUAL = 'P', // Person/Individual
  COMPANY = 'C', // Company
  HUF = 'H', // Hindu Undivided Family
  FIRM = 'F', // Firm
  AOP = 'A', // Association of Persons
  TRUST = 'T', // Trust
  BOI = 'B', // Body of Individuals
  LOCAL_AUTHORITY = 'L', // Local Authority
  ARTIFICIAL_JURIDICAL = 'J', // Artificial Juridical Person
  GOVERNMENT = 'G', // Government
}

/**
 * Valid PAN entity type codes
 */
export const VALID_PAN_ENTITY_TYPES = Object.values(PANEntityType);

/**
 * PAN validation result
 */
export interface PANValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    entityType: string;
    entityTypeName: string;
    firstNameInitial: string;
    sequenceNumber: string;
  };
}

/**
 * Validate PAN format
 *
 * @param pan - PAN string to validate
 * @returns Validation result with details
 *
 * @example
 * ```typescript
 * validatePAN('AAAPL1234C') // Valid
 * validatePAN('ABCPC1234D') // Valid company PAN
 * validatePAN('12345ABCDE') // Invalid - must start with letters
 * ```
 */
export function validatePAN(pan: string): PANValidationResult {
  // Remove whitespace and convert to uppercase
  const cleanPAN = pan?.trim().toUpperCase();

  // Check if PAN is provided
  if (!cleanPAN) {
    return {
      isValid: false,
      error: 'PAN is required',
    };
  }

  // Check length
  if (cleanPAN.length !== 10) {
    return {
      isValid: false,
      error: `PAN must be exactly 10 characters, got ${cleanPAN.length}`,
    };
  }

  // Validate format: AAAPL1234C
  const panRegex = /^[A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z]$/;

  if (!panRegex.test(cleanPAN)) {
    return {
      isValid: false,
      error: 'Invalid PAN format. Expected format: AAAPL1234C',
    };
  }

  // Extract components
  const firstThree = cleanPAN.substring(0, 3);
  const entityType = cleanPAN.charAt(3);
  const firstNameInitial = cleanPAN.charAt(4);
  const sequenceNumber = cleanPAN.substring(5, 9);
  const checkDigit = cleanPAN.charAt(9);

  // Validate first three characters (must be alphabetic)
  if (!/^[A-Z]{3}$/.test(firstThree)) {
    return {
      isValid: false,
      error: 'First three characters must be alphabetic (A-Z)',
    };
  }

  // Validate entity type
  if (!VALID_PAN_ENTITY_TYPES.includes(entityType as PANEntityType)) {
    return {
      isValid: false,
      error: `Invalid entity type '${entityType}'. Must be one of: ${VALID_PAN_ENTITY_TYPES.join(', ')}`,
    };
  }

  // Validate fifth character (first name initial)
  if (!/^[A-Z]$/.test(firstNameInitial)) {
    return {
      isValid: false,
      error: 'Fifth character must be alphabetic (A-Z)',
    };
  }

  // Validate sequence number
  const seqNum = parseInt(sequenceNumber, 10);
  if (isNaN(seqNum) || seqNum < 1 || seqNum > 9999) {
    return {
      isValid: false,
      error: 'Sequence number must be between 0001 and 9999',
    };
  }

  // Validate check digit
  if (!/^[A-Z]$/.test(checkDigit)) {
    return {
      isValid: false,
      error: 'Last character (check digit) must be alphabetic (A-Z)',
    };
  }

  // Get entity type name
  const entityTypeName = getEntityTypeName(entityType as PANEntityType);

  return {
    isValid: true,
    details: {
      entityType,
      entityTypeName,
      firstNameInitial,
      sequenceNumber,
    },
  };
}

/**
 * Get entity type name from code
 *
 * @param entityType - Entity type code
 * @returns Human-readable entity type name
 */
export function getEntityTypeName(entityType: PANEntityType): string {
  const entityTypeNames: Record<PANEntityType, string> = {
    [PANEntityType.INDIVIDUAL]: 'Individual/Person',
    [PANEntityType.COMPANY]: 'Company',
    [PANEntityType.HUF]: 'Hindu Undivided Family',
    [PANEntityType.FIRM]: 'Firm/Partnership',
    [PANEntityType.AOP]: 'Association of Persons',
    [PANEntityType.TRUST]: 'Trust',
    [PANEntityType.BOI]: 'Body of Individuals',
    [PANEntityType.LOCAL_AUTHORITY]: 'Local Authority',
    [PANEntityType.ARTIFICIAL_JURIDICAL]: 'Artificial Juridical Person',
    [PANEntityType.GOVERNMENT]: 'Government',
  };

  return entityTypeNames[entityType] || 'Unknown';
}

/**
 * Check if a string is a valid PAN
 *
 * @param pan - PAN string to validate
 * @returns True if valid PAN
 */
export function isValidPAN(pan: string): boolean {
  return validatePAN(pan).isValid;
}

/**
 * Extract PAN from GSTIN
 *
 * @param gstin - GSTIN string
 * @returns PAN portion of GSTIN
 */
export function extractPANFromGSTIN(gstin: string): string {
  const cleanGSTIN = gstin?.trim().toUpperCase();
  if (cleanGSTIN?.length >= 12) {
    return cleanGSTIN.substring(2, 12);
  }
  return '';
}

/**
 * Format PAN for display
 *
 * @param pan - PAN string
 * @returns Formatted PAN
 */
export function formatPAN(pan: string): string {
  const cleanPAN = pan?.trim().toUpperCase();
  if (cleanPAN?.length === 10) {
    return cleanPAN;
  }
  return pan;
}
