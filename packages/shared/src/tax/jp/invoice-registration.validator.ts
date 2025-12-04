/**
 * Japanese Tax Number Validation
 * Corporate Number (法人番号) and Invoice Registration Number (登録番号) validation
 * Task: W27-T4 - Japanese tax configuration
 */

/**
 * Corporate Number (法人番号) Validator
 * 13-digit number with check digit using modulus 9 algorithm
 */
export class CorporateNumberValidator {
  private static readonly LENGTH = 13;

  /**
   * Validate Corporate Number format and check digit
   * @param corporateNumber - 13-digit corporate number string
   * @returns true if valid, false otherwise
   */
  static validate(corporateNumber: string): boolean {
    if (!corporateNumber) {
      return false;
    }

    // Remove any whitespace or hyphens
    const cleaned = corporateNumber.replace(/[\s-]/g, '');

    // Must be exactly 13 digits
    if (cleaned.length !== this.LENGTH) {
      return false;
    }

    // Must contain only digits
    if (!/^\d{13}$/.test(cleaned)) {
      return false;
    }

    // Validate check digit
    return this.validateCheckDigit(cleaned);
  }

  /**
   * Calculate check digit using modulus 9 algorithm
   * @param digits - 12 digits (excluding check digit)
   * @returns calculated check digit (0-8)
   */
  static calculateCheckDigit(digits: string): number {
    if (digits.length !== 12) {
      throw new Error('Corporate number must be 12 digits (excluding check digit)');
    }

    let sum = 0;
    const positions = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];

    for (let i = 0; i < 12; i++) {
      const digit = parseInt(digits[i], 10);
      sum += digit * positions[i];
    }

    const checkDigit = 9 - (sum % 9);
    return checkDigit === 9 ? 0 : checkDigit;
  }

  /**
   * Validate check digit
   * @param corporateNumber - 13-digit corporate number
   * @returns true if check digit is valid
   */
  static validateCheckDigit(corporateNumber: string): boolean {
    if (corporateNumber.length !== 13) {
      return false;
    }

    const checkDigit = parseInt(corporateNumber[0], 10);
    const mainDigits = corporateNumber.substring(1);

    const calculatedCheckDigit = this.calculateCheckDigit(mainDigits);

    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Generate a valid corporate number with check digit
   * @param digits - 12 digits
   * @returns 13-digit corporate number with check digit
   */
  static generateWithCheckDigit(digits: string): string {
    if (digits.length !== 12) {
      throw new Error('Must provide exactly 12 digits');
    }

    if (!/^\d{12}$/.test(digits)) {
      throw new Error('Digits must contain only numbers');
    }

    const checkDigit = this.calculateCheckDigit(digits);
    return `${checkDigit}${digits}`;
  }

  /**
   * Format corporate number with hyphens for display
   * @param corporateNumber - 13-digit corporate number
   * @returns formatted number (e.g., "1234-56-789012")
   */
  static format(corporateNumber: string): string {
    const cleaned = corporateNumber.replace(/[\s-]/g, '');

    if (!this.validate(cleaned)) {
      throw new Error('Invalid corporate number');
    }

    // Format: 0000-00-000000
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6)}`;
  }

  /**
   * Lookup corporate number in NTA database
   * @param corporateNumber - 13-digit corporate number
   * @returns lookup URL
   */
  static getLookupUrl(corporateNumber: string): string {
    const cleaned = corporateNumber.replace(/[\s-]/g, '');
    return `https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo=${cleaned}`;
  }
}

/**
 * Invoice Registration Number (登録番号) Validator
 * Format: T + 13-digit corporate number
 */
export class InvoiceRegistrationNumberValidator {
  private static readonly PREFIX = 'T';
  private static readonly TOTAL_LENGTH = 14; // 'T' + 13 digits

  /**
   * Validate Invoice Registration Number
   * @param registrationNumber - Invoice registration number (T + 13 digits)
   * @returns true if valid, false otherwise
   */
  static validate(registrationNumber: string): boolean {
    if (!registrationNumber) {
      return false;
    }

    // Remove any whitespace or hyphens
    const cleaned = registrationNumber.replace(/[\s-]/g, '').toUpperCase();

    // Must start with 'T'
    if (!cleaned.startsWith(this.PREFIX)) {
      return false;
    }

    // Must be exactly 14 characters ('T' + 13 digits)
    if (cleaned.length !== this.TOTAL_LENGTH) {
      return false;
    }

    // Extract the corporate number (13 digits after 'T')
    const corporateNumber = cleaned.substring(1);

    // Validate the corporate number part
    return CorporateNumberValidator.validate(corporateNumber);
  }

  /**
   * Extract corporate number from invoice registration number
   * @param registrationNumber - Invoice registration number
   * @returns 13-digit corporate number
   */
  static extractCorporateNumber(registrationNumber: string): string | null {
    const cleaned = registrationNumber.replace(/[\s-]/g, '').toUpperCase();

    if (!this.validate(cleaned)) {
      return null;
    }

    return cleaned.substring(1);
  }

  /**
   * Generate invoice registration number from corporate number
   * @param corporateNumber - 13-digit corporate number
   * @returns Invoice registration number (T + corporate number)
   */
  static generate(corporateNumber: string): string {
    const cleaned = corporateNumber.replace(/[\s-]/g, '');

    if (!CorporateNumberValidator.validate(cleaned)) {
      throw new Error('Invalid corporate number');
    }

    return `${this.PREFIX}${cleaned}`;
  }

  /**
   * Format invoice registration number with hyphens
   * @param registrationNumber - Invoice registration number
   * @returns formatted number (e.g., "T1234-56-789012")
   */
  static format(registrationNumber: string): string {
    const cleaned = registrationNumber.replace(/[\s-]/g, '').toUpperCase();

    if (!this.validate(cleaned)) {
      throw new Error('Invalid invoice registration number');
    }

    const corporateNumber = cleaned.substring(1);
    const formatted = CorporateNumberValidator.format(corporateNumber);

    return `${this.PREFIX}${formatted}`;
  }

  /**
   * Verify invoice registration number in NTA public database
   * @param registrationNumber - Invoice registration number
   * @returns verification URL
   */
  static getVerificationUrl(registrationNumber: string): string {
    const cleaned = registrationNumber.replace(/[\s-]/g, '').toUpperCase();

    if (!this.validate(cleaned)) {
      throw new Error('Invalid invoice registration number');
    }

    return `https://www.invoice-kohyo.nta.go.jp/regno-search/detail?selRegNo=${cleaned}`;
  }

  /**
   * Check if invoice registration is required
   * @param annualSales - Annual taxable sales in JPY
   * @returns true if registration may be beneficial/required
   */
  static isRegistrationRequired(annualSales: number): boolean {
    // Businesses with annual sales over ¥10 million are taxable
    // and should consider registration to issue qualified invoices
    const THRESHOLD = 10_000_000;
    return annualSales >= THRESHOLD;
  }

  /**
   * Get registration deadline for existing businesses
   * @returns registration information
   */
  static getRegistrationInfo() {
    return {
      systemStartDate: '2023-10-01',
      registrationDeadline: 'Ongoing (no deadline for new registrations)',
      effectiveDate: 'Registration effective from specified date',
      authority: '国税庁 (National Tax Agency)',
      applicationMethod: 'e-Tax or paper form submission',
      processingTime: 'Approximately 2-4 weeks',
      cancellation: 'Can cancel registration with advance notice',
    };
  }
}

