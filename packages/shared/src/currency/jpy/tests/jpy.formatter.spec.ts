/**
 * JPY Formatter Tests
 */

import {
  formatJPY,
  parseJPY,
  formatJPYCompact,
  validateJPYAmount,
} from '../jpy.formatter';
import { JPY_CONSTANTS } from '../jpy.constants';

describe('JPY Formatter', () => {
  describe('formatJPY - Standard Format', () => {
    it('should format basic amounts with symbol', () => {
      expect(formatJPY(1234567)).toBe('¥1,234,567');
      expect(formatJPY(1000)).toBe('¥1,000');
      expect(formatJPY(100)).toBe('¥100');
    });

    it('should format zero correctly', () => {
      expect(formatJPY(0)).toBe('¥0');
    });

    it('should format negative amounts', () => {
      expect(formatJPY(-1234567)).toContain('-');
      expect(formatJPY(-1000)).toContain('-');
    });

    it('should round decimal amounts to whole numbers', () => {
      expect(formatJPY(1234.56)).toBe('¥1,235');
      expect(formatJPY(1234.49)).toBe('¥1,234');
      expect(formatJPY(999.99)).toBe('¥1,000');
    });

    it('should format large amounts correctly', () => {
      expect(formatJPY(1000000)).toBe('¥1,000,000');
      expect(formatJPY(100000000)).toBe('¥100,000,000');
      expect(formatJPY(999999999999)).toBe('¥999,999,999,999');
    });

    it('should format without symbol when requested', () => {
      const result = formatJPY(1234567, { includeSymbol: false });
      expect(result).not.toContain('¥');
      expect(result).toContain('1,234,567');
    });
  });

  describe('formatJPY - Traditional Format', () => {
    it('should format with 万 (man) - ten thousands', () => {
      const result = formatJPY(12345, {
        useTraditionalFormat: true,
        useKanjiYenSymbol: true,
      });
      expect(result).toBe('1万2,345円');
    });

    it('should format with 億 (oku) - hundred millions', () => {
      const result = formatJPY(123456789, {
        useTraditionalFormat: true,
        useKanjiYenSymbol: true,
      });
      expect(result).toBe('1億2,345万6,789円');
    });

    it('should format with 兆 (cho) - trillions', () => {
      const result = formatJPY(1234567890000, {
        useTraditionalFormat: true,
        useKanjiYenSymbol: true,
      });
      expect(result).toBe('1兆2,345億6,789万円');
    });

    it('should handle amounts less than 万 (10,000)', () => {
      const result = formatJPY(9999, {
        useTraditionalFormat: true,
        useKanjiYenSymbol: true,
      });
      expect(result).toBe('9,999円');
    });

    it('should format zero in traditional format', () => {
      const result = formatJPY(0, {
        useTraditionalFormat: true,
        useKanjiYenSymbol: true,
      });
      expect(result).toBe('0円');
    });

    it('should use ¥ symbol in traditional format when specified', () => {
      const result = formatJPY(12345, {
        useTraditionalFormat: true,
        useKanjiYenSymbol: false,
      });
      expect(result).toContain('¥');
      expect(result).not.toContain('円');
    });

    it('should format negative amounts in traditional format', () => {
      const result = formatJPY(-12345, {
        useTraditionalFormat: true,
        useKanjiYenSymbol: true,
      });
      expect(result).toContain('-');
      expect(result).toContain('1万2,345円');
    });

    it('should format exact 万 amounts', () => {
      const result = formatJPY(10000, {
        useTraditionalFormat: true,
        useKanjiYenSymbol: true,
      });
      expect(result).toBe('1万円');
    });

    it('should format exact 億 amounts', () => {
      const result = formatJPY(100000000, {
        useTraditionalFormat: true,
        useKanjiYenSymbol: true,
      });
      expect(result).toBe('1億円');
    });
  });

  describe('parseJPY - Standard Format', () => {
    it('should parse standard formatted amounts', () => {
      expect(parseJPY('¥1,234,567')).toBe(1234567);
      expect(parseJPY('¥1,000')).toBe(1000);
      expect(parseJPY('¥100')).toBe(100);
    });

    it('should parse amounts without symbols', () => {
      expect(parseJPY('1,234,567')).toBe(1234567);
      expect(parseJPY('1000')).toBe(1000);
    });

    it('should parse negative amounts', () => {
      expect(parseJPY('-¥1,234,567')).toBe(-1234567);
      expect(parseJPY('-1000')).toBe(-1000);
    });

    it('should handle zero', () => {
      expect(parseJPY('¥0')).toBe(0);
      expect(parseJPY('0')).toBe(0);
    });

    it('should handle empty or invalid strings', () => {
      expect(parseJPY('')).toBe(0);
      expect(parseJPY('   ')).toBe(0);
    });

    it('should parse amounts with spaces', () => {
      expect(parseJPY('¥ 1,234,567')).toBe(1234567);
      expect(parseJPY('1 234 567')).toBe(1234567);
    });
  });

  describe('parseJPY - Traditional Format', () => {
    it('should parse 万 (man) notation', () => {
      expect(parseJPY('1万2,345円')).toBe(12345);
      expect(parseJPY('10万円')).toBe(100000);
    });

    it('should parse 億 (oku) notation', () => {
      expect(parseJPY('1億2,345万6,789円')).toBe(123456789);
      expect(parseJPY('5億円')).toBe(500000000);
    });

    it('should parse 兆 (cho) notation', () => {
      expect(parseJPY('1兆円')).toBe(1000000000000);
      expect(parseJPY('2兆3,456億円')).toBe(2345600000000);
    });

    it('should parse mixed traditional notation', () => {
      expect(parseJPY('3兆2億1万円')).toBe(3000200010000);
    });

    it('should parse traditional format without 円', () => {
      expect(parseJPY('1万2,345')).toBe(12345);
      expect(parseJPY('5億')).toBe(500000000);
    });

    it('should parse negative traditional amounts', () => {
      expect(parseJPY('-1万円')).toBe(-10000);
      expect(parseJPY('-5億円')).toBe(-500000000);
    });
  });

  describe('formatJPYCompact', () => {
    it('should format in Japanese traditional for ja-JP locale', () => {
      const result = formatJPYCompact(123456789, 'ja-JP');
      expect(result).toContain('億');
      expect(result).toContain('万');
      expect(result).toContain('円');
    });

    it('should format in compact notation for English locale', () => {
      const result = formatJPYCompact(1234567, 'en-US');
      expect(result).toMatch(/[¥]/);
      expect(result).toMatch(/M/); // Million
    });

    it('should handle large amounts', () => {
      const result = formatJPYCompact(1000000000, 'en-US');
      expect(result).toContain('B'); // Billion
    });

    it('should handle zero', () => {
      const result = formatJPYCompact(0, 'ja-JP');
      expect(result).toBe('0円');
    });
  });

  describe('validateJPYAmount', () => {
    it('should validate whole numbers', () => {
      const result = validateJPYAmount(1234567);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject decimal amounts', () => {
      const result = validateJPYAmount(1234.56);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('decimal');
    });

    it('should reject NaN', () => {
      const result = validateJPYAmount(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    it('should reject Infinity', () => {
      const result = validateJPYAmount(Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('finite');
    });

    it('should accept negative whole numbers', () => {
      const result = validateJPYAmount(-1234567);
      expect(result.valid).toBe(true);
    });

    it('should accept zero', () => {
      const result = validateJPYAmount(0);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large amounts', () => {
      const largeAmount = 999999999999;
      const formatted = formatJPY(largeAmount);
      expect(formatted).toContain('999,999,999,999');

      const parsed = parseJPY(formatted);
      expect(parsed).toBe(largeAmount);
    });

    it('should handle rounding edge cases', () => {
      expect(formatJPY(0.5)).toBe('¥1');
      expect(formatJPY(0.4)).toBe('¥0');
      expect(formatJPY(-0.5)).toBe('-¥1');
    });

    it('should round-trip format and parse', () => {
      const testAmounts = [0, 100, 1000, 12345, 1234567, 100000000];

      testAmounts.forEach((amount) => {
        const formatted = formatJPY(amount);
        const parsed = parseJPY(formatted);
        expect(parsed).toBe(amount);
      });
    });

    it('should round-trip traditional format and parse', () => {
      const testAmounts = [10000, 123456, 100000000, 1234567890];

      testAmounts.forEach((amount) => {
        const formatted = formatJPY(amount, {
          useTraditionalFormat: true,
          useKanjiYenSymbol: true,
        });
        const parsed = parseJPY(formatted);
        expect(parsed).toBe(amount);
      });
    });
  });

  describe('Constants Validation', () => {
    it('should have correct JPY constants', () => {
      expect(JPY_CONSTANTS.code).toBe('JPY');
      expect(JPY_CONSTANTS.symbol).toBe('¥');
      expect(JPY_CONSTANTS.decimalDigits).toBe(0);
      expect(JPY_CONSTANTS.symbolPosition).toBe('prefix');
    });

    it('should have correct large number values', () => {
      expect(JPY_CONSTANTS.largeNumbers.man).toBe(10000);
      expect(JPY_CONSTANTS.largeNumbers.oku).toBe(100000000);
      expect(JPY_CONSTANTS.largeNumbers.cho).toBe(1000000000000);
    });

    it('should have correct kanji characters', () => {
      expect(JPY_CONSTANTS.kanji.man).toBe('万');
      expect(JPY_CONSTANTS.kanji.oku).toBe('億');
      expect(JPY_CONSTANTS.kanji.cho).toBe('兆');
      expect(JPY_CONSTANTS.kanji.yen).toBe('円');
    });
  });
});
