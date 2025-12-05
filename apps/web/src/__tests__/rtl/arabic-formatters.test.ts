/**
 * Arabic Formatters Tests
 *
 * Tests for Arabic number, currency, date, and other formatters
 */

import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatAddress,
  formatPhone,
  formatFileSize,
  formatOrdinal,
  toArabicIndic,
} from '@/lib/formatters/ar';

describe('toArabicIndic', () => {
  it('should convert Western numerals to Arabic-Indic', () => {
    expect(toArabicIndic('0123456789')).toBe('٠١٢٣٤٥٦٧٨٩');
  });

  it('should preserve non-numeric characters', () => {
    expect(toArabicIndic('Price: 100 SAR')).toBe('Price: ١٠٠ SAR');
  });
});

describe('formatNumber', () => {
  it('should format numbers in Arabic locale', () => {
    const result = formatNumber(1234567.89, { decimals: 2 });
    expect(result).toContain('1,234,567.89');
  });

  it('should format numbers with Arabic-Indic numerals', () => {
    const result = formatNumber(12345, { useArabicIndic: true });
    expect(result).toContain('١٢٣٤٥');
  });

  it('should respect decimal places', () => {
    const result = formatNumber(123.456, { decimals: 2 });
    expect(result).toContain('123.46');
  });

  it('should handle grouping option', () => {
    const result = formatNumber(1234567, { useGrouping: false });
    expect(result).toBe('1234567');
  });
});

describe('formatCurrency', () => {
  it('should format Saudi Riyal', () => {
    const result = formatCurrency(1000, 'SAR');
    expect(result).toContain('1,000.00');
    expect(result).toContain('ر.س');
  });

  it('should format UAE Dirham', () => {
    const result = formatCurrency(500, 'AED');
    expect(result).toContain('500.00');
    expect(result).toContain('د.إ');
  });

  it('should format with Arabic-Indic numerals', () => {
    const result = formatCurrency(1000, 'SAR', { useArabicIndic: true });
    expect(result).toContain('١٠٠٠');
  });

  it('should hide symbol when showSymbol is false', () => {
    const result = formatCurrency(1000, 'SAR', { showSymbol: false });
    expect(result).not.toContain('ر.س');
    expect(result).toContain('1,000.00');
  });

  it('should respect decimal places', () => {
    const result = formatCurrency(1000.5, 'SAR', { decimals: 0 });
    expect(result).not.toContain('.00');
  });
});

describe('formatPercentage', () => {
  it('should format percentage from 0-100 range', () => {
    const result = formatPercentage(75, { isDecimal: false });
    expect(result).toContain('75');
    expect(result).toContain('%');
  });

  it('should format percentage from 0-1 range', () => {
    const result = formatPercentage(0.75, { isDecimal: true });
    expect(result).toContain('75');
    expect(result).toContain('%');
  });

  it('should format with Arabic-Indic numerals', () => {
    const result = formatPercentage(85, { useArabicIndic: true, isDecimal: false });
    expect(result).toContain('٨٥');
  });

  it('should respect decimal places', () => {
    const result = formatPercentage(75.567, { decimals: 2, isDecimal: false });
    expect(result).toContain('75.57');
  });
});

describe('formatDate', () => {
  const testDate = new Date('2024-03-15T10:30:00');

  it('should format date in Arabic locale', () => {
    const result = formatDate(testDate);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should format with different date styles', () => {
    const short = formatDate(testDate, { dateStyle: 'short' });
    const long = formatDate(testDate, { dateStyle: 'long' });

    expect(short.length).toBeLessThan(long.length);
  });

  it('should include time when requested', () => {
    const result = formatDate(testDate, { includeTime: true });
    expect(result).toBeTruthy();
  });

  it('should handle string dates', () => {
    const result = formatDate('2024-03-15');
    expect(result).toBeTruthy();
  });

  it('should format with Arabic-Indic numerals', () => {
    const result = formatDate(testDate, { useArabicIndic: true });
    // Should contain Arabic-Indic digits
    expect(/[٠-٩]/.test(result)).toBe(true);
  });
});