/**
 * Validation error types
 */
export enum ValidationErrorType {
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_LENGTH = 'INVALID_LENGTH',
  INVALID_CHECK_DIGIT = 'INVALID_CHECK_DIGIT',
  INVALID_PREFIX = 'INVALID_PREFIX',
  MISSING_VALUE = 'MISSING_VALUE',
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errorType?: ValidationErrorType;
  message?: string;
}

/**
 * Comprehensive validator with detailed error messages
 */
export class JapanTaxNumberValidator {
  /**
   * Validate and return detailed result
   * @param number - Tax number to validate
   * @param type - Type of number ('corporate' or 'invoice')
   * @returns detailed validation result
   */
  static validateWithDetails(
    number: string,
    type: 'corporate' | 'invoice'
  ): ValidationResult {
    if (!number) {
      return {
        valid: false,
        errorType: ValidationErrorType.MISSING_VALUE,
        message: 'Tax number is required',
      };
    }

    const cleaned = number.replace(/[\s-]/g, '').toUpperCase();

    if (type === 'invoice') {
      if (!cleaned.startsWith('T')) {
        return {
          valid: false,
          errorType: ValidationErrorType.INVALID_PREFIX,
          message: 'Invoice registration number must start with "T"',
        };
      }

      if (cleaned.length !== 14) {
        return {
          valid: false,
          errorType: ValidationErrorType.INVALID_LENGTH,
          message: 'Invoice registration number must be 14 characters (T + 13 digits)',
        };
      }

      const corporateNumber = cleaned.substring(1);

      if (!CorporateNumberValidator.validateCheckDigit(corporateNumber)) {
        return {
          valid: false,
          errorType: ValidationErrorType.INVALID_CHECK_DIGIT,
          message: 'Invalid check digit in corporate number',
        };
      }

      return { valid: true };
    } else {
      // Corporate number validation
      if (cleaned.length !== 13) {
        return {
          valid: false,
          errorType: ValidationErrorType.INVALID_LENGTH,
          message: 'Corporate number must be exactly 13 digits',
        };
      }

      if (!/^\d{13}$/.test(cleaned)) {
        return {
          valid: false,
          errorType: ValidationErrorType.INVALID_FORMAT,
          message: 'Corporate number must contain only digits',
        };
      }

      if (!CorporateNumberValidator.validateCheckDigit(cleaned)) {
        return {
          valid: false,
          errorType: ValidationErrorType.INVALID_CHECK_DIGIT,
          message: 'Invalid check digit',
        };
      }

      return { valid: true };
    }
  }
}

/**
 * Example usage and test helpers
 */
export const JapanTaxNumberExamples = {
  validCorporateNumbers: [
    '1234567890128', // Example with check digit
    '9000012345678', // Example format
  ],
  validInvoiceNumbers: [
    'T1234567890128',
    'T9000012345678',
  ],
  invalidExamples: {
    tooShort: '123456789',
    tooLong: '12345678901234',
    invalidCheckDigit: '1234567890127',
    missingPrefix: '1234567890128', // For invoice number
    wrongPrefix: 'X1234567890128',
  },
};
