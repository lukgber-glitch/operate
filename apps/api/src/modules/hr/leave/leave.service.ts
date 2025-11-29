import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeaveRepository } from './leave.repository';
import { EntitlementsService } from './entitlements/entitlements.service';
import { EntitlementsCalculator } from './entitlements/entitlements.calculator';
import { PrismaService } from '../../database/prisma.service';
import {
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
} from '@prisma/client';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveQueryDto, CalendarEntryDto } from './dto/leave-query.dto';
import { LeaveBalanceDto } from './dto/leave-balance.dto';

/**
 * Service for leave request management and workflow
 */
@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    private readonly repository: LeaveRepository,
    private readonly entitlementsService: EntitlementsService,
    private readonly calculator: EntitlementsCalculator,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Submit a new leave request
   */
  async submitRequest(
    employeeId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    // Validate employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { contracts: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    // Parse dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Validate dates
    this.validateDates(startDate, endDate, dto.leaveType);

    // Calculate total days if not provided
    const totalDays =
      dto.totalDays ||
      this.calculator.calculateWorkingDays(startDate, endDate);

    // Check for overlapping requests
    const hasOverlap = await this.repository.hasOverlappingRequests(
      employeeId,
      startDate,
      endDate,
    );

    if (hasOverlap) {
      throw new UnprocessableEntityException(
        'Leave request overlaps with existing request',
      );
    }

    // Validate sufficient balance (for annual leave)
    if (dto.leaveType === LeaveType.ANNUAL) {
      await this.validateSufficientBalance(
        employeeId,
        startDate.getFullYear(),
        totalDays,
      );
    }

    // Create leave request
    const leaveRequest = await this.repository.create({
      employeeId,
      leaveType: dto.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: dto.reason,
      status: LeaveRequestStatus.PENDING,
    });

    this.logger.log(
      `Leave request ${leaveRequest.id} submitted for employee ${employeeId}`,
    );

    this.eventEmitter.emit('leave.request.submitted', { leaveRequest, employeeId });

    return leaveRequest;
  }

  /**
   * Approve a leave request
   */
  async approveRequest(
    requestId: string,
    managerId: string,
    note?: string,
  ): Promise<LeaveRequest> {
    const request = await this.repository.findById(requestId);

    if (!request) {
      throw new NotFoundException(`Leave request ${requestId} not found`);
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new UnprocessableEntityException(
        `Cannot approve request with status ${request.status}`,
      );
    }

    // Update request status
    const approvedRequest = await this.repository.updateStatus(
      requestId,
      LeaveRequestStatus.APPROVED,
      managerId,
      note,
    );

    // Update used days in entitlement
    const year = approvedRequest.startDate.getFullYear();
    await this.entitlementsService.updateUsedDays(
      approvedRequest.employeeId,
      year,
      approvedRequest.leaveType,
      Number(approvedRequest.totalDays),
      'add',
    );

    this.logger.log(
      `Leave request ${requestId} approved by ${managerId}`,
    );

    this.eventEmitter.emit('leave.request.approved', { leaveRequest: approvedRequest, employeeId: approvedRequest.employeeId, managerId, note });

    return approvedRequest;
  }

  /**
   * Reject a leave request
   */
  async rejectRequest(
    requestId: string,
    managerId: string,
    reason: string,
  ): Promise<LeaveRequest> {
    const request = await this.repository.findById(requestId);

    if (!request) {
      throw new NotFoundException(`Leave request ${requestId} not found`);
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new UnprocessableEntityException(
        `Cannot reject request with status ${request.status}`,
      );
    }

    // Update request status
    const rejectedRequest = await this.repository.updateStatus(
      requestId,
      LeaveRequestStatus.REJECTED,
      managerId,
      reason,
    );

    this.logger.log(
      `Leave request ${requestId} rejected by ${managerId}`,
    );

    this.eventEmitter.emit('leave.request.rejected', { leaveRequest: rejectedRequest, employeeId: rejectedRequest.employeeId, managerId, reason });

    return rejectedRequest;
  }

  /**
   * Cancel a leave request
   */
  async cancelRequest(requestId: string, employeeId?: string): Promise<void> {
    const request = await this.repository.findById(requestId);

    if (!request) {
      throw new NotFoundException(`Leave request ${requestId} not found`);
    }

    // Verify employee owns this request (if employeeId provided)
    if (employeeId && request.employeeId !== employeeId) {
      throw new UnprocessableEntityException(
        'Cannot cancel another employee\'s leave request',
      );
    }

    // Can only cancel PENDING or APPROVED requests
    if (
      request.status !== LeaveRequestStatus.PENDING &&
      request.status !== LeaveRequestStatus.APPROVED
    ) {
      throw new UnprocessableEntityException(
        `Cannot cancel request with status ${request.status}`,
      );
    }

    // If approved, need to add days back to entitlement
    if (request.status === LeaveRequestStatus.APPROVED) {
      const year = request.startDate.getFullYear();
      await this.entitlementsService.updateUsedDays(
        request.employeeId,
        year,
        request.leaveType,
        Number(request.totalDays),
        'subtract',
      );
    }

    // Update status to cancelled
    await this.repository.updateStatus(
      requestId,
      LeaveRequestStatus.CANCELLED,
    );

    this.logger.log(`Leave request ${requestId} cancelled`);

    // Notify manager if request was previously approved
    if (request.status === LeaveRequestStatus.APPROVED) {
      this.eventEmitter.emit('leave.request.cancelled', { leaveRequest: request, employeeId: request.employeeId, wasApproved: true });
    }
  }

  /**
   * Get leave request by ID
   */
  async getRequest(id: string): Promise<LeaveRequest> {
    const request = await this.repository.findById(id);

    if (!request) {
      throw new NotFoundException(`Leave request ${id} not found`);
    }

    return request;
  }

  /**
   * Get leave requests for an employee
   */
  async getEmployeeRequests(
    employeeId: string,
    query: LeaveQueryDto,
  ): Promise<{ requests: LeaveRequest[]; total: number; page: number; pageSize: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const filters = {
      leaveType: query.leaveType,
      status: query.status,
      startDateFrom: query.startDateFrom ? new Date(query.startDateFrom) : undefined,
      startDateTo: query.startDateTo ? new Date(query.startDateTo) : undefined,
    };

    const result = await this.repository.findByEmployee(
      employeeId,
      filters,
      { skip, take: pageSize },
    );

    return {
      requests: result.requests,
      total: result.total,
      page,
      pageSize,
    };
  }

  /**
   * Get leave balance for an employee
   */
  async getBalance(employeeId: string, year?: number): Promise<LeaveBalanceDto> {
    return this.entitlementsService.getBalance(employeeId, year);
  }

  /**
   * Get pending leave requests for manager approval
   */
  async getPendingForOrganisation(
    orgId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ requests: LeaveRequest[]; total: number; page: number; pageSize: number }> {
    const skip = (page - 1) * pageSize;

    const result = await this.repository.findPendingForOrganisation(
      orgId,
      { skip, take: pageSize },
    );

    return {
      requests: result.requests,
      total: result.total,
      page,
      pageSize,
    };
  }

  /**
   * Get team leave calendar
   */
  async getTeamCalendar(
    orgId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEntryDto[]> {
    const requests = await this.repository.findForCalendar(
      orgId,
      startDate,
      endDate,
    );

    return requests.map((req) => ({
      employeeId: req.employee.id,
      employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
      leaveRequestId: req.id,
      leaveType: req.leaveType,
      startDate: req.startDate,
      endDate: req.endDate,
      totalDays: Number(req.totalDays),
      status: req.status,
    }));
  }

  /**
   * Validate dates are valid
   */
  private validateDates(
    startDate: Date,
    endDate: Date,
    leaveType: LeaveType,
  ): void {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Start date cannot be after end date
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Cannot request leave in the past (except sick leave)
    if (leaveType !== LeaveType.SICK && startDate < now) {
      throw new BadRequestException('Cannot request leave for past dates');
    }

    // Could add more validations:
    // - Minimum notice period
    // - Maximum consecutive days
    // - Block-out periods
  }

  /**
   * Validate employee has sufficient balance
   */
  private async validateSufficientBalance(
    employeeId: string,
    year: number,
    requestedDays: number,
  ): Promise<void> {
    const balance = await this.entitlementsService.getBalance(employeeId, year);

    const annualBalance = balance.balances.find(
      (b) => b.leaveType === LeaveType.ANNUAL,
    );

    if (!annualBalance) {
      throw new UnprocessableEntityException(
        'No annual leave entitlement found for this year',
      );
    }

    if (annualBalance.availableDays < requestedDays) {
      throw new UnprocessableEntityException(
        `Insufficient leave balance. Available: ${annualBalance.availableDays} days, Requested: ${requestedDays} days`,
      );
    }
  }
}
