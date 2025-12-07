/**
 * Hire Employee Action Handler
 * Handles hiring new employees via chatbot
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
import { CreateEmployeeDto } from '../../../hr/employees/dto/create-employee.dto';
import { EmploymentStatus } from '@prisma/client';

@Injectable()
export class HireEmployeeHandler extends BaseActionHandler {
  constructor(private employeesService: EmployeesService) {
    super('HireEmployeeHandler');
  }

  get actionType(): ActionType {
    return ActionType.HIRE_EMPLOYEE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'firstName',
        type: 'string',
        required: true,
        description: 'Employee first name',
      },
      {
        name: 'lastName',
        type: 'string',
        required: true,
        description: 'Employee last name',
      },
      {
        name: 'email',
        type: 'string',
        required: true,
        description: 'Employee email address',
        validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      },
      {
        name: 'department',
        type: 'string',
        required: false,
        description: 'Department name',
      },
      {
        name: 'position',
        type: 'string',
        required: true,
        description: 'Job position/title',
      },
      {
        name: 'startDate',
        type: 'string',
        required: true,
        description: 'Employment start date (ISO format)',
      },
      {
        name: 'salary',
        type: 'number',
        required: false,
        description: 'Annual salary amount',
        validation: (value) => value > 0,
      },
      {
        name: 'countryCode',
        type: 'string',
        required: true,
        description: 'Work country code (e.g., DE, US, GB)',
        validation: (value) => /^[A-Z]{2}$/i.test(value),
      },
      {
        name: 'dateOfBirth',
        type: 'string',
        required: false,
        description: 'Date of birth (ISO format)',
      },
      {
        name: 'phone',
        type: 'string',
        required: false,
        description: 'Phone number',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'hr:employees:create')) {
        return this.error(
          'You do not have permission to hire employees',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Validate required fields
      if (!normalized.firstName || !normalized.lastName || !normalized.email) {
        return this.error(
          'firstName, lastName, and email are required',
          'VALIDATION_ERROR',
        );
      }

      // Generate unique employee number
      const employeeNumber = await this.generateEmployeeNumber(
        context.organizationId,
      );

      // Set default date of birth if not provided (required by schema)
      const dateOfBirth = normalized.dateOfBirth || '1990-01-01';

      // Build employee DTO
      const employeeDto: CreateEmployeeDto = {
        employeeNumber,
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        email: normalized.email,
        phone: normalized.phone,
        dateOfBirth,
        countryCode: normalized.countryCode.toUpperCase(),
        hireDate: normalized.startDate,
        status: EmploymentStatus.ACTIVE,
        // Optional fields
        ...(normalized.taxId && { taxId: normalized.taxId }),
        ...(normalized.gender && { gender: normalized.gender }),
        ...(normalized.nationality && { nationality: normalized.nationality }),
      };

      // Create employee
      const employee = await this.employeesService.create(
        context.organizationId,
        employeeDto,
      );

      this.logger.log(
        `Employee ${employee.id} hired by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Successfully hired ${normalized.firstName} ${normalized.lastName} as ${normalized.position}. Employee number: ${employeeNumber}`,
        employee.id,
        'Employee',
        {
          employeeNumber,
          name: `${normalized.firstName} ${normalized.lastName}`,
          position: normalized.position,
          department: normalized.department,
          startDate: normalized.startDate,
        },
      );
    } catch (error) {
      this.logger.error('Failed to hire employee:', error);
      return this.error(
        'Failed to hire employee',
        error.message || 'Unknown error',
      );
    }
  }

  /**
   * Generate unique employee number
   */
  private async generateEmployeeNumber(orgId: string): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `EMP-${timestamp}${random}`;
  }
}
