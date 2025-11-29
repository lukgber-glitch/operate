import { Test, TestingModule } from '@nestjs/testing';
import { StreamableFile } from '@nestjs/common';
import { ComplianceController } from '../compliance.controller';
import { ComplianceService } from '../compliance.service';
import { CreateExportDto } from '../dto/create-export.dto';
import { ExportFilterDto } from '../dto/export-filter.dto';
import { ScheduleExportDto } from '../dto/schedule-export.dto';
import { ExportStatus } from '../interfaces/export-status.interface';
import { ExportFrequency } from '../interfaces/scheduled-export.interface';
import { Readable } from 'stream';

describe('ComplianceController', () => {
  let controller: ComplianceController;
  let service: ComplianceService;

  const mockUser = {
    userId: 'user_123',
    organizationId: 'org_456',
  };

  const mockExportResponse = {
    id: 'exp_123',
    organizationId: 'org_456',
    type: 'gobd' as const,
    status: ExportStatus.PENDING,
    dateRange: {
      start: '2024-01-01',
      end: '2024-03-31',
    },
    progress: 0,
    includeDocuments: true,
    comment: 'Test export',
    createdBy: 'user_123',
    createdAt: new Date(),
  };

  const mockPaginatedResponse = {
    data: [mockExportResponse],
    meta: {
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    },
  };

  const mockScheduleResponse = {
    id: 'sched_123',
    organizationId: 'org_456',
    type: 'gobd' as const,
    frequency: ExportFrequency.MONTHLY,
    timezone: 'UTC',
    enabled: true,
    includeDocuments: false,
    notifyEmail: ['test@example.com'],
    nextRun: new Date(),
    failureCount: 0,
    maxRetries: 3,
    createdBy: 'user_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    validatedAt: new Date(),
    schemaVersion: '1.0.0',
    totalRecords: 1000,
    recordsWithErrors: 0,
    recordsWithWarnings: 5,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        {
          provide: ComplianceService,
          useValue: {
            createExport: jest.fn().mockResolvedValue(mockExportResponse),
            listExports: jest.fn().mockResolvedValue(mockPaginatedResponse),
            getExport: jest.fn().mockResolvedValue(mockExportResponse),
            deleteExport: jest.fn().mockResolvedValue(undefined),
            validateExport: jest.fn().mockResolvedValue(mockValidationResult),
            getExportStream: jest.fn().mockResolvedValue(Readable.from(['test'])),
            createSchedule: jest.fn().mockResolvedValue(mockScheduleResponse),
            listSchedules: jest.fn().mockResolvedValue([mockScheduleResponse]),
            updateSchedule: jest.fn().mockResolvedValue(mockScheduleResponse),
            deleteSchedule: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<ComplianceController>(ComplianceController);
    service = module.get<ComplianceService>(ComplianceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createExport', () => {
    const createDto: CreateExportDto = {
      type: 'gobd',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      includeDocuments: true,
      comment: 'Test export',
    };

    it('should create an export', async () => {
      const req = { user: mockUser };
      const result = await controller.createExport(createDto, req);

      expect(result).toEqual(mockExportResponse);
      expect(service.createExport).toHaveBeenCalledWith(
        createDto,
        mockUser.userId,
        mockUser.organizationId,
      );
    });

    it('should call service with correct parameters', async () => {
      const req = { user: mockUser };
      await controller.createExport(createDto, req);

      expect(service.createExport).toHaveBeenCalledTimes(1);
    });
  });

  describe('listExports', () => {
    it('should list exports with default filters', async () => {
      const filter: ExportFilterDto = {};
      const req = { user: mockUser };

      const result = await controller.listExports(filter, req);

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.listExports).toHaveBeenCalledWith(filter, mockUser.organizationId);
    });

    it('should list exports with type filter', async () => {
      const filter: ExportFilterDto = { type: 'gobd' };
      const req = { user: mockUser };

      await controller.listExports(filter, req);

      expect(service.listExports).toHaveBeenCalledWith(filter, mockUser.organizationId);
    });

    it('should list exports with status filter', async () => {
      const filter: ExportFilterDto = { status: ExportStatus.COMPLETED };
      const req = { user: mockUser };

      await controller.listExports(filter, req);

      expect(service.listExports).toHaveBeenCalledWith(filter, mockUser.organizationId);
    });

    it('should list exports with pagination', async () => {
      const filter: ExportFilterDto = { page: 2, limit: 10 };
      const req = { user: mockUser };

      await controller.listExports(filter, req);

      expect(service.listExports).toHaveBeenCalledWith(filter, mockUser.organizationId);
    });
  });

  describe('getExport', () => {
    it('should get an export by ID', async () => {
      const exportId = 'exp_123';
      const req = { user: mockUser };

      const result = await controller.getExport(exportId, req);

      expect(result).toEqual(mockExportResponse);
      expect(service.getExport).toHaveBeenCalledWith(exportId, mockUser.organizationId);
    });
  });

  describe('downloadExport', () => {
    it('should download an export', async () => {
      const exportId = 'exp_123';
      const req = { user: mockUser };

      const result = await controller.downloadExport(exportId, req);

      expect(result).toBeInstanceOf(StreamableFile);
      expect(service.getExportStream).toHaveBeenCalledWith(
        exportId,
        mockUser.organizationId,
      );
    });
  });

  describe('deleteExport', () => {
    it('should delete an export', async () => {
      const exportId = 'exp_123';
      const req = { user: mockUser };

      await controller.deleteExport(exportId, req);

      expect(service.deleteExport).toHaveBeenCalledWith(exportId, mockUser.organizationId);
    });
  });

  describe('validateExport', () => {
    it('should validate an export', async () => {
      const exportId = 'exp_123';
      const req = { user: mockUser };

      const result = await controller.validateExport(exportId, req);

      expect(result).toEqual(mockValidationResult);
      expect(service.validateExport).toHaveBeenCalledWith(
        exportId,
        mockUser.organizationId,
      );
    });
  });

  describe('createSchedule', () => {
    const scheduleDto: ScheduleExportDto = {
      type: 'gobd',
      frequency: ExportFrequency.MONTHLY,
      dayOfMonth: 1,
      timezone: 'Europe/Berlin',
      enabled: true,
      includeDocuments: false,
      notifyEmail: ['test@example.com'],
      maxRetries: 3,
    };

    it('should create a schedule', async () => {
      const req = { user: mockUser };

      const result = await controller.createSchedule(scheduleDto, req);

      expect(result).toEqual(mockScheduleResponse);
      expect(service.createSchedule).toHaveBeenCalledWith(
        scheduleDto,
        mockUser.userId,
        mockUser.organizationId,
      );
    });
  });

  describe('listSchedules', () => {
    it('should list schedules', async () => {
      const req = { user: mockUser };

      const result = await controller.listSchedules(req);

      expect(result).toEqual([mockScheduleResponse]);
      expect(service.listSchedules).toHaveBeenCalledWith(mockUser.organizationId);
    });
  });

  describe('updateSchedule', () => {
    it('should update a schedule', async () => {
      const scheduleId = 'sched_123';
      const updateDto = { enabled: false };
      const req = { user: mockUser };

      const result = await controller.updateSchedule(scheduleId, updateDto, req);

      expect(result).toEqual(mockScheduleResponse);
      expect(service.updateSchedule).toHaveBeenCalledWith(
        scheduleId,
        updateDto,
        mockUser.organizationId,
      );
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a schedule', async () => {
      const scheduleId = 'sched_123';
      const req = { user: mockUser };

      await controller.deleteSchedule(scheduleId, req);

      expect(service.deleteSchedule).toHaveBeenCalledWith(
        scheduleId,
        mockUser.organizationId,
      );
    });
  });
});
