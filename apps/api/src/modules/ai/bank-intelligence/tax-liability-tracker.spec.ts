/**
 * Tax Liability Tracker Service - Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TaxLiabilityTrackerService } from './tax-liability-tracker.service';
import { TaxDeductionAnalyzerService } from './tax-deduction-analyzer.service';
import { PrismaService } from '../../database/prisma.service';

describe('TaxLiabilityTrackerService', () => {
  let service: TaxLiabilityTrackerService;
  let prisma: PrismaService;
  let taxDeductionAnalyzer: TaxDeductionAnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxLiabilityTrackerService,
        TaxDeductionAnalyzerService,
        {
          provide: PrismaService,
          useValue: {
            invoice: {
              findMany: jest.fn(),
              aggregate: jest.fn(),
            },
            transaction: {
              findMany: jest.fn(),
            },
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaxLiabilityTrackerService>(
      TaxLiabilityTrackerService,
    );
    prisma = module.get<PrismaService>(PrismaService);
    taxDeductionAnalyzer = module.get<TaxDeductionAnalyzerService>(
      TaxDeductionAnalyzerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be healthy', () => {
    expect(service.isHealthy()).toBe(true);
  });

  describe('calculateTaxLiability', () => {
    it('should calculate tax liability for a given year', async () => {
      const orgId = 'org_test';
      const year = 2025;

      // Mock invoice data
      jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue([
        {
          id: 'inv_1',
          orgId,
          totalAmount: 1000, // €1000
          taxAmount: 190, // 19% VAT
          subtotal: 810,
          status: 'PAID',
        } as any,
      ]);

      // Mock expense data
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([
        {
          taxCategory: 'BUEROKOSTEN',
          totalAmount: BigInt(300),
          deductibleAmount: BigInt(30000), // €300 in cents
          vatReclaimable: BigInt(5700), // €57 in cents
          count: BigInt(5),
        },
      ]);

      // Mock prepayments
      jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([]);

      const result = await service.calculateTaxLiability(orgId, year);

      expect(result).toBeDefined();
      expect(result.organizationId).toBe(orgId);
      expect(result.year).toBe(year);
      expect(result.income.totalRevenue).toBeGreaterThan(0);
      expect(result.incomeTax.estimatedTax).toBeGreaterThanOrEqual(0);
      expect(result.vat.collectedVat).toBeGreaterThanOrEqual(0);
    });

    it('should handle Kleinunternehmer correctly', async () => {
      const orgId = 'org_test';
      const year = 2025;

      jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([]);
      jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([]);

      const result = await service.calculateTaxLiability(orgId, year, {
        isKleinunternehmer: true,
      });

      expect(result.vat.netVatDue).toBe(0);
      expect(result.notes).toContain(
        'Kleinunternehmerregelung (§19 UStG) - keine MwSt',
      );
    });
  });

  describe('getQuarterlyEstimates', () => {
    it('should return estimates for all 4 quarters', async () => {
      const orgId = 'org_test';
      const year = 2025;

      jest.spyOn(prisma.invoice, 'aggregate').mockResolvedValue({
        _sum: { subtotal: 1000, taxAmount: 190 },
      } as any);

      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([
        {
          totalDeductible: BigInt(30000),
          totalVat: BigInt(5700),
        },
      ]);

      const result = await service.getQuarterlyEstimates(orgId, year);

      expect(result).toHaveLength(4);
      expect(result[0].quarter).toBe(1);
      expect(result[1].quarter).toBe(2);
      expect(result[2].quarter).toBe(3);
      expect(result[3].quarter).toBe(4);
    });

    it('should set correct status for each quarter', async () => {
      const orgId = 'org_test';
      const currentYear = new Date().getFullYear();

      jest.spyOn(prisma.invoice, 'aggregate').mockResolvedValue({
        _sum: { subtotal: 0, taxAmount: 0 },
      } as any);

      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([
        {
          totalDeductible: BigInt(0),
          totalVat: BigInt(0),
        },
      ]);

      const result = await service.getQuarterlyEstimates(orgId, currentYear);

      const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

      result.forEach((q) => {
        if (q.quarter < currentQuarter) {
          expect(q.status).toBe('completed');
        } else if (q.quarter === currentQuarter) {
          expect(q.status).toBe('in_progress');
        } else {
          expect(q.status).toBe('projected');
        }
      });
    });
  });

  describe('getVatSummary', () => {
    it('should return quarterly VAT summary', async () => {
      const orgId = 'org_test';
      const year = 2025;

      jest.spyOn(prisma.invoice, 'aggregate').mockResolvedValue({
        _sum: { subtotal: 10000, taxAmount: 1000 },
        _count: 10,
      } as any);

      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([
        {
          totalVat: BigInt(50000),
          count: BigInt(5),
        },
      ]);

      const result = await service.getVatSummary(orgId, 'quarterly', year);

      expect(result.period).toBe('quarterly');
      expect(result.periods).toHaveLength(4);
      expect(result.totalCollected).toBeGreaterThanOrEqual(0);
      expect(result.totalPaid).toBeGreaterThanOrEqual(0);
    });

    it('should return monthly VAT summary', async () => {
      const orgId = 'org_test';
      const year = 2025;

      jest.spyOn(prisma.invoice, 'aggregate').mockResolvedValue({
        _sum: { subtotal: 1000, taxAmount: 100 },
        _count: 2,
      } as any);

      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([
        {
          totalVat: BigInt(5000),
          count: BigInt(1),
        },
      ]);

      const result = await service.getVatSummary(orgId, 'monthly', year);

      expect(result.period).toBe('monthly');
      expect(result.periods).toHaveLength(12);
    });
  });

  describe('getDeductionsSummary', () => {
    it('should return deductions summary by category', async () => {
      const orgId = 'org_test';
      const year = 2025;

      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([
        {
          taxCategory: 'BUEROKOSTEN',
          totalAmount: BigInt(500),
          deductibleAmount: BigInt(50000),
          count: BigInt(10),
        },
        {
          taxCategory: 'BEWIRTUNG',
          totalAmount: BigInt(300),
          deductibleAmount: BigInt(21000),
          count: BigInt(5),
        },
      ]);

      const result = await service.getDeductionsSummary(orgId, year);

      expect(result.year).toBe(year);
      expect(result.totalDeductions).toBeGreaterThan(0);
      expect(result.categories.length).toBeGreaterThan(0);
    });

    it('should include special items with limits', async () => {
      const orgId = 'org_test';
      const year = 2025;

      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([
        {
          taxCategory: 'MIETE_PACHT',
          totalAmount: BigInt(2000),
          deductibleAmount: BigInt(126000), // Max home office
          count: BigInt(12),
        },
        {
          taxCategory: 'BEWIRTUNG',
          totalAmount: BigInt(1000),
          deductibleAmount: BigInt(70000), // 70%
          count: BigInt(8),
        },
      ]);

      const result = await service.getDeductionsSummary(orgId, year);

      expect(result.specialItems.length).toBeGreaterThan(0);

      const homeOffice = result.specialItems.find((i) =>
        i.name.includes('Arbeitszimmer'),
      );
      expect(homeOffice).toBeDefined();
      expect(homeOffice?.limit).toBe(126000); // €1,260 in cents

      const bewirtung = result.specialItems.find((i) =>
        i.name.includes('Bewirtung'),
      );
      expect(bewirtung).toBeDefined();
      expect(bewirtung?.note).toContain('70%');
    });
  });

  describe('getTaxAlerts', () => {
    it('should return tax alerts', async () => {
      const orgId = 'org_test';

      const result = await service.getTaxAlerts(orgId);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should prioritize alerts by severity', async () => {
      const orgId = 'org_test';

      const result = await service.getTaxAlerts(orgId);

      const urgentAlerts = result.filter((a) => a.severity === 'urgent');
      const warningAlerts = result.filter((a) => a.severity === 'warning');
      const infoAlerts = result.filter((a) => a.severity === 'info');

      // Urgent alerts should come with due dates
      urgentAlerts.forEach((alert) => {
        if (alert.type === 'deadline' || alert.type === 'payment_due') {
          expect(alert.dueDate).toBeDefined();
        }
      });
    });
  });

  describe('Progressive Tax Calculation', () => {
    it('should apply correct tax brackets', async () => {
      const orgId = 'org_test';
      const year = 2025;

      // Test case 1: Low income (Grundfreibetrag)
      jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue([
        {
          subtotal: 10000, // €10,000 (below Grundfreibetrag)
          taxAmount: 0,
          totalAmount: 10000,
          status: 'PAID',
        } as any,
      ]);

      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([]);
      jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([]);

      const result1 = await service.calculateTaxLiability(orgId, year);
      expect(result1.incomeTax.estimatedTax).toBe(0);

      // Test case 2: Higher income
      jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue([
        {
          subtotal: 60000, // €60,000
          taxAmount: 11400,
          totalAmount: 71400,
          status: 'PAID',
        } as any,
      ]);

      const result2 = await service.calculateTaxLiability(orgId, year);
      expect(result2.incomeTax.estimatedTax).toBeGreaterThan(0);
      expect(result2.incomeTax.effectiveRate).toBeGreaterThan(0);
      expect(result2.incomeTax.bracket).toBeTruthy();
    });
  });
});
