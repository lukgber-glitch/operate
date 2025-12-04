import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { GustoService } from '../gusto.service';
import {
  GustoTaxCalculation,
  GustoTaxWithholding,
  TaxType,
  GustoYTDTotals,
} from '../types/payroll.types';

/**
 * Gusto Tax Service
 * Handles tax calculations and withholding management
 *
 * Features:
 * - Federal income tax calculations
 * - State income tax calculations
 * - FICA (Social Security and Medicare)
 * - W-4 withholding management
 * - State withholding forms
 * - YTD tax totals
 * - Tax liability reporting
 *
 * Tax Types Supported:
 * - Federal Income Tax
 * - State Income Tax
 * - Social Security (OASDI) - 6.2% employee + 6.2% employer
 * - Medicare - 1.45% employee + 1.45% employer
 * - Additional Medicare (0.9% on earnings over $200k)
 * - State Unemployment (SUTA) - employer only
 * - Federal Unemployment (FUTA) - employer only
 *
 * @see https://docs.gusto.com/embedded-payroll/docs/taxes
 */
@Injectable()
export class GustoTaxService {
  private readonly logger = new Logger(GustoTaxService.name);

  // 2024 Tax Rates (for reference)
  private readonly SOCIAL_SECURITY_RATE = 0.062; // 6.2%
  private readonly MEDICARE_RATE = 0.0145; // 1.45%
  private readonly ADDITIONAL_MEDICARE_RATE = 0.009; // 0.9%
  private readonly ADDITIONAL_MEDICARE_THRESHOLD = 200000; // $200k
  private readonly SOCIAL_SECURITY_WAGE_BASE = 168600; // 2024 wage base

  constructor(private readonly gustoService: GustoService) {}

  // ==================== Tax Withholding Management ====================

