import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { EntitlementsCalculator } from './entitlements.calculator';
import { LeaveType, LeaveEntitlement } from '@prisma/client';

/**
 * Service for managing leave entitlements
 */
@Injectable()
export class EntitlementsService {
  private readonly logger = new Logger(EntitlementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: EntitlementsCalculator,
  ) {}

  /**
   * Calculate and create entitlements for an employee for a specific year
   */
  async calculateForYear(
    employeeId: string,
    year: number,
  ): Promise<LeaveEntitlement[]> {
    // Fetch employee with contracts
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { contracts: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    // Calculate annual leave entitlement
    const annualLeaveDays = this.calculator.calculateAnnualEntitlement(
      employee,
      year,
    );

    // Check for carryover from previous year
    const carryoverDays = await this.calculateCarryover(employeeId, year);

    // Create or update entitlement for ANNUAL leave
    const annualEntitlement = await this.prisma.leaveEntitlement.upsert({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year,
          leaveType: LeaveType.ANNUAL,
        },
      },
      create: {
        employeeId,
        year,
        leaveType: LeaveType.ANNUAL,
        totalDays: annualLeaveDays,
        carriedOver: carryoverDays,
        expiresAt: carryoverDays > 0
          ? this.calculator.calculateCarryoverExpiry(employee, year - 1)
          : null,
      },
      update: {
        totalDays: annualLeaveDays,
        carriedOver: carryoverDays,
        expiresAt: carryoverDays > 0
          ? this.calculator.calculateCarryoverExpiry(employee, year - 1)
          : null,
      },
    });

    this.logger.log(
      `Calculated entitlement for employee ${employeeId} year ${year}: ${annualLeaveDays} days + ${carryoverDays} carryover`,
    );

    return [annualEntitlement];
  }

  /**
   * Calculate carryover from previous year
   */
  private async calculateCarryover(
    employeeId: string,
    currentYear: number,
  ): Promise<number> {
    const previousYear = currentYear - 1;

    // Get previous year's entitlement
    const previousEntitlement = await this.prisma.leaveEntitlement.findUnique({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year: previousYear,
          leaveType: LeaveType.ANNUAL,
        },
      },
    });

    if (!previousEntitlement) {
      return 0;
    }

    // Calculate unused days
    const unusedDays = Number(previousEntitlement.totalDays) - Number(previousEntitlement.usedDays);

    if (unusedDays <= 0) {
      return 0;
    }

    // Get employee to check country rules
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { countryCode: true },
    });

    if (!employee) {
      return 0;
    }

    // Get max carryover allowed
    const maxCarryover = this.calculator.calculateMaxCarryover(
      { countryCode: employee.countryCode } as Prisma.InputJsonValue,
      previousYear,
    );

    // Return the minimum of unused days and max carryover
    return Math.min(unusedDays, maxCarryover);
  }

  /**
   * Get current leave balance for an employee
   */
  async getBalance(employeeId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    // Get or create entitlements for the year
    let entitlements = await this.prisma.leaveEntitlement.findMany({
      where: {
        employeeId,
        year: targetYear,
      },
    });

    // If no entitlements exist, calculate them
    if (entitlements.length === 0) {
      entitlements = await this.calculateForYear(employeeId, targetYear);
    }

    // Get pending requests for the year
    const pendingRequests = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'PENDING',
        startDate: {
          gte: new Date(targetYear, 0, 1),
          lte: new Date(targetYear, 11, 31),
        },
      },
    });

    // Calculate pending days by leave type
    const pendingByType = pendingRequests.reduce((acc, req) => {
      const type = req.leaveType;
      acc[type] = (acc[type] || 0) + Number(req.totalDays);
      return acc;
    }, {} as Record<string, number>);

    // Build balance response
    const balances = entitlements.map((ent) => {
      const totalDays = Number(ent.totalDays) + Number(ent.carriedOver);
      const usedDays = Number(ent.usedDays);
      const pendingDays = pendingByType[ent.leaveType] || 0;
      const availableDays = totalDays - usedDays - pendingDays;

      return {
        leaveType: ent.leaveType,
        totalDays,
        usedDays,
        pendingDays,
        availableDays,
        carriedOver: Number(ent.carriedOver),
        carryoverExpiry: ent.expiresAt,
      };
    });

    return {
      employeeId,
      year: targetYear,
      balances,
    };
  }

  /**
   * Process year-end carryover for all employees in an organization
   */
  async processYearEndCarryover(
    orgId: string,
    fromYear: number,
  ): Promise<void> {
    this.logger.log(
      `Processing year-end carryover for org ${orgId} from year ${fromYear}`,
    );

    // Get all active employees
    const employees = await this.prisma.employee.findMany({
      where: {
        orgId,
        status: 'ACTIVE',
      },
    });

    let processed = 0;
    let errors = 0;

    for (const employee of employees) {
      try {
        await this.calculateForYear(employee.id, fromYear + 1);
        processed++;
      } catch (error) {
        this.logger.error(
          `Error processing carryover for employee ${employee.id}`,
          error,
        );
        errors++;
      }
    }

    this.logger.log(
      `Year-end carryover complete: ${processed} processed, ${errors} errors`,
    );
  }

  /**
   * Update used days when leave is approved/cancelled
   */
  async updateUsedDays(
    employeeId: string,
    year: number,
    leaveType: LeaveType,
    days: number,
    operation: 'add' | 'subtract',
  ): Promise<void> {
    const entitlement = await this.prisma.leaveEntitlement.findUnique({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year,
          leaveType,
        },
      },
    });

    if (!entitlement) {
      throw new NotFoundException(
        `Leave entitlement not found for employee ${employeeId}, year ${year}, type ${leaveType}`,
      );
    }

    const currentUsed = Number(entitlement.usedDays);
    const newUsed =
      operation === 'add'
        ? currentUsed + days
        : Math.max(0, currentUsed - days);

    await this.prisma.leaveEntitlement.update({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year,
          leaveType,
        },
      },
      data: {
        usedDays: newUsed,
      },
    });

    this.logger.log(
      `Updated used days for employee ${employeeId}: ${currentUsed} -> ${newUsed} (${operation} ${days})`,
    );
  }
}
