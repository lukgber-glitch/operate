/**
 * Unit tests for Hindi (India) Locale Formatter
 */

import {
  HINDI_LOCALE,
  formatHindiDate,
  formatHindiTime,
  formatHindiNumber,
  formatHindiCurrency,
  parseHindiNumber,
  parseHindiCurrency,
  getIndianFiscalYear,
  getHindiFiscalYear,
  getIndianFiscalQuarter,
  isWithinFiscalYear,
  getFiscalYearDates,
} from './hi';

describe('HINDI_LOCALE', () => {
  it('should have correct locale configuration', () => {
    expect(HINDI_LOCALE.code).toBe('hi');
    expect(HINDI_LOCALE.name).toBe('Hindi');
    expect(HINDI_LOCALE.nativeName).toBe('हिन्दी');
    expect(HINDI_LOCALE.country).toBe('IN');
    expect(HINDI_LOCALE.direction).toBe('ltr');
  });

  it('should have correct date format', () => {
    expect(HINDI_LOCALE.dateFormat).toBe('DD/MM/YYYY');
  });

  it('should have correct currency configuration', () => {
    expect(HINDI_LOCALE.currency).toBe('INR');
    expect(HINDI_LOCALE.currencySymbol).toBe('₹');
    expect(HINDI_LOCALE.currencyPosition).toBe('prefix');
  });

  it('should have Indian numbering system', () => {
    expect(HINDI_LOCALE.numberingSystem).toBe('indian');
  });

  it('should have correct fiscal year dates', () => {
    expect(HINDI_LOCALE.fiscalYearStart).toEqual({ month: 4, day: 1 });
    expect(HINDI_LOCALE.fiscalYearEnd).toEqual({ month: 3, day: 31 });
  });
});

describe('formatHindiDate', () => {
  const testDate = new Date('2024-12-03T14:30:00');

  it('should format date in medium format (default)', () => {
    expect(formatHindiDate(testDate)).toBe('03/12/2024');
  });

  it('should format date in short format', () => {
    expect(formatHindiDate(testDate, { format: 'short' })).toBe('03/12/24');
  });

  it('should format date in long format', () => {
    expect(formatHindiDate(testDate, { format: 'long' })).toBe('3 दिसंबर 2024');
  });

  it('should format date in full format', () => {
    expect(formatHindiDate(testDate, { format: 'full' })).toBe('मंगलवार, 3 दिसंबर 2024');
  });

  it('should include day name when requested', () => {
    const result = formatHindiDate(testDate, { includeDay: true });
    expect(result).toContain('मंगलवार');
    expect(result).toContain('03/12/2024');
  });

  it('should convert to Devanagari numerals in long format', () => {
    const result = formatHindiDate(testDate, { format: 'long', useDevanagari: true });
    expect(result).toContain('३');
    expect(result).toContain('२०२४');
  });

  it('should handle January dates correctly', () => {
    const januaryDate = new Date('2024-01-15T00:00:00');
    expect(formatHindiDate(januaryDate, { format: 'long' })).toBe('15 जनवरी 2024');
  });

  it('should handle March dates correctly', () => {
    const marchDate = new Date('2024-03-31T00:00:00');
    expect(formatHindiDate(marchDate, { format: 'long' })).toBe('31 मार्च 2024');
  });

  it('should throw error for invalid date', () => {
    expect(() => formatHindiDate(new Date('invalid'))).toThrow('Invalid date provided');
  });
});

describe('formatHindiTime', () => {
  it('should format time in 24-hour format', () => {
    const date = new Date('2024-12-03T14:30:00');
    expect(formatHindiTime(date)).toBe('14:30');
  });

  it('should format midnight correctly', () => {
    const date = new Date('2024-12-03T00:00:00');
    expect(formatHindiTime(date)).toBe('00:00');
  });

  it('should format time with Devanagari numerals', () => {
    const date = new Date('2024-12-03T14:30:00');
    const result = formatHindiTime(date, { useDevanagari: true });
    expect(result).toBe('१४:३०');
  });

  it('should throw error for invalid date', () => {
    expect(() => formatHindiTime(new Date('invalid'))).toThrow('Invalid date provided');
  });
});