  /**
   * Get employee tax withholding information
   */
  async getEmployeeTaxWithholding(
    accessToken: string,
    employeeUuid: string,
  ): Promise<GustoTaxWithholding> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoTaxWithholding>(
        `/v1/employees/${employeeUuid}/federal_tax_details`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get tax withholding', error);
      throw error;
    }
  }

  /**
   * Update employee federal tax withholding
   */
  async updateFederalTaxWithholding(
    accessToken: string,
    employeeUuid: string,
    withholding: {
      version: string;
      filing_status: string;
      allowances?: number;
      extra_withholding?: string;
      two_jobs?: boolean;
      dependents_amount?: string;
      other_income?: string;
      deductions?: string;
    },
  ): Promise<GustoTaxWithholding> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.put<GustoTaxWithholding>(
        `/v1/employees/${employeeUuid}/federal_tax_details`,
        withholding,
      );

      this.logger.log('Federal tax withholding updated', {
        employeeUuid,
        filingStatus: withholding.filing_status,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to update federal tax withholding', error);
      throw error;
    }
  }

  /**
   * Get employee state tax withholding
   */
  async getStateTaxWithholding(
    accessToken: string,
    employeeUuid: string,
  ): Promise<any> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get(
        `/v1/employees/${employeeUuid}/state_tax_details`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get state tax withholding', error);
      throw error;
    }
  }

  /**
   * Update employee state tax withholding
   */
  async updateStateTaxWithholding(
    accessToken: string,
    employeeUuid: string,
    withholding: {
      version: string;
      filing_status?: string;
      allowances?: number;
      extra_withholding?: string;
      exempt?: boolean;
    },
  ): Promise<any> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.put(
        `/v1/employees/${employeeUuid}/state_tax_details`,
        withholding,
      );

      this.logger.log('State tax withholding updated', {
        employeeUuid,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to update state tax withholding', error);
      throw error;
    }
  }

  // ==================== Tax Calculations ====================

  /**
   * Calculate FICA taxes (Social Security + Medicare)
   */
  calculateFICATaxes(grossPay: number, ytdGrossPay: number = 0): {
    social_security_employee: number;
    social_security_employer: number;
    medicare_employee: number;
    medicare_employer: number;
    additional_medicare: number;
    total_employee: number;
    total_employer: number;
  } {
    // Social Security (capped at wage base)
    let socialSecurityWages = grossPay;
    if (ytdGrossPay + grossPay > this.SOCIAL_SECURITY_WAGE_BASE) {
      socialSecurityWages = Math.max(0, this.SOCIAL_SECURITY_WAGE_BASE - ytdGrossPay);
    }

    const socialSecurityEmployee = socialSecurityWages * this.SOCIAL_SECURITY_RATE;
    const socialSecurityEmployer = socialSecurityWages * this.SOCIAL_SECURITY_RATE;

    // Medicare (no cap)
    const medicareEmployee = grossPay * this.MEDICARE_RATE;
    const medicareEmployer = grossPay * this.MEDICARE_RATE;

    // Additional Medicare (over $200k threshold)
    let additionalMedicare = 0;
    if (ytdGrossPay + grossPay > this.ADDITIONAL_MEDICARE_THRESHOLD) {
      const amountOverThreshold = Math.min(
        grossPay,
        ytdGrossPay + grossPay - this.ADDITIONAL_MEDICARE_THRESHOLD,
      );
      additionalMedicare = amountOverThreshold * this.ADDITIONAL_MEDICARE_RATE;
    }

    return {
      social_security_employee: parseFloat(socialSecurityEmployee.toFixed(2)),
      social_security_employer: parseFloat(socialSecurityEmployer.toFixed(2)),
      medicare_employee: parseFloat(medicareEmployee.toFixed(2)),
      medicare_employer: parseFloat(medicareEmployer.toFixed(2)),
      additional_medicare: parseFloat(additionalMedicare.toFixed(2)),
      total_employee: parseFloat(
        (socialSecurityEmployee + medicareEmployee + additionalMedicare).toFixed(2),
      ),
      total_employer: parseFloat(
        (socialSecurityEmployer + medicareEmployer).toFixed(2),
      ),
    };
  }

  /**
   * Estimate federal income tax withholding (simplified)
   * Note: Actual calculation is complex and depends on W-4 form
   */
  estimateFederalIncomeTax(
    grossPay: number,
    filingStatus: string,
    allowances: number = 0,
    extraWithholding: number = 0,
    payPeriodFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' = 'biweekly',
  ): number {
    // This is a simplified estimation
    // Actual Gusto calculation uses IRS withholding tables

    let annualizedGrossPay = grossPay;
    switch (payPeriodFrequency) {
      case 'weekly':
        annualizedGrossPay = grossPay * 52;
        break;
      case 'biweekly':
        annualizedGrossPay = grossPay * 26;
        break;
      case 'semimonthly':
        annualizedGrossPay = grossPay * 24;
        break;
      case 'monthly':
        annualizedGrossPay = grossPay * 12;
        break;
    }

    // Simplified standard deduction (2024)
    const standardDeduction = filingStatus === 'Single' ? 14600 : 29200;
    const taxableIncome = Math.max(0, annualizedGrossPay - standardDeduction);

    // Simplified tax brackets (2024)
    let annualTax = 0;
    if (filingStatus === 'Single') {
      if (taxableIncome <= 11600) {
        annualTax = taxableIncome * 0.10;
      } else if (taxableIncome <= 47150) {
        annualTax = 1160 + (taxableIncome - 11600) * 0.12;
      } else if (taxableIncome <= 100525) {
        annualTax = 5426 + (taxableIncome - 47150) * 0.22;
      } else if (taxableIncome <= 191950) {
        annualTax = 17168.50 + (taxableIncome - 100525) * 0.24;
      } else {
        annualTax = 39110.50 + (taxableIncome - 191950) * 0.32;
      }
    } else {
      // Married filing jointly
      if (taxableIncome <= 23200) {
        annualTax = taxableIncome * 0.10;
      } else if (taxableIncome <= 94300) {
        annualTax = 2320 + (taxableIncome - 23200) * 0.12;
      } else if (taxableIncome <= 201050) {
        annualTax = 10852 + (taxableIncome - 94300) * 0.22;
      } else if (taxableIncome <= 383900) {
        annualTax = 34337 + (taxableIncome - 201050) * 0.24;
      } else {
        annualTax = 78221 + (taxableIncome - 383900) * 0.32;
      }
    }

    // Convert back to pay period
    let payPeriodTax = annualTax;
    switch (payPeriodFrequency) {
      case 'weekly':
        payPeriodTax = annualTax / 52;
        break;
      case 'biweekly':
        payPeriodTax = annualTax / 26;
        break;
      case 'semimonthly':
        payPeriodTax = annualTax / 24;
        break;
      case 'monthly':
        payPeriodTax = annualTax / 12;
        break;
    }

    // Add extra withholding
    payPeriodTax += extraWithholding;

    return parseFloat(Math.max(0, payPeriodTax).toFixed(2));
  }

  // ==================== YTD Totals ====================

  /**
   * Get year-to-date tax totals for an employee
   */
  async getYTDTaxTotals(
    accessToken: string,
    employeeUuid: string,
    year?: number,
  ): Promise<GustoYTDTotals> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const currentYear = year || new Date().getFullYear();

      const response = await client.get<GustoYTDTotals>(
        `/v1/employees/${employeeUuid}/ytd_totals`,
        {
          params: { year: currentYear },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get YTD tax totals', error);
      throw error;
    }
  }

  /**
   * Calculate projected annual taxes
   */
  async calculateProjectedAnnualTaxes(
    accessToken: string,
    employeeUuid: string,
  ): Promise<{
    ytd_gross_pay: number;
    ytd_federal_tax: number;
    ytd_state_tax: number;
    ytd_fica_tax: number;
    projected_annual_gross_pay: number;
    projected_annual_federal_tax: number;
    projected_annual_state_tax: number;
    projected_annual_fica_tax: number;
  }> {
    try {
      const ytd = await this.getYTDTaxTotals(accessToken, employeeUuid);
      const currentMonth = new Date().getMonth() + 1; // 1-12

      const ytdGrossPay = parseFloat(ytd.gross_pay);
      const ytdFederalTax = parseFloat(ytd.federal_income_tax);
      const ytdStateTax = parseFloat(ytd.state_income_tax);
      const ytdFicaTax = parseFloat(ytd.social_security_tax) + parseFloat(ytd.medicare_tax);

      // Simple projection based on YTD average
      const projectionMultiplier = 12 / currentMonth;

      return {
        ytd_gross_pay: ytdGrossPay,
        ytd_federal_tax: ytdFederalTax,
        ytd_state_tax: ytdStateTax,
        ytd_fica_tax: ytdFicaTax,
        projected_annual_gross_pay: ytdGrossPay * projectionMultiplier,
        projected_annual_federal_tax: ytdFederalTax * projectionMultiplier,
        projected_annual_state_tax: ytdStateTax * projectionMultiplier,
        projected_annual_fica_tax: ytdFicaTax * projectionMultiplier,
      };
    } catch (error) {
      this.logger.error('Failed to calculate projected taxes', error);
      throw error;
    }
  }

  // ==================== Tax Forms ====================

  /**
   * Get W-4 information for employee
   */
  async getW4Information(
    accessToken: string,
    employeeUuid: string,
  ): Promise<{
    has_w4_on_file: boolean;
    filing_status?: string;
    allowances?: number;
    extra_withholding?: string;
    w4_year?: string;
    multiple_jobs?: boolean;
  }> {
    try {
      const withholding = await this.getEmployeeTaxWithholding(
        accessToken,
        employeeUuid,
      );

      return {
        has_w4_on_file: withholding.federal_withholding.w4_data_on_file || false,
        filing_status: withholding.federal_withholding.filing_status,
        allowances: withholding.federal_withholding.allowances,
        extra_withholding: withholding.federal_withholding.extra_withholding,
        multiple_jobs: withholding.federal_withholding.two_jobs,
      };
    } catch (error) {
      this.logger.error('Failed to get W-4 information', error);
      throw error;
    }
  }

  // ==================== Tax Liability Reporting ====================

  /**
   * Get company tax liability summary
   */
  async getCompanyTaxLiability(
    accessToken: string,
    companyUuid: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    federal_income_tax: number;
    state_income_tax: number;
    social_security_employee: number;
    social_security_employer: number;
    medicare_employee: number;
    medicare_employer: number;
    futa: number;
    suta: number;
    total_employee_taxes: number;
    total_employer_taxes: number;
    total_tax_liability: number;
  }> {
    try {
      // Get all payrolls in the date range
      const payrolls = await this.gustoService.listPayrolls(
        accessToken,
        companyUuid,
        {
          startDate,
          endDate,
          processed: true,
        },
      );

      // Sum up all tax amounts
      let federalIncomeTax = 0;
      let stateIncomeTax = 0;
      let socialSecurityEmployee = 0;
      let socialSecurityEmployer = 0;
      let medicareEmployee = 0;
      let medicareEmployer = 0;

      payrolls.forEach(payroll => {
        if (payroll.payroll_totals) {
          const totals = payroll.payroll_totals;
          // Note: This is simplified - actual tax breakdown would come from detailed payroll data
          const employeeTaxes = parseFloat(totals.employee_taxes_total);
          const employerTaxes = parseFloat(totals.employer_taxes_total);

          // Rough estimates (actual values would come from detailed tax lines)
          federalIncomeTax += employeeTaxes * 0.4; // ~40% of employee taxes
          stateIncomeTax += employeeTaxes * 0.1; // ~10% of employee taxes
          socialSecurityEmployee += employeeTaxes * 0.3; // ~30% of employee taxes
          medicareEmployee += employeeTaxes * 0.2; // ~20% of employee taxes
          socialSecurityEmployer += employerTaxes * 0.5; // ~50% of employer taxes
          medicareEmployer += employerTaxes * 0.15; // ~15% of employer taxes
        }
      });

      const totalEmployeeTaxes = federalIncomeTax + stateIncomeTax +
                                  socialSecurityEmployee + medicareEmployee;
      const totalEmployerTaxes = socialSecurityEmployer + medicareEmployer;

      return {
        federal_income_tax: parseFloat(federalIncomeTax.toFixed(2)),
        state_income_tax: parseFloat(stateIncomeTax.toFixed(2)),
        social_security_employee: parseFloat(socialSecurityEmployee.toFixed(2)),
        social_security_employer: parseFloat(socialSecurityEmployer.toFixed(2)),
        medicare_employee: parseFloat(medicareEmployee.toFixed(2)),
        medicare_employer: parseFloat(medicareEmployer.toFixed(2)),
        futa: 0, // Would need separate API call
        suta: 0, // Would need separate API call
        total_employee_taxes: parseFloat(totalEmployeeTaxes.toFixed(2)),
        total_employer_taxes: parseFloat(totalEmployerTaxes.toFixed(2)),
        total_tax_liability: parseFloat((totalEmployeeTaxes + totalEmployerTaxes).toFixed(2)),
      };
    } catch (error) {
      this.logger.error('Failed to get company tax liability', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Format tax amount
   */
  formatTaxAmount(amount: number): string {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Calculate effective tax rate
   */
  calculateEffectiveTaxRate(taxes: number, grossPay: number): number {
    if (grossPay === 0) return 0;
    return parseFloat(((taxes / grossPay) * 100).toFixed(2));
  }

  /**
   * Get tax type description
   */
  getTaxTypeDescription(taxType: TaxType): string {
    const descriptions: Record<TaxType, string> = {
      [TaxType.FEDERAL_INCOME]: 'Federal income tax withheld from employee wages',
      [TaxType.STATE_INCOME]: 'State income tax withheld from employee wages',
      [TaxType.LOCAL_INCOME]: 'Local/city income tax withheld from employee wages',
      [TaxType.SOCIAL_SECURITY]: 'Social Security (OASDI) - 6.2% employee + 6.2% employer',
      [TaxType.MEDICARE]: 'Medicare - 1.45% employee + 1.45% employer',
      [TaxType.STATE_UNEMPLOYMENT]: 'State Unemployment Tax (SUTA) - employer paid',
      [TaxType.FEDERAL_UNEMPLOYMENT]: 'Federal Unemployment Tax (FUTA) - employer paid',
      [TaxType.STATE_DISABILITY]: 'State Disability Insurance - varies by state',
    };

    return descriptions[taxType] || 'Unknown tax type';
  }
}
