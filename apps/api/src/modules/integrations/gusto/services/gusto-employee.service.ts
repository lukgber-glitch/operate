import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { GustoService } from '../gusto.service';
import {
  GustoEmployee,
  GustoEmployeeSyncResult,
  GustoJob,
  GustoCompensation,
} from '../gusto.types';

/**
 * Gusto Employee Service
 * Handles employee synchronization and management
 *
 * Features:
 * - Employee sync from Gusto to Operate
 * - Employee creation in Gusto
 * - Employee updates
 * - Job and compensation management
 */
@Injectable()
export class GustoEmployeeService {
  private readonly logger = new Logger(GustoEmployeeService.name);

  constructor(private readonly gustoService: GustoService) {}

  /**
   * Sync employees from Gusto to Operate
   */
  async syncEmployees(
    accessToken: string,
    companyUuid: string,
    organisationId: string,
  ): Promise<GustoEmployeeSyncResult> {
    const result: GustoEmployeeSyncResult = {
      success: true,
      employeesCreated: 0,
      employeesUpdated: 0,
      employeesSkipped: 0,
      errors: [],
    };

    try {
      // Fetch all employees from Gusto
      const gustoEmployees = await this.gustoService.listEmployees(
        accessToken,
        companyUuid,
      );

      this.logger.log(
        `Syncing ${gustoEmployees.length} employees from Gusto`,
        { companyUuid, organisationId },
      );

      // TODO: Implement actual sync logic with Operate database
      // For now, just count the employees
      for (const employee of gustoEmployees) {
        try {
          // Check if employee exists in Operate
          // const existingEmployee = await this.findEmployeeByGustoUuid(employee.uuid);

          // if (existingEmployee) {
          //   // Update existing employee
          //   await this.updateEmployeeFromGusto(existingEmployee.id, employee);
          //   result.employeesUpdated++;
          // } else {
          //   // Create new employee
          //   await this.createEmployeeFromGusto(organisationId, employee);
          //   result.employeesCreated++;
          // }

          // For now, just log
          this.logger.debug(`Would sync employee: ${employee.first_name} ${employee.last_name}`);
          result.employeesSkipped++;
        } catch (error) {
          this.logger.error(`Failed to sync employee ${employee.uuid}`, error);
          result.errors.push({
            employeeUuid: employee.uuid,
            error: error.message,
          });
          result.success = false;
        }
      }

      this.logger.log('Employee sync completed', result);
      return result;
    } catch (error) {
      this.logger.error('Employee sync failed', error);
      result.success = false;
      result.errors.push({
        employeeUuid: 'N/A',
        error: error.message,
      });
      return result;
    }
  }

  /**
   * Get employee from Gusto
   */
  async getEmployee(
    accessToken: string,
    employeeUuid: string,
  ): Promise<GustoEmployee> {
    return this.gustoService.getEmployee(accessToken, employeeUuid);
  }

  /**
   * List all employees for a company
   */
  async listEmployees(
    accessToken: string,
    companyUuid: string,
  ): Promise<GustoEmployee[]> {
    return this.gustoService.listEmployees(accessToken, companyUuid);
  }

  /**
   * Create employee in Gusto
   */
  async createEmployee(
    accessToken: string,
    companyUuid: string,
    employeeData: {
      first_name: string;
      last_name: string;
      email?: string;
      date_of_birth?: string;
      ssn?: string;
      home_address?: {
        street_1: string;
        street_2?: string;
        city: string;
        state: string;
        zip: string;
      };
      jobs: Array<{
        location_uuid: string;
        hire_date: string;
        title: string;
        rate?: string;
        payment_unit?: 'Hour' | 'Week' | 'Month' | 'Year' | 'Paycheck';
      }>;
    },
  ): Promise<GustoEmployee> {
    return this.gustoService.createEmployee(
      accessToken,
      companyUuid,
      employeeData as Partial<GustoEmployee>,
    );
  }

  /**
   * Update employee in Gusto
   */
  async updateEmployee(
    accessToken: string,
    employeeUuid: string,
    updates: Partial<GustoEmployee>,
  ): Promise<GustoEmployee> {
    return this.gustoService.updateEmployee(
      accessToken,
      employeeUuid,
      updates,
    );
  }

  /**
   * Get employee's primary job
   */
  getPrimaryJob(employee: GustoEmployee): GustoJob | undefined {
    return employee.jobs?.find(job => job.primary);
  }

  /**
   * Get employee's current compensation
   */
  getCurrentCompensation(job: GustoJob): GustoCompensation | undefined {
    if (!job.compensations || job.compensations.length === 0) {
      return undefined;
    }

    // Sort by effective date (most recent first)
    const sorted = [...job.compensations].sort((a, b) => {
      return new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime();
    });

    return sorted[0];
  }

  /**
   * Calculate annual salary from compensation
   */
  calculateAnnualSalary(compensation: GustoCompensation): number {
    const rate = parseFloat(compensation.rate);

    switch (compensation.payment_unit) {
      case 'Year':
        return rate;
      case 'Month':
        return rate * 12;
      case 'Week':
        return rate * 52;
      case 'Hour':
        // Assume 40 hours/week, 52 weeks/year
        return rate * 40 * 52;
      case 'Paycheck':
        // Assume bi-weekly (26 paychecks/year)
        return rate * 26;
      default:
        return 0;
    }
  }

  /**
   * Format employee name
   */
  formatEmployeeName(employee: GustoEmployee): string {
    const parts = [
      employee.first_name,
      employee.middle_initial,
      employee.last_name,
    ].filter(Boolean);
    return parts.join(' ');
  }

  /**
   * Check if employee is active
   */
  isEmployeeActive(employee: GustoEmployee): boolean {
    return !employee.terminated;
  }

  /**
   * Get employee status description
   */
  getEmployeeStatus(employee: GustoEmployee): string {
    if (employee.terminated) {
      return 'Terminated';
    }
    if (!employee.onboarded) {
      return 'Pending Onboarding';
    }
    return 'Active';
  }

  /**
   * Validate employee data before creation
   */
  validateEmployeeData(data: any): string[] {
    const errors: string[] = [];

    if (!data.first_name) {
      errors.push('First name is required');
    }
    if (!data.last_name) {
      errors.push('Last name is required');
    }
    if (!data.jobs || data.jobs.length === 0) {
      errors.push('At least one job is required');
    } else {
      data.jobs.forEach((job: any, index: number) => {
        if (!job.location_uuid) {
          errors.push(`Job ${index + 1}: Location UUID is required`);
        }
        if (!job.hire_date) {
          errors.push(`Job ${index + 1}: Hire date is required`);
        }
        if (!job.title) {
          errors.push(`Job ${index + 1}: Job title is required`);
        }
      });
    }

    // Validate SSN format if provided
    if (data.ssn && !this.isValidSSN(data.ssn)) {
      errors.push('Invalid SSN format (should be XXX-XX-XXXX)');
    }

    // Validate date of birth if provided
    if (data.date_of_birth && !this.isValidDate(data.date_of_birth)) {
      errors.push('Invalid date of birth format (should be YYYY-MM-DD)');
    }

    return errors;
  }

  /**
   * Helper: Validate SSN format
   */
  private isValidSSN(ssn: string): boolean {
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    return ssnRegex.test(ssn);
  }

  /**
   * Helper: Validate date format
   */
  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date) && !isNaN(Date.parse(date));
  }

  /**
   * Format SSN (add hyphens if missing)
   */
  formatSSN(ssn: string): string {
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return ssn;
  }
}
