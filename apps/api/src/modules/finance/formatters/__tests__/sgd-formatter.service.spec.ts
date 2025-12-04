/**
 * SGD Formatter Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SGDFormatterService } from '../sgd-formatter.service';

describe('SGDFormatterService', () => {
  let service: SGDFormatterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SGDFormatterService],
    }).compile();

    service = module.get<SGDFormatterService>(SGDFormatterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('formatAmount', () => {
    describe('Basic formatting', () => {
      it('should format amount with S$ symbol', () => {
        const formatted = service.formatAmount(1234.56);
        expect(formatted).toContain('1,234.56');
        expect(formatted).toContain('$');
      });

      it('should format small amount', () => {
        const formatted = service.formatAmount(9.99);
        expect(formatted).toContain('9.99');
      });

      it('should format large amount', () => {
        const formatted = service.formatAmount(999999.99);
        expect(formatted).toContain('999,999.99');
      });

      it('should format zero', () => {
        const formatted = service.formatAmount(0);
        expect(formatted).toContain('0.00');
      });
    });

    describe('Locale support', () => {
      it('should format with English locale', () => {
        const formatted = service.formatAmount(1234.56, { locale: 'en-SG' });
        expect(formatted).toContain('1,234.56');
      });

      it('should format with Chinese locale', () => {
        const formatted = service.formatAmount(1234.56, { locale: 'zh-SG' });
        expect(formatted).toBeDefined();
        expect(formatted).toContain('1,234.56');
      });
    });

    describe('Cash rounding', () => {
      it('should apply cash rounding when requested', () => {
        const formatted = service.formatAmount(1234.56, { isCash: true });
        expect(formatted).toContain('1,234.55'); // Rounded to nearest 0.05
      });

      it('should round 1.01 to 1.00 for cash', () => {
        const formatted = service.formatAmount(1.01, { isCash: true });
        expect(formatted).toContain('1.00');
      });

      it('should round 1.02 to 1.00 for cash', () => {
        const formatted = service.formatAmount(1.02, { isCash: true });
        expect(formatted).toContain('1.00');
      });

      it('should round 1.03 to 1.05 for cash', () => {
        const formatted = service.formatAmount(1.03, { isCash: true });
        expect(formatted).toContain('1.05');
      });

      it('should round 1.07 to 1.05 for cash', () => {
        const formatted = service.formatAmount(1.07, { isCash: true });
        expect(formatted).toContain('1.05');
      });

      it('should round 1.08 to 1.10 for cash', () => {
        const formatted = service.formatAmount(1.08, { isCash: true });
        expect(formatted).toContain('1.10');
      });

      it('should not round for electronic transactions', () => {
        const formatted = service.formatAmount(1234.56, { isCash: false });
        expect(formatted).toContain('1,234.56'); // Exact amount
      });
    });

    describe('Rounding indicator', () => {
      it('should show rounding indicator when requested', () => {
        const formatted = service.formatAmount(1234.56, {
          isCash: true,
          showRounding: true,
        });
        expect(formatted).toContain('*'); // Rounding indicator
      });

      it('should not show indicator for non-cash', () => {
        const formatted = service.formatAmount(1234.56, {
          isCash: false,
          showRounding: true,
        });
        expect(formatted).not.toContain('*');
      });

      it('should not show indicator when amount does not need rounding', () => {
        const formatted = service.formatAmount(1234.55, {
          isCash: true,
          showRounding: true,
        });
        expect(formatted).not.toContain('*');
      });
    });

    describe('Display options', () => {
      it('should support showCode option', () => {
        const formatted = service.formatAmount(1234.56, { showCode: true });
        expect(formatted).toContain('SGD');
      });

      it('should support showSymbol false option', () => {
        const formatted = service.formatAmount(1234.56, { showSymbol: false });
        expect(formatted).not.toContain('$');
        expect(formatted).toContain('1,234.56');
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
    describe('Valid parsing', () => {
      it('should parse S$1,234.56', () => {
        const parsed = service.parseAmount('S$1,234.56');
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

      it('should parse SG$1,234.56', () => {
        const parsed = service.parseAmount('SG$1,234.56');
        expect(parsed).toBe(1234.56);
      });

      it('should parse amount with rounding indicator', () => {
        const parsed = service.parseAmount('1,234.55*');
        expect(parsed).toBe(1234.55);
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

  describe('formatWithRoundingDetails', () => {
    it('should return detailed rounding information', () => {
      const details = service.formatWithRoundingDetails(1234.56);

      expect(details.original).toContain('1,234.56');
      expect(details.rounded).toContain('1,234.55');
      expect(details.needsRounding).toBe(true);
      expect(details.adjustment).toBeDefined();
      expect(details.display).toContain('rounded');
    });

    it('should indicate no rounding needed for 0.05 increments', () => {
      const details = service.formatWithRoundingDetails(1234.55);

      expect(details.needsRounding).toBe(false);
      expect(details.display).not.toContain('rounded');
    });

    it('should show rounding up', () => {
      const details = service.formatWithRoundingDetails(1.08);

      expect(details.needsRounding).toBe(true);
      expect(details.display).toContain('up');
    });

    it('should show rounding down', () => {
      const details = service.formatWithRoundingDetails(1.01);

      expect(details.needsRounding).toBe(true);
      expect(details.display).toContain('down');
    });
  });

  describe('validate', () => {
    it('should validate correct SGD amounts for electronic', () => {
      expect(service.validate(1234.56, false)).toBe(true);
      expect(service.validate(0.01, false)).toBe(true);
      expect(service.validate(0, false)).toBe(true);
    });

    it('should validate correct SGD amounts for cash', () => {
      expect(service.validate(1234.55, true)).toBe(true);
      expect(service.validate(1234.50, true)).toBe(true);
      expect(service.validate(0.05, true)).toBe(true);
    });

    it('should reject invalid cash amounts', () => {
      expect(service.validate(1234.56, true)).toBe(false); // Not 0.05 increment
      expect(service.validate(1234.51, true)).toBe(false);
      expect(service.validate(0.01, true)).toBe(false); // Less than minimum
    });

    it('should reject invalid amounts', () => {
      expect(service.validate(NaN, false)).toBe(false);
      expect(service.validate(Infinity, false)).toBe(false);
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
      expect(service.applyCashRounding(1.09)).toBe(1.1);
      expect(service.applyCashRounding(1.10)).toBe(1.1);
    });
  });

  describe('needsCashRounding', () => {
    it('should detect amounts that need rounding', () => {
      expect(service.needsCashRounding(1.01)).toBe(true);
      expect(service.needsCashRounding(1.02)).toBe(true);
      expect(service.needsCashRounding(1.03)).toBe(true);
      expect(service.needsCashRounding(1.04)).toBe(true);
      expect(service.needsCashRounding(1.06)).toBe(true);
    });

    it('should detect amounts that do not need rounding', () => {
      expect(service.needsCashRounding(1.00)).toBe(false);
      expect(service.needsCashRounding(1.05)).toBe(false);
      expect(service.needsCashRounding(1.10)).toBe(false);
      expect(service.needsCashRounding(1.50)).toBe(false);
    });
  });

  describe('getRoundingAdjustment', () => {
    it('should calculate rounding adjustment', () => {
      expect(service.getRoundingAdjustment(1.01)).toBe(-0.01);
      expect(service.getRoundingAdjustment(1.03)).toBe(0.02);
      expect(service.getRoundingAdjustment(1.05)).toBe(0);
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
  });

  describe('getCashRoundingTable', () => {
    it('should return rounding examples', () => {
      const table = service.getCashRoundingTable();

      expect(table.length).toBe(10);
      expect(table[0].original).toBe(1.01);
      expect(table[0].rounded).toBe(1.0);

      // Check all entries have required properties
      table.forEach((entry) => {
        expect(entry.original).toBeDefined();
        expect(entry.rounded).toBeDefined();
        expect(entry.adjustment).toBeDefined();
      });
    });
  });

  describe('formatOfficial', () => {
    it('should format with code for official documents', () => {
      const formatted = service.formatOfficial(1234.56);
      expect(formatted).toContain('SGD');
      expect(formatted).toContain('$');
    });
  });

  describe('formatReceipt', () => {
    it('should format receipt with rounding details for cash', () => {
      const formatted = service.formatReceipt(1234.56, true);
      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('1,234.55');
      expect(formatted).toContain('Cash Rounded');
    });

    it('should format receipt without rounding for electronic', () => {
      const formatted = service.formatReceipt(1234.56, false);
      expect(formatted).toContain('1,234.56');
      expect(formatted).not.toContain('Cash Rounded');
    });

    it('should format receipt without rounding when not needed', () => {
      const formatted = service.formatReceipt(1234.55, true);
      expect(formatted).toContain('1,234.55');
      expect(formatted).not.toContain('Cash Rounded');
    });
  });

  describe('getFormattingExamples', () => {
    it('should return examples in all formats', () => {
      const examples = service.getFormattingExamples();
      expect(examples.english).toBeDefined();
      expect(examples.chinese).toBeDefined();
      expect(examples.electronicEnglish).toBeDefined();
      expect(examples.cashEnglish).toBeDefined();
      expect(examples.withRounding).toBeDefined();
      expect(examples.withRounding).toContain('rounded');
    });
  });

  describe('getCurrencyConfig', () => {
    it('should return SGD currency configuration', () => {
      const config = service.getCurrencyConfig();
      expect(config.code).toBe('SGD');
      expect(config.name).toBe('Singapore Dollar');
      expect(config.decimals).toBe(2);
      expect(config.rounding.type).toBe('standard');
    });
  });
});
