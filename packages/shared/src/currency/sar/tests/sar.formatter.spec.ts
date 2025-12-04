/**
 * SAR Formatter Tests
 */

import {
  formatSAR,
  parseSAR,
  formatSARCompact,
  formatSARInWords,
  validateSARAmount,
} from '../sar.formatter';
import { SAR_CONSTANTS } from '../sar.constants';

describe('SAR Formatter', () => {
  describe('formatSAR - Standard Format', () => {
    it('should format basic amounts with symbol', () => {
      expect(formatSAR(1234.56)).toBe('1,234.56 ر.س');
      expect(formatSAR(1000)).toBe('1,000.00 ر.س');
      expect(formatSAR(100)).toBe('100.00 ر.س');
    });

    it('should format zero correctly', () => {
      expect(formatSAR(0)).toBe('0.00 ر.س');
    });

    it('should format negative amounts', () => {
      const result = formatSAR(-1234.56);
      expect(result).toContain('-');
      expect(result).toContain('1,234.56');
    });

    it('should format large amounts correctly', () => {
      expect(formatSAR(1000000)).toContain('1,000,000');
      expect(formatSAR(100000000)).toContain('100,000,000');
    });

    it('should format without symbol when requested', () => {
      const result = formatSAR(1234.56, { includeSymbol: false });
      expect(result).not.toContain('ر.س');
      expect(result).toContain('1,234.56');
    });

    it('should use alternative symbol when requested', () => {
      const result = formatSAR(1234.56, { useAlternativeSymbol: true });
      expect(result).toContain('SAR');
      expect(result).not.toContain('ر.س');
    });

    it('should respect decimal places option', () => {
      expect(formatSAR(1234.567, { decimals: 3 })).toContain('1,234.567');
      expect(formatSAR(1234.5, { decimals: 0 })).toContain('1,235');
    });
  });

  describe('formatSAR - Arabic Numerals', () => {
    it('should format with Arabic numerals', () => {
      const result = formatSAR(1234.56, { useArabicNumerals: true });
      expect(result).toContain('١');
      expect(result).toContain('٢');
      expect(result).toContain('٣');
      expect(result).toContain('٤');
      expect(result).toContain('٥');
      expect(result).toContain('٦');
    });

    it('should format zero with Arabic numerals', () => {
      const result = formatSAR(0, { useArabicNumerals: true });
      expect(result).toContain('٠');
    });

    it('should handle all digits in Arabic', () => {
      const result = formatSAR(9876543210.12, { useArabicNumerals: true });
      expect(result).toMatch(/[٠-٩]/);
      expect(result).not.toMatch(/[0-9]/);
    });
  });

  describe('parseSAR - Standard Format', () => {
    it('should parse standard formatted amounts', () => {
      expect(parseSAR('1,234.56 ر.س')).toBe(1234.56);
      expect(parseSAR('1,000.00 ر.س')).toBe(1000);
      expect(parseSAR('100.00 ر.س')).toBe(100);
    });

    it('should parse amounts without symbols', () => {
      expect(parseSAR('1,234.56')).toBe(1234.56);
      expect(parseSAR('1000')).toBe(1000);
    });

    it('should parse amounts with alternative symbol', () => {
      expect(parseSAR('1,234.56 SAR')).toBe(1234.56);
      expect(parseSAR('1234.56SAR')).toBe(1234.56);
    });

    it('should parse negative amounts', () => {
      expect(parseSAR('-1,234.56 ر.س')).toBe(-1234.56);
      expect(parseSAR('-1000')).toBe(-1000);
    });

    it('should handle zero', () => {
      expect(parseSAR('0.00 ر.س')).toBe(0);
      expect(parseSAR('0')).toBe(0);
    });

    it('should handle empty or invalid strings', () => {
      expect(parseSAR('')).toBe(0);
      expect(parseSAR('   ')).toBe(0);
    });

    it('should parse amounts with spaces', () => {
      expect(parseSAR('1,234.56 ر.س')).toBe(1234.56);
      expect(parseSAR('1 234.56')).toBe(1234.56);
    });
  });

  describe('parseSAR - Arabic Numerals', () => {
    it('should parse Arabic numeral amounts', () => {
      expect(parseSAR('١٬٢٣٤٫٥٦ ر.س')).toBe(1234.56);
      expect(parseSAR('١٬٠٠٠٫٠٠ ر.س')).toBe(1000);
    });

    it('should parse mixed Arabic and Western numerals', () => {
      // In practice this shouldn't happen, but should handle gracefully
      const result = parseSAR('١234.56 ر.س');
      expect(result).toBe(1234.56);
    });

    it('should handle Arabic decimal separator', () => {
      expect(parseSAR('١٢٣٤٫٥٦')).toBe(1234.56);
    });
  });

  describe('formatSARCompact', () => {
    it('should format in compact notation', () => {
      const result = formatSARCompact(1234567);
      expect(result).toMatch(/M/);
      expect(result).toContain('ر.س');
    });

    it('should format large amounts', () => {
      const result = formatSARCompact(1000000000);
      expect(result).toMatch(/B/);
    });

    it('should handle zero', () => {
      const result = formatSARCompact(0);
      expect(result).toContain('0');
    });

    it('should support Arabic numerals in compact form', () => {
      const result = formatSARCompact(1234567, 'ar-SA', true);
      expect(result).toMatch(/[٠-٩]/);
    });
  });

  describe('formatSARInWords - Arabic', () => {
    it('should convert basic amounts to Arabic words', () => {
      const result = formatSARInWords(1, 'ar');
      expect(result).toContain('واحد');
      expect(result).toContain(SAR_CONSTANTS.nameArabic);
    });

    it('should handle zero in Arabic', () => {
      const result = formatSARInWords(0, 'ar');
      expect(result).toContain('صفر');
    });

    it('should handle amounts with decimals', () => {
      const result = formatSARInWords(1234.56, 'ar');
      expect(result).toContain(SAR_CONSTANTS.nameArabic);
      expect(result).toContain(SAR_CONSTANTS.minorUnit.nameArabic);
    });

    it('should handle large amounts', () => {
      const result = formatSARInWords(1000000, 'ar');
      expect(result).toContain('مليون');
    });

    it('should handle thousands', () => {
      const result = formatSARInWords(5000, 'ar');
      expect(result).toContain('آلاف');
    });
  });

  describe('formatSARInWords - English', () => {
    it('should convert basic amounts to English words', () => {
      const result = formatSARInWords(1, 'en');
      expect(result).toContain('one');
      expect(result).toContain('Saudi Riyal');
    });

    it('should handle zero in English', () => {
      const result = formatSARInWords(0, 'en');
      expect(result).toContain('zero');
    });

    it('should handle amounts with decimals', () => {
      const result = formatSARInWords(1234.56, 'en');
      expect(result).toContain('riyals');
      expect(result).toContain('Halala');
    });

    it('should handle large amounts', () => {
      const result = formatSARInWords(1000000, 'en');
      expect(result).toContain('million');
    });

    it('should handle plural correctly', () => {
      const result = formatSARInWords(2, 'en');
      expect(result).toContain('riyals');
    });
  });

  describe('validateSARAmount', () => {
    it('should validate valid amounts', () => {
      const result = validateSARAmount(1234.56);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject NaN', () => {
      const result = validateSARAmount(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    it('should reject Infinity', () => {
      const result = validateSARAmount(Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('finite');
    });

    it('should reject too many decimal places', () => {
      const result = validateSARAmount(1234.567);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('decimal places');
    });

    it('should accept negative amounts', () => {
      const result = validateSARAmount(-1234.56);
      expect(result.valid).toBe(true);
    });

    it('should accept zero', () => {
      const result = validateSARAmount(0);
      expect(result.valid).toBe(true);
    });

    it('should accept amounts with exactly 2 decimal places', () => {
      const result = validateSARAmount(1234.56);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large amounts', () => {
      const largeAmount = 999999999.99;
      const formatted = formatSAR(largeAmount);
      expect(formatted).toContain('999,999,999.99');

      const parsed = parseSAR(formatted);
      expect(parsed).toBeCloseTo(largeAmount, 2);
    });

    it('should handle very small amounts', () => {
      expect(formatSAR(0.01)).toContain('0.01');
      expect(parseSAR('0.01 ر.س')).toBe(0.01);
    });

    it('should round-trip format and parse', () => {
      const testAmounts = [0, 0.01, 100, 1234.56, 1000000];

      testAmounts.forEach((amount) => {
        const formatted = formatSAR(amount);
        const parsed = parseSAR(formatted);
        expect(parsed).toBeCloseTo(amount, 2);
      });
    });

    it('should round-trip with Arabic numerals', () => {
      const testAmounts = [100, 1234.56, 10000];

      testAmounts.forEach((amount) => {
        const formatted = formatSAR(amount, { useArabicNumerals: true });
        const parsed = parseSAR(formatted);
        expect(parsed).toBeCloseTo(amount, 2);
      });
    });
  });

  describe('Constants Validation', () => {
    it('should have correct SAR constants', () => {
      expect(SAR_CONSTANTS.code).toBe('SAR');
      expect(SAR_CONSTANTS.symbol).toBe('ر.س');
      expect(SAR_CONSTANTS.decimalDigits).toBe(2);
      expect(SAR_CONSTANTS.symbolPosition).toBe('suffix');
    });

    it('should have correct pegged rate', () => {
      expect(SAR_CONSTANTS.peggedTo).toBe('USD');
      expect(SAR_CONSTANTS.peggedRate).toBe(3.75);
      expect(SAR_CONSTANTS.isPegged).toBe(true);
    });

    it('should have correct minor unit', () => {
      expect(SAR_CONSTANTS.minorUnit.name).toBe('Halala');
      expect(SAR_CONSTANTS.minorUnit.ratio).toBe(100);
    });

    it('should have correct ISO numeric code', () => {
      expect(SAR_CONSTANTS.numericCode).toBe(682);
    });
  });

  describe('Locale Support', () => {
    it('should format with en-SA locale', () => {
      const result = formatSAR(1234.56, { locale: 'en-SA' });
      expect(result).toContain('1,234.56');
    });

    it('should format with ar-SA locale', () => {
      const result = formatSAR(1234.56, { locale: 'ar-SA' });
      expect(result).toBeTruthy();
    });
  });

  describe('Pegged Currency Conversion', () => {
    it('should convert USD to SAR using pegged rate', () => {
      const usd = 1000;
      const sar = usd * SAR_CONSTANTS.peggedRate;
      expect(sar).toBe(3750);
      expect(formatSAR(sar)).toContain('3,750.00');
    });

    it('should convert SAR to USD using pegged rate', () => {
      const sar = 3750;
      const usd = sar / SAR_CONSTANTS.peggedRate;
      expect(usd).toBeCloseTo(1000, 2);
    });
  });
});
