/**
 * Unit tests for Japanese invoice number generation and validation
 */

import {
  generateInvoiceNumber,
  parseInvoiceNumber,
  isValidInvoiceNumber,
  getNextInvoiceNumber,
  createInvoiceNumberFormat,
  getFiscalYear,
  generateFiscalYearInvoiceNumber,
  JAPANESE_INVOICE_FORMATS,
} from '../invoice-number.generator';
import {
  calculateCheckDigit,
  isValidFormat,
  isValidCheckDigit,
  validateRegistrationNumber,
  parseRegistrationNumber,
  generateRegistrationNumber,
  formatRegistrationNumber,
} from '../registration-number.validator';
import { DEFAULT_INVOICE_NUMBER_FORMAT } from '../qualified-invoice.types';

describe('Japanese Invoice Number Generator', () => {
  describe('generateInvoiceNumber', () => {
    it('should generate invoice number with default format', () => {
      const date = new Date('2024-03-15');
      const invoiceNumber = generateInvoiceNumber(1, date);
      expect(invoiceNumber).toBe('INV-202403-0001');
    });

    it('should generate invoice number with different sequence numbers', () => {
      const date = new Date('2024-03-15');
      expect(generateInvoiceNumber(1, date)).toBe('INV-202403-0001');
      expect(generateInvoiceNumber(99, date)).toBe('INV-202403-0099');
      expect(generateInvoiceNumber(1234, date)).toBe('INV-202403-1234');
    });

    it('should pad sequence numbers correctly', () => {
      const date = new Date('2024-03-15');
      expect(generateInvoiceNumber(1, date)).toBe('INV-202403-0001');
      expect(generateInvoiceNumber(10, date)).toBe('INV-202403-0010');
      expect(generateInvoiceNumber(100, date)).toBe('INV-202403-0100');
    });

    it('should work with different months', () => {
      expect(generateInvoiceNumber(1, new Date('2024-01-15'))).toBe('INV-202401-0001');
      expect(generateInvoiceNumber(1, new Date('2024-12-15'))).toBe('INV-202412-0001');
    });

    it('should work with custom format', () => {
      const customFormat = createInvoiceNumberFormat({
        prefix: 'CUSTOM',
        separator: '_',
        sequenceLength: 5,
      });
      const date = new Date('2024-03-15');
      const invoiceNumber = generateInvoiceNumber(42, date, customFormat);
      expect(invoiceNumber).toBe('CUSTOM_202403_00042');
    });

    it('should work without year', () => {
      const format = createInvoiceNumberFormat({
        includeYear: false,
        includeMonth: true,
      });
      const date = new Date('2024-03-15');
      const invoiceNumber = generateInvoiceNumber(1, date, format);
      expect(invoiceNumber).toBe('INV-03-0001');
    });

    it('should work without month', () => {
      const format = createInvoiceNumberFormat({
        includeYear: true,
        includeMonth: false,
      });
      const date = new Date('2024-03-15');
      const invoiceNumber = generateInvoiceNumber(1, date, format);
      expect(invoiceNumber).toBe('INV-2024-0001');
    });

    it('should work with simple sequential format', () => {
      const date = new Date('2024-03-15');
      const invoiceNumber = generateInvoiceNumber(
        123,
        date,
        JAPANESE_INVOICE_FORMATS.SIMPLE_SEQUENTIAL,
      );
      expect(invoiceNumber).toBe('INV-00123');
    });

    it('should work with Japanese prefix', () => {
      const date = new Date('2024-03-15');
      const invoiceNumber = generateInvoiceNumber(
        1,
        date,
        JAPANESE_INVOICE_FORMATS.JAPANESE_PREFIX,
      );
      expect(invoiceNumber).toBe('請求-202403-0001');
    });
  });

  describe('parseInvoiceNumber', () => {
    it('should parse valid invoice number', () => {
      const parsed = parseInvoiceNumber('INV-202403-0001');
      expect(parsed).toEqual({
        prefix: 'INV',
        year: 2024,
        month: 3,
        sequenceNumber: 1,
      });
    });

    it('should parse invoice number with different sequence', () => {
      const parsed = parseInvoiceNumber('INV-202412-9999');
      expect(parsed).toEqual({
        prefix: 'INV',
        year: 2024,
        month: 12,
        sequenceNumber: 9999,
      });
    });

    it('should return null for invalid format', () => {
      expect(parseInvoiceNumber('INVALID')).toBeNull();
      expect(parseInvoiceNumber('INV-2024-03')).toBeNull();
      expect(parseInvoiceNumber('WRONG-202403-0001')).toBeNull();
    });

    it('should parse custom format', () => {
      const customFormat = createInvoiceNumberFormat({
        prefix: 'CUSTOM',
        separator: '_',
      });
      const parsed = parseInvoiceNumber('CUSTOM_202403_0001', customFormat);
      expect(parsed).toEqual({
        prefix: 'CUSTOM',
        year: 2024,
        month: 3,
        sequenceNumber: 1,
      });
    });

    it('should parse simple sequential format', () => {
      const parsed = parseInvoiceNumber('INV-00123', JAPANESE_INVOICE_FORMATS.SIMPLE_SEQUENTIAL);
      expect(parsed).toEqual({
        prefix: 'INV',
        sequenceNumber: 123,
      });
    });
  });

  describe('isValidInvoiceNumber', () => {
    it('should validate correct invoice numbers', () => {
      expect(isValidInvoiceNumber('INV-202403-0001')).toBe(true);
      expect(isValidInvoiceNumber('INV-202412-9999')).toBe(true);
    });

    it('should reject invalid invoice numbers', () => {
      expect(isValidInvoiceNumber('INVALID')).toBe(false);
      expect(isValidInvoiceNumber('INV-2024-03')).toBe(false);
      expect(isValidInvoiceNumber('WRONG-202403-0001')).toBe(false);
    });

    it('should validate custom formats', () => {
      const customFormat = createInvoiceNumberFormat({
        prefix: 'CUSTOM',
        separator: '_',
      });
      expect(isValidInvoiceNumber('CUSTOM_202403_0001', customFormat)).toBe(true);
      expect(isValidInvoiceNumber('INV-202403-0001', customFormat)).toBe(false);
    });
  });

  describe('getNextInvoiceNumber', () => {
    it('should generate next invoice number in sequence', () => {
      const next = getNextInvoiceNumber('INV-202403-0001');
      expect(next).toBe('INV-202403-0002');
    });

    it('should handle multi-digit increments', () => {
      expect(getNextInvoiceNumber('INV-202403-0099')).toBe('INV-202403-0100');
      expect(getNextInvoiceNumber('INV-202403-9999')).toBe('INV-202403-10000');
    });

    it('should return null for invalid invoice numbers', () => {
      expect(getNextInvoiceNumber('INVALID')).toBeNull();
    });

    it('should work with custom formats', () => {
      const customFormat = createInvoiceNumberFormat({
        prefix: 'CUSTOM',
        separator: '_',
      });
      const next = getNextInvoiceNumber('CUSTOM_202403_0001', customFormat);
      expect(next).toBe('CUSTOM_202403_0002');
    });
  });

  describe('getFiscalYear', () => {
    it('should return correct fiscal year for April-December', () => {
      expect(getFiscalYear(new Date('2024-04-01'))).toBe(2024);
      expect(getFiscalYear(new Date('2024-06-15'))).toBe(2024);
      expect(getFiscalYear(new Date('2024-12-31'))).toBe(2024);
    });

    it('should return correct fiscal year for January-March', () => {
      expect(getFiscalYear(new Date('2024-01-01'))).toBe(2023);
      expect(getFiscalYear(new Date('2024-02-15'))).toBe(2023);
      expect(getFiscalYear(new Date('2024-03-31'))).toBe(2023);
    });

    it('should handle fiscal year boundaries', () => {
      // March 31 is last day of FY2023
      expect(getFiscalYear(new Date('2024-03-31'))).toBe(2023);
      // April 1 is first day of FY2024
      expect(getFiscalYear(new Date('2024-04-01'))).toBe(2024);
    });
  });

  describe('generateFiscalYearInvoiceNumber', () => {
    it('should generate fiscal year invoice number for April-December', () => {
      const invoiceNumber = generateFiscalYearInvoiceNumber(1, new Date('2024-06-15'));
      expect(invoiceNumber).toBe('FY2024-0001');
    });

    it('should generate fiscal year invoice number for January-March', () => {
      const invoiceNumber = generateFiscalYearInvoiceNumber(1, new Date('2024-02-15'));
      expect(invoiceNumber).toBe('FY2023-0001');
    });

    it('should handle sequence numbers correctly', () => {
      expect(generateFiscalYearInvoiceNumber(1, new Date('2024-06-15'))).toBe('FY2024-0001');
      expect(generateFiscalYearInvoiceNumber(99, new Date('2024-06-15'))).toBe('FY2024-0099');
      expect(generateFiscalYearInvoiceNumber(1000, new Date('2024-06-15'))).toBe('FY2024-1000');
    });
  });
});

