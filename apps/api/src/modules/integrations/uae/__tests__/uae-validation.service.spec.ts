import { Test, TestingModule } from '@nestjs/testing';
import { UAEValidationService } from '../uae-validation.service';
import { UAEVATRateCode } from '../constants/uae.constants';
import { UAEInvoiceData } from '../interfaces/uae.types';

describe('UAEValidationService', () => {
  let service: UAEValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UAEValidationService],
    }).compile();

    service = module.get<UAEValidationService>(UAEValidationService);
  });

  describe('validateTRN', () => {
    it('should validate correct TRN format', () => {
      const result = service.validateTRN('100123456789012');
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate formatted TRN', () => {
      const result = service.validateTRN('100-1234-5678-901-2');
      expect(result.valid).toBe(true);
    });

    it('should reject TRN not starting with 100', () => {
      const result = service.validateTRN('200123456789012');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TRN must be 15 digits starting with 100');
    });

    it('should reject TRN with incorrect length', () => {
      const result = service.validateTRN('10012345');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TRN must be 15 digits starting with 100');
    });

    it('should reject TRN with invalid characters', () => {
      const result = service.validateTRN('100ABC456789012');
      expect(result.valid).toBe(false);
    });
  });

  describe('formatTRN', () => {
    it('should format TRN with dashes', () => {
      const formatted = service.formatTRN('100123456789012');
      expect(formatted).toBe('100-1234-5678-901-2');
    });

    it('should handle already formatted TRN', () => {
      const formatted = service.formatTRN('100-1234-5678-901-2');
      expect(formatted).toBe('100-1234-5678-901-2');
    });

    it('should return original for invalid TRN', () => {
      const formatted = service.formatTRN('12345');
      expect(formatted).toBe('12345');
    });
  });

  describe('validateEmiratesID', () => {
    it('should validate correct Emirates ID format', () => {
      const result = service.validateEmiratesID('784-1234-1234567-1');
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject incorrect format', () => {
      const result = service.validateEmiratesID('784-123-4567-1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Emirates ID must be in format XXX-XXXX-XXXXXXX-X');
    });
  });

  describe('validateInvoiceData', () => {
    const validInvoice: UAEInvoiceData = {
      invoiceNumber: 'INV-001',
      invoiceType: '380',
      issueDate: new Date('2024-01-15'),
      supplier: {
        trn: '100123456789012',
        legalName: 'Test Supplier LLC',
        address: {
          streetName: 'Sheikh Zayed Road',
          cityName: 'Dubai',
          emirate: 'Dubai',
          country: 'AE',
        },
        vatRegistered: true,
      },
      customer: {
        legalName: 'Test Customer LLC',
        address: {
          streetName: 'Al Maktoum Road',
          cityName: 'Dubai',
          emirate: 'Dubai',
          country: 'AE',
        },
        vatRegistered: false,
      },
      lineItems: [
        {
          id: '1',
          description: 'Test Product',
          quantity: 1,
          unitCode: 'C62',
          unitPrice: 100,
          lineExtensionAmount: 100,
          taxCategory: UAEVATRateCode.STANDARD,
          taxRate: 0.05,
          taxAmount: 5,
        },
      ],
      totals: {
        currency: 'AED',
        lineExtensionAmount: 100,
        taxExclusiveAmount: 100,
        taxBreakdown: [
          {
            taxCategory: UAEVATRateCode.STANDARD,
            taxRate: 0.05,
            taxableAmount: 100,
            taxAmount: 5,
          },
        ],
        taxTotalAmount: 5,
        taxInclusiveAmount: 105,
        payableAmount: 105,
      },
    };

    it('should validate correct invoice data', () => {
      const errors = service.validateInvoiceData(validInvoice);
      expect(errors).toHaveLength(0);
    });

    it('should reject invoice without invoice number', () => {
      const invoice = { ...validInvoice, invoiceNumber: '' };
      const errors = service.validateInvoiceData(invoice);
      expect(errors.some((e) => e.field === 'invoiceNumber')).toBe(true);
    });

    it('should reject invoice without supplier', () => {
      const invoice = { ...validInvoice, supplier: null as any };
      const errors = service.validateInvoiceData(invoice);
      expect(errors.some((e) => e.field === 'supplier')).toBe(true);
    });

    it('should reject invoice without line items', () => {
      const invoice = { ...validInvoice, lineItems: [] };
      const errors = service.validateInvoiceData(invoice);
      expect(errors.some((e) => e.field === 'lineItems')).toBe(true);
    });

    it('should reject invoice with invalid TRN', () => {
      const invoice = {
        ...validInvoice,
        supplier: {
          ...validInvoice.supplier,
          trn: '123456789',
        },
      };
      const errors = service.validateInvoiceData(invoice);
      expect(errors.some((e) => e.code === 'VAL_001')).toBe(true);
    });

    it('should reject invoice with incorrect totals', () => {
      const invoice = {
        ...validInvoice,
        totals: {
          ...validInvoice.totals,
          taxInclusiveAmount: 200, // Incorrect
        },
      };
      const errors = service.validateInvoiceData(invoice);
      expect(errors.some((e) => e.code === 'VAL_003')).toBe(true);
    });

    it('should reject invoice with due date before issue date', () => {
      const invoice = {
        ...validInvoice,
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-01-10'),
      };
      const errors = service.validateInvoiceData(invoice);
      expect(errors.some((e) => e.field === 'dueDate')).toBe(true);
    });
  });

  describe('validateVATReturnPeriod', () => {
    it('should validate monthly period', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const valid = service.validateVATReturnPeriod(startDate, endDate, 'MONTHLY');
      expect(valid).toBe(true);
    });

    it('should validate quarterly period', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');
      const valid = service.validateVATReturnPeriod(startDate, endDate, 'QUARTERLY');
      expect(valid).toBe(true);
    });

    it('should reject incorrect monthly period', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');
      const valid = service.validateVATReturnPeriod(startDate, endDate, 'MONTHLY');
      expect(valid).toBe(false);
    });

    it('should reject incorrect quarterly period', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const valid = service.validateVATReturnPeriod(startDate, endDate, 'QUARTERLY');
      expect(valid).toBe(false);
    });
  });

  describe('isWithinRetentionPeriod', () => {
    it('should return true for recent date', () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 2);
      expect(service.isWithinRetentionPeriod(date)).toBe(true);
    });

    it('should return false for date older than 5 years', () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 6);
      expect(service.isWithinRetentionPeriod(date)).toBe(false);
    });

    it('should return true for date exactly 5 years ago', () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      expect(service.isWithinRetentionPeriod(date)).toBe(true);
    });
  });
});
