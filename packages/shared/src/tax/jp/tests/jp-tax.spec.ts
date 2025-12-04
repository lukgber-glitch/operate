/**
 * Japanese Tax Configuration Tests
 * Task: W27-T4 - Japanese tax configuration
 */

import { describe, it, expect } from '@jest/globals';
import {
  JAPAN_CONSUMPTION_TAX_RATES,
  JAPAN_QUALIFIED_INVOICE_SYSTEM,
  JAPAN_TAX_PERIODS,
  JAPAN_FILING_THRESHOLDS,
  JAPAN_REDUCED_RATE_ITEMS,
  JAPAN_TAX_EXEMPT_ITEMS,
  JAPAN_PRICING_DISPLAY,
} from '../consumption-tax.config';

import {
  JAPAN_PREFECTURES,
  JAPAN_REGIONS,
  JAPAN_PREFECTURE_LOOKUP,
  JAPAN_PREFECTURE_TYPES,
} from '../prefecture.config';

import {
  JAPAN_ENTITY_TYPES,
  JAPAN_CORPORATE_NUMBER,
  JAPAN_INVOICE_REGISTRATION_NUMBER,
  getEntityTypeByCode,
  hasLimitedLiability,
} from '../entity-types.config';

import {
  CorporateNumberValidator,
  InvoiceRegistrationNumberValidator,
  JapanTaxNumberValidator,
  ValidationErrorType,
} from '../invoice-registration.validator';

describe('Japanese Consumption Tax Configuration', () => {
  describe('Tax Rates', () => {
    it('should have correct standard rate of 10%', () => {
      expect(JAPAN_CONSUMPTION_TAX_RATES.STANDARD).toBe(10.0);
    });

    it('should have correct reduced rate of 8%', () => {
      expect(JAPAN_CONSUMPTION_TAX_RATES.REDUCED).toBe(8.0);
    });

    it('should have zero rate', () => {
      expect(JAPAN_CONSUMPTION_TAX_RATES.ZERO).toBe(0.0);
    });
  });

  describe('Reduced Rate Items', () => {
    it('should include food and beverages at 8%', () => {
      expect(JAPAN_REDUCED_RATE_ITEMS.FOOD_AND_BEVERAGES.rate).toBe(8.0);
    });

    it('should include newspapers at 8%', () => {
      expect(JAPAN_REDUCED_RATE_ITEMS.NEWSPAPERS.rate).toBe(8.0);
    });

    it('should exclude alcoholic beverages from reduced rate', () => {
      const exclusions = JAPAN_REDUCED_RATE_ITEMS.FOOD_AND_BEVERAGES.exclusions;
      expect(exclusions).toContain('Alcoholic beverages');
    });

    it('should specify takeout vs eat-in distinction', () => {
      expect(JAPAN_REDUCED_RATE_ITEMS.FOOD_AND_BEVERAGES.notes).toContain('Takeout = 8%');
      expect(JAPAN_REDUCED_RATE_ITEMS.FOOD_AND_BEVERAGES.notes).toContain('Eat-in = 10%');
    });
  });

  describe('Qualified Invoice System', () => {
    it('should have effective date of October 1, 2023', () => {
      expect(JAPAN_QUALIFIED_INVOICE_SYSTEM.effectiveDate).toBe('2023-10-01');
    });

    it('should require T + 13 digits format', () => {
      expect(JAPAN_QUALIFIED_INVOICE_SYSTEM.requirements.registrationNumber.format).toBe('T + 13 digits');
      expect(JAPAN_QUALIFIED_INVOICE_SYSTEM.requirements.registrationNumber.prefix).toBe('T');
      expect(JAPAN_QUALIFIED_INVOICE_SYSTEM.requirements.registrationNumber.length).toBe(14);
    });

    it('should have correct transition periods', () => {
      expect(JAPAN_QUALIFIED_INVOICE_SYSTEM.transitionPeriod.phase1.deductionRate).toBe(80);
      expect(JAPAN_QUALIFIED_INVOICE_SYSTEM.transitionPeriod.phase2.deductionRate).toBe(50);
      expect(JAPAN_QUALIFIED_INVOICE_SYSTEM.transitionPeriod.phase3.deductionRate).toBe(0);
    });
  });

  describe('Filing Thresholds', () => {
    it('should have small business exemption at ¥10 million', () => {
      expect(JAPAN_FILING_THRESHOLDS.SMALL_BUSINESS_EXEMPTION.amount).toBe(10_000_000);
    });

    it('should have quarterly interim threshold at ¥4.8 million', () => {
      expect(JAPAN_FILING_THRESHOLDS.QUARTERLY_INTERIM_THRESHOLD.amount).toBe(4_800_000);
    });

    it('should have monthly interim threshold at ¥48 million', () => {
      expect(JAPAN_FILING_THRESHOLDS.MONTHLY_INTERIM_THRESHOLD.amount).toBe(48_000_000);
    });
  });

  describe('Pricing Display Requirements', () => {
    it('should require tax-inclusive pricing', () => {
      expect(JAPAN_PRICING_DISPLAY.required).toBe(true);
    });

    it('should have effective date of April 1, 2021', () => {
      expect(JAPAN_PRICING_DISPLAY.effectiveDate).toBe('2021-04-01');
    });
  });
});

