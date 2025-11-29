import { Test, TestingModule } from '@nestjs/testing';
import { LeaveService } from '../leave.service';
import { LeaveRepository } from '../leave.repository';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { EntitlementsCalculator } from '../entitlements/entitlements.calculator';
import { PrismaService } from '../../../database/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  LeaveType,
  LeaveRequestStatus,
  EmploymentStatus,
  ContractType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('LeaveService', () => {
  let service: LeaveService;
  let repository: jest.Mocked<LeaveRepository>;
  let entitlementsService: jest.Mocked<EntitlementsService>;
  let calculator: jest.Mocked<EntitlementsCalculator>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        {
          provide: LeaveRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmployee: jest.fn(),
            findPendingForOrganisation: jest.fn(),
            findForCalendar: jest.fn(),
            updateStatus: jest.fn(),
            delete: jest.fn(),
            hasOverlappingRequests: jest.fn(),
            getTotalDaysInPeriod: jest.fn(),
          },
        },
        {
          provide: EntitlementsService,
          useValue: {
            calculateForYear: jest.fn(),
            getBalance: jest.fn(),
            updateUsedDays: jest.fn(),
            processYearEndCarryover: jest.fn(),
          },
        },
        {
          provide: EntitlementsCalculator,
          useValue: {
            calculateAnnualEntitlement: jest.fn(),
            calculateWorkingDays: jest.fn(),
            calculateMaxCarryover: jest.fn(),
            calculateCarryoverExpiry: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            employee: {
              findUnique: jest.fn(),
            },
            leaveRequest: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LeaveService>(LeaveService);
    repository = module.get(LeaveRepository);
    entitlementsService = module.get(EntitlementsService);
    calculator = module.get(EntitlementsCalculator);
    prisma = module.get(PrismaService);
  });

  describe('submitRequest', () => {
    const mockEmployee = {
      id: 'emp-123',
      orgId: 'org-123',
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      countryCode: 'DE',
      hireDate: new Date('2020-01-01'),
      dateOfBirth: new Date('1990-01-01'),
      status: EmploymentStatus.ACTIVE,
      contracts: [
        {
          id: 'contract-123',
          contractType: ContractType.PERMANENT,
          weeklyHours: new Decimal(40),
          startDate: new Date('2020-01-01'),
          isActive: true,
        },
      ],
    };

    it('should submit a leave request successfully', async () => {
      const dto = {
        leaveType: LeaveType.ANNUAL,
        startDate: '2024-07-15T00:00:00Z',
        endDate: '2024-07-19T00:00:00Z',
      };

      const mockLeaveRequest = {
        id: 'leave-123',
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        totalDays: new Decimal(5),
        status: LeaveRequestStatus.PENDING,
      };

      prisma.employee.findUnique.mockResolvedValue(mockEmployee as any);
      repository.hasOverlappingRequests.mockResolvedValue(false);
      calculator.calculateWorkingDays.mockReturnValue(5);
      entitlementsService.getBalance.mockResolvedValue({
        employeeId: 'emp-123',
        year: 2024,
        balances: [
          {
            leaveType: LeaveType.ANNUAL,
            totalDays: 20,
            usedDays: 5,
            pendingDays: 0,
            availableDays: 15,
            carriedOver: 0,
            carryoverExpiry: null,
          },
        ],
      });
      repository.create.mockResolvedValue(mockLeaveRequest as any);

      const result = await service.submitRequest('emp-123', dto);

      expect(result).toEqual(mockLeaveRequest);
      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-123' },
        include: { contracts: true },
      });
      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      const dto = {
        leaveType: LeaveType.ANNUAL,
        startDate: '2024-07-15T00:00:00Z',
        endDate: '2024-07-19T00:00:00Z',
      };

      await expect(service.submitRequest('emp-999', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if start date is after end date', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee as any);

      const dto = {
        leaveType: LeaveType.ANNUAL,
        startDate: '2024-07-19T00:00:00Z',
        endDate: '2024-07-15T00:00:00Z', // End before start
      };

      await expect(service.submitRequest('emp-123', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnprocessableEntityException if request overlaps existing request', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee as any);
      repository.hasOverlappingRequests.mockResolvedValue(true);

      const dto = {
        leaveType: LeaveType.ANNUAL,
        startDate: '2024-07-15T00:00:00Z',
        endDate: '2024-07-19T00:00:00Z',
      };

      await expect(service.submitRequest('emp-123', dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException if insufficient balance', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee as any);
      repository.hasOverlappingRequests.mockResolvedValue(false);
      calculator.calculateWorkingDays.mockReturnValue(10);
      entitlementsService.getBalance.mockResolvedValue({
        employeeId: 'emp-123',
        year: 2024,
        balances: [
          {
            leaveType: LeaveType.ANNUAL,
            totalDays: 20,
            usedDays: 15,
            pendingDays: 0,
            availableDays: 5, // Only 5 days available, requesting 10
            carriedOver: 0,
            carryoverExpiry: null,
          },
        ],
      });

      const dto = {
        leaveType: LeaveType.ANNUAL,
        startDate: '2024-07-15T00:00:00Z',
        endDate: '2024-07-26T00:00:00Z', // 10 days
      };

      await expect(service.submitRequest('emp-123', dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('approveRequest', () => {
    const mockLeaveRequest = {
      id: 'leave-123',
      employeeId: 'emp-123',
      leaveType: LeaveType.ANNUAL,
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-19'),
      totalDays: new Decimal(5),
      status: LeaveRequestStatus.PENDING,
    };

    it('should approve a pending leave request', async () => {
      const approvedRequest = {
        ...mockLeaveRequest,
        status: LeaveRequestStatus.APPROVED,
        reviewedBy: 'manager-123',
        reviewedAt: new Date(),
      };

      repository.findById.mockResolvedValue(mockLeaveRequest as any);
      repository.updateStatus.mockResolvedValue(approvedRequest as any);
      entitlementsService.updateUsedDays.mockResolvedValue();

      const result = await service.approveRequest(
        'leave-123',
        'manager-123',
        'Approved',
      );

      expect(result.status).toBe(LeaveRequestStatus.APPROVED);
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'leave-123',
        LeaveRequestStatus.APPROVED,
        'manager-123',
        'Approved',
      );
      expect(entitlementsService.updateUsedDays).toHaveBeenCalledWith(
        'emp-123',
        2024,
        LeaveType.ANNUAL,
        5,
        'add',
      );
    });

    it('should throw NotFoundException if request does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.approveRequest('leave-999', 'manager-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException if request is not pending', async () => {
      const approvedRequest = {
        ...mockLeaveRequest,
        status: LeaveRequestStatus.APPROVED,
      };

      repository.findById.mockResolvedValue(approvedRequest as any);

      await expect(
        service.approveRequest('leave-123', 'manager-123'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('rejectRequest', () => {
    const mockLeaveRequest = {
      id: 'leave-123',
      employeeId: 'emp-123',
      leaveType: LeaveType.ANNUAL,
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-19'),
      totalDays: new Decimal(5),
      status: LeaveRequestStatus.PENDING,
    };

    it('should reject a pending leave request', async () => {
      const rejectedRequest = {
        ...mockLeaveRequest,
        status: LeaveRequestStatus.REJECTED,
        reviewedBy: 'manager-123',
        reviewedAt: new Date(),
        reviewNote: 'Insufficient coverage',
      };

      repository.findById.mockResolvedValue(mockLeaveRequest as any);
      repository.updateStatus.mockResolvedValue(rejectedRequest as any);

      const result = await service.rejectRequest(
        'leave-123',
        'manager-123',
        'Insufficient coverage',
      );

      expect(result.status).toBe(LeaveRequestStatus.REJECTED);
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'leave-123',
        LeaveRequestStatus.REJECTED,
        'manager-123',
        'Insufficient coverage',
      );
    });

    it('should throw NotFoundException if request does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.rejectRequest('leave-999', 'manager-123', 'Reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException if request is not pending', async () => {
      const approvedRequest = {
        ...mockLeaveRequest,
        status: LeaveRequestStatus.APPROVED,
      };

      repository.findById.mockResolvedValue(approvedRequest as any);

      await expect(
        service.rejectRequest('leave-123', 'manager-123', 'Reason'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a pending request', async () => {
      const mockLeaveRequest = {
        id: 'leave-123',
        employeeId: 'emp-123',
        status: LeaveRequestStatus.PENDING,
        startDate: new Date('2024-07-15'),
        totalDays: new Decimal(5),
        leaveType: LeaveType.ANNUAL,
      };

      repository.findById.mockResolvedValue(mockLeaveRequest as any);
      repository.updateStatus.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.CANCELLED,
      } as any);

      await service.cancelRequest('leave-123', 'emp-123');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'leave-123',
        LeaveRequestStatus.CANCELLED,
      );
    });

    it('should cancel an approved request and restore balance', async () => {
      const mockLeaveRequest = {
        id: 'leave-123',
        employeeId: 'emp-123',
        status: LeaveRequestStatus.APPROVED,
        startDate: new Date('2024-07-15'),
        totalDays: new Decimal(5),
        leaveType: LeaveType.ANNUAL,
      };

      repository.findById.mockResolvedValue(mockLeaveRequest as any);
      repository.updateStatus.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.CANCELLED,
      } as any);
      entitlementsService.updateUsedDays.mockResolvedValue();

      await service.cancelRequest('leave-123', 'emp-123');

      expect(entitlementsService.updateUsedDays).toHaveBeenCalledWith(
        'emp-123',
        2024,
        LeaveType.ANNUAL,
        5,
        'subtract',
      );
    });

    it('should throw NotFoundException if request does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.cancelRequest('leave-999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnprocessableEntityException if trying to cancel another employee\'s request', async () => {
      const mockLeaveRequest = {
        id: 'leave-123',
        employeeId: 'emp-123',
        status: LeaveRequestStatus.PENDING,
      };

      repository.findById.mockResolvedValue(mockLeaveRequest as any);

      await expect(
        service.cancelRequest('leave-123', 'emp-999'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException if request is rejected', async () => {
      const mockLeaveRequest = {
        id: 'leave-123',
        employeeId: 'emp-123',
        status: LeaveRequestStatus.REJECTED,
      };

      repository.findById.mockResolvedValue(mockLeaveRequest as any);

      await expect(service.cancelRequest('leave-123')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('getBalance', () => {
    it('should return leave balance for current year', async () => {
      const mockBalance = {
        employeeId: 'emp-123',
        year: 2024,
        balances: [
          {
            leaveType: LeaveType.ANNUAL,
            totalDays: 20,
            usedDays: 5,
            pendingDays: 2,
            availableDays: 13,
            carriedOver: 0,
            carryoverExpiry: null,
          },
        ],
      };

      entitlementsService.getBalance.mockResolvedValue(mockBalance);

      const result = await service.getBalance('emp-123');

      expect(result).toEqual(mockBalance);
      expect(entitlementsService.getBalance).toHaveBeenCalledWith(
        'emp-123',
        undefined,
      );
    });

    it('should return leave balance for specific year', async () => {
      const mockBalance = {
        employeeId: 'emp-123',
        year: 2023,
        balances: [
          {
            leaveType: LeaveType.ANNUAL,
            totalDays: 20,
            usedDays: 18,
            pendingDays: 0,
            availableDays: 2,
            carriedOver: 0,
            carryoverExpiry: null,
          },
        ],
      };

      entitlementsService.getBalance.mockResolvedValue(mockBalance);

      const result = await service.getBalance('emp-123', 2023);

      expect(result).toEqual(mockBalance);
      expect(entitlementsService.getBalance).toHaveBeenCalledWith(
        'emp-123',
        2023,
      );
    });
  });
});
