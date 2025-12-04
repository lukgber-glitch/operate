import { Test, TestingModule } from '@nestjs/testing';
import { DeductionsService } from '../deductions.service';
import { PrismaService } from '../../../database/prisma.service';

describe('DeductionsService', () => {
  let service: DeductionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
    },
    deductionSuggestion: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeductionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DeductionsService>(DeductionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions for classified transactions', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          orgId: 'org-1',
          amount: 100,
          currency: 'EUR',
          description: 'Office supplies',
          date: new Date('2024-01-15'),
          category: 'office_supplies',
          categoryConfidence: 0.9,
          metadata: null,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.deductionSuggestion.findFirst.mockResolvedValue(null);
      mockPrismaService.deductionSuggestion.create.mockResolvedValue({
        id: 'suggestion-1',
        orgId: 'org-1',
        transactionId: 'tx-1',
        ruleId: 'de-werbungskosten-arbeitsmittel',
        categoryCode: 'WORK_EQUIPMENT',
        categoryName: 'Work Equipment',
        originalAmount: 100,
        deductibleAmount: 100,
        deductiblePercentage: 100,
        currency: 'EUR',
        legalReference: '§9 Abs. 1 Nr. 6 EStG',
        legalDescription: 'Arbeitsmittel als Werbungskosten',
        status: 'SUGGESTED',
        requirements: {},
        confidence: 0.85,
        reasoning: 'Match found',
        createdAt: new Date(),
      });

      const result = await service.generateSuggestions('org-1', {
        countryCode: 'DE',
        taxYear: 2024,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no transactions found', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.generateSuggestions('org-1', {
        countryCode: 'DE',
      });

      expect(result).toEqual([]);
    });
  });

  describe('confirmSuggestion', () => {
    it('should confirm a suggestion', async () => {
      const mockSuggestion = {
        id: 'suggestion-1',
        orgId: 'org-1',
        status: 'SUGGESTED',
      };

      const mockUpdated = {
        ...mockSuggestion,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: 'user-1',
      };

      mockPrismaService.deductionSuggestion.findFirst.mockResolvedValue(
        mockSuggestion,
      );
      mockPrismaService.deductionSuggestion.update.mockResolvedValue(mockUpdated);

      const result = await service.confirmSuggestion(
        'org-1',
        'suggestion-1',
        'user-1',
      );

      expect(result.status).toBe('CONFIRMED');
      expect(mockPrismaService.deductionSuggestion.update).toHaveBeenCalled();
    });
  });

  describe('rejectSuggestion', () => {
    it('should reject a suggestion with reason', async () => {
      const mockSuggestion = {
        id: 'suggestion-1',
        orgId: 'org-1',
        status: 'SUGGESTED',
      };

      const mockUpdated = {
        ...mockSuggestion,
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: 'user-1',
        rejectionReason: 'Not business related',
      };

      mockPrismaService.deductionSuggestion.findFirst.mockResolvedValue(
        mockSuggestion,
      );
      mockPrismaService.deductionSuggestion.update.mockResolvedValue(mockUpdated);

      const result = await service.rejectSuggestion(
        'org-1',
        'suggestion-1',
        'user-1',
        { reason: 'Not business related' },
      );

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Not business related');
    });
  });
});
