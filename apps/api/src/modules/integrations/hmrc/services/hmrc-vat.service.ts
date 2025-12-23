import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { HmrcAuthService } from '../hmrc-auth.service';
import { VatCalculationService } from './vat-calculation.service';
import { HmrcFraudPreventionUtil } from '../utils/hmrc-fraud-prevention.util';
import { getHmrcEndpoints, HMRC_API_ENDPOINTS } from '../hmrc.config';
import {
  VATObligations,
  VATObligation,
  VATReturn,
  VATReturnResponse,
  VATLiabilities,
  VATLiability,
  VATPayments,
  VATPayment,
} from '../interfaces/hmrc.interface';
import {
  VatCalculationInput,
  VatCalculationResult,
} from '../interfaces/vat-calculation.interface';

/**
 * HMRC VAT Service
 *
 * Implements HMRC Making Tax Digital (MTD) VAT API operations.
 *
 * Features:
 * - Retrieve VAT obligations
 * - Submit VAT returns
 * - View VAT liabilities
 * - View VAT payments
 * - Calculate VAT from invoices/expenses
 *
 * All API calls include fraud prevention headers as required by HMRC.
 *
 * @see https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api
 */
@Injectable()
export class HmrcVatService {
  private readonly logger = new Logger(HmrcVatService.name);
  private readonly httpClient: AxiosInstance;
  private readonly endpoints: ReturnType<typeof getHmrcEndpoints>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly hmrcAuthService: HmrcAuthService,
    private readonly vatCalculationService: VatCalculationService,
  ) {
    const environment =
      configService.get<string>('HMRC_SANDBOX') === 'true'
        ? 'sandbox'
        : 'production';

    this.endpoints = getHmrcEndpoints(environment);

    this.httpClient = axios.create({
      baseURL: this.endpoints.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Accept': 'application/vnd.hmrc.1.0+json',
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`HMRC VAT Service initialized (${environment} environment)`);
  }

  /**
   * Get VAT obligations for a VRN
   *
   * Retrieves the VAT return obligations for a specific period.
   * Obligations show which periods require VAT returns and their due dates.
   *
   * @param orgId Organization ID
   * @param vrn VAT Registration Number
   * @param from Start date (YYYY-MM-DD)
   * @param to End date (YYYY-MM-DD)
   * @param status Optional filter by status ('O' = Open, 'F' = Fulfilled)
   */
  async getVatObligations(
    orgId: string,
    vrn: string,
    from: string,
    to: string,
    status?: 'O' | 'F',
  ): Promise<VATObligations> {
    this.logger.log(`Getting VAT obligations for VRN ${vrn}, period ${from} to ${to}`);

    try {
      // Get access token
      const tokens = await this.hmrcAuthService.getDecryptedTokens(orgId);

      // Build URL with query parameters
      const url = HMRC_API_ENDPOINTS.VAT_OBLIGATIONS.replace(':vrn', vrn);
      const params: any = { from, to };
      if (status) {
        params.status = status;
      }

      // Generate fraud prevention headers
      const fraudHeaders = HmrcFraudPreventionUtil.generateServerHeaders(
        vrn,
        orgId,
      );

      // Make API call
      const response = await this.httpClient.get<VATObligations>(url, {
        params,
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          ...fraudHeaders,
        },
      });

      this.logger.log(
        `Retrieved ${response.data.obligations?.length || 0} VAT obligations`,
      );

      // Create audit log
      await this.createApiAuditLog(orgId, vrn, 'GET_OBLIGATIONS', url, true);

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get VAT obligations', error);
      await this.createApiAuditLog(
        orgId,
        vrn,
        'GET_OBLIGATIONS',
        HMRC_API_ENDPOINTS.VAT_OBLIGATIONS,
        false,
        error,
      );
      throw this.handleApiError(error);
    }
  }

  /**
   * Get VAT liabilities
   *
   * Retrieves outstanding VAT liabilities (amounts owed to HMRC).
   *
   * @param orgId Organization ID
   * @param vrn VAT Registration Number
   * @param from Start date (YYYY-MM-DD)
   * @param to End date (YYYY-MM-DD)
   */
  async getVatLiabilities(
    orgId: string,
    vrn: string,
    from: string,
    to: string,
  ): Promise<VATLiabilities> {
    this.logger.log(`Getting VAT liabilities for VRN ${vrn}, period ${from} to ${to}`);

    try {
      const tokens = await this.hmrcAuthService.getDecryptedTokens(orgId);

      const url = HMRC_API_ENDPOINTS.VAT_LIABILITIES.replace(':vrn', vrn);
      const params = { from, to };

      const fraudHeaders = HmrcFraudPreventionUtil.generateServerHeaders(
        vrn,
        orgId,
      );

      const response = await this.httpClient.get<VATLiabilities>(url, {
        params,
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          ...fraudHeaders,
        },
      });

      this.logger.log(
        `Retrieved ${response.data.liabilities?.length || 0} VAT liabilities`,
      );

      await this.createApiAuditLog(orgId, vrn, 'GET_LIABILITIES', url, true);

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get VAT liabilities', error);
      await this.createApiAuditLog(
        orgId,
        vrn,
        'GET_LIABILITIES',
        HMRC_API_ENDPOINTS.VAT_LIABILITIES,
        false,
        error,
      );
      throw this.handleApiError(error);
    }
  }

  /**
   * Get VAT payments
   *
   * Retrieves VAT payment history.
   *
   * @param orgId Organization ID
   * @param vrn VAT Registration Number
   * @param from Start date (YYYY-MM-DD)
   * @param to End date (YYYY-MM-DD)
   */
  async getVatPayments(
    orgId: string,
    vrn: string,
    from: string,
    to: string,
  ): Promise<VATPayments> {
    this.logger.log(`Getting VAT payments for VRN ${vrn}, period ${from} to ${to}`);

    try {
      const tokens = await this.hmrcAuthService.getDecryptedTokens(orgId);

      const url = HMRC_API_ENDPOINTS.VAT_PAYMENTS.replace(':vrn', vrn);
      const params = { from, to };

      const fraudHeaders = HmrcFraudPreventionUtil.generateServerHeaders(
        vrn,
        orgId,
      );

      const response = await this.httpClient.get<VATPayments>(url, {
        params,
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          ...fraudHeaders,
        },
      });

      this.logger.log(
        `Retrieved ${response.data.payments?.length || 0} VAT payments`,
      );

      await this.createApiAuditLog(orgId, vrn, 'GET_PAYMENTS', url, true);

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get VAT payments', error);
      await this.createApiAuditLog(
        orgId,
        vrn,
        'GET_PAYMENTS',
        HMRC_API_ENDPOINTS.VAT_PAYMENTS,
        false,
        error,
      );
      throw this.handleApiError(error);
    }
  }

  /**
   * Submit VAT return to HMRC
   *
   * Submits a VAT return for a specific period.
   * The period must have an open obligation.
   *
   * IMPORTANT: This is a real submission to HMRC and cannot be undone.
   * Use sandbox environment for testing.
   *
   * @param orgId Organization ID
   * @param vrn VAT Registration Number
   * @param periodKey Period key from obligations
   * @param vatReturn VAT return data (9 boxes)
   */
  async submitVatReturn(
    orgId: string,
    vrn: string,
    periodKey: string,
    vatReturn: VATReturn,
  ): Promise<VATReturnResponse> {
    this.logger.log(
      `Submitting VAT return for VRN ${vrn}, period key ${periodKey}`,
    );

    try {
      // Validate VAT return
      this.validateVatReturn(vatReturn);

      // Check if already submitted
      const existingReturn = await this.prisma.hmrcVatReturn.findFirst({
        where: {
          orgId,
          vrn,
          periodKey,
          status: { in: ['SUBMITTED', 'ACCEPTED'] },
        },
      });

      if (existingReturn) {
        throw new BadRequestException(
          `VAT return for period ${periodKey} has already been submitted`,
        );
      }

      // Get access token
      const tokens = await this.hmrcAuthService.getDecryptedTokens(orgId);

      // Get connection for audit
      const connection = await this.prisma.hmrcConnection.findFirst({
        where: { orgId, vrn },
      });

      if (!connection) {
        throw new NotFoundException('HMRC connection not found');
      }

      // Build URL
      const url = HMRC_API_ENDPOINTS.VAT_RETURNS.replace(':vrn', vrn);

      // Generate fraud prevention headers
      const fraudHeaders = HmrcFraudPreventionUtil.generateServerHeaders(
        vrn,
        orgId,
      );

      // Submit to HMRC
      const response = await this.httpClient.post<VATReturnResponse>(
        url,
        vatReturn,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            ...fraudHeaders,
          },
        },
      );

      this.logger.log(
        `VAT return submitted successfully. Receipt ID: ${response.data.formBundleNumber}`,
      );

      // Store VAT return in database
      await this.prisma.hmrcVatReturn.create({
        data: {
          orgId,
          connectionId: connection.id,
          vrn,
          periodKey,
          periodFrom: new Date(vatReturn.periodKey.substring(0, 10)), // Extract from period key or pass separately
          periodTo: new Date(),
          dueDate: new Date(),
          box1VatDueSales: vatReturn.vatDueSales,
          box2VatDueAcquisitions: vatReturn.vatDueAcquisitions,
          box3TotalVatDue: vatReturn.totalVatDue,
          box4VatReclaimed: vatReturn.vatReclaimedCurrPeriod,
          box5NetVatDue: vatReturn.netVatDue,
          box6TotalValueSalesExVat: vatReturn.totalValueSalesExVAT,
          box7TotalValuePurchasesExVat: vatReturn.totalValuePurchasesExVAT,
          box8TotalValueGoodsSupplied: vatReturn.totalValueGoodsSuppliedExVAT,
          box9TotalAcquisitionsExVat: vatReturn.totalAcquisitionsExVAT,
          status: 'SUBMITTED',
          finalised: vatReturn.finalised,
          submittedAt: new Date(),
          hmrcProcessingDate: response.data.processingDate,
          hmrcReceiptId: response.data.formBundleNumber,
          hmrcChargeRefNumber: response.data.chargeRefNumber,
        },
      });

      // Create audit log
      await this.createApiAuditLog(orgId, vrn, 'SUBMIT_VAT_RETURN', url, true, null, {
        periodKey,
        receiptId: response.data.formBundleNumber,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to submit VAT return', error);
      await this.createApiAuditLog(
        orgId,
        vrn,
        'SUBMIT_VAT_RETURN',
        HMRC_API_ENDPOINTS.VAT_RETURNS,
        false,
        error,
        { periodKey },
      );
      throw this.handleApiError(error);
    }
  }

  /**
   * Calculate VAT return from invoices and expenses
   *
   * Automatically calculates VAT return boxes from transaction data.
   *
   * @param input Calculation input parameters
   */
  async calculateVatReturn(
    input: VatCalculationInput,
  ): Promise<VatCalculationResult> {
    this.logger.log(
      `Calculating VAT return for org ${input.orgId}, period ${input.periodFrom} to ${input.periodTo}`,
    );

    const result = await this.vatCalculationService.calculateVatReturn(input);

    // Validate the calculation
    const validation = this.vatCalculationService.validateVatReturn(result);
    if (!validation.valid) {
      this.logger.error('VAT calculation validation failed', validation.errors);
      throw new BadRequestException({
        message: 'VAT calculation validation failed',
        errors: validation.errors,
      });
    }

    return result;
  }

  /**
   * Create or update draft VAT return
   *
   * Saves a draft VAT return without submitting to HMRC.
   */
  async saveDraftVatReturn(
    orgId: string,
    vrn: string,
    periodKey: string,
    calculationResult: VatCalculationResult,
  ): Promise<any> {
    this.logger.log(`Saving draft VAT return for period ${periodKey}`);

    // Get connection
    const connection = await this.prisma.hmrcConnection.findFirst({
      where: { orgId, vrn },
    });

    if (!connection) {
      throw new NotFoundException('HMRC connection not found');
    }

    // Find obligation to get period dates
    const obligations = await this.getVatObligations(
      orgId,
      vrn,
      calculationResult.periodFrom.toISOString().split('T')[0],
      calculationResult.periodTo.toISOString().split('T')[0],
    );

    const obligation = obligations.obligations.find(
      (o) => o.periodKey === periodKey,
    );

    if (!obligation) {
      throw new NotFoundException(`No obligation found for period key ${periodKey}`);
    }

    // Upsert draft return
    const draftReturn = await this.prisma.hmrcVatReturn.upsert({
      where: {
        connectionId_periodKey: {
          connectionId: connection.id,
          periodKey,
        },
      },
      create: {
        orgId,
        connectionId: connection.id,
        vrn,
        periodKey,
        periodFrom: new Date(obligation.start),
        periodTo: new Date(obligation.end),
        dueDate: new Date(obligation.due),
        box1VatDueSales: calculationResult.box1VatDueSales,
        box2VatDueAcquisitions: calculationResult.box2VatDueAcquisitions,
        box3TotalVatDue: calculationResult.box3TotalVatDue,
        box4VatReclaimed: calculationResult.box4VatReclaimed,
        box5NetVatDue: calculationResult.box5NetVatDue,
        box6TotalValueSalesExVat: calculationResult.box6TotalValueSalesExVat,
        box7TotalValuePurchasesExVat: calculationResult.box7TotalValuePurchasesExVat,
        box8TotalValueGoodsSupplied: calculationResult.box8TotalValueGoodsSupplied,
        box9TotalAcquisitionsExVat: calculationResult.box9TotalAcquisitionsExVat,
        status: 'DRAFT',
        finalised: false,
        calculatedFrom: calculationResult.breakdown,
        metadata: calculationResult.metadata,
      },
      update: {
        box1VatDueSales: calculationResult.box1VatDueSales,
        box2VatDueAcquisitions: calculationResult.box2VatDueAcquisitions,
        box3TotalVatDue: calculationResult.box3TotalVatDue,
        box4VatReclaimed: calculationResult.box4VatReclaimed,
        box5NetVatDue: calculationResult.box5NetVatDue,
        box6TotalValueSalesExVat: calculationResult.box6TotalValueSalesExVat,
        box7TotalValuePurchasesExVat: calculationResult.box7TotalValuePurchasesExVat,
        box8TotalValueGoodsSupplied: calculationResult.box8TotalValueGoodsSupplied,
        box9TotalAcquisitionsExVat: calculationResult.box9TotalAcquisitionsExVat,
        calculatedFrom: calculationResult.breakdown,
        metadata: calculationResult.metadata,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Draft VAT return saved: ${draftReturn.id}`);

    return draftReturn;
  }

  /**
   * Validate VAT return data
   */
  private validateVatReturn(vatReturn: VATReturn): void {
    const errors: string[] = [];

    // Box 3 must equal Box 1 + Box 2
    if (vatReturn.totalVatDue !== vatReturn.vatDueSales + vatReturn.vatDueAcquisitions) {
      errors.push('Box 3 (Total VAT Due) must equal Box 1 + Box 2');
    }

    // Box 5 must equal Box 3 - Box 4
    if (
      vatReturn.netVatDue !==
      vatReturn.totalVatDue - vatReturn.vatReclaimedCurrPeriod
    ) {
      errors.push('Box 5 (Net VAT) must equal Box 3 - Box 4');
    }

    // All amounts must be whole numbers (pence)
    const amounts = [
      vatReturn.vatDueSales,
      vatReturn.vatDueAcquisitions,
      vatReturn.totalVatDue,
      vatReturn.vatReclaimedCurrPeriod,
      vatReturn.netVatDue,
      vatReturn.totalValueSalesExVAT,
      vatReturn.totalValuePurchasesExVAT,
      vatReturn.totalValueGoodsSuppliedExVAT,
      vatReturn.totalAcquisitionsExVAT,
    ];

    for (const amount of amounts) {
      if (!Number.isInteger(amount)) {
        errors.push('All amounts must be whole numbers (pence)');
        break;
      }
    }

    // Must be finalised
    if (!vatReturn.finalised) {
      errors.push('VAT return must be finalised before submission');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'VAT return validation failed',
        errors,
      });
    }
  }

  /**
   * Create API audit log
   */
  private async createApiAuditLog(
    orgId: string,
    vrn: string,
    action: string,
    endpoint: string,
    success: boolean,
    error?: any,
    metadata?: any,
  ): Promise<void> {
    try {
      const connection = await this.prisma.hmrcConnection.findFirst({
        where: { orgId, vrn },
      });

      if (!connection) return;

      await this.prisma.hmrcAuditLog.create({
        data: {
          connectionId: connection.id,
          action,
          endpoint,
          success,
          statusCode: error?.response?.status,
          errorMessage: error?.response?.data?.message || error?.message,
          metadata: metadata || {},
        },
      });
    } catch (auditError) {
      this.logger.error('Failed to create audit log', auditError);
      // Don't throw - audit logging is non-critical
    }
  }

  /**
   * Handle HMRC API errors
   */
  private handleApiError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data: any = axiosError.response.data;

        switch (status) {
          case 401:
            return new UnauthorizedException(
              data?.message || 'Invalid or expired access token',
            );
          case 403:
            return new BadRequestException(
              data?.message || 'Access forbidden - check VRN and permissions',
            );
          case 404:
            return new NotFoundException(
              data?.message || 'Resource not found',
            );
          case 400:
            return new BadRequestException(
              data?.message || 'Invalid request',
            );
          case 409:
            return new BadRequestException(
              data?.message || 'Duplicate submission',
            );
          case 503:
            return new InternalServerErrorException(
              'HMRC service temporarily unavailable',
            );
          default:
            return new InternalServerErrorException(
              data?.message || 'HMRC API error',
            );
        }
      }

      if (axiosError.code === 'ECONNABORTED') {
        return new InternalServerErrorException('Request timeout');
      }
    }

    return new InternalServerErrorException('Failed to communicate with HMRC');
  }
}
