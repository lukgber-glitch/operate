import { Test, TestingModule } from '@nestjs/testing';
import { TaxReportService } from './tax-report.service';
import { PrismaService } from '@/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  TaxReportCountry,
  VatRateType,
  DeductionCategory,
} from './dto/tax-report.dto';

describe('TaxReportService', () => {
  let service: TaxReportService;
  let prisma: PrismaService;

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    settings: {
      tradeTaxMultiplier: 400,
    },
  };

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxReportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TaxReportService>(TaxReportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTaxSummary', () => {
    it('should generate comprehensive tax summary for Germany', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await service.generateTaxSummary({
        organizationId: 'org-123',
        taxYear: 2024,
        country: TaxReportCountry.GERMANY,
        includeDeductions: true,
        includeVat: true,
      });

      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.taxYear).toBe(2024);
      expect(result.country).toBe(TaxReportCountry.GERMANY);
      expect(result.incomeTax).toBeDefined();
      expect(result.vat).toBeDefined();
      expect(result.tradeTax).toBeDefined();
      expect(result.quarterlyEstimates).toHaveLength(4);
      expect(result.upcomingDeadlines.length).toBeGreaterThan(0);
    });

    it('should generate tax summary for Austria without trade tax', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await service.generateTaxSummary({
        organizationId: 'org-123',
        taxYear: 2024,
        country: TaxReportCountry.AUSTRIA,
        includeDeductions: true,
        includeVat: true,
      });

      expect(result).toBeDefined();
      expect(result.country).toBe(TaxReportCountry.AUSTRIA);
      expect(result.tradeTax).toBeNull();
    });

    it('should throw NotFoundException for invalid organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.generateTaxSummary({
          organizationId: 'invalid-org',
          taxYear: 2024,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateTaxLiability', () => {
    it('should calculate German income tax correctly', () => {
      // Test German 2024 brackets
      const brackets = [
        { min: 0, max: 11604, rate: 0 },
        { min: 11604, max: 17005, rate: 14 },
        { min: 17005, max: 66760, rate: 24 },
        { min: 66760, max: 277825, rate: 42 },
        { min: 277825, max: null, rate: 45 },
      ];

      // Test case 1: Income in basic allowance (no tax)
      const result1 = service.calculateTaxLiability(10000, brackets);
      expect(result1.taxLiability).toBe(0);
      expect(result1.bracketBreakdown).toHaveLength(1);

      // Test case 2: Income in first taxable bracket
      const result2 = service.calculateTaxLiability(20000, brackets);
      expect(result2.taxLiability).toBeGreaterThan(0);
      expect(result2.bracketBreakdown.length).toBeGreaterThan(1);

      // Test case 3: High income (multiple brackets)
      const result3 = service.calculateTaxLiability(100000, brackets);
      expect(result3.taxLiability).toBeGreaterThan(result2.taxLiability);
      expect(result3.bracketBreakdown.length).toBeGreaterThan(2);

      // Test case 4: Top bracket
      const result4 = service.calculateTaxLiability(300000, brackets);
      expect(result4.bracketBreakdown.some((b) => b.rate === 45)).toBe(true);
    });

    it('should calculate Austrian income tax correctly', () => {
      const brackets = [
        { min: 0, max: 12816, rate: 0 },
        { min: 12816, max: 20818, rate: 20 },
        { min: 20818, max: 34513, rate: 30 },
        { min: 34513, max: 66612, rate: 40 },
        { min: 66612, max: 99266, rate: 48 },
        { min: 99266, max: 1000000, rate: 50 },
        { min: 1000000, max: null, rate: 55 },
      ];

      // Test millionaire's tax
      const result = service.calculateTaxLiability(1500000, brackets);
      expect(result.bracketBreakdown.some((b) => b.rate === 55)).toBe(true);
    });

    it('should handle zero income', () => {
      const brackets = [
        { min: 0, max: 11604, rate: 0 },
        { min: 11604, max: 17005, rate: 14 },
      ];

      const result = service.calculateTaxLiability(0, brackets);
      expect(result.taxLiability).toBe(0);
      expect(result.bracketBreakdown).toHaveLength(0);
    });
  });

  describe('calculateEffectiveTaxRate', () => {
    it('should calculate effective tax rate correctly', () => {
      const rate = service.calculateEffectiveTaxRate(25000, 100000);
      expect(rate).toBe(25);
    });

    it('should handle zero gross income', () => {
      const rate = service.calculateEffectiveTaxRate(0, 0);
      expect(rate).toBe(0);
    });

    it('should handle partial tax payments', () => {
      const rate = service.calculateEffectiveTaxRate(15000, 50000);
      expect(rate).toBe(30);
    });
  });

  describe('generateQuarterlyEstimates', () => {
    it('should generate four quarterly estimates', async () => {
      const estimates = await service.generateQuarterlyEstimates(40000, 2024);

      expect(estimates).toHaveLength(4);
      expect(estimates[0].quarter).toBe(1);
      expect(estimates[1].quarter).toBe(2);
      expect(estimates[2].quarter).toBe(3);
      expect(estimates[3].quarter).toBe(4);

      // Each quarter should be ~10,000
      estimates.forEach((estimate) => {
        expect(estimate.estimatedPayment).toBeCloseTo(10000, 0);
      });
    });

    it('should calculate due dates correctly', async () => {
      const estimates = await service.generateQuarterlyEstimates(40000, 2024);

      // Q1: March 10
      expect(new Date(estimates[0].dueDate).getMonth()).toBe(3);
      expect(new Date(estimates[0].dueDate).getDate()).toBe(10);

      // Q2: May 10
      expect(new Date(estimates[1].dueDate).getMonth()).toBe(5);
      expect(new Date(estimates[1].dueDate).getDate()).toBe(10);

      // Q3: September 10
      expect(new Date(estimates[2].dueDate).getMonth()).toBe(9);
      expect(new Date(estimates[2].dueDate).getDate()).toBe(10);

      // Q4: December 10
      expect(new Date(estimates[3].dueDate).getMonth()).toBe(12);
      expect(new Date(estimates[3].dueDate).getDate()).toBe(10);
    });
  });

  describe('trackDeadlines', () => {
    it('should track German tax deadlines', () => {
      const deadlines = service.trackDeadlines(TaxReportCountry.GERMANY, 2024);

      expect(deadlines.length).toBeGreaterThan(0);

      // Should include income tax deadline
      const incomeTaxDeadline = deadlines.find((d) => d.taxType === 'INCOME');
      expect(incomeTaxDeadline).toBeDefined();

      // Should include VAT deadline
      const vatDeadline = deadlines.find((d) => d.taxType === 'VAT');
      expect(vatDeadline).toBeDefined();

      // Should include trade tax deadline
      const tradeTaxDeadline = deadlines.find((d) => d.taxType === 'TRADE');
      expect(tradeTaxDeadline).toBeDefined();
    });

    it('should track Austrian tax deadlines', () => {
      const deadlines = service.trackDeadlines(TaxReportCountry.AUSTRIA, 2024);

      expect(deadlines.length).toBeGreaterThan(0);

      // Should include income tax deadline
      const incomeTaxDeadline = deadlines.find((d) => d.taxType === 'INCOME');
      expect(incomeTaxDeadline).toBeDefined();

      // Should include VAT deadline
      const vatDeadline = deadlines.find((d) => d.taxType === 'VAT');
      expect(vatDeadline).toBeDefined();

      // Should NOT include trade tax deadline (Austria doesn't have it)
      const tradeTaxDeadline = deadlines.find((d) => d.taxType === 'TRADE');
      expect(tradeTaxDeadline).toBeUndefined();
    });

    it('should calculate days until due correctly', () => {
      const deadlines = service.trackDeadlines(TaxReportCountry.GERMANY, 2024);

      deadlines.forEach((deadline) => {
        expect(deadline.daysUntilDue).toBeDefined();
        expect(typeof deadline.isOverdue).toBe('boolean');
      });
    });
  });

  describe('generateVatReport', () => {
    it('should generate VAT report for specified period', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await service.generateVatReport({
        organizationId: 'org-123',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        country: TaxReportCountry.GERMANY,
        includeIntraEu: true,
      });

      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-31');
      expect(result.summary).toBeDefined();
      expect(result.filingDeadline).toBeDefined();
      expect(result.paymentDeadline).toBeDefined();
    });

    it('should throw NotFoundException for invalid organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.generateVatReport({
          organizationId: 'invalid-org',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          country: TaxReportCountry.GERMANY,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateIncomeTaxReport', () => {
    it('should generate income tax report', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await service.generateIncomeTaxReport({
        organizationId: 'org-123',
        taxYear: 2024,
        country: TaxReportCountry.GERMANY,
        includeQuarterlyEstimates: true,
      });

      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.taxYear).toBe(2024);
      expect(result.summary).toBeDefined();
      expect(result.quarterlyEstimates).toBeDefined();
      expect(result.quarterlyEstimates).toHaveLength(4);
    });
  });

  describe('analyzeDeductions', () => {
    it('should analyze deductions and identify potential savings', async () => {
      const result = await service.analyzeDeductions('org-123', 2024);

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.taxYear).toBe(2024);
      expect(result.deductions).toBeDefined();
      expect(result.totalDeductions).toBeDefined();
      expect(result.potentialDeductions).toBeDefined();
      expect(result.estimatedSavings).toBeDefined();
    });
  });

  describe('generateElsterExport', () => {
    it('should generate ELSTER XML export', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await service.generateElsterExport({
        organizationId: 'org-123',
        taxYear: 2024,
        format: 'ELSTER_XML' as any,
        taxOfficeNumber: '9198',
        taxIdentifier: 'DE123456789',
      });

      expect(result).toBeDefined();
      expect(result.exportId).toBeDefined();
      expect(result.format).toBe('ELSTER_XML');
      expect(result.content).toContain('<?xml version="1.0"');
      expect(result.content).toContain('<Elster');
      expect(result.content).toContain('</Elster>');
      expect(result.mimeType).toBe('application/xml');
    });
  });

  describe('generateFinanzOnlineExport', () => {
    it('should generate FinanzOnline XML export', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await service.generateFinanzOnlineExport({
        organizationId: 'org-123',
        taxYear: 2024,
        format: 'FINANZONLINE_XML' as any,
        taxIdentifier: 'ATU12345678',
      });

      expect(result).toBeDefined();
      expect(result.exportId).toBeDefined();
      expect(result.format).toBe('FINANZONLINE_XML');
      expect(result.content).toContain('<?xml version="1.0"');
      expect(result.content).toContain('<FinanzOnline');
      expect(result.content).toContain('</FinanzOnline>');
      expect(result.mimeType).toBe('application/xml');
    });
  });
});