describe('Japanese Prefectures', () => {
  describe('Prefecture Count', () => {
    it('should have exactly 47 prefectures', () => {
      expect(JAPAN_PREFECTURES.length).toBe(47);
    });

    it('should have 8 regions', () => {
      expect(Object.keys(JAPAN_REGIONS).length).toBe(8);
    });
  });

  describe('Prefecture Types', () => {
    it('should have 1 metropolis (Tokyo - 都)', () => {
      expect(JAPAN_PREFECTURE_TYPES.TO.count).toBe(1);
      expect(JAPAN_PREFECTURE_TYPES.TO.prefectures).toContain('Tokyo');
    });

    it('should have 1 circuit (Hokkaido - 道)', () => {
      expect(JAPAN_PREFECTURE_TYPES.DO.count).toBe(1);
      expect(JAPAN_PREFECTURE_TYPES.DO.prefectures).toContain('Hokkaido');
    });

    it('should have 2 urban prefectures (Osaka, Kyoto - 府)', () => {
      expect(JAPAN_PREFECTURE_TYPES.FU.count).toBe(2);
      expect(JAPAN_PREFECTURE_TYPES.FU.prefectures).toContain('Osaka');
      expect(JAPAN_PREFECTURE_TYPES.FU.prefectures).toContain('Kyoto');
    });

    it('should have 43 regular prefectures (県)', () => {
      expect(JAPAN_PREFECTURE_TYPES.KEN.count).toBe(43);
    });
  });

  describe('Prefecture Lookup', () => {
    it('should find Tokyo by code', () => {
      const tokyo = JAPAN_PREFECTURE_LOOKUP.byCode('13');
      expect(tokyo).toBeDefined();
      expect(tokyo?.name).toBe('Tokyo');
      expect(tokyo?.nameJapanese).toBe('東京都');
    });

    it('should find Osaka by name', () => {
      const osaka = JAPAN_PREFECTURE_LOOKUP.byName('Osaka');
      expect(osaka).toBeDefined();
      expect(osaka?.code).toBe('27');
      expect(osaka?.nameJapanese).toBe('大阪府');
    });

    it('should find all Kanto region prefectures', () => {
      const kanto = JAPAN_PREFECTURE_LOOKUP.byRegion(JAPAN_REGIONS.KANTO);
      expect(kanto.length).toBe(7); // Tokyo, Kanagawa, Saitama, Chiba, Ibaraki, Tochigi, Gunma
      expect(kanto.some(p => p.name === 'Tokyo')).toBe(true);
    });

    it('should validate JIS X 0401 codes', () => {
      // Codes should be from 01 to 47
      JAPAN_PREFECTURES.forEach(prefecture => {
        const code = parseInt(prefecture.code, 10);
        expect(code).toBeGreaterThanOrEqual(1);
        expect(code).toBeLessThanOrEqual(47);
      });
    });
  });
});