describe('formatHindiNumber', () => {
  describe('Indian numbering system', () => {
    it('should format numbers with lakhs correctly', () => {
      expect(formatHindiNumber(100000, { decimals: 0 })).toBe('1,00,000');
      expect(formatHindiNumber(500000, { decimals: 0 })).toBe('5,00,000');
    });

    it('should format numbers with crores correctly', () => {
      expect(formatHindiNumber(10000000, { decimals: 0 })).toBe('1,00,00,000');
      expect(formatHindiNumber(25000000, { decimals: 0 })).toBe('2,50,00,000');
    });

    it('should format decimal numbers', () => {
      expect(formatHindiNumber(1234.56)).toBe('1,234.56');
      expect(formatHindiNumber(100000.99)).toBe('1,00,000.99');
    });

    it('should format small numbers without grouping', () => {
      expect(formatHindiNumber(999, { decimals: 0 })).toBe('999');
      expect(formatHindiNumber(123.45)).toBe('123.45');
    });

    it('should handle zero', () => {
      expect(formatHindiNumber(0)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatHindiNumber(-100000, { decimals: 0 })).toBe('-1,00,000');
    });
  });

  describe('Devanagari numerals', () => {
    it('should convert to Devanagari numerals', () => {
      const result = formatHindiNumber(100000, { decimals: 0, useDevanagari: true });
      expect(result).toBe('१,००,०००');
    });

    it('should convert decimal numbers to Devanagari', () => {
      const result = formatHindiNumber(1234.56, { useDevanagari: true });
      expect(result).toBe('१,२३४.५६');
    });
  });

  describe('Western numbering system', () => {
    it('should format with Western grouping when requested', () => {
      expect(formatHindiNumber(1000000, { useIndianSystem: false, decimals: 0 })).toBe(
        '1,000,000'
      );
    });
  });

  describe('Error handling', () => {
    it('should throw error for NaN', () => {
      expect(() => formatHindiNumber(NaN)).toThrow('Invalid number provided');
    });

    it('should throw error for Infinity', () => {
      expect(() => formatHindiNumber(Infinity)).toThrow('Invalid number provided');
    });
  });
});

describe('formatHindiCurrency', () => {
  it('should format INR with symbol', () => {
    expect(formatHindiCurrency(100000)).toBe('₹1,00,000.00');
  });

  it('should format large amounts', () => {
    expect(formatHindiCurrency(10000000)).toBe('₹1,00,00,000.00');
  });

  it('should format with custom decimals', () => {
    expect(formatHindiCurrency(1234.5, { decimals: 1 })).toBe('₹1,234.5');
  });

  it('should format without symbol when requested', () => {
    const result = formatHindiCurrency(100000, { includeSymbol: false });
    expect(result).toBe('1,00,000.00');
  });

  it('should format with Devanagari numerals', () => {
    const result = formatHindiCurrency(100000, { useDevanagari: true });
    expect(result).toBe('₹१,००,०००.००');
  });

  it('should handle zero amount', () => {
    expect(formatHindiCurrency(0)).toBe('₹0.00');
  });

  it('should handle negative amounts', () => {
    expect(formatHindiCurrency(-50000)).toBe('-₹50,000.00');
  });
});

