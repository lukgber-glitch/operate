import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Employee, Prisma, EmploymentContract } from '@prisma/client';

/**
 * Employees Repository
 * Handles all database operations for Employee entity
 */
@Injectable()
export class EmployeesRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all employees for an organisation with filters
   */
  async findAll(params: {
    where?: Prisma.EmployeeWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.EmployeeOrderByWithRelationInput;
    include?: Prisma.EmployeeInclude;
  }): Promise<Employee[]> {
    const { where, skip, take, orderBy, include } = params;

    return this.prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy,
      include,
    });
  }

  /**
   * Count employees matching filters
   */
  async count(where?: Prisma.EmployeeWhereInput): Promise<number> {
    return this.prisma.employee.count({ where });
  }

  /**
   * Find employee by ID
   */
  async findById(
    id: string,
    include?: Prisma.EmployeeInclude,
  ): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find employee by email within organisation
   */
  async findByEmail(
    orgId: string,
    email: string,
  ): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: {
        orgId,
        email,
        deletedAt: null,
      },
    });
  }

  /**
   * Find employee by employee number within organisation
   */
  async findByEmployeeNumber(
    orgId: string,
    employeeNumber: string,
  ): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: {
        orgId_employeeNumber: {
          orgId,
          employeeNumber,
        },
      },
    });
  }

  /**
   * Create new employee
   */
  async create(data: Prisma.EmployeeCreateInput): Promise<Employee> {
    return this.prisma.employee.create({
      data,
      include: {
        contracts: true,
      },
    });
  }

  /**
   * Update employee by ID
   */
  async update(id: string, data: Prisma.EmployeeUpdateInput): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data,
      include: {
        contracts: {
          where: { isActive: true },
        },
      },
    });
  }

  /**
   * Soft delete employee by ID
   */
  async softDelete(id: string): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore soft-deleted employee
   */
  async restore(id: string): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Check if employee email exists in organisation (excluding soft-deleted)
   */
  async emailExists(orgId: string, email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.employee.count({
      where: {
        orgId,
        email,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }

  /**
   * Check if employee number exists in organisation
   */
  async employeeNumberExists(
    orgId: string,
    employeeNumber: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.employee.count({
      where: {
        orgId,
        employeeNumber,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }

  // ============================================================================
  // CONTRACT METHODS
  // ============================================================================

  /**
   * Find all contracts for an employee
   */
  async findContracts(employeeId: string): Promise<EmploymentContract[]> {
    return this.prisma.employmentContract.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Find active contract for an employee
   */
  async findActiveContract(employeeId: string): Promise<EmploymentContract | null> {
    return this.prisma.employmentContract.findFirst({
      where: {
        employeeId,
        isActive: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Find contract by ID
   */
  async findContractById(contractId: string): Promise<EmploymentContract | null> {
    return this.prisma.employmentContract.findUnique({
      where: { id: contractId },
      include: {
        employee: true,
      },
    });
  }

  /**
   * Create employment contract
   */
  async createContract(
    data: Prisma.EmploymentContractCreateInput,
  ): Promise<EmploymentContract> {
    return this.prisma.employmentContract.create({
      data,
      include: {
        employee: true,
      },
    });
  }

  /**
   * Update employment contract
   */
  async updateContract(
    contractId: string,
    data: Prisma.EmploymentContractUpdateInput,
  ): Promise<EmploymentContract> {
    return this.prisma.employmentContract.update({
      where: { id: contractId },
      data,
      include: {
        employee: true,
      },
    });
  }

  /**
   * Deactivate all contracts for an employee
   */
  async deactivateEmployeeContracts(employeeId: string): Promise<void> {
    await this.prisma.employmentContract.updateMany({
      where: {
        employeeId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }
}
