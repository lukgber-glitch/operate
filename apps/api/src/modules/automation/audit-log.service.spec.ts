import { Test, TestingModule } from '@nestjs/testing';
import { AutomationAuditLogService } from './audit-log.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { AutomationMode } from '@prisma/client';

describe('AutomationAuditLogService', () => {
  let service: AutomationAuditLogService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    automationAuditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationAuditLogService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AutomationAuditLogService>(AutomationAuditLogService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          organisationId: 'org_1',
          action: 'invoice_created',
          feature: 'invoices',
          mode: AutomationMode.FULL_AUTO,
          entityType: 'Invoice',
          entityId: 'inv_1',
          wasAutoApproved: true,
          confidenceScore: 0.95,
          createdAt: new Date(),
          user: null,
          organisation: { id: 'org_1', name: 'Test Org' },
        },
      ];

      mockPrismaService.automationAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.automationAuditLog.count.mockResolvedValue(1);

      const result = await service.getAuditLogs({
        organisationId: 'org_1',
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        data: mockLogs,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(mockPrismaService.automationAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organisationId: 'org_1' },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should validate pagination parameters', async () => {
      await expect(
        service.getAuditLogs({
          organisationId: 'org_1',
          page: 0,
          limit: 20,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getAuditLogs({
          organisationId: 'org_1',
          page: 1,
          limit: 101,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should apply filters correctly', async () => {
      mockPrismaService.automationAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.automationAuditLog.count.mockResolvedValue(0);

      await service.getAuditLogs({
        organisationId: 'org_1',
        feature: 'invoices',
        action: 'invoice_created',
        wasAutoApproved: true,
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.automationAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organisationId: 'org_1',
            feature: 'invoices',
            action: 'invoice_created',
            wasAutoApproved: true,
          },
        }),
      );
    });
  });

  describe('getEntityAuditTrail', () => {
    it('should return audit trail for specific entity', async () => {
      const mockTrail = [
        {
          id: 'log_1',
          organisationId: 'org_1',
          action: 'invoice_created',
          feature: 'invoices',
          entityType: 'Invoice',
          entityId: 'inv_1',
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'log_2',
          organisationId: 'org_1',
          action: 'invoice_approved',
          feature: 'invoices',
          entityType: 'Invoice',
          entityId: 'inv_1',
          createdAt: new Date('2025-01-02'),
        },
      ];

      mockPrismaService.automationAuditLog.findMany.mockResolvedValue(mockTrail);

      const result = await service.getEntityAuditTrail('org_1', 'Invoice', 'inv_1');

      expect(result).toEqual(mockTrail);
      expect(mockPrismaService.automationAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          organisationId: 'org_1',
          entityType: 'Invoice',
          entityId: 'inv_1',
        },
        orderBy: { createdAt: 'asc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getAutomationStats', () => {
    it('should calculate statistics for given period', async () => {
      mockPrismaService.automationAuditLog.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // auto-approved
        .mockResolvedValueOnce(20); // manual override

      mockPrismaService.automationAuditLog.aggregate.mockResolvedValue({
        _avg: { confidenceScore: 0.89 },
      });

      mockPrismaService.automationAuditLog.groupBy
        .mockResolvedValueOnce([
          { feature: 'invoices', _count: 50 },
          { feature: 'expenses', _count: 50 },
        ])
        .mockResolvedValueOnce([
          { mode: AutomationMode.FULL_AUTO, _count: 80 },
          { mode: AutomationMode.SEMI_AUTO, _count: 20 },
        ]);

      const result = await service.getAutomationStats('org_1', 'week');

      expect(result).toMatchObject({
        totalAutomatedActions: 100,
        autoApprovedCount: 80,
        manualOverrideCount: 20,
        averageConfidenceScore: 0.89,
        byFeature: {
          invoices: 50,
          expenses: 50,
        },
        byMode: {
          FULL_AUTO: 80,
          SEMI_AUTO: 20,
        },
        period: 'week',
      });
    });
  });

  describe('createAuditLog', () => {
    it('should create audit log entry', async () => {
      const mockLog = {
        id: 'log_1',
        organisationId: 'org_1',
        action: 'invoice_created',
        feature: 'invoices',
        mode: AutomationMode.FULL_AUTO,
        entityType: 'Invoice',
        entityId: 'inv_1',
        confidenceScore: 0.95,
        wasAutoApproved: true,
        inputData: { amount: 1000 },
        outputData: { invoiceId: 'inv_1' },
        userId: null,
        createdAt: new Date(),
      };

      mockPrismaService.automationAuditLog.create.mockResolvedValue(mockLog);

      const result = await service.createAuditLog({
        organisationId: 'org_1',
        action: 'invoice_created',
        feature: 'invoices',
        mode: AutomationMode.FULL_AUTO,
        entityType: 'Invoice',
        entityId: 'inv_1',
        confidenceScore: 0.95,
        wasAutoApproved: true,
        inputData: { amount: 1000 },
        outputData: { invoiceId: 'inv_1' },
      });

      expect(result).toEqual(mockLog);
      expect(mockPrismaService.automationAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organisationId: 'org_1',
          action: 'invoice_created',
          entityId: 'inv_1',
        }),
      });
    });
  });

  describe('exportAuditLogs', () => {
    it('should validate date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2026-01-01'); // > 1 year

      await expect(
        service.exportAuditLogs({
          organisationId: 'org_1',
          startDate,
          endDate,
          format: 'json',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should export as JSON', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          organisationId: 'org_1',
          action: 'invoice_created',
          feature: 'invoices',
          mode: AutomationMode.FULL_AUTO,
          entityType: 'Invoice',
          entityId: 'inv_1',
          wasAutoApproved: true,
          confidenceScore: 0.95,
          createdAt: new Date('2025-12-01'),
          user: null,
        },
      ];

      mockPrismaService.automationAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.exportAuditLogs({
        organisationId: 'org_1',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-31'),
        format: 'json',
      });

      expect(result.contentType).toBe('application/json');
      expect(result.filename).toMatch(/automation-audit-logs-.*\.json/);
      expect(JSON.parse(result.content as string)).toEqual(mockLogs);
    });

    it('should export as CSV', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          organisationId: 'org_1',
          action: 'invoice_created',
          feature: 'invoices',
          mode: AutomationMode.FULL_AUTO,
          entityType: 'Invoice',
          entityId: 'inv_1',
          wasAutoApproved: true,
          confidenceScore: 0.95,
          createdAt: new Date('2025-12-01T10:00:00Z'),
          user: {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      mockPrismaService.automationAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.exportAuditLogs({
        organisationId: 'org_1',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-31'),
        format: 'csv',
      });

      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toMatch(/automation-audit-logs-.*\.csv/);
      expect(result.content).toContain('ID,Created At,Feature');
      expect(result.content).toContain('log_1');
      expect(result.content).toContain('invoice_created');
    });
  });
});