describe('parseHindiNumber', () => {
  it('should parse Indian formatted numbers', () => {
    expect(parseHindiNumber('1,00,000')).toBe(100000);
    expect(parseHindiNumber('1,00,00,000')).toBe(10000000);
  });

  it('should parse decimal numbers', () => {
    expect(parseHindiNumber('1,234.56')).toBe(1234.56);
  });

  it('should parse Devanagari numerals', () => {
    expect(parseHindiNumber('१,००,०००')).toBe(100000);
    expect(parseHindiNumber('१,२३४.५६')).toBe(1234.56);
  });

  it('should handle empty string', () => {
    expect(parseHindiNumber('')).toBe(0);
    expect(parseHindiNumber('   ')).toBe(0);
  });

  it('should handle numbers without separators', () => {
    expect(parseHindiNumber('100000')).toBe(100000);
  });
});

describe('parseHindiCurrency', () => {
  it('should parse INR formatted currency', () => {
    expect(parseHindiCurrency('₹1,00,000.00')).toBe(100000);
  });

  it('should parse currency without symbol', () => {
    expect(parseHindiCurrency('1,00,000')).toBe(100000);
  });

  it('should parse Devanagari currency', () => {
    expect(parseHindiCurrency('₹१,००,०००.००')).toBe(100000);
  });

  it('should parse negative amounts', () => {
    expect(parseHindiCurrency('-₹50,000.00')).toBe(-50000);
  });

  it('should handle empty string', () => {
    expect(parseHindiCurrency('')).toBe(0);
  });
});

describe('getIndianFiscalYear', () => {
  it('should return correct FY for dates in April-December', () => {
    expect(getIndianFiscalYear(new Date('2024-04-01'))).toBe('FY 2024-25');
    expect(getIndianFiscalYear(new Date('2024-06-15'))).toBe('FY 2024-25');
    expect(getIndianFiscalYear(new Date('2024-12-31'))).toBe('FY 2024-25');
  });

  it('should return correct FY for dates in January-March', () => {
    expect(getIndianFiscalYear(new Date('2024-01-01'))).toBe('FY 2023-24');
    expect(getIndianFiscalYear(new Date('2024-02-15'))).toBe('FY 2023-24');
    expect(getIndianFiscalYear(new Date('2024-03-31'))).toBe('FY 2023-24');
  });

  it('should handle fiscal year boundaries', () => {
    expect(getIndianFiscalYear(new Date('2024-03-31T23:59:59'))).toBe('FY 2023-24');
    expect(getIndianFiscalYear(new Date('2024-04-01T00:00:00'))).toBe('FY 2024-25');
  });

  it('should throw error for invalid date', () => {
    expect(() => getIndianFiscalYear(new Date('invalid'))).toThrow('Invalid date provided');
  });
});

describe('getHindiFiscalYear', () => {
  it('should return fiscal year in Hindi', () => {
    expect(getHindiFiscalYear(new Date('2024-05-15'))).toBe('वित्तीय वर्ष 2024-25');
  });

  it('should handle different fiscal years', () => {
    expect(getHindiFiscalYear(new Date('2024-01-15'))).toBe('वित्तीय वर्ष 2023-24');
  });
});

describe('getIndianFiscalQuarter', () => {
  it('should return Q1 for April-June', () => {
    const result = getIndianFiscalQuarter(new Date('2024-04-15'));
    expect(result.quarter).toBe(1);
    expect(result.label).toBe('Q1 (Apr-Jun)');
    expect(result.labelHindi).toBe('तिमाही 1 (अप्रैल-जून)');
    expect(result.startMonth).toBe(4);
    expect(result.endMonth).toBe(6);
  });

  it('should return Q2 for July-September', () => {
    const result = getIndianFiscalQuarter(new Date('2024-08-15'));
    expect(result.quarter).toBe(2);
    expect(result.label).toBe('Q2 (Jul-Sep)');
    expect(result.labelHindi).toBe('तिमाही 2 (जुलाई-सितंबर)');
  });

  it('should return Q3 for October-December', () => {
    const result = getIndianFiscalQuarter(new Date('2024-11-15'));
    expect(result.quarter).toBe(3);
    expect(result.label).toBe('Q3 (Oct-Dec)');
    expect(result.labelHindi).toBe('तिमाही 3 (अक्टूबर-दिसंबर)');
  });

  it('should return Q4 for January-March', () => {
    const result = getIndianFiscalQuarter(new Date('2024-02-15'));
    expect(result.quarter).toBe(4);
    expect(result.label).toBe('Q4 (Jan-Mar)');
    expect(result.labelHindi).toBe('तिमाही 4 (जनवरी-मार्च)');
  });

  it('should throw error for invalid date', () => {
    expect(() => getIndianFiscalQuarter(new Date('invalid'))).toThrow('Invalid date provided');
  });
});

