/**
 * SAF-T Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SaftService } from '../saft.service';
import { SaftBuilderService } from '../saft-builder.service';
import { PrismaService } from '../../../../database/prisma.service';
import { CreateSaftExportDto } from '../dto';
import { SaftVariant, ExportScope, ExportStatus } from '../interfaces';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SaftService', () => {
  let service: SaftService;
  let prismaService: PrismaService;
  let builderService: SaftBuilderService;

  const mockPrismaService = {
    saftExport: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
  };

  const mockBuilderService = {
    buildSaftXml: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaftService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SaftBuilderService,
          useValue: mockBuilderService,
        },
      ],
    }).compile();

    service = module.get<SaftService>(SaftService);
    prismaService = module.get<PrismaService>(PrismaService);
    builderService = module.get<SaftBuilderService>(SaftBuilderService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExport', () => {
    const organizationId = 'org-123';
    const userId = 'user-123';

    const createDto: CreateSaftExportDto = {
      variant: SaftVariant.INTERNATIONAL,
      scope: ExportScope.FULL,
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
      includeOpeningBalances: true,
      includeClosingBalances: true,
      includeTaxDetails: true,
      includeCustomerSupplierDetails: true,
      compression: false,
      validation: true,
    };

    it('should create a new export', async () => {
      const mockExport = {
        id: 'SAFT-123',
        organizationId,
        createdBy: userId,
        variant: createDto.variant,
        scope: createDto.scope,
        startDate: new Date(createDto.dateRange.startDate),
        endDate: new Date(createDto.dateRange.endDate),
        status: ExportStatus.PENDING,
        createdAt: new Date(),
      };

      mockPrismaService.saftExport.create.mockResolvedValue(mockExport);

      const result = await service.createExport(
        organizationId,
        userId,
        createDto,
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(ExportStatus.PENDING);
      expect(result.variant).toBe(SaftVariant.INTERNATIONAL);
      expect(prismaService.saftExport.create).toHaveBeenCalled();
    });

    it('should reject invalid date range', async () => {
      const invalidDto = {
        ...createDto,
        dateRange: {
          startDate: '2024-12-31',
          endDate: '2024-01-01',
        },
      };

      await expect(
        service.createExport(organizationId, userId, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getExportStatus', () => {
    const organizationId = 'org-123';
    const exportId = 'SAFT-123';

    it('should return export status', async () => {
      const mockExport = {
        id: exportId,
        organizationId,
        status: ExportStatus.COMPLETED,
        variant: SaftVariant.INTERNATIONAL,
        scope: ExportScope.FULL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date(),
        createdBy: 'user-123',
      };

      mockPrismaService.saftExport.findFirst.mockResolvedValue(mockExport);

      const result = await service.getExportStatus(organizationId, exportId);

      expect(result).toBeDefined();
      expect(result.exportId).toBe(exportId);
      expect(result.status).toBe(ExportStatus.COMPLETED);
    });

    it('should throw NotFoundException for non-existent export', async () => {
      mockPrismaService.saftExport.findFirst.mockResolvedValue(null);

      await expect(
        service.getExportStatus(organizationId, exportId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listExports', () => {
    const organizationId = 'org-123';

    it('should return paginated list of exports', async () => {
      const mockExports = [
        {
          id: 'SAFT-1',
          organizationId,
          status: ExportStatus.COMPLETED,
          variant: SaftVariant.INTERNATIONAL,
          scope: ExportScope.FULL,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          createdAt: new Date(),
          createdBy: 'user-123',
        },
      ];

      mockPrismaService.saftExport.findMany.mockResolvedValue(mockExports);
      mockPrismaService.saftExport.count.mockResolvedValue(1);

      const result = await service.listExports(organizationId, 1, 10);

      expect(result).toBeDefined();
      expect(result.exports).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });
  });

  describe('deleteExport', () => {
    const organizationId = 'org-123';
    const exportId = 'SAFT-123';

    it('should delete export', async () => {
      const mockExport = {
        id: exportId,
        organizationId,
        status: ExportStatus.COMPLETED,
        variant: SaftVariant.INTERNATIONAL,
        scope: ExportScope.FULL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date(),
        createdBy: 'user-123',
      };

      mockPrismaService.saftExport.findFirst.mockResolvedValue(mockExport);
      mockPrismaService.saftExport.delete.mockResolvedValue(mockExport);

      await service.deleteExport(organizationId, exportId);

      expect(prismaService.saftExport.delete).toHaveBeenCalledWith({
        where: { id: exportId },
      });
    });
  });
});

describe('SaftBuilderService', () => {
  let service: SaftBuilderService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaftBuilderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SaftBuilderService>(SaftBuilderService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildSaftXml', () => {
    const organizationId = 'org-123';

    const options = {
      variant: SaftVariant.INTERNATIONAL,
      scope: ExportScope.FULL,
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
      includeOpeningBalances: true,
      includeClosingBalances: true,
      includeTaxDetails: true,
      includeCustomerSupplierDetails: true,
    };

    it('should build SAF-T XML', async () => {
      const mockOrganization = {
        id: organizationId,
        name: 'Test Company GmbH',
        taxNumber: 'DE123456789',
        email: 'test@example.com',
        currency: 'EUR',
        address: {
          street: 'Teststrasse 1',
          city: 'Berlin',
          postalCode: '10115',
        },
        countryContext: {
          country: 'DE',
        },
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(
        mockOrganization,
      );

      const result = await service.buildSaftXml(organizationId, options);

      expect(result).toBeDefined();
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<AuditFile');
      expect(result).toContain('<Header>');
      expect(result).toContain('<MasterFiles>');
    });

    it('should throw error for non-existent organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.buildSaftXml(organizationId, options),
      ).rejects.toThrow();
    });
  });

  describe('buildHeader', () => {
    const organizationId = 'org-123';
    const period = {
      year: 2024,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    };

    const options = {
      variant: SaftVariant.INTERNATIONAL,
      scope: ExportScope.FULL,
      dateRange: period,
      includeOpeningBalances: true,
      includeClosingBalances: true,
    };

    it('should build header with company information', async () => {
      const mockOrganization = {
        id: organizationId,
        name: 'Test Company GmbH',
        taxNumber: 'DE123456789',
        vatNumber: 'DE987654321',
        email: 'test@example.com',
        phone: '+49 30 12345678',
        currency: 'EUR',
        address: {
          street: 'Teststrasse 1',
          city: 'Berlin',
          postalCode: '10115',
          state: 'Berlin',
        },
        countryContext: {
          country: 'DE',
        },
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(
        mockOrganization,
      );

      const result = await service.buildHeader(organizationId, period, options);

      expect(result).toBeDefined();
      expect(result.auditFileVersion).toBe('2.00');
      expect(result.auditFileCountry).toBe('DE');
      expect(result.company.companyName).toBe('Test Company GmbH');
      expect(result.defaultCurrencyCode).toBe('EUR');
      expect(result.software.softwareCompanyName).toBe('Operate');
    });
  });
});
