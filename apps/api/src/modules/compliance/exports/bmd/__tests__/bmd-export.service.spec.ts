import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BmdExportService } from '../bmd-export.service';
import { PrismaService } from '@/modules/database/prisma.service';

describe('BmdExportService', () => {
  let service: BmdExportService;
  let prisma: PrismaService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'storage.bmdExportDir': '/tmp/bmd-exports',
        'storage.tempDir': '/tmp',
        'compliance.bmdRetentionDays': 30,
      };
      return config[key];
    }),
  };

  const mockPrismaService = {
    organisation: {
      findUnique: jest.fn(),
    },
    gobdExport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
    },
    supplier: {
      findMany: jest.fn(),
    },
    taxConfiguration: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BmdExportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BmdExportService>(BmdExportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExport', () => {
    it('should reject export for non-Austrian organization', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
        countryCode: 'DE', // German organization
      });

      const dto = {
        orgId: 'org-1',
        exportTypes: ['BOOKING_JOURNAL'],
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
      };

      await expect(service.createExport(dto as any)).rejects.toThrow(
        'BMD export is only available for Austrian organizations',
      );
    });

    it('should reject export with invalid date range', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
        countryCode: 'AT',
      });

      const dto = {
        orgId: 'org-1',
        exportTypes: ['BOOKING_JOURNAL'],
        dateRange: {
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01'), // End before start
        },
      };

      await expect(service.createExport(dto as any)).rejects.toThrow(
        'Start date must be before end date',
      );
    });

    it('should create export for Austrian organization', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        name: 'Test Austrian Org',
        countryCode: 'AT',
        settings: {},
      });

      mockPrismaService.gobdExport.create.mockResolvedValue({
        id: 'bmd_123456_abc',
        orgId: 'org-1',
        filename: 'bmd_export_2024_org-1.zip',
        status: 'PENDING',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date(),
      });

      const dto = {
        orgId: 'org-1',
        exportTypes: ['BOOKING_JOURNAL'],
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
      };

      const result = await service.createExport(dto as any);

      expect(result).toBeDefined();
      expect(result.orgId).toBe('org-1');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('getExportStatus', () => {
    it('should return export status', async () => {
      const mockExport = {
        id: 'bmd_123456_abc',
        orgId: 'org-1',
        filename: 'bmd_export_2024_org-1.zip',
        status: 'READY',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date(),
        completedAt: new Date(),
        fileSize: 1024000,
      };

      mockPrismaService.gobdExport.findUnique.mockResolvedValue(mockExport);

      const result = await service.getExportStatus('bmd_123456_abc');

      expect(result).toBeDefined();
      expect(result.id).toBe('bmd_123456_abc');
      expect(result.status).toBe('READY');
      expect(result.downloadUrl).toContain('/download');
    });

    it('should throw error for non-existent export', async () => {
      mockPrismaService.gobdExport.findUnique.mockResolvedValue(null);

      await expect(service.getExportStatus('invalid-id')).rejects.toThrow(
        'Export not found',
      );
    });
  });

  describe('listExports', () => {
    it('should return list of exports', async () => {
      const mockExports = [
        {
          id: 'bmd_1',
          orgId: 'org-1',
          filename: 'export1.zip',
          status: 'READY',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          createdAt: new Date(),
          fileSize: 1024000,
        },
      ];

      mockPrismaService.gobdExport.findMany.mockResolvedValue(mockExports);
      mockPrismaService.gobdExport.count.mockResolvedValue(1);

      const result = await service.listExports('org-1');

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
