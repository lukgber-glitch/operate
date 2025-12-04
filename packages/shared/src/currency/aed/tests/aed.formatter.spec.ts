/**
 * AED Formatter Tests
 */

import {
  formatAED,
  parseAED,
  formatAEDCompact,
  formatAEDInWords,
  validateAEDAmount,
} from '../aed.formatter';
import { AED_CONSTANTS } from '../aed.constants';

describe('AED Formatter', () => {
  describe('formatAED - Standard Format', () => {
    it('should format basic amounts with symbol', () => {
      expect(formatAED(1234.56)).toBe('1,234.56 د.إ');
      expect(formatAED(1000)).toBe('1,000.00 د.إ');
      expect(formatAED(100)).toBe('100.00 د.إ');
    });

    it('should format zero correctly', () => {
      expect(formatAED(0)).toBe('0.00 د.إ');
    });

    it('should format negative amounts', () => {
      const result = formatAED(-1234.56);
      expect(result).toContain('-');
      expect(result).toContain('1,234.56');
    });

    it('should format large amounts correctly', () => {
      expect(formatAED(1000000)).toContain('1,000,000');
      expect(formatAED(100000000)).toContain('100,000,000');
    });

    it('should format without symbol when requested', () => {
      const result = formatAED(1234.56, { includeSymbol: false });
      expect(result).not.toContain('د.إ');
      expect(result).toContain('1,234.56');
    });

    it('should use alternative symbol when requested', () => {
      const result = formatAED(1234.56, { useAlternativeSymbol: true });
      expect(result).toContain('AED');
      expect(result).not.toContain('د.إ');
    });

    it('should respect decimal places option', () => {
      expect(formatAED(1234.567, { decimals: 3 })).toContain('1,234.567');
      expect(formatAED(1234.5, { decimals: 0 })).toContain('1,235');
    });
  });

  describe('formatAED - Arabic Numerals', () => {
    it('should format with Arabic numerals', () => {
      const result = formatAED(1234.56, { useArabicNumerals: true });
      expect(result).toContain('١');
      expect(result).toContain('٢');
      expect(result).toContain('٣');
      expect(result).toContain('٤');
      expect(result).toContain('٥');
      expect(result).toContain('٦');
    });

    it('should format zero with Arabic numerals', () => {
      const result = formatAED(0, { useArabicNumerals: true });
      expect(result).toContain('٠');
    });

    it('should handle all digits in Arabic', () => {
      const result = formatAED(9876543210.12, { useArabicNumerals: true });
      expect(result).toMatch(/[٠-٩]/);
      expect(result).not.toMatch(/[0-9]/);
    });
  });

  describe('parseAED - Standard Format', () => {
    it('should parse standard formatted amounts', () => {
      expect(parseAED('1,234.56 د.إ')).toBe(1234.56);
      expect(parseAED('1,000.00 د.إ')).toBe(1000);
      expect(parseAED('100.00 د.إ')).toBe(100);
    });

    it('should parse amounts without symbols', () => {
      expect(parseAED('1,234.56')).toBe(1234.56);
      expect(parseAED('1000')).toBe(1000);
    });

    it('should parse amounts with alternative symbol', () => {
      expect(parseAED('1,234.56 AED')).toBe(1234.56);
      expect(parseAED('1234.56AED')).toBe(1234.56);
    });

    it('should parse negative amounts', () => {
      expect(parseAED('-1,234.56 د.إ')).toBe(-1234.56);
      expect(parseAED('-1000')).toBe(-1000);
    });

    it('should handle zero', () => {
      expect(parseAED('0.00 د.إ')).toBe(0);
      expect(parseAED('0')).toBe(0);
    });

    it('should handle empty or invalid strings', () => {
      expect(parseAED('')).toBe(0);
      expect(parseAED('   ')).toBe(0);
    });

    it('should parse amounts with spaces', () => {
      expect(parseAED('1,234.56 د.إ')).toBe(1234.56);
      expect(parseAED('1 234.56')).toBe(1234.56);
    });
  });

  describe('parseAED - Arabic Numerals', () => {
    it('should parse Arabic numeral amounts', () => {
      expect(parseAED('١٬٢٣٤٫٥٦ د.إ')).toBe(1234.56);
      expect(parseAED('١٬٠٠٠٫٠٠ د.إ')).toBe(1000);
    });

    it('should parse mixed Arabic and Western numerals', () => {
      // In practice this shouldn't happen, but should handle gracefully
      const result = parseAED('١234.56 د.إ');
      expect(result).toBe(1234.56);
    });

    it('should handle Arabic decimal separator', () => {
      expect(parseAED('١٢٣٤٫٥٦')).toBe(1234.56);
    });
  });

  describe('formatAEDCompact', () => {
    it('should format in compact notation', () => {
      const result = formatAEDCompact(1234567);
      expect(result).toMatch(/M/);
      expect(result).toContain('د.إ');
    });

    it('should format large amounts', () => {
      const result = formatAEDCompact(1000000000);
      expect(result).toMatch(/B/);
    });

    it('should handle zero', () => {
      const result = formatAEDCompact(0);
      expect(result).toContain('0');
    });

    it('should support Arabic numerals in compact form', () => {
      const result = formatAEDCompact(1234567, 'en-AE', true);
      expect(result).toMatch(/[٠-٩]/);
    });
  });

  describe('formatAEDInWords - Arabic', () => {
    it('should convert basic amounts to Arabic words', () => {
      const result = formatAEDInWords(1, 'ar');
      expect(result).toContain('واحد');
      expect(result).toContain(AED_CONSTANTS.nameArabic);
    });

    it('should handle zero in Arabic', () => {
      const result = formatAEDInWords(0, 'ar');
      expect(result).toContain('صفر');
    });

    it('should handle amounts with decimals', () => {
      const result = formatAEDInWords(1234.56, 'ar');
      expect(result).toContain(AED_CONSTANTS.nameArabic);
      expect(result).toContain(AED_CONSTANTS.minorUnit.nameArabic);
    });

    it('should handle large amounts', () => {
      const result = formatAEDInWords(1000000, 'ar');
      expect(result).toContain('مليون');
    });

    it('should handle thousands', () => {
      const result = formatAEDInWords(5000, 'ar');
      expect(result).toContain('آلاف');
    });
  });

  describe('formatAEDInWords - English', () => {
    it('should convert basic amounts to English words', () => {
      const result = formatAEDInWords(1, 'en');
      expect(result).toContain('one');
      expect(result).toContain('UAE Dirham');
    });

    it('should handle zero in English', () => {
      const result = formatAEDInWords(0, 'en');
      expect(result).toContain('zero');
    });

    it('should handle amounts with decimals', () => {
      const result = formatAEDInWords(1234.56, 'en');
      expect(result).toContain('dirhams');
      expect(result).toContain('fils');
    });

    it('should handle large amounts', () => {
      const result = formatAEDInWords(1000000, 'en');
      expect(result).toContain('million');
    });

    it('should handle plural correctly', () => {
      const result = formatAEDInWords(2, 'en');
      expect(result).toContain('dirhams');
    });
  });

  describe('validateAEDAmount', () => {
    it('should validate valid amounts', () => {
      const result = validateAEDAmount(1234.56);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject NaN', () => {
      const result = validateAEDAmount(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    it('should reject Infinity', () => {
      const result = validateAEDAmount(Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('finite');
    });

    it('should reject too many decimal places', () => {
      const result = validateAEDAmount(1234.567);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('decimal places');
    });

    it('should accept negative amounts', () => {
      const result = validateAEDAmount(-1234.56);
      expect(result.valid).toBe(true);
    });

    it('should accept zero', () => {
      const result = validateAEDAmount(0);
      expect(result.valid).toBe(true);
    });

    it('should accept amounts with exactly 2 decimal places', () => {
      const result = validateAEDAmount(1234.56);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large amounts', () => {
      const largeAmount = 999999999.99;
      const formatted = formatAED(largeAmount);
      expect(formatted).toContain('999,999,999.99');

      const parsed = parseAED(formatted);
      expect(parsed).toBeCloseTo(largeAmount, 2);
    });

    it('should handle very small amounts', () => {
      expect(formatAED(0.01)).toContain('0.01');
      expect(parseAED('0.01 د.إ')).toBe(0.01);
    });

    it('should round-trip format and parse', () => {
      const testAmounts = [0, 0.01, 100, 1234.56, 1000000];

      testAmounts.forEach((amount) => {
        const formatted = formatAED(amount);
        const parsed = parseAED(formatted);
        expect(parsed).toBeCloseTo(amount, 2);
      });
    });

    it('should round-trip with Arabic numerals', () => {
      const testAmounts = [100, 1234.56, 10000];

      testAmounts.forEach((amount) => {
        const formatted = formatAED(amount, { useArabicNumerals: true });
        const parsed = parseAED(formatted);
        expect(parsed).toBeCloseTo(amount, 2);
      });
    });
  });

  describe('Constants Validation', () => {
    it('should have correct AED constants', () => {
      expect(AED_CONSTANTS.code).toBe('AED');
      expect(AED_CONSTANTS.symbol).toBe('د.إ');
      expect(AED_CONSTANTS.decimalDigits).toBe(2);
      expect(AED_CONSTANTS.symbolPosition).toBe('suffix');
    });

    it('should have correct pegged rate', () => {
      expect(AED_CONSTANTS.peggedTo).toBe('USD');
      expect(AED_CONSTANTS.peggedRate).toBe(3.6725);
      expect(AED_CONSTANTS.isPegged).toBe(true);
    });

    it('should have correct minor unit', () => {
      expect(AED_CONSTANTS.minorUnit.name).toBe('Fils');
      expect(AED_CONSTANTS.minorUnit.ratio).toBe(100);
    });

    it('should have correct ISO numeric code', () => {
      expect(AED_CONSTANTS.numericCode).toBe(784);
    });
  });

  describe('Locale Support', () => {
    it('should format with en-AE locale', () => {
      const result = formatAED(1234.56, { locale: 'en-AE' });
      expect(result).toContain('1,234.56');
    });

    it('should format with ar-AE locale', () => {
      const result = formatAED(1234.56, { locale: 'ar-AE' });
      expect(result).toBeTruthy();
    });
  });

  describe('Pegged Currency Conversion', () => {
    it('should convert USD to AED using pegged rate', () => {
      const usd = 1000;
      const aed = usd * AED_CONSTANTS.peggedRate;
      expect(aed).toBe(3672.5);
      expect(formatAED(aed)).toContain('3,672.50');
    });

    it('should convert AED to USD using pegged rate', () => {
      const aed = 3672.5;
      const usd = aed / AED_CONSTANTS.peggedRate;
      expect(usd).toBeCloseTo(1000, 2);
    });
  });
});