describe('Japanese Registration Number Validator', () => {
  describe('calculateCheckDigit', () => {
    it('should calculate check digit correctly', () => {
      // Real examples from Japanese National Tax Agency
      expect(calculateCheckDigit('123456789012')).toBe(8); // T1234567890128
      expect(calculateCheckDigit('987654321098')).toBe(7); // T9876543210987
    });

    it('should handle check digit 0', () => {
      // When calculated check digit is 9, it should be 0
      expect(calculateCheckDigit('111111111111')).toBe(0);
    });

    it('should throw error for invalid input length', () => {
      expect(() => calculateCheckDigit('12345')).toThrow('Input must be exactly 12 digits');
      expect(() => calculateCheckDigit('1234567890123')).toThrow('Input must be exactly 12 digits');
    });

    it('should handle various digit combinations', () => {
      expect(calculateCheckDigit('000000000000')).toBe(0);
      expect(calculateCheckDigit('999999999999')).toBe(0);
      expect(calculateCheckDigit('123456789000')).toBe(6);
    });
  });

  describe('isValidFormat', () => {
    it('should validate correct format', () => {
      expect(isValidFormat('T1234567890123')).toBe(true);
      expect(isValidFormat('T0000000000000')).toBe(true);
      expect(isValidFormat('T9999999999999')).toBe(true);
    });

    it('should reject incorrect format', () => {
      expect(isValidFormat('1234567890123')).toBe(false); // Missing T
      expect(isValidFormat('t1234567890123')).toBe(false); // Lowercase t
      expect(isValidFormat('T123456789012')).toBe(false); // Too short
      expect(isValidFormat('T12345678901234')).toBe(false); // Too long
      expect(isValidFormat('T123456789012A')).toBe(false); // Contains letter
      expect(isValidFormat('T123456789012-')).toBe(false); // Contains special char
    });

  });

  describe('isValidCheckDigit', () => {
    it('should validate correct check digits', () => {
      expect(isValidCheckDigit('1234567890128')).toBe(true);
      expect(isValidCheckDigit('9876543210987')).toBe(true);
      expect(isValidCheckDigit('1111111111110')).toBe(true);
    });

    it('should reject incorrect check digits', () => {
      expect(isValidCheckDigit('1234567890127')).toBe(false); // Wrong check digit
      expect(isValidCheckDigit('9876543210988')).toBe(false); // Wrong check digit
    });

    it('should reject invalid length', () => {
      expect(isValidCheckDigit('123456789012')).toBe(false); // Too short
      expect(isValidCheckDigit('12345678901234')).toBe(false); // Too long
    });
  });

  describe('validateRegistrationNumber', () => {
    it('should validate correct registration numbers', () => {
      const result = validateRegistrationNumber('T1234567890128');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.details?.formatValid).toBe(true);
      expect(result.details?.checkDigitValid).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = validateRegistrationNumber('1234567890128');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid format');
      expect(result.details?.formatValid).toBe(false);
    });

    it('should reject invalid check digit', () => {
      const result = validateRegistrationNumber('T1234567890127'); // Wrong check digit
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid check digit');
      expect(result.details?.formatValid).toBe(true);
      expect(result.details?.checkDigitValid).toBe(false);
      expect(result.details?.calculatedCheckDigit).toBe(8);
    });

    it('should handle real-world examples', () => {
      // These should be valid if check digits are correct
      expect(validateRegistrationNumber('T1234567890128').valid).toBe(true);
      expect(validateRegistrationNumber('T9876543210987').valid).toBe(true);
    });
  });

  describe('parseRegistrationNumber', () => {
    it('should parse valid registration number', () => {
      const result = parseRegistrationNumber('T1234567890128');
      expect(result.value).toBe('T1234567890128');
      expect(result.corporateNumber).toBe('1234567890128');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should parse invalid registration number', () => {
      const result = parseRegistrationNumber('T1234567890127');
      expect(result.value).toBe('T1234567890127');
      expect(result.corporateNumber).toBe('1234567890127');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed input', () => {
      const result = parseRegistrationNumber('INVALID');
      expect(result.isValid).toBe(false);
      expect(result.corporateNumber).toBe('');
    });
  });

  describe('generateRegistrationNumber', () => {
    it('should generate valid registration number from 12 digits', () => {
      const regNumber = generateRegistrationNumber('123456789012');
      expect(regNumber).toBe('T1234567890128');
      expect(validateRegistrationNumber(regNumber).valid).toBe(true);
    });

    it('should generate different registration numbers', () => {
      expect(generateRegistrationNumber('987654321098')).toBe('T9876543210987');
      expect(generateRegistrationNumber('111111111111')).toBe('T1111111111110');
      expect(generateRegistrationNumber('000000000000')).toBe('T0000000000000');
    });

    it('should throw error for invalid input', () => {
      expect(() => generateRegistrationNumber('12345')).toThrow('must be exactly 12 numeric digits');
      expect(() => generateRegistrationNumber('12345678901A')).toThrow(
        'must be exactly 12 numeric digits',
      );
      expect(() => generateRegistrationNumber('1234567890123')).toThrow(
        'must be exactly 12 numeric digits',
      );
    });
  });

  describe('formatRegistrationNumber', () => {
    it('should format valid registration number', () => {
      const formatted = formatRegistrationNumber('T1234567890128');
      expect(formatted).toBe('T 1234 5678 9012 8');
    });

    it('should format different registration numbers', () => {
      expect(formatRegistrationNumber('T9876543210987')).toBe('T 9876 5432 1098 7');
      expect(formatRegistrationNumber('T0000000000000')).toBe('T 0000 0000 0000 0');
    });

    it('should return unformatted string for invalid input', () => {
      expect(formatRegistrationNumber('INVALID')).toBe('INVALID');
      expect(formatRegistrationNumber('T123456789012')).toBe('T123456789012');
    });
  });

  describe('Integration tests', () => {
    it('should support full workflow: generate -> validate -> format', () => {
      // Generate registration number
      const regNumber = generateRegistrationNumber('123456789012');
      expect(regNumber).toBe('T1234567890128');

      // Validate
      const validation = validateRegistrationNumber(regNumber);
      expect(validation.valid).toBe(true);

      // Parse
      const parsed = parseRegistrationNumber(regNumber);
      expect(parsed.isValid).toBe(true);
      expect(parsed.corporateNumber).toBe('1234567890128');

      // Format
      const formatted = formatRegistrationNumber(regNumber);
      expect(formatted).toBe('T 1234 5678 9012 8');
    });

    it('should handle invalid numbers throughout workflow', () => {
      const invalidNumber = 'T1234567890127'; // Wrong check digit

      // Validate should fail
      const validation = validateRegistrationNumber(invalidNumber);
      expect(validation.valid).toBe(false);

      // Parse should indicate invalid
      const parsed = parseRegistrationNumber(invalidNumber);
      expect(parsed.isValid).toBe(false);

      // Format should still work (formatting doesn't validate)
      const formatted = formatRegistrationNumber(invalidNumber);
      expect(formatted).toBe('T 1234 5678 9012 7');
    });
  });
});
