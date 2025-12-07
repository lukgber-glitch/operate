/**
 * Unit tests for RecurringDetectorService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RecurringDetectorService } from './recurring-detector.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { addDays, addMonths, subMonths } from 'date-fns';

describe('RecurringDetectorService', () => {
  let service: RecurringDetectorService;
  let prisma: PrismaService;

  // Mock data
  const organizationId = 'test-org-123';
  const bankAccountId = 'test-account-123';

  // Create monthly AWS payments
  const createMonthlyTransactions = (count: number, baseAmount: number) => {
    const transactions = [];
    const startDate = subMonths(new Date(), count);

    for (let i = 0; i < count; i++) {
      transactions.push({
        id: `tx-aws-${i}`,
        bankAccountId,
        date: addMonths(startDate, i),
        description: 'AWS Cloud Services',
        amount: -(baseAmount + Math.random() * 10), // Small variance
        currency: 'EUR',
        type: 'debit',
        counterpartyName: 'Amazon Web Services',
        category: null,
        isReconciled: false,
        externalId: `ext-${i}`,
        counterpartyIban: null,
        reference: null,
        bookingText: null,
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return transactions;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringDetectorService,
        {
          provide: PrismaService,
          useValue: {
            bankAccount: {
              findMany: jest.fn(),
            },
            bankTransaction: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RecurringDetectorService>(RecurringDetectorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectRecurringTransactions', () => {
    it('should detect monthly AWS subscription', async () => {
      // Arrange
      const mockTransactions = createMonthlyTransactions(12, 299.0);

      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue(
        mockTransactions.map((tx) => ({
          ...tx,
          amount: String(tx.amount),
        })) as any,
      );

      // Act
      const patterns = await service.detectRecurringTransactions(organizationId);

      // Assert
      expect(patterns).toHaveLength(1);
      expect(patterns[0].vendorName).toContain('AWS');
      expect(patterns[0].frequency).toBe('monthly');
      expect(patterns[0].occurrences).toBe(12);
      expect(patterns[0].confidence).toBeGreaterThan(80);
      expect(patterns[0].isActive).toBe(true);
      expect(patterns[0].status).toBe('confirmed');
    });

    it('should detect multiple subscriptions', async () => {
      // Arrange
      const awsTransactions = createMonthlyTransactions(6, 299.0);
      const slackTransactions = Array.from({ length: 6 }, (_, i) => ({
        id: `tx-slack-${i}`,
        bankAccountId,
        date: addMonths(subMonths(new Date(), 6), i),
        description: 'Slack Technologies',
        amount: -15.0,
        currency: 'EUR',
        type: 'debit',
        counterpartyName: 'Slack',
        category: null,
        isReconciled: false,
        externalId: `ext-slack-${i}`,
        counterpartyIban: null,
        reference: null,
        bookingText: null,
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const allTransactions = [...awsTransactions, ...slackTransactions];

      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue(
        allTransactions.map((tx) => ({
          ...tx,
          amount: String(tx.amount),
        })) as any,
      );

      // Act
      const patterns = await service.detectRecurringTransactions(organizationId);

      // Assert
      expect(patterns).toHaveLength(2);
      expect(patterns.some((p) => p.vendorName.includes('AWS'))).toBe(true);
      expect(patterns.some((p) => p.vendorName.includes('Slack'))).toBe(true);
    });

    it('should filter by minimum occurrences', async () => {
      // Arrange
      const twoPayments = createMonthlyTransactions(2, 99.0);

      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue(
        twoPayments.map((tx) => ({
          ...tx,
          amount: String(tx.amount),
        })) as any,
      );

      // Act - require at least 3 occurrences
      const patterns = await service.detectRecurringTransactions(organizationId, {
        minOccurrences: 3,
      });

      // Assert
      expect(patterns).toHaveLength(0);
    });

    it('should detect ended subscriptions', async () => {
      // Arrange - last payment was 6 months ago
      const endedTransactions = Array.from({ length: 6 }, (_, i) => ({
        id: `tx-ended-${i}`,
        bankAccountId,
        date: subMonths(new Date(), 12 - i), // 12 months ago to 6 months ago
        description: 'Old Service',
        amount: -50.0,
        currency: 'EUR',
        type: 'debit',
        counterpartyName: 'Old Service Inc',
        category: null,
        isReconciled: false,
        externalId: `ext-${i}`,
        counterpartyIban: null,
        reference: null,
        bookingText: null,
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue(
        endedTransactions.map((tx) => ({
          ...tx,
          amount: String(tx.amount),
        })) as any,
      );

      // Act
      const patterns = await service.detectRecurringTransactions(organizationId, {
        includeEnded: true,
      });

      // Assert
      expect(patterns).toHaveLength(1);
      expect(patterns[0].isActive).toBe(false);
      expect(patterns[0].status).toBe('ended');
    });

    it('should handle no transactions', async () => {
      // Arrange
      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue([]);

      // Act
      const patterns = await service.detectRecurringTransactions(organizationId);

      // Assert
      expect(patterns).toHaveLength(0);
    });
  });

  describe('analyzeVendorPattern', () => {
    it('should analyze specific vendor pattern', async () => {
      // Arrange
      const awsTransactions = createMonthlyTransactions(12, 299.0);

      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue(
        awsTransactions.map((tx) => ({
          ...tx,
          amount: String(tx.amount),
        })) as any,
      );

      // Act
      const pattern = await service.analyzeVendorPattern(
        organizationId,
        'Amazon Web Services',
      );

      // Assert
      expect(pattern).not.toBeNull();
      expect(pattern!.vendorName).toContain('AWS');
      expect(pattern!.frequency).toBe('monthly');
      expect(pattern!.category).toBe('Cloud Services');
    });

    it('should return null for non-existent vendor', async () => {
      // Arrange
      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue([]);

      // Act
      const pattern = await service.analyzeVendorPattern(
        organizationId,
        'NonExistent Vendor',
      );

      // Assert
      expect(pattern).toBeNull();
    });
  });

  describe('predictNextPayments', () => {
    it('should predict upcoming payments', async () => {
      // Arrange - create pattern with next payment in 5 days
      const transactions = Array.from({ length: 6 }, (_, i) => ({
        id: `tx-${i}`,
        bankAccountId,
        date: subMonths(addDays(new Date(), 5), 6 - i),
        description: 'Monthly Service',
        amount: -50.0,
        currency: 'EUR',
        type: 'debit',
        counterpartyName: 'Service Inc',
        category: null,
        isReconciled: false,
        externalId: `ext-${i}`,
        counterpartyIban: null,
        reference: null,
        bookingText: null,
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue(
        transactions.map((tx) => ({
          ...tx,
          amount: String(tx.amount),
        })) as any,
      );

      // Act
      const upcoming = await service.predictNextPayments(organizationId, 30);

      // Assert
      expect(upcoming.length).toBeGreaterThan(0);
      expect(upcoming[0].daysTillDue).toBeLessThanOrEqual(30);
      expect(upcoming[0].daysTillDue).toBeGreaterThanOrEqual(0);
    });

    it('should sort payments by date', async () => {
      // Arrange - create multiple patterns
      const service1 = Array.from({ length: 6 }, (_, i) => ({
        id: `tx-s1-${i}`,
        bankAccountId,
        date: subMonths(addDays(new Date(), 5), 6 - i),
        description: 'Service 1',
        amount: -50.0,
        currency: 'EUR',
        type: 'debit',
        counterpartyName: 'Service 1',
        category: null,
        isReconciled: false,
        externalId: `ext-s1-${i}`,
        counterpartyIban: null,
        reference: null,
        bookingText: null,
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const service2 = Array.from({ length: 6 }, (_, i) => ({
        id: `tx-s2-${i}`,
        bankAccountId,
        date: subMonths(addDays(new Date(), 15), 6 - i),
        description: 'Service 2',
        amount: -75.0,
        currency: 'EUR',
        type: 'debit',
        counterpartyName: 'Service 2',
        category: null,
        isReconciled: false,
        externalId: `ext-s2-${i}`,
        counterpartyIban: null,
        reference: null,
        bookingText: null,
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue(
        [...service1, ...service2].map((tx) => ({
          ...tx,
          amount: String(tx.amount),
        })) as any,
      );

      // Act
      const upcoming = await service.predictNextPayments(organizationId, 30);

      // Assert
      expect(upcoming.length).toBe(2);
      expect(upcoming[0].daysTillDue).toBeLessThan(upcoming[1].daysTillDue);
    });
  });

  describe('getRecurringSummary', () => {
    it('should generate comprehensive summary', async () => {
      // Arrange
      const awsTransactions = createMonthlyTransactions(12, 299.0);
      const slackTransactions = Array.from({ length: 12 }, (_, i) => ({
        id: `tx-slack-${i}`,
        bankAccountId,
        date: addMonths(subMonths(new Date(), 12), i),
        description: 'Slack',
        amount: -15.0,
        currency: 'EUR',
        type: 'debit',
        counterpartyName: 'Slack',
        category: null,
        isReconciled: false,
        externalId: `ext-slack-${i}`,
        counterpartyIban: null,
        reference: null,
        bookingText: null,
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue(
        [...awsTransactions, ...slackTransactions].map((tx) => ({
          ...tx,
          amount: String(tx.amount),
        })) as any,
      );

      // Act
      const summary = await service.getRecurringSummary(organizationId);

      // Assert
      expect(summary).toBeDefined();
      expect(summary.subscriptionCount).toBe(2);
      expect(summary.totalMonthlyRecurring).toBeGreaterThan(0);
      expect(summary.totalYearlyRecurring).toBeGreaterThan(0);
      expect(summary.categories.length).toBeGreaterThan(0);
      expect(summary.topRecurringExpenses.length).toBeGreaterThan(0);
    });

    it('should categorize subscriptions correctly', async () => {
      // Arrange
      const awsTransactions = createMonthlyTransactions(6, 299.0);

      jest.spyOn(prisma.bankAccount, 'findMany').mockResolvedValue([
        { id: bankAccountId } as any,
      ]);

      jest.spyOn(prisma.bankTransaction, 'findMany').mockResolvedValue(
        awsTransactions.map((tx) => ({
          ...tx,
          amount: String(tx.amount),
        })) as any,
      );

      // Act
      const summary = await service.getRecurringSummary(organizationId);

      // Assert
      const cloudCategory = summary.categories.find(
        (c) => c.category === 'Cloud Services',
      );
      expect(cloudCategory).toBeDefined();
      expect(cloudCategory!.count).toBe(1);
    });
  });

  describe('isHealthy', () => {
    it('should return true when prisma is available', () => {
      expect(service.isHealthy()).toBe(true);
    });
  });
});
