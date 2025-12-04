import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  BusinessActivityStatement,
  BasFilingRequest,
  BasFilingResponse,
  AtoFilingStatus,
  AtoObligation,
  AtoApiResponse,
  AtoError,
  BasLabel,
  AtoTokenResponse,
} from './ato.types';
import {
  ATO_API_URLS,
  ATO_ENDPOINTS,
  ATO_ERROR_CODES,
  ATO_ERROR_MESSAGES,
  ATO_TLS_CONFIG,
  ATO_RETRY_CONFIG,
  BAS_VALIDATION,
  BAS_LABELS,
  BAS_PERIODS,
} from './ato.constants';
import { AtoAuthService } from './ato-auth.service';

/**
 * ATO BAS (Business Activity Statement) Service
 *
 * Handles BAS lodgement with the Australian Taxation Office
 * Supports GST, PAYG Withholding, PAYG Instalments, and FBT reporting
 *
 * @see https://www.ato.gov.au/business/business-activity-statements/
 */
@Injectable()
export class AtoBasService {
  private readonly logger = new Logger(AtoBasService.name);
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
      timeout: 60000,
    });

    this.logger.log(`ATO BAS Service initialized (${environment})`);
  }

  /**
   * Submit BAS to ATO
   */
  async submitBas(
    request: BasFilingRequest,
    token: AtoTokenResponse,
  ): Promise<BasFilingResponse> {
    this.logger.log(
      `Submitting BAS for ABN ${request.abn}, period ${request.statement.period}`,
    );

    try {
      // Validate BAS data
      this.validateBas(request.statement);

      // Calculate all BAS labels
      const labels = this.calculateBasLabels(request.statement);

      // Prepare submission payload
      const payload = this.prepareBasSubmission(request, labels);

      // Submit to ATO
      const response = await this.httpClient.post<AtoApiResponse>(
        ATO_ENDPOINTS.BAS_SUBMIT,
        payload,
        {
          headers: this.buildHeaders(token),
        },
      );

      const filingResponse: BasFilingResponse = {
        filingId: response.data.data?.filingId || this.generateFilingId(),
        status: response.data.success
          ? AtoFilingStatus.SUBMITTED
          : AtoFilingStatus.REJECTED,
        submittedAt: new Date(),
        receiptNumber: response.data.data?.receiptNumber,
        errors: response.data.errors,
        warnings: response.data.warnings,
      };

      this.logger.log(
        `BAS submitted successfully. Filing ID: ${filingResponse.filingId}`,
      );

      return filingResponse;
    } catch (error) {
      this.logger.error('BAS submission failed', error);
      throw this.handleBasError(error);
    }
  }

  /**
   * Get BAS obligations for an ABN
   */
  async getObligations(
    abn: string,
    token: AtoTokenResponse,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<AtoObligation[]> {
    this.logger.log(`Retrieving BAS obligations for ABN ${abn}`);

    try {
      const params = new URLSearchParams({
        abn,
        obligationType: 'BAS',
      });

      if (fromDate) {
        params.append('fromDate', fromDate.toISOString().split('T')[0]);
      }
      if (toDate) {
        params.append('toDate', toDate.toISOString().split('T')[0]);
      }

      const response = await this.httpClient.get<AtoApiResponse>(
        `${ATO_ENDPOINTS.BAS_OBLIGATIONS}?${params.toString()}`,
        {
          headers: this.buildHeaders(token),
        },
      );

      return response.data.data?.obligations || [];
    } catch (error) {
      this.logger.error('Failed to retrieve obligations', error);
      throw this.handleBasError(error);
    }
  }

  /**
   * Get pre-fill data from ATO
   */
  async getPrefillData(
    abn: string,
    period: string,
    token: AtoTokenResponse,
  ): Promise<Partial<BusinessActivityStatement>> {
    this.logger.log(`Retrieving pre-fill data for ABN ${abn}, period ${period}`);

    try {
      const response = await this.httpClient.get<AtoApiResponse>(
        `${ATO_ENDPOINTS.BAS_PREFILL}?abn=${abn}&period=${period}`,
        {
          headers: this.buildHeaders(token),
        },
      );

      return this.parsePrefillData(response.data.data);
    } catch (error) {
      this.logger.error('Failed to retrieve pre-fill data', error);
      throw this.handleBasError(error);
    }
  }

  /**
   * Retrieve previously submitted BAS
   */
  async retrieveBas(
    abn: string,
    period: string,
    token: AtoTokenResponse,
  ): Promise<BusinessActivityStatement | null> {
    this.logger.log(`Retrieving BAS for ABN ${abn}, period ${period}`);

    try {
      const response = await this.httpClient.get<AtoApiResponse>(
        `${ATO_ENDPOINTS.BAS_RETRIEVE}?abn=${abn}&period=${period}`,
        {
          headers: this.buildHeaders(token),
        },
      );

      if (!response.data.data) {
        return null;
      }

      return this.parseBasResponse(response.data.data);
    } catch (error) {
      this.logger.error('Failed to retrieve BAS', error);
      throw this.handleBasError(error);
    }
  }

  /**
   * Validate BAS data before submission
   */
  private validateBas(statement: BusinessActivityStatement): void {
    const errors: AtoError[] = [];

    // Validate ABN
    if (!this.isValidAbn(statement.abn)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_ABN,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_ABN],
        field: 'abn',
      });
    }

    // Validate period format
    if (!this.isValidPeriod(statement.period, statement.periodType)) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_PERIOD,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_PERIOD],
        field: 'period',
      });
    }

    // Validate GST calculations if present
    if (statement.gst) {
      const gstErrors = this.validateGstCalculation(statement.gst);
      errors.push(...gstErrors);
    }

    // Validate PAYG Withholding if present
    if (statement.paygWithholding) {
      const paygErrors = this.validatePaygWithholding(statement.paygWithholding);
      errors.push(...paygErrors);
    }

    // Validate amounts are within limits
    const amountErrors = this.validateAmounts(statement);
    errors.push(...amountErrors);

    if (errors.length > 0) {
      throw new BadRequestException({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_BAS_DATA],
        errors,
      });
    }
  }

  /**
   * Calculate all BAS labels from statement
   */
  private calculateBasLabels(
    statement: BusinessActivityStatement,
  ): BasLabel[] {
    const labels: BasLabel[] = [];

    // GST Labels
    if (statement.gst) {
      const gst = statement.gst;

      labels.push({ label: 'G1', amount: gst.g1TotalSales, description: BAS_LABELS.G1 });
      labels.push({ label: 'G2', amount: gst.g2ExportSales, description: BAS_LABELS.G2 });
      labels.push({ label: 'G3', amount: gst.g3OtherGstFreeSales, description: BAS_LABELS.G3 });
      labels.push({ label: 'G4', amount: gst.g4InputTaxedSales, description: BAS_LABELS.G4 });

      const g5 = gst.g2ExportSales + gst.g3OtherGstFreeSales + gst.g4InputTaxedSales;
      labels.push({ label: 'G5', amount: g5, description: BAS_LABELS.G5 });

      const g6 = gst.g1TotalSales - g5;
      labels.push({ label: 'G6', amount: g6, description: BAS_LABELS.G6 });

      if (gst.g7Adjustments) {
        labels.push({ label: 'G7', amount: gst.g7Adjustments, description: BAS_LABELS.G7 });
      }

      const g8 = g6 + (gst.g7Adjustments || 0);
      labels.push({ label: 'G8', amount: g8, description: BAS_LABELS.G8 });

      const g9 = this.roundAmount(g8 * 0.1);
      labels.push({ label: 'G9', amount: g9, description: BAS_LABELS.G9 });

      labels.push({ label: 'G10', amount: gst.g10CapitalPurchases, description: BAS_LABELS.G10 });
      labels.push({ label: 'G11', amount: gst.g11NonCapitalPurchases, description: BAS_LABELS.G11 });

      const g12 = gst.g10CapitalPurchases + gst.g11NonCapitalPurchases;
      labels.push({ label: 'G12', amount: g12, description: BAS_LABELS.G12 });

      const g13 = gst.g13InputTaxedPurchases || 0;
      const g14 = gst.g14PurchasesWithoutGst || 0;
      const g15 = gst.g15PrivatePurchases || 0;

      if (g13) labels.push({ label: 'G13', amount: g13, description: BAS_LABELS.G13 });
      if (g14) labels.push({ label: 'G14', amount: g14, description: BAS_LABELS.G14 });
      if (g15) labels.push({ label: 'G15', amount: g15, description: BAS_LABELS.G15 });

      const g16 = g13 + g14 + g15;
      if (g16) labels.push({ label: 'G16', amount: g16, description: BAS_LABELS.G16 });

      const g17 = g12 - g16;
      labels.push({ label: 'G17', amount: g17, description: BAS_LABELS.G17 });

      if (gst.g18Adjustments) {
        labels.push({ label: 'G18', amount: gst.g18Adjustments, description: BAS_LABELS.G18 });
      }

      const g19 = g17 + (gst.g18Adjustments || 0);
      labels.push({ label: 'G19', amount: g19, description: BAS_LABELS.G19 });

      const g20 = this.roundAmount(g19 * 0.1);
      labels.push({ label: 'G20', amount: g20, description: BAS_LABELS.G20 });

      const g21 = g9 - g20;
      labels.push({ label: 'G21', amount: g21, description: BAS_LABELS.G21 });
    }

    // PAYG Withholding Labels
    if (statement.paygWithholding) {
      const payg = statement.paygWithholding;
      labels.push({ label: 'W1', amount: payg.w1TotalPayments, description: BAS_LABELS.W1 });
      labels.push({ label: 'W2', amount: payg.w2WithheldFromPayments, description: BAS_LABELS.W2 });

      if (payg.w3WithheldNoAbn) {
        labels.push({ label: 'W3', amount: payg.w3WithheldNoAbn, description: BAS_LABELS.W3 });
      }
      if (payg.w4WithheldInvestmentIncome) {
        labels.push({ label: 'W4', amount: payg.w4WithheldInvestmentIncome, description: BAS_LABELS.W4 });
      }

      const w5 = payg.w2WithheldFromPayments + (payg.w3WithheldNoAbn || 0) + (payg.w4WithheldInvestmentIncome || 0);
      labels.push({ label: 'W5', amount: w5, description: BAS_LABELS.W5 });
    }

    // PAYG Instalments
    if (statement.paygInstalments) {
      const instalments = statement.paygInstalments;
      if (instalments.t1InstalmentIncome) {
        labels.push({ label: 'T1', amount: instalments.t1InstalmentIncome, description: BAS_LABELS.T1 });
      }
      if (instalments.t2VariedRate) {
        labels.push({ label: 'T2', amount: instalments.t2VariedRate, description: BAS_LABELS.T2 });
      }
      labels.push({ label: 'T4', amount: instalments.t4InstalmentAmount, description: BAS_LABELS.T4 });
    }

    // FBT
    if (statement.fbt) {
      const fbt = statement.fbt;
      if (fbt.f1InstalmentAmount) {
        labels.push({ label: 'F1', amount: fbt.f1InstalmentAmount, description: BAS_LABELS.F1 });
      }
      if (fbt.f2EstimatedLiability) {
        labels.push({ label: 'F2', amount: fbt.f2EstimatedLiability, description: BAS_LABELS.F2 });
      }
      if (fbt.f3VariedRate) {
        labels.push({ label: 'F3', amount: fbt.f3VariedRate, description: BAS_LABELS.F3 });
      }
    }

    // Additional labels
    if (statement.additionalLabels) {
      labels.push(...statement.additionalLabels);
    }

    return labels;
  }

  /**
   * Prepare BAS submission payload
   */
  private prepareBasSubmission(
    request: BasFilingRequest,
    labels: BasLabel[],
  ): any {
    return {
      abn: request.abn,
      period: request.statement.period,
      periodType: request.statement.periodType,
      isDraft: request.isDraft || false,
      labels: labels.map((label) => ({
        code: label.label,
        amount: label.amount,
      })),
      declaration: {
        name: request.statement.declarationName,
        date: request.statement.declarationDate.toISOString(),
      },
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
   * Validate GST calculation
   */
  private validateGstCalculation(gst: any): AtoError[] {
    const errors: AtoError[] = [];

    if (gst.g1TotalSales < 0) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'G1 Total Sales cannot be negative',
        field: 'gst.g1TotalSales',
      });
    }

    return errors;
  }

  /**
   * Validate PAYG Withholding
   */
  private validatePaygWithholding(payg: any): AtoError[] {
    const errors: AtoError[] = [];

    if (payg.w1TotalPayments < 0) {
      errors.push({
        code: ATO_ERROR_CODES.INVALID_BAS_DATA,
        message: 'W1 Total Payments cannot be negative',
        field: 'paygWithholding.w1TotalPayments',
      });
    }

    return errors;
  }

  /**
   * Validate all amounts
   */
  private validateAmounts(statement: BusinessActivityStatement): AtoError[] {
    const errors: AtoError[] = [];
    // Add amount validation logic
    return errors;
  }

  /**
   * Validate ABN format
   */
  private isValidAbn(abn: string): boolean {
    const cleaned = abn.replace(/\s/g, '');
    return /^\d{11}$/.test(cleaned);
  }

  /**
   * Validate period format
   */
  private isValidPeriod(period: string, periodType: string): boolean {
    if (periodType === BAS_PERIODS.MONTHLY) {
      return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
    }
    if (periodType === BAS_PERIODS.QUARTERLY) {
      return /^\d{4}-Q[1-4]$/.test(period);
    }
    if (periodType === BAS_PERIODS.ANNUAL) {
      return /^\d{4}$/.test(period);
    }
    return false;
  }

  /**
   * Round amount to 2 decimal places
   */
  private roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Parse pre-fill data
   */
  private parsePrefillData(data: any): Partial<BusinessActivityStatement> {
    // Implementation to parse ATO pre-fill response
    return {};
  }

  /**
   * Parse BAS response
   */
  private parseBasResponse(data: any): BusinessActivityStatement {
    // Implementation to parse retrieved BAS
    return {} as BusinessActivityStatement;
  }

  /**
   * Generate filing ID
   */
  private generateFilingId(): string {
    return `BAS-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Handle BAS errors
   */
  private handleBasError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 400) {
        return new BadRequestException({
          code: ATO_ERROR_CODES.INVALID_BAS_DATA,
          message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_BAS_DATA],
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

    return new Error(error.message || 'Unknown BAS error');
  }
}