describe('Japanese Entity Types', () => {
  describe('Common Entity Types', () => {
    it('should have Kabushiki Kaisha (K.K.)', () => {
      const kk = getEntityTypeByCode('KK');
      expect(kk).toBeDefined();
      expect(kk?.nameJapanese).toBe('株式会社');
      expect(kk?.liabilityType).toBe('Limited');
    });

    it('should have Godo Kaisha (G.K.)', () => {
      const gk = getEntityTypeByCode('GK');
      expect(gk).toBeDefined();
      expect(gk?.nameJapanese).toBe('合同会社');
      expect(gk?.liabilityType).toBe('Limited');
    });

    it('should have Individual Enterprise', () => {
      const ie = getEntityTypeByCode('IE');
      expect(ie).toBeDefined();
      expect(ie?.nameJapanese).toBe('個人事業主');
      expect(ie?.liabilityType).toBe('Unlimited');
    });
  });

  describe('Liability Check', () => {
    it('should correctly identify limited liability entities', () => {
      expect(hasLimitedLiability('KK')).toBe(true);
      expect(hasLimitedLiability('GK')).toBe(true);
      expect(hasLimitedLiability('IE')).toBe(false);
    });
  });

  describe('Corporate Number', () => {
    it('should have correct specifications', () => {
      expect(JAPAN_CORPORATE_NUMBER.length).toBe(13);
      expect(JAPAN_CORPORATE_NUMBER.checkDigit.algorithm).toBe('Modulus 9');
    });
  });

  describe('Invoice Registration Number', () => {
    it('should have correct format', () => {
      expect(JAPAN_INVOICE_REGISTRATION_NUMBER.prefix).toBe('T');
      expect(JAPAN_INVOICE_REGISTRATION_NUMBER.totalLength).toBe(14);
    });
  });
});

describe('Corporate Number Validator', () => {
  describe('Check Digit Calculation', () => {
    it('should calculate check digit correctly', () => {
      // Example: 12 digits
      const digits = '000012345678';
      const checkDigit = CorporateNumberValidator.calculateCheckDigit(digits);
      expect(checkDigit).toBeGreaterThanOrEqual(0);
      expect(checkDigit).toBeLessThanOrEqual(8);
    });

    it('should generate valid corporate number with check digit', () => {
      const digits = '000012345678';
      const fullNumber = CorporateNumberValidator.generateWithCheckDigit(digits);
      expect(fullNumber.length).toBe(13);
      expect(CorporateNumberValidator.validate(fullNumber)).toBe(true);
    });

    it('should throw error for invalid length in calculation', () => {
      expect(() => {
        CorporateNumberValidator.calculateCheckDigit('12345');
      }).toThrow('Corporate number must be 12 digits');
    });
  });

  describe('Validation', () => {
    it('should validate correct corporate number format', () => {
      const validNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      expect(CorporateNumberValidator.validate(validNumber)).toBe(true);
    });

    it('should reject numbers with wrong length', () => {
      expect(CorporateNumberValidator.validate('123456789')).toBe(false);
      expect(CorporateNumberValidator.validate('12345678901234')).toBe(false);
    });

    it('should reject non-numeric characters', () => {
      expect(CorporateNumberValidator.validate('123456789012A')).toBe(false);
    });

    it('should reject numbers with invalid check digit', () => {
      const validNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const invalidNumber = ((parseInt(validNumber[0]) + 1) % 10) + validNumber.substring(1);
      expect(CorporateNumberValidator.validate(invalidNumber)).toBe(false);
    });

    it('should accept numbers with whitespace or hyphens', () => {
      const validNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const formatted = `${validNumber.substring(0, 4)}-${validNumber.substring(4, 6)}-${validNumber.substring(6)}`;
      expect(CorporateNumberValidator.validate(formatted)).toBe(true);
    });
  });

  describe('Formatting', () => {
    it('should format corporate number with hyphens', () => {
      const validNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const formatted = CorporateNumberValidator.format(validNumber);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{6}$/);
    });

    it('should throw error when formatting invalid number', () => {
      expect(() => {
        CorporateNumberValidator.format('123456789');
      }).toThrow('Invalid corporate number');
    });
  });
});

