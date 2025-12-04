import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  StpPayEventSubmission,
  StpUpdateEventSubmission,
  StpFinalisationEvent,
  StpFilingResponse,
  AtoFilingStatus,
  AtoApiResponse,
  AtoError,
  AtoTokenResponse,
  StpPayEvent,
} from './ato.types';
import {
  ATO_API_URLS,
  ATO_ENDPOINTS,
  ATO_ERROR_CODES,
  ATO_ERROR_MESSAGES,
  ATO_TLS_CONFIG,
  STP_VALIDATION,
  STP_EMPLOYMENT_TYPES,
  STP_TAX_TREATMENT,
} from './ato.constants';
import { AtoAuthService } from './ato-auth.service';

/**
 * ATO Single Touch Payroll (STP) Phase 2 Client
 *
 * Handles real-time payroll reporting to the ATO
 * Complies with STP Phase 2 requirements
 *
 * @see https://www.ato.gov.au/business/single-touch-payroll/
 */
@Injectable()
export class AtoStpClient {
  private readonly logger = new Logger(AtoStpClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AtoAuthService,
  ) {
    const environment = this.configService.get<string>('ATO_ENVIRONMENT', 'sandbox');
    this.baseUrl =
      environment === 'production'
        ? ATO_API_URLS.PRODUCTION
        : ATO_API_URLS.SANDBOX;

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      httpsAgent: {
        minVersion: ATO_TLS_CONFIG.MIN_VERSION,
        ciphers: ATO_TLS_CONFIG.CIPHERS,
      },
      timeout: 120000, // 2 minutes for large payroll submissions
    });

    this.logger.log(`ATO STP Client initialized (${environment})`);
  }

  /**
   * Submit STP Pay Event
   *
   * Report employee payments to ATO in real-time (must be submitted on or before payment date)
   */
  async submitPayEvent(
    submission: StpPayEventSubmission,
    token: AtoTokenResponse,
  ): Promise<StpFilingResponse> {
    this.logger.log(
      `Submitting STP Pay Event for ABN ${submission.abn} with ${submission.employees.length} employees`,
    );

    try {
      // Validate pay event
      this.validatePayEvent(submission);

      // Prepare payload
      const payload = this.preparePayEventPayload(submission);

      // Submit to ATO
      const response = await this.httpClient.post<AtoApiResponse>(
        ATO_ENDPOINTS.STP_PAY_EVENT,
        payload,
        {
          headers: this.buildHeaders(token),
        },
      );

      const filingResponse: StpFilingResponse = {
        filingId: response.data.data?.filingId || this.generateFilingId('PAY'),
        status: response.data.success
          ? AtoFilingStatus.SUBMITTED
          : AtoFilingStatus.REJECTED,
        submittedAt: new Date(),
        receiptNumber: response.data.data?.receiptNumber,
        processedEmployees: submission.employees.length,
        errors: response.data.errors,
        warnings: response.data.warnings,
      };

      this.logger.log(
        `Pay Event submitted successfully. Filing ID: ${filingResponse.filingId}`,
      );

      return filingResponse;
    } catch (error) {
      this.logger.error('Pay Event submission failed', error);
      throw this.handleStpError(error);
    }
  }

  /**
   * Submit STP Update Event
   *
   * Correct previously submitted pay information
   */
  async submitUpdateEvent(
    submission: StpUpdateEventSubmission,
    token: AtoTokenResponse,
  ): Promise<StpFilingResponse> {
    this.logger.log(
      `Submitting STP Update Event for ABN ${submission.abn} with ${submission.updates.length} corrections`,
    );

    try {
      // Validate update event
      this.validateUpdateEvent(submission);

      // Prepare payload
      const payload = this.prepareUpdateEventPayload(submission);

      // Submit to ATO
      const response = await this.httpClient.post<AtoApiResponse>(
        ATO_ENDPOINTS.STP_UPDATE_EVENT,
        payload,
        {
          headers: this.buildHeaders(token),
        },
      );

      const filingResponse: StpFilingResponse = {
        filingId: response.data.data?.filingId || this.generateFilingId('UPD'),
        status: response.data.success
          ? AtoFilingStatus.SUBMITTED
          : AtoFilingStatus.REJECTED,
        submittedAt: new Date(),
        receiptNumber: response.data.data?.receiptNumber,
        processedEmployees: submission.updates.length,
        errors: response.data.errors,
        warnings: response.data.warnings,
      };

      this.logger.log(
        `Update Event submitted successfully. Filing ID: ${filingResponse.filingId}`,
      );

      return filingResponse;
    } catch (error) {
      this.logger.error('Update Event submission failed', error);
      throw this.handleStpError(error);
    }
  }

  /**
   * Submit STP Finalisation Event
   *
   * Finalise employee income statements for the financial year
   * Must be submitted by 14 July following the end of the financial year
   */
  async submitFinalisation(
    event: StpFinalisationEvent,
    token: AtoTokenResponse,
  ): Promise<StpFilingResponse> {
    this.logger.log(
      `Submitting STP Finalisation for ABN ${event.abn}, FY ${event.financialYear}`,
    );

    try {
      // Validate finalisation event
      this.validateFinalisationEvent(event);

      // Prepare payload
      const payload = this.prepareFinalisationPayload(event);

      // Submit to ATO
      const response = await this.httpClient.post<AtoApiResponse>(
        ATO_ENDPOINTS.STP_FINALISATION,
        payload,
        {
          headers: this.buildHeaders(token),
        },
      );

      const filingResponse: StpFilingResponse = {
        filingId: response.data.data?.filingId || this.generateFilingId('FIN'),
        status: response.data.success
          ? AtoFilingStatus.SUBMITTED
          : AtoFilingStatus.REJECTED,
        submittedAt: new Date(),
        receiptNumber: response.data.data?.receiptNumber,
        processedEmployees: event.employees.length,
        errors: response.data.errors,
        warnings: response.data.warnings,
      };

      this.logger.log(
        `Finalisation submitted successfully. Filing ID: ${filingResponse.filingId}`,
      );

      return filingResponse;
    } catch (error) {
      this.logger.error('Finalisation submission failed', error);
      throw this.handleStpError(error);
    }
  }

  /**
   * Validate Pay Event before submission
   */
  private validatePayEvent(submission: StpPayEventSubmission): void {
    const errors: AtoError[] = [];

    // Validate ABN
    if (!this.isValidAbn(submission.abn)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_ABN,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_ABN],
        field: 'abn',
      });
    }

    // Validate employee count
    if (submission.employees.length > STP_VALIDATION.MAX_EMPLOYEES_PER_EVENT) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_STP_DATA,
        message: `Maximum ${STP_VALIDATION.MAX_EMPLOYEES_PER_EVENT} employees per event`,
        field: 'employees',
      });
    }

    // Validate each employee
    submission.employees.forEach((employee, index) => {
      const employeeErrors = this.validateEmployee(employee, index);
      errors.push(...employeeErrors);
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        code: ATO_ERROR_CODES.INVALID_STP_DATA,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_STP_DATA],
        errors,
      });
    }
  }

  /**
   * Validate individual employee data
   */
  private validateEmployee(employee: StpPayEvent, index: number): AtoError[] {
    const errors: AtoError[] = [];

    // Validate TFN format if provided
    if (employee.employee.tfn && !this.isValidTfn(employee.employee.tfn)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_TFN,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_TFN],
        field: `employees[${index}].employee.tfn`,
      });
    }

    // Validate gross amount
    if (
      employee.income.gross < STP_VALIDATION.MIN_GROSS_AMOUNT ||
      employee.income.gross > STP_VALIDATION.MAX_GROSS_AMOUNT
    ) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_STP_DATA,
        message: 'Gross amount out of valid range',
        field: `employees[${index}].income.gross`,
      });
    }

    // Validate PAYG withholding doesn't exceed gross
    if (employee.income.paygWithholding > employee.income.gross) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_STP_DATA,
        message: 'PAYG withholding cannot exceed gross amount',
        field: `employees[${index}].income.paygWithholding`,
      });
    }

    // Validate employment type
    if (!Object.keys(STP_EMPLOYMENT_TYPES).includes(employee.employment.employmentType)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_STP_DATA,
        message: 'Invalid employment type',
        field: `employees[${index}].employment.employmentType`,
      });
    }

    // Validate tax treatment
    if (!Object.keys(STP_TAX_TREATMENT).includes(employee.employment.taxTreatment)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_STP_DATA,
        message: 'Invalid tax treatment code',
        field: `employees[${index}].employment.taxTreatment`,
      });
    }

    // Validate superannuation
    if (employee.superannuation) {
      employee.superannuation.forEach((super_, superIndex) => {
        if (!this.isValidAbn(super_.fund.abn)) {
          errors.push({
            code: ATO_ERROR_CODES.INVALID_ABN,
            message: 'Invalid super fund ABN',
            field: `employees[${index}].superannuation[${superIndex}].fund.abn`,
          });
        }
      });
    }

    return errors;
  }

  /**
   * Validate Update Event
   */
  private validateUpdateEvent(submission: StpUpdateEventSubmission): void {
    const errors: AtoError[] = [];

    if (!this.isValidAbn(submission.abn)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_ABN,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_ABN],
        field: 'abn',
      });
    }

    if (submission.updates.length === 0) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_STP_DATA,
        message: 'At least one update is required',
        field: 'updates',
      });
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        code: ATO_ERROR_CODES.INVALID_STP_DATA,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_STP_DATA],
        errors,
      });
    }
  }

  /**
   * Validate Finalisation Event
   */
  private validateFinalisationEvent(event: StpFinalisationEvent): void {
    const errors: AtoError[] = [];

    if (!this.isValidAbn(event.abn)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_ABN,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_ABN],
        field: 'abn',
      });
    }

    if (!this.isValidFinancialYear(event.financialYear)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_PERIOD,
        message: 'Invalid financial year format (expected YYYY-YYYY)',
        field: 'financialYear',
      });
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        code: ATO_ERROR_CODES.INVALID_STP_DATA,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_STP_DATA],
        errors,
      });
    }
  }

  /**
   * Prepare Pay Event payload
   */
  private preparePayEventPayload(submission: StpPayEventSubmission): any {
    return {
      abn: submission.abn,
      payPeriod: {
        startDate: submission.payPeriod.startDate.toISOString().split('T')[0],
        endDate: submission.payPeriod.endDate.toISOString().split('T')[0],
      },
      employees: submission.employees.map((employee) => ({
        employee: {
          tfn: employee.employee.tfn,
          employeeId: employee.employee.employeeId,
          name: {
            firstName: employee.employee.firstName,
            lastName: employee.employee.lastName,
          },
          dateOfBirth: employee.employee.dateOfBirth.toISOString().split('T')[0],
          gender: employee.employee.gender,
          address: employee.employee.address,
        },
        employment: {
          type: STP_EMPLOYMENT_TYPES[employee.employment.employmentType],
          startDate: employee.employment.startDate.toISOString().split('T')[0],
          endDate: employee.employment.endDate?.toISOString().split('T')[0],
          payrollId: employee.employment.payrollId,
          taxTreatment: STP_TAX_TREATMENT[employee.employment.taxTreatment],
          tfnProvided: employee.employment.taxFileNumberProvided,
          claimsTaxFreeThreshold: employee.employment.claimsTaxFreeThreshold,
          hasHelpDebt: employee.employment.hasHelpDebt,
          hasSfssDebt: employee.employment.hasSfssDebt,
        },
        payPeriod: {
          startDate: employee.payPeriod.startDate.toISOString().split('T')[0],
          endDate: employee.payPeriod.endDate.toISOString().split('T')[0],
          paymentDate: employee.payPeriod.paymentDate.toISOString().split('T')[0],
        },
        income: employee.income,
        deductions: employee.deductions,
        superannuation: employee.superannuation?.map((super_) => ({
          fund: {
            abn: super_.fund.abn,
            name: super_.fund.name,
            usi: super_.fund.usi,
            memberNumber: super_.fund.memberNumber,
          },
          ordinaryTime: super_.ordinaryTime,
          superGuarantee: super_.superGuarantee,
          salary: super_.salary,
          personalContributions: super_.personalContributions,
        })),
        ytdValues: employee.ytdValues,
      })),
    };
  }

  /**
   * Prepare Update Event payload
   */
  private prepareUpdateEventPayload(submission: StpUpdateEventSubmission): any {
    return {
      abn: submission.abn,
      updates: submission.updates.map((update) => ({
        employee: {
          tfn: update.employee.tfn,
          employeeId: update.employee.employeeId,
        },
        originalPayPeriod: {
          startDate: update.originalPayPeriod.startDate.toISOString().split('T')[0],
          endDate: update.originalPayPeriod.endDate.toISOString().split('T')[0],
        },
        correctionReason: update.correctionReason,
        updatedFields: update.updatedFields,
      })),
    };
  }

  /**
   * Prepare Finalisation payload
   */
  private prepareFinalisationPayload(event: StpFinalisationEvent): any {
    return {
      abn: event.abn,
      financialYear: event.financialYear,
      employees: event.employees.map((employee) => ({
        tfn: employee.tfn,
        employeeId: employee.employeeId,
        finalised: employee.finalised,
        cessationDate: employee.cessationDate?.toISOString().split('T')[0],
        cessationReason: employee.cessationReason,
        employmentIncome: employee.employmentIncome,
        superannuation: employee.superannuation,
      })),
    };
  }

  /**
   * Build request headers
   */
  private buildHeaders(token: AtoTokenResponse): Record<string, string> {
    return {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
      'X-ATO-Client-ID': this.configService.get<string>('ATO_CLIENT_ID'),
      'X-ATO-Request-ID': this.generateRequestId(),
    };
  }

  /**
   * Validate ABN format
   */
  private isValidAbn(abn: string): boolean {
    const cleaned = abn.replace(/\s/g, '');
    return /^\d{11}$/.test(cleaned);
  }

  /**
   * Validate TFN format
   */
  private isValidTfn(tfn: string): boolean {
    const cleaned = tfn.replace(/\s/g, '');
    return /^\d{8,9}$/.test(cleaned);
  }

  /**
   * Validate financial year format (YYYY-YYYY)
   */
  private isValidFinancialYear(fy: string): boolean {
    const match = /^(\d{4})-(\d{4})$/.exec(fy);
    if (!match) return false;

    const year1 = parseInt(match[1], 10);
    const year2 = parseInt(match[2], 10);

    return year2 === year1 + 1;
  }

  /**
   * Generate filing ID
   */
  private generateFilingId(prefix: string): string {
    return `STP-${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `REQ-STP-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Handle STP errors
   */
  private handleStpError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 400) {
        return new BadRequestException({
          code: ATO_ERROR_CODES.INVALID_STP_DATA,
          message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_STP_DATA],
          details: data,
        });
      }

      if (status === 409) {
        return new BadRequestException({
          code: ATO_ERROR_CODES.DUPLICATE_SUBMISSION,
          message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.DUPLICATE_SUBMISSION],
          details: data,
        });
      }
    }

    return new Error(error.message || 'Unknown STP error');
  }
}
