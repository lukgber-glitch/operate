/**
 * Japanese Fiscal Year Service Tests
 */

import {
  JapaneseFiscalYearService,
  createStandardJapaneseFiscalYear,
  createCustomFiscalYear,
} from '../jp-fiscal-year.service';
import {
  toJapaneseYear,
  toWesternYear,
  formatJapaneseDate,
  getCurrentJapaneseYear,
  isYearInEra,
  parseJapaneseDate,
  JAPANESE_ERAS,
} from '../japanese-era';

describe('Japanese Fiscal Year Service', () => {
  let service: JapaneseFiscalYearService;

  beforeEach(() => {
    service = createStandardJapaneseFiscalYear();
  });

  describe('Standard Fiscal Year (April-March)', () => {
    it('should get correct fiscal year for dates in first half', () => {
      // January 2024 should be in FY2023 (started April 2023)
      const jan2024 = new Date('2024-01-15');
      const fy = service.getFiscalYear(jan2024);

      expect(fy.fiscalYear).toBe(2023);
      expect(fy.startDate).toEqual(new Date('2023-04-01'));
    });

    it('should get correct fiscal year for dates in second half', () => {
      // May 2024 should be in FY2024 (started April 2024)
      const may2024 = new Date('2024-05-15');
      const fy = service.getFiscalYear(may2024);

      expect(fy.fiscalYear).toBe(2024);
      expect(fy.startDate).toEqual(new Date('2024-04-01'));
    });

    it('should handle fiscal year boundary - April 1st', () => {
      // April 1, 2024 is the first day of FY2024
      const april1 = new Date('2024-04-01');
      const fy = service.getFiscalYear(april1);

      expect(fy.fiscalYear).toBe(2024);
      expect(fy.startDate).toEqual(new Date('2024-04-01'));
    });

    it('should handle fiscal year boundary - March 31st', () => {
      // March 31, 2024 is the last day of FY2023
      const march31 = new Date('2024-03-31');
      const fy = service.getFiscalYear(march31);

      expect(fy.fiscalYear).toBe(2023);
      expect(fy.endDate).toEqual(new Date('2024-03-31T23:59:59.999Z'));
    });

    it('should format fiscal year with Japanese era', () => {
      const april2024 = new Date('2024-04-01');
      const fy = service.getFiscalYear(april2024);

      expect(fy.formatted).toContain('令和');
      expect(fy.formatted).toContain('年度');
      expect(fy.japaneseYear).toBeDefined();
    });

    it('should get fiscal year by number', () => {
      const fy2024 = service.getFiscalYearByNumber(2024);

      expect(fy2024.fiscalYear).toBe(2024);
      expect(fy2024.startDate).toEqual(new Date('2024-04-01'));
      expect(fy2024.endDate.getFullYear()).toBe(2025);
      expect(fy2024.endDate.getMonth()).toBe(2); // March (0-indexed)
    });
  });

  describe('Previous and Next Fiscal Years', () => {
    it('should get previous fiscal year', () => {
      const may2024 = new Date('2024-05-15'); // FY2024
      const previousFY = service.getPreviousFiscalYear(may2024);

      expect(previousFY.fiscalYear).toBe(2023);
      expect(previousFY.startDate).toEqual(new Date('2023-04-01'));
    });

    it('should get next fiscal year', () => {
      const may2024 = new Date('2024-05-15'); // FY2024
      const nextFY = service.getNextFiscalYear(may2024);

      expect(nextFY.fiscalYear).toBe(2025);
      expect(nextFY.startDate).toEqual(new Date('2025-04-01'));
    });
  });

  describe('Fiscal Quarters', () => {
    it('should get all four quarters for fiscal year', () => {
      const quarters = service.getFiscalQuarters(2024);

      expect(quarters).toHaveLength(4);

      // Q1: April-June
      expect(quarters[0].startDate.getMonth()).toBe(3); // April (0-indexed)
      expect(quarters[0].endDate.getMonth()).toBe(5); // June

      // Q2: July-September
      expect(quarters[1].startDate.getMonth()).toBe(6); // July
      expect(quarters[1].endDate.getMonth()).toBe(8); // September

      // Q3: October-December
      expect(quarters[2].startDate.getMonth()).toBe(9); // October
      expect(quarters[2].endDate.getMonth()).toBe(11); // December

      // Q4: January-March
      expect(quarters[3].startDate.getMonth()).toBe(0); // January
      expect(quarters[3].endDate.getMonth()).toBe(2); // March
    });

    it('should format quarters correctly', () => {
      const quarters = service.getFiscalQuarters(2024);

      quarters.forEach((quarter, index) => {
        expect(quarter.formatted).toContain(`Q${index + 1}`);
      });
    });
  });

  describe('Fiscal Months', () => {
    it('should get all 12 months for fiscal year', () => {
      const months = service.getFiscalMonths(2024);

      expect(months).toHaveLength(12);

      // First month should be April
      expect(months[0].startDate.getMonth()).toBe(3); // April

      // Last month should be March (next year)
      expect(months[11].startDate.getMonth()).toBe(2); // March
      expect(months[11].startDate.getFullYear()).toBe(2025);
    });

    it('should format months correctly', () => {
      const months = service.getFiscalMonths(2024);

      expect(months[0].formatted).toContain('4月'); // April
      expect(months[11].formatted).toContain('3月'); // March
    });
  });

  describe('Date Validation', () => {
    it('should check if date is in fiscal year', () => {
      const may2024 = new Date('2024-05-15');
      expect(service.isDateInFiscalYear(may2024, 2024)).toBe(true);
      expect(service.isDateInFiscalYear(may2024, 2023)).toBe(false);
    });

    it('should handle boundary dates', () => {
      const april1 = new Date('2024-04-01');
      const march31 = new Date('2024-03-31');

      expect(service.isDateInFiscalYear(april1, 2024)).toBe(true);
      expect(service.isDateInFiscalYear(march31, 2024)).toBe(false);
      expect(service.isDateInFiscalYear(march31, 2023)).toBe(true);
    });
  });

  describe('Fiscal Year Metrics', () => {
    it('should calculate total days in fiscal year', () => {
      const days = service.getFiscalYearDays(2024);
      expect(days).toBe(366); // 2024 is a leap year
    });

    it('should calculate business days in fiscal year', () => {
      const businessDays = service.getFiscalYearBusinessDays(2024);
      expect(businessDays).toBeGreaterThan(0);
      expect(businessDays).toBeLessThan(366);
      // Rough estimate: ~260 business days per year
      expect(businessDays).toBeGreaterThan(250);
      expect(businessDays).toBeLessThan(270);
    });

    it('should calculate fiscal year progress', () => {
      // Start of fiscal year
      const start = new Date('2024-04-01');
      const progressStart = service.getFiscalYearProgress(start);
      expect(progressStart).toBe(0);

      // Mid fiscal year (around October)
      const mid = new Date('2024-10-01');
      const progressMid = service.getFiscalYearProgress(mid);
      expect(progressMid).toBeGreaterThan(0.4);
      expect(progressMid).toBeLessThan(0.6);

      // End of fiscal year
      const end = new Date('2025-03-31T23:59:59');
      const progressEnd = service.getFiscalYearProgress(end);
      expect(progressEnd).toBeCloseTo(1, 2);
    });
  });

  describe('Format Fiscal Year Range', () => {
    it('should format range in Japanese with era', () => {
      const range = service.formatFiscalYearRange(2024, 'ja-JP');

      expect(range).toContain('令和');
      expect(range).toContain('年');
      expect(range).toContain('月');
      expect(range).toContain('日');
      expect(range).toContain('〜');
    });

    it('should format range in English', () => {
      const serviceNoEra = createCustomFiscalYear({ useJapaneseEra: false });
      const range = serviceNoEra.formatFiscalYearRange(2024, 'en-US');

      expect(range).toContain('April');
      expect(range).toContain('March');
      expect(range).toContain('-');
    });
  });

  describe('Custom Fiscal Year Configuration', () => {
    it('should support custom start month', () => {
      // January start (calendar year)
      const customService = createCustomFiscalYear({ startMonth: 1 });
      const jan2024 = new Date('2024-01-15');
      const fy = customService.getFiscalYear(jan2024);

      expect(fy.fiscalYear).toBe(2024);
      expect(fy.startDate).toEqual(new Date('2024-01-01'));
    });

    it('should support July start (common for some organizations)', () => {
      const julyService = createCustomFiscalYear({ startMonth: 7 });
      const aug2024 = new Date('2024-08-15');
      const fy = julyService.getFiscalYear(aug2024);

      expect(fy.fiscalYear).toBe(2024);
      expect(fy.startDate).toEqual(new Date('2024-07-01'));
    });

    it('should support disabling Japanese era', () => {
      const noEraService = createCustomFiscalYear({ useJapaneseEra: false });
      const fy = noEraService.getCurrentFiscalYear();

      expect(fy.japaneseYear).toBeUndefined();
      expect(fy.formatted).toContain('年度');
      expect(fy.formatted).not.toContain('令和');
    });

    it('should support end year naming convention', () => {
      // Some organizations name FY by the ending year
      const endYearService = createCustomFiscalYear({
        yearNamingConvention: 'end',
      });
      const may2024 = new Date('2024-05-15');
      const fy = endYearService.getFiscalYear(may2024);

      // FY2025 (ends March 2025)
      expect(fy.fiscalYear).toBe(2025);
    });
  });
});

