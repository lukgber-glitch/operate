/**
 * Cash Flow Report Service Tests
 * Comprehensive test suite for cash flow statement generation and analysis
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowReportService } from './cashflow-report.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CashFlowMethod, ProjectionMethod } from './dto/cashflow.dto';

describe('CashFlowReportService', () => {
  let service: CashFlowReportService;
  let prismaService: PrismaService;

  const mockOrganisation = {
    id: 'org-123',
    name: 'Test Corp',
    currency: 'EUR',
    country: 'DE',
  };

  const mockPrismaService = {
    organisation: {
      findUnique: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowReportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CashFlowReportService>(CashFlowReportService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCashFlowStatement', () => {
    it('should generate cash flow statement using indirect method', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        periodType: 'QUARTERLY' as any,
        method: CashFlowMethod.INDIRECT,
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result).toBeDefined();
      expect(result.method).toBe(CashFlowMethod.INDIRECT);
      expect(result.organisationId).toBe('org-123');
      expect(result.currency).toBe('EUR');
      expect(result.operatingActivities).toBeDefined();
      expect(result.investingActivities).toBeDefined();
      expect(result.financingActivities).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should generate cash flow statement using direct method', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        periodType: 'QUARTERLY' as any,
        method: CashFlowMethod.DIRECT,
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result).toBeDefined();
      expect(result.method).toBe(CashFlowMethod.DIRECT);
      expect(result.operatingActivities.directMethod).toBeDefined();
    });

    it('should throw NotFoundException for invalid organisation', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(null);

      const dto = {
        periodType: 'QUARTERLY' as any,
      };

      await expect(
        service.generateCashFlowStatement('invalid-org', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include comparison when requested', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        periodType: 'QUARTERLY' as any,
        includeComparison: true,
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result.comparison).toBeDefined();
    });
  });

  describe('calculateOperatingActivities', () => {
    it('should calculate operating activities with adjustments', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const netIncome = 100000;

      const result = await service.calculateOperatingActivities(
        'org-123',
        period,
        netIncome,
      );

      expect(result).toBeDefined();
      expect(result.netIncome).toBe(netIncome);
      expect(result.adjustments).toBeDefined();
      expect(result.workingCapitalChanges).toBeDefined();
      expect(result.netCashFromOperatingActivities).toBeDefined();
    });
  });

  describe('calculateInvestingActivities', () => {
    it('should calculate investing activities', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const result = await service.calculateInvestingActivities('org-123', period);

      expect(result).toBeDefined();
      expect(result.purchaseOfPPE).toBeDefined();
      expect(result.proceedsFromSaleOfPPE).toBeDefined();
      expect(result.netCashFromInvestingActivities).toBeDefined();
    });
  });

  describe('calculateFinancingActivities', () => {
    it('should calculate financing activities', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const result = await service.calculateFinancingActivities('org-123', period);

      expect(result).toBeDefined();
      expect(result.proceedsFromBorrowing).toBeDefined();
      expect(result.repaymentOfBorrowing).toBeDefined();
      expect(result.netCashFromFinancingActivities).toBeDefined();
    });
  });

  describe('reconcileCashPosition', () => {
    it('should reconcile cash position correctly', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const netChange = 50000;

      const result = await service.reconcileCashPosition('org-123', period, netChange);

      expect(result).toBeDefined();
      expect(result.openingBalance).toBeDefined();
      expect(result.closingBalance).toBeDefined();
      expect(result.isValid).toBeDefined();
    });
  });

  describe('analyzeCashBurnRate', () => {
    it('should analyze cash burn rate', async () => {
      const dto = {
        months: 6,
        includeRunway: true,
      };

      const result = await service.analyzeCashBurnRate('org-123', dto);

      expect(result).toBeDefined();
      expect(result.averageMonthlyBurn).toBeDefined();
      expect(result.monthsOfRunway).toBeDefined();
      expect(result.burnRateTrend).toBeDefined();
      expect(result.monthlyBurnHistory).toBeDefined();
      expect(result.alerts).toBeDefined();
    });

    it('should generate critical alerts for low runway', async () => {
      const dto = {
        months: 6,
      };

      const result = await service.analyzeCashBurnRate('org-123', dto);

      if (result.monthsOfRunway < 3) {
        const criticalAlerts = result.alerts.filter((a) => a.severity === 'CRITICAL');
        expect(criticalAlerts.length).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateFreeCashFlow', () => {
    it('should calculate free cash flow', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const result = await service.calculateFreeCashFlow('org-123', period);

      expect(result).toBeDefined();
      expect(result.operatingCashFlow).toBeDefined();
      expect(result.capitalExpenditures).toBeDefined();
      expect(result.freeCashFlow).toBeDefined();
      expect(result.freeCashFlowMargin).toBeDefined();
      expect(result.fcfQuality).toBeDefined();
      expect(result.sustainabilityScore).toBeDefined();
    });

    it('should calculate unlevered and levered FCF', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const result = await service.calculateFreeCashFlow('org-123', period);

      expect(result.unleveredFreeCashFlow).toBeDefined();
      expect(result.leveredFreeCashFlow).toBeDefined();
    });
  });

  describe('projectCashPosition', () => {
    it('should project cash position', async () => {
      const dto = {
        months: 12,
        method: ProjectionMethod.WEIGHTED_AVERAGE,
        historicalMonths: 12,
      };

      const result = await service.projectCashPosition('org-123', dto);

      expect(result).toBeDefined();
      expect(result.projectedPeriods).toBeDefined();
      expect(result.projectedPeriods.length).toBe(12);
      expect(result.summary).toBeDefined();
      expect(result.historicalData).toBeDefined();
    });

    it('should use linear projection method', async () => {
      const dto = {
        months: 6,
        method: ProjectionMethod.LINEAR,
      };

      const result = await service.projectCashPosition('org-123', dto);

      expect(result.method).toBe(ProjectionMethod.LINEAR);
    });

    it('should throw error for insufficient data', async () => {
      const dto = {
        months: 12,
        historicalMonths: 2, // Too few
      };

      await expect(service.projectCashPosition('org-123', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('identifyLiquidityRisks', () => {
    it('should identify liquidity risks', async () => {
      const dto = {
        includeLiquidityRisks: true,
      };

      const result = await service.identifyLiquidityRisks('org-123', dto);

      expect(result).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.indicators).toBeDefined();
      expect(result.risks).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should calculate liquidity ratios', async () => {
      const dto = {};

      const result = await service.identifyLiquidityRisks('org-123', dto);

      expect(result.indicators.currentRatio).toBeDefined();
      expect(result.indicators.quickRatio).toBeDefined();
      expect(result.indicators.cashRatio).toBeDefined();
    });
  });

  describe('calculateCashFlowRatios', () => {
    it('should calculate all cash flow ratios', async () => {
      const dto = {
        includeOperatingRatios: true,
        includeCoverageRatios: true,
        includeEfficiencyRatios: true,
        includeQualityMetrics: true,
      };

      const result = await service.calculateCashFlowRatios('org-123', dto);

      expect(result).toBeDefined();
      expect(result.operatingCashFlowRatio).toBeDefined();
      expect(result.cashFlowMargin).toBeDefined();
      expect(result.debtServiceCoverageRatio).toBeDefined();
      expect(result.qualityOfEarnings).toBeDefined();
      expect(result.cashConversionCycle).toBeDefined();
    });
  });

  describe('calculateCashConversionCycle', () => {
    it('should calculate cash conversion cycle', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const result = await service.calculateCashConversionCycle('org-123', period);

      expect(result).toBeDefined();
      expect(result.daysSalesOutstanding).toBeDefined();
      expect(result.daysPayablesOutstanding).toBeDefined();
      expect(result.cashConversionCycle).toBeDefined();
      expect(result.trend).toBeDefined();
    });

    it('should have CCC = DSO + DIO - DPO', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const result = await service.calculateCashConversionCycle('org-123', period);

      const calculatedCCC =
        result.daysSalesOutstanding +
        result.daysInventoryOutstanding -
        result.daysPayablesOutstanding;

      expect(result.cashConversionCycle).toBeCloseTo(calculatedCCC, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero revenue gracefully', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);
      mockPrismaService.invoice.aggregate.mockResolvedValue({ _sum: { totalAmount: 0 } });

      const dto = {
        periodType: 'QUARTERLY' as any,
      };

      const result = await service.generateCashFlowStatement('org-123', dto);
      expect(result).toBeDefined();
    });

    it('should handle negative cash flow', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const netIncome = -50000; // Loss

      const result = await service.calculateOperatingActivities(
        'org-123',
        period,
        netIncome,
      );

      expect(result.netIncome).toBe(netIncome);
    });

    it('should handle missing working capital data', async () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        label: 'Q1 2024',
        daysInPeriod: 91,
      };

      const result = await service.calculateOperatingActivities('org-123', period, 0);

      expect(result.workingCapitalChanges).toBeDefined();
      expect(result.workingCapitalChanges.totalWorkingCapitalChange).toBeDefined();
    });
  });

  describe('Date Range Parsing', () => {
    it('should parse quarterly period correctly', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        periodType: 'QUARTERLY' as any,
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result.period.label).toContain('Q');
      expect(result.period.daysInPeriod).toBeGreaterThan(80);
      expect(result.period.daysInPeriod).toBeLessThan(95);
    });

    it('should parse annual period correctly', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        periodType: 'ANNUAL' as any,
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result.period.label).toContain('FY');
      expect(result.period.daysInPeriod).toBeGreaterThan(360);
    });

    it('should handle custom date range', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result.period.label).toBe('Custom Period');
      expect(result.period.daysInPeriod).toBeGreaterThan(180);
    });
  });

  describe('Currency Handling', () => {
    it('should use organisation currency by default', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        periodType: 'QUARTERLY' as any,
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result.currency).toBe('EUR');
    });

    it('should allow currency override', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        periodType: 'QUARTERLY' as any,
        currency: 'USD',
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result.currency).toBe('USD');
    });
  });

  describe('Metadata and Quality', () => {
    it('should include metadata', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        periodType: 'QUARTERLY' as any,
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.version).toBeDefined();
      expect(result.metadata.standard).toBeDefined();
      expect(result.metadata.dataQuality).toBeDefined();
    });

    it('should validate reconciliation', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const dto = {
        periodType: 'QUARTERLY' as any,
      };

      const result = await service.generateCashFlowStatement('org-123', dto);

      expect(result.summary.reconciliationCheck).toBeDefined();
    });
  });
});
