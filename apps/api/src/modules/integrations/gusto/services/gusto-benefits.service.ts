import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GustoService } from '../gusto.service';
import {
  GustoBenefit,
  GustoCompanyBenefit,
  GustoDeduction,
  BenefitType,
  GustoTimeOffAccrual,
} from '../types/payroll.types';

/**
 * Gusto Benefits Service
 * Handles employee benefits and deductions management
 *
 * Features:
 * - Health insurance (medical, dental, vision)
 * - Retirement plans (401k, Roth 401k, Simple IRA)
 * - FSA/HSA accounts
 * - Commuter benefits
 * - Life insurance
 * - Disability insurance
 * - Custom deductions
 * - Time off accruals (PTO, sick leave)
 *
 * Benefit Categories:
 * 1. Pre-tax benefits (401k, FSA, HSA, etc.)
 * 2. Post-tax benefits (Roth 401k, etc.)
 * 3. Employer-paid benefits (life insurance, etc.)
 * 4. Voluntary deductions (gym, parking, etc.)
 *
 * @see https://docs.gusto.com/embedded-payroll/docs/benefits
 */
@Injectable()
export class GustoBenefitsService {
  private readonly logger = new Logger(GustoBenefitsService.name);

  constructor(private readonly gustoService: GustoService) {}

  // ==================== Company Benefits ====================