describe('isWithinFiscalYear', () => {
  it('should return true for dates within the specified FY', () => {
    expect(isWithinFiscalYear(new Date('2024-05-15'), 'FY 2024-25')).toBe(true);
    expect(isWithinFiscalYear(new Date('2024-12-31'), 'FY 2024-25')).toBe(true);
    expect(isWithinFiscalYear(new Date('2025-03-31'), 'FY 2024-25')).toBe(true);
  });

  it('should return false for dates outside the specified FY', () => {
    expect(isWithinFiscalYear(new Date('2024-03-31'), 'FY 2024-25')).toBe(false);
    expect(isWithinFiscalYear(new Date('2025-04-01'), 'FY 2024-25')).toBe(false);
  });
});

describe('getFiscalYearDates', () => {
  it('should return correct start and end dates for FY', () => {
    const dates = getFiscalYearDates('FY 2024-25');
    expect(dates.start).toEqual(new Date(2024, 3, 1)); // April 1, 2024
    expect(dates.end).toEqual(new Date(2025, 2, 31));   // March 31, 2025
  });

  it('should handle Hindi fiscal year format', () => {
    const dates = getFiscalYearDates('वित्तीय वर्ष 2024-25');
    expect(dates.start).toEqual(new Date(2024, 3, 1));
    expect(dates.end).toEqual(new Date(2025, 2, 31));
  });

  it('should throw error for invalid format', () => {
    expect(() => getFiscalYearDates('2024-25')).toThrow('Invalid fiscal year format');
    expect(() => getFiscalYearDates('invalid')).toThrow('Invalid fiscal year format');
  });
});

describe('Integration tests', () => {
  it('should handle complete date formatting workflow', () => {
    const date = new Date('2024-06-15T14:30:00');

    const formattedDate = formatHindiDate(date);
    const formattedTime = formatHindiTime(date);
    const fiscalYear = getIndianFiscalYear(date);
    const quarter = getIndianFiscalQuarter(date);

    expect(formattedDate).toBe('15/06/2024');
    expect(formattedTime).toBe('14:30');
    expect(fiscalYear).toBe('FY 2024-25');
    expect(quarter.quarter).toBe(1);
  });

  it('should handle complete number formatting workflow', () => {
    const amount = 1250000;

    const formattedNumber = formatHindiNumber(amount, { decimals: 2 });
    const formattedCurrency = formatHindiCurrency(amount);
    const parsed = parseHindiCurrency(formattedCurrency);

    expect(formattedNumber).toBe('12,50,000.00');
    expect(formattedCurrency).toBe('₹12,50,000.00');
    expect(parsed).toBe(amount);
  });

  it('should handle Devanagari conversion workflow', () => {
    const amount = 100000;

    const hindiNumber = formatHindiNumber(amount, {
      decimals: 0,
      useDevanagari: true,
    });
    const hindiCurrency = formatHindiCurrency(amount, { useDevanagari: true });
    const parsedNumber = parseHindiNumber(hindiNumber);
    const parsedCurrency = parseHindiCurrency(hindiCurrency);

    expect(hindiNumber).toBe('१,००,०००');
    expect(hindiCurrency).toBe('₹१,००,०००.००');
    expect(parsedNumber).toBe(amount);
    expect(parsedCurrency).toBe(amount);
  });
});