describe('formatTime', () => {
  const testDate = new Date('2024-03-15T14:30:00');

  it('should format time in 12-hour format', () => {
    const result = formatTime(testDate, { hour12: true });
    expect(result).toBeTruthy();
  });

  it('should format time in 24-hour format', () => {
    const result = formatTime(testDate, { hour12: false });
    expect(result).toContain('14:30');
  });

  it('should include seconds when requested', () => {
    const withSeconds = formatTime(testDate, { includeSeconds: true });
    const withoutSeconds = formatTime(testDate, { includeSeconds: false });

    expect(withSeconds.length).toBeGreaterThan(withoutSeconds.length);
  });
});

describe('formatRelativeTime', () => {
  it('should format time in the past', () => {
    const pastDate = new Date(Date.now() - 60000); // 1 minute ago
    const result = formatRelativeTime(pastDate);
    expect(result).toBeTruthy();
  });

  it('should format time in the future', () => {
    const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
    const result = formatRelativeTime(futureDate);
    expect(result).toBeTruthy();
  });

  it('should handle different time units', () => {
    const minutesAgo = new Date(Date.now() - 120000);
    const hoursAgo = new Date(Date.now() - 7200000);
    const daysAgo = new Date(Date.now() - 172800000);

    expect(formatRelativeTime(minutesAgo)).toBeTruthy();
    expect(formatRelativeTime(hoursAgo)).toBeTruthy();
    expect(formatRelativeTime(daysAgo)).toBeTruthy();
  });
});

describe('formatAddress', () => {
  it('should format complete address', () => {
    const address = {
      building: 'Building 123',
      street: 'King Fahd Road',
      district: 'Al Olaya',
      city: 'Riyadh',
      postalCode: '12345',
      country: 'Saudi Arabia',
    };

    const result = formatAddress(address);
    expect(result).toContain('Building 123');
    expect(result).toContain('King Fahd Road');
    expect(result).toContain('Al Olaya');
    expect(result).toContain('Riyadh');
    expect(result).toContain('12345');
    expect(result).toContain('Saudi Arabia');
  });

  it('should handle partial address', () => {
    const address = {
      city: 'Dubai',
      country: 'UAE',
    };

    const result = formatAddress(address);
    expect(result).toBe('Dubai، UAE');
  });

  it('should handle empty address', () => {
    const result = formatAddress({});
    expect(result).toBe('');
  });
});

describe('formatPhone', () => {
  it('should format Saudi phone number', () => {
    const result = formatPhone('0501234567', 'SA');
    expect(result).toBe('050 123 4567');
  });

  it('should format UAE phone number', () => {
    const result = formatPhone('0501234567', 'AE');
    expect(result).toBe('050 123 4567');
  });

  it('should format with Arabic-Indic numerals', () => {
    const result = formatPhone('0501234567', 'SA', { useArabicIndic: true });
    expect(result).toContain('٠٥٠');
  });

  it('should handle phone numbers with non-digit characters', () => {
    const result = formatPhone('+966-50-123-4567', 'SA');
    expect(result).toBeTruthy();
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    const result = formatFileSize(500);
    expect(result).toContain('500');
    expect(result).toContain('بايت');
  });

  it('should format kilobytes', () => {
    const result = formatFileSize(1024);
    expect(result).toContain('كيلوبايت');
  });

  it('should format megabytes', () => {
    const result = formatFileSize(1024 * 1024);
    expect(result).toContain('ميغابايت');
  });

  it('should format with Arabic-Indic numerals', () => {
    const result = formatFileSize(1024, { useArabicIndic: true });
    expect(/[٠-٩]/.test(result)).toBe(true);
  });

  it('should respect decimal places', () => {
    const result = formatFileSize(1536, { decimals: 1 });
    expect(result).toContain('1.5');
  });
});

describe('formatOrdinal', () => {
  it('should format masculine ordinals', () => {
    expect(formatOrdinal(1, 'm')).toBe('الأول');
    expect(formatOrdinal(2, 'm')).toBe('الثاني');
    expect(formatOrdinal(3, 'm')).toBe('الثالث');
  });

  it('should format feminine ordinals', () => {
    expect(formatOrdinal(1, 'f')).toBe('الأولى');
    expect(formatOrdinal(2, 'f')).toBe('الثانية');
    expect(formatOrdinal(3, 'f')).toBe('الثالثة');
  });

  it('should default to masculine', () => {
    expect(formatOrdinal(1)).toBe('الأول');
  });

  it('should handle numbers beyond the ordinal list', () => {
    expect(formatOrdinal(15, 'm')).toBe('15');
  });
});
