import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  TparSubmission,
  TparFilingResponse,
  AtoFilingStatus,
  AtoApiResponse,
  AtoError,
  AtoTokenResponse,
  TparPayment,
} from './ato.types';
import {
  ATO_API_URLS,
  ATO_ENDPOINTS,
  ATO_ERROR_CODES,
  ATO_ERROR_MESSAGES,
  ATO_TLS_CONFIG,
} from './ato.constants';
import { AtoAuthService } from './ato-auth.service';

/**
 * ATO TPAR (Taxable Payments Annual Report) Service
 *
 * Handles reporting of payments to contractors for specific industries:
 * - Building and construction
 * - Cleaning
 * - Couriers and road freight
 * - Information technology (IT)
 * - Security, investigation or surveillance
 * - Government entities
 *
 * @see https://www.ato.gov.au/business/reports-and-returns/taxable-payments-annual-report/
 */
@Injectable()
export class AtoTparService {
  private readonly logger = new Logger(AtoTparService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  // Industry codes for TPAR
  private readonly VALID_INDUSTRY_CODES = [
    'BUILDING_CONSTRUCTION',
    'CLEANING',
    'COURIER_FREIGHT',
    'IT_SERVICES',
    'SECURITY_INVESTIGATION',
    'GOVERNMENT',
  ];

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
      timeout: 120000,
    });

    this.logger.log(`ATO TPAR Service initialized (${environment})`);
  }

  /**
   * Submit TPAR to ATO
   *
   * Must be lodged by 28 August following the end of the financial year
   */
  async submitTpar(
    submission: TparSubmission,
    token: AtoTokenResponse,
  ): Promise<TparFilingResponse> {
    this.logger.log(
      `Submitting TPAR for ABN ${submission.abn}, FY ${submission.financialYear} with ${submission.payments.length} contractors`,
    );

    try {
      // Validate TPAR data
      this.validateTpar(submission);

      // Prepare submission payload
      const payload = this.prepareTparPayload(submission);

      // Submit to ATO
      const response = await this.httpClient.post<AtoApiResponse>(
        ATO_ENDPOINTS.TPAR_SUBMIT,
        payload,
        {
          headers: this.buildHeaders(token),
        },
      );

      const filingResponse: TparFilingResponse = {
        filingId: response.data.data?.filingId || this.generateFilingId(),
        status: response.data.success
          ? AtoFilingStatus.SUBMITTED
          : AtoFilingStatus.REJECTED,
        submittedAt: new Date(),
        receiptNumber: response.data.data?.receiptNumber,
        processedPayments: submission.payments.length,
        errors: response.data.errors,
        warnings: response.data.warnings,
      };

      this.logger.log(
        `TPAR submitted successfully. Filing ID: ${filingResponse.filingId}`,
      );

      return filingResponse;
    } catch (error) {
      this.logger.error('TPAR submission failed', error);
      throw this.handleTparError(error);
    }
  }

  /**
   * Retrieve previously submitted TPAR
   */
  async retrieveTpar(
    abn: string,
    financialYear: string,
    token: AtoTokenResponse,
  ): Promise<TparSubmission | null> {
    this.logger.log(`Retrieving TPAR for ABN ${abn}, FY ${financialYear}`);

    try {
      const response = await this.httpClient.get<AtoApiResponse>(
        `${ATO_ENDPOINTS.TPAR_RETRIEVE}?abn=${abn}&financialYear=${financialYear}`,
        {
          headers: this.buildHeaders(token),
        },
      );

      if (!response.data.data) {
        return null;
      }

      return this.parseTparResponse(response.data.data);
    } catch (error) {
      this.logger.error('Failed to retrieve TPAR', error);
      throw this.handleTparError(error);
    }
  }

  /**
   * Validate TPAR before submission
   */
  private validateTpar(submission: TparSubmission): void {
    const errors: AtoError[] = [];

    // Validate ABN
    if (!this.isValidAbn(submission.abn)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_ABN,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_ABN],
        field: 'abn',
      });
    }

    // Validate financial year
    if (!this.isValidFinancialYear(submission.financialYear)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_PERIOD,
        message: 'Invalid financial year format (expected YYYY-YYYY)',
        field: 'financialYear',
      });
    }

    // Validate industry code
    if (!this.VALID_INDUSTRY_CODES.includes(submission.industryCode)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: `Invalid industry code. Must be one of: ${this.VALID_INDUSTRY_CODES.join(', ')}`,
        field: 'industryCode',
      });
    }

    // Validate payments
    if (submission.payments.length === 0) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'At least one contractor payment is required',
        field: 'payments',
      });
    }

    // Validate each payment
    submission.payments.forEach((payment, index) => {
      const paymentErrors = this.validatePayment(payment, index);
      errors.push(...paymentErrors);
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'TPAR validation failed',
        errors,
      });
    }
  }

  /**
   * Validate individual contractor payment
   */
  private validatePayment(payment: TparPayment, index: number): AtoError[] {
    const errors: AtoError[] = [];

    // Contractor must have either ABN or TFN
    if (!payment.abn && !payment.tfn) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'Contractor must have either ABN or TFN',
        field: `payments[${index}]`,
      });
    }

    // Validate ABN if provided
    if (payment.abn && !this.isValidAbn(payment.abn)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_ABN,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_ABN],
        field: `payments[${index}].abn`,
      });
    }

    // Validate TFN if provided
    if (payment.tfn && !this.isValidTfn(payment.tfn)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_TFN,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_TFN],
        field: `payments[${index}].tfn`,
      });
    }

    // Validate contractor name
    if (!payment.contractorName || payment.contractorName.trim().length === 0) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'Contractor name is required',
        field: `payments[${index}].contractorName`,
      });
    }

    // Validate address
    if (!payment.address) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'Contractor address is required',
        field: `payments[${index}].address`,
      });
    } else {
      // Validate address components
      if (!payment.address.line1 || payment.address.line1.trim().length === 0) {
        errors.push({
          code: ATO_ERROR_CODES.INVALID_BAS_DATA,
          message: 'Address line 1 is required',
          field: `payments[${index}].address.line1`,
        });
      }

      if (!payment.address.suburb || payment.address.suburb.trim().length === 0) {
        errors.push({
          code: ATO_ERROR_CODES.INVALID_BAS_DATA,
          message: 'Suburb is required',
          field: `payments[${index}].address.suburb`,
        });
      }

      if (!payment.address.state || !this.isValidState(payment.address.state)) {
        errors.push({
          code: ATO_ERROR_CODES.INVALID_BAS_DATA,
          message: 'Invalid state code',
          field: `payments[${index}].address.state`,
        });
      }

      if (!payment.address.postcode || !this.isValidPostcode(payment.address.postcode)) {
        errors.push({
          code: ATO_ERROR_CODES.INVALID_BAS_DATA,
          message: 'Invalid postcode',
          field: `payments[${index}].address.postcode`,
        });
      }
    }

    // Validate total payments
    if (payment.totalPayments <= 0) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'Total payments must be greater than zero',
        field: `payments[${index}].totalPayments`,
      });
    }

    // Validate GST included
    if (payment.gstIncluded < 0) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'GST included cannot be negative',
        field: `payments[${index}].gstIncluded`,
      });
    }

    // GST included should not exceed total payments
    if (payment.gstIncluded > payment.totalPayments) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'GST included cannot exceed total payments',
        field: `payments[${index}].gstIncluded`,
      });
    }

    return errors;
  }

  /**
   * Prepare TPAR submission payload
   */
  private prepareTparPayload(submission: TparSubmission): any {
    return {
      abn: submission.abn,
      financialYear: submission.financialYear,
      industryCode: submission.industryCode,
      payments: submission.payments.map((payment) => ({
        contractor: {
          abn: payment.abn,
          tfn: payment.tfn,
          name: payment.contractorName,
          address: {
            line1: payment.address.line1,
            line2: payment.address.line2,
            suburb: payment.address.suburb,
            state: payment.address.state,
            postcode: payment.address.postcode,
          },
        },
        totalPayments: payment.totalPayments,
        gstIncluded: payment.gstIncluded,
      })),
      declaration: {
        name: submission.declarationName,
        date: submission.declarationDate.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Parse TPAR response
   */
  private parseTparResponse(data: any): TparSubmission {
    return {
      abn: data.abn,
      financialYear: data.financialYear,
      industryCode: data.industryCode,
      payments: data.payments.map((payment: any) => ({
        abn: payment.contractor.abn,
        tfn: payment.contractor.tfn,
        contractorName: payment.contractor.name,
        address: payment.contractor.address,
        totalPayments: payment.totalPayments,
        gstIncluded: payment.gstIncluded,
      })),
      declarationName: data.declaration.name,
      declarationDate: new Date(data.declaration.date),
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
   * Validate Australian state code
   */
  private isValidState(state: string): boolean {
    const validStates = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
    return validStates.includes(state.toUpperCase());
  }

  /**
   * Validate Australian postcode
   */
  private isValidPostcode(postcode: string): boolean {
    return /^\d{4}$/.test(postcode);
  }

  /**
   * Generate filing ID
   */
  private generateFilingId(): string {
    return `TPAR-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `REQ-TPAR-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Handle TPAR errors
   */
  private handleTparError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 400) {
        return new BadRequestException({
          code: ATO_ERROR_CODES.INVALID_BAS_DATA,
          message: 'TPAR validation failed',
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

    return new Error(error.message || 'Unknown TPAR error');
  }

  /**
   * Calculate total payments summary
   */
  calculateTotalSummary(submission: TparSubmission): {
    totalPayments: number;
    totalGst: number;
    contractorCount: number;
  } {
    const summary = submission.payments.reduce(
      (acc, payment) => ({
        totalPayments: acc.totalPayments + payment.totalPayments,
        totalGst: acc.totalGst + payment.gstIncluded,
        contractorCount: acc.contractorCount + 1,
      }),
      { totalPayments: 0, totalGst: 0, contractorCount: 0 },
    );

    return summary;
  }

  /**
   * Check if business is required to lodge TPAR
   */
  isTPARRequired(industryCode: string, totalPayments: number): boolean {
    // TPAR is required if total payments to contractors exceed $75,000
    const threshold = 75000;

    return (
      this.VALID_INDUSTRY_CODES.includes(industryCode) &&
      totalPayments >= threshold
    );
  }
}
