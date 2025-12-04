/**
 * Spanish Tax Validator Tests
 * Tests for NIF, NIE, CIF, and VAT number validation
 */

import {
  isValidSpanishNIF,
  isValidSpanishNIE,
  isValidSpanishCIF,
  isValidSpanishTaxId,
  isValidSpanishVATNumber,
  calculateNIFLetter,
  calculateCIFControl,
  getSpanishTaxIdType,
  getCIFCompanyType,
  formatSpanishTaxId,
  formatSpanishVATNumber,
} from '../spain-tax.validator';

describe('Spanish Tax Validators', () => {
  describe('NIF Validation (Individual Tax ID)', () => {
    it('should validate correct NIF numbers', () => {
      expect(isValidSpanishNIF('12345678Z')).toBe(true);
      expect(isValidSpanishNIF('00000000T')).toBe(true);
      expect(isValidSpanishNIF('99999999R')).toBe(true);
    });

    it('should reject invalid NIF numbers', () => {
      expect(isValidSpanishNIF('12345678X')).toBe(false); // Wrong letter
      expect(isValidSpanishNIF('1234567Z')).toBe(false); // Too short
      expect(isValidSpanishNIF('123456789Z')).toBe(false); // Too long
      expect(isValidSpanishNIF('ABCDEFGHZ')).toBe(false); // Letters in number
    });

    it('should handle NIF with spaces and hyphens', () => {
      expect(isValidSpanishNIF('12345678-Z')).toBe(true);
      expect(isValidSpanishNIF('12 345 678 Z')).toBe(true);
    });
  });

  describe('NIE Validation (Foreign Individual Tax ID)', () => {
    it('should validate correct NIE numbers', () => {
      expect(isValidSpanishNIE('X1234567L')).toBe(true);
      expect(isValidSpanishNIE('Y1234567Z')).toBe(true);
      expect(isValidSpanishNIE('Z1234567R')).toBe(true);
    });

    it('should reject invalid NIE numbers', () => {
      expect(isValidSpanishNIE('X1234567A')).toBe(false); // Wrong letter
      expect(isValidSpanishNIE('A1234567L')).toBe(false); // Wrong prefix
      expect(isValidSpanishNIE('X123456L')).toBe(false); // Too short
    });

    it('should handle NIE with spaces and hyphens', () => {
      expect(isValidSpanishNIE('X-1234567-L')).toBe(true);
      expect(isValidSpanishNIE('X 1234567 L')).toBe(true);
    });
  });

  describe('CIF Validation (Company Tax ID)', () => {
    it('should validate correct CIF numbers', () => {
      // These are example CIFs with valid structure
      expect(isValidSpanishCIF('A12345674')).toBe(true);
      expect(isValidSpanishCIF('B12345678')).toBe(true);
    });

    it('should reject invalid CIF numbers', () => {
      expect(isValidSpanishCIF('X12345678')).toBe(false); // Invalid type letter
      expect(isValidSpanishCIF('A1234567')).toBe(false); // Too short
      expect(isValidSpanishCIF('12345678A')).toBe(false); // Missing type letter
    });

    it('should handle CIF with spaces and hyphens', () => {
      expect(isValidSpanishCIF('B-12345678')).toBe(true);
      expect(isValidSpanishCIF('B 12345678')).toBe(true);
    });
  });

  describe('calculateNIFLetter', () => {
    it('should calculate correct control letters', () => {
      expect(calculateNIFLetter(12345678)).toBe('Z');
      expect(calculateNIFLetter(0)).toBe('T');
      expect(calculateNIFLetter(99999999)).toBe('R');
    });
  });

  describe('calculateCIFControl', () => {
    it('should calculate correct control characters', () => {
      // Test with known valid CIFs
      const control1 = calculateCIFControl('B', '1234567');
      expect(['8', 'I']).toContain(control1); // Can be either

      const control2 = calculateCIFControl('A', '1234567');
      expect(control2).toMatch(/[0-9]/); // Should be digit for type A
    });
  });

  describe('isValidSpanishTaxId', () => {
    it('should validate any type of Spanish tax ID', () => {
      expect(isValidSpanishTaxId('12345678Z')).toBe(true); // NIF
      expect(isValidSpanishTaxId('X1234567L')).toBe(true); // NIE
      expect(isValidSpanishTaxId('B12345678')).toBe(true); // CIF
    });

    it('should reject invalid tax IDs', () => {
      expect(isValidSpanishTaxId('12345678')).toBe(false); // Incomplete
      expect(isValidSpanishTaxId('INVALID')).toBe(false);
      expect(isValidSpanishTaxId('')).toBe(false);
    });
  });

  describe('getSpanishTaxIdType', () => {
    it('should correctly identify tax ID types', () => {
      expect(getSpanishTaxIdType('12345678Z')).toBe('NIF');
      expect(getSpanishTaxIdType('X1234567L')).toBe('NIE');
      expect(getSpanishTaxIdType('B12345678')).toBe('CIF');
      expect(getSpanishTaxIdType('INVALID')).toBe('INVALID');
    });
  });

  describe('getCIFCompanyType', () => {
    it('should return correct company type descriptions', () => {
      expect(getCIFCompanyType('A12345678')).toContain('Sociedad Anónima');
      expect(getCIFCompanyType('B12345678')).toContain('Responsabilidad Limitada');
      expect(getCIFCompanyType('G12345678')).toContain('Asociación');
    });

    it('should return null for invalid CIFs', () => {
      expect(getCIFCompanyType('12345678Z')).toBe(null); // NIF, not CIF
      expect(getCIFCompanyType('INVALID')).toBe(null);
    });
  });

  describe('formatSpanishTaxId', () => {
    it('should format NIF correctly', () => {
      expect(formatSpanishTaxId('12345678Z')).toBe('12345678-Z');
    });

    it('should format NIE correctly', () => {
      expect(formatSpanishTaxId('X1234567L')).toBe('X-1234567-L');
    });

    it('should format CIF correctly', () => {
      expect(formatSpanishTaxId('B12345678')).toBe('B-12345678');
    });

    it('should handle already formatted IDs', () => {
      expect(formatSpanishTaxId('12345678-Z')).toBe('12345678-Z');
    });
  });

  describe('isValidSpanishVATNumber', () => {
    it('should validate Spanish VAT numbers', () => {
      expect(isValidSpanishVATNumber('ESB12345678')).toBe(true);
      expect(isValidSpanishVATNumber('ES12345678Z')).toBe(true);
      expect(isValidSpanishVATNumber('ESX1234567L')).toBe(true);
    });

    it('should reject invalid VAT numbers', () => {
      expect(isValidSpanishVATNumber('B12345678')).toBe(false); // Missing ES
      expect(isValidSpanishVATNumber('ESINVALID')).toBe(false);
      expect(isValidSpanishVATNumber('FRAB123456')).toBe(false); // Wrong country
    });

    it('should handle VAT numbers with spaces', () => {
      expect(isValidSpanishVATNumber('ES B12345678')).toBe(true);
      expect(isValidSpanishVATNumber('ES-B12345678')).toBe(true);
    });
  });

  describe('formatSpanishVATNumber', () => {
    it('should format VAT numbers correctly', () => {
      expect(formatSpanishVATNumber('ESB12345678')).toBe('ES-B12345678');
      expect(formatSpanishVATNumber('ES12345678Z')).toBe('ES-12345678Z');
    });

    it('should add ES prefix if missing', () => {
      expect(formatSpanishVATNumber('B12345678')).toBe('ES-B12345678');
      expect(formatSpanishVATNumber('12345678Z')).toBe('ES-12345678Z');
    });

    it('should handle already formatted VAT numbers', () => {
      expect(formatSpanishVATNumber('ES-B12345678')).toBe('ES-B12345678');
    });
  });
});
