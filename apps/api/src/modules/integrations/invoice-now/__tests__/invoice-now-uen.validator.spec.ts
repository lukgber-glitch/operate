/**
 * InvoiceNow UEN Validator Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceNowUenValidator } from '../invoice-now-uen.validator';

describe('InvoiceNowUenValidator', () => {
  let validator: InvoiceNowUenValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceNowUenValidator],
    }).compile();

    validator = module.get<InvoiceNowUenValidator>(InvoiceNowUenValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  describe('validate - Business UEN', () => {
    it('should validate correct business UEN (9 digits + 1 letter)', () => {
      const result = validator.validate('53012345D');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('BUSINESS');
    });

    it('should reject invalid business UEN checksum', () => {
      const result = validator.validate('53012345Z');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid UEN checksum');
    });

    it('should reject business UEN with wrong format', () => {
      const result = validator.validate('5301234D'); // Too short
      expect(result.isValid).toBe(false);
    });
  });

  describe('validate - Local Company UEN', () => {
    it('should validate correct local company UEN (8 digits + 1 letter)', () => {
      const result = validator.validate('201234567A');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('LOCAL_COMPANY');
    });

    it('should handle uppercase and lowercase', () => {
      const result = validator.validate('201234567a');
      expect(result.isValid).toBe(true);
      expect(result.uen).toBe('201234567A'); // Normalized to uppercase
    });
  });

  describe('validate - Foreign Company UEN', () => {
    it('should validate correct foreign company UEN', () => {
      const result = validator.validate('T08PQ1234A');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('FOREIGN_COMPANY');
    });

    it('should accept T, S, or R prefix', () => {
      expect(validator.validate('T08PQ1234A').isValid).toBe(true);
      expect(validator.validate('S08PQ1234A').isValid).toBe(true);
      expect(validator.validate('R08PQ1234A').isValid).toBe(true);
    });
  });

  describe('validateGstNumber', () => {
    it('should validate M-format GST number', () => {
      const result = validator.validateGstNumber('M12345678X');
      expect(result).toBe(true);
    });

    it('should validate UEN as GST number', () => {
      const result = validator.validateGstNumber('201234567A');
      expect(result).toBe(true);
    });

    it('should reject invalid GST number', () => {
      const result = validator.validateGstNumber('INVALID');
      expect(result).toBe(false);
    });
  });

  describe('getUenType', () => {
    it('should return correct type for business UEN', () => {
      const type = validator.getUenType('53012345D');
      expect(type).toBe('BUSINESS');
    });

    it('should return correct type for local company UEN', () => {
      const type = validator.getUenType('201234567A');
      expect(type).toBe('LOCAL_COMPANY');
    });

    it('should return null for invalid UEN', () => {
      const type = validator.getUenType('INVALID');
      expect(type).toBeNull();
    });
  });

  describe('formatUen', () => {
    it('should format business UEN with hyphens', () => {
      const formatted = validator.formatUen('53012345D');
      expect(formatted).toBe('53012-345D');
    });

    it('should format local company UEN with hyphens', () => {
      const formatted = validator.formatUen('201234567A');
      expect(formatted).toBe('201234567-A');
    });

    it('should format foreign company UEN with hyphens', () => {
      const formatted = validator.formatUen('T08PQ1234A');
      expect(formatted).toBe('T08-PQ-1234-A');
    });
  });

  describe('isBusinessEntity', () => {
    it('should return true for business UEN', () => {
      expect(validator.isBusinessEntity('53012345D')).toBe(true);
    });

    it('should return false for non-business UEN', () => {
      expect(validator.isBusinessEntity('201234567A')).toBe(false);
    });
  });

  describe('isLocalCompany', () => {
    it('should return true for local company UEN', () => {
      expect(validator.isLocalCompany('201234567A')).toBe(true);
    });

    it('should return false for non-local company UEN', () => {
      expect(validator.isLocalCompany('53012345D')).toBe(false);
    });
  });

  describe('isForeignCompany', () => {
    it('should return true for foreign company UEN', () => {
      expect(validator.isForeignCompany('T08PQ1234A')).toBe(true);
    });

    it('should return false for non-foreign company UEN', () => {
      expect(validator.isForeignCompany('201234567A')).toBe(false);
    });
  });
});
