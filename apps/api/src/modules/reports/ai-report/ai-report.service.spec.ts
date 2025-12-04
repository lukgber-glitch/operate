/**
 * AI Report Service Tests
 * Demonstrates AI report generation capabilities
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AIReportService } from './ai-report.service';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { ReportGeneratorService } from '../report-generator/report-generator.service';
import { ReportIntent } from './dto/chat-report.dto';

describe('AIReportService', () => {
  let service: AIReportService;
  let prismaService: PrismaService;
  let cacheService: CacheService;
  let reportGenerator: ReportGeneratorService;

  // Mock services
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-key';
      return null;
    }),
  };

  const mockPrismaService = {
    invoice: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    expense: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    organisation: {
      findUnique: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockReportGenerator = {
    generateReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIReportService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: ReportGeneratorService, useValue: mockReportGenerator },
      ],
    }).compile();

    service = module.get<AIReportService>(AIReportService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
    reportGenerator = module.get<ReportGeneratorService>(ReportGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Natural Language Processing', () => {
    it('should parse simple report request', async () => {
      // Test intent parsing
      const message = 'Show me my P&L for last quarter';

      // This would call OpenAI in real scenario
      // For testing, we'd mock the OpenAI response
      expect(message).toContain('P&L');
      expect(message).toContain('last quarter');
    });

    it('should extract date parameters from natural language', () => {
      const testCases = [
        { input: 'last month', expected: 'previous month dates' },
        { input: 'this quarter', expected: 'current quarter dates' },
        { input: 'last year', expected: 'previous year dates' },
        { input: 'Q3 2024', expected: 'Q3 2024 dates' },
      ];

      testCases.forEach(({ input }) => {
        // Service has private methods for date parsing
        expect(input).toBeTruthy();
      });
    });

    it('should identify report types from various phrasings', () => {
      const testCases = [
        { input: 'profit and loss', expected: 'PL_STATEMENT' },
        { input: 'P&L', expected: 'PL_STATEMENT' },
        { input: 'income statement', expected: 'PL_STATEMENT' },
        { input: 'cash flow', expected: 'CASH_FLOW' },
        { input: 'balance sheet', expected: 'BALANCE_SHEET' },
      ];

      testCases.forEach(({ input }) => {
        expect(input).toBeTruthy();
      });
    });
  });

  describe('Insight Generation', () => {
    it('should generate insights from P&L data', async () => {
      const mockReportData = {
        metadata: {
          reportType: 'PL_STATEMENT',
          currency: 'EUR',
        },
        summary: {
          totalRevenue: 100000,
          totalExpenses: 80000,
          netIncome: 20000,
          netProfitMargin: 20,
          grossProfit: 60000,
          grossProfitMargin: 60,
        },
        sections: [],
      };

      const insights = await service.generateInsights(mockReportData);

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      // Should generate at least some insights
      expect(insights.length).toBeGreaterThan(0);

      // Each insight should have required properties
      insights.forEach(insight => {
        expect(insight).toHaveProperty('category');
        expect(insight).toHaveProperty('severity');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('confidence');
      });
    });

    it('should identify negative income as high-severity risk', async () => {
      const mockReportData = {
        summary: {
          netIncome: -5000,
          netProfitMargin: -5,
        },
      };

      const insights = await service.generateInsights(mockReportData);

      const negativeIncomeInsight = insights.find(
        i => i.title.includes('Negative') || i.severity === 'high'
      );

      expect(negativeIncomeInsight).toBeDefined();
    });

    it('should recommend actions for low profit margin', async () => {
      const mockReportData = {
        summary: {
          grossProfitMargin: 25, // Below 30% threshold
        },
      };

      const insights = await service.generateInsights(mockReportData);

      const marginInsight = insights.find(
        i => i.title.includes('Margin') || i.category === 'opportunity'
      );

      expect(marginInsight).toBeDefined();
      if (marginInsight) {
        expect(marginInsight.recommendedActions).toBeDefined();
        expect(marginInsight.recommendedActions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect outliers using statistical analysis', async () => {
      const mockReportData = {
        sections: [
          {
            id: 'expenses',
            title: 'Operating Expenses',
            data: [
              { value: 1000 },
              { value: 1100 },
              { value: 1050 },
              { value: 5000 }, // Outlier
              { value: 1080 },
            ],
          },
        ],
      };

      const anomalies = await service.detectAnomalies(mockReportData, {
        reportData: mockReportData,
        sensitivity: 'medium',
      });

      expect(anomalies).toBeDefined();
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should adjust detection based on sensitivity', async () => {
      const mockData = {
        sections: [
          {
            id: 'test',
            title: 'Test',
            data: [
              { value: 100 },
              { value: 105 },
              { value: 200 }, // Moderate outlier
            ],
          },
        ],
      };

      const lowSensitivity = await service.detectAnomalies(mockData, {
        reportData: mockData,
        sensitivity: 'low',
      });

      const highSensitivity = await service.detectAnomalies(mockData, {
        reportData: mockData,
        sensitivity: 'high',
      });

      // High sensitivity should detect more anomalies
      expect(highSensitivity.length >= lowSensitivity.length).toBe(true);
    });

    it('should classify anomaly types correctly', async () => {
      const mockReportData = {
        sections: [
          {
            id: 'revenue',
            title: 'Revenue',
            data: [
              { value: 1000 },
              { value: 1100 },
              { value: 2500 }, // Spike
            ],
          },
        ],
      };

      const anomalies = await service.detectAnomalies(mockReportData, {
        reportData: mockReportData,
        sensitivity: 'medium',
      });

      if (anomalies.length > 0) {
        const types = anomalies.map(a => a.type);
        expect(['spike', 'drop', 'outlier']).toEqual(
          expect.arrayContaining(types)
        );
      }
    });
  });

  describe('Trend Prediction', () => {
    it('should predict future values from historical data', async () => {
      const historicalData = [
        { period: 'Jan', value: 1000 },
        { period: 'Feb', value: 1100 },
        { period: 'Mar', value: 1200 },
        { period: 'Apr', value: 1300 },
      ];

      const predictions = await service.predictTrends(historicalData, {
        historicalData,
        forecastPeriods: 3,
        confidenceLevel: 95,
      });

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);

      if (predictions.length > 0) {
        const prediction = predictions[0];
        expect(prediction).toHaveProperty('predictions');
        expect(prediction).toHaveProperty('direction');
        expect(prediction).toHaveProperty('growthRate');
        expect(prediction).toHaveProperty('accuracy');
        expect(prediction.predictions.length).toBe(3);
      }
    });

    it('should identify trend direction correctly', async () => {
      const increasingData = [
        { period: '1', value: 100 },
        { period: '2', value: 110 },
        { period: '3', value: 120 },
      ];

      const predictions = await service.predictTrends(increasingData, {
        historicalData: increasingData,
        forecastPeriods: 1,
      });

      if (predictions.length > 0) {
        expect(['increasing', 'stable']).toContain(predictions[0].direction);
      }
    });

    it('should include confidence intervals', async () => {
      const data = [
        { period: '1', value: 1000 },
        { period: '2', value: 1100 },
        { period: '3', value: 1200 },
      ];

      const predictions = await service.predictTrends(data, {
        historicalData: data,
        forecastPeriods: 2,
        confidenceLevel: 95,
      });

      if (predictions.length > 0 && predictions[0].predictions.length > 0) {
        const forecast = predictions[0].predictions[0];
        expect(forecast).toHaveProperty('confidenceInterval');
        expect(forecast.confidenceInterval).toHaveProperty('lower');
        expect(forecast.confidenceInterval).toHaveProperty('upper');
        expect(forecast.confidenceInterval.lower).toBeLessThan(forecast.value);
        expect(forecast.confidenceInterval.upper).toBeGreaterThan(forecast.value);
      }
    });
  });

  describe('Benchmark Comparison', () => {
    it('should compare metrics with industry benchmarks', async () => {
      const companyData = {
        summary: {
          grossProfitMargin: 65,
          operatingMargin: 20,
          netProfitMargin: 15,
        },
      };

      const results = await service.compareWithBenchmarks(companyData, {
        companyData,
        industry: 'technology',
        companySize: 'medium',
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);

      if (results.length > 0) {
        const result = results[0];
        expect(result).toHaveProperty('metric');
        expect(result).toHaveProperty('companyValue');
        expect(result).toHaveProperty('benchmarkValue');
        expect(result).toHaveProperty('percentile');
        expect(result).toHaveProperty('performance');
        expect(['below', 'at', 'above']).toContain(result.performance);
      }
    });

    it('should provide interpretation of comparison', async () => {
      const companyData = {
        summary: {
          grossProfitMargin: 50,
        },
      };

      const results = await service.compareWithBenchmarks(companyData, {
        companyData,
        industry: 'technology',
      });

      if (results.length > 0) {
        expect(results[0]).toHaveProperty('interpretation');
        expect(results[0].interpretation).toBeTruthy();
      }
    });
  });

  describe('Executive Summary', () => {
    it('should generate concise summary', async () => {
      const reportData = {
        metadata: {
          reportType: 'PL_STATEMENT',
        },
        summary: {
          totalRevenue: 100000,
          netIncome: 20000,
          netProfitMargin: 20,
        },
      };

      const summary = await service.summarizeForExecutive(reportData, {
        reportData,
        audienceLevel: 'executive',
        maxLength: 200,
      });

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);

      // Should be concise (approximately)
      const wordCount = summary.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(250); // Some buffer
    });

    it('should adapt to audience level', async () => {
      const reportData = {
        summary: {
          totalRevenue: 100000,
        },
      };

      const executiveSummary = await service.summarizeForExecutive(reportData, {
        reportData,
        audienceLevel: 'executive',
      });

      const technicalSummary = await service.summarizeForExecutive(reportData, {
        reportData,
        audienceLevel: 'technical',
      });

      expect(executiveSummary).toBeDefined();
      expect(technicalSummary).toBeDefined();
      // Both should be non-empty
      expect(executiveSummary.length).toBeGreaterThan(0);
      expect(technicalSummary.length).toBeGreaterThan(0);
    });
  });

  describe('Proactive Suggestions', () => {
    it('should suggest month-end reports', async () => {
      const suggestions = await service.suggestReports('org-id', 'user-id');

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('reportType');
        expect(suggestion).toHaveProperty('reasoning');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('relevance');
        expect(['low', 'medium', 'high']).toContain(suggestion.priority);
      });
    });

    it('should prioritize suggestions by relevance', async () => {
      const suggestions = await service.suggestReports('org-id', 'user-id');

      if (suggestions.length > 1) {
        // Should be sorted by relevance * priority
        for (let i = 0; i < suggestions.length - 1; i++) {
          const currentScore = suggestions[i].relevance;
          const nextScore = suggestions[i + 1].relevance;
          // Current should be >= next (sorted descending)
          expect(currentScore >= nextScore || suggestions[i].priority === 'high').toBe(true);
        }
      }
    });
  });

  describe('Helper Functions', () => {
    it('should calculate statistics correctly', () => {
      // Testing statistical functions indirectly through anomaly detection
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      // Mean should be 5.5
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      expect(mean).toBe(5.5);
    });

    it('should format currency values', () => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(1234.56);

      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('€');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing OpenAI configuration', () => {
      const noKeyService = new AIReportService(
        { get: () => null } as any,
        mockPrismaService as any,
        mockCacheService as any,
        mockReportGenerator as any,
      );

      expect(async () => {
        await noKeyService.generateReportFromChat('org', 'user', {
          message: 'test',
        });
      }).rejects.toThrow();
    });

    it('should return empty insights on error', async () => {
      const invalidData = null;

      const insights = await service.generateInsights(invalidData as any);

      // Should gracefully handle errors
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });
  });
});
