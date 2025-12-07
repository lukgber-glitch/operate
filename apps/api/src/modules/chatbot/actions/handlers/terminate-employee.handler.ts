/**
 * Terminate Employee Action Handler
 * Handles employee termination via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { EmployeesService } from '../../../hr/employees/employees.service';
import { PrismaService } from '../../../database/prisma.service';
import { EmploymentStatus } from '@prisma/client';

@Injectable()
export class TerminateEmployeeHandler extends BaseActionHandler {
  constructor(
    private employeesService: EmployeesService,
    private prisma: PrismaService,
  ) {
    super('TerminateEmployeeHandler');
  }

  get actionType(): ActionType {
    return ActionType.TERMINATE_EMPLOYEE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'employeeId',
        type: 'string',
        required: false,
        description: 'Employee ID (if known)',
      },
      {
        name: 'employeeName',
        type: 'string',
        required: false,
        description: 'Employee name (if ID not known)',
      },
      {
        name: 'terminationDate',
        type: 'string',
        required: true,
        description: 'Termination date (ISO format)',
      },
      {
        name: 'reason',
        type: 'string',
        required: false,
        description: 'Termination reason',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'hr:employees:terminate')) {
        return this.error(
          'You do not have permission to terminate employees',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Validate we have either ID or name
      if (!normalized.employeeId && !normalized.employeeName) {
        return this.error(
          'Either employeeId or employeeName is required',
          'VALIDATION_ERROR',
        );
      }

      // Find employee
      let employee;
      if (normalized.employeeId) {
        employee = await this.prisma.employee.findUnique({
          where: { id: normalized.employeeId },
          include: {
            contracts: {
              where: { isActive: true },
              take: 1,
            },
          },
        });
      } else {
        // Search by name (fuzzy match)
        employee = await this.findEmployeeByName(
          context.organizationId,
          normalized.employeeName,
        );
      }

      if (!employee) {
        return this.error(
          `Employee not found: ${normalized.employeeId || normalized.employeeName}`,
          'NOT_FOUND',
        );
      }

      // Check if already terminated
      if (employee.status === EmploymentStatus.TERMINATED) {
        return this.error(
          `Employee ${employee.firstName} ${employee.lastName} is already terminated`,
          'ALREADY_TERMINATED',
        );
      }

      const terminationDate = new Date(normalized.terminationDate);

      // Update employee status
      await this.employeesService.update(employee.id, {
        status: EmploymentStatus.TERMINATED,
        terminationDate: terminationDate.toISOString(),
      });

      // Terminate active contracts
      if (employee.contracts && employee.contracts.length > 0) {
        for (const contract of employee.contracts) {
          await this.employeesService.terminateContract(
            contract.id,
            terminationDate,
          );
        }
      }

      this.logger.log(
        `Employee ${employee.id} terminated by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Successfully terminated employment for ${employee.firstName} ${employee.lastName}. Termination date: ${normalized.terminationDate}${normalized.reason ? `. Reason: ${normalized.reason}` : ''}`,
        employee.id,
        'Employee',
        {
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
          terminationDate: normalized.terminationDate,
          reason: normalized.reason,
        },
      );
    } catch (error) {
      this.logger.error('Failed to terminate employee:', error);
      return this.error(
        'Failed to terminate employee',
        error.message || 'Unknown error',
      );
    }
  }

  /**
   * Find employee by name using fuzzy matching
   */
  private async findEmployeeByName(
    orgId: string,
    name: string,
  ): Promise<any> {
    const nameParts = name.trim().split(/\s+/);

    // Try to match first and last name
    if (nameParts.length === 2) {
      const [firstName, lastName] = nameParts;
      const employee = await this.prisma.employee.findFirst({
        where: {
          orgId,
          firstName: { contains: firstName, mode: 'insensitive' },
          lastName: { contains: lastName, mode: 'insensitive' },
          deletedAt: null,
        },
        include: {
          contracts: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      if (employee) return employee;
    }

    // Try to match either first or last name
    return this.prisma.employee.findFirst({
      where: {
        orgId,
        OR: [
          { firstName: { contains: name, mode: 'insensitive' } },
          { lastName: { contains: name, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      include: {
        contracts: {
          where: { isActive: true },
          take: 1,
        },
      },
    });
  }
}
