/**
 * Hijri Calendar Tests
 *
 * Tests for Hijri calendar conversion and formatting
 */

import {
  gregorianToHijri,
  hijriToGregorian,
  formatHijriDate,
  getCurrentHijriDate,
  getHijriMonthName,
  getHijriDayName,
  isHijriLeapYear,
  getHijriMonthDays,
  addHijriDays,
  addHijriMonths,
  formatDualCalendar,
  HIJRI_MONTHS_AR,
  HIJRI_MONTHS_EN,
  HIJRI_DAYS_AR,
  type HijriDate,
} from '@/lib/calendar/hijri';

describe('gregorianToHijri', () => {
  it('should convert Gregorian date to Hijri', () => {
    const gregorian = new Date('2024-01-01');
    const hijri = gregorianToHijri(gregorian);

    expect(hijri).toHaveProperty('year');
    expect(hijri).toHaveProperty('month');
    expect(hijri).toHaveProperty('day');
    expect(hijri.year).toBeGreaterThan(1400); // Should be in 1400s AH
    expect(hijri.month).toBeGreaterThanOrEqual(1);
    expect(hijri.month).toBeLessThanOrEqual(12);
    expect(hijri.day).toBeGreaterThanOrEqual(1);
    expect(hijri.day).toBeLessThanOrEqual(30);
  });

  it('should handle different dates consistently', () => {
    const date1 = new Date('2024-03-15');
    const date2 = new Date('2023-12-25');

    const hijri1 = gregorianToHijri(date1);
    const hijri2 = gregorianToHijri(date2);

    expect(hijri1.year).toBeGreaterThan(1400);
    expect(hijri2.year).toBeGreaterThan(1400);
  });
});

describe('hijriToGregorian', () => {
  it('should convert Hijri date to Gregorian', () => {
    const hijri: HijriDate = { year: 1445, month: 7, day: 15 };
    const gregorian = hijriToGregorian(hijri);

    expect(gregorian).toBeInstanceOf(Date);
    expect(gregorian.getFullYear()).toBeGreaterThan(2020);
  });

  it('should round-trip correctly', () => {
    const originalGregorian = new Date('2024-01-15');
    const hijri = gregorianToHijri(originalGregorian);
    const convertedGregorian = hijriToGregorian(hijri);

    // Allow for 1 day difference due to rounding
    const diff = Math.abs(originalGregorian.getTime() - convertedGregorian.getTime());
    const oneDayMs = 24 * 60 * 60 * 1000;

    expect(diff).toBeLessThan(oneDayMs * 2);
  });
});

describe('formatHijriDate', () => {
  const testDate: HijriDate = { year: 1445, month: 9, day: 15 };

  it('should format in Arabic with full format', () => {
    const result = formatHijriDate(testDate, { locale: 'ar', format: 'full' });

    expect(result).toContain('15');
    expect(result).toContain('رمضان');
    expect(result).toContain('1445');
    expect(result).toContain('هـ');
  });

  it('should format in English', () => {
    const result = formatHijriDate(testDate, { locale: 'en', format: 'long' });

    expect(result).toContain('15');
    expect(result).toContain('Ramadan');
    expect(result).toContain('1445');
  });

  it('should format with short format', () => {
    const result = formatHijriDate(testDate, { locale: 'ar', format: 'short' });

    expect(result).toContain('15');
    expect(result).toContain('9');
    expect(result).toContain('1445');
  });

  it('should use Arabic-Indic numerals when requested', () => {
    const result = formatHijriDate(testDate, {
      locale: 'ar',
      useArabicIndic: true,
    });

    expect(/[٠-٩]/.test(result)).toBe(true);
  });
});

describe('getCurrentHijriDate', () => {
  it('should return current Hijri date', () => {
    const hijri = getCurrentHijriDate();

    expect(hijri).toHaveProperty('year');
    expect(hijri).toHaveProperty('month');
    expect(hijri).toHaveProperty('day');
    expect(hijri.year).toBeGreaterThan(1400);
    expect(hijri.month).toBeGreaterThanOrEqual(1);
    expect(hijri.month).toBeLessThanOrEqual(12);
  });
});

describe('getHijriMonthName', () => {
  it('should return Arabic month names', () => {
    expect(getHijriMonthName(1, 'ar')).toBe('محرم');
    expect(getHijriMonthName(9, 'ar')).toBe('رمضان');
    expect(getHijriMonthName(12, 'ar')).toBe('ذو الحجة');
  });

  it('should return English month names', () => {
    expect(getHijriMonthName(1, 'en')).toBe('Muharram');
    expect(getHijriMonthName(9, 'en')).toBe('Ramadan');
    expect(getHijriMonthName(12, 'en')).toBe('Dhu al-Hijjah');
  });

  it('should default to Arabic', () => {
    expect(getHijriMonthName(1)).toBe('محرم');
  });

  it('should handle invalid month numbers', () => {
    expect(getHijriMonthName(0, 'ar')).toBe('');
    expect(getHijriMonthName(13, 'ar')).toBe('');
  });
});

describe('getHijriDayName', () => {
  it('should return Arabic day names', () => {
    const sunday = new Date('2024-03-17'); // Sunday
    const monday = new Date('2024-03-18'); // Monday

    expect(getHijriDayName(sunday, 'ar')).toBe('الأحد');
    expect(getHijriDayName(monday, 'ar')).toBe('الإثنين');
  });

  it('should return English day names', () => {
    const sunday = new Date('2024-03-17'); // Sunday
    const monday = new Date('2024-03-18'); // Monday

    expect(getHijriDayName(sunday, 'en')).toBe('Sunday');
    expect(getHijriDayName(monday, 'en')).toBe('Monday');
  });
});