  /**
   * List all company benefits
   */
  async listCompanyBenefits(
    accessToken: string,
    companyUuid: string,
  ): Promise<GustoCompanyBenefit[]> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoCompanyBenefit[]>(
        `/v1/companies/${companyUuid}/company_benefits`,
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Failed to list company benefits', error);
      throw error;
    }
  }

  /**
   * Get company benefit by UUID
   */
  async getCompanyBenefit(
    accessToken: string,
    companyBenefitUuid: string,
  ): Promise<GustoCompanyBenefit> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoCompanyBenefit>(
        `/v1/company_benefits/${companyBenefitUuid}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get company benefit', error);
      throw error;
    }
  }

  /**
   * Create company benefit
   */
  async createCompanyBenefit(
    accessToken: string,
    companyUuid: string,
    benefit: {
      benefit_type: BenefitType | string;
      name: string;
      description?: string;
      responsible_for_employee_w2?: boolean;
      responsible_for_employer_taxes?: boolean;
    },
  ): Promise<GustoCompanyBenefit> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.post<GustoCompanyBenefit>(
        `/v1/companies/${companyUuid}/company_benefits`,
        benefit,
      );

      this.logger.log('Company benefit created', {
        companyUuid,
        benefitName: benefit.name,
        benefitType: benefit.benefit_type,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create company benefit', error);
      throw error;
    }
  }

  /**
   * Update company benefit
   */
  async updateCompanyBenefit(
    accessToken: string,
    companyBenefitUuid: string,
    updates: {
      version: string;
      name?: string;
      description?: string;
      responsible_for_employee_w2?: boolean;
      responsible_for_employer_taxes?: boolean;
    },
  ): Promise<GustoCompanyBenefit> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.put<GustoCompanyBenefit>(
        `/v1/company_benefits/${companyBenefitUuid}`,
        updates,
      );

      this.logger.log('Company benefit updated', { companyBenefitUuid });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to update company benefit', error);
      throw error;
    }
  }

  // ==================== Employee Benefits ====================

  /**
   * List employee benefits
   */
  async listEmployeeBenefits(
    accessToken: string,
    employeeUuid: string,
  ): Promise<GustoBenefit[]> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoBenefit[]>(
        `/v1/employees/${employeeUuid}/employee_benefits`,
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Failed to list employee benefits', error);
      throw error;
    }
  }

  /**
   * Get active employee benefits
   */
  async getActiveEmployeeBenefits(
    accessToken: string,
    employeeUuid: string,
  ): Promise<GustoBenefit[]> {
    try {
      const benefits = await this.listEmployeeBenefits(accessToken, employeeUuid);
      return benefits.filter(b => b.active);
    } catch (error) {
      this.logger.error('Failed to get active employee benefits', error);
      throw error;
    }
  }

  /**
   * Get employee benefit by UUID
   */
  async getEmployeeBenefit(
    accessToken: string,
    employeeBenefitUuid: string,
  ): Promise<GustoBenefit> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoBenefit>(
        `/v1/employee_benefits/${employeeBenefitUuid}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get employee benefit', error);
      throw error;
    }
  }

  /**
   * Enroll employee in benefit
   */
  async enrollEmployeeInBenefit(
    accessToken: string,
    employeeUuid: string,
    benefit: {
      company_benefit_uuid: string;
      active: boolean;
      employee_deduction?: string;
      employee_deduction_annual_maximum?: string;
      employer_contribution?: string;
      employer_contribution_annual_maximum?: string;
      deduct_as_percentage?: boolean;
      contribute_as_percentage?: boolean;
      elective?: boolean;
      catch_up?: boolean;
    },
  ): Promise<GustoBenefit> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.post<GustoBenefit>(
        `/v1/employees/${employeeUuid}/employee_benefits`,
        benefit,
      );

      this.logger.log('Employee enrolled in benefit', {
        employeeUuid,
        companyBenefitUuid: benefit.company_benefit_uuid,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to enroll employee in benefit', error);
      throw error;
    }
  }

  /**
   * Update employee benefit
   */
  async updateEmployeeBenefit(
    accessToken: string,
    employeeBenefitUuid: string,
    updates: {
      version: string;
      active?: boolean;
      employee_deduction?: string;
      employee_deduction_annual_maximum?: string;
      employer_contribution?: string;
      employer_contribution_annual_maximum?: string;
      deduct_as_percentage?: boolean;
      contribute_as_percentage?: boolean;
    },
  ): Promise<GustoBenefit> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.put<GustoBenefit>(
        `/v1/employee_benefits/${employeeBenefitUuid}`,
        updates,
      );

      this.logger.log('Employee benefit updated', { employeeBenefitUuid });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to update employee benefit', error);
      throw error;
    }
  }

  /**
   * Delete employee benefit (unenroll)
   */
  async deleteEmployeeBenefit(
    accessToken: string,
    employeeBenefitUuid: string,
    version: string,
  ): Promise<void> {
    try {
      const client = this.gustoService.createClient(accessToken);
      await client.delete(`/v1/employee_benefits/${employeeBenefitUuid}`, {
        params: { version },
      });

      this.logger.log('Employee benefit deleted', { employeeBenefitUuid });
    } catch (error) {
      this.logger.error('Failed to delete employee benefit', error);
      throw error;
    }
  }

  // ==================== Custom Deductions ====================

  /**
   * List employee deductions
   */
  async listEmployeeDeductions(
    accessToken: string,
    employeeUuid: string,
  ): Promise<GustoDeduction[]> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoDeduction[]>(
        `/v1/employees/${employeeUuid}/garnishments`,
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Failed to list employee deductions', error);
      throw error;
    }
  }

  /**
   * Create custom deduction
   */
  async createCustomDeduction(
    accessToken: string,
    employeeUuid: string,
    deduction: {
      active: boolean;
      amount: string;
      description: string;
      court_ordered?: boolean;
      times?: number;
      recurring?: boolean;
      annual_maximum?: string;
      pay_period_maximum?: string;
      deduct_as_percentage?: boolean;
    },
  ): Promise<GustoDeduction> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.post<GustoDeduction>(
        `/v1/employees/${employeeUuid}/garnishments`,
        deduction,
      );

      this.logger.log('Custom deduction created', {
        employeeUuid,
        description: deduction.description,
        amount: deduction.amount,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create custom deduction', error);
      throw error;
    }
  }

  /**
   * Update custom deduction
   */
  async updateCustomDeduction(
    accessToken: string,
    deductionUuid: string,
    updates: {
      version: string;
      active?: boolean;
      amount?: string;
      description?: string;
      annual_maximum?: string;
      pay_period_maximum?: string;
    },
  ): Promise<GustoDeduction> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.put<GustoDeduction>(
        `/v1/garnishments/${deductionUuid}`,
        updates,
      );

      this.logger.log('Custom deduction updated', { deductionUuid });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to update custom deduction', error);
      throw error;
    }
  }

  // ==================== Time Off & Accruals ====================

  /**
   * Get employee time off accruals
   */
  async getEmployeeTimeOffAccruals(
    accessToken: string,
    employeeUuid: string,
  ): Promise<GustoTimeOffAccrual[]> {
    try {
      const employee = await this.gustoService.getEmployee(accessToken, employeeUuid);

      if (!employee.eligible_paid_time_off) {
        return [];
      }

      return employee.eligible_paid_time_off.map(pto => ({
        name: pto.name,
        hours_accrued: pto.accrual_balance,
        hours_used: '0', // Would need separate API call to get usage
        hours_available: pto.accrual_balance,
        max_hours: pto.maximum_accrual_balance,
      }));
    } catch (error) {
      this.logger.error('Failed to get time off accruals', error);
      throw error;
    }
  }

  // ==================== Benefits Summary & Analysis ====================

  /**
   * Get employee benefits summary
   */
  async getEmployeeBenefitsSummary(
    accessToken: string,
    employeeUuid: string,
  ): Promise<{
    total_employee_deductions: number;
    total_employer_contributions: number;
    benefits_by_type: Record<string, {
      employee_amount: number;
      employer_amount: number;
      count: number;
    }>;
    active_benefits_count: number;
    pretax_deductions: number;
    posttax_deductions: number;
  }> {
    try {
      const benefits = await this.listEmployeeBenefits(accessToken, employeeUuid);
      const activeBenefits = benefits.filter(b => b.active);

      let totalEmployeeDeductions = 0;
      let totalEmployerContributions = 0;
      let pretaxDeductions = 0;
      let posttaxDeductions = 0;

      const benefitsByType: Record<string, {
        employee_amount: number;
        employer_amount: number;
        count: number;
      }> = {};

      activeBenefits.forEach(benefit => {
        const employeeAmount = parseFloat(benefit.employee_deduction || '0');
        const employerAmount = parseFloat(benefit.employer_contribution || '0');

        totalEmployeeDeductions += employeeAmount;
        totalEmployerContributions += employerAmount;

        if (benefit.pretax) {
          pretaxDeductions += employeeAmount;
        } else {
          posttaxDeductions += employeeAmount;
        }

        const type = benefit.benefit_type.toString();
        if (!benefitsByType[type]) {
          benefitsByType[type] = {
            employee_amount: 0,
            employer_amount: 0,
            count: 0,
          };
        }

        benefitsByType[type].employee_amount += employeeAmount;
        benefitsByType[type].employer_amount += employerAmount;
        benefitsByType[type].count += 1;
      });

      return {
        total_employee_deductions: totalEmployeeDeductions,
        total_employer_contributions: totalEmployerContributions,
        benefits_by_type: benefitsByType,
        active_benefits_count: activeBenefits.length,
        pretax_deductions: pretaxDeductions,
        posttax_deductions: posttaxDeductions,
      };
    } catch (error) {
      this.logger.error('Failed to get benefits summary', error);
      throw error;
    }
  }

  /**
   * Calculate total benefit cost for company
   */
  async calculateCompanyBenefitCosts(
    accessToken: string,
    companyUuid: string,
  ): Promise<{
    total_employer_contributions: number;
    total_employee_deductions: number;
    employee_count: number;
    average_per_employee: number;
    by_benefit_type: Record<string, number>;
  }> {
    try {
      const employees = await this.gustoService.listEmployees(accessToken, companyUuid);

      let totalEmployerContributions = 0;
      let totalEmployeeDeductions = 0;
      const byBenefitType: Record<string, number> = {};

      for (const employee of employees) {
        if (employee.terminated) continue;

        const benefits = await this.listEmployeeBenefits(accessToken, employee.uuid);
        const activeBenefits = benefits.filter(b => b.active);

        activeBenefits.forEach(benefit => {
          const employerAmount = parseFloat(benefit.employer_contribution || '0');
          const employeeAmount = parseFloat(benefit.employee_deduction || '0');

          totalEmployerContributions += employerAmount;
          totalEmployeeDeductions += employeeAmount;

          const type = benefit.benefit_type.toString();
          byBenefitType[type] = (byBenefitType[type] || 0) + employerAmount;
        });
      }

      const activeEmployeeCount = employees.filter(e => !e.terminated).length;

      return {
        total_employer_contributions: totalEmployerContributions,
        total_employee_deductions: totalEmployeeDeductions,
        employee_count: activeEmployeeCount,
        average_per_employee: activeEmployeeCount > 0
          ? totalEmployerContributions / activeEmployeeCount
          : 0,
        by_benefit_type: byBenefitType,
      };
    } catch (error) {
      this.logger.error('Failed to calculate company benefit costs', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Check if benefit is pretax
   */
  isBenefitPretax(benefit: GustoBenefit): boolean {
    return benefit.pretax === true;
  }

  /**
   * Check if benefit is elective
   */
  isBenefitElective(benefit: GustoBenefit): boolean {
    return benefit.elective === true;
  }

  /**
   * Check if benefit is retirement plan
   */
  isBenefitRetirementPlan(benefit: GustoBenefit): boolean {
    const retirementTypes = [
      BenefitType.RETIREMENT_401K,
      BenefitType.RETIREMENT_ROTH_401K,
      BenefitType.RETIREMENT_SIMPLE_IRA,
    ];
    return retirementTypes.includes(benefit.benefit_type as BenefitType);
  }

  /**
   * Calculate annual benefit amount
   */
  calculateAnnualBenefitAmount(
    benefit: GustoBenefit,
    payPeriodFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly',
  ): number {
    const amount = parseFloat(benefit.employee_deduction || '0');

    if (benefit.deduct_as_percentage) {
      // Cannot calculate without gross pay
      return 0;
    }

    let periodsPerYear = 26; // Default to biweekly
    switch (payPeriodFrequency) {
      case 'weekly':
        periodsPerYear = 52;
        break;
      case 'biweekly':
        periodsPerYear = 26;
        break;
      case 'semimonthly':
        periodsPerYear = 24;
        break;
      case 'monthly':
        periodsPerYear = 12;
        break;
    }

    return amount * periodsPerYear;
  }

  /**
   * Format benefit amount
   */
  formatBenefitAmount(amount: string, isPercentage: boolean): string {
    if (isPercentage) {
      return `${parseFloat(amount)}%`;
    }
    return `$${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Get benefit type description
   */
  getBenefitTypeDescription(benefitType: BenefitType | string): string {
    const descriptions: Record<BenefitType, string> = {
      [BenefitType.HEALTH_INSURANCE]: 'Medical health insurance coverage',
      [BenefitType.DENTAL_INSURANCE]: 'Dental insurance coverage',
      [BenefitType.VISION_INSURANCE]: 'Vision insurance coverage',
      [BenefitType.RETIREMENT_401K]: '401(k) retirement savings plan',
      [BenefitType.RETIREMENT_SIMPLE_IRA]: 'SIMPLE IRA retirement plan',
      [BenefitType.RETIREMENT_ROTH_401K]: 'Roth 401(k) after-tax retirement savings',
      [BenefitType.FSA]: 'Flexible Spending Account for healthcare',
      [BenefitType.HSA]: 'Health Savings Account',
      [BenefitType.COMMUTER_BENEFITS]: 'Pre-tax commuter benefits',
      [BenefitType.LIFE_INSURANCE]: 'Life insurance coverage',
      [BenefitType.DISABILITY_INSURANCE]: 'Short/long-term disability insurance',
    };

    return descriptions[benefitType as BenefitType] || 'Custom benefit';
  }

  /**
   * Validate benefit enrollment
   */
  validateBenefitEnrollment(benefit: {
    employee_deduction?: string;
    employer_contribution?: string;
    deduct_as_percentage?: boolean;
  }): string[] {
    const errors: string[] = [];

    if (benefit.employee_deduction) {
      const amount = parseFloat(benefit.employee_deduction);
      if (isNaN(amount) || amount < 0) {
        errors.push('Employee deduction must be a positive number');
      }
      if (benefit.deduct_as_percentage && amount > 100) {
        errors.push('Employee deduction percentage cannot exceed 100%');
      }
    }

    if (benefit.employer_contribution) {
      const amount = parseFloat(benefit.employer_contribution);
      if (isNaN(amount) || amount < 0) {
        errors.push('Employer contribution must be a positive number');
      }
    }

    return errors;
  }
}
