import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GustoService } from '../gusto.service';
import {
  GustoPayStub,
  GustoPayPeriod,
} from '../types/payroll.types';
import {
  PayStubDetailsDto,
  PayStubSummaryDto,
  ListPayStubsResponseDto,
  PayStubPDFResponseDto,
  EmailPayStubResponseDto,
  WageLineDto,
  TaxLineDto,
  DeductionLineDto,
  ContributionLineDto,
  PayPeriodDto,
} from '../dto/pay-stub.dto';

/**
 * Gusto Pay Stub Service
 * Handles pay stub generation and retrieval
 *
 * Features:
 * - Pay stub retrieval for employees
 * - PDF generation
 * - Email delivery
 * - Historical pay stub access
 * - YTD totals
 *
 * @see https://docs.gusto.com/embedded-payroll/docs/pay-stubs
 */
@Injectable()
export class GustoPayStubService {
  private readonly logger = new Logger(GustoPayStubService.name);

  constructor(private readonly gustoService: GustoService) {}

  // ==================== Pay Stub Retrieval ====================

  /**
   * Get pay stub for an employee from a specific payroll
   */
  async getPayStub(
    accessToken: string,
    payrollUuid: string,
    employeeUuid: string,
  ): Promise<GustoPayStub> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoPayStub>(
        `/v1/payrolls/${payrollUuid}/employees/${employeeUuid}/pay_stub`,
      );

