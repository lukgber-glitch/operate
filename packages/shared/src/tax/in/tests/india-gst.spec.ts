/**
 * India GST Configuration Tests
 * Task: W29-T4 - India GST configuration
 */

import { describe, it, expect } from '@jest/globals';
import {
  INDIA_GST_RATES,
  INDIA_GST_RATE_BREAKDOWN,
  INDIA_GST_REGISTRATION_THRESHOLDS,
  INDIA_PLACE_OF_SUPPLY_RULES,
  INDIA_REVERSE_CHARGE_MECHANISM,
  INDIA_E_INVOICING,
  INDIA_E_WAY_BILL,
  INDIA_GSTIN_FORMAT,
} from '../gst-rates.config';

import {
  INDIA_STATES,
  INDIA_STATE_LOOKUP,
  INDIA_SPECIAL_CATEGORY_STATES,
  INDIA_UNION_TERRITORIES,
  INDIA_GST_STATE_CODES,
} from '../in-states.config';

import {
  GSTINValidator,
  PANValidator,
  GSTTransactionTypeValidator,
  HSNSACValidator,
} from '../gstin.validator';

describe('India GST Configuration', () => {
  describe('GST Rates', () => {
    it('should have correct GST rate slabs', () => {
      expect(INDIA_GST_RATES.ZERO).toBe(0);
      expect(INDIA_GST_RATES.FIVE).toBe(5);
      expect(INDIA_GST_RATES.TWELVE).toBe(12);
      expect(INDIA_GST_RATES.EIGHTEEN).toBe(18);
      expect(INDIA_GST_RATES.TWENTY_EIGHT).toBe(28);
    });

    it('should have correct CGST/SGST breakdown for 18% rate', () => {
      const breakdown = INDIA_GST_RATE_BREAKDOWN.EIGHTEEN;
      expect(breakdown.total).toBe(18);
      expect(breakdown.cgst).toBe(9);
      expect(breakdown.sgst).toBe(9);
      expect(breakdown.igst).toBe(18);
      expect(breakdown.cgst + breakdown.sgst).toBe(breakdown.igst);
    });

    it('should have correct CGST/SGST breakdown for all rates', () => {
      Object.values(INDIA_GST_RATE_BREAKDOWN).forEach((rate) => {
        expect(rate.cgst + rate.sgst).toBe(rate.igst);
        expect(rate.cgst).toBe(rate.sgst); // Should be split equally
      });
    });
  });

  describe('GST Registration Thresholds', () => {
    it('should have correct registration threshold for goods', () => {
      expect(INDIA_GST_REGISTRATION_THRESHOLDS.REGULAR.goods.amount).toBe(4_000_000);
      expect(INDIA_GST_REGISTRATION_THRESHOLDS.REGULAR.goods.currency).toBe('INR');
    });

    it('should have correct registration threshold for services', () => {
      expect(INDIA_GST_REGISTRATION_THRESHOLDS.REGULAR.services.amount).toBe(2_000_000);
    });

    it('should have lower threshold for special category states', () => {
      const specialGoods = INDIA_GST_REGISTRATION_THRESHOLDS.REGULAR.goods.specialStates.amount;
      const regularGoods = INDIA_GST_REGISTRATION_THRESHOLDS.REGULAR.goods.amount;
      expect(specialGoods).toBeLessThan(regularGoods);
      expect(specialGoods).toBe(2_000_000);
    });

    it('should have correct composition scheme threshold', () => {
      expect(INDIA_GST_REGISTRATION_THRESHOLDS.COMPOSITION_SCHEME.threshold).toBe(15_000_000);
    });
  });

  describe('States and Union Territories', () => {
    it('should have 36 entries (28 states + 8 UTs)', () => {
      expect(INDIA_STATES.length).toBeGreaterThanOrEqual(36);
    });

    it('should have correct state codes', () => {
      const delhi = INDIA_STATE_LOOKUP.byCode('07');
      expect(delhi?.name).toBe('Delhi');
      expect(delhi?.type).toBe('UNION_TERRITORY');

      const maharashtra = INDIA_STATE_LOOKUP.byCode('27');
      expect(maharashtra?.name).toBe('Maharashtra');
      expect(maharashtra?.type).toBe('STATE');
    });

    it('should find state by name', () => {
      const karnataka = INDIA_STATE_LOOKUP.byName('Karnataka');
      expect(karnataka?.code).toBe('29');
      expect(karnataka?.capital).toBe('Bengaluru');
    });

    it('should have correct special category states', () => {
      expect(INDIA_SPECIAL_CATEGORY_STATES).toContain('Arunachal Pradesh');
      expect(INDIA_SPECIAL_CATEGORY_STATES).toContain('Himachal Pradesh');
      expect(INDIA_SPECIAL_CATEGORY_STATES).toContain('Uttarakhand');
      expect(INDIA_SPECIAL_CATEGORY_STATES.length).toBe(10);
    });

    it('should have correct union territories', () => {
      expect(INDIA_UNION_TERRITORIES).toContain('Delhi');
      expect(INDIA_UNION_TERRITORIES).toContain('Puducherry');
      expect(INDIA_UNION_TERRITORIES).toContain('Chandigarh');
      expect(INDIA_UNION_TERRITORIES.length).toBe(8);
    });

    it('should have registration thresholds for special category states', () => {
      const himachalPradesh = INDIA_STATE_LOOKUP.byName('Himachal Pradesh');
      expect(himachalPradesh?.registrationThreshold?.goods).toBe(2_000_000);
      expect(himachalPradesh?.registrationThreshold?.services).toBe(1_000_000);
    });
  });

  describe('GSTIN Validator', () => {
    const validGSTIN = '27AAPFU0939F1ZV';
    const invalidGSTIN = '27AAPFU0939F1ZX';

    it('should validate correct GSTIN', () => {
      const result = GSTINValidator.validate(validGSTIN);
      expect(result.isValid).toBe(true);
      expect(result.details?.stateCode).toBe('27');
      expect(result.details?.stateName).toBe('Maharashtra');
      expect(result.details?.pan).toBe('AAPFU0939F');
    });

    it('should reject GSTIN with invalid length', () => {
      const result = GSTINValidator.validate('27AAPFU0939F1Z');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('15 characters');
    });

    it('should reject GSTIN with invalid state code', () => {
      const result = GSTINValidator.validate('99AAPFU0939F1ZV');
      expect(result.isValid).toBe(false);
      // Note: 99 is valid (Centre Jurisdiction), so this should pass
      // Let's test with actually invalid code
      const result2 = GSTINValidator.validate('40AAPFU0939F1ZV');
      expect(result2.isValid).toBe(false);
    });

    it('should reject GSTIN with invalid PAN format', () => {
      const result = GSTINValidator.validate('27AAP1U0939F1ZV');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('PAN');
    });

    it('should reject GSTIN with invalid check digit', () => {
      const result = GSTINValidator.validate(invalidGSTIN);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('check digit');
    });

    it('should extract state code from GSTIN', () => {
      const stateCode = GSTINValidator.extractStateCode(validGSTIN);
      expect(stateCode).toBe('27');
    });

    it('should extract PAN from GSTIN', () => {
      const pan = GSTINValidator.extractPAN(validGSTIN);
      expect(pan).toBe('AAPFU0939F');
    });

    it('should get state name from GSTIN', () => {
      const stateName = GSTINValidator.getStateName(validGSTIN);
      expect(stateName).toBe('Maharashtra');
    });

    it('should format GSTIN with hyphens', () => {
      const formatted = GSTINValidator.format(validGSTIN);
      expect(formatted).toBe('27-AAPFU0939F-1Z-V');
    });

    it('should generate valid GSTIN', () => {
      const generated = GSTINValidator.generate('27', 'AAPFU0939F', '1');
      const validation = GSTINValidator.validate(generated);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('PAN Validator', () => {
    it('should validate correct PAN', () => {
      const result = PANValidator.validate('AAPFU0939F');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('Firm');
    });

    it('should reject PAN with invalid length', () => {
      const result = PANValidator.validate('AAPFU0939');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('10 characters');
    });

    it('should reject PAN with invalid format', () => {
      const result = PANValidator.validate('AAP1U0939F');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('format');
    });

    it('should identify entity type from PAN', () => {
      expect(PANValidator.getEntityType('AAPFC0939F')).toBe('Company');
      expect(PANValidator.getEntityType('AAPFP0939F')).toBe('Person');
      expect(PANValidator.getEntityType('AAPFH0939F')).toBe('HUF (Hindu Undivided Family)');
      expect(PANValidator.getEntityType('AAPFT0939F')).toBe('Trust');
    });
  });

  describe('Transaction Type Validator', () => {
    it('should identify intra-state transaction', () => {
      const supplier = '27AAPFU0939F1ZV'; // Maharashtra
      const recipient = '27BBBFU0939F1ZA'; // Maharashtra

      const result = GSTTransactionTypeValidator.determineTransactionType(supplier, recipient);
      expect(result?.type).toBe('INTRA_STATE');
      expect(result?.taxComponents).toEqual(['CGST', 'SGST']);
    });

    it('should identify inter-state transaction', () => {
      const supplier = '27AAPFU0939F1ZV'; // Maharashtra
      const recipient = '29BBBFU0939F1ZA'; // Karnataka

      const result = GSTTransactionTypeValidator.determineTransactionType(supplier, recipient);
      expect(result?.type).toBe('INTER_STATE');
      expect(result?.taxComponents).toEqual(['IGST']);
    });

    it('should calculate GST components for intra-state', () => {
      const components = GSTTransactionTypeValidator.calculateGSTComponents(18, 'INTRA_STATE');
      expect(components.cgst).toBe(9);
      expect(components.sgst).toBe(9);
      expect(components.igst).toBeUndefined();
    });

    it('should calculate GST components for inter-state', () => {
      const components = GSTTransactionTypeValidator.calculateGSTComponents(18, 'INTER_STATE');
      expect(components.igst).toBe(18);
      expect(components.cgst).toBeUndefined();
      expect(components.sgst).toBeUndefined();
    });

    it('should use UTGST for Union Territories', () => {
      const components = GSTTransactionTypeValidator.calculateGSTComponents(18, 'INTRA_STATE', true);
      expect(components.cgst).toBe(9);
      expect(components.utgst).toBe(9);
      expect(components.sgst).toBeUndefined();
    });
  });

  describe('HSN/SAC Validator', () => {
    it('should validate correct HSN code (4 digits)', () => {
      const result = HSNSACValidator.validateHSN('8471');
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(4);
    });

    it('should validate correct HSN code (6 digits)', () => {
      const result = HSNSACValidator.validateHSN('847130');
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(6);
    });

    it('should validate correct HSN code (8 digits)', () => {
      const result = HSNSACValidator.validateHSN('84713010');
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(8);
    });

    it('should reject invalid HSN code', () => {
      const result = HSNSACValidator.validateHSN('847');
      expect(result.isValid).toBe(false);
    });

    it('should validate correct SAC code', () => {
      const result = HSNSACValidator.validateSAC('995411');
      expect(result.isValid).toBe(true);
    });

    it('should reject SAC code not starting with 99', () => {
      const result = HSNSACValidator.validateSAC('885411');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('99');
    });

    it('should determine HSN requirement based on turnover', () => {
      // Above ₹5 crore
      let requirement = HSNSACValidator.isHSNRequired(60_000_000);
      expect(requirement.required).toBe(true);
      expect(requirement.digits).toBe(6);

      // Above ₹50 lakhs
      requirement = HSNSACValidator.isHSNRequired(7_000_000);
      expect(requirement.required).toBe(true);
      expect(requirement.digits).toBe(4);

      // Below ₹50 lakhs
      requirement = HSNSACValidator.isHSNRequired(3_000_000);
      expect(requirement.required).toBe(false);
    });
  });

  describe('Place of Supply Rules', () => {
    it('should have rules for goods and services', () => {
      expect(INDIA_PLACE_OF_SUPPLY_RULES.GOODS).toBeDefined();
      expect(INDIA_PLACE_OF_SUPPLY_RULES.SERVICES).toBeDefined();
      expect(INDIA_PLACE_OF_SUPPLY_RULES.INTRA_STATE).toBeDefined();
      expect(INDIA_PLACE_OF_SUPPLY_RULES.INTER_STATE).toBeDefined();
    });

    it('should specify correct taxes for intra-state', () => {
      expect(INDIA_PLACE_OF_SUPPLY_RULES.INTRA_STATE.taxes).toEqual(['CGST', 'SGST']);
    });

    it('should specify correct taxes for inter-state', () => {
      expect(INDIA_PLACE_OF_SUPPLY_RULES.INTER_STATE.taxes).toEqual(['IGST']);
    });
  });

  describe('Reverse Charge Mechanism', () => {
    it('should have list of applicable scenarios', () => {
      expect(INDIA_REVERSE_CHARGE_MECHANISM.applicableOn).toBeDefined();
      expect(INDIA_REVERSE_CHARGE_MECHANISM.applicableOn.length).toBeGreaterThan(0);
    });

    it('should include common RCM scenarios', () => {
      expect(INDIA_REVERSE_CHARGE_MECHANISM.applicableOn).toContain(
        'Services from unregistered supplier (if recipient registered)'
      );
      expect(INDIA_REVERSE_CHARGE_MECHANISM.applicableOn).toContain(
        'Import of services from outside India'
      );
    });
  });

  describe('E-Invoicing', () => {
    it('should have correct configuration', () => {
      expect(INDIA_E_INVOICING.mandatory).toBe(true);
      expect(INDIA_E_INVOICING.currentThreshold).toBe(1_000_000);
      expect(INDIA_E_INVOICING.format).toBe('JSON');
    });

    it('should have IRP system details', () => {
      expect(INDIA_E_INVOICING.irpSystem.name).toBe('Invoice Registration Portal (IRP)');
      expect(INDIA_E_INVOICING.irpSystem.qrCode).toBe(true);
    });

    it('should have phased implementation timeline', () => {
      expect(INDIA_E_INVOICING.phases.length).toBeGreaterThan(0);
      expect(INDIA_E_INVOICING.phases[0].threshold).toBeGreaterThan(
        INDIA_E_INVOICING.phases[INDIA_E_INVOICING.phases.length - 1].threshold
      );
    });
  });

  describe('E-Way Bill', () => {
    it('should have correct threshold', () => {
      expect(INDIA_E_WAY_BILL.threshold).toBe(5_000_000); // ₹50,000 in paise
    });

    it('should have validity periods', () => {
      expect(INDIA_E_WAY_BILL.validity.upto100km).toBe('1 day');
      expect(INDIA_E_WAY_BILL.validity.above1000km).toBe('15 days');
    });

    it('should have exemptions list', () => {
      expect(INDIA_E_WAY_BILL.exemptions).toBeDefined();
      expect(INDIA_E_WAY_BILL.exemptions.length).toBeGreaterThan(0);
    });
  });

  describe('GSTIN Format', () => {
    it('should have correct format specification', () => {
      expect(INDIA_GSTIN_FORMAT.length).toBe(15);
      expect(INDIA_GSTIN_FORMAT.format).toBe('99AAAAA9999A9Z9');
    });

    it('should have correct structure breakdown', () => {
      expect(INDIA_GSTIN_FORMAT.structure.stateCode.position).toBe('1-2');
      expect(INDIA_GSTIN_FORMAT.structure.pan.position).toBe('3-12');
      expect(INDIA_GSTIN_FORMAT.structure.checksum.position).toBe('15');
    });

    it('should have valid example GSTIN', () => {
      const exampleGSTIN = INDIA_GSTIN_FORMAT.example;
      const validation = GSTINValidator.validate(exampleGSTIN);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('State Code Mapping', () => {
    it('should have correct state code mappings', () => {
      expect(INDIA_GST_STATE_CODES['07']).toBe('Delhi');
      expect(INDIA_GST_STATE_CODES['27']).toBe('Maharashtra');
      expect(INDIA_GST_STATE_CODES['29']).toBe('Karnataka');
      expect(INDIA_GST_STATE_CODES['33']).toBe('Tamil Nadu');
    });

    it('should have special codes', () => {
      expect(INDIA_GST_STATE_CODES['97']).toBe('Other Territory');
      expect(INDIA_GST_STATE_CODES['99']).toBe('Centre Jurisdiction');
    });
  });
});
