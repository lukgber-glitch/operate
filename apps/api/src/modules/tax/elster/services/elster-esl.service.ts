import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ElsterCertificateService } from './elster-certificate.service';
import { firstValueFrom } from 'rxjs';
import {
  ZMData,
  ZMSubmitOptions,
  ZMSubmissionResult,
  ZMFilingStatus,
  ZMValidationResult,
  ZMCalculation,
  ZMFiling,
  ZMHistoryOptions,
  ZMTransaction,
  ZMTransactionType,
  VatIdValidation,
  TigerVATZMRequest,
  TigerVATZMResponse,
  VIESRequest,
  VIESResponse,
  ElsterESLError,
  ElsterESLErrorCode,
  isEUCountry,
} from '../types/elster-esl.types';
import { TaxPeriod } from '../types/elster-vat.types';

/**
 * ELSTER EC Sales List Service
 *
 * Handles EC Sales List (ZM - Zusammenfassende Meldung) submission
 * to ELSTER via tigerVAT API integration.
 *
 * Features:
 * - Submit monthly/quarterly EC Sales Lists
 * - Calculate ZM from invoices with intra-EU transactions
 * - Validate EU VAT IDs via VIES
 * - Track filing history and status
 * - Draft filing support
 * - Support for goods, services, and triangular transactions
 *
 * @see https://www.elster.de
 * @see https://www.tigervat.de
 * @see https://ec.europa.eu/taxation_customs/vies/
 */
