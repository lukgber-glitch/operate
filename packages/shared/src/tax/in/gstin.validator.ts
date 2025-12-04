/**
 * GSTIN (Goods and Services Tax Identification Number) Validator
 * Task: W29-T4 - India GST configuration
 *
 * GSTIN Format: 99AAAAA9999A9Z9 (15 characters)
 * - Position 1-2: State code (01-38)
 * - Position 3-12: PAN (10 characters)
 * - Position 13: Entity number (1-9, A-Z)
 * - Position 14: Z (default character)
 * - Position 15: Check digit
 */

export interface GSTINValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    stateCode: string;
    stateName?: string;
    pan: string;
    entityNumber: string;
    checkDigit: string;
  };
}

/**
 * GST State Codes
 */
const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Dadra and Nagar Haveli and Daman and Diu',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

/**
 * Character to digit mapping for checksum calculation
 */
const CHAR_TO_DIGIT: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18,
  'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24, 'P': 25, 'Q': 26, 'R': 27,
  'S': 28, 'T': 29, 'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34, 'Z': 35,
};

/**
 * Digit to character mapping for checksum calculation
 */
const DIGIT_TO_CHAR = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * GSTIN Validator Class
 */
export class GSTINValidator {
  /**
   * Validate GSTIN format and checksum
   */
  static validate(gstin: string): GSTINValidationResult {
    // Remove whitespace and convert to uppercase
    const cleanedGSTIN = gstin.trim().toUpperCase();

    // Check length
    if (cleanedGSTIN.length !== 15) {
      return {
        isValid: false,
        error: `GSTIN must be exactly 15 characters. Provided: ${cleanedGSTIN.length}`,
      };
    }

    // Extract components
    const stateCode = cleanedGSTIN.substring(0, 2);
    const pan = cleanedGSTIN.substring(2, 12);
    const entityNumber = cleanedGSTIN.charAt(12);
    const defaultChar = cleanedGSTIN.charAt(13);
    const checkDigit = cleanedGSTIN.charAt(14);

    // Validate state code
    if (!/^\d{2}$/.test(stateCode)) {
      return {
        isValid: false,
        error: 'First 2 characters must be numeric state code',
      };
    }

    if (!GST_STATE_CODES[stateCode]) {
      return {
        isValid: false,
        error: `Invalid state code: ${stateCode}`,
      };
    }

    // Validate PAN format (10 characters)
    // PAN format: AAAAA9999A (5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    if (!panRegex.test(pan)) {
      return {
        isValid: false,
        error: 'Invalid PAN format. Expected: 5 letters, 4 digits, 1 letter',
      };
    }

    // Validate entity number (alphanumeric)
    if (!/^[0-9A-Z]$/.test(entityNumber)) {
      return {
        isValid: false,
        error: 'Entity number (13th character) must be alphanumeric',
      };
    }

    // Validate default character (must be Z)
    if (defaultChar !== 'Z') {
      return {
        isValid: false,
        error: `14th character must be 'Z'. Found: '${defaultChar}'`,
      };
    }

    // Validate check digit
    const calculatedCheckDigit = this.calculateCheckDigit(cleanedGSTIN.substring(0, 14));
    if (checkDigit !== calculatedCheckDigit) {
      return {
        isValid: false,
        error: `Invalid check digit. Expected: ${calculatedCheckDigit}, Found: ${checkDigit}`,
      };
    }

