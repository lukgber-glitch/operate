/**
 * SV-Meldung Validator Utility
 * Validates German social security identifiers and business rules
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * SV Validator Class
 */
export class SvValidator {
  /**
   * Validate Betriebsnummer (Employer ID)
   * Format: 8 digits with checksum
   */
  static validateBetriebsnummer(betriebsnummer: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Remove any spaces or dashes
    const cleaned = betriebsnummer.replace(/[\s\-]/g, '');

    // Check length
    if (cleaned.length !== 8) {
      errors.push('Betriebsnummer must be exactly 8 digits');
      return { isValid: false, errors, warnings };
    }

    // Check if numeric
    if (!/^\d{8}$/.test(cleaned)) {
      errors.push('Betriebsnummer must contain only digits');
      return { isValid: false, errors, warnings };
    }

    // Validate checksum (digit 8 is checksum)
    const checksum = this.calculateBetriebsnummerChecksum(
      cleaned.substring(0, 7),
    );
    if (checksum !== parseInt(cleaned[7])) {
      errors.push('Invalid Betriebsnummer checksum');
    }

    // Check for test number
    if (cleaned.startsWith('99')) {
      warnings.push('This is a test Betriebsnummer');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate Betriebsnummer checksum
   */
  private static calculateBetriebsnummerChecksum(
    digits: string,
  ): number {
    // Standard checksum algorithm for Betriebsnummer
    const weights = [7, 3, 1, 7, 3, 1, 7];
    let sum = 0;

    for (let i = 0; i < 7; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }

    return sum % 10;
  }

  /**
   * Validate Versicherungsnummer (Insurance Number)
   * Format: 12 characters - BBTTMMJJFNNN
   * BB = Bereichsnummer (2 digits)
   * TTMMJJ = Birth date
   * F = First letter of birth name
   * NNN = Serial number + checksum
   */
  static validateVersicherungsnummer(
    versicherungsnummer: string,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Remove any spaces or dashes
    const cleaned = versicherungsnummer.replace(/[\s\-]/g, '').toUpperCase();

    // Check length
    if (cleaned.length !== 12) {
      errors.push('Versicherungsnummer must be exactly 12 characters');
      return { isValid: false, errors, warnings };
    }

    // Check format: 8 digits, 1 letter, 3 digits
    if (!/^\d{8}[A-Z]\d{3}$/.test(cleaned)) {
      errors.push(
        'Invalid Versicherungsnummer format (expected: 8 digits, 1 letter, 3 digits)',
      );
      return { isValid: false, errors, warnings };
    }

    // Extract components
    const bereichsnummer = cleaned.substring(0, 2);
    const birthDate = cleaned.substring(2, 8); // TTMMJJ
    const birthNameLetter = cleaned[8];
    const serialNumber = cleaned.substring(9, 12);

    // Validate Bereichsnummer (01-99, excluding certain ranges)
    const bn = parseInt(bereichsnummer);
    if (bn < 2 || bn > 99) {
      errors.push('Invalid Bereichsnummer (must be 02-99)');
    }

    // Validate birth date
    const day = parseInt(birthDate.substring(0, 2));
    const month = parseInt(birthDate.substring(2, 4));
    const year = parseInt(birthDate.substring(4, 6));

    if (day < 1 || day > 31) {
      errors.push('Invalid day in birth date');
    }
    if (month < 1 || month > 12) {
      errors.push('Invalid month in birth date');
    }

    // Check for invalid letter (I, O, Q are not used)
    if (['I', 'O', 'Q'].includes(birthNameLetter)) {
      errors.push(
        'Invalid birth name letter (I, O, Q are not used)',
      );
    }

    // Validate checksum (last digit of serial number)
    const checksumValid = this.validateVersicherungsnummerChecksum(
      cleaned,
    );
    if (!checksumValid) {
      errors.push('Invalid Versicherungsnummer checksum');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate Versicherungsnummer checksum
   */
  private static validateVersicherungsnummerChecksum(
    vnr: string,
  ): boolean {
    // Simplified checksum validation
    // Real implementation would use complex modulo-11 algorithm
    const weights = [2, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2];
    let sum = 0;

    for (let i = 0; i < 11; i++) {
      const char = vnr[i];
      const value =
        i === 8 ? char.charCodeAt(0) - 64 : parseInt(char);
      sum += value * weights[i];
    }

    const checksum = sum % 10;
    const expectedChecksum = parseInt(vnr[11]);

    return checksum === expectedChecksum;
  }

  /**
   * Validate IK (Institutionskennzeichen - Health Carrier ID)
   * Format: 9 digits with checksum
   */
  static validateIK(ik: string): ValidationResult {
    const errors: string[] = [];

    // Remove any spaces or dashes
    const cleaned = ik.replace(/[\s\-]/g, '');

    // Check length
    if (cleaned.length !== 9) {
      errors.push('IK must be exactly 9 digits');
      return { isValid: false, errors };
    }

    // Check if numeric
    if (!/^\d{9}$/.test(cleaned)) {
      errors.push('IK must contain only digits');
      return { isValid: false, errors };
    }

    // Validate checksum (digit 9 is checksum)
    const checksum = this.calculateIKChecksum(cleaned.substring(0, 8));
    if (checksum !== parseInt(cleaned[8])) {
      errors.push('Invalid IK checksum');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate IK checksum (modulo 10)
   */
  private static calculateIKChecksum(digits: string): number {
    const weights = [2, 1, 2, 1, 2, 1, 2, 1];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      const product = parseInt(digits[i]) * weights[i];
      // Add cross sum for products >= 10
      sum += product >= 10 ? Math.floor(product / 10) + (product % 10) : product;
    }

    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
  }

  /**
   * Validate Beitragsgruppe (Contribution Group) value
   */
  static validateBeitragsgruppe(
    type: 'KV' | 'RV' | 'AV' | 'PV',
    value: string,
  ): ValidationResult {
    const errors: string[] = [];

    const ranges: Record<string, { min: number; max: number }> = {
      KV: { min: 0, max: 6 },
      RV: { min: 0, max: 9 },
      AV: { min: 0, max: 2 },
      PV: { min: 0, max: 2 },
    };

    const range = ranges[type];
    const numValue = parseInt(value);

    if (isNaN(numValue) || numValue < range.min || numValue > range.max) {
      errors.push(
        `${type} must be between ${range.min} and ${range.max}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Personengruppe (Person Group)
   * Valid range: 101-190
   */
  static validatePersonengruppe(
    personengruppe: string,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const num = parseInt(personengruppe);

    if (isNaN(num) || num < 101 || num > 190) {
      errors.push('Personengruppe must be between 101 and 190');
    }

    // Common person groups
    const commonGroups = [101, 102, 103, 105, 106, 109, 110, 121];
    if (!commonGroups.includes(num)) {
      warnings.push(
        'This Personengruppe is less common - please verify',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate postal code (German PLZ)
   */
  static validatePLZ(plz: string): ValidationResult {
    const errors: string[] = [];

    if (!/^\d{5}$/.test(plz)) {
      errors.push('PLZ must be exactly 5 digits');
    }

    // First digit should be 0-9 (Germany)
    const firstDigit = parseInt(plz[0]);
    if (firstDigit < 0 || firstDigit > 9) {
      errors.push('Invalid PLZ range for Germany');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate salary/wage amount
   */
  static validateEntgelt(
    entgelt: number,
    checkBBG = true,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Must be positive
    if (entgelt < 0) {
      errors.push('Entgelt cannot be negative');
    }

    // Check against contribution ceiling (Beitragsbemessungsgrenze) 2024
    const BBG_RV_2024 = 7550; // Monthly for West Germany
    const BBG_GKV_2024 = 5175; // Monthly

    if (checkBBG) {
      if (entgelt > BBG_RV_2024) {
        warnings.push(
          `Entgelt exceeds pension insurance BBG (${BBG_RV_2024} EUR/month)`,
        );
      }
      if (entgelt > BBG_GKV_2024) {
        warnings.push(
          `Entgelt exceeds health insurance BBG (${BBG_GKV_2024} EUR/month)`,
        );
      }
    }

    // Check for minijob threshold
    if (entgelt > 0 && entgelt <= 538) {
      warnings.push(
        'This appears to be a Minijob - ensure correct Beitragsgruppen',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate complete SV-Meldung data consistency
   */
  static validateMeldungConsistency(data: {
    beitragsgruppen: { kv: string; rv: string; av: string; pv: string };
    personengruppe: string;
    entgelt?: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { beitragsgruppen, personengruppe, entgelt } = data;

    // Check for Minijob consistency
    if (personengruppe === '109') {
      // Geringfügig Beschäftigte
      if (beitragsgruppen.kv !== '5' && beitragsgruppen.kv !== '6') {
        warnings.push(
          'Minijob (109) typically has KV = 5 or 6',
        );
      }
      if (entgelt && entgelt > 538) {
        warnings.push(
          'Entgelt exceeds Minijob threshold (538 EUR)',
        );
      }
    }

    // Check for full employment consistency
    if (personengruppe === '101') {
      // Voll versicherungspflichtig
      if (
        beitragsgruppen.kv === '0' ||
        beitragsgruppen.rv === '0'
      ) {
        warnings.push(
          'Full employment (101) should not have 0 for KV/RV',
        );
      }
    }

    // Check pension exemption age (placeholder)
    // Would need birth date to check if >= 67 years

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