describe('Japanese Era Utilities', () => {
  describe('toJapaneseYear', () => {
    it('should convert Reiwa years correctly', () => {
      const result = toJapaneseYear(2024);

      expect(result).toBeDefined();
      expect(result?.eraName).toBe('Reiwa');
      expect(result?.eraNameJa).toBe('令和');
      expect(result?.eraYear).toBe(6); // 2024 = Reiwa 6
      expect(result?.westernYear).toBe(2024);
    });

    it('should convert Heisei years correctly', () => {
      const result = toJapaneseYear(2000);

      expect(result).toBeDefined();
      expect(result?.eraName).toBe('Heisei');
      expect(result?.eraNameJa).toBe('平成');
      expect(result?.eraYear).toBe(12); // 2000 = Heisei 12
    });

    it('should handle era transition year 2019', () => {
      // April 30, 2019 - Last day of Heisei
      const heisei = toJapaneseYear(2019, 4, 30);
      expect(heisei?.eraName).toBe('Heisei');

      // May 1, 2019 - First day of Reiwa
      const reiwa = toJapaneseYear(2019, 5, 1);
      expect(reiwa?.eraName).toBe('Reiwa');
      expect(reiwa?.eraYear).toBe(1);
    });

    it('should format Japanese year correctly', () => {
      const result = toJapaneseYear(2024);

      expect(result?.formatted).toBe('令和6年');
      expect(result?.formattedRomaji).toBe('Reiwa 6');
    });
  });

  describe('toWesternYear', () => {
    it('should convert from Reiwa era', () => {
      expect(toWesternYear('Reiwa', 1)).toBe(2019);
      expect(toWesternYear('Reiwa', 6)).toBe(2024);
      expect(toWesternYear('令和', 6)).toBe(2024);
    });

    it('should convert from Heisei era', () => {
      expect(toWesternYear('Heisei', 1)).toBe(1989);
      expect(toWesternYear('Heisei', 31)).toBe(2019);
      expect(toWesternYear('平成', 12)).toBe(2000);
    });

    it('should return null for invalid era', () => {
      expect(toWesternYear('InvalidEra', 1)).toBeNull();
    });

    it('should return null for year beyond era end', () => {
      // Heisei ended in 2019 (year 31)
      expect(toWesternYear('Heisei', 32)).toBeNull();
    });
  });

  describe('formatJapaneseDate', () => {
    it('should format in full format', () => {
      const date = new Date('2024-12-03');
      const formatted = formatJapaneseDate(date, 'full');

      expect(formatted).toContain('令和');
      expect(formatted).toContain('年');
      expect(formatted).toContain('月');
      expect(formatted).toContain('日');
    });

    it('should format in short format', () => {
      const date = new Date('2024-12-03');
      const formatted = formatJapaneseDate(date, 'short');

      expect(formatted).toMatch(/^R\d+\.\d+\.\d+$/);
      expect(formatted).toContain('R6'); // Reiwa 6
    });

    it('should format in year-only format', () => {
      const date = new Date('2024-12-03');
      const formatted = formatJapaneseDate(date, 'year-only');

      expect(formatted).toBe('令和6年');
    });
  });

  describe('getCurrentJapaneseYear', () => {
    it('should return current era year', () => {
      const current = getCurrentJapaneseYear();

      expect(current).toBeDefined();
      expect(current?.eraName).toBe('Reiwa');
      expect(current?.westernYear).toBeGreaterThanOrEqual(2019);
    });
  });

  describe('isYearInEra', () => {
    it('should check if year is in Reiwa era', () => {
      expect(isYearInEra(2024, 'Reiwa')).toBe(true);
      expect(isYearInEra(2019, 'Reiwa')).toBe(true);
      expect(isYearInEra(2018, 'Reiwa')).toBe(false);
    });

    it('should check if year is in Heisei era', () => {
      expect(isYearInEra(2000, 'Heisei')).toBe(true);
      expect(isYearInEra(1989, 'Heisei')).toBe(true);
      expect(isYearInEra(2020, 'Heisei')).toBe(false);
    });

    it('should accept Japanese era names', () => {
      expect(isYearInEra(2024, '令和')).toBe(true);
      expect(isYearInEra(2000, '平成')).toBe(true);
    });
  });

  describe('parseJapaneseDate', () => {
    it('should parse full format dates', () => {
      const date = parseJapaneseDate('令和6年12月3日');

      expect(date).toBeDefined();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(11); // December (0-indexed)
      expect(date?.getDate()).toBe(3);
    });

    it('should parse short format dates', () => {
      const date = parseJapaneseDate('R6.12.3');

      expect(date).toBeDefined();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(3);
    });

    it('should parse Heisei dates', () => {
      const date = parseJapaneseDate('平成12年1月1日');

      expect(date).toBeDefined();
      expect(date?.getFullYear()).toBe(2000);
      expect(date?.getMonth()).toBe(0); // January
      expect(date?.getDate()).toBe(1);
    });

    it('should return null for invalid format', () => {
      expect(parseJapaneseDate('invalid date')).toBeNull();
      expect(parseJapaneseDate('2024-12-03')).toBeNull();
    });
  });

  describe('JAPANESE_ERAS constant', () => {
    it('should have Reiwa as current era', () => {
      expect(JAPANESE_ERAS[0].name).toBe('Reiwa');
      expect(JAPANESE_ERAS[0].nameJa).toBe('令和');
      expect(JAPANESE_ERAS[0].startYear).toBe(2019);
      expect(JAPANESE_ERAS[0].endYear).toBeUndefined();
    });

    it('should have correct historical eras', () => {
      const eraNames = JAPANESE_ERAS.map((e) => e.name);
      expect(eraNames).toContain('Reiwa');
      expect(eraNames).toContain('Heisei');
      expect(eraNames).toContain('Showa');
      expect(eraNames).toContain('Taisho');
      expect(eraNames).toContain('Meiji');
    });

    it('should have eras in chronological order (newest first)', () => {
      for (let i = 0; i < JAPANESE_ERAS.length - 1; i++) {
        expect(JAPANESE_ERAS[i].startYear).toBeGreaterThan(
          JAPANESE_ERAS[i + 1].startYear
        );
      }
    });
  });
});
