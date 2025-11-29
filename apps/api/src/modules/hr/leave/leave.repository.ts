import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
  Prisma,
} from '@prisma/client';

/**
 * Repository for leave request data access
 */
@Injectable()
export class LeaveRepository {
  private readonly logger = new Logger(LeaveRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new leave request
   */
  async create(
    data: Prisma.LeaveRequestUncheckedCreateInput,
  ): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.create({
      data,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
    });
  }

  /**
   * Find leave request by ID
   */
  async findById(id: string): Promise<LeaveRequest | null> {
    return this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
            orgId: true,
          },
        },
      },
    });
  }

  /**
   * Find leave requests for an employee
   */
  async findByEmployee(
    employeeId: string,
    filters?: {
      leaveType?: LeaveType;
      status?: LeaveRequestStatus;
      startDateFrom?: Date;
      startDateTo?: Date;
    },
    pagination?: {
      skip: number;
      take: number;
    },
  ): Promise<{ requests: LeaveRequest[]; total: number }> {
    const where: Prisma.LeaveRequestWhereInput = {
      employeeId,
      ...(filters?.leaveType && { leaveType: filters.leaveType }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.startDateFrom && {
        startDate: { gte: filters.startDateFrom },
      }),
      ...(filters?.startDateTo && {
        startDate: { lte: filters.startDateTo },
      }),
    };

    const [requests, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              employeeNumber: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        ...(pagination && {
          skip: pagination.skip,
          take: pagination.take,
        }),
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { requests, total };
  }

  /**
   * Find pending leave requests for a manager
   */
  async findPendingForOrganisation(
    orgId: string,
    pagination?: {
      skip: number;
      take: number;
    },
  ): Promise<{ requests: LeaveRequest[]; total: number }> {
    const where: Prisma.LeaveRequestWhereInput = {
      employee: {
        orgId,
      },
      status: LeaveRequestStatus.PENDING,
    };

    const [requests, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              employeeNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        ...(pagination && {
          skip: pagination.skip,
          take: pagination.take,
        }),
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { requests, total };
  }

  /**
   * Find leave requests for organisation calendar view
   */
  async findForCalendar(
    orgId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<(LeaveRequest & { employee: { id: string; firstName: string; lastName: string; employeeNumber: string } })[]> {
    return this.prisma.leaveRequest.findMany({
      where: {
        employee: {
          orgId,
        },
        status: {
          in: [LeaveRequestStatus.APPROVED, LeaveRequestStatus.PENDING],
        },
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Update leave request status
   */
  async updateStatus(
    id: string,
    status: LeaveRequestStatus,
    reviewedBy?: string,
    reviewNote?: string,
  ): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNote,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
    });
  }

  /**
   * Delete leave request (for cancellation)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.leaveRequest.delete({
      where: { id },
    });
  }

  /**
   * Check for overlapping leave requests
   */
  async hasOverlappingRequests(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string,
  ): Promise<boolean> {
    const where: Prisma.LeaveRequestWhereInput = {
      employeeId,
      status: {
        in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED],
      },
      OR: [
        {
          startDate: {
            lte: endDate,
          },
          endDate: {
            gte: startDate,
          },
        },
      ],
      ...(excludeRequestId && {
        id: { not: excludeRequestId },
      }),
    };

    const count = await this.prisma.leaveRequest.count({ where });
    return count > 0;
  }

  /**
   * Get total approved/pending days for a period
   */
  async getTotalDaysInPeriod(
    employeeId: string,
    leaveType: LeaveType,
    year: number,
    statuses: LeaveRequestStatus[],
  ): Promise<number> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        leaveType,
        status: { in: statuses },
        startDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      select: {
        totalDays: true,
      },
    });

    return requests.reduce((sum, req) => sum + Number(req.totalDays), 0);
  }
}
