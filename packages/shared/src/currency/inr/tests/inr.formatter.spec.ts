/**
 * INR Currency Formatter Tests
 * Comprehensive test suite for Indian Rupee formatting
 */

import {
  formatINR,
  parseINR,
  formatINRCompact,
  validateINRAmount,
  formatINRInWords,
  formatIndianNumber,
  getAmountInLakhs,
  getAmountInCrores,
  formatINRWithUnit,
} from '../inr.formatter';
import { INR_CONSTANTS } from '../inr.constants';

describe('INR Formatter', () => {
  describe('formatIndianNumber', () => {
    it('should format numbers with Indian numbering system', () => {
      expect(formatIndianNumber(1000, 2)).toBe('1,000.00');
      expect(formatIndianNumber(10000, 2)).toBe('10,000.00');
      expect(formatIndianNumber(100000, 2)).toBe('1,00,000.00'); // 1 lakh
      expect(formatIndianNumber(1000000, 2)).toBe('10,00,000.00'); // 10 lakhs
      expect(formatIndianNumber(10000000, 2)).toBe('1,00,00,000.00'); // 1 crore
      expect(formatIndianNumber(100000000, 2)).toBe('10,00,00,000.00'); // 10 crores
    });

    it('should handle zero', () => {
      expect(formatIndianNumber(0, 2)).toBe('0.00');
    });

    it('should handle small amounts', () => {
      expect(formatIndianNumber(1, 2)).toBe('1.00');
      expect(formatIndianNumber(99, 2)).toBe('99.00');
      expect(formatIndianNumber(999, 2)).toBe('999.00');
    });

    it('should handle different decimal places', () => {
      expect(formatIndianNumber(100000, 0)).toBe('1,00,000');
      expect(formatIndianNumber(100000, 1)).toBe('1,00,000.0');
      expect(formatIndianNumber(100000, 3)).toBe('1,00,000.000');
    });

    it('should format large numbers correctly', () => {
      expect(formatIndianNumber(12345678, 2)).toBe('1,23,45,678.00');
      expect(formatIndianNumber(123456789, 2)).toBe('12,34,56,789.00');
      expect(formatIndianNumber(1234567890, 2)).toBe('1,23,45,67,890.00');
    });
  });

  describe('formatINR', () => {
    it('should format basic amounts with symbol', () => {
      expect(formatINR(1000)).toBe('₹1,000.00');
      expect(formatINR(100000)).toBe('₹1,00,000.00');
      expect(formatINR(10000000)).toBe('₹1,00,00,000.00');
    });

    it('should handle negative amounts', () => {
      expect(formatINR(-1000)).toBe('₹-1,000.00');
      expect(formatINR(-100000)).toBe('₹-1,00,000.00');
    });

    it('should format without symbol when requested', () => {
      expect(formatINR(100000, { includeSymbol: false })).toBe('1,00,000.00');
    });

    it('should use alternative symbol when requested', () => {
      expect(formatINR(100000, { useAlternativeSymbol: true })).toBe('Rs.1,00,000.00');
    });

    it('should handle different decimal places', () => {
      expect(formatINR(100000, { decimals: 0 })).toBe('₹1,00,000');
      expect(formatINR(100000, { decimals: 1 })).toBe('₹1,00,000.0');
      expect(formatINR(100000.567, { decimals: 2 })).toBe('₹1,00,000.57');
    });

    it('should format with Devanagari numerals', () => {
      const result = formatINR(100000, { useDevanagariNumerals: true });
      expect(result).toBe('₹१,००,०००.००');
    });

    it('should handle zero', () => {
      expect(formatINR(0)).toBe('₹0.00');
    });

    it('should handle decimal amounts', () => {
      expect(formatINR(1234.56)).toBe('₹1,234.56');
      expect(formatINR(100000.99)).toBe('₹1,00,000.99');
    });
  });

  describe('parseINR', () => {
    it('should parse formatted INR strings', () => {
      expect(parseINR('₹1,000.00')).toBe(1000);
      expect(parseINR('₹1,00,000.00')).toBe(100000);
      expect(parseINR('₹1,00,00,000.00')).toBe(10000000);
    });

    it('should handle negative amounts', () => {
      expect(parseINR('-₹1,000.00')).toBe(-1000);
      expect(parseINR('₹-1,000.00')).toBe(-1000);
    });

    it('should parse amounts with alternative symbol', () => {
      expect(parseINR('Rs.1,000.00')).toBe(1000);
      expect(parseINR('Rs. 1,00,000')).toBe(100000);
      expect(parseINR('INR 1,00,000')).toBe(100000);
    });

    it('should handle amounts without symbol', () => {
      expect(parseINR('1,000.00')).toBe(1000);
      expect(parseINR('1,00,000')).toBe(100000);
    });

    it('should handle Devanagari numerals', () => {
      expect(parseINR('₹१,०००.००')).toBe(1000);
      expect(parseINR('₹१,००,०००')).toBe(100000);
    });

    it('should return 0 for empty or invalid strings', () => {
      expect(parseINR('')).toBe(0);
      expect(parseINR('   ')).toBe(0);
      expect(parseINR('invalid')).toBe(0);
    });

    it('should handle amounts without separators', () => {
      expect(parseINR('1000')).toBe(1000);
      expect(parseINR('100000')).toBe(100000);
    });

    it('should handle decimal amounts', () => {
      expect(parseINR('₹1,234.56')).toBe(1234.56);
      expect(parseINR('₹1,00,000.99')).toBe(100000.99);
    });
  });

  describe('formatINRCompact', () => {
    it('should format amounts in lakhs', () => {
      expect(formatINRCompact(100000)).toBe('₹1.0L');
      expect(formatINRCompact(150000)).toBe('₹1.5L');
      expect(formatINRCompact(1000000)).toBe('₹10.0L');
      expect(formatINRCompact(9900000)).toBe('₹99.0L');
    });

    it('should format amounts in crores', () => {
      expect(formatINRCompact(10000000)).toBe('₹1.0Cr');
      expect(formatINRCompact(15000000)).toBe('₹1.5Cr');
      expect(formatINRCompact(100000000)).toBe('₹10Cr');
      expect(formatINRCompact(250000000)).toBe('₹25Cr');
    });

    it('should format amounts in thousands', () => {
      expect(formatINRCompact(1000)).toBe('₹1.0K');
      expect(formatINRCompact(50000)).toBe('₹50.0K');
      expect(formatINRCompact(99000)).toBe('₹99.0K');
    });

    it('should format small amounts without suffix', () => {
      expect(formatINRCompact(100)).toBe('₹100');
      expect(formatINRCompact(999)).toBe('₹999');
    });

    it('should handle negative amounts', () => {
      expect(formatINRCompact(-100000)).toBe('-₹1.0L');
      expect(formatINRCompact(-10000000)).toBe('-₹1.0Cr');
    });

    it('should format with Devanagari numerals', () => {
      expect(formatINRCompact(100000, true)).toBe('₹१.०L');
      expect(formatINRCompact(10000000, true)).toBe('₹१.०Cr');
    });

    it('should handle large crore amounts', () => {
      expect(formatINRCompact(1000000000)).toBe('₹100Cr');
      expect(formatINRCompact(10000000000)).toBe('₹1000Cr');
    });
  });

  describe('validateINRAmount', () => {
    it('should validate valid amounts', () => {
      expect(validateINRAmount(100)).toEqual({ valid: true });
      expect(validateINRAmount(1234.56)).toEqual({ valid: true });
      expect(validateINRAmount(0)).toEqual({ valid: true });
      expect(validateINRAmount(10000000)).toEqual({ valid: true });
    });

    it('should reject NaN', () => {
      const result = validateINRAmount(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    it('should reject Infinity', () => {
      const result = validateINRAmount(Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('finite');
    });

    it('should reject amounts with too many decimal places', () => {
      const result = validateINRAmount(123.456);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('decimal places');
    });

    it('should accept negative amounts', () => {
      expect(validateINRAmount(-100)).toEqual({ valid: true });
    });

    it('should accept amounts with 1 decimal place', () => {
      expect(validateINRAmount(123.5)).toEqual({ valid: true });
    });
  });

  describe('formatINRInWords - English', () => {
    it('should format small amounts', () => {
      expect(formatINRInWords(0, 'en')).toBe('Zero Indian Rupees Only');
      expect(formatINRInWords(1, 'en')).toBe('One Indian Rupee Only');
      expect(formatINRInWords(99, 'en')).toBe('Ninety-nine Indian Rupees Only');
    });

    it('should format hundreds', () => {
      expect(formatINRInWords(100, 'en')).toBe('One hundred Indian Rupees Only');
      expect(formatINRInWords(999, 'en')).toBe('Nine hundred ninety-nine Indian Rupees Only');
    });

    it('should format thousands', () => {
      expect(formatINRInWords(1000, 'en')).toBe('One thousand Indian Rupees Only');
      expect(formatINRInWords(5000, 'en')).toBe('Five thousand Indian Rupees Only');
      expect(formatINRInWords(99999, 'en')).toBe('Ninety-nine thousand nine hundred ninety-nine Indian Rupees Only');
    });

    it('should format lakhs', () => {
      expect(formatINRInWords(100000, 'en')).toBe('One lakh Indian Rupees Only');
      expect(formatINRInWords(500000, 'en')).toBe('Five lakh Indian Rupees Only');
      expect(formatINRInWords(999999, 'en')).toBe('Nine lakh ninety-nine thousand nine hundred ninety-nine Indian Rupees Only');
    });

    it('should format crores', () => {
      expect(formatINRInWords(10000000, 'en')).toBe('One crore Indian Rupees Only');
      expect(formatINRInWords(50000000, 'en')).toBe('Five crore Indian Rupees Only');
    });

    it('should format with paise', () => {
      expect(formatINRInWords(100.50, 'en')).toBe('One hundred Indian Rupees and Fifty Paise Only');
      expect(formatINRInWords(1000.99, 'en')).toBe('One thousand Indian Rupees and Ninety-nine Paise Only');
      expect(formatINRInWords(100000.01, 'en')).toBe('One lakh Indian Rupees and One Paisa Only');
    });

    it('should handle negative amounts', () => {
      expect(formatINRInWords(-100, 'en')).toBe('Negative One hundred Indian Rupees Only');
      expect(formatINRInWords(-1000.50, 'en')).toBe('Negative One thousand Indian Rupees and Fifty Paise Only');
    });

    it('should format complex amounts', () => {
      expect(formatINRInWords(123456.78, 'en')).toBe('One lakh twenty-three thousand four hundred fifty-six Indian Rupees and Seventy-eight Paise Only');
    });
  });

  describe('formatINRInWords - Hindi', () => {
    it('should format small amounts in Hindi', () => {
      expect(formatINRInWords(0, 'hi')).toBe('शून्य रुपये मात्र');
      expect(formatINRInWords(1, 'hi')).toContain('रुपये');
      expect(formatINRInWords(99, 'hi')).toContain('रुपये मात्र');
    });

    it('should format thousands in Hindi', () => {
      expect(formatINRInWords(1000, 'hi')).toContain('हज़ार');
      expect(formatINRInWords(5000, 'hi')).toContain('रुपये मात्र');
    });

    it('should format lakhs in Hindi', () => {
      expect(formatINRInWords(100000, 'hi')).toContain('लाख');
      expect(formatINRInWords(500000, 'hi')).toContain('लाख');
    });

    it('should format crores in Hindi', () => {
      expect(formatINRInWords(10000000, 'hi')).toContain('करोड़');
    });

    it('should format with paise in Hindi', () => {
      const result = formatINRInWords(100.50, 'hi');
      expect(result).toContain('और');
      expect(result).toContain('पैसे');
    });

    it('should handle negative amounts in Hindi', () => {
      expect(formatINRInWords(-100, 'hi')).toContain('ऋण');
    });
  });

  describe('getAmountInLakhs', () => {
    it('should convert amounts to lakhs', () => {
      expect(getAmountInLakhs(100000)).toBe(1);
      expect(getAmountInLakhs(500000)).toBe(5);
      expect(getAmountInLakhs(150000)).toBe(1.5);
      expect(getAmountInLakhs(1000000)).toBe(10);
    });

    it('should handle small amounts', () => {
      expect(getAmountInLakhs(50000)).toBe(0.5);
      expect(getAmountInLakhs(10000)).toBe(0.1);
    });

    it('should handle zero', () => {
      expect(getAmountInLakhs(0)).toBe(0);
    });
  });

  describe('getAmountInCrores', () => {
    it('should convert amounts to crores', () => {
      expect(getAmountInCrores(10000000)).toBe(1);
      expect(getAmountInCrores(50000000)).toBe(5);
      expect(getAmountInCrores(15000000)).toBe(1.5);
      expect(getAmountInCrores(100000000)).toBe(10);
    });

    it('should handle small amounts', () => {
      expect(getAmountInCrores(5000000)).toBe(0.5);
      expect(getAmountInCrores(1000000)).toBe(0.1);
    });

    it('should handle zero', () => {
      expect(getAmountInCrores(0)).toBe(0);
    });
  });

  describe('formatINRWithUnit', () => {
    it('should format amounts in crores with unit', () => {
      expect(formatINRWithUnit(10000000)).toBe('₹1.00 Crore');
      expect(formatINRWithUnit(50000000)).toBe('₹5.00 Crores');
      expect(formatINRWithUnit(15000000)).toBe('₹1.50 Crores');
    });

    it('should format amounts in lakhs with unit', () => {
      expect(formatINRWithUnit(100000)).toBe('₹1.00 Lakh');
      expect(formatINRWithUnit(500000)).toBe('₹5.00 Lakhs');
      expect(formatINRWithUnit(9900000)).toBe('₹99.00 Lakhs');
    });

    it('should format small amounts without unit', () => {
      expect(formatINRWithUnit(50000)).toBe('₹50,000.00');
      expect(formatINRWithUnit(1000)).toBe('₹1,000.00');
    });

    it('should handle different decimal places', () => {
      expect(formatINRWithUnit(10000000, 1)).toBe('₹1.0 Crore');
      expect(formatINRWithUnit(100000, 0)).toBe('₹1 Lakh');
    });

    it('should handle singular vs plural', () => {
      expect(formatINRWithUnit(10000000, 2)).toBe('₹1.00 Crore');
      expect(formatINRWithUnit(20000000, 2)).toBe('₹2.00 Crores');
      expect(formatINRWithUnit(100000, 2)).toBe('₹1.00 Lakh');
      expect(formatINRWithUnit(200000, 2)).toBe('₹2.00 Lakhs');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers', () => {
      const billion = 1000000000; // 100 crores
      expect(formatINR(billion)).toBe('₹1,00,00,00,000.00');
      expect(formatINRCompact(billion)).toBe('₹100Cr');
    });

    it('should handle very small decimal amounts', () => {
      expect(formatINR(0.01)).toBe('₹0.01');
      expect(formatINR(0.99)).toBe('₹0.99');
    });

    it('should handle rounding correctly', () => {
      expect(formatINR(123.456, { decimals: 2 })).toBe('₹123.46');
      expect(formatINR(123.454, { decimals: 2 })).toBe('₹123.45');
    });
  });

  describe('Constants validation', () => {
    it('should have correct INR constants', () => {
      expect(INR_CONSTANTS.code).toBe('INR');
      expect(INR_CONSTANTS.symbol).toBe('₹');
      expect(INR_CONSTANTS.numericCode).toBe(356);
      expect(INR_CONSTANTS.decimalDigits).toBe(2);
      expect(INR_CONSTANTS.minorUnit.ratio).toBe(100);
    });

    it('should have correct unit values', () => {
      expect(INR_CONSTANTS.units.lakh.value).toBe(100000);
      expect(INR_CONSTANTS.units.crore.value).toBe(10000000);
      expect(INR_CONSTANTS.units.thousand.value).toBe(1000);
    });
  });
});