describe('Invoice Registration Number Validator', () => {
  describe('Validation', () => {
    it('should validate correct invoice registration number', () => {
      const corporateNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const invoiceNumber = InvoiceRegistrationNumberValidator.generate(corporateNumber);
      expect(InvoiceRegistrationNumberValidator.validate(invoiceNumber)).toBe(true);
    });

    it('should require T prefix', () => {
      const corporateNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      expect(InvoiceRegistrationNumberValidator.validate(corporateNumber)).toBe(false);
    });

    it('should validate correct length (14 characters)', () => {
      expect(InvoiceRegistrationNumberValidator.validate('T123456789012')).toBe(false); // Too short
      expect(InvoiceRegistrationNumberValidator.validate('T12345678901234')).toBe(false); // Too long
    });

    it('should validate check digit in corporate number part', () => {
      const validCorporate = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const validInvoice = 'T' + validCorporate;
      expect(InvoiceRegistrationNumberValidator.validate(validInvoice)).toBe(true);

      // Invalid check digit
      const invalidInvoice = 'T' + ((parseInt(validCorporate[0]) + 1) % 10) + validCorporate.substring(1);
      expect(InvoiceRegistrationNumberValidator.validate(invalidInvoice)).toBe(false);
    });

    it('should accept lowercase t prefix', () => {
      const corporateNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const invoiceNumber = 't' + corporateNumber;
      expect(InvoiceRegistrationNumberValidator.validate(invoiceNumber)).toBe(true);
    });
  });

  describe('Corporate Number Extraction', () => {
    it('should extract corporate number from invoice number', () => {
      const corporateNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const invoiceNumber = 'T' + corporateNumber;
      const extracted = InvoiceRegistrationNumberValidator.extractCorporateNumber(invoiceNumber);
      expect(extracted).toBe(corporateNumber);
    });

    it('should return null for invalid invoice number', () => {
      const extracted = InvoiceRegistrationNumberValidator.extractCorporateNumber('123456789012');
      expect(extracted).toBeNull();
    });
  });

  describe('Generation', () => {
    it('should generate invoice number from corporate number', () => {
      const corporateNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const invoiceNumber = InvoiceRegistrationNumberValidator.generate(corporateNumber);
      expect(invoiceNumber).toBe('T' + corporateNumber);
      expect(InvoiceRegistrationNumberValidator.validate(invoiceNumber)).toBe(true);
    });

    it('should throw error for invalid corporate number', () => {
      expect(() => {
        InvoiceRegistrationNumberValidator.generate('123456789');
      }).toThrow('Invalid corporate number');
    });
  });

  describe('Formatting', () => {
    it('should format invoice number with hyphens', () => {
      const corporateNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const invoiceNumber = InvoiceRegistrationNumberValidator.generate(corporateNumber);
      const formatted = InvoiceRegistrationNumberValidator.format(invoiceNumber);
      expect(formatted).toMatch(/^T\d{4}-\d{2}-\d{6}$/);
    });
  });

  describe('Registration Requirements', () => {
    it('should recommend registration for businesses over ¥10 million', () => {
      expect(InvoiceRegistrationNumberValidator.isRegistrationRequired(15_000_000)).toBe(true);
      expect(InvoiceRegistrationNumberValidator.isRegistrationRequired(5_000_000)).toBe(false);
    });
  });
});

describe('Japan Tax Number Validator', () => {
  describe('Detailed Validation', () => {
    it('should provide detailed error for missing value', () => {
      const result = JapanTaxNumberValidator.validateWithDetails('', 'corporate');
      expect(result.valid).toBe(false);
      expect(result.errorType).toBe(ValidationErrorType.MISSING_VALUE);
    });

    it('should provide detailed error for invalid length', () => {
      const result = JapanTaxNumberValidator.validateWithDetails('123456789', 'corporate');
      expect(result.valid).toBe(false);
      expect(result.errorType).toBe(ValidationErrorType.INVALID_LENGTH);
    });

    it('should provide detailed error for invalid check digit', () => {
      const validNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const invalidNumber = ((parseInt(validNumber[0]) + 1) % 10) + validNumber.substring(1);
      const result = JapanTaxNumberValidator.validateWithDetails(invalidNumber, 'corporate');
      expect(result.valid).toBe(false);
      expect(result.errorType).toBe(ValidationErrorType.INVALID_CHECK_DIGIT);
    });

    it('should provide detailed error for missing T prefix in invoice number', () => {
      const corporateNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const result = JapanTaxNumberValidator.validateWithDetails(corporateNumber, 'invoice');
      expect(result.valid).toBe(false);
      expect(result.errorType).toBe(ValidationErrorType.INVALID_PREFIX);
    });

    it('should return valid result for correct numbers', () => {
      const corporateNumber = CorporateNumberValidator.generateWithCheckDigit('000012345678');
      const result = JapanTaxNumberValidator.validateWithDetails(corporateNumber, 'corporate');
      expect(result.valid).toBe(true);
      expect(result.errorType).toBeUndefined();
    });
  });
});
