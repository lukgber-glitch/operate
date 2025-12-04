/**
 * Middle East Currencies Integration Tests
 * Tests for AED and SAR currencies including cross-currency conversions
 */

import { formatAED, parseAED, AED_CONSTANTS } from '../aed';
import { formatSAR, parseSAR, SAR_CONSTANTS } from '../sar';
import {
  EXAMPLE_AED_RATES,
  getPeggedRate as getAEDPeggedRate,
  calculateCrossRate,
} from '../exchange-rates/aed-pairs';
import {
  EXAMPLE_SAR_RATES,
  getPeggedRate as getSARPeggedRate,
} from '../exchange-rates/sar-pairs';

describe('Middle East Currencies Integration', () => {
  describe('AED and SAR Pegged Rates', () => {
    it('should have correct AED pegged rate to USD', () => {
      expect(AED_CONSTANTS.peggedRate).toBe(3.6725);
      expect(AED_CONSTANTS.isPegged).toBe(true);
      expect(AED_CONSTANTS.peggedTo).toBe('USD');
    });

    it('should have correct SAR pegged rate to USD', () => {
      expect(SAR_CONSTANTS.peggedRate).toBe(3.75);
      expect(SAR_CONSTANTS.isPegged).toBe(true);
      expect(SAR_CONSTANTS.peggedTo).toBe('USD');
    });

    it('should retrieve USD/AED pegged rate', () => {
      const rate = getAEDPeggedRate('USD/AED');
      expect(rate).toBe(3.6725);
    });

    it('should retrieve USD/SAR pegged rate', () => {
      const rate = getSARPeggedRate('USD/SAR');
      expect(rate).toBe(3.75);
    });

    it('should calculate AED/USD inverse rate', () => {
      const rate = getAEDPeggedRate('AED/USD');
      expect(rate).toBeCloseTo(1 / 3.6725, 4);
    });

    it('should calculate SAR/USD inverse rate', () => {
      const rate = getSARPeggedRate('SAR/USD');
      expect(rate).toBeCloseTo(1 / 3.75, 4);
    });
  });

  describe('AED/SAR Cross Rate', () => {
    it('should calculate correct AED/SAR cross rate via USD', () => {
      // AED/USD * USD/SAR = AED/SAR
      // (1/3.6725) * 3.75 = ~1.0211
      const aedToUsd = 1 / AED_CONSTANTS.peggedRate;
      const usdToSar = SAR_CONSTANTS.peggedRate;
      const aedToSar = aedToUsd * usdToSar;

      expect(aedToSar).toBeCloseTo(1.0211, 4);
    });

    it('should calculate correct SAR/AED cross rate via USD', () => {
      // SAR/USD * USD/AED = SAR/AED
      // (1/3.75) * 3.6725 = ~0.9793
      const sarToUsd = 1 / SAR_CONSTANTS.peggedRate;
      const usdToAed = AED_CONSTANTS.peggedRate;
      const sarToAed = sarToUsd * usdToAed;

      expect(sarToAed).toBeCloseTo(0.9793, 4);
    });

    it('should have AED/SAR rate in example rates', () => {
      expect(EXAMPLE_AED_RATES['AED/SAR']).toBeCloseTo(1.0211, 4);
      expect(EXAMPLE_SAR_RATES['SAR/AED']).toBeCloseTo(0.9793, 4);
    });

    it('should convert 1000 AED to SAR correctly', () => {
      const aed = 1000;
      const sar = aed * EXAMPLE_AED_RATES['AED/SAR'];
      expect(sar).toBeCloseTo(1021.1, 1);
    });

    it('should convert 1000 SAR to AED correctly', () => {
      const sar = 1000;
      const aed = sar * EXAMPLE_SAR_RATES['SAR/AED'];
      expect(aed).toBeCloseTo(979.3, 1);
    });
  });

  describe('USD Conversions', () => {
    it('should convert USD to AED using pegged rate', () => {
      const usd = 1000;
      const aed = usd * AED_CONSTANTS.peggedRate;
      expect(aed).toBe(3672.5);
      expect(formatAED(aed)).toContain('3,672.50');
    });

    it('should convert USD to SAR using pegged rate', () => {
      const usd = 1000;
      const sar = usd * SAR_CONSTANTS.peggedRate;
      expect(sar).toBe(3750);
      expect(formatSAR(sar)).toContain('3,750.00');
    });

    it('should convert AED to USD using pegged rate', () => {
      const aed = 3672.5;
      const usd = aed / AED_CONSTANTS.peggedRate;
      expect(usd).toBeCloseTo(1000, 2);
    });

    it('should convert SAR to USD using pegged rate', () => {
      const sar = 3750;
      const usd = sar / SAR_CONSTANTS.peggedRate;
      expect(usd).toBeCloseTo(1000, 2);
    });
  });

  describe('Formatting Consistency', () => {
    it('should format similar amounts consistently', () => {
      const amount = 1234.56;
      const aedFormatted = formatAED(amount);
      const sarFormatted = formatSAR(amount);

      expect(aedFormatted).toContain('1,234.56');
      expect(sarFormatted).toContain('1,234.56');
      expect(aedFormatted).toContain('د.إ');
      expect(sarFormatted).toContain('ر.س');
    });

    it('should use suffix position for both currencies', () => {
      expect(AED_CONSTANTS.symbolPosition).toBe('suffix');
      expect(SAR_CONSTANTS.symbolPosition).toBe('suffix');
    });

    it('should have same decimal digits', () => {
      expect(AED_CONSTANTS.decimalDigits).toBe(2);
      expect(SAR_CONSTANTS.decimalDigits).toBe(2);
    });

    it('should use same separators', () => {
      expect(AED_CONSTANTS.thousandSeparator).toBe(',');
      expect(SAR_CONSTANTS.thousandSeparator).toBe(',');
      expect(AED_CONSTANTS.decimalSeparator).toBe('.');
      expect(SAR_CONSTANTS.decimalSeparator).toBe('.');
    });
  });

  describe('Arabic Numeral Support', () => {
    it('should format AED with Arabic numerals', () => {
      const result = formatAED(1234.56, { useArabicNumerals: true });
      expect(result).toMatch(/[٠-٩]/);
      expect(result).not.toMatch(/[0-9]/);
    });

    it('should format SAR with Arabic numerals', () => {
      const result = formatSAR(1234.56, { useArabicNumerals: true });
      expect(result).toMatch(/[٠-٩]/);
      expect(result).not.toMatch(/[0-9]/);
    });

    it('should parse AED with Arabic numerals', () => {
      const formatted = formatAED(1234.56, { useArabicNumerals: true });
      const parsed = parseAED(formatted);
      expect(parsed).toBeCloseTo(1234.56, 2);
    });

    it('should parse SAR with Arabic numerals', () => {
      const formatted = formatSAR(1234.56, { useArabicNumerals: true });
      const parsed = parseSAR(formatted);
      expect(parsed).toBeCloseTo(1234.56, 2);
    });
  });

  describe('Minor Units', () => {
    it('should have correct AED minor unit (Fils)', () => {
      expect(AED_CONSTANTS.minorUnit.name).toBe('Fils');
      expect(AED_CONSTANTS.minorUnit.nameArabic).toBe('فلس');
      expect(AED_CONSTANTS.minorUnit.ratio).toBe(100);
    });

    it('should have correct SAR minor unit (Halala)', () => {
      expect(SAR_CONSTANTS.minorUnit.name).toBe('Halala');
      expect(SAR_CONSTANTS.minorUnit.nameArabic).toBe('هللة');
      expect(SAR_CONSTANTS.minorUnit.ratio).toBe(100);
    });

    it('should handle smallest unit (0.01)', () => {
      expect(formatAED(0.01)).toContain('0.01');
      expect(formatSAR(0.01)).toContain('0.01');
    });
  });

  describe('ISO 4217 Compliance', () => {
    it('should have correct AED ISO codes', () => {
      expect(AED_CONSTANTS.code).toBe('AED');
      expect(AED_CONSTANTS.numericCode).toBe(784);
    });

    it('should have correct SAR ISO codes', () => {
      expect(SAR_CONSTANTS.code).toBe('SAR');
      expect(SAR_CONSTANTS.numericCode).toBe(682);
    });
  });

  describe('VAT Calculations', () => {
    it('should calculate UAE VAT (5%)', () => {
      const amount = 1000;
      const vatRate = 0.05;
      const vat = amount * vatRate;
      const total = amount + vat;

      expect(vat).toBe(50);
      expect(total).toBe(1050);
      expect(formatAED(total)).toContain('1,050.00');
    });

    it('should calculate Saudi VAT (15%)', () => {
      const amount = 1000;
      const vatRate = 0.15;
      const vat = amount * vatRate;
      const total = amount + vat;

      expect(vat).toBe(150);
      expect(total).toBe(1150);
      expect(formatSAR(total)).toContain('1,150.00');
    });

    it('should check UAE VAT registration threshold', () => {
      expect(AED_CONSTANTS.vat_registration_threshold).toBe(375000);
    });

    it('should check Saudi VAT registration threshold', () => {
      expect(SAR_CONSTANTS.vat_registration_threshold).toBe(375000);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle invoice conversion from SAR to AED', () => {
      const invoiceSAR = 10000;
      const crossRate = EXAMPLE_SAR_RATES['SAR/AED'];
      const invoiceAED = invoiceSAR * crossRate;

      expect(invoiceAED).toBeCloseTo(9793, 0);
      expect(formatSAR(invoiceSAR)).toContain('10,000.00');
      expect(formatAED(invoiceAED)).toContain('9,793.00');
    });

    it('should handle salary conversion from AED to SAR', () => {
      const salaryAED = 15000;
      const crossRate = EXAMPLE_AED_RATES['AED/SAR'];
      const salarySAR = salaryAED * crossRate;

      expect(salarySAR).toBeCloseTo(15316.5, 1);
      expect(formatAED(salaryAED)).toContain('15,000.00');
      expect(formatSAR(salarySAR)).toContain('15,316.50');
    });

    it('should handle remittance from UAE to Saudi (via USD)', () => {
      const remittanceAED = 5000;

      // Convert to USD
      const usd = remittanceAED / AED_CONSTANTS.peggedRate;

      // Convert to SAR
      const remittanceSAR = usd * SAR_CONSTANTS.peggedRate;

      expect(usd).toBeCloseTo(1361.16, 2);
      expect(remittanceSAR).toBeCloseTo(5104.35, 2);
    });
  });

  describe('Exchange Rate Pairs', () => {
    it('should have common currency pairs for AED', () => {
      expect(EXAMPLE_AED_RATES['USD/AED']).toBeDefined();
      expect(EXAMPLE_AED_RATES['EUR/AED']).toBeDefined();
      expect(EXAMPLE_AED_RATES['GBP/AED']).toBeDefined();
      expect(EXAMPLE_AED_RATES['SAR/AED']).toBeDefined();
    });

    it('should have common currency pairs for SAR', () => {
      expect(EXAMPLE_SAR_RATES['USD/SAR']).toBeDefined();
      expect(EXAMPLE_SAR_RATES['EUR/SAR']).toBeDefined();
      expect(EXAMPLE_SAR_RATES['GBP/SAR']).toBeDefined();
      expect(EXAMPLE_SAR_RATES['AED/SAR']).toBeDefined();
    });

    it('should have reciprocal rates between AED and SAR', () => {
      const aedToSar = EXAMPLE_AED_RATES['AED/SAR'];
      const sarToAed = EXAMPLE_SAR_RATES['SAR/AED'];

      expect(aedToSar * sarToAed).toBeCloseTo(1, 3);
    });
  });

  describe('Cross-Rate Calculations', () => {
    it('should calculate EUR/AED from USD rates', () => {
      // Assuming EUR/USD = 1.10 (example)
      const eurUsd = 1.10;
      const usdAed = AED_CONSTANTS.peggedRate;
      const eurAed = eurUsd * usdAed;

      expect(eurAed).toBeCloseTo(4.04, 2);
    });

    it('should calculate GBP/SAR from USD rates', () => {
      // Assuming GBP/USD = 1.27 (example)
      const gbpUsd = 1.27;
      const usdSar = SAR_CONSTANTS.peggedRate;
      const gbpSar = gbpUsd * usdSar;

      expect(gbpSar).toBeCloseTo(4.76, 2);
    });
  });

  describe('Stability of Pegged Rates', () => {
    it('should maintain stable AED/USD rate over calculations', () => {
      const amounts = [100, 1000, 10000, 100000];

      amounts.forEach(usd => {
        const aed = usd * AED_CONSTANTS.peggedRate;
        const backToUsd = aed / AED_CONSTANTS.peggedRate;
        expect(backToUsd).toBeCloseTo(usd, 10);
      });
    });

    it('should maintain stable SAR/USD rate over calculations', () => {
      const amounts = [100, 1000, 10000, 100000];

      amounts.forEach(usd => {
        const sar = usd * SAR_CONSTANTS.peggedRate;
        const backToUsd = sar / SAR_CONSTANTS.peggedRate;
        expect(backToUsd).toBeCloseTo(usd, 10);
      });
    });
  });
});