@Injectable()
export class ElsterEslService {
  private readonly logger = new Logger(ElsterEslService.name);
  private readonly tigerVATBaseUrl: string;
  private readonly tigerVATApiKey: string;
  private readonly tigerVATTestMode: boolean;
  private readonly viesBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly certificateService: ElsterCertificateService,
  ) {
    this.tigerVATBaseUrl = this.config.get<string>(
      'TIGERVAT_BASE_URL',
      'https://api.tigervat.de/v1',
    );
    this.tigerVATApiKey = this.config.get<string>('TIGERVAT_API_KEY', '');
    this.tigerVATTestMode = this.config.get<boolean>(
      'TIGERVAT_TEST_MODE',
      false,
    );
    this.viesBaseUrl = this.config.get<string>(
      'VIES_BASE_URL',
      'https://ec.europa.eu/taxation_customs/vies/rest-api',
    );
  }

  /**
   * Submit ZM to ELSTER via tigerVAT
   */
  async submitZM(
    organisationId: string,
    data: ZMData,
    options: ZMSubmitOptions = {},
  ): Promise<ZMSubmissionResult> {
    const {
      testMode = this.tigerVATTestMode,
      dryRun = false,
      skipViesValidation = false,
      autoCalculate = true,
    } = options;

    this.logger.log(
      `Submitting ZM for organisation ${organisationId}, period: ${data.period.year}/${data.period.month || data.period.quarter}`,
    );

    try {
      // Auto-calculate if requested
      if (autoCalculate) {
        const calculated = await this.calculateFromInvoices(
          organisationId,
          data.period,
        );
        // Merge calculated transactions with provided data
        data = {
          ...data,
          transactions: calculated.transactions,
        };
      }

      // Validate data
      const validation = await this.validateZM(data, skipViesValidation);
      if (!validation.isValid) {
        throw new ElsterESLError(
          `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
          ElsterESLErrorCode.VALIDATION_FAILED,
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
          status: ZMFilingStatus.DRAFT,
          warnings: validation.warnings.map((w) => w.message),
          data,
          validationResults: validation.vatIdValidations,
        };
      }

      // Get active certificate
      const certificates = await this.certificateService.listCertificates(
        organisationId,
      );
      if (certificates.length === 0) {
        throw new ElsterESLError(
          'No active ELSTER certificate found',
          ElsterESLErrorCode.CERTIFICATE_NOT_FOUND,
        );
      }
      const certificate = certificates[0];

      // Submit to tigerVAT
      const result = await this.submitToTigerVAT({
        organisationId,
        certificateId: certificate.id,
        data,
        testMode,
      });

      // Determine status
      const status = result.success
        ? ZMFilingStatus.SUBMITTED
        : ZMFilingStatus.ERROR;

      // Create filing record
      const filing = await this.prisma.elsterFiling.create({
        data: {
          organisationId,
          type: 'ZM',
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
        validationResults: validation.vatIdValidations,
      };
    } catch (error) {
      this.logger.error(`Failed to submit ZM: ${error.message}`, error.stack);

      if (error instanceof ElsterESLError) {
        throw error;
      }

      throw new ElsterESLError(
        'Failed to submit EC Sales List',
        ElsterESLErrorCode.SUBMISSION_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Calculate ZM data from invoices
   */
  async calculateFromInvoices(
    organisationId: string,
    period: TaxPeriod,
  ): Promise<ZMCalculation> {
    this.logger.log(
      `Calculating ZM from invoices for org ${organisationId}, period ${period.year}/${period.month || period.quarter}`,
    );

    const { startDate, endDate } = this.getPeriodDates(period);

    // Fetch invoices with EU customers for the period
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
        // Must have a non-German EU VAT ID
        customerVatId: {
          not: null,
        },
      },
      include: {
        items: true,
      },
    });

    // Group transactions by customer VAT ID and transaction type
    const transactionMap = new Map<string, ZMTransaction>();
    const byCountry: Record<string, number> = {};
    const byType: Record<ZMTransactionType, number> = {
      [ZMTransactionType.GOODS]: 0,
      [ZMTransactionType.SERVICES]: 0,
      [ZMTransactionType.TRIANGULAR]: 0,
    };

    let totalAmount = 0;
    let invoiceCount = 0;

    for (const invoice of invoices) {
      const vatId = invoice.customerVatId?.toUpperCase().replace(/\s/g, '');
      if (!vatId) continue;

      // Skip if it's a German VAT ID (not an intra-EU transaction)
      if (vatId.startsWith('DE')) continue;

      // Extract country code
      const countryCode = vatId.substring(0, 2);

      // Validate it's an EU country
      if (!isEUCountry(countryCode)) {
        this.logger.warn(
          `Skipping invoice ${invoice.id}: ${countryCode} is not an EU country`,
        );
        continue;
      }

      // Determine transaction type
      const transactionType = this.determineTransactionType(invoice);

      // Amount in cents (subtotal without VAT)
      const amount = Math.round(Number(invoice.subtotal) * 100);

      // Create unique key for this customer + type
      const key = `${vatId}_${transactionType}`;

      // Accumulate amounts
      if (transactionMap.has(key)) {
        const existing = transactionMap.get(key)!;
        existing.amount += amount;
      } else {
        transactionMap.set(key, {
          customerVatId: vatId,
          countryCode,
          transactionType,
          amount,
        });
      }

      // Update statistics
      totalAmount += amount;
      invoiceCount++;

      byCountry[countryCode] = (byCountry[countryCode] || 0) + amount;
      byType[transactionType] = (byType[transactionType] || 0) + amount;
    }

    // Convert map to array
    const transactions = Array.from(transactionMap.values());

    // Get unique customer count
    const uniqueVatIds = new Set(
      transactions.map((t) => t.customerVatId),
    );

    return {
      period,
      transactions,
      totalAmount,
      customerCount: uniqueVatIds.size,
      invoiceCount,
      byCountry,
      byType,
    };
  }

  /**
   * Validate ZM data
   */
  async validateZM(
    data: ZMData,
    skipViesValidation = false,
  ): Promise<ZMValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> =
      [];
    let vatIdValidations: VatIdValidation[] | undefined;

    // Validate German VAT ID (required)
    if (!data.vatId) {
      errors.push({
        field: 'vatId',
        message: 'German VAT ID is required',
        code: 'REQUIRED',
      });
    } else if (!/^DE\d{9}$/.test(data.vatId)) {
      errors.push({
        field: 'vatId',
        message: 'Invalid German VAT ID format (expected: DE followed by 9 digits)',
        code: 'INVALID_FORMAT',
      });
    }

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

    // Validate transactions
    if (!data.transactions || data.transactions.length === 0) {
      if (data.isNilReturn) {
        warnings.push({
          field: 'transactions',
          message: 'Nil return: no transactions reported for this period',
          code: 'NIL_RETURN',
        });
      } else {
        errors.push({
          field: 'transactions',
          message: 'At least one transaction is required (or set isNilReturn: true)',
          code: 'NO_TRANSACTIONS',
        });
      }
    } else {
      // Validate each transaction
      const validatedVatIds: VatIdValidation[] = [];

      for (let i = 0; i < data.transactions.length; i++) {
        const tx = data.transactions[i];

        // Validate VAT ID format
        if (!tx.customerVatId) {
          errors.push({
            field: `transactions[${i}].customerVatId`,
            message: 'Customer VAT ID is required',
            code: 'REQUIRED',
          });
        } else if (tx.customerVatId.startsWith('DE')) {
          errors.push({
            field: `transactions[${i}].customerVatId`,
            message: 'Customer VAT ID must not be German (DE)',
            code: 'INVALID_VAT_ID',
          });
        } else if (!/^[A-Z]{2}[A-Z0-9]+$/.test(tx.customerVatId)) {
          errors.push({
            field: `transactions[${i}].customerVatId`,
            message: 'Invalid VAT ID format',
            code: 'INVALID_FORMAT',
          });
        }

        // Validate country code
        if (!tx.countryCode) {
          errors.push({
            field: `transactions[${i}].countryCode`,
            message: 'Country code is required',
            code: 'REQUIRED',
          });
        } else if (!isEUCountry(tx.countryCode)) {
          errors.push({
            field: `transactions[${i}].countryCode`,
            message: `${tx.countryCode} is not a valid EU country code`,
            code: 'INVALID_COUNTRY',
          });
        }

        // Validate amount
        if (tx.amount === undefined || tx.amount === null) {
          errors.push({
            field: `transactions[${i}].amount`,
            message: 'Amount is required',
            code: 'REQUIRED',
          });
        } else if (tx.amount < 0) {
          errors.push({
            field: `transactions[${i}].amount`,
            message: 'Amount cannot be negative',
            code: 'INVALID_AMOUNT',
          });
        } else if (tx.amount === 0) {
          warnings.push({
            field: `transactions[${i}].amount`,
            message: 'Transaction amount is zero',
            code: 'ZERO_AMOUNT',
          });
        }

        // Validate transaction type
        if (!tx.transactionType) {
          errors.push({
            field: `transactions[${i}].transactionType`,
            message: 'Transaction type is required',
            code: 'REQUIRED',
          });
        } else if (
          !Object.values(ZMTransactionType).includes(tx.transactionType)
        ) {
          errors.push({
            field: `transactions[${i}].transactionType`,
            message: 'Invalid transaction type',
            code: 'INVALID_TYPE',
          });
        }

        // VIES validation (if enabled and VAT ID is valid)
        if (!skipViesValidation && tx.customerVatId && tx.countryCode) {
          try {
            const viesResult = await this.validateEuVatId(tx.customerVatId);
            validatedVatIds.push(viesResult);

            if (!viesResult.isValid) {
              warnings.push({
                field: `transactions[${i}].customerVatId`,
                message: `VAT ID ${tx.customerVatId} could not be validated via VIES`,
                code: 'VIES_VALIDATION_FAILED',
              });
            }
          } catch (error) {
            this.logger.warn(
              `VIES validation failed for ${tx.customerVatId}: ${error.message}`,
            );
            warnings.push({
              field: `transactions[${i}].customerVatId`,
              message: `VIES validation unavailable for ${tx.customerVatId}`,
              code: 'VIES_UNAVAILABLE',
            });
          }
        }
      }

      if (validatedVatIds.length > 0) {
        vatIdValidations = validatedVatIds;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      vatIdValidations,
    };
  }

  /**
   * Validate EU VAT ID via VIES
   */
  async validateEuVatId(vatId: string): Promise<VatIdValidation> {
    this.logger.log(`Validating EU VAT ID via VIES: ${vatId}`);

    const cleanVatId = vatId.toUpperCase().replace(/\s/g, '');
    const countryCode = cleanVatId.substring(0, 2);
    const vatNumber = cleanVatId.substring(2);

    try {
      const response = await firstValueFrom(
        this.http.get<VIESResponse>(
          `${this.viesBaseUrl}/ms/${countryCode}/vat/${vatNumber}`,
          {
            timeout: 10000,
          },
        ),
      );

      const data = response.data;

      return {
        vatId: cleanVatId,
        countryCode,
        isValid: data.valid,
        requestDate: new Date(),
        name: data.name,
        address: data.address,
        viesAvailable: true,
      };
    } catch (error) {
      this.logger.error(
        `VIES validation failed for ${vatId}: ${error.message}`,
        error.stack,
      );

      // Return unavailable result instead of throwing
      return {
        vatId: cleanVatId,
        countryCode,
        isValid: false,
        requestDate: new Date(),
        error: error.message,
        viesAvailable: false,
      };
    }
  }

  /**
   * Get filing history
   */
  async getFilingHistory(
    organisationId: string,
    options: ZMHistoryOptions = {},
  ): Promise<ZMFiling[]> {
    const { year, periodType, status, limit = 50, offset = 0 } = options;

    const filings = await this.prisma.elsterFiling.findMany({
      where: {
        organisationId,
        type: 'ZM',
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
      type: 'ZM' as const,
      year: f.year,
      period: f.period,
      periodType: f.periodType as 'MONTHLY' | 'QUARTERLY',
      status: f.status as ZMFilingStatus,
      submissionId: f.submissionId,
      transferTicket: f.transferTicket,
      submittedAt: f.submittedAt,
      responseAt: f.responseAt,
      data: f.data as ZMData,
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
    data: ZMData,
  ): Promise<ZMFiling> {
    this.logger.log(
      `Creating draft ZM filing for org ${organisationId}, period ${data.period.year}/${data.period.month || data.period.quarter}`,
    );

    // Validate
    const validation = await this.validateZM(data, true); // Skip VIES for drafts
    if (!validation.isValid) {
      throw new ElsterESLError(
        `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
        ElsterESLErrorCode.VALIDATION_FAILED,
        { errors: validation.errors },
      );
    }

    const filing = await this.prisma.elsterFiling.create({
      data: {
        organisationId,
        type: 'ZM',
        year: data.period.year,
        period: data.period.month || data.period.quarter || 12,
        periodType: this.determinePeriodType(data.period),
        status: ZMFilingStatus.DRAFT,
        data: data as any,
        createdBy: 'system', // TODO: Get from request context
      },
    });

    return {
      id: filing.id,
      organisationId: filing.organisationId,
      type: 'ZM',
      year: filing.year,
      period: filing.period,
      periodType: filing.periodType as 'MONTHLY' | 'QUARTERLY',
      status: filing.status as ZMFilingStatus,
      data: filing.data as ZMData,
      createdAt: filing.createdAt,
      updatedAt: filing.updatedAt,
      createdBy: filing.createdBy,
    };
  }

  /**
   * Test connection to VIES
   */
  async testViesConnection(): Promise<boolean> {
    this.logger.log('Testing connection to VIES API');

    try {
      // Test with a known valid German VAT ID structure
      await firstValueFrom(
        this.http.get(`${this.viesBaseUrl}/ms/DE/vat/123456789`, {
          timeout: 5000,
        }),
      );
      return true;
    } catch (error) {
      // Even if the VAT ID is invalid, a response means the service is up
      if (error.response?.status === 404 || error.response?.status === 400) {
        return true; // VIES is responding
      }
      this.logger.error(`VIES connection test failed: ${error.message}`);
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
    request: TigerVATZMRequest,
  ): Promise<TigerVATZMResponse> {
    this.logger.log('Submitting ZM to tigerVAT API');

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.tigerVATBaseUrl}/zm/submit`,
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
      this.logger.error(
        `tigerVAT ZM submission failed: ${error.message}`,
        error.stack,
      );

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
   * Determine period type from period
   */
  private determinePeriodType(period: TaxPeriod): 'MONTHLY' | 'QUARTERLY' {
    return period.month ? 'MONTHLY' : 'QUARTERLY';
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
        type: 'ZM',
        year: period.year,
        period: period.month || period.quarter || 12,
        status: {
          in: [
            ZMFilingStatus.SUBMITTED,
            ZMFilingStatus.ACCEPTED,
            ZMFilingStatus.PENDING,
          ],
        },
      },
    });

    if (existing) {
      throw new ElsterESLError(
        `EC Sales List for period ${period.year}/${period.month || period.quarter} has already been submitted`,
        ElsterESLErrorCode.DUPLICATE_SUBMISSION,
        { filingId: existing.id },
      );
    }
  }

  /**
   * Determine transaction type from invoice
   */
  private determineTransactionType(invoice: any): ZMTransactionType {
    // TODO: Implement logic to determine if it's goods, services, or triangular
    // For now, check invoice metadata or default to goods

    // Check if invoice has a transaction type marker
    if (invoice.metadata?.zmTransactionType) {
      return invoice.metadata.zmTransactionType as ZMTransactionType;
    }

    // Check items for service indicators
    const hasServices = invoice.items?.some((item: any) =>
      item.description?.toLowerCase().includes('service') ||
      item.description?.toLowerCase().includes('dienstleistung') ||
      item.type === 'SERVICE'
    );

    if (hasServices) {
      return ZMTransactionType.SERVICES;
    }

    // Check for triangular transaction marker
    if (invoice.isTriangular || invoice.metadata?.isTriangular) {
      return ZMTransactionType.TRIANGULAR;
    }

    // Default to goods
    return ZMTransactionType.GOODS;
  }
}
