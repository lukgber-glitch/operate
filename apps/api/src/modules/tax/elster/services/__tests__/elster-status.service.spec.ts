import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ElsterStatusService } from '../elster-status.service';
import {
  ElsterStatusError,
  ElsterStatusErrorCode,
  StatusSource,
} from '../../types/elster-status.types';
import { ElsterFilingStatus } from '../../types/elster-vat.types';
import { of, throwError } from 'rxjs';

describe('ElsterStatusService', () => {
  let service: ElsterStatusService;
  let prisma: PrismaService;
  let http: HttpService;
  let config: ConfigService;

  const mockFiling = {
    id: 'filing-1',
    organisationId: 'org-1',
    type: 'USTVA',
    year: 2024,
    period: 1,
    periodType: 'MONTHLY',
    status: ElsterFilingStatus.SUBMITTED,
    submissionId: 'sub-123',
    transferTicket: 'tt-123',
    submittedAt: new Date(),
    responseAt: null,
    data: {},
    response: null,
    errors: null,
    certificateId: 'cert-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
  };

  const mockOrganisation = {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElsterStatusService,
        {
          provide: PrismaService,
          useValue: {
            elsterFiling: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            elsterFilingStatusEvent: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            organisation: {
              findUnique: jest.fn(),
            },
            notification: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                TIGERVAT_BASE_URL: 'https://api.tigervat.test',
                TIGERVAT_API_KEY: 'test-key',
                ELSTER_POLLING_ENABLED: true,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ElsterStatusService>(ElsterStatusService);
    prisma = module.get<PrismaService>(PrismaService);
    http = module.get<HttpService>(HttpService);
    config = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStatus', () => {
    it('should update filing status successfully', async () => {
      const updatedFiling = { ...mockFiling, status: ElsterFilingStatus.ACCEPTED };

      jest.spyOn(prisma.elsterFiling, 'findUnique').mockResolvedValue(mockFiling as any);
      jest.spyOn(prisma.elsterFiling, 'update').mockResolvedValue(updatedFiling as any);
      jest.spyOn(prisma.elsterFilingStatusEvent, 'create').mockResolvedValue({} as any);
      jest.spyOn(prisma.organisation, 'findUnique').mockResolvedValue(mockOrganisation as any);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue({} as any);

      const result = await service.updateStatus(
        'filing-1',
        ElsterFilingStatus.ACCEPTED,
        {
          message: 'Accepted by ELSTER',
          timestamp: new Date(),
          source: StatusSource.POLLING,
        },
      );

      expect(result.success).toBe(true);
      expect(result.statusChanged).toBe(true);
      expect(result.previousStatus).toBe(ElsterFilingStatus.SUBMITTED);
      expect(result.newStatus).toBe(ElsterFilingStatus.ACCEPTED);
      expect(prisma.elsterFiling.update).toHaveBeenCalled();
      expect(prisma.elsterFilingStatusEvent.create).toHaveBeenCalled();
    });

    it('should throw error if filing not found', async () => {
      jest.spyOn(prisma.elsterFiling, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-id', ElsterFilingStatus.ACCEPTED),
      ).rejects.toThrow(ElsterStatusError);

      await expect(
        service.updateStatus('invalid-id', ElsterFilingStatus.ACCEPTED),
      ).rejects.toMatchObject({
        code: ElsterStatusErrorCode.FILING_NOT_FOUND,
      });
    });

    it('should validate status transitions', async () => {
      const acceptedFiling = {
        ...mockFiling,
        status: ElsterFilingStatus.ACCEPTED,
      };

      jest.spyOn(prisma.elsterFiling, 'findUnique').mockResolvedValue(acceptedFiling as any);

      await expect(
        service.updateStatus('filing-1', ElsterFilingStatus.SUBMITTED),
      ).rejects.toThrow(ElsterStatusError);

      await expect(
        service.updateStatus('filing-1', ElsterFilingStatus.SUBMITTED),
      ).rejects.toMatchObject({
        code: ElsterStatusErrorCode.INVALID_STATUS,
      });
    });

    it('should send notification on status change', async () => {
      const updatedFiling = { ...mockFiling, status: ElsterFilingStatus.ACCEPTED };

      jest.spyOn(prisma.elsterFiling, 'findUnique').mockResolvedValue(mockFiling as any);
      jest.spyOn(prisma.elsterFiling, 'update').mockResolvedValue(updatedFiling as any);
      jest.spyOn(prisma.elsterFilingStatusEvent, 'create').mockResolvedValue({} as any);
      jest.spyOn(prisma.organisation, 'findUnique').mockResolvedValue(mockOrganisation as any);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue({} as any);

      const result = await service.updateStatus(
        'filing-1',
        ElsterFilingStatus.ACCEPTED,
      );

      expect(result.notificationSent).toBe(true);
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'elster_status_change',
            orgId: 'org-1',
          }),
        }),
      );
    });
  });

  describe('pollForUpdates', () => {
    it('should poll tigerVAT and update status', async () => {
      const tigerVATResponse = {
        status: 200,
        data: {
          status: 'ACCEPTED',
          message: 'Filing accepted',
        },
      };

      jest.spyOn(prisma.elsterFiling, 'findUnique').mockResolvedValue(mockFiling as any);
      jest.spyOn(prisma.elsterFilingStatusEvent, 'findFirst').mockResolvedValue(null);
      jest.spyOn(http, 'get').mockReturnValue(of(tigerVATResponse) as any);
      jest.spyOn(service, 'updateStatus').mockResolvedValue({
        success: true,
        filing: { ...mockFiling, status: ElsterFilingStatus.ACCEPTED },
        statusChanged: true,
        previousStatus: ElsterFilingStatus.SUBMITTED,
        newStatus: ElsterFilingStatus.ACCEPTED,
        notificationSent: true,
      });

      const result = await service.pollForUpdates('filing-1', { force: true });

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('/vat/status/'),
        expect.any(Object),
      );
      expect(service.updateStatus).toHaveBeenCalledWith(
        'filing-1',
        ElsterFilingStatus.ACCEPTED,
        expect.any(Object),
      );
    });

    it('should skip polling for terminal statuses', async () => {
      const acceptedFiling = {
        ...mockFiling,
        status: ElsterFilingStatus.ACCEPTED,
      };

      jest.spyOn(prisma.elsterFiling, 'findUnique').mockResolvedValue(acceptedFiling as any);

      const result = await service.pollForUpdates('filing-1');

      expect(http.get).not.toHaveBeenCalled();
      expect(result.status).toBe(ElsterFilingStatus.ACCEPTED);
    });

    it('should handle polling errors', async () => {
      jest.spyOn(prisma.elsterFiling, 'findUnique').mockResolvedValue(mockFiling as any);
      jest.spyOn(prisma.elsterFilingStatusEvent, 'findFirst').mockResolvedValue(null);
      jest.spyOn(http, 'get').mockReturnValue(
        throwError(() => new Error('Network error')) as any,
      );

      await expect(service.pollForUpdates('filing-1', { force: true })).rejects.toThrow(
        ElsterStatusError,
      );
    });
  });

  describe('getPendingFilings', () => {
    it('should return pending filings', async () => {
      const pendingFilings = [
        { ...mockFiling, status: ElsterFilingStatus.SUBMITTED },
        { ...mockFiling, id: 'filing-2', status: ElsterFilingStatus.PENDING },
      ];

      jest.spyOn(prisma.elsterFiling, 'findMany').mockResolvedValue(pendingFilings as any);

      const result = await service.getPendingFilings();

      expect(result).toHaveLength(2);
      expect(prisma.elsterFiling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: [
                ElsterFilingStatus.SUBMITTED,
                ElsterFilingStatus.PENDING,
                ElsterFilingStatus.ERROR,
              ],
            },
          }),
        }),
      );
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook payload', async () => {
      const webhookPayload = {
        transferTicket: 'tt-123',
        status: 'ACCEPTED',
        timestamp: new Date().toISOString(),
        message: 'Filing accepted',
      };

      jest.spyOn(prisma.elsterFiling, 'findFirst').mockResolvedValue(mockFiling as any);
      jest.spyOn(service, 'updateStatus').mockResolvedValue({
        success: true,
        filing: { ...mockFiling, status: ElsterFilingStatus.ACCEPTED },
        statusChanged: true,
        previousStatus: ElsterFilingStatus.SUBMITTED,
        newStatus: ElsterFilingStatus.ACCEPTED,
        notificationSent: true,
      });

      const result = await service.handleWebhook(webhookPayload);

      expect(result.success).toBe(true);
      expect(service.updateStatus).toHaveBeenCalledWith(
        'filing-1',
        ElsterFilingStatus.ACCEPTED,
        expect.objectContaining({
          source: StatusSource.WEBHOOK,
        }),
      );
    });

    it('should validate webhook payload', async () => {
      const invalidPayload = {
        // Missing status
        transferTicket: 'tt-123',
      };

      await expect(service.handleWebhook(invalidPayload as any)).rejects.toThrow(
        ElsterStatusError,
      );
    });
  });

  describe('getFilingTimeline', () => {
    it('should return filing status timeline', async () => {
      const events = [
        {
          id: 'event-1',
          filingId: 'filing-1',
          fromStatus: ElsterFilingStatus.DRAFT,
          toStatus: ElsterFilingStatus.SUBMITTED,
          details: {},
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'event-2',
          filingId: 'filing-1',
          fromStatus: ElsterFilingStatus.SUBMITTED,
          toStatus: ElsterFilingStatus.ACCEPTED,
          details: {},
          createdAt: new Date('2024-01-02'),
        },
      ];

      jest.spyOn(prisma.elsterFilingStatusEvent, 'findMany').mockResolvedValue(events as any);

      const result = await service.getFilingTimeline('filing-1');

      expect(result).toHaveLength(2);
      expect(result[0].toStatus).toBe(ElsterFilingStatus.SUBMITTED);
      expect(result[1].toStatus).toBe(ElsterFilingStatus.ACCEPTED);
    });
  });

  describe('getStatusStatistics', () => {
    it('should return status statistics', async () => {
      const filings = [
        { status: ElsterFilingStatus.SUBMITTED },
        { status: ElsterFilingStatus.PENDING },
        { status: ElsterFilingStatus.ACCEPTED },
        { status: ElsterFilingStatus.ACCEPTED },
        { status: ElsterFilingStatus.REJECTED },
      ];

      jest.spyOn(prisma.elsterFiling, 'findMany').mockResolvedValue(filings as any);

      const result = await service.getStatusStatistics('org-1');

      expect(result.total).toBe(5);
      expect(result.pending).toBe(2);
      expect(result.needsAttention).toBe(1);
      expect(result.byStatus[ElsterFilingStatus.ACCEPTED]).toBe(2);
    });
  });
});
