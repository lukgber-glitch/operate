import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ElsterCertificateService } from './elster-certificate.service';
import { firstValueFrom } from 'rxjs';
import {
  UStVAData,
  SubmitOptions,
  ElsterSubmissionResult,
  ElsterSubmissionStatus,
  TaxPeriod,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ElsterFiling,
  ElsterFilingStatus,
  HistoryOptions,
  VATFilingPeriod,
  ElsterVATError,
  ElsterVATErrorCode,
  VATCalculation,
  TigerVATRequest,
  TigerVATResponse,
} from '../types/elster-vat.types';

/**
 * ELSTER VAT Service
 *
 * Handles German VAT returns (UStVA - Umsatzsteuervoranmeldung) submission
 * to ELSTER via tigerVAT API integration.
 *
 * Features:
 * - Submit monthly/quarterly/annual VAT returns
 * - Calculate VAT from invoices and expenses
 * - Validate UStVA data before submission
 * - Track filing history and status
 * - Draft filing support
 *
 * @see https://www.elster.de
 * @see https://www.tigervat.de
 */
@Injectable()
export class ElsterVatService {
  private readonly logger = new Logger(ElsterVatService.name);
  private readonly tigerVATBaseUrl: string;
  private readonly tigerVATApiKey: string;
  private readonly tigerVATTestMode: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly certificateService: ElsterCertificateService,
  ) {
    this.tigerVATBaseUrl = this.config.get<string>('TIGERVAT_BASE_URL', 'https://api.tigervat.de/v1');
    this.tigerVATApiKey = this.config.get<string>('TIGERVAT_API_KEY', '');
    this.tigerVATTestMode = this.config.get<boolean>('TIGERVAT_TEST_MODE', false);
  }

  /**
   * Submit UStVA to ELSTER via tigerVAT
   */
  async submitUStVA(
    organisationId: string,
    data: UStVAData,
    options: SubmitOptions = {},
  ): Promise<ElsterSubmissionResult> {
    const {
      testMode = this.tigerVATTestMode,
      dryRun = false,
      autoCalculate = true,
    } = options;

    this.logger.log(
      `Submitting UStVA for organisation ${organisationId}, period: ${data.period.year}/${data.period.month || data.period.quarter}`,
    );

    try {
      // Auto-calculate if requested
      if (autoCalculate) {
        const calculated = await this.calculateVATFromInvoices(
          organisationId,
          data.period,
        );
        // Merge calculated values with provided data
        data = {
          ...data,
          domesticRevenue19: calculated.domesticRevenue19,
          domesticRevenue7: calculated.domesticRevenue7,
          taxFreeRevenue: calculated.taxFreeRevenue,
          euDeliveries: calculated.euDeliveries,
          inputTax: calculated.inputTax,
        };
      }

      // Calculate totals
      data = this.calculateTotals(data);

      // Validate data
      const validation = await this.validateUStVA(data);
      if (!validation.isValid) {
        throw new ElsterVATError(
          `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
          ElsterVATErrorCode.VALIDATION_FAILED,
          { errors: validation.errors },
        );
      }

      // Check for duplicate submission
      await this.checkDuplicateSubmission(organisationId, data.period);

      // If dry run, return validation result
      if (dryRun) {
        return {
          success: true,
          submissionId: 'dry-run',
          timestamp: new Date(),
          status: ElsterFilingStatus.DRAFT,
          warnings: validation.warnings.map((w) => w.message),
          data,
        };
      }

      // Get active certificate
      const certificates = await this.certificateService.listCertificates(
        organisationId,
      );
      if (certificates.length === 0) {
        throw new ElsterVATError(
          'No active ELSTER certificate found',
          ElsterVATErrorCode.CERTIFICATE_NOT_FOUND,
        );
      }
      const certificate = certificates[0]; // Use the first active certificate

      // Submit to tigerVAT
      const result = await this.submitToTigerVAT({
        organisationId,
        certificateId: certificate.id,
        data,
        testMode,
      });

      // Determine status
      const status = result.success
        ? ElsterFilingStatus.SUBMITTED
        : ElsterFilingStatus.ERROR;

      // Create filing record
      const filing = await this.prisma.elsterFiling.create({
        data: {
          organisationId,
          type: 'USTVA',
          year: data.period.year,
          period: data.period.month || data.period.quarter || 12,
          periodType: this.determinePeriodType(data.period),
          status,
          submissionId: result.transferTicket,
          transferTicket: result.transferTicket,
          submittedAt: result.success ? new Date() : null,
          data: data as any,
          response: result.rawResponse,
          errors: result.errors ? { errors: result.errors } : null,
          certificateId: certificate.id,
          createdBy: 'system', // TODO: Get from request context
        },
      });

      return {
        success: result.success,
        submissionId: filing.id,
        transferTicket: result.transferTicket,
        timestamp: new Date(),
        status,
        errors: result.errors,
        warnings: validation.warnings.map((w) => w.message),
        data,
      };
    } catch (error) {
      this.logger.error(`Failed to submit UStVA: ${error.message}`, error.stack);

      if (error instanceof ElsterVATError) {
        throw error;
      }

      throw new ElsterVATError(
        'Failed to submit VAT return',
        ElsterVATErrorCode.SUBMISSION_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Get submission status
   */
  async getSubmissionStatus(
    submissionId: string,
  ): Promise<ElsterSubmissionStatus> {
    this.logger.log(`Getting status for submission ${submissionId}`);

    const filing = await this.prisma.elsterFiling.findUnique({
      where: { id: submissionId },
    });

    if (!filing) {
      throw new ElsterVATError(
        'Submission not found',
        ElsterVATErrorCode.SUBMISSION_FAILED,
      );
    }

    // TODO: Poll tigerVAT API for status if status is SUBMITTED
    // For now, return stored status

    return {
      id: filing.id,
      status: filing.status as ElsterFilingStatus,
      submittedAt: filing.submittedAt,
      responseAt: filing.responseAt,
      transferTicket: filing.transferTicket,
      errors: filing.errors ? (filing.errors as any).errors : undefined,
      response: filing.response as any,
    };
  }

  /**
   * Calculate VAT amounts from invoices and expenses
   */
  async calculateVATFromInvoices(
    organisationId: string,
    period: TaxPeriod,
  ): Promise<VATCalculation> {
    this.logger.log(
      `Calculating VAT from invoices for org ${organisationId}, period ${period.year}/${period.month || period.quarter}`,
    );

    const { startDate, endDate } = this.getPeriodDates(period);

    // Fetch invoices for the period
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organisationId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['SENT', 'PAID', 'OVERDUE'],
        },
      },
      include: {
        items: true,
      },
    });

    // Fetch expenses for the period
    const expenses = await this.prisma.expense.findMany({
      where: {
        orgId: organisationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['APPROVED', 'REIMBURSED'],
        },
      },
    });

    // Calculate revenue by VAT rate
    let domesticRevenue19 = 0;
    let domesticRevenue7 = 0;
    let taxFreeRevenue = 0;
    let euDeliveries = 0;
    let euAcquisitions19 = 0;
    let euAcquisitions7 = 0;
    let reverseChargeRevenue = 0;

    for (const invoice of invoices) {
      const subtotalCents = Math.round(Number(invoice.subtotal) * 100);
      const vatRate = Number(invoice.vatRate || 0);

      if (invoice.reverseCharge) {
        reverseChargeRevenue += subtotalCents;
      } else if (vatRate === 19) {
        // Check if it's an EU delivery
        if (invoice.customerVatId && invoice.customerVatId.startsWith('DE') === false) {
          euDeliveries += subtotalCents;
        } else {
          domesticRevenue19 += subtotalCents;
        }
      } else if (vatRate === 7) {
        domesticRevenue7 += subtotalCents;
      } else if (vatRate === 0) {
        taxFreeRevenue += subtotalCents;
      }
    }

    // Calculate input tax from expenses
    let inputTax = 0;
    let importVat = 0;
    let euAcquisitionsInputTax = 0;

    for (const expense of expenses) {
      const vatAmountCents = Math.round(Number(expense.vatAmount || 0) * 100);

      if (expense.isDeductible && vatAmountCents > 0) {
        // TODO: Distinguish between domestic, import, and EU acquisition input tax
        // For now, treat all as domestic input tax
        inputTax += vatAmountCents;
      }
    }

    // Calculate output VAT
    const outputVat =
      Math.round(domesticRevenue19 * 0.19) +
      Math.round(domesticRevenue7 * 0.07) +
      Math.round(euAcquisitions19 * 0.19) +
      Math.round(euAcquisitions7 * 0.07);

    // Calculate total input tax
    const totalInputTax = inputTax + importVat + euAcquisitionsInputTax;

    // Calculate VAT payable (positive = payment due, negative = refund)
    const vatPayable = outputVat - totalInputTax;

    return {
      period,
      domesticRevenue19,
      domesticRevenue7,
      taxFreeRevenue,
      euDeliveries,
      euAcquisitions19,
      euAcquisitions7,
      reverseChargeRevenue,
      inputTax,
      importVat,
      euAcquisitionsInputTax,
      outputVat,
      totalInputTax,
      vatPayable,
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
    };
  }

  /**
   * Validate UStVA data before submission
   */
  async validateUStVA(data: UStVAData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate tax number format
    if (!data.taxNumber) {
      errors.push({
        field: 'taxNumber',
        message: 'Tax number is required',
        code: 'REQUIRED',
      });
    } else if (!/^\d{3}\/\d{3}\/\d{5}$/.test(data.taxNumber)) {
      errors.push({
        field: 'taxNumber',
        message: 'Invalid tax number format (expected: XXX/XXX/XXXXX)',
        code: 'INVALID_FORMAT',
      });
    }

    // Validate VAT ID if provided
    if (data.vatId && !/^DE\d{9}$/.test(data.vatId)) {
      errors.push({
        field: 'vatId',
        message: 'Invalid VAT ID format (expected: DE followed by 9 digits)',
        code: 'INVALID_FORMAT',
      });
    }

    // Validate period
    if (!data.period.year || data.period.year < 2000 || data.period.year > 2100) {
      errors.push({
        field: 'period.year',
        message: 'Invalid year',
        code: 'INVALID_YEAR',
      });
    }

    if (data.period.month && (data.period.month < 1 || data.period.month > 12)) {
      errors.push({
        field: 'period.month',
        message: 'Month must be between 1 and 12',
        code: 'INVALID_MONTH',
      });
    }

    if (data.period.quarter && (data.period.quarter < 1 || data.period.quarter > 4)) {
      errors.push({
        field: 'period.quarter',
        message: 'Quarter must be between 1 and 4',
        code: 'INVALID_QUARTER',
      });
    }

    if (!data.period.month && !data.period.quarter) {
      errors.push({
        field: 'period',
        message: 'Either month or quarter must be specified',
        code: 'REQUIRED',
      });
    }

    // Validate amounts (must be non-negative)
    const amountFields = [
      'domesticRevenue19',
      'domesticRevenue7',
      'taxFreeRevenue',
      'euDeliveries',
      'euAcquisitions19',
      'euAcquisitions7',
      'reverseChargeRevenue',
      'inputTax',
      'importVat',
      'euAcquisitionsInputTax',
    ];

    for (const field of amountFields) {
      const value = data[field];
      if (value < 0) {
        errors.push({
          field,
          message: `${field} cannot be negative`,
          code: 'INVALID_AMOUNT',
        });
      }
    }

    // Warning if VAT payable is very large
    if (data.vatPayable && Math.abs(data.vatPayable) > 100000000) {
      // > €1M
      warnings.push({
        field: 'vatPayable',
        message: 'VAT amount is unusually large (>€1,000,000)',
        code: 'LARGE_AMOUNT',
      });
    }

    // Warning if no revenue or input tax
    if (
      data.domesticRevenue19 === 0 &&
      data.domesticRevenue7 === 0 &&
      data.taxFreeRevenue === 0 &&
      data.euDeliveries === 0
    ) {
      warnings.push({
        field: 'revenue',
        message: 'No revenue reported for this period',
        code: 'NO_REVENUE',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get filing history
   */
  async getFilingHistory(
    organisationId: string,
    options: HistoryOptions = {},
  ): Promise<ElsterFiling[]> {
    const { year, periodType, status, limit = 50, offset = 0 } = options;

    const filings = await this.prisma.elsterFiling.findMany({
      where: {
        organisationId,
        type: 'USTVA',
        ...(year && { year }),
        ...(periodType && { periodType }),
        ...(status && { status }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return filings.map((f) => ({
      id: f.id,
      organisationId: f.organisationId,
      type: f.type,
      year: f.year,
      period: f.period,
      periodType: f.periodType as VATFilingPeriod,
      status: f.status as ElsterFilingStatus,
      submissionId: f.submissionId,
      submittedAt: f.submittedAt,
      responseAt: f.responseAt,
      data: f.data as any,
      response: f.response as any,
      errors: f.errors as any,
      certificateId: f.certificateId,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      createdBy: f.createdBy,
    }));
  }

  /**
   * Create draft filing (save without submit)
   */
  async createDraft(
    organisationId: string,
    data: UStVAData,
  ): Promise<ElsterFiling> {
    this.logger.log(
      `Creating draft filing for org ${organisationId}, period ${data.period.year}/${data.period.month || data.period.quarter}`,
    );

    // Calculate totals
    data = this.calculateTotals(data);

    // Validate
    const validation = await this.validateUStVA(data);
    if (!validation.isValid) {
      throw new ElsterVATError(
        `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
        ElsterVATErrorCode.VALIDATION_FAILED,
        { errors: validation.errors },
      );
    }

    const filing = await this.prisma.elsterFiling.create({
      data: {
        organisationId,
        type: 'USTVA',
        year: data.period.year,
        period: data.period.month || data.period.quarter || 12,
        periodType: this.determinePeriodType(data.period),
        status: ElsterFilingStatus.DRAFT,
        data: data as any,
        createdBy: 'system', // TODO: Get from request context
      },
    });

    return {
      id: filing.id,
      organisationId: filing.organisationId,
      type: filing.type,
      year: filing.year,
      period: filing.period,
      periodType: filing.periodType as VATFilingPeriod,
      status: filing.status as ElsterFilingStatus,
      data: filing.data as any,
      createdAt: filing.createdAt,
      updatedAt: filing.updatedAt,
      createdBy: filing.createdBy,
    };
  }

  /**
   * Test connection to tigerVAT
   */
  async testConnection(): Promise<boolean> {
    this.logger.log('Testing connection to tigerVAT API');

    try {
      // Simple health check endpoint
      const response = await firstValueFrom(
        this.http.get(`${this.tigerVATBaseUrl}/health`, {
          headers: {
            'Authorization': `Bearer ${this.tigerVATApiKey}`,
          },
          timeout: 5000,
        }),
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Submit to tigerVAT API
   */
  private async submitToTigerVAT(
    request: TigerVATRequest,
  ): Promise<TigerVATResponse> {
    this.logger.log('Submitting to tigerVAT API');

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.tigerVATBaseUrl}/vat/submit`,
          {
            organisationId: request.organisationId,
            certificateId: request.certificateId,
            data: request.data,
            testMode: request.testMode,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.tigerVATApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        ),
      );

      return {
        success: true,
        transferTicket: response.data.transferTicket,
        status: response.data.status || 'SUBMITTED',
        timestamp: new Date(),
        rawResponse: response.data,
      };
    } catch (error) {
      this.logger.error(`tigerVAT submission failed: ${error.message}`, error.stack);

      // Parse error response
      const errorData = error.response?.data;
      const errors = errorData?.errors || [error.message];

      return {
        success: false,
        status: 'ERROR',
        errors,
        timestamp: new Date(),
        rawResponse: errorData,
      };
    }
  }

  /**
   * Calculate totals for UStVA data
   */
  private calculateTotals(data: UStVAData): UStVAData {
    // Calculate output VAT
    const outputVat =
      Math.round(data.domesticRevenue19 * 0.19) +
      Math.round(data.domesticRevenue7 * 0.07) +
      Math.round(data.euAcquisitions19 * 0.19) +
      Math.round(data.euAcquisitions7 * 0.07);

    // Calculate total input tax
    const totalInputTax =
      data.inputTax + data.importVat + data.euAcquisitionsInputTax;

    // Calculate VAT payable
    const vatPayable = outputVat - totalInputTax;

    return {
      ...data,
      outputVat,
      totalInputTax,
      vatPayable,
    };
  }

  /**
   * Determine period type from period
   */
  private determinePeriodType(period: TaxPeriod): VATFilingPeriod {
    if (period.month) {
      return VATFilingPeriod.MONTHLY;
    } else if (period.quarter) {
      return VATFilingPeriod.QUARTERLY;
    } else {
      return VATFilingPeriod.ANNUAL;
    }
  }

  /**
   * Get start and end dates for a period
   */
  private getPeriodDates(period: TaxPeriod): {
    startDate: Date;
    endDate: Date;
  } {
    if (period.month) {
      // Monthly
      const startDate = new Date(period.year, period.month - 1, 1);
      const endDate = new Date(period.year, period.month, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    } else if (period.quarter) {
      // Quarterly
      const startMonth = (period.quarter - 1) * 3;
      const endMonth = startMonth + 3;
      const startDate = new Date(period.year, startMonth, 1);
      const endDate = new Date(period.year, endMonth, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    } else {
      // Annual
      const startDate = new Date(period.year, 0, 1);
      const endDate = new Date(period.year, 11, 31, 23, 59, 59, 999);
      return { startDate, endDate };
    }
  }

  /**
   * Check for duplicate submission
   */
  private async checkDuplicateSubmission(
    organisationId: string,
    period: TaxPeriod,
  ): Promise<void> {
    const existing = await this.prisma.elsterFiling.findFirst({
      where: {
        organisationId,
        type: 'USTVA',
        year: period.year,
        period: period.month || period.quarter || 12,
        status: {
          in: [
            ElsterFilingStatus.SUBMITTED,
            ElsterFilingStatus.ACCEPTED,
            ElsterFilingStatus.PENDING,
          ],
        },
      },
    });

    if (existing) {
      throw new ElsterVATError(
        `VAT return for period ${period.year}/${period.month || period.quarter} has already been submitted`,
        ElsterVATErrorCode.DUPLICATE_SUBMISSION,
        { filingId: existing.id },
      );
    }
  }
}
