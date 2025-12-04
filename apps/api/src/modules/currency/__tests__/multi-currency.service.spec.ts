import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MultiCurrencyService } from '../multi-currency.service';

describe('MultiCurrencyService', () => {
  let service: MultiCurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MultiCurrencyService],
    }).compile();

    service = module.get<MultiCurrencyService>(MultiCurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllCurrencies', () => {
    it('should return all supported currencies', () => {
      const currencies = service.getAllCurrencies();
      expect(currencies).toBeDefined();
      expect(currencies.length).toBeGreaterThan(20);
      expect(currencies[0]).toHaveProperty('code');
      expect(currencies[0]).toHaveProperty('symbol');
      expect(currencies[0]).toHaveProperty('name');
    });
  });

  describe('getSupportedCurrencyCodes', () => {
    it('should return array of currency codes', () => {
      const codes = service.getSupportedCurrencyCodes();
      expect(codes).toContain('USD');
      expect(codes).toContain('EUR');
      expect(codes).toContain('GBP');
      expect(codes).toContain('CHF');
      expect(codes).toContain('JPY');
      expect(codes.length).toBeGreaterThan(20);
    });
  });

  describe('getCurrency', () => {
    it('should return USD currency details', () => {
      const usd = service.getCurrency('USD');
      expect(usd.code).toBe('USD');
      expect(usd.symbol).toBe('$');
      expect(usd.name).toBe('US Dollar');
      expect(usd.decimals).toBe(2);
      expect(usd.format).toBe('before');
    });

    it('should return EUR currency details', () => {
      const eur = service.getCurrency('EUR');
      expect(eur.code).toBe('EUR');
      expect(eur.symbol).toBe('€');
      expect(eur.name).toBe('Euro');
      expect(eur.decimals).toBe(2);
      expect(eur.format).toBe('after');
    });

    it('should handle case-insensitive input', () => {
      const usd1 = service.getCurrency('usd');
      const usd2 = service.getCurrency('USD');
      expect(usd1.code).toBe(usd2.code);
    });

    it('should throw error for unsupported currency', () => {
      expect(() => service.getCurrency('XYZ')).toThrow(BadRequestException);
    });
  });

  describe('isCurrencySupported', () => {
    it('should return true for supported currencies', () => {
      expect(service.isCurrencySupported('USD')).toBe(true);
      expect(service.isCurrencySupported('EUR')).toBe(true);
      expect(service.isCurrencySupported('JPY')).toBe(true);
    });

    it('should return false for unsupported currencies', () => {
      expect(service.isCurrencySupported('XYZ')).toBe(false);
      expect(service.isCurrencySupported('ABC')).toBe(false);
    });

    it('should handle case-insensitive input', () => {
      expect(service.isCurrencySupported('usd')).toBe(true);
      expect(service.isCurrencySupported('UsD')).toBe(true);
    });
  });

  describe('getCurrencyByCountry', () => {
    it('should return USD for United States', () => {
      const currency = service.getCurrencyByCountry('US');
      expect(currency?.code).toBe('USD');
    });

    it('should return EUR for Germany', () => {
      const currency = service.getCurrencyByCountry('DE');
      expect(currency?.code).toBe('EUR');
    });

    it('should return GBP for United Kingdom', () => {
      const currency = service.getCurrencyByCountry('GB');
      expect(currency?.code).toBe('GBP');
    });

    it('should return CHF for Switzerland', () => {
      const currency = service.getCurrencyByCountry('CH');
      expect(currency?.code).toBe('CHF');
    });

    it('should return JPY for Japan', () => {
      const currency = service.getCurrencyByCountry('JP');
      expect(currency?.code).toBe('JPY');
    });

    it('should return null for unknown country', () => {
      const currency = service.getCurrencyByCountry('XX');
      expect(currency).toBeNull();
    });
  });

  describe('convert', () => {
    it('should convert USD to EUR with given rate', () => {
      const result = service.convert(100, 'USD', 'EUR', 0.92);
      expect(result).toBe(92);
    });

    it('should convert EUR to USD with given rate', () => {
      const result = service.convert(100, 'EUR', 'USD', 1.09);
      expect(result).toBe(109);
    });

    it('should handle same currency conversion', () => {
      const result = service.convert(100, 'USD', 'USD');
      expect(result).toBe(100);
    });

    it('should round to currency decimals', () => {
      const result = service.convert(100, 'USD', 'JPY', 150.25);
      expect(result).toBe(15025); // JPY has 0 decimals
    });

    it('should default to 1:1 rate if not provided', () => {
      const result = service.convert(100, 'USD', 'EUR');
      expect(result).toBe(100);
    });

    it('should throw error for invalid rate', () => {
      expect(() => service.convert(100, 'USD', 'EUR', -1)).toThrow(
        BadRequestException,
      );
      expect(() => service.convert(100, 'USD', 'EUR', 0)).toThrow(
        BadRequestException,
      );
    });

    it('should throw error for invalid currency', () => {
      expect(() => service.convert(100, 'XYZ', 'EUR', 1)).toThrow(
        BadRequestException,
      );
      expect(() => service.convert(100, 'USD', 'XYZ', 1)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('formatAmount', () => {
    it('should format USD amount', () => {
      const formatted = service.formatAmount(1234.56, 'USD');
      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('$');
    });

    it('should format EUR amount', () => {
      const formatted = service.formatAmount(1234.56, 'EUR', 'de-DE');
      expect(formatted).toContain('1.234,56');
      expect(formatted).toContain('€');
    });

    it('should format JPY amount (no decimals)', () => {
      const formatted = service.formatAmount(1234, 'JPY');
      expect(formatted).not.toContain(',56');
      expect(formatted).toContain('¥');
    });

    it('should format GBP amount', () => {
      const formatted = service.formatAmount(1234.56, 'GBP');
      expect(formatted).toContain('£');
    });

    it('should format CHF amount', () => {
      const formatted = service.formatAmount(1234.56, 'CHF', 'de-CH');
      expect(formatted).toContain('CHF');
    });

    it('should support showCode option', () => {
      const formatted = service.formatAmount(1234.56, 'USD', undefined, {
        showCode: true,
      });
      expect(formatted).toContain('USD');
    });

    it('should support showSymbol false option', () => {
      const formatted = service.formatAmount(1234.56, 'USD', undefined, {
        showSymbol: false,
      });
      expect(formatted).not.toContain('$');
    });
  });

  describe('parseAmount', () => {
    it('should parse USD amount', () => {
      expect(service.parseAmount('$1,234.56', 'USD')).toBe(1234.56);
      expect(service.parseAmount('1234.56', 'USD')).toBe(1234.56);
      expect(service.parseAmount('1,234.56', 'USD')).toBe(1234.56);
    });

    it('should parse EUR amount (German format)', () => {
      expect(service.parseAmount('1.234,56 €', 'EUR', 'de-DE')).toBe(1234.56);
      expect(service.parseAmount('1234,56', 'EUR', 'de-DE')).toBe(1234.56);
    });

    it('should parse JPY amount (no decimals)', () => {
      expect(service.parseAmount('¥1,234', 'JPY')).toBe(1234);
      expect(service.parseAmount('1234', 'JPY')).toBe(1234);
    });

    it('should parse GBP amount', () => {
      expect(service.parseAmount('£1,234.56', 'GBP')).toBe(1234.56);
    });

    it('should handle amount without symbol', () => {
      expect(service.parseAmount('1234.56', 'USD')).toBe(1234.56);
    });

    it('should handle amount with spaces', () => {
      expect(service.parseAmount('1 234.56', 'USD')).toBe(1234.56);
      expect(service.parseAmount('1 234,56', 'EUR', 'de-DE')).toBe(1234.56);
    });

    it('should throw error for invalid input', () => {
      expect(() => service.parseAmount('abc', 'USD')).toThrow(
        BadRequestException,
      );
      expect(() => service.parseAmount('', 'USD')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('roundToDecimals', () => {
    it('should round to 2 decimals for USD', () => {
      expect(service.roundToDecimals(1234.5678, 'USD')).toBe(1234.57);
      expect(service.roundToDecimals(1234.5623, 'USD')).toBe(1234.56);
    });

    it('should round to 0 decimals for JPY', () => {
      expect(service.roundToDecimals(1234.56, 'JPY')).toBe(1235);
      expect(service.roundToDecimals(1234.49, 'JPY')).toBe(1234);
    });

    it('should handle CHF cash rounding', () => {
      // CHF uses 0.05 rounding for cash
      expect(service.roundToDecimals(1234.56, 'CHF')).toBe(1234.55);
      expect(service.roundToDecimals(1234.57, 'CHF')).toBe(1234.55);
      expect(service.roundToDecimals(1234.58, 'CHF')).toBe(1234.6);
    });
  });

  describe('getCurrencyWithExamples', () => {
    it('should return currency with formatted examples', () => {
      const result = service.getCurrencyWithExamples('USD');
      expect(result.code).toBe('USD');
      expect(result.examples).toBeDefined();
      expect(result.examples.small).toBeDefined();
      expect(result.examples.medium).toBeDefined();
      expect(result.examples.large).toBeDefined();
    });
  });

  describe('getCurrenciesByRegion', () => {
    it('should return currencies grouped by region', () => {
      const regions = service.getCurrenciesByRegion();
      expect(regions['North America']).toBeDefined();
      expect(regions['Europe']).toBeDefined();
      expect(regions['Asia']).toBeDefined();
      expect(regions['North America'].some((c) => c.code === 'USD')).toBe(true);
      expect(regions['Europe'].some((c) => c.code === 'EUR')).toBe(true);
      expect(regions['Asia'].some((c) => c.code === 'JPY')).toBe(true);
    });
  });

  describe('validateCurrencyCode', () => {
    it('should not throw for valid currency codes', () => {
      expect(() => service.validateCurrencyCode('USD')).not.toThrow();
      expect(() => service.validateCurrencyCode('EUR')).not.toThrow();
    });

    it('should throw for invalid currency codes', () => {
      expect(() => service.validateCurrencyCode('XYZ')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('compareCurrencies', () => {
    it('should compare two currencies', () => {
      const comparison = service.compareCurrencies('USD', 'EUR');
      expect(comparison.currency1.code).toBe('USD');
      expect(comparison.currency2.code).toBe('EUR');
      expect(comparison.sameDecimals).toBe(true); // Both have 2 decimals
    });

    it('should detect different decimal places', () => {
      const comparison = service.compareCurrencies('USD', 'JPY');
      expect(comparison.sameDecimals).toBe(false); // USD: 2, JPY: 0
      expect(comparison.conversionNote).toBeTruthy();
    });
  });
});
