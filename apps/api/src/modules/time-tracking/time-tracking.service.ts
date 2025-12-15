import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { TimeEntryFiltersDto, TimeSummaryDto } from './dto/time-entry-filters.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TimeTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== PROJECT METHODS ====================

  async createProject(organisationId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        organisationId,
        ...dto,
        budgetHours: dto.budgetHours
          ? new Decimal(dto.budgetHours)
          : undefined,
        budgetAmount: dto.budgetAmount
          ? new Decimal(dto.budgetAmount)
          : undefined,
        hourlyRate: dto.hourlyRate ? new Decimal(dto.hourlyRate) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        client: true,
      },
    });
  }

  async findAllProjects(organisationId: string) {
    return this.prisma.project.findMany({
      where: { organisationId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientNumber: true,
          },
        },
        _count: {
          select: {
            billableTimeEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneProject(id: string, organisationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organisationId },
      include: {
        client: true,
        billableTimeEntries: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Calculate time summary
    const timeStats = await this.prisma.billableTimeEntry.aggregate({
      where: {
        projectId: id,
        organisationId,
      },
      _sum: {
        duration: true,
      },
    });

    const totalMinutes = timeStats._sum.duration || 0;
    const totalHours = totalMinutes / 60;

    return {
      ...project,
      summary: {
        totalHours,
        totalMinutes,
      },
    };
  }

  async updateProject(
    id: string,
    organisationId: string,
    dto: UpdateProjectDto,
  ) {
    await this.findOneProject(id, organisationId);

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        budgetHours: dto.budgetHours
          ? new Decimal(dto.budgetHours)
          : undefined,
        budgetAmount: dto.budgetAmount
          ? new Decimal(dto.budgetAmount)
          : undefined,
        hourlyRate: dto.hourlyRate ? new Decimal(dto.hourlyRate) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        client: true,
      },
    });
  }

  async deleteProject(id: string, organisationId: string) {
    await this.findOneProject(id, organisationId);

    // Check if project has time entries
    const entryCount = await this.prisma.billableTimeEntry.count({
      where: { projectId: id },
    });

    if (entryCount > 0) {
      throw new ConflictException(
        'Cannot delete project with existing time entries',
      );
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async getProjectProfitability(id: string, organisationId: string) {
    const project = await this.findOneProject(id, organisationId);

    const entries = await this.prisma.billableTimeEntry.findMany({
      where: {
        projectId: id,
        organisationId,
      },
    });

    let totalRevenue = new Decimal(0);
    let totalMinutes = 0;

    for (const entry of entries) {
      totalMinutes += entry.duration || 0;
      if (entry.billable && entry.hourlyRate) {
        const hours = (entry.duration || 0) / 60;
        totalRevenue = totalRevenue.plus(
          entry.hourlyRate.times(hours),
        );
      }
    }

    const totalHours = totalMinutes / 60;
    const budgetRemaining = project.budgetAmount
      ? new Decimal(project.budgetAmount).minus(totalRevenue)
      : null;

    const budgetHoursRemaining = project.budgetHours
      ? new Decimal(project.budgetHours).minus(totalHours)
      : null;

    return {
      projectId: id,
      projectName: project.name,
      totalHours,
      totalRevenue: totalRevenue.toNumber(),
      budgetAmount: project.budgetAmount?.toNumber() || null,
      budgetHours: project.budgetHours?.toNumber() || null,
      budgetRemaining: budgetRemaining?.toNumber() || null,
      budgetHoursRemaining: budgetHoursRemaining?.toNumber() || null,
      percentComplete: project.budgetHours
        ? (totalHours / Number(project.budgetHours)) * 100
        : null,
    };
  }

  // ==================== TIME ENTRY METHODS ====================

  async startTimer(
    organisationId: string,
    userId: string,
    dto: StartTimerDto,
  ) {
    // Check if user already has a running timer
    const runningTimer = await this.prisma.billableTimeEntry.findFirst({
      where: {
        organisationId,
        userId,
        endTime: null,
      },
    });

    if (runningTimer) {
      throw new ConflictException('You already have a running timer');
    }

    return this.prisma.billableTimeEntry.create({
      data: {
        organisationId,
        userId,
        startTime: new Date(),
        ...dto,
        hourlyRate: dto.hourlyRate ? new Decimal(dto.hourlyRate) : undefined,
      },
      include: {
        project: true,
      },
    });
  }

  async stopTimer(id: string, organisationId: string) {
    const entry = await this.prisma.billableTimeEntry.findFirst({
      where: { id, organisationId },
    });

    if (!entry) {
      throw new NotFoundException(`Time entry with ID ${id} not found`);
    }

    if (entry.endTime) {
      throw new BadRequestException('Timer is already stopped');
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - entry.startTime.getTime()) / 60000,
    ); // minutes

    return this.prisma.billableTimeEntry.update({
      where: { id },
      data: {
        endTime,
        duration,
      },
      include: {
        project: true,
      },
    });
  }

  async getRunningTimer(organisationId: string, userId: string) {
    return this.prisma.billableTimeEntry.findFirst({
      where: {
        organisationId,
        userId,
        endTime: null,
      },
      include: {
        project: true,
      },
    });
  }

  async findAllTimeEntries(
    organisationId: string,
    filters: TimeEntryFiltersDto,
  ) {
    const where: any = { organisationId };

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.billable !== undefined) where.billable = filters.billable;
    if (filters.billed !== undefined) where.billed = filters.billed;

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.startTime.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.billableTimeEntry.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findOneTimeEntry(id: string, organisationId: string) {
    const entry = await this.prisma.billableTimeEntry.findFirst({
      where: { id, organisationId },
      include: {
        project: true,
      },
    });

    if (!entry) {
      throw new NotFoundException(`Time entry with ID ${id} not found`);
    }

    return entry;
  }

  async createTimeEntry(
    organisationId: string,
    userId: string,
    dto: CreateTimeEntryDto,
  ) {
    const data: any = {
      organisationId,
      userId,
      startTime: new Date(dto.startTime),
      ...dto,
      hourlyRate: dto.hourlyRate ? new Decimal(dto.hourlyRate) : undefined,
    };

    if (dto.endTime) {
      data.endTime = new Date(dto.endTime);
      // Calculate duration if not provided
      if (!dto.duration) {
        data.duration = Math.floor(
          (data.endTime.getTime() - data.startTime.getTime()) / 60000,
        );
      }
    }

    return this.prisma.billableTimeEntry.create({
      data,
      include: {
        project: true,
      },
    });
  }

  async updateTimeEntry(
    id: string,
    organisationId: string,
    dto: UpdateTimeEntryDto,
  ) {
    await this.findOneTimeEntry(id, organisationId);

    const data: any = { ...dto };

    if (dto.startTime) data.startTime = new Date(dto.startTime);
    if (dto.endTime) data.endTime = new Date(dto.endTime);
    if (dto.hourlyRate) data.hourlyRate = new Decimal(dto.hourlyRate);

    // Recalculate duration if times changed
    if (data.startTime || data.endTime) {
      const entry = await this.prisma.billableTimeEntry.findUnique({
        where: { id },
      });
      const startTime = data.startTime || entry!.startTime;
      const endTime = data.endTime || entry!.endTime;

      if (startTime && endTime) {
        data.duration = Math.floor(
          (endTime.getTime() - startTime.getTime()) / 60000,
        );
      }
    }

    return this.prisma.billableTimeEntry.update({
      where: { id },
      data,
      include: {
        project: true,
      },
    });
  }

  async deleteTimeEntry(id: string, organisationId: string) {
    await this.findOneTimeEntry(id, organisationId);

    return this.prisma.billableTimeEntry.delete({
      where: { id },
    });
  }

  async getSummary(organisationId: string, filters: TimeSummaryDto) {
    const where: any = { organisationId };

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.startTime.lte = new Date(filters.endDate);
      }
    }

    const entries = await this.prisma.billableTimeEntry.findMany({
      where,
      select: {
        startTime: true,
        duration: true,
        billable: true,
        hourlyRate: true,
      },
    });

    let totalMinutes = 0;
    let billableMinutes = 0;
    let totalRevenue = new Decimal(0);

    for (const entry of entries) {
      const minutes = entry.duration || 0;
      totalMinutes += minutes;

      if (entry.billable) {
        billableMinutes += minutes;
        if (entry.hourlyRate) {
          const hours = minutes / 60;
          totalRevenue = totalRevenue.plus(entry.hourlyRate.times(hours));
        }
      }
    }

    return {
      totalHours: totalMinutes / 60,
      billableHours: billableMinutes / 60,
      totalRevenue: totalRevenue.toNumber(),
      entryCount: entries.length,
    };
  }

  async getBillableHours(organisationId: string, clientId?: string) {
    const where: any = {
      organisationId,
      billable: true,
      billed: false,
      endTime: { not: null },
    };

    if (clientId) {
      where.clientId = clientId;
    }

    const entries = await this.prisma.billableTimeEntry.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
          },
        },
      },
    });

    let totalMinutes = 0;
    let totalRevenue = new Decimal(0);

    for (const entry of entries) {
      totalMinutes += entry.duration || 0;
      const rate = entry.hourlyRate || entry.project?.hourlyRate;
      if (rate) {
        const hours = (entry.duration || 0) / 60;
        totalRevenue = totalRevenue.plus(rate.times(hours));
      }
    }

    return {
      entries,
      totalHours: totalMinutes / 60,
      totalRevenue: totalRevenue.toNumber(),
      entryCount: entries.length,
    };
  }

  async generateInvoiceFromTime(
    organisationId: string,
    entryIds: string[],
  ) {
    // Fetch all entries
    const entries = await this.prisma.billableTimeEntry.findMany({
      where: {
        id: { in: entryIds },
        organisationId,
      },
      include: {
        project: true,
      },
    });

    if (entries.length === 0) {
      throw new NotFoundException('No time entries found');
    }

    // Verify all entries belong to same client
    const clientIds = [...new Set(entries.map((e) => e.clientId))];
    if (clientIds.length > 1) {
      throw new BadRequestException(
        'All time entries must belong to the same client',
      );
    }

    const clientId = entries[0].clientId;
    if (!clientId) {
      throw new BadRequestException('Time entries must have a client');
    }

    // Group entries by project
    const lineItems = [];
    const projectGroups = entries.reduce((acc, entry) => {
      const projectId = entry.projectId || 'no-project';
      if (!acc[projectId]) acc[projectId] = [];
      acc[projectId].push(entry);
      return acc;
    }, {} as Record<string, typeof entries>);

    for (const [projectId, projectEntries] of Object.entries(projectGroups)) {
      const totalMinutes = projectEntries.reduce(
        (sum, e) => sum + (e.duration || 0),
        0,
      );
      const totalHours = totalMinutes / 60;

      const project = projectEntries[0].project;
      const rate =
        projectEntries[0].hourlyRate || project?.hourlyRate || new Decimal(0);

      lineItems.push({
        description: project
          ? `${project.name} - Time tracked`
          : 'Time tracked',
        quantity: totalHours,
        unitPrice: rate.toNumber(),
        amount: rate.times(totalHours).toNumber(),
      });
    }

    // Mark entries as billed
    await this.prisma.billableTimeEntry.updateMany({
      where: {
        id: { in: entryIds },
      },
      data: {
        billed: true,
      },
    });

    return {
      clientId,
      lineItems,
      timeEntryIds: entryIds,
    };
  }
}
