/**
 * Singapore UEN Validator
 * Validates Singapore Unique Entity Numbers (UEN)
 *
 * UEN Format:
 * - Business (ROB): 9 digits + 1 letter (e.g., 53012345D)
 * - Local Company (ROC): 8 digits + 1 letter (e.g., 201234567A)
 * - Foreign Company/Others: T/S/R + 2 digits + 2 letters + 4 digits + 1 letter
 */

import { Injectable, Logger } from '@nestjs/common';
import { UEN_PATTERNS } from './invoice-now.constants';
import { UenValidationServiceResponse } from './invoice-now.types';

@Injectable()
export class InvoiceNowUenValidator {
  private readonly logger = new Logger(InvoiceNowUenValidator.name);

  /**
   * Validate UEN format
   */
  validate(uen: string): UenValidationServiceResponse {
    // Normalize UEN (uppercase, remove whitespace)
    const normalizedUen = uen.trim().toUpperCase();

    this.logger.debug('Validating UEN', { uen: normalizedUen });

    // Check if UEN matches any supported format
    const validationResult = this.validateFormat(normalizedUen);

    if (!validationResult.isValid) {
      return {
        isValid: false,
        uen: normalizedUen,
        errors: ['Invalid UEN format'],
      };
    }

    // Perform checksum validation
    const checksumValid = this.validateChecksum(normalizedUen, validationResult.type!);

    if (!checksumValid) {
      return {
        isValid: false,
        uen: normalizedUen,
        type: validationResult.type,
        errors: ['Invalid UEN checksum'],
      };
    }

    this.logger.debug('UEN validation successful', {
      uen: normalizedUen,
      type: validationResult.type,
    });

    return {
      isValid: true,
      uen: normalizedUen,
      type: validationResult.type,
      status: 'ACTIVE', // Would need external API to verify actual status
    };
  }

  /**
   * Validate UEN format against patterns
   */
  private validateFormat(
    uen: string,
  ): { isValid: boolean; type?: 'BUSINESS' | 'LOCAL_COMPANY' | 'FOREIGN_COMPANY' | 'OTHER' } {
    // Business registration (ROB) - 9 digits + 1 letter
    if (UEN_PATTERNS.BUSINESS.test(uen)) {
      return { isValid: true, type: 'BUSINESS' };
    }

    // Local company (ROC) - 8 digits + 1 letter
    if (UEN_PATTERNS.LOCAL_COMPANY.test(uen)) {
      return { isValid: true, type: 'LOCAL_COMPANY' };
    }

    // Foreign company (RFC) or other entities
    if (UEN_PATTERNS.FOREIGN_COMPANY.test(uen)) {
      return { isValid: true, type: 'FOREIGN_COMPANY' };
    }

    // Other entities (e.g., government bodies, statutory boards)
    if (UEN_PATTERNS.OTHER.test(uen)) {
      return { isValid: true, type: 'OTHER' };
    }

    return { isValid: false };
  }

  /**
   * Validate UEN checksum
   * Based on Singapore ACRA checksum algorithm
   */
  private validateChecksum(
    uen: string,
    type: 'BUSINESS' | 'LOCAL_COMPANY' | 'FOREIGN_COMPANY' | 'OTHER',
  ): boolean {
    try {
      if (type === 'BUSINESS') {
        return this.validateBusinessChecksum(uen);
      } else if (type === 'LOCAL_COMPANY') {
        return this.validateLocalCompanyChecksum(uen);
      } else {
        return this.validateOtherChecksum(uen);
      }
    } catch (error) {
      this.logger.error('Checksum validation failed', { uen, error: error.message });
      return false;
    }
  }

  /**
   * Validate Business UEN checksum (9 digits + 1 letter)
   * Format: NNNNNNNNA where A is check letter
   */
  private validateBusinessChecksum(uen: string): boolean {
    const digits = uen.substring(0, 8);
    const checkLetter = uen.charAt(8);

    // Weights for checksum calculation
    const weights = [10, 12, 14, 16, 18, 20, 22, 24];

    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += parseInt(digits.charAt(i), 10) * weights[i];
    }

    const remainder = sum % 11;
    const expectedLetter = this.getCheckLetter(remainder);