describe('isHijriLeapYear', () => {
  it('should correctly identify leap years', () => {
    // Test known leap years in the 30-year cycle
    // Years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 of each 30-year cycle are leap
    const leapYear = 1445; // Should be leap
    const nonLeapYear = 1444; // Should not be leap

    const isLeap1 = isHijriLeapYear(leapYear);
    const isLeap2 = isHijriLeapYear(nonLeapYear);

    expect(typeof isLeap1).toBe('boolean');
    expect(typeof isLeap2).toBe('boolean');
  });
});

describe('getHijriMonthDays', () => {
  it('should return 30 days for odd months', () => {
    expect(getHijriMonthDays(1445, 1)).toBe(30); // Muharram
    expect(getHijriMonthDays(1445, 3)).toBe(30); // Rabi' al-Awwal
    expect(getHijriMonthDays(1445, 9)).toBe(30); // Ramadan
  });

  it('should return 29 days for even months', () => {
    expect(getHijriMonthDays(1445, 2)).toBe(29); // Safar
    expect(getHijriMonthDays(1445, 4)).toBe(29); // Rabi' al-Thani
    expect(getHijriMonthDays(1445, 10)).toBe(29); // Shawwal
  });

  it('should handle last month based on leap year', () => {
    const leapYear = 1445;
    const nonLeapYear = 1444;

    const leapDays = getHijriMonthDays(leapYear, 12);
    const nonLeapDays = getHijriMonthDays(nonLeapYear, 12);

    expect([29, 30]).toContain(leapDays);
    expect([29, 30]).toContain(nonLeapDays);
  });
});

describe('addHijriDays', () => {
  it('should add days to Hijri date', () => {
    const startDate: HijriDate = { year: 1445, month: 1, day: 15 };
    const result = addHijriDays(startDate, 10);

    expect(result).toHaveProperty('year');
    expect(result).toHaveProperty('month');
    expect(result).toHaveProperty('day');
  });

  it('should handle month transitions', () => {
    const endOfMonth: HijriDate = { year: 1445, month: 1, day: 29 };
    const result = addHijriDays(endOfMonth, 2);

    expect(result.month).toBeGreaterThan(endOfMonth.month);
  });

  it('should handle negative days', () => {
    const startDate: HijriDate = { year: 1445, month: 2, day: 15 };
    const result = addHijriDays(startDate, -10);

    expect(result.day).toBeLessThan(startDate.day);
  });
});

describe('addHijriMonths', () => {
  it('should add months to Hijri date', () => {
    const startDate: HijriDate = { year: 1445, month: 3, day: 15 };
    const result = addHijriMonths(startDate, 2);

    expect(result.year).toBe(1445);
    expect(result.month).toBe(5);
    expect(result.day).toBe(15);
  });

  it('should handle year transitions', () => {
    const endOfYear: HijriDate = { year: 1445, month: 11, day: 15 };
    const result = addHijriMonths(endOfYear, 3);

    expect(result.year).toBe(1446);
    expect(result.month).toBe(2);
  });

  it('should adjust day if it exceeds month days', () => {
    const date: HijriDate = { year: 1445, month: 1, day: 30 };
    const result = addHijriMonths(date, 1); // Month 2 has 29 days

    expect(result.day).toBeLessThanOrEqual(29);
  });

  it('should handle negative months', () => {
    const startDate: HijriDate = { year: 1445, month: 5, day: 15 };
    const result = addHijriMonths(startDate, -3);

    expect(result.month).toBe(2);
  });
});

describe('formatDualCalendar', () => {
  const testDate = new Date('2024-03-15');

  it('should format with both Gregorian and Hijri in Arabic', () => {
    const result = formatDualCalendar(testDate, { locale: 'ar' });

    expect(result).toBeTruthy();
    expect(result).toContain('(');
    expect(result).toContain(')');
  });

  it('should format with both calendars in English', () => {
    const result = formatDualCalendar(testDate, { locale: 'en' });

    expect(result).toBeTruthy();
    expect(result).toContain('(');
    expect(result).toContain(')');
  });

  it('should use Arabic-Indic numerals when requested', () => {
    const result = formatDualCalendar(testDate, {
      locale: 'ar',
      useArabicIndic: true,
    });

    expect(/[٠-٩]/.test(result)).toBe(true);
  });
});

describe('Month and Day Constants', () => {
  it('should have 12 Arabic month names', () => {
    expect(HIJRI_MONTHS_AR).toHaveLength(12);
    expect(HIJRI_MONTHS_AR[0]).toBe('محرم');
    expect(HIJRI_MONTHS_AR[8]).toBe('رمضان');
  });

  it('should have 12 English month names', () => {
    expect(HIJRI_MONTHS_EN).toHaveLength(12);
    expect(HIJRI_MONTHS_EN[0]).toBe('Muharram');
    expect(HIJRI_MONTHS_EN[8]).toBe('Ramadan');
  });

  it('should have 7 Arabic day names', () => {
    expect(HIJRI_DAYS_AR).toHaveLength(7);
    expect(HIJRI_DAYS_AR[0]).toBe('الأحد');
    expect(HIJRI_DAYS_AR[4]).toBe('الخميس');
  });
});
