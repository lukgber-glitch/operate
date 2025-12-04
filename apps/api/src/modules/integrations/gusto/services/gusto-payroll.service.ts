import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { GustoService } from '../gusto.service';
import {
  GustoPayrollDetails,
  CreatePayrollRequest,
  UpdatePayrollRequest,
  CalculatePayrollRequest,
  SubmitPayrollRequest,
  PayrollProcessingResult,
  PayrollStatus,
  GustoPayPeriod,
  PayrollQueryOptions,
  PayrollListResponse,
  GustoPaySchedule,
  PayScheduleFrequency,
} from '../types/payroll.types';
import {
  CreatePayrollDto,
  UpdatePayrollDto,
  CalculatePayrollDto,
  SubmitPayrollDto,
  CancelPayrollDto,
  ListPayrollsQueryDto,
  PayrollSummaryDto,
} from '../dto/payroll.dto';

/**
 * Gusto Payroll Service
 * Handles all payroll operations via the Gusto API
 *
 * Features:
 * - Pay period calculation and management
 * - Payroll creation, calculation, and submission
 * - Payroll lifecycle management (draft -> calculated -> submitted -> processed)
 * - Off-cycle payroll support
 * - Historical payroll data retrieval
 * - Payroll cancellation
 * - Payroll summary and reporting
 *
 * Payroll Lifecycle:
 * 1. Create payroll (draft status)
 * 2. Add/update employee compensations
 * 3. Calculate payroll (calculates taxes, deductions)
 * 4. Review and approve
 * 5. Submit payroll (locks payroll for processing)
 * 6. Process payroll (Gusto handles direct deposits/checks)
 *
 * @see https://docs.gusto.com/embedded-payroll/docs/payrolls
 */
@Injectable()
export class GustoPayrollService {
  private readonly logger = new Logger(GustoPayrollService.name);

  constructor(private readonly gustoService: GustoService) {}

  // ==================== Pay Period Management ====================

  /**
   * Get current pay period for a company
   */
  async getCurrentPayPeriod(
    accessToken: string,
    companyUuid: string,
  ): Promise<GustoPayPeriod> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoPayPeriod[]>(
        `/v1/companies/${companyUuid}/pay_periods`,
        {
          params: { start_date: new Date().toISOString().split('T')[0] },
        },
      );

      if (!response.data || response.data.length === 0) {
        throw new BadRequestException('No pay periods found');
      }

