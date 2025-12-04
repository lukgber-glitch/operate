import { Injectable, Logger } from '@nestjs/common';
import {
  CodiceFiscale,
  PartitaIVA,
  FiscalCodeValidationResult,
} from '../types/sdi.types';

/**
 * SDI Codice Fiscale Validation Service
 * Validates Italian fiscal codes and VAT numbers
 *
 * Codice Fiscale format:
 * - 16 characters for individuals (alphanumeric)
 * - 11 digits for companies (numeric, same as Partita IVA)
 *
 * Partita IVA format:
 * - IT + 11 digits
 */
@Injectable()
export class SDICodiceFiscaleService {
  private readonly logger = new Logger(SDICodiceFiscaleService.name);

  // Lookup tables for Codice Fiscale calculation
  private readonly MONTHS = {
    '01': 'A', '02': 'B', '03': 'C', '04': 'D', '05': 'E', '06': 'H',
    '07': 'L', '08': 'M', '09': 'P', '10': 'R', '11': 'S', '12': 'T',
  };

  private readonly ODD_CHARS: Record<string, number> = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23,
  };

  private readonly EVEN_CHARS: Record<string, number> = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
    'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25,
  };

  private readonly CHECK_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /**
   * Validate Codice Fiscale
   */
  validateCodiceFiscale(codiceFiscale: string): FiscalCodeValidationResult {
    if (!codiceFiscale) {
      return {
        valid: false,
        type: 'UNKNOWN',
        errors: ['Codice fiscale is required'],
      };
    }

    const cf = codiceFiscale.toUpperCase().trim();

    // Check if it's a company code (11 digits)
    if (/^\d{11}$/.test(cf)) {
      const vatValidation = this.validatePartitaIVA(cf);
      return {
        valid: vatValidation.valid,
        type: 'COMPANY',
        formatted: cf,
        errors: !vatValidation.valid ? ['Invalid company fiscal code'] : undefined,
      };
    }

    // Check if it's an individual code (16 alphanumeric)
    if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cf)) {
      return {
        valid: false,
        type: 'UNKNOWN',
        errors: ['Invalid format. Expected 16 alphanumeric characters for individuals or 11 digits for companies'],
      };
    }

    // Validate checksum
    const checksumValid = this.validateChecksum(cf);
    if (!checksumValid) {
      return {
        valid: false,
        type: 'INDIVIDUAL',
        formatted: cf,
        errors: ['Invalid checksum'],
      };
    }

    // Extract information
    const extractedData = this.extractDataFromCodiceFiscale(cf);

    return {
      valid: true,
      type: 'INDIVIDUAL',
      formatted: cf,
      extractedData,
    };
  }

  /**
   * Validate Partita IVA (Italian VAT number)
   */
  validatePartitaIVA(partitaIVA: string): PartitaIVA {
    let cleaned = partitaIVA.toUpperCase().trim();

    // Remove IT prefix if present
    if (cleaned.startsWith('IT')) {
      cleaned = cleaned.substring(2);
    }

    // Check format: must be 11 digits
    if (!/^\d{11}$/.test(cleaned)) {
      return {
        countryCode: 'IT',
        number: cleaned,
        formatted: `IT${cleaned}`,
        valid: false,
      };
    }

    // Validate checksum using Luhn algorithm
    const valid = this.validatePartitaIVAChecksum(cleaned);

    return {
      countryCode: 'IT',
      number: cleaned,
      formatted: `IT${cleaned}`,
      valid,
    };
  }

  /**
   * Validate Codice Fiscale checksum
   */
  private validateChecksum(cf: string): boolean {
    let sum = 0;

    // Process first 15 characters
    for (let i = 0; i < 15; i++) {
      const char = cf[i];
      if (i % 2 === 0) {
        // Odd position (1st, 3rd, 5th, etc.)
        sum += this.ODD_CHARS[char] || 0;
      } else {
        // Even position
        sum += this.EVEN_CHARS[char] || 0;
      }
    }

    // Calculate check character
    const checkChar = this.CHECK_CHARS[sum % 26];

    return checkChar === cf[15];
  }

  /**
   * Validate Partita IVA checksum (Luhn algorithm variant)
   */
  private validatePartitaIVAChecksum(piva: string): boolean {
    let sum = 0;

    for (let i = 0; i < 10; i++) {
      let digit = parseInt(piva[i]);

      if (i % 2 === 0) {
        // Even position
        sum += digit;
      } else {
        // Odd position
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
        sum += digit;
      }
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(piva[10]);
  }

  /**
   * Extract data from Codice Fiscale
   */
  private extractDataFromCodiceFiscale(cf: string): {
    surname?: string;
    name?: string;
    birthDate?: Date;
    birthPlace?: string;
    gender?: 'M' | 'F';
  } {
    try {
      // Extract year
      const yearPart = parseInt(cf.substring(6, 8));
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const year = yearPart + currentCentury;
      const adjustedYear = year > currentYear ? year - 100 : year;

      // Extract month
      const monthChar = cf[8];
      const monthNumber = Object.entries(this.MONTHS).find(
        ([_, char]) => char === monthChar,
      )?.[0];

      // Extract day and gender
      const dayPart = parseInt(cf.substring(9, 11));
      const gender: 'M' | 'F' = dayPart > 40 ? 'F' : 'M';
      const day = dayPart > 40 ? dayPart - 40 : dayPart;

      // Extract birth place code
      const birthPlaceCode = cf.substring(11, 15);

      let birthDate: Date | undefined;
      if (monthNumber) {
        birthDate = new Date(adjustedYear, parseInt(monthNumber) - 1, day);
      }

      return {
        birthDate,
        birthPlace: birthPlaceCode,
        gender,
      };
    } catch (error) {
      this.logger.warn('Failed to extract data from Codice Fiscale', {
        error: error.message,
        cf,
      });
      return {};
    }
  }

  /**
   * Format Partita IVA with IT prefix
   */
  formatPartitaIVA(partitaIVA: string): string {
    let cleaned = partitaIVA.toUpperCase().trim();
    if (cleaned.startsWith('IT')) {
      return cleaned;
    }
    return `IT${cleaned}`;
  }

  /**
   * Validate Codice Destinatario (recipient code for SDI)
   */
  validateCodiceDestinatario(code: string): boolean {
    if (!code) {
      return false;
    }

    const cleaned = code.trim().toUpperCase();

    // Must be exactly 7 characters
    if (cleaned.length !== 7) {
      return false;
    }

    // Can be alphanumeric
    // '0000000' is valid for PEC delivery
    // '0000001' to '9999999' are valid codes
    // Alphanumeric codes are also valid
    return /^[A-Z0-9]{7}$/.test(cleaned);
  }

  /**
   * Validate PEC email (Certified Email)
   */
  validatePEC(email: string): boolean {
    if (!email) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create CodiceFiscale object
   */
  createCodiceFiscale(value: string): CodiceFiscale {
    const validation = this.validateCodiceFiscale(value);

    return {
      value: validation.formatted || value,
      type: validation.type === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL',
      valid: validation.valid,
      validationErrors: validation.errors,
    };
  }

  /**
   * Create PartitaIVA object
   */
  createPartitaIVA(value: string): PartitaIVA {
    return this.validatePartitaIVA(value);
  }
}