    return checkLetter === expectedLetter;
  }

  /**
   * Validate Local Company UEN checksum (8 digits + 1 letter)
   * Format: NNNNNNNNC where C is check letter
   */
  private validateLocalCompanyChecksum(uen: string): boolean {
    const digits = uen.substring(0, 9);
    const checkLetter = uen.charAt(9);

    // Weights for checksum calculation
    const weights = [10, 12, 14, 16, 18, 20, 22, 24, 26];

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits.charAt(i), 10) * weights[i];
    }

    const remainder = sum % 11;
    const expectedLetter = this.getCheckLetter(remainder);

    return checkLetter === expectedLetter;
  }

  /**
   * Validate Other entity UEN checksum
   * Format: TNNLLNNNNC where C is check letter
   */
  private validateOtherChecksum(uen: string): boolean {
    // Extract numeric parts for checksum calculation
    const entityType = uen.charAt(0); // T, S, or R
    const year = uen.substring(1, 3);
    const entityCode = uen.substring(3, 5);
    const serialNumber = uen.substring(5, 9);
    const checkLetter = uen.charAt(9);

    // Convert letters to numeric values (A=10, B=11, ..., Z=35)
    const entityCodeValue1 = this.letterToNumber(entityCode.charAt(0));
    const entityCodeValue2 = this.letterToNumber(entityCode.charAt(1));

    // Weights for checksum calculation
    const weights = [2, 3, 5, 7, 11, 13, 17, 19, 23];

    const values = [
      parseInt(year.charAt(0), 10),
      parseInt(year.charAt(1), 10),
      entityCodeValue1,
      entityCodeValue2,
      parseInt(serialNumber.charAt(0), 10),
      parseInt(serialNumber.charAt(1), 10),
      parseInt(serialNumber.charAt(2), 10),
      parseInt(serialNumber.charAt(3), 10),
    ];

    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += values[i] * weights[i];
    }

    const remainder = sum % 11;
    const expectedLetter = this.getCheckLetter(remainder);

    return checkLetter === expectedLetter;
  }

  /**
   * Get check letter from remainder
   */
  private getCheckLetter(remainder: number): string {
    const checkLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'Z', 'J'];
    return checkLetters[remainder];
  }

  /**
   * Convert letter to numeric value for checksum calculation
   */
  private letterToNumber(letter: string): number {
    return letter.charCodeAt(0) - 65 + 10; // A=10, B=11, ..., Z=35
  }

  /**
   * Validate GST registration number
   * Format: M + 8 digits + 1 check letter (e.g., M12345678X)
   * Or: Standard UEN for GST registered entities
   */
  validateGstNumber(gstNumber: string): boolean {
    const normalized = gstNumber.trim().toUpperCase();

    // Check if it's M-format GST number
    if (/^M[0-9]{8}[A-Z]$/.test(normalized)) {
      // For M-format, validate using standard business checksum
      const businessPart = normalized.substring(1); // Remove 'M' prefix
      return this.validateBusinessChecksum(businessPart);
    }

    // Otherwise, it should be a valid UEN
    const uenValidation = this.validate(normalized);
    return uenValidation.isValid;
  }

  /**
   * Extract UEN type from validated UEN
   */
  getUenType(uen: string): string | null {
    const validation = this.validateFormat(uen.trim().toUpperCase());
    return validation.type || null;
  }

  /**
   * Check if UEN is for a business entity
   */
  isBusinessEntity(uen: string): boolean {
    const type = this.getUenType(uen);
    return type === 'BUSINESS';
  }

  /**
   * Check if UEN is for a local company
   */
  isLocalCompany(uen: string): boolean {
    const type = this.getUenType(uen);
    return type === 'LOCAL_COMPANY';
  }

  /**
   * Check if UEN is for a foreign company
   */
  isForeignCompany(uen: string): boolean {
    const type = this.getUenType(uen);
    return type === 'FOREIGN_COMPANY';
  }

  /**
   * Format UEN for display (add hyphens for readability)
   */
  formatUen(uen: string): string {
    const normalized = uen.trim().toUpperCase();
    const type = this.getUenType(normalized);

    if (!type) {
      return normalized;
    }

    // Format based on type
    if (type === 'BUSINESS') {
      // Format: NNNNN-NNNA
      return `${normalized.substring(0, 5)}-${normalized.substring(5)}`;
    } else if (type === 'LOCAL_COMPANY') {
      // Format: NNNNNNNN-A
      return `${normalized.substring(0, 9)}-${normalized.substring(9)}`;
    } else {
      // Format: TNN-LL-NNNN-A
      return `${normalized.substring(0, 3)}-${normalized.substring(3, 5)}-${normalized.substring(5, 9)}-${normalized.substring(9)}`;
    }
  }
}
