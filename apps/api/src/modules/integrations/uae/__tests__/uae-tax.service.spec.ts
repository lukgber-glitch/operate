import { Test, TestingModule } from '@nestjs/testing';
import { UAETaxService } from '../uae-tax.service';
import { UAEVATRateCode, UAE_VAT_RATES } from '../constants/uae.constants';
import { UAEInvoiceLineItem } from '../interfaces/uae.types';

describe('UAETaxService', () => {
  let service: UAETaxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UAETaxService],
    }).compile();

    service = module.get<UAETaxService>(UAETaxService);
  });

  describe('calculateVAT', () => {
    it('should calculate VAT for standard rate items', () => {
      const lineItems: UAEInvoiceLineItem[] = [
        {
          id: '1',
          description: 'Product A',
          quantity: 2,
          unitCode: 'C62',
          unitPrice: 100,
          lineExtensionAmount: 200,
          taxCategory: UAEVATRateCode.STANDARD,
          taxRate: 0.05,
          taxAmount: 10,
        },
      ];

      const result = service.calculateVAT(lineItems, 'AED');

      expect(result.taxExclusiveAmount).toBe(200);
      expect(result.taxTotalAmount).toBe(10);
      expect(result.taxInclusiveAmount).toBe(210);
      expect(result.currency).toBe('AED');
    });

    it('should calculate VAT for zero-rated items', () => {
      const lineItems: UAEInvoiceLineItem[] = [
        {
          id: '1',
          description: 'Export Product',
          quantity: 1,
          unitCode: 'C62',
          unitPrice: 500,
          lineExtensionAmount: 500,
          taxCategory: UAEVATRateCode.ZERO_RATED,
          taxRate: 0,
          taxAmount: 0,
        },
      ];

      const result = service.calculateVAT(lineItems, 'AED');

      expect(result.taxExclusiveAmount).toBe(500);
      expect(result.taxTotalAmount).toBe(0);
      expect(result.taxInclusiveAmount).toBe(500);
    });

    it('should calculate VAT for mixed rate items', () => {
      const lineItems: UAEInvoiceLineItem[] = [
        {
          id: '1',
          description: 'Standard Product',
          quantity: 1,
          unitCode: 'C62',
          unitPrice: 100,
          lineExtensionAmount: 100,
          taxCategory: UAEVATRateCode.STANDARD,
          taxRate: 0.05,
          taxAmount: 5,
        },
        {
          id: '2',
          description: 'Zero-rated Product',
          quantity: 1,
          unitCode: 'C62',
          unitPrice: 200,
          lineExtensionAmount: 200,
          taxCategory: UAEVATRateCode.ZERO_RATED,
          taxRate: 0,
          taxAmount: 0,
        },
      ];

      const result = service.calculateVAT(lineItems, 'AED');

      expect(result.taxExclusiveAmount).toBe(300);
      expect(result.taxTotalAmount).toBe(5);
      expect(result.taxInclusiveAmount).toBe(305);
      expect(result.taxBreakdown).toHaveLength(2);
    });

    it('should handle document-level allowances', () => {
      const lineItems: UAEInvoiceLineItem[] = [
        {
          id: '1',
          description: 'Product',
          quantity: 1,
          unitCode: 'C62',
          unitPrice: 200,
          lineExtensionAmount: 200,
          taxCategory: UAEVATRateCode.STANDARD,
          taxRate: 0.05,
          taxAmount: 10,
        },
      ];

      const allowances = [
        {
          type: 'ALLOWANCE' as const,
          reason: 'Discount',
          amount: 20,
          taxCategory: UAEVATRateCode.STANDARD,
          taxRate: 0.05,
          taxAmount: 1,
        },
      ];

      const result = service.calculateVAT(lineItems, 'AED', allowances);

      expect(result.taxExclusiveAmount).toBe(180);
      expect(result.taxTotalAmount).toBe(9);
    });
  });

  describe('calculateLineItemTax', () => {
    it('should calculate tax for standard rate', () => {
      const tax = service.calculateLineItemTax(100, UAEVATRateCode.STANDARD, 0.05);
      expect(tax).toBe(5);
    });

    it('should return 0 for exempt items', () => {
      const tax = service.calculateLineItemTax(100, UAEVATRateCode.EXEMPT, 0);
      expect(tax).toBe(0);
    });

    it('should return 0 for out-of-scope items', () => {
      const tax = service.calculateLineItemTax(100, UAEVATRateCode.OUT_OF_SCOPE, 0);
      expect(tax).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const tax = service.calculateLineItemTax(100.33, UAEVATRateCode.STANDARD, 0.05);
      expect(tax).toBe(5.02);
    });
  });

  describe('getVATRate', () => {
    it('should return standard rate', () => {
      const rate = service.getVATRate(UAEVATRateCode.STANDARD);
      expect(rate).toBe(UAE_VAT_RATES.STANDARD);
    });

    it('should return zero rate', () => {
      const rate = service.getVATRate(UAEVATRateCode.ZERO_RATED);
      expect(rate).toBe(UAE_VAT_RATES.ZERO_RATED);
    });

    it('should return 0 for exempt', () => {
      const rate = service.getVATRate(UAEVATRateCode.EXEMPT);
      expect(rate).toBe(0);
    });
  });

  describe('calculateTouristRefund', () => {
    it('should calculate refund for eligible purchase', () => {
      const result = service.calculateTouristRefund(300, 15);

      expect(result).toBeDefined();
      expect(result?.refundableVAT).toBe(15);
      expect(result?.processingFee).toBe(0.66);
      expect(result?.adminFee).toBe(4.8);
      expect(result?.netRefund).toBeGreaterThan(0);
    });

    it('should return null for purchase below minimum', () => {
      const result = service.calculateTouristRefund(200, 10);
      expect(result).toBeNull();
    });

    it('should handle large refund amounts', () => {
      const result = service.calculateTouristRefund(10000, 500);

      expect(result).toBeDefined();
      expect(result?.refundableVAT).toBe(500);
      expect(result?.netRefund).toBeLessThan(500);
    });
  });

  describe('calculateReverseChargeVAT', () => {
    it('should calculate reverse charge correctly', () => {
      const result = service.calculateReverseChargeVAT(1000);

      expect(result.outputVAT).toBe(50);
      expect(result.inputVAT).toBe(50);
      expect(result.netVAT).toBe(0);
    });
  });

  describe('calculateInputVAT', () => {
    it('should calculate total input VAT', () => {
      const purchases = [
        { amount: 100, vatRate: 0.05, recoverable: true },
        { amount: 200, vatRate: 0.05, recoverable: true },
      ];

      const result = service.calculateInputVAT(purchases);

      expect(result.totalInputVAT).toBe(15);
      expect(result.recoverableInputVAT).toBe(15);
      expect(result.nonRecoverableInputVAT).toBe(0);
    });

    it('should separate recoverable and non-recoverable VAT', () => {
      const purchases = [
        { amount: 100, vatRate: 0.05, recoverable: true },
        { amount: 100, vatRate: 0.05, recoverable: false },
      ];

      const result = service.calculateInputVAT(purchases);

      expect(result.totalInputVAT).toBe(10);
      expect(result.recoverableInputVAT).toBe(5);
      expect(result.nonRecoverableInputVAT).toBe(5);
    });
  });

  describe('calculateOutputVAT', () => {
    it('should calculate total output VAT', () => {
      const sales = [
        { amount: 100, vatRate: 0.05, category: UAEVATRateCode.STANDARD },
        { amount: 200, vatRate: 0.05, category: UAEVATRateCode.STANDARD },
      ];

      const result = service.calculateOutputVAT(sales);

      expect(result.totalOutputVAT).toBe(15);
      expect(result.standardRateVAT).toBe(15);
      expect(result.zeroRatedVAT).toBe(0);
    });

    it('should separate standard and zero-rated VAT', () => {
      const sales = [
        { amount: 100, vatRate: 0.05, category: UAEVATRateCode.STANDARD },
        { amount: 200, vatRate: 0, category: UAEVATRateCode.ZERO_RATED },
      ];

      const result = service.calculateOutputVAT(sales);

      expect(result.totalOutputVAT).toBe(5);
      expect(result.standardRateVAT).toBe(5);
      expect(result.zeroRatedVAT).toBe(0);
    });
  });

  describe('calculateNetVAT', () => {
    it('should calculate net VAT payable', () => {
      const result = service.calculateNetVAT(100, 60);

      expect(result.netVAT).toBe(40);
      expect(result.payable).toBe(true);
    });

    it('should calculate net VAT refundable', () => {
      const result = service.calculateNetVAT(60, 100);

      expect(result.netVAT).toBe(-40);
      expect(result.payable).toBe(false);
    });

    it('should handle zero net VAT', () => {
      const result = service.calculateNetVAT(100, 100);

      expect(result.netVAT).toBe(0);
      expect(result.payable).toBe(false);
    });
  });

  describe('convertTaxInclusiveToExclusive', () => {
    it('should convert tax-inclusive to tax-exclusive', () => {
      const result = service.convertTaxInclusiveToExclusive(105, 0.05);

      expect(result.taxExclusiveAmount).toBe(100);
      expect(result.taxAmount).toBe(5);
    });

    it('should handle zero rate', () => {
      const result = service.convertTaxInclusiveToExclusive(100, 0);

      expect(result.taxExclusiveAmount).toBe(100);
      expect(result.taxAmount).toBe(0);
    });
  });

  describe('convertTaxExclusiveToInclusive', () => {
    it('should convert tax-exclusive to tax-inclusive', () => {
      const result = service.convertTaxExclusiveToInclusive(100, 0.05);

      expect(result.taxInclusiveAmount).toBe(105);
      expect(result.taxAmount).toBe(5);
    });

    it('should handle zero rate', () => {
      const result = service.convertTaxExclusiveToInclusive(100, 0);

      expect(result.taxInclusiveAmount).toBe(100);
      expect(result.taxAmount).toBe(0);
    });
  });

  describe('calculateProportionalVAT', () => {
    it('should calculate proportional VAT for mixed supplies', () => {
      const result = service.calculateProportionalVAT(1000, 0.7, 0.05);

      expect(result.taxableAmount).toBe(700);
      expect(result.exemptAmount).toBe(300);
      expect(result.vatAmount).toBe(35);
    });

    it('should handle 100% taxable', () => {
      const result = service.calculateProportionalVAT(1000, 1.0, 0.05);

      expect(result.taxableAmount).toBe(1000);
      expect(result.exemptAmount).toBe(0);
      expect(result.vatAmount).toBe(50);
    });

    it('should handle 0% taxable', () => {
      const result = service.calculateProportionalVAT(1000, 0, 0.05);

      expect(result.taxableAmount).toBe(0);
      expect(result.exemptAmount).toBe(1000);
      expect(result.vatAmount).toBe(0);
    });
  });
});
