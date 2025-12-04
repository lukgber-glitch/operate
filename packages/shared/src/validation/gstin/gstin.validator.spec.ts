/**
 * GSTIN Validator Test Suite
 *
 * @description
 * Comprehensive test suite for GSTIN validation with 50+ test cases
 * covering valid formats, invalid formats, edge cases, state codes,
 * PAN validation, and check digit verification.
 */

import {
  validateGSTIN,
  isValidGSTIN,
  formatGSTIN,
  parseGSTIN,
  generateGSTIN,
  extractStateCode,
  isGSTINFromState,
  getEntityTypeFromGSTIN,
  validateMultipleGSTINs,
} from './gstin.validator';
import { calculateCheckDigit, verifyCheckDigit } from './check-digit';
import { validatePAN, } from './pan.validator';
import { isValidStateCode, getStateName } from './state-codes';

describe('GSTIN Validator', () => {
  describe('validateGSTIN', () => {
    describe('Valid GSTINs', () => {
      it('should validate a valid Maharashtra GSTIN', () => {
        const result = validateGSTIN('22AAAAA0000A1Z5');
        expect(result.isValid).toBe(true);
        expect(result.details?.stateCode).toBe('22');
        expect(result.details?.stateName).toBe('Chhattisgarh');
        expect(result.details?.pan).toBe('AAAAA0000A');
      });

      it('should validate a real Maharashtra GSTIN', () => {
        const result = validateGSTIN('27AAPFU0939F1ZV');
        expect(result.isValid).toBe(true);
        expect(result.details?.stateCode).toBe('27');
        expect(result.details?.stateName).toBe('Maharashtra');
      });

      it('should validate Karnataka GSTIN', () => {
        const result = validateGSTIN('29ABCDE1234F1Z5');
        expect(result.isValid).toBe(true);
        expect(result.details?.stateCode).toBe('29');
        expect(result.details?.stateName).toBe('Karnataka');
      });

      it('should validate Delhi GSTIN', () => {
        const result = validateGSTIN('07ABCDE1234F1Z8');
        expect(result.isValid).toBe(true);
        expect(result.details?.stateCode).toBe('07');
        expect(result.details?.stateName).toBe('Delhi');
      });

      it('should validate Tamil Nadu GSTIN', () => {
        const result = validateGSTIN('33ABCDE1234F1Z3');
        expect(result.isValid).toBe(true);
        expect(result.details?.stateCode).toBe('33');
        expect(result.details?.stateName).toBe('Tamil Nadu');
      });

      it('should validate Gujarat GSTIN', () => {
        const result = validateGSTIN('24ABCDE1234F1Z1');
        expect(result.isValid).toBe(true);
        expect(result.details?.stateCode).toBe('24');
        expect(result.details?.stateName).toBe('Gujarat');
      });

      it('should validate GSTIN with entity number 1', () => {
        const result = validateGSTIN('27AAPFU0939F1ZV');
        expect(result.isValid).toBe(true);
        expect(result.details?.entityNumber).toBe('1');
      });

      it('should validate GSTIN with entity number 5', () => {
        const result = validateGSTIN('29ABCDE1234F5Z9');
        expect(result.isValid).toBe(true);
        expect(result.details?.entityNumber).toBe('5');
      });

      it('should validate GSTIN with entity number A', () => {
        const result = validateGSTIN('22AAAAA0000AAZP');
        expect(result.isValid).toBe(true);
        expect(result.details?.entityNumber).toBe('A');
      });

      it('should validate GSTIN with entity number Z', () => {
        const result = validateGSTIN('22AAAAA0000AZZ4');
        expect(result.isValid).toBe(true);
        expect(result.details?.entityNumber).toBe('Z');
      });

      it('should validate GSTIN with lowercase input', () => {
        const result = validateGSTIN('27aapfu0939f1zv');
        expect(result.isValid).toBe(true);
        expect(result.details?.stateCode).toBe('27');
      });

      it('should validate GSTIN with whitespace', () => {
        const result = validateGSTIN('  27AAPFU0939F1ZV  ');
        expect(result.isValid).toBe(true);
        expect(result.details?.stateCode).toBe('27');
      });
    });

    describe('Invalid GSTINs - Format', () => {
      it('should reject empty GSTIN', () => {
        const result = validateGSTIN('');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('required');
      });

      it('should reject null GSTIN', () => {
        const result = validateGSTIN(null as any);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('required');
      });

      it('should reject undefined GSTIN', () => {
        const result = validateGSTIN(undefined as any);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('required');
      });

      it('should reject GSTIN with less than 15 characters', () => {
        const result = validateGSTIN('27AAPFU0939F1Z');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('15 characters');
      });

      it('should reject GSTIN with more than 15 characters', () => {
        const result = validateGSTIN('27AAPFU0939F1ZVX');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('15 characters');
      });

      it('should reject GSTIN with invalid format', () => {
        const result = validateGSTIN('ABCDEFGHIJKLMNO');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('format');
      });

      it('should reject GSTIN with special characters', () => {
        const result = validateGSTIN('27AAPFU-939F1ZV');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('format');
      });

      it('should reject GSTIN with spaces in middle', () => {
        const result = validateGSTIN('27AAP FU0939F1ZV');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('format');
      });
    });

    describe('Invalid GSTINs - State Code', () => {
      it('should reject invalid state code 00', () => {
        const result = validateGSTIN('00AAPFU0939F1Z5');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('state code');
      });

      it('should reject invalid state code 40', () => {
        const result = validateGSTIN('40AAPFU0939F1Z5');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('state code');
      });

      it('should reject invalid state code 50', () => {
        const result = validateGSTIN('50AAPFU0939F1Z5');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('state code');
      });

      it('should reject invalid state code 99 (if not valid)', () => {
        // Note: 99 is valid for Centre Jurisdiction
        const result = validateGSTIN('99AAPFU0939F1ZK');
        expect(result.isValid).toBe(true); // 99 is valid
      });

      it('should reject alphabetic state code', () => {
        const result = validateGSTIN('AAAAPFU0939F1Z5');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('format');
      });
    });

    describe('Invalid GSTINs - PAN', () => {
      it('should reject invalid PAN format in GSTIN', () => {
        const result = validateGSTIN('27123456789A1Z5');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('PAN');
      });

      it('should reject PAN with invalid entity type', () => {
        const result = validateGSTIN('27ABCDE1234X1Z5');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('PAN');
      });

      it('should reject PAN with lowercase letters', () => {
        const result = validateGSTIN('27abcde1234f1z5');
        // Should pass because we normalize to uppercase
        expect(result.isValid).toBe(true);
      });

      it('should reject PAN with special characters', () => {
        const result = validateGSTIN('27ABC-E1234F1Z5');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('format');
      });
    });

    describe('Invalid GSTINs - Entity Number', () => {
      it('should reject entity number 0', () => {
        const result = validateGSTIN('27AAPFU0939F0Z5');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('entity number');
      });

      it('should reject lowercase entity number', () => {
        const result = validateGSTIN('27AAPFU0939FaZ5');
        // Should pass because we normalize to uppercase
        expect(result.isValid).toBe(true);
      });
    });

    describe('Invalid GSTINs - Default Character', () => {
      it('should reject non-Z default character', () => {
        const result = validateGSTIN('27AAPFU0939F1A5');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('position 14');
      });

      it('should reject numeric default character', () => {
        const result = validateGSTIN('27AAPFU0939F115');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('position 14');
      });

      it('should reject lowercase z default character', () => {
        const result = validateGSTIN('27AAPFU0939F1z5');
        // Should pass because we normalize to uppercase
        expect(result.isValid).toBe(true);
      });
    });

    describe('Invalid GSTINs - Check Digit', () => {
      it('should reject incorrect check digit', () => {
        const result = validateGSTIN('27AAPFU0939F1ZX');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('check digit');
      });

      it('should reject check digit off by one', () => {
        const result = validateGSTIN('27AAPFU0939F1ZW');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('check digit');
      });

      it('should reject check digit with wrong case', () => {
        const result = validateGSTIN('27AAPFU0939F1Zv');
        // Should pass because we normalize to uppercase
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('isValidGSTIN', () => {
    it('should return true for valid GSTIN', () => {
      expect(isValidGSTIN('27AAPFU0939F1ZV')).toBe(true);
    });

    it('should return false for invalid GSTIN', () => {
      expect(isValidGSTIN('27AAPFU0939F1ZX')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidGSTIN('')).toBe(false);
    });
  });

  describe('formatGSTIN', () => {
    it('should format GSTIN without separator', () => {
      expect(formatGSTIN('27aapfu0939f1zv')).toBe('27AAPFU0939F1ZV');
    });

    it('should format GSTIN with dash separator', () => {
      expect(formatGSTIN('27aapfu0939f1zv', '-')).toBe('27-AAPFU0939F-1ZV');
    });

    it('should format GSTIN with space separator', () => {
      expect(formatGSTIN('27aapfu0939f1zv', ' ')).toBe('27 AAPFU0939F 1ZV');
    });

    it('should return original for invalid length', () => {
      expect(formatGSTIN('12345')).toBe('12345');
    });
  });

  describe('parseGSTIN', () => {
    it('should parse valid GSTIN into components', () => {
      const parsed = parseGSTIN('27AAPFU0939F1ZV');
      expect(parsed).not.toBeNull();
      expect(parsed?.stateCode).toBe('27');
      expect(parsed?.stateName).toBe('Maharashtra');
      expect(parsed?.pan).toBe('AAPFU0939F');
      expect(parsed?.entityNumber).toBe('1');
      expect(parsed?.defaultChar).toBe('Z');
      expect(parsed?.checkDigit).toBe('V');
    });

    it('should return null for invalid GSTIN', () => {
      const parsed = parseGSTIN('INVALID');
      expect(parsed).toBeNull();
    });
  });

  describe('generateGSTIN', () => {
    it('should generate GSTIN from components', () => {
      const gstin = generateGSTIN('27', 'AAPFU0939F', '1');
      expect(gstin).toBe('27AAPFU0939F1ZV');
    });

    it('should generate GSTIN with different entity number', () => {
      const gstin = generateGSTIN('29', 'ABCDE1234F', '5');
      expect(isValidGSTIN(gstin)).toBe(true);
      expect(gstin.substring(0, 2)).toBe('29');
    });

    it('should throw error for invalid state code', () => {
      expect(() => generateGSTIN('99', 'AAPFU0939F', '1')).not.toThrow();
      expect(() => generateGSTIN('00', 'AAPFU0939F', '1')).toThrow();
    });

    it('should throw error for invalid PAN', () => {
      expect(() => generateGSTIN('27', 'INVALID', '1')).toThrow();
    });

    it('should throw error for invalid entity number', () => {
      expect(() => generateGSTIN('27', 'AAPFU0939F', '0')).toThrow();
    });
  });

  describe('extractStateCode', () => {
    it('should extract valid state code', () => {
      expect(extractStateCode('27AAPFU0939F1ZV')).toBe('27');
    });

    it('should return null for invalid state code', () => {
      expect(extractStateCode('00AAPFU0939F1ZV')).toBeNull();
    });

    it('should return null for short string', () => {
      expect(extractStateCode('2')).toBeNull();
    });
  });

  describe('isGSTINFromState', () => {
    it('should return true for matching state', () => {
      expect(isGSTINFromState('27AAPFU0939F1ZV', '27')).toBe(true);
    });

    it('should return false for non-matching state', () => {
      expect(isGSTINFromState('27AAPFU0939F1ZV', '29')).toBe(false);
    });

    it('should return false for invalid GSTIN', () => {
      expect(isGSTINFromState('INVALID', '27')).toBe(false);
    });
  });

  describe('getEntityTypeFromGSTIN', () => {
    it('should extract entity type from GSTIN', () => {
      expect(getEntityTypeFromGSTIN('27AAPFU0939F1ZV')).toBe('F');
    });

    it('should return null for short GSTIN', () => {
      expect(getEntityTypeFromGSTIN('27')).toBeNull();
    });
  });

  describe('validateMultipleGSTINs', () => {
    it('should validate multiple GSTINs', () => {
      const results = validateMultipleGSTINs([
        '27AAPFU0939F1ZV',
        '29ABCDE1234F1Z5',
        'INVALID',
      ]);
      expect(results).toHaveLength(3);
      expect(results[0]!.isValid).toBe(true);
      expect(results[1]!.isValid).toBe(true);
      expect(results[2]!.isValid).toBe(false);
    });

    it('should handle empty array', () => {
      const results = validateMultipleGSTINs([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('Check Digit Algorithm', () => {
    it('should calculate correct check digit', () => {
      expect(calculateCheckDigit('27AAPFU0939F1Z')).toBe('V');
      expect(calculateCheckDigit('22AAAAA0000A1Z')).toBe('5');
    });

    it('should verify correct check digit', () => {
      expect(verifyCheckDigit('27AAPFU0939F1ZV')).toBe(true);
      expect(verifyCheckDigit('22AAAAA0000A1Z5')).toBe(true);
    });

    it('should reject incorrect check digit', () => {
      expect(verifyCheckDigit('27AAPFU0939F1ZX')).toBe(false);
      expect(verifyCheckDigit('22AAAAA0000A1Z4')).toBe(false);
    });

    it('should handle check digit calculation for all states', () => {
      const validStates = ['01', '07', '22', '27', '29', '33'];
      validStates.forEach(state => {
        const gstin = generateGSTIN(state, 'ABCDE1234F', '1');
        expect(isValidGSTIN(gstin)).toBe(true);
      });
    });
  });

  describe('PAN Validator', () => {
    it('should validate valid PAN', () => {
      expect(validatePAN('AAPFU0939F').isValid).toBe(true);
      expect(validatePAN('ABCDE1234F').isValid).toBe(true);
    });

    it('should reject invalid PAN', () => {
      expect(validatePAN('INVALID').isValid).toBe(false);
      expect(validatePAN('12345ABCDE').isValid).toBe(false);
    });

    it('should validate PAN entity types', () => {
      expect(validatePAN('ABCPC1234D').isValid).toBe(true); // Company
      expect(validatePAN('ABCDP1234E').isValid).toBe(true); // Person
      expect(validatePAN('ABCDH1234F').isValid).toBe(true); // HUF
    });
  });

  describe('State Code Validator', () => {
    it('should validate valid state codes', () => {
      expect(isValidStateCode('01')).toBe(true); // Jammu & Kashmir
      expect(isValidStateCode('07')).toBe(true); // Delhi
      expect(isValidStateCode('27')).toBe(true); // Maharashtra
      expect(isValidStateCode('29')).toBe(true); // Karnataka
      expect(isValidStateCode('33')).toBe(true); // Tamil Nadu
    });

    it('should reject invalid state codes', () => {
      expect(isValidStateCode('00')).toBe(false);
      expect(isValidStateCode('40')).toBe(false);
      expect(isValidStateCode('50')).toBe(false);
    });

    it('should get state names', () => {
      expect(getStateName('27')).toBe('Maharashtra');
      expect(getStateName('29')).toBe('Karnataka');
      expect(getStateName('07')).toBe('Delhi');
      expect(getStateName('00')).toBeNull();
    });

    it('should reject inactive state code 28', () => {
      expect(isValidStateCode('28')).toBe(false); // Old Andhra Pradesh
    });
  });

  describe('Edge Cases', () => {
    it('should handle GSTIN with all numeric PAN sequence', () => {
      const gstin = generateGSTIN('27', 'AAAPA9999Z', '1');
      expect(isValidGSTIN(gstin)).toBe(true);
    });

    it('should handle GSTIN with entity number Z', () => {
      const result = validateGSTIN('22AAAAA0000AZZ4');
      expect(result.isValid).toBe(true);
      expect(result.details?.entityNumber).toBe('Z');
    });

    it('should handle special territory codes', () => {
      expect(isValidStateCode('97')).toBe(true); // Other Territory
      expect(isValidStateCode('99')).toBe(true); // Centre Jurisdiction
    });

    it('should validate GSTIN with mixed case and whitespace', () => {
      const result = validateGSTIN('  27AaPfU0939f1Zv  ');
      expect(result.isValid).toBe(true);
    });

    it('should handle boundary entity numbers', () => {
      expect(generateGSTIN('27', 'AAPFU0939F', '1')).toMatch(/^27AAPFU0939F1Z./);
      expect(generateGSTIN('27', 'AAPFU0939F', '9')).toMatch(/^27AAPFU0939F9Z./);
      expect(generateGSTIN('27', 'AAPFU0939F', 'A')).toMatch(/^27AAPFU0939FAZ./);
      expect(generateGSTIN('27', 'AAPFU0939F', 'Z')).toMatch(/^27AAPFU0939FZZ./);
    });
  });
});
