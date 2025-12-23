/**
 * Fraud Prevention Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FraudPreventionService } from '../fraud-prevention.service';
import { PrismaService } from '@/modules/database/prisma.service';

describe('FraudPreventionService', () => {
  let service: FraudPreventionService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    fraudAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    fraudAuditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudPreventionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FraudPreventionService>(FraudPreventionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkTransaction', () => {
    it('should detect duplicate transactions', async () => {
      const transactionId = 'txn-123';
      const orgId = 'org-456';
      const userId = 'user-789';

      const transaction = {
        id: transactionId,
        orgId,
        amount: 10000, // €100
        date: new Date('2025-01-15'),
        description: 'Coffee shop',
        categoryCode: 'BUSINESS_MEALS',
        counterparty: 'Starbucks',
        merchantId: 'merchant-1',
        metadata: {},
      };

      // Same transaction exists in history
      const duplicateTransaction = {
        ...transaction,
        id: 'txn-duplicate',
        date: new Date('2025-01-15'),
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(transaction);
      mockPrismaService.transaction.findMany.mockResolvedValue([
        duplicateTransaction,
      ]);
      mockPrismaService.fraudAlert.create.mockResolvedValue({});
      mockPrismaService.fraudAuditLog.create.mockResolvedValue({});

      const result = await service.checkTransaction(
        transactionId,
        orgId,
        userId,
      );

      expect(result.hasFraudSignals).toBe(true);
      expect(result.duplicateCheck).toBeDefined();
      expect(result.duplicateCheck?.isDuplicate).toBe(true);
      expect(result.alerts.length).toBeGreaterThan(0);
    });

    it('should detect threshold violations', async () => {
      const transactionId = 'txn-123';
      const orgId = 'org-456';
      const userId = 'user-789';

      const transaction = {
        id: transactionId,
        orgId,
        amount: 130000, // €1,300 - exceeds home office limit
        date: new Date('2025-01-15'),
        description: 'Home office expense',
        categoryCode: 'HOME_OFFICE',
        counterparty: 'Furniture Store',
        merchantId: null,
        metadata: {},
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(transaction);
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.fraudAlert.create.mockResolvedValue({});
      mockPrismaService.fraudAuditLog.create.mockResolvedValue({});

      const result = await service.checkTransaction(
        transactionId,
        orgId,
        userId,
        'DE',
      );

      expect(result.hasFraudSignals).toBe(true);
      expect(result.thresholdStatus).toBeDefined();
      expect(result.thresholdStatus?.hasExceeded).toBe(true);
    });

    it('should allow normal transactions', async () => {
      const transactionId = 'txn-123';
      const orgId = 'org-456';
      const userId = 'user-789';

      const transaction = {
        id: transactionId,
        orgId,
        amount: 2500, // €25
        date: new Date('2025-01-15'),
        description: 'Business lunch',
        categoryCode: 'BUSINESS_MEALS',
        counterparty: 'Restaurant',
        merchantId: null,
        metadata: {},
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(transaction);
      mockPrismaService.transaction.findMany.mockResolvedValue([
        {
          ...transaction,
          id: 'txn-different',
          amount: 3000,
          date: new Date('2025-01-10'),
          description: 'Different restaurant',
        },
      ]);
      mockPrismaService.fraudAlert.create.mockResolvedValue({});
      mockPrismaService.fraudAuditLog.create.mockResolvedValue({});

      const result = await service.checkTransaction(
        transactionId,
        orgId,
        userId,
      );

      // Should complete without critical alerts
      expect(result).toBeDefined();
      expect(result.recommendedAction).not.toBe('block');
    });
  });

  describe('reviewAlert', () => {
    it('should mark alert as confirmed', async () => {
      const alertId = 'alert-123';
      const orgId = 'org-456';
      const userId = 'user-789';

      const alert = {
        id: alertId,
        orgId,
        status: 'pending',
        type: 'duplicate_transaction',
        severity: 'high',
      };

      mockPrismaService.fraudAlert.findUnique.mockResolvedValue(alert);
      mockPrismaService.fraudAlert.update.mockResolvedValue({
        ...alert,
        status: 'confirmed',
      });
      mockPrismaService.fraudAuditLog.create.mockResolvedValue({});

      await service.reviewAlert(alertId, orgId, userId, {
        decision: 'confirm',
        note: 'Confirmed as fraud',
      });

      expect(mockPrismaService.fraudAlert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: expect.objectContaining({
          status: 'confirmed',
          reviewedBy: userId,
          reviewNote: 'Confirmed as fraud',
        }),
      });
    });

    it('should mark alert as dismissed', async () => {
      const alertId = 'alert-123';
      const orgId = 'org-456';
      const userId = 'user-789';

      const alert = {
        id: alertId,
        orgId,
        status: 'pending',
      };

      mockPrismaService.fraudAlert.findUnique.mockResolvedValue(alert);
      mockPrismaService.fraudAlert.update.mockResolvedValue({
        ...alert,
        status: 'dismissed',
      });
      mockPrismaService.fraudAuditLog.create.mockResolvedValue({});

      await service.reviewAlert(alertId, orgId, userId, {
        decision: 'dismiss',
        note: 'False positive',
      });

      expect(mockPrismaService.fraudAlert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: expect.objectContaining({
          status: 'dismissed',
          reviewNote: 'False positive',
        }),
      });
    });
  });

  describe('getStatistics', () => {
    it('should calculate fraud statistics', async () => {
      const orgId = 'org-456';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const alerts = [
        {
          id: '1',
          orgId,
          type: 'duplicate_transaction',
          severity: 'high',
          status: 'confirmed',
          createdAt: new Date('2025-01-10'),
          reviewedAt: new Date('2025-01-11'),
          metadata: { categoryCode: 'BUSINESS_MEALS' },
        },
        {
          id: '2',
          orgId,
          type: 'threshold_exceeded',
          severity: 'critical',
          status: 'dismissed',
          createdAt: new Date('2025-01-15'),
          reviewedAt: new Date('2025-01-16'),
          metadata: { categoryCode: 'HOME_OFFICE' },
        },
        {
          id: '3',
          orgId,
          type: 'suspicious_pattern',
          severity: 'warning',
          status: 'pending',
          createdAt: new Date('2025-01-20'),
          reviewedAt: null,
          metadata: {},
        },
      ];

      mockPrismaService.fraudAlert.findMany.mockResolvedValue(alerts);

      const stats = await service.getStatistics(orgId, startDate, endDate);

      expect(stats.totalAlerts).toBe(3);
      expect(stats.reviewedAlerts).toBe(2);
      expect(stats.confirmedFraud).toBe(1);
      expect(stats.falsePositives).toBe(1);
      expect(stats.precision).toBe(0.5); // 1 confirmed / 2 reviewed
      expect(stats.topCategories.length).toBeGreaterThan(0);
    });
  });
});
