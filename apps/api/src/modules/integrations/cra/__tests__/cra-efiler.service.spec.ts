import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CraEfilerService } from '../services/cra-efiler.service';
import { CraAuthService } from '../cra-auth.service';
import { CraNetFileClient } from '../cra-netfile.client';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  GstHstReturn,
  GstHstReturnType,
  CraFilingStatus,
} from '../interfaces/cra.interface';

describe('CraEfilerService', () => {
  let service: CraEfilerService;
  let authService: CraAuthService;
  let netfileClient: CraNetFileClient;
  let prismaService: PrismaService;

  const mockAuthService = {
    getConnectionInfo: jest.fn(),
  };

  const mockNetFileClient = {
    validateReturn: jest.fn(),
    submitReturn: jest.fn(),
    checkStatus: jest.fn(),
  };

  const mockPrismaService = {
    integrationSubmission: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    integrationAuditLog: {
      create: jest.fn(),
    },
  };

  const mockGstHstReturn: GstHstReturn = {
    businessNumber: '123456789RT0001',
    reportingPeriod: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      frequency: 'quarterly',
      dueDate: new Date('2024-04-30'),
    },
    returnType: GstHstReturnType.GST34,
    line101_salesRevenue: 100000,
    line103_taxCollected: 5000,
    line105_totalTaxToRemit: 5000,
    line106_currentITCs: 2000,
    line108_totalITCs: 2000,
    line109_netTax: 3000,
    certifierName: 'John Doe',
    certifierCapacity: 'Owner',
    declarationDate: new Date('2024-04-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CraEfilerService,
        {
          provide: CraAuthService,
          useValue: mockAuthService,
        },
        {
          provide: CraNetFileClient,
          useValue: mockNetFileClient,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CraEfilerService>(CraEfilerService);
    authService = module.get<CraAuthService>(CraAuthService);
    netfileClient = module.get<CraNetFileClient>(CraNetFileClient);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateReturn', () => {
    it('should successfully validate a valid return', async () => {
      const organizationId = 'org-123';

      mockAuthService.getConnectionInfo.mockResolvedValue({
        organizationId,
        status: 'CONNECTED',
      });

      mockNetFileClient.validateReturn.mockResolvedValue({
        status: CraFilingStatus.VALIDATED,
        errors: [],
      });

      mockPrismaService.integrationAuditLog.create.mockResolvedValue({});

      const result = await service.validateReturn(organizationId, mockGstHstReturn);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockNetFileClient.validateReturn).toHaveBeenCalled();
    });

    it('should detect invalid business number format', async () => {
      const organizationId = 'org-123';
      const invalidReturn = {
        ...mockGstHstReturn,
        businessNumber: 'INVALID',
      };

      mockAuthService.getConnectionInfo.mockResolvedValue({
        organizationId,
        status: 'CONNECTED',
      });

      const result = await service.validateReturn(organizationId, invalidReturn);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Business Number');
    });

    it('should detect line calculation errors', async () => {
      const organizationId = 'org-123';
      const invalidReturn = {
        ...mockGstHstReturn,
        line105_totalTaxToRemit: 9999, // Should be 5000
      };

      mockAuthService.getConnectionInfo.mockResolvedValue({
        organizationId,
        status: 'CONNECTED',
      });

      const result = await service.validateReturn(organizationId, invalidReturn);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'line105_totalTaxToRemit')).toBe(
        true,
      );
    });

    it('should fail when CRA connection is not active', async () => {
      const organizationId = 'org-123';

      mockAuthService.getConnectionInfo.mockResolvedValue({
        organizationId,
        status: 'DISCONNECTED',
      });

      await expect(
        service.validateReturn(organizationId, mockGstHstReturn),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitReturn', () => {
    it('should successfully submit a valid return', async () => {
      const organizationId = 'org-123';
      const filingRequest = {
        organizationId,
        gstHstReturn: mockGstHstReturn,
        transmitterInfo: {
          name: 'Test Transmitter',
          efileNumber: 'TEST12345678',
          contactPhone: '+15551234567',
          contactEmail: 'test@example.com',
        },
      };

      mockAuthService.getConnectionInfo.mockResolvedValue({
        organizationId,
        status: 'CONNECTED',
      });

      mockPrismaService.integrationSubmission.findFirst.mockResolvedValue(null);

      mockNetFileClient.submitReturn.mockResolvedValue({
        status: CraFilingStatus.SUBMITTED,
        confirmationNumber: 'CRA-CONF-12345',
        filedAt: new Date(),
      });

      mockPrismaService.integrationSubmission.create.mockResolvedValue({});
      mockPrismaService.integrationAuditLog.create.mockResolvedValue({});

      const result = await service.submitReturn(filingRequest);

      expect(result.status).toBe(CraFilingStatus.SUBMITTED);
      expect(result.confirmationNumber).toBeDefined();
      expect(mockNetFileClient.submitReturn).toHaveBeenCalled();
      expect(mockPrismaService.integrationSubmission.create).toHaveBeenCalled();
    });

    it('should prevent duplicate submissions', async () => {
      const organizationId = 'org-123';
      const filingRequest = {
        organizationId,
        gstHstReturn: mockGstHstReturn,
        transmitterInfo: {
          name: 'Test Transmitter',
          efileNumber: 'TEST12345678',
          contactPhone: '+15551234567',
          contactEmail: 'test@example.com',
        },
      };

      mockAuthService.getConnectionInfo.mockResolvedValue({
        organizationId,
        status: 'CONNECTED',
      });

      // Simulate existing submission
      mockPrismaService.integrationSubmission.findFirst.mockResolvedValue({
        id: 'existing-submission',
        organizationId,
      });

      await expect(service.submitReturn(filingRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject returns with validation errors', async () => {
      const organizationId = 'org-123';
      const invalidReturn = {
        ...mockGstHstReturn,
        certifierName: '', // Required field
      };

      const filingRequest = {
        organizationId,
        gstHstReturn: invalidReturn,
        transmitterInfo: {
          name: 'Test Transmitter',
          efileNumber: 'TEST12345678',
          contactPhone: '+15551234567',
          contactEmail: 'test@example.com',
        },
      };

      await expect(service.submitReturn(filingRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkFilingStatus', () => {
    it('should retrieve filing status from CRA', async () => {
      const organizationId = 'org-123';
      const confirmationNumber = 'CRA-CONF-12345';

      mockAuthService.getConnectionInfo.mockResolvedValue({
        organizationId,
        status: 'CONNECTED',
      });

      mockNetFileClient.checkStatus.mockResolvedValue({
        status: CraFilingStatus.ACCEPTED,
        processedAt: new Date(),
      });

      mockPrismaService.integrationSubmission.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.integrationAuditLog.create.mockResolvedValue({});

      const result = await service.checkFilingStatus(
        organizationId,
        confirmationNumber,
      );

      expect(result.status).toBe(CraFilingStatus.ACCEPTED);
      expect(mockNetFileClient.checkStatus).toHaveBeenCalledWith(
        expect.any(String),
        confirmationNumber,
      );
    });
  });

  describe('getFilingHistory', () => {
    it('should retrieve filing history for organization', async () => {
      const organizationId = 'org-123';

      const mockFilings = [
        {
          id: 'filing-1',
          organizationId,
          provider: 'CRA',
          status: CraFilingStatus.ACCEPTED,
          createdAt: new Date(),
        },
        {
          id: 'filing-2',
          organizationId,
          provider: 'CRA',
          status: CraFilingStatus.SUBMITTED,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.integrationSubmission.findMany.mockResolvedValue(
        mockFilings,
      );

      const result = await service.getFilingHistory(organizationId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.integrationSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId,
            provider: 'CRA',
          }),
        }),
      );
    });

    it('should filter filing history by date range', async () => {
      const organizationId = 'org-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      mockPrismaService.integrationSubmission.findMany.mockResolvedValue([]);

      await service.getFilingHistory(organizationId, {
        startDate,
        endDate,
        limit: 50,
      });

      expect(mockPrismaService.integrationSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
          take: 50,
        }),
      );
    });
  });
});