      return response.data[0];
    } catch (error) {
      this.logger.error('Failed to get current pay period', error);
      throw error;
    }
  }

  /**
   * Get pay period for a specific date
   */
  async getPayPeriodForDate(
    accessToken: string,
    companyUuid: string,
    date: string,
  ): Promise<GustoPayPeriod> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoPayPeriod[]>(
        `/v1/companies/${companyUuid}/pay_periods`,
        {
          params: { start_date: date, end_date: date },
        },
      );

      if (!response.data || response.data.length === 0) {
        throw new BadRequestException(`No pay period found for date ${date}`);
      }

      return response.data[0];
    } catch (error) {
      this.logger.error('Failed to get pay period for date', error);
      throw error;
    }
  }

  /**
   * List pay periods within a date range
   */
  async listPayPeriods(
    accessToken: string,
    companyUuid: string,
    startDate?: string,
    endDate?: string,
  ): Promise<GustoPayPeriod[]> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoPayPeriod[]>(
        `/v1/companies/${companyUuid}/pay_periods`,
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        },
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Failed to list pay periods', error);
      throw error;
    }
  }

  /**
   * Get next pay period
   */
  async getNextPayPeriod(
    accessToken: string,
    companyUuid: string,
  ): Promise<GustoPayPeriod> {
    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 60); // Look 60 days ahead

      const periods = await this.listPayPeriods(
        accessToken,
        companyUuid,
        today.toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0],
      );

      if (!periods || periods.length === 0) {
        throw new BadRequestException('No future pay periods found');
      }

      // Find the first period that starts in the future
      const nextPeriod = periods.find(
        p => new Date(p.start_date) > today,
      );

      return nextPeriod || periods[0];
    } catch (error) {
      this.logger.error('Failed to get next pay period', error);
      throw error;
    }
  }

  // ==================== Payroll CRUD Operations ====================

  /**
   * Create a new payroll
   */
  async createPayroll(
    accessToken: string,
    dto: CreatePayrollDto,
  ): Promise<GustoPayrollDetails> {
    try {
      const client = this.gustoService.createClient(accessToken);

      const request: CreatePayrollRequest = {
        company_uuid: dto.company_uuid,
        start_date: dto.start_date,
        end_date: dto.end_date,
        check_date: dto.check_date,
        off_cycle: dto.off_cycle,
        off_cycle_reason: dto.off_cycle_reason,
        employee_compensations: dto.employee_compensations,
      };

      const response = await client.post<GustoPayrollDetails>(
        `/v1/companies/${dto.company_uuid}/payrolls`,
        request,
      );

      this.logger.log('Payroll created', {
        payrollUuid: response.data.uuid,
        companyUuid: dto.company_uuid,
        checkDate: response.data.check_date,
        offCycle: dto.off_cycle,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create payroll', error);
      throw error;
    }
  }

  /**
   * Get payroll by UUID
   */
  async getPayroll(
    accessToken: string,
    payrollUuid: string,
  ): Promise<GustoPayrollDetails> {
    try {
      const client = this.gustoService.createClient(accessToken);
      const response = await client.get<GustoPayrollDetails>(
        `/v1/payrolls/${payrollUuid}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get payroll', error);
      throw error;
    }
  }

  /**
   * Update payroll
   * Can only update payrolls that haven't been submitted
   */
  async updatePayroll(
    accessToken: string,
    payrollUuid: string,
    dto: UpdatePayrollDto,
  ): Promise<GustoPayrollDetails> {
    try {
      const client = this.gustoService.createClient(accessToken);

      const request: UpdatePayrollRequest = {
        version: dto.version,
        employee_compensations: dto.employee_compensations,
      };

      const response = await client.put<GustoPayrollDetails>(
        `/v1/payrolls/${payrollUuid}`,
        request,
      );

      this.logger.log('Payroll updated', {
        payrollUuid,
        version: dto.version,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to update payroll', error);
      throw error;
    }
  }

  /**
   * List payrolls for a company
   */
  async listPayrolls(
    accessToken: string,
    companyUuid: string,
    query?: ListPayrollsQueryDto,
  ): Promise<PayrollListResponse> {
    try {
      const client = this.gustoService.createClient(accessToken);

      const params: any = {};
      if (query?.start_date) params.start_date = query.start_date;
      if (query?.end_date) params.end_date = query.end_date;
      if (query?.processed !== undefined) params.processed = query.processed;
      if (query?.include_off_cycle !== undefined) {
        params.include_off_cycle = query.include_off_cycle;
      }

      const response = await client.get<GustoPayrollDetails[]>(
        `/v1/companies/${companyUuid}/payrolls`,
        { params },
      );

      const payrolls = response.data || [];

      // Apply pagination if requested
      const page = query?.page || 1;
      const perPage = query?.per_page || 20;
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;

      return {
        payrolls: payrolls.slice(startIndex, endIndex),
        total: payrolls.length,
        page,
        per_page: perPage,
      };
    } catch (error) {
      this.logger.error('Failed to list payrolls', error);
      throw error;
    }
  }

  // ==================== Payroll Calculation ====================

  /**
   * Calculate payroll
   * Calculates taxes, deductions, and net pay
   */
  async calculatePayroll(
    accessToken: string,
    payrollUuid: string,
    dto: CalculatePayrollDto,
  ): Promise<GustoPayrollDetails> {
    try {
      const client = this.gustoService.createClient(accessToken);

      const request: CalculatePayrollRequest = {
        version: dto.version,
      };

      const response = await client.put<GustoPayrollDetails>(
        `/v1/payrolls/${payrollUuid}/calculate`,
        request,
      );

      this.logger.log('Payroll calculated', {
        payrollUuid,
        totals: response.data.payroll_totals,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to calculate payroll', error);
      throw error;
    }
  }

  // ==================== Payroll Submission ====================

  /**
   * Submit payroll for processing
   * After submission, payroll cannot be edited
   */
  async submitPayroll(
    accessToken: string,
    payrollUuid: string,
    dto: SubmitPayrollDto,
  ): Promise<PayrollProcessingResult> {
    try {
      const client = this.gustoService.createClient(accessToken);

      const request: SubmitPayrollRequest = {
        version: dto.version,
      };

      const response = await client.put<GustoPayrollDetails>(
        `/v1/payrolls/${payrollUuid}/submit`,
        request,
      );

      const result: PayrollProcessingResult = {
        success: true,
        payroll_uuid: response.data.uuid,
        status: response.data.processed
          ? PayrollStatus.PROCESSED
          : PayrollStatus.SUBMITTED,
        check_date: response.data.check_date,
        processed_date: response.data.processed_date,
        total_net_pay: response.data.payroll_totals?.net_pay_total || '0.00',
        total_gross_pay: response.data.payroll_totals?.gross_pay_total || '0.00',
        employee_count: response.data.employee_compensations?.length || 0,
      };

      this.logger.log('Payroll submitted', {
        payrollUuid,
        checkDate: result.check_date,
        employeeCount: result.employee_count,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to submit payroll', error);
      throw error;
    }
  }

  // ==================== Payroll Cancellation ====================

  /**
   * Cancel a payroll
   * Can only cancel payrolls that haven't been processed
   */
  async cancelPayroll(
    accessToken: string,
    payrollUuid: string,
    dto: CancelPayrollDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if payroll can be cancelled
      const payroll = await this.getPayroll(accessToken, payrollUuid);

      if (payroll.processed) {
        throw new BadRequestException(
          'Cannot cancel a processed payroll. Contact Gusto support for assistance.',
        );
      }

      // Delete the payroll
      const client = this.gustoService.createClient(accessToken);
      await client.delete(`/v1/payrolls/${payrollUuid}`, {
        params: { version: dto.version },
      });

      this.logger.log('Payroll cancelled', { payrollUuid });

      return {
        success: true,
        message: 'Payroll cancelled successfully',
      };
    } catch (error) {
      this.logger.error('Failed to cancel payroll', error);
      throw error;
    }
  }

  // ==================== Payroll Summaries ====================

  /**
   * Get payroll summary
   */
  async getPayrollSummary(
    accessToken: string,
    payrollUuid: string,
  ): Promise<PayrollSummaryDto> {
    try {
      const payroll = await this.getPayroll(accessToken, payrollUuid);

      return {
        payroll_uuid: payroll.uuid,
        company_uuid: payroll.company_uuid,
        check_date: payroll.check_date,
        pay_period_start: payroll.pay_period.start_date,
        pay_period_end: payroll.pay_period.end_date,
        processed: payroll.processed,
        processed_date: payroll.processed_date,
        employee_count: payroll.employee_compensations?.length || 0,
        gross_pay_total: payroll.payroll_totals?.gross_pay_total || '0.00',
        net_pay_total: payroll.payroll_totals?.net_pay_total || '0.00',
        employer_taxes_total: payroll.payroll_totals?.employer_taxes_total || '0.00',
        employee_taxes_total: payroll.payroll_totals?.employee_taxes_total || '0.00',
        off_cycle: payroll.off_cycle,
      };
    } catch (error) {
      this.logger.error('Failed to get payroll summary', error);
      throw error;
    }
  }

  /**
   * Get payroll summaries for multiple payrolls
   */
  async getPayrollSummaries(
    accessToken: string,
    companyUuid: string,
    query?: ListPayrollsQueryDto,
  ): Promise<PayrollSummaryDto[]> {
    try {
      const result = await this.listPayrolls(accessToken, companyUuid, query);

      return Promise.all(
        result.payrolls.map(payroll =>
          this.getPayrollSummary(accessToken, payroll.uuid),
        ),
      );
    } catch (error) {
      this.logger.error('Failed to get payroll summaries', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Check if payroll is in draft status
   */
  isPayrollDraft(payroll: GustoPayrollDetails): boolean {
    return !payroll.calculated_at && !payroll.processed;
  }

  /**
   * Check if payroll is calculated
   */
  isPayrollCalculated(payroll: GustoPayrollDetails): boolean {
    return !!payroll.calculated_at && !payroll.processed;
  }

  /**
   * Check if payroll is processed
   */
  isPayrollProcessed(payroll: GustoPayrollDetails): boolean {
    return payroll.processed;
  }

  /**
   * Get payroll status
   */
  getPayrollStatus(payroll: GustoPayrollDetails): PayrollStatus {
    if (payroll.processed) {
      return PayrollStatus.PROCESSED;
    }
    if (payroll.calculated_at) {
      return PayrollStatus.CALCULATED;
    }
    return PayrollStatus.DRAFT;
  }

  /**
   * Check if payroll deadline has passed
   */
  isPayrollDeadlinePassed(payroll: GustoPayrollDetails): boolean {
    const deadline = new Date(payroll.payroll_deadline);
    return deadline < new Date();
  }

  /**
   * Get days until payroll deadline
   */
  getDaysUntilDeadline(payroll: GustoPayrollDetails): number {
    const deadline = new Date(payroll.payroll_deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Format payroll amount
   */
  formatAmount(amount: string): string {
    return `$${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Calculate pay period length in days
   */
  calculatePayPeriodLength(payPeriod: GustoPayPeriod): number {
    const start = new Date(payPeriod.start_date);
    const end = new Date(payPeriod.end_date);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
  }

  /**
   * Validate payroll can be edited
   */
  validatePayrollCanBeEdited(payroll: GustoPayrollDetails): void {
    if (payroll.processed) {
      throw new BadRequestException(
        'Cannot edit a processed payroll',
      );
    }

    if (this.isPayrollDeadlinePassed(payroll)) {
      throw new BadRequestException(
        'Cannot edit a payroll after the deadline has passed',
      );
    }
  }

  /**
   * Validate payroll can be submitted
   */
  validatePayrollCanBeSubmitted(payroll: GustoPayrollDetails): void {
    if (payroll.processed) {
      throw new BadRequestException(
        'Payroll has already been processed',
      );
    }

    if (!payroll.calculated_at) {
      throw new BadRequestException(
        'Payroll must be calculated before submission',
      );
    }

    if (!payroll.employee_compensations || payroll.employee_compensations.length === 0) {
      throw new BadRequestException(
        'Payroll must have at least one employee compensation',
      );
    }

    if (this.isPayrollDeadlinePassed(payroll)) {
      throw new BadRequestException(
        'Cannot submit a payroll after the deadline has passed',
      );
    }
  }
}