    // All validations passed
    return {
      isValid: true,
      details: {
        stateCode,
        stateName: GST_STATE_CODES[stateCode],
        pan,
        entityNumber,
        checkDigit,
      },
    };
  }

  /**
   * Calculate check digit using Luhn algorithm with alphanumeric characters
   */
  private static calculateCheckDigit(gstinWithoutCheckDigit: string): string {
    let sum = 0;

    // Process each character
    for (let i = 0; i < gstinWithoutCheckDigit.length; i++) {
      const char = gstinWithoutCheckDigit[i];
      let digit = CHAR_TO_DIGIT[char];

      if (digit === undefined) {
        throw new Error(`Invalid character in GSTIN: ${char}`);
      }

      // Double every second digit (odd positions in 0-indexed)
      const factor = (i % 2) === 0 ? 1 : 2;
      let product = digit * factor;

      // If product > 35, add quotient and remainder
      if (product > 35) {
        const quotient = Math.floor(product / 36);
        const remainder = product % 36;
        product = quotient + remainder;
      }

      sum += product;
    }

    // Calculate check digit
    const checkDigitValue = (36 - (sum % 36)) % 36;
    return DIGIT_TO_CHAR[checkDigitValue];
  }

  /**
   * Generate GSTIN from components
   */
  static generate(stateCode: string, pan: string, entityNumber: string = '1'): string {
    const gstinWithoutCheckDigit = `${stateCode}${pan}${entityNumber}Z`;
    const checkDigit = this.calculateCheckDigit(gstinWithoutCheckDigit);
    return `${gstinWithoutCheckDigit}${checkDigit}`;
  }

  /**
   * Extract state code from GSTIN
   */
  static extractStateCode(gstin: string): string | null {
    const cleaned = gstin.trim().toUpperCase();
    if (cleaned.length < 2) return null;
    return cleaned.substring(0, 2);
  }

  /**
   * Extract PAN from GSTIN
   */
  static extractPAN(gstin: string): string | null {
    const cleaned = gstin.trim().toUpperCase();
    if (cleaned.length < 12) return null;
    return cleaned.substring(2, 12);
  }

  /**
   * Get state name from GSTIN
   */
  static getStateName(gstin: string): string | null {
    const stateCode = this.extractStateCode(gstin);
    if (!stateCode) return null;
    return GST_STATE_CODES[stateCode] || null;
  }

  /**
   * Check if GSTIN is valid (quick check without detailed validation)
   */
  static isValid(gstin: string): boolean {
    return this.validate(gstin).isValid;
  }

  /**
   * Format GSTIN with hyphens for display
   * Example: 27AAPFU0939F1ZV -> 27-AAPFU0939F-1Z-V
   */
  static format(gstin: string): string {
    const cleaned = gstin.trim().toUpperCase().replace(/-/g, '');
    if (cleaned.length !== 15) return gstin;
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 12)}-${cleaned.substring(12, 14)}-${cleaned.charAt(14)}`;
  }
}

/**
 * PAN (Permanent Account Number) Validator
 * PAN is embedded in GSTIN (positions 3-12)
 */
export class PANValidator {
  /**
   * Validate PAN format
   * Format: AAAAA9999A
   * - First 3 characters: Alphabetic series (A-Z)
   * - 4th character: Status indicator
   *   - C: Company
   *   - P: Person
   *   - H: HUF (Hindu Undivided Family)
   *   - F: Firm
   *   - A: Association of Persons
   *   - T: Trust
   *   - B: Body of Individuals
   *   - L: Local Authority
   *   - J: Artificial Juridical Person
   *   - G: Government
   * - 5th character: First letter of surname/name
   * - Next 4 characters: Sequential number (0001-9999)
   * - Last character: Check letter
   */
  static validate(pan: string): { isValid: boolean; error?: string; type?: string } {
    const cleaned = pan.trim().toUpperCase();

    // Check length
    if (cleaned.length !== 10) {
      return {
        isValid: false,
        error: `PAN must be exactly 10 characters. Provided: ${cleaned.length}`,
      };
    }

    // Check format: 5 letters, 4 digits, 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    if (!panRegex.test(cleaned)) {
      return {
        isValid: false,
        error: 'Invalid PAN format. Expected: AAAAA9999A',
      };
    }

    // Extract and validate entity type
    const typeChar = cleaned.charAt(3);
    const entityTypes: Record<string, string> = {
      'C': 'Company',
      'P': 'Person',
      'H': 'HUF (Hindu Undivided Family)',
      'F': 'Firm',
      'A': 'Association of Persons',
      'T': 'Trust',
      'B': 'Body of Individuals',
      'L': 'Local Authority',
      'J': 'Artificial Juridical Person',
      'G': 'Government',
    };

    const entityType = entityTypes[typeChar];
    if (!entityType) {
      return {
        isValid: false,
        error: `Invalid entity type character: ${typeChar}`,
      };
    }

    return {
      isValid: true,
      type: entityType,
    };
  }

  /**
   * Extract entity type from PAN
   */
  static getEntityType(pan: string): string | null {
    const validation = this.validate(pan);
    return validation.isValid ? validation.type || null : null;
  }
}

/**
 * Determine if transaction is intra-state or inter-state
 */
export class GSTTransactionTypeValidator {
  /**
   * Determine transaction type based on supplier and recipient GSTIN
   */
  static determineTransactionType(
    supplierGSTIN: string,
    recipientGSTIN: string
  ): {
    type: 'INTRA_STATE' | 'INTER_STATE';
    taxComponents: string[];
    supplierState: string;
    recipientState: string;
  } | null {
    const supplierStateCode = GSTINValidator.extractStateCode(supplierGSTIN);
    const recipientStateCode = GSTINValidator.extractStateCode(recipientGSTIN);

    if (!supplierStateCode || !recipientStateCode) {
      return null;
    }

    const supplierStateName = GST_STATE_CODES[supplierStateCode];
    const recipientStateName = GST_STATE_CODES[recipientStateCode];

    if (!supplierStateName || !recipientStateName) {
      return null;
    }

    // Intra-state: Same state -> CGST + SGST/UTGST
    // Inter-state: Different states -> IGST
    const isIntraState = supplierStateCode === recipientStateCode;

    return {
      type: isIntraState ? 'INTRA_STATE' : 'INTER_STATE',
      taxComponents: isIntraState ? ['CGST', 'SGST'] : ['IGST'],
      supplierState: supplierStateName,
      recipientState: recipientStateName,
    };
  }

  /**
   * Calculate GST components based on rate and transaction type
   */
  static calculateGSTComponents(
    totalRate: number,
    transactionType: 'INTRA_STATE' | 'INTER_STATE',
    isUnionTerritory: boolean = false
  ): {
    cgst?: number;
    sgst?: number;
    utgst?: number;
    igst?: number;
  } {
    if (transactionType === 'INTRA_STATE') {
      const halfRate = totalRate / 2;
      if (isUnionTerritory) {
        return { cgst: halfRate, utgst: halfRate };
      }
      return { cgst: halfRate, sgst: halfRate };
    } else {
      return { igst: totalRate };
    }
  }
}

/**
 * HSN/SAC Code Validator
 */
export class HSNSACValidator {
  /**
   * Validate HSN code (for goods)
   * HSN codes can be 4, 6, or 8 digits
   */
  static validateHSN(hsn: string): { isValid: boolean; error?: string; length?: number } {
    const cleaned = hsn.trim();

    if (!/^\d{4,8}$/.test(cleaned)) {
      return {
        isValid: false,
        error: 'HSN code must be 4, 6, or 8 digits',
      };
    }

    const length = cleaned.length;
    if (length !== 4 && length !== 6 && length !== 8) {
      return {
        isValid: false,
        error: 'HSN code must be exactly 4, 6, or 8 digits',
      };
    }

    return {
      isValid: true,
      length,
    };
  }

  /**
   * Validate SAC code (for services)
   * SAC codes are 6 digits
   */
  static validateSAC(sac: string): { isValid: boolean; error?: string } {
    const cleaned = sac.trim();

    if (!/^\d{6}$/.test(cleaned)) {
      return {
        isValid: false,
        error: 'SAC code must be exactly 6 digits',
      };
    }

    // SAC codes start with 99
    if (!cleaned.startsWith('99')) {
      return {
        isValid: false,
        error: 'SAC code must start with 99',
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Determine if HSN/SAC is required based on turnover
   */
  static isHSNRequired(turnover: number): { required: boolean; digits: number } {
    if (turnover > 50_000_000) {
      // Above ₹5 crore
      return { required: true, digits: 6 };
    } else if (turnover > 5_000_000) {
      // Above ₹50 lakhs
      return { required: true, digits: 4 };
    } else {
      return { required: false, digits: 0 };
    }
  }
}

/**
 * Export all validators
 */
export const IndiaGSTValidators = {
  GSTIN: GSTINValidator,
  PAN: PANValidator,
  TransactionType: GSTTransactionTypeValidator,
  HSNSAC: HSNSACValidator,
};
