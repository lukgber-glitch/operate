import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GobdService } from '../gobd.service';
import { GobdBuilderService } from '../gobd-builder.service';
import { PrismaService } from '../../../../database/prisma.service';
import { CreateGobdExportDto } from '../dto/create-gobd-export.dto';
import { ExportStatus, DocumentType } from '../interfaces/gobd-config.interface';

describe('GobdService', () => {
  let service: GobdService;
  let prismaService: PrismaService;
  let gobdBuilder: GobdBuilderService;
  let configService: ConfigService;

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
    },
    gobdExport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockGobdBuilder = {
    buildIndexXml: jest.fn(),
    exportDataTables: jest.fn(),
    packageDocuments: jest.fn(),
    generateChecksums: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'storage.gobdExportDir': '/tmp/gobd-exports',
        'storage.tempDir': '/tmp',
        'compliance.gobdRetentionDays': 30,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GobdService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GobdBuilderService,
          useValue: mockGobdBuilder,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GobdService>(GobdService);
    prismaService = module.get<PrismaService>(PrismaService);
    gobdBuilder = module.get<GobdBuilderService>(GobdBuilderService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExport', () => {
    const validDto: CreateGobdExportDto = {
      orgId: 'org-123',
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
      documentTypes: [DocumentType.INVOICES, DocumentType.RECEIPTS],
      includeDocuments: true,
      includeSignature: false,
      incremental: false,
    };

    const mockOrg = {
      id: 'org-123',
      name: 'Test Company',
      email: 'test@example.com',
      address: {
        street: 'Test Street 123',
        postalCode: '12345',
        city: 'Berlin',
        country: 'DE',
      },
    };

    it('should create a new export successfully', async () => {
      const mockExport = {
        id: 'gobd_123_abc',
        orgId: 'org-123',
        filename: 'gobd_export_20241129_120000.zip',
        status: ExportStatus.PENDING,
        startDate: validDto.dateRange.startDate,
        endDate: validDto.dateRange.endDate,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.gobdExport.create.mockResolvedValue(mockExport);

      const result = await service.createExport(validDto);

      expect(result).toMatchObject({
        id: mockExport.id,
        orgId: mockExport.orgId,
        status: ExportStatus.PENDING,
        filename: mockExport.filename,
      });

      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { id: validDto.orgId },
        include: { address: true },
      });

      expect(mockPrismaService.gobdExport.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if start date is after end date', async () => {
      const invalidDto = {
        ...validDto,
        dateRange: {
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01'),
        },
      };

      await expect(service.createExport(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.createExport(validDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getExportStatus', () => {
    const mockExport = {
      id: 'gobd_123_abc',
      orgId: 'org-123',
      filename: 'gobd_export_20241129_120000.zip',
      status: ExportStatus.COMPLETED,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      createdAt: new Date(),
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      metadata: {
        totalFiles: 100,
        totalSize: 1024000,
        transactionCount: 500,
        documentCount: 50,
        archiveHash: 'abc123',
      },
    };

    it('should return export status successfully', async () => {
      mockPrismaService.gobdExport.findUnique.mockResolvedValue(mockExport);

      const result = await service.getExportStatus('gobd_123_abc');

      expect(result).toMatchObject({
        id: mockExport.id,
        status: ExportStatus.COMPLETED,
        metadata: mockExport.metadata,
      });
    });

    it('should include download URL when export is ready', async () => {
      const readyExport = { ...mockExport, status: ExportStatus.READY };
      mockPrismaService.gobdExport.findUnique.mockResolvedValue(readyExport);

      const result = await service.getExportStatus('gobd_123_abc');

      expect(result.downloadUrl).toBe(
        '/api/compliance/exports/gobd/gobd_123_abc/download',
      );
    });

    it('should throw NotFoundException if export does not exist', async () => {
      mockPrismaService.gobdExport.findUnique.mockResolvedValue(null);

      await expect(service.getExportStatus('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listExports', () => {
    const mockExports = [
      {
        id: 'gobd_1',
        status: ExportStatus.COMPLETED,
        filename: 'export1.zip',
        createdAt: new Date('2024-01-01'),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        fileSize: 1024000,
      },
      {
        id: 'gobd_2',
        status: ExportStatus.READY,
        filename: 'export2.zip',
        createdAt: new Date('2024-02-01'),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        fileSize: 2048000,
      },
    ];

    it('should list exports for organization', async () => {
      mockPrismaService.gobdExport.findMany.mockResolvedValue(mockExports);
      mockPrismaService.gobdExport.count.mockResolvedValue(2);

      const result = await service.listExports('org-123');

      expect(result.exports).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrismaService.gobdExport.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-123', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.gobdExport.findMany.mockResolvedValue([mockExports[0]]);
      mockPrismaService.gobdExport.count.mockResolvedValue(2);

      await service.listExports('org-123', 10);

      expect(mockPrismaService.gobdExport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('deleteExport', () => {
    const mockExport = {
      id: 'gobd_123_abc',
      orgId: 'org-123',
      filename: 'gobd_export_20241129_120000.zip',
      status: ExportStatus.COMPLETED,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      createdAt: new Date(),
      expiresAt: new Date(),
    };

    it('should delete export successfully', async () => {
      mockPrismaService.gobdExport.findUnique.mockResolvedValue(mockExport);
      mockPrismaService.gobdExport.update.mockResolvedValue({
        ...mockExport,
        status: ExportStatus.DELETED,
      });

      await service.deleteExport('gobd_123_abc');

      expect(mockPrismaService.gobdExport.update).toHaveBeenCalledWith({
        where: { id: 'gobd_123_abc' },
        data: {
          status: ExportStatus.DELETED,
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if export does not exist', async () => {
      mockPrismaService.gobdExport.findUnique.mockResolvedValue(null);

      await expect(service.deleteExport('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cleanupExpiredExports', () => {
    it('should cleanup expired exports', async () => {
      const expiredExports = [
        { id: 'gobd_1', filename: 'export1.zip' },
        { id: 'gobd_2', filename: 'export2.zip' },
      ];

      mockPrismaService.gobdExport.findMany.mockResolvedValue(expiredExports);
      mockPrismaService.gobdExport.findUnique
        .mockResolvedValueOnce(expiredExports[0])
        .mockResolvedValueOnce(expiredExports[1]);
      mockPrismaService.gobdExport.update.mockResolvedValue({});

      await service.cleanupExpiredExports();

      expect(mockPrismaService.gobdExport.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          deletedAt: null,
        },
      });

      expect(mockPrismaService.gobdExport.update).toHaveBeenCalledTimes(2);
    });
  });
});
