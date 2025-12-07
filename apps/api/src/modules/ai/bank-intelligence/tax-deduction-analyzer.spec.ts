/**
 * Tax Deduction Analyzer Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TaxDeductionAnalyzerService } from './tax-deduction-analyzer.service';
import { PrismaService } from '@operate/database';
import { TaxCategory } from './types/tax-categories.types';
import { VAT_RATES } from './rules/german-tax-rules';

describe('TaxDeductionAnalyzerService', () => {
  let service: TaxDeductionAnalyzerService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxDeductionAnalyzerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ANTHROPIC_API_KEY') return 'test-key';
              return undefined;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaxDeductionAnalyzerService>(
      TaxDeductionAnalyzerService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeDeduction', () => {
    it('should calculate 100% deduction for software subscription', async () => {
      const transaction = {
        amount: -11900, // -119.00 EUR
        description: 'GitHub Pro',
        category: 'Software',
      };

      const classification = {
        category: 'Software Subscription',
        confidence: 0.95,
        tax: {
          deductible: true,
          deductionPercentage: 100,
          deductibleAmount: 10000,
          vatReclaimable: true,
          vatRate: 0.19,
          taxCategory: TaxCategory.BUEROKOSTEN,
          eurLineNumber: 28,
        },
        business: {
          isBusinessExpense: true,
          businessPercentage: 100,
          requiresDocumentation: true,
          documentationType: 'INVOICE' as const,
        },
        pattern: {
          isRecurring: true,
          frequency: 'MONTHLY' as const,
          vendor: 'GitHub',
        },
      };

      const result = await service.analyzeDeduction(transaction, classification);

      expect(result.deductible).toBe(true);
      expect(result.grossAmount).toBe(11900);
      expect(result.deductionPercentage).toBe(100);
      expect(result.taxCategory).toBe(TaxCategory.BUEROKOSTEN);
      expect(result.eurLineNumber).toBe(28);
      expect(result.vatReclaimable).toBeGreaterThan(0);
    });

    it('should calculate 70% deduction for business meals', async () => {
      const transaction = {
        amount: -10000, // -100.00 EUR
        description: 'Restaurant - Business Lunch',
      };

      const classification = {
        category: 'Business Meal',
        confidence: 0.92,
        tax: {
          deductible: true,
          deductionPercentage: 70,
          deductibleAmount: 7000,
          vatReclaimable: false,
          vatRate: 0.19,
          taxCategory: TaxCategory.BEWIRTUNG,
          eurLineNumber: 26,
        },
        business: {
          isBusinessExpense: true,
          businessPercentage: 100,
          requiresDocumentation: true,
          documentationType: 'RECEIPT' as const,
          specialRequirements: ['Bewirtungsbeleg erforderlich'],
        },
        pattern: {
          isRecurring: false,
        },
      };

      const result = await service.analyzeDeduction(transaction, classification);

      expect(result.deductible).toBe(true);
      expect(result.deductionPercentage).toBe(70);
      expect(result.taxCategory).toBe(TaxCategory.BEWIRTUNG);
      expect(result.eurLineNumber).toBe(26);
      expect(result.vatReclaimable).toBe(0); // Not reclaimable for Bewirtung
      expect(result.warnings).toContain('Nur 70% abzugsfähig!');
    });

    it('should calculate 50% deduction for phone/internet', async () => {
      const transaction = {
        amount: -6000, // -60.00 EUR
        description: 'Telekom',
      };

      const classification = {
        category: 'Phone/Internet',
        confidence: 0.88,
        tax: {
          deductible: true,
          deductionPercentage: 100,
          deductibleAmount: 5000,
          vatReclaimable: true,
          vatRate: 0.19,
          taxCategory: TaxCategory.TELEFON_INTERNET,
          eurLineNumber: 27,
        },
        business: {
          isBusinessExpense: true,
          businessPercentage: 50, // Mixed use
          requiresDocumentation: false,
        },
        pattern: {
          isRecurring: true,
          frequency: 'MONTHLY' as const,
          vendor: 'Telekom',
        },
      };

      const result = await service.analyzeDeduction(transaction, classification);

      expect(result.deductible).toBe(true);
      expect(result.deductionPercentage).toBe(50); // 100% * 50% business use
      expect(result.taxCategory).toBe(TaxCategory.TELEFON_INTERNET);
    });

    it('should warn about gift limit (35 EUR)', async () => {
      const transaction = {
        amount: -5000, // -50.00 EUR (exceeds limit)
        description: 'Business gift - wine',
      };

      const classification = {
        category: 'Gift',
        confidence: 0.85,
        tax: {
          deductible: true,
          deductionPercentage: 100,
          deductibleAmount: 5000,
          vatReclaimable: false,
          taxCategory: TaxCategory.WERBUNG,
          eurLineNumber: 30,
        },
        business: {
          isBusinessExpense: true,
          businessPercentage: 100,
          requiresDocumentation: true,
        },
        pattern: {
          isRecurring: false,
        },
      };

      const result = await service.analyzeDeduction(transaction, classification);

      expect(result.warnings.some((w) => w.includes('35'))).toBe(true);
    });

    it('should handle private expenses (0% deduction)', async () => {
      const transaction = {
        amount: -5000,
        description: 'Private shopping',
      };

      const classification = {
        category: 'Private',
        confidence: 0.9,
        tax: {
          deductible: false,
          deductionPercentage: 0,
          deductibleAmount: 0,
          vatReclaimable: false,
          taxCategory: TaxCategory.PRIVATE_ENTNAHME,
        },
        business: {
          isBusinessExpense: false,
          businessPercentage: 0,
          requiresDocumentation: false,
        },
        pattern: {
          isRecurring: false,
        },
      };

      const result = await service.analyzeDeduction(transaction, classification);

      expect(result.deductible).toBe(false);
      expect(result.deductibleAmount).toBe(0);
      expect(result.vatReclaimable).toBe(0);
    });
  });

  describe('extractVatFromGross', () => {
    it('should correctly extract 19% VAT from gross amount', () => {
      const gross = 11900; // 119.00 EUR
      const { net, vat } = service.extractVatFromGross(gross, VAT_RATES.STANDARD);

      expect(net).toBe(10000); // 100.00 EUR
      expect(vat).toBe(1900); // 19.00 EUR
      expect(net + vat).toBe(gross);
    });

    it('should correctly extract 7% VAT from gross amount', () => {
      const gross = 10700; // 107.00 EUR
      const { net, vat } = service.extractVatFromGross(gross, VAT_RATES.REDUCED);

      expect(net).toBe(10000); // 100.00 EUR
      expect(vat).toBe(700); // 7.00 EUR
    });
  });

  describe('calculateVat', () => {
    it('should correctly calculate 19% VAT from net', () => {
      const net = 10000; // 100.00 EUR
      const vat = service.calculateVat(net, VAT_RATES.STANDARD);

      expect(vat).toBe(1900); // 19.00 EUR
    });

    it('should correctly calculate 7% VAT from net', () => {
      const net = 10000;
      const vat = service.calculateVat(net, VAT_RATES.REDUCED);

      expect(vat).toBe(700); // 7.00 EUR
    });
  });

  describe('getDeductionRule', () => {
    it('should return correct rule for BEWIRTUNG', () => {
      const rule = service.getDeductionRule(TaxCategory.BEWIRTUNG);

      expect(rule.percentage).toBe(70);
      expect(rule.documentation).toBe('BEWIRTUNGSBELEG');
      expect(rule.vatReclaimable).toBe(false);
    });

    it('should return correct rule for TELEFON_INTERNET', () => {
      const rule = service.getDeductionRule(TaxCategory.TELEFON_INTERNET);

      expect(rule.percentage).toBe(50);
      expect(rule.vatReclaimable).toBe(true);
    });

    it('should return correct rule for BUEROKOSTEN', () => {
      const rule = service.getDeductionRule(TaxCategory.BUEROKOSTEN);

      expect(rule.percentage).toBe(100);
      expect(rule.documentation).toBe('RECEIPT');
      expect(rule.vatReclaimable).toBe(true);
    });
  });

  describe('calculateQuarterlyDeductions', () => {
    it('should calculate quarterly deductions', async () => {
      // Mock database response
      const mockTransactions = [
        {
          amount: -119.0,
          category: 'Software',
          taxCategory: TaxCategory.BUEROKOSTEN,
          deductibleAmount: 10000,
          vatReclaimable: 1900,
        },
        {
          amount: -100.0,
          category: 'Meals',
          taxCategory: TaxCategory.BEWIRTUNG,
          deductibleAmount: 7000,
          vatReclaimable: 0,
        },
      ];

      jest.spyOn(prisma, '$queryRaw').mockResolvedValue(mockTransactions);

      const result = await service.calculateQuarterlyDeductions(
        'org_123',
        1,
        2024,
      );

      expect(result.quarter).toBe(1);
      expect(result.year).toBe(2024);
      expect(result.totalDeductible).toBeGreaterThan(0);
    });
  });

  describe('estimateAnnualTaxSavings', () => {
    it('should estimate annual tax', async () => {
      // Mock quarterly data
      const mockQuarterlyData = {
        quarter: 1,
        year: 2024,
        totalExpenses: 100000,
        totalDeductible: 90000,
        vatReclaimable: 15000,
        byCategory: {},
        eurSummary: {},
        transactionCount: 10,
      };

      jest
        .spyOn(service, 'calculateQuarterlyDeductions')
        .mockResolvedValue(mockQuarterlyData as any);

      // Mock income
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ total: BigInt(50000) }]);

      const result = await service.estimateAnnualTaxSavings('org_123', 2024);

      expect(result.year).toBe(2024);
      expect(result.estimatedIncome).toBeGreaterThan(0);
      expect(result.estimatedDeductions).toBeGreaterThan(0);
      expect(result.effectiveTaxRate).toBeGreaterThanOrEqual(0);
      expect(result.taxBracket).toBeDefined();
    });
  });

  describe('isHealthy', () => {
    it('should return true when service is healthy', () => {
      expect(service.isHealthy()).toBe(true);
    });
  });
});