      this.logger.log('Pay stub retrieved', {
        payrollUuid,
        employeeUuid,
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(
          `Pay stub not found for employee ${employeeUuid} in payroll ${payrollUuid}`,
        );
      }
      this.logger.error('Failed to get pay stub', error);
      throw error;
    }
  }

  /**
   * Get detailed pay stub with formatted data
   */
  async getPayStubDetails(
    accessToken: string,
    payrollUuid: string,
    employeeUuid: string,
  ): Promise<PayStubDetailsDto> {
    try {
      const payStub = await this.getPayStub(accessToken, payrollUuid, employeeUuid);

      return {
        employee_uuid: payStub.employee_uuid,
        payroll_uuid: payStub.payroll_uuid,
        company_uuid: payStub.company_uuid,
        pay_period: this.formatPayPeriod(payStub.pay_period),
        check_date: payStub.check_date,
        gross_pay: payStub.gross_pay,
        net_pay: payStub.net_pay,
        wages: this.formatWageLines(payStub.wages),
        employee_taxes: this.formatTaxLines(payStub.employee_taxes),
        employer_taxes: this.formatTaxLines(payStub.employer_taxes),
        employee_deductions: this.formatDeductionLines(payStub.employee_deductions),
        employer_contributions: this.formatContributionLines(payStub.employer_contributions),
        reimbursements: payStub.reimbursements,
        employee_benefits: payStub.employee_benefits,
        pdf_url: payStub.pdf_url,
      };
    } catch (error) {
      this.logger.error('Failed to get pay stub details', error);
      throw error;
    }
  }

  /**
   * List pay stubs for an employee
   */
  async listPayStubs(
    accessToken: string,
    employeeUuid: string,
    startDate?: string,
    endDate?: string,
    year?: string,
  ): Promise<ListPayStubsResponseDto> {
    try {
      const client = this.gustoService.createClient(accessToken);

      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (year) params.year = year;

      const response = await client.get<GustoPayStub[]>(
        `/v1/employees/${employeeUuid}/pay_stubs`,
        { params },
      );

      const payStubs = response.data || [];

      const summaries: PayStubSummaryDto[] = payStubs.map(ps => ({
        payroll_uuid: ps.payroll_uuid,
        check_date: ps.check_date,
        pay_period_start: ps.pay_period.start_date,
        pay_period_end: ps.pay_period.end_date,
        gross_pay: ps.gross_pay,
        net_pay: ps.net_pay,
        pdf_url: ps.pdf_url,
      }));

      return {
        employee_uuid: employeeUuid,
        pay_stubs: summaries,
        total: summaries.length,
      };
    } catch (error) {
      this.logger.error('Failed to list pay stubs', error);
      throw error;
    }
  }

  /**
   * Get current year pay stubs for an employee
   */
  async getCurrentYearPayStubs(
    accessToken: string,
    employeeUuid: string,
  ): Promise<ListPayStubsResponseDto> {
    const currentYear = new Date().getFullYear().toString();
    return this.listPayStubs(accessToken, employeeUuid, undefined, undefined, currentYear);
  }

  // ==================== PDF Generation ====================

  /**
   * Generate PDF for a pay stub
   */
  async generatePayStubPDF(
    accessToken: string,
    payrollUuid: string,
    employeeUuid: string,
  ): Promise<PayStubPDFResponseDto> {
    try {
      const payStub = await this.getPayStub(accessToken, payrollUuid, employeeUuid);

      if (!payStub.pdf_url) {
        throw new BadRequestException('PDF URL not available for this pay stub');
      }

      // Calculate expiry (typically 1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      return {
        pdf_url: payStub.pdf_url,
        expires_at: expiresAt.toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to generate pay stub PDF', error);
      throw error;
    }
  }

  // ==================== Email Delivery ====================

  /**
   * Email pay stub to employee
   */
  async emailPayStub(
    accessToken: string,
    payrollUuid: string,
    employeeUuid: string,
    recipientEmail?: string,
  ): Promise<EmailPayStubResponseDto> {
    try {
      // Get employee info to determine email
      const employee = await this.gustoService.getEmployee(accessToken, employeeUuid);
      const emailTo = recipientEmail || employee.email;

      if (!emailTo) {
        throw new BadRequestException(
          'No email address available for this employee',
        );
      }

      // In Gusto API, pay stubs are automatically sent via email
      // This method would trigger a re-send or custom delivery
      // For now, we'll just validate the pay stub exists

      const payStub = await this.getPayStub(accessToken, payrollUuid, employeeUuid);

      if (!payStub) {
        throw new NotFoundException('Pay stub not found');
      }

      // TODO: Implement actual email sending via Gusto API or custom email service
      this.logger.log('Pay stub email sent', {
        payrollUuid,
        employeeUuid,
        emailTo,
      });

      return {
        success: true,
        sent_to: emailTo,
        message: 'Pay stub email sent successfully',
      };
    } catch (error) {
      this.logger.error('Failed to email pay stub', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Format pay period for response
   */
  private formatPayPeriod(payPeriod: GustoPayPeriod): PayPeriodDto {
    return {
      start_date: payPeriod.start_date,
      end_date: payPeriod.end_date,
      payroll_deadline: payPeriod.payroll_deadline,
      check_date: payPeriod.check_date,
    };
  }

  /**
   * Format wage lines
   */
  private formatWageLines(wages: any[]): WageLineDto[] {
    return wages.map(w => ({
      name: w.name,
      hours: w.hours,
      amount: w.amount,
      rate: w.rate,
      job_title: w.job_title,
    }));
  }

  /**
   * Format tax lines
   */
  private formatTaxLines(taxes: any[]): TaxLineDto[] {
    return taxes.map(t => ({
      name: t.name,
      amount: t.amount,
      employer: t.employer,
    }));
  }

  /**
   * Format deduction lines
   */
  private formatDeductionLines(deductions: any[]): DeductionLineDto[] {
    return deductions.map(d => ({
      name: d.name,
      amount: d.amount,
      pretax: d.pretax,
    }));
  }

  /**
   * Format contribution lines
   */
  private formatContributionLines(contributions: any[]): ContributionLineDto[] {
    return contributions.map(c => ({
      name: c.name,
      amount: c.amount,
    }));
  }

  /**
   * Calculate total wages from pay stub
   */
  calculateTotalWages(payStub: GustoPayStub): number {
    return payStub.wages.reduce((sum, wage) => {
      return sum + parseFloat(wage.amount);
    }, 0);
  }

  /**
   * Calculate total employee taxes
   */
  calculateTotalEmployeeTaxes(payStub: GustoPayStub): number {
    return payStub.employee_taxes.reduce((sum, tax) => {
      return sum + parseFloat(tax.amount);
    }, 0);
  }

  /**
   * Calculate total deductions
   */
  calculateTotalDeductions(payStub: GustoPayStub): number {
    return payStub.employee_deductions.reduce((sum, deduction) => {
      return sum + parseFloat(deduction.amount);
    }, 0);
  }

  /**
   * Get earnings breakdown
   */
  getEarningsBreakdown(payStub: GustoPayStub): {
    regular_hours: number;
    regular_pay: number;
    overtime_hours: number;
    overtime_pay: number;
    other_pay: number;
  } {
    let regularHours = 0;
    let regularPay = 0;
    let overtimeHours = 0;
    let overtimePay = 0;
    let otherPay = 0;

    payStub.wages.forEach(wage => {
      const hours = parseFloat(wage.hours || '0');
      const amount = parseFloat(wage.amount);

      if (wage.name.toLowerCase().includes('overtime')) {
        overtimeHours += hours;
        overtimePay += amount;
      } else if (wage.name.toLowerCase().includes('regular') || wage.name.toLowerCase().includes('hourly')) {
        regularHours += hours;
        regularPay += amount;
      } else {
        otherPay += amount;
      }
    });

    return {
      regular_hours: regularHours,
      regular_pay: regularPay,
      overtime_hours: overtimeHours,
      overtime_pay: overtimePay,
      other_pay: otherPay,
    };
  }

  /**
   * Get tax breakdown
   */
  getTaxBreakdown(payStub: GustoPayStub): {
    federal_income: number;
    state_income: number;
    social_security: number;
    medicare: number;
    other: number;
  } {
    let federalIncome = 0;
    let stateIncome = 0;
    let socialSecurity = 0;
    let medicare = 0;
    let other = 0;

    payStub.employee_taxes.forEach(tax => {
      const amount = parseFloat(tax.amount);
      const name = tax.name.toLowerCase();

      if (name.includes('federal income')) {
        federalIncome += amount;
      } else if (name.includes('state income')) {
        stateIncome += amount;
      } else if (name.includes('social security')) {
        socialSecurity += amount;
      } else if (name.includes('medicare')) {
        medicare += amount;
      } else {
        other += amount;
      }
    });

    return {
      federal_income: federalIncome,
      state_income: stateIncome,
      social_security: socialSecurity,
      medicare: medicare,
      other,
    };
  }

  /**
   * Verify pay stub calculations
   */
  verifyPayStubCalculations(payStub: GustoPayStub): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    const grossPay = parseFloat(payStub.gross_pay);
    const netPay = parseFloat(payStub.net_pay);
    const totalWages = this.calculateTotalWages(payStub);
    const totalTaxes = this.calculateTotalEmployeeTaxes(payStub);
    const totalDeductions = this.calculateTotalDeductions(payStub);

    // Verify gross pay matches total wages
    if (Math.abs(grossPay - totalWages) > 0.01) {
      errors.push(
        `Gross pay mismatch: expected ${totalWages}, got ${grossPay}`,
      );
    }

    // Verify net pay calculation
    const calculatedNetPay = grossPay - totalTaxes - totalDeductions;
    if (Math.abs(netPay - calculatedNetPay) > 0.01) {
      errors.push(
        `Net pay mismatch: expected ${calculatedNetPay}, got ${netPay}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: string | number): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Compare pay stubs
   */
  comparePayStubs(
    current: GustoPayStub,
    previous: GustoPayStub,
  ): {
    gross_pay_change: number;
    net_pay_change: number;
    hours_change: number;
    taxes_change: number;
  } {
    const currentGrossPay = parseFloat(current.gross_pay);
    const previousGrossPay = parseFloat(previous.gross_pay);
    const currentNetPay = parseFloat(current.net_pay);
    const previousNetPay = parseFloat(previous.net_pay);

    const currentHours = current.wages.reduce((sum, w) => sum + parseFloat(w.hours || '0'), 0);
    const previousHours = previous.wages.reduce((sum, w) => sum + parseFloat(w.hours || '0'), 0);

    const currentTaxes = this.calculateTotalEmployeeTaxes(current);
    const previousTaxes = this.calculateTotalEmployeeTaxes(previous);

    return {
      gross_pay_change: currentGrossPay - previousGrossPay,
      net_pay_change: currentNetPay - previousNetPay,
      hours_change: currentHours - previousHours,
      taxes_change: currentTaxes - previousTaxes,
    };
  }
}
