/**
 * CAD Formatter Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CADFormatterService } from '../cad-formatter.service';

describe('CADFormatterService', () => {
  let service: CADFormatterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CADFormatterService],
    }).compile();

    service = module.get<CADFormatterService>(CADFormatterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('formatAmount', () => {
    describe('English Canadian locale (en-CA)', () => {
      it('should format amount with C$ symbol', () => {
        const formatted = service.formatAmount(1234.56, { locale: 'en-CA' });
        expect(formatted).toContain('1,234.56');
        expect(formatted).toContain('$'); // Contains dollar sign
      });

      it('should format small amount', () => {
        const formatted = service.formatAmount(9.99, { locale: 'en-CA' });
        expect(formatted).toContain('9.99');
      });

      it('should format large amount', () => {
        const formatted = service.formatAmount(999999.99, { locale: 'en-CA' });
        expect(formatted).toContain('999,999.99');
      });

      it('should format zero', () => {
        const formatted = service.formatAmount(0, { locale: 'en-CA' });
        expect(formatted).toContain('0.00');
      });

      it('should support showCode option', () => {
        const formatted = service.formatAmount(1234.56, {
          locale: 'en-CA',
          showCode: true,
        });
        expect(formatted).toContain('CAD');
      });

      it('should support showSymbol false option', () => {
        const formatted = service.formatAmount(1234.56, {
          locale: 'en-CA',
          showSymbol: false,
        });
        expect(formatted).not.toContain('$');
        expect(formatted).toContain('1,234.56');
      });
    });

    describe('French Canadian locale (fr-CA)', () => {
      it('should format amount with space separator', () => {
        const formatted = service.formatAmount(1234.56, { locale: 'fr-CA' });
        // French format uses space and comma
        expect(formatted).toMatch(/1[\s\u00A0]234[,.]5[6]/); // Allow for non-breaking space
      });

      it('should format with French conventions', () => {
        const formatted = service.formatAmount(9.99, { locale: 'fr-CA' });
        expect(formatted).toBeDefined();
        expect(formatted.length).toBeGreaterThan(0);
      });
    });

    describe('Bilingual formatting', () => {
      it('should format in both English and French', () => {
        const formatted = service.formatAmount(1234.56, { bilingual: true });
        expect(formatted).toContain('/'); // Separator between languages
      });
    });

    describe('Cash rounding', () => {
      it('should apply cash rounding when requested', () => {
        const formatted = service.formatAmount(1234.56, {
          locale: 'en-CA',
          isCash: true,
        });
        expect(formatted).toContain('1,234.55'); // Rounded to nearest 0.05
      });

      it('should round 1.01 to 1.00 for cash', () => {
        const formatted = service.formatAmount(1.01, {
          locale: 'en-CA',
          isCash: true,
        });
        expect(formatted).toContain('1.00');
      });

      it('should round 1.03 to 1.05 for cash', () => {
        const formatted = service.formatAmount(1.03, {
          locale: 'en-CA',
          isCash: true,
        });
        expect(formatted).toContain('1.05');
      });

      it('should not round for electronic transactions', () => {
        const formatted = service.formatAmount(1234.56, {
          locale: 'en-CA',
          isCash: false,
        });
        expect(formatted).toContain('1,234.56'); // Exact amount
      });
    });

    describe('Validation', () => {
      it('should throw error for invalid amount', () => {
        expect(() => service.formatAmount(NaN)).toThrow(BadRequestException);
      });

      it('should throw error for Infinity', () => {
        expect(() => service.formatAmount(Infinity)).toThrow(
          BadRequestException,
        );
      });
    });
  });

  describe('parseAmount', () => {
    describe('English format parsing', () => {
      it('should parse C$1,234.56', () => {
        const parsed = service.parseAmount('C$1,234.56');
        expect(parsed).toBe(1234.56);
      });

      it('should parse $1234.56', () => {
        const parsed = service.parseAmount('$1234.56');
        expect(parsed).toBe(1234.56);
      });

      it('should parse 1234.56', () => {
        const parsed = service.parseAmount('1234.56');
        expect(parsed).toBe(1234.56);
      });

      it('should parse 1,234.56', () => {
        const parsed = service.parseAmount('1,234.56');
        expect(parsed).toBe(1234.56);
      });

      it('should parse CA$1,234.56', () => {
        const parsed = service.parseAmount('CA$1,234.56');
        expect(parsed).toBe(1234.56);
      });
    });

    describe('French format parsing', () => {
      it('should parse 1 234,56 $', () => {
        const parsed = service.parseAmount('1 234,56 $', { locale: 'fr-CA' });
        expect(parsed).toBe(1234.56);
      });

      it('should parse 1234,56', () => {
        const parsed = service.parseAmount('1234,56', { locale: 'fr-CA' });
        expect(parsed).toBe(1234.56);
      });
    });

    describe('Error handling', () => {
      it('should throw error for invalid input', () => {
        expect(() => service.parseAmount('abc')).toThrow(BadRequestException);
      });

      it('should throw error for empty input', () => {
        expect(() => service.parseAmount('')).toThrow(BadRequestException);
      });

      it('should throw error for null input', () => {
        expect(() => service.parseAmount(null as any)).toThrow(
          BadRequestException,
        );
      });
    });
  });

  describe('formatWithRoundingIndicator', () => {
    it('should show rounding indicator when amount is rounded', () => {
      const formatted = service.formatWithRoundingIndicator(1234.56);
      expect(formatted).toContain('rounded');
    });

    it('should not show rounding indicator when amount is not rounded', () => {
      const formatted = service.formatWithRoundingIndicator(1234.55);
      expect(formatted).not.toContain('rounded');
    });
  });

  describe('validate', () => {
    it('should validate correct CAD amounts', () => {
      expect(service.validate(1234.56)).toBe(true);
      expect(service.validate(0.01)).toBe(true);
      expect(service.validate(0)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(service.validate(NaN)).toBe(false);
      expect(service.validate(Infinity)).toBe(false);
      expect(service.validate(-Infinity)).toBe(false);
    });

    it('should reject amounts with too many decimals', () => {
      expect(service.validate(1.123)).toBe(false);
    });
  });

  describe('applyCashRounding', () => {
    it('should round to nearest 0.05', () => {
      expect(service.applyCashRounding(1.01)).toBe(1.0);
      expect(service.applyCashRounding(1.02)).toBe(1.0);
      expect(service.applyCashRounding(1.03)).toBe(1.05);
      expect(service.applyCashRounding(1.04)).toBe(1.05);
      expect(service.applyCashRounding(1.05)).toBe(1.05);
      expect(service.applyCashRounding(1.06)).toBe(1.05);
      expect(service.applyCashRounding(1.07)).toBe(1.05);
      expect(service.applyCashRounding(1.08)).toBe(1.1);
    });
  });

  describe('toCents / fromCents', () => {
    it('should convert dollars to cents', () => {
      expect(service.toCents(1.23)).toBe(123);
      expect(service.toCents(10.50)).toBe(1050);
    });

    it('should convert cents to dollars', () => {
      expect(service.fromCents(123)).toBe(1.23);
      expect(service.fromCents(1050)).toBe(10.5);
    });
  });

  describe('formatCompact', () => {
    it('should format large amounts compactly', () => {
      const formatted = service.formatCompact(1234567);
      expect(formatted).toMatch(/1[.,]2M/i);
    });

    it('should format thousands compactly', () => {
      const formatted = service.formatCompact(1234);
      expect(formatted).toMatch(/1[.,]2K/i);
    });

    it('should not compact small amounts', () => {
      const formatted = service.formatCompact(123);
      expect(formatted).not.toContain('K');
      expect(formatted).not.toContain('M');
    });
  });

  describe('getFormattingExamples', () => {
    it('should return examples in all formats', () => {
      const examples = service.getFormattingExamples();
      expect(examples.english).toBeDefined();
      expect(examples.french).toBeDefined();
      expect(examples.bilingual).toBeDefined();
      expect(examples.bilingual).toContain('/');
    });
  });

  describe('getCurrencyConfig', () => {
    it('should return CAD currency configuration', () => {
      const config = service.getCurrencyConfig();
      expect(config.code).toBe('CAD');
      expect(config.name).toBe('Canadian Dollar');
      expect(config.decimals).toBe(2);
    });
  });
});
