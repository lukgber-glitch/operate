import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ComplianceService } from '../compliance.service';
import { GobdService } from '../exports/gobd/gobd.service';
import { SaftService } from '../exports/saft/saft.service';
import { ExportStatus } from '../interfaces/export-status.interface';
import { CreateExportDto } from '../dto/create-export.dto';
import { ExportFilterDto } from '../dto/export-filter.dto';
import { ScheduleExportDto } from '../dto/schedule-export.dto';
import { ExportFrequency } from '../interfaces/scheduled-export.interface';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let gobdService: GobdService;
  let saftService: SaftService;

  const mockUserId = 'user_123';
  const mockOrgId = 'org_456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: GobdService,
          useValue: {
            generateExport: jest.fn().mockResolvedValue({
              createdBy: mockOrgId,
              createdAt: new Date(),
              completedAt: new Date(),
              fileSize: 1000000,
              checksum: 'sha256:test',
              storagePath: '/test/path',
              version: '1.0.0',
            }),
            validateExport: jest.fn().mockResolvedValue({
              isValid: true,
              errors: [],
              warnings: [],
              validatedAt: new Date(),
              schemaVersion: '1.0.0',
            }),
            getExportStream: jest.fn(),
          },
        },
        {
          provide: SaftService,
          useValue: {
            generateExport: jest.fn().mockResolvedValue({
              createdBy: mockOrgId,
              createdAt: new Date(),
              completedAt: new Date(),
              fileSize: 2000000,
              checksum: 'sha256:test2',
              storagePath: '/test/path2',
              version: '1.0.0',
            }),
            validateExport: jest.fn().mockResolvedValue({
              isValid: true,
              errors: [],
              warnings: [],
              validatedAt: new Date(),
              schemaVersion: '1.0.0',
            }),
            getExportStream: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
    gobdService = module.get<GobdService>(GobdService);
    saftService = module.get<SaftService>(SaftService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExport', () => {
    const validDto: CreateExportDto = {
      type: 'gobd',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      includeDocuments: true,
      comment: 'Test export',
    };

    it('should create a GoBD export successfully', async () => {
      const result = await service.createExport(validDto, mockUserId, mockOrgId);

      expect(result).toBeDefined();
      expect(result.type).toBe('gobd');
      expect(result.status).toBe(ExportStatus.PENDING);
      expect(result.organizationId).toBe(mockOrgId);
      expect(result.createdBy).toBe(mockUserId);
    });

    it('should create a SAF-T export successfully', async () => {
      const saftDto: CreateExportDto = { ...validDto, type: 'saft' };
      const result = await service.createExport(saftDto, mockUserId, mockOrgId);

      expect(result).toBeDefined();
      expect(result.type).toBe('saft');
      expect(result.status).toBe(ExportStatus.PENDING);
    });

    it('should reject if start date is after end date', async () => {
      const invalidDto: CreateExportDto = {
        ...validDto,
        startDate: '2024-03-31',
        endDate: '2024-01-01',
      };

      await expect(service.createExport(invalidDto, mockUserId, mockOrgId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if end date is in the future', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidDto: CreateExportDto = {
        ...validDto,
        endDate: futureDate.toISOString().split('T')[0],
      };

      await expect(service.createExport(invalidDto, mockUserId, mockOrgId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include optional fields in export', async () => {
      const dtoWithOptions: CreateExportDto = {
        ...validDto,
        options: { test: 'value' },
      };

      const result = await service.createExport(dtoWithOptions, mockUserId, mockOrgId);

      expect(result.comment).toBe('Test export');
      expect(result.includeDocuments).toBe(true);
    });
  });

  describe('getExport', () => {
    it('should retrieve an export by ID', async () => {
      const createDto: CreateExportDto = {
        type: 'gobd',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      const created = await service.createExport(createDto, mockUserId, mockOrgId);
      const retrieved = await service.getExport(created.id, mockOrgId);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.type).toBe('gobd');
    });

    it('should throw NotFoundException for non-existent export', async () => {
      await expect(service.getExport('nonexistent_id', mockOrgId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for wrong organization', async () => {
      const createDto: CreateExportDto = {
        type: 'gobd',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      const created = await service.createExport(createDto, mockUserId, mockOrgId);

      await expect(service.getExport(created.id, 'wrong_org')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('listExports', () => {
    beforeEach(async () => {
      // Create multiple exports
      await service.createExport(
        { type: 'gobd', startDate: '2024-01-01', endDate: '2024-01-31' },
        mockUserId,
        mockOrgId,
      );
      await service.createExport(
        { type: 'saft', startDate: '2024-02-01', endDate: '2024-02-28' },
        mockUserId,
        mockOrgId,
      );
      await service.createExport(
        { type: 'gobd', startDate: '2024-03-01', endDate: '2024-03-31' },
        mockUserId,
        mockOrgId,
      );
    });

    it('should list all exports for an organization', async () => {
      const filter: ExportFilterDto = {};
      const result = await service.listExports(filter, mockOrgId);

      expect(result.data).toHaveLength(3);
      expect(result.meta.total).toBe(3);
    });

    it('should filter exports by type', async () => {
      const filter: ExportFilterDto = { type: 'gobd' };
      const result = await service.listExports(filter, mockOrgId);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((exp) => exp.type === 'gobd')).toBe(true);
    });

    it('should filter exports by status', async () => {
      const filter: ExportFilterDto = { status: ExportStatus.PENDING };
      const result = await service.listExports(filter, mockOrgId);

      expect(result.data.every((exp) => exp.status === ExportStatus.PENDING)).toBe(true);
    });

    it('should paginate results correctly', async () => {
      const filter: ExportFilterDto = { page: 1, limit: 2 };
      const result = await service.listExports(filter, mockOrgId);

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.pageSize).toBe(2);
      expect(result.meta.hasMore).toBe(true);
    });

    it('should sort exports by createdAt descending by default', async () => {
      const filter: ExportFilterDto = {};
      const result = await service.listExports(filter, mockOrgId);

      expect(result.data[0].createdAt >= result.data[1].createdAt).toBe(true);
    });
  });

  describe('deleteExport', () => {
    it('should throw ForbiddenException for exports within retention period', async () => {
      const createDto: CreateExportDto = {
        type: 'gobd',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      const created = await service.createExport(createDto, mockUserId, mockOrgId);

      await expect(service.deleteExport(created.id, mockOrgId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException for non-existent export', async () => {
      await expect(service.deleteExport('nonexistent', mockOrgId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for wrong organization', async () => {
      const createDto: CreateExportDto = {
        type: 'gobd',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      const created = await service.createExport(createDto, mockUserId, mockOrgId);

      await expect(service.deleteExport(created.id, 'wrong_org')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('validateExport', () => {
    it('should throw BadRequestException for non-completed exports', async () => {
      const createDto: CreateExportDto = {
        type: 'gobd',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      const created = await service.createExport(createDto, mockUserId, mockOrgId);

      await expect(service.validateExport(created.id, mockOrgId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createSchedule', () => {
    const validScheduleDto: ScheduleExportDto = {
      type: 'gobd',
      frequency: ExportFrequency.MONTHLY,
      dayOfMonth: 1,
      timezone: 'Europe/Berlin',
      enabled: true,
      includeDocuments: false,
      notifyEmail: ['test@example.com'],
      maxRetries: 3,
    };

    it('should create a monthly schedule successfully', async () => {
      const result = await service.createSchedule(validScheduleDto, mockUserId, mockOrgId);

      expect(result).toBeDefined();
      expect(result.type).toBe('gobd');
      expect(result.frequency).toBe(ExportFrequency.MONTHLY);
      expect(result.organizationId).toBe(mockOrgId);
      expect(result.enabled).toBe(true);
    });

    it('should create a weekly schedule successfully', async () => {
      const weeklyDto: ScheduleExportDto = {
        ...validScheduleDto,
        frequency: ExportFrequency.WEEKLY,
        dayOfWeek: 1,
        dayOfMonth: undefined,
      };

      const result = await service.createSchedule(weeklyDto, mockUserId, mockOrgId);

      expect(result.frequency).toBe(ExportFrequency.WEEKLY);
      expect(result.dayOfWeek).toBe(1);
    });

    it('should calculate next run correctly', async () => {
      const result = await service.createSchedule(validScheduleDto, mockUserId, mockOrgId);

      expect(result.nextRun).toBeDefined();
      expect(result.nextRun).toBeInstanceOf(Date);
      expect(result.nextRun > new Date()).toBe(true);
    });
  });

  describe('listSchedules', () => {
    it('should list all schedules for an organization', async () => {
      const scheduleDto: ScheduleExportDto = {
        type: 'gobd',
        frequency: ExportFrequency.MONTHLY,
        timezone: 'UTC',
        enabled: true,
        includeDocuments: false,
        notifyEmail: ['test@example.com'],
      };

      await service.createSchedule(scheduleDto, mockUserId, mockOrgId);
      await service.createSchedule(scheduleDto, mockUserId, mockOrgId);

      const schedules = await service.listSchedules(mockOrgId);

      expect(schedules).toHaveLength(2);
      expect(schedules.every((s) => s.organizationId === mockOrgId)).toBe(true);
    });

    it('should not return schedules from other organizations', async () => {
      const scheduleDto: ScheduleExportDto = {
        type: 'gobd',
        frequency: ExportFrequency.MONTHLY,
        timezone: 'UTC',
        enabled: true,
        includeDocuments: false,
        notifyEmail: ['test@example.com'],
      };

      await service.createSchedule(scheduleDto, mockUserId, 'other_org');

      const schedules = await service.listSchedules(mockOrgId);

      expect(schedules).toHaveLength(0);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule enabled status', async () => {
      const scheduleDto: ScheduleExportDto = {
        type: 'gobd',
        frequency: ExportFrequency.MONTHLY,
        timezone: 'UTC',
        enabled: true,
        includeDocuments: false,
        notifyEmail: ['test@example.com'],
      };

      const created = await service.createSchedule(scheduleDto, mockUserId, mockOrgId);

      const updated = await service.updateSchedule(
        created.id,
        { enabled: false },
        mockOrgId,
      );

      expect(updated.enabled).toBe(false);
    });

    it('should throw NotFoundException for non-existent schedule', async () => {
      await expect(
        service.updateSchedule('nonexistent', { enabled: false }, mockOrgId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for wrong organization', async () => {
      const scheduleDto: ScheduleExportDto = {
        type: 'gobd',
        frequency: ExportFrequency.MONTHLY,
        timezone: 'UTC',
        enabled: true,
        includeDocuments: false,
        notifyEmail: ['test@example.com'],
      };

      const created = await service.createSchedule(scheduleDto, mockUserId, mockOrgId);

      await expect(
        service.updateSchedule(created.id, { enabled: false }, 'wrong_org'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a schedule successfully', async () => {
      const scheduleDto: ScheduleExportDto = {
        type: 'gobd',
        frequency: ExportFrequency.MONTHLY,
        timezone: 'UTC',
        enabled: true,
        includeDocuments: false,
        notifyEmail: ['test@example.com'],
      };

      const created = await service.createSchedule(scheduleDto, mockUserId, mockOrgId);

      await service.deleteSchedule(created.id, mockOrgId);

      const schedules = await service.listSchedules(mockOrgId);
      expect(schedules.find((s) => s.id === created.id)).toBeUndefined();
    });

    it('should throw NotFoundException for non-existent schedule', async () => {
      await expect(service.deleteSchedule('nonexistent', mockOrgId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
