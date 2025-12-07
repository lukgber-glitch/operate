import { Test, TestingModule } from '@nestjs/testing';
import { ScenarioPlanningService } from './scenario-planning.service';
import { PrismaService } from '../../database/prisma.service';
import { CashFlowPredictorService } from '../../ai/bank-intelligence/cash-flow-predictor.service';

describe('ScenarioPlanningService', () => {
  let service: ScenarioPlanningService;
  let cashFlowService: jest.Mocked<CashFlowPredictorService>;

  const mockRunway = {
    currentBalance: 50000,
    monthlyBurnRate: 12000,
    averageMonthlyIncome: 20000,
    netMonthlyChange: 8000,
    runwayMonths: Infinity, // Profitable
    runwayDate: null,
    status: 'healthy' as const,
    recommendations: [],
  };

  const mockForecast = {
    organizationId: 'org-123',
    generatedAt: new Date(),
    forecastDays: 30,
    currentBalance: 50000,
    projectedBalance: 58000,
    summary: {
      totalInflows: 20000,
      totalOutflows: 12000,
      netChange: 8000,
    },
    inflows: {
      pendingInvoices: 10000,
      expectedRecurringIncome: 8000,
      predictedIncome: 2000,
      total: 20000,
      breakdown: [],
    },
    outflows: {
      pendingBills: 5000,
      recurringExpenses: 5000,
      predictedExpenses: 2000,
      total: 12000,
      breakdown: [],
    },
    dailyProjections: [],
    lowestPoint: {
      date: new Date(),
      projectedBalance: 45000,
      daysFromNow: 15,
      isCritical: false,
      riskFactors: [],
    },
    alerts: [],
    confidence: 85,
  };

  beforeEach(async () => {
    const mockCashFlowService = {
      calculateRunway: jest.fn().mockResolvedValue(mockRunway),
      predictCashFlow: jest.fn().mockResolvedValue(mockForecast),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScenarioPlanningService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: CashFlowPredictorService,
          useValue: mockCashFlowService,
        },
      ],
    }).compile();

    service = module.get<ScenarioPlanningService>(ScenarioPlanningService);
    cashFlowService = module.get(CashFlowPredictorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateScenario', () => {
    it('should calculate hiring scenario correctly', async () => {
      const result = await service.calculateScenario('org-123', {
        name: 'Hire 2 Developers',
        changes: {
          newHires: {
            count: 2,
            monthlySalary: 5000,
          },
        },
      });

      expect(result.scenario.name).toBe('Hire 2 Developers');
      expect(result.baseline.monthlyIncome).toBe(20000);
      expect(result.baseline.monthlyExpenses).toBe(12000);
      expect(result.projected.monthlyExpenses).toBe(22000); // 12000 + (2 * 5000)
      expect(result.impact.monthlyNetChange).toBe(-10000);
      expect(result.riskLevel).toBe('low'); // Still profitable
    });

    it('should calculate revenue increase scenario', async () => {
      const result = await service.calculateScenario('org-123', {
        name: 'Revenue +20%',
        changes: {
          revenueChangePercent: 20,
        },
      });

      expect(result.projected.monthlyIncome).toBe(24000); // 20000 * 1.2
      expect(result.impact.monthlyNetChange).toBe(4000);
      expect(result.riskLevel).toBe('low');
      expect(result.recommendation).toContain('POSITIV');
    });

    it('should calculate cost reduction scenario', async () => {
      const result = await service.calculateScenario('org-123', {
        name: 'Cost Cut 15%',
        changes: {
          expenseChangePercent: -15,
        },
      });

      expect(result.projected.monthlyExpenses).toBe(10200); // 12000 * 0.85
      expect(result.impact.monthlyNetChange).toBe(1800);
      expect(result.riskLevel).toBe('low');
    });

    it('should assess critical risk correctly', async () => {
      // Mock a burning company
      cashFlowService.calculateRunway.mockResolvedValueOnce({
        ...mockRunway,
        monthlyBurnRate: 15000,
        averageMonthlyIncome: 10000,
        netMonthlyChange: -5000,
        runwayMonths: 10,
        status: 'caution',
      });

      cashFlowService.predictCashFlow.mockResolvedValueOnce({
        ...mockForecast,
        currentBalance: 50000,
      });

      const result = await service.calculateScenario('org-123', {
        name: 'Hire 10 People',
        changes: {
          newHires: {
            count: 10,
            monthlySalary: 5000,
          },
        },
      });

      expect(result.projected.runwayMonths).toBeLessThan(1);
      expect(result.riskLevel).toBe('critical');
      expect(result.recommendation).toContain('KRITISCH');
    });

    it('should handle one-time expenses', async () => {
      const result = await service.calculateScenario('org-123', {
        name: 'Investment',
        changes: {
          oneTimeExpense: 30000,
        },
      });

      expect(result.projected.currentBalance).toBe(20000); // 50000 - 30000
      expect(result.projected.monthlyIncome).toBe(result.baseline.monthlyIncome); // Unchanged
      expect(result.impact.monthlyNetChange).toBe(0); // No monthly change
    });

    it('should handle combined scenarios', async () => {
      const result = await service.calculateScenario('org-123', {
        name: 'Growth Plan',
        changes: {
          newHires: { count: 2, monthlySalary: 4000 },
          revenueChangePercent: 25,
          oneTimeExpense: 20000,
        },
      });

      expect(result.projected.monthlyIncome).toBe(25000); // 20000 * 1.25
      expect(result.projected.monthlyExpenses).toBe(20000); // 12000 + (2 * 4000)
      expect(result.projected.currentBalance).toBe(30000); // 50000 - 20000
    });
  });

  describe('compareScenarios', () => {
    it('should compare multiple scenarios', async () => {
      const scenarios = [
        {
          name: 'Option A',
          changes: { expenseChangePercent: -10 },
        },
        {
          name: 'Option B',
          changes: { revenueChangePercent: 15 },
        },
        {
          name: 'Option C',
          changes: {
            expenseChangePercent: -5,
            revenueChangePercent: 10,
          },
        },
      ];

      const results = await service.compareScenarios('org-123', scenarios);

      expect(results).toHaveLength(3);
      expect(results[0].scenario.name).toBe('Option A');
      expect(results[1].scenario.name).toBe('Option B');
      expect(results[2].scenario.name).toBe('Option C');

      // All should be low risk for a healthy company
      results.forEach(r => {
        expect(['low', 'medium']).toContain(r.riskLevel);
      });
    });
  });

  describe('suggestOptimizations', () => {
    it('should generate optimization suggestions', async () => {
      const suggestions = await service.suggestOptimizations('org-123');

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].scenario.name).toBe('Kosteneinsparung 10%');
      expect(suggestions[1].scenario.name).toBe('Umsatzsteigerung 20%');
      expect(suggestions[2].scenario.name).toBe('Kombination');
    });
  });

  describe('risk assessment', () => {
    it('should assess low risk for runway > 6 months', async () => {
      cashFlowService.calculateRunway.mockResolvedValueOnce({
        ...mockRunway,
        runwayMonths: 12,
      });

      const result = await service.calculateScenario('org-123', {
        name: 'Test',
        changes: {},
      });

      expect(result.riskLevel).toBe('low');
    });

    it('should assess medium risk for runway 3-6 months', async () => {
      cashFlowService.calculateRunway.mockResolvedValueOnce({
        ...mockRunway,
        monthlyBurnRate: 10000,
        netMonthlyChange: -10000,
        runwayMonths: 5,
      });

      const result = await service.calculateScenario('org-123', {
        name: 'Test',
        changes: {},
      });

      expect(result.riskLevel).toBe('medium');
    });

    it('should assess high risk for runway 1-3 months', async () => {
      cashFlowService.calculateRunway.mockResolvedValueOnce({
        ...mockRunway,
        monthlyBurnRate: 25000,
        netMonthlyChange: -25000,
        runwayMonths: 2,
      });

      const result = await service.calculateScenario('org-123', {
        name: 'Test',
        changes: {},
      });

      expect(result.riskLevel).toBe('high');
    });

    it('should assess critical risk for runway < 1 month', async () => {
      cashFlowService.calculateRunway.mockResolvedValueOnce({
        ...mockRunway,
        currentBalance: 5000,
        monthlyBurnRate: 50000,
        netMonthlyChange: -50000,
        runwayMonths: 0.1,
      });

      const result = await service.calculateScenario('org-123', {
        name: 'Test',
        changes: {},
      });

      expect(result.riskLevel).toBe('critical');
    });
  });

  describe('error handling', () => {
    it('should handle missing financial data gracefully', async () => {
      cashFlowService.calculateRunway.mockRejectedValueOnce(new Error('No data'));

      const result = await service.calculateScenario('org-123', {
        name: 'Test',
        changes: { revenueChangePercent: 10 },
      });

      // Should return safe defaults
      expect(result.baseline.currentBalance).toBe(0);
      expect(result.baseline.monthlyIncome).toBe(0);
    });
  });
});
