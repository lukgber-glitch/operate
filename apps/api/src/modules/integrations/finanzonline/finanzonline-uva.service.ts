/**
 * FinanzOnline UVA Service
 * Handles Austrian VAT advance return (Umsatzsteuervoranmeldung) submissions
 *
 * Features:
 * - Prepare UVA from invoices/expenses
 * - Submit UVA to FinanzOnline
 * - Track submission status
 * - Retrieve submission history
 * - Validate UVA data
 * - BullMQ integration for async submissions
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { FinanzOnlineSessionService } from './finanzonline-session.service';
import { FinanzOnlineClient } from './finanzonline.client';
import { FinanzOnlineEnvironment } from './finanzonline.constants';
import {
  UVASubmissionData,
  UVASubmissionResult,
  UVAHistoryEntry,
  UVAValidationResult,
  UVAPreparationOptions,
  UVACalculationData,
  UVAKennzahlen,
  UVAPeriodType,
  UVASubmissionStatus,
  AustrianVATRate,
} from './finanzonline-uva.types';
import {
  UVASubmissionDto,
  UVAPreparationDto,
  UVAStatusDto,
  UVAHistoryDto,
  UVAResponseDto,
} from './dto/uva.dto';

/**
 * Period date range
 */
interface PeriodDateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class FinanzOnlineUVAService {
  private readonly logger = new Logger(FinanzOnlineUVAService.name);
  private readonly environment: FinanzOnlineEnvironment;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sessionService: FinanzOnlineSessionService,
    @InjectQueue('finanzonline-uva') private readonly uvaQueue: Queue,
  ) {
    this.environment =
      (this.configService.get<string>('FON_ENVIRONMENT') as FinanzOnlineEnvironment) ||
      FinanzOnlineEnvironment.TEST;

    this.logger.log(`FinanzOnline UVA Service initialized (${this.environment} mode)`);
  }

  /**
   * Prepare UVA from invoices and expenses
   * Calculates VAT data for the specified period
   */
  async prepareUVA(options: UVAPreparationDto): Promise<UVASubmissionData> {
    this.logger.log(
      `Preparing UVA for organization ${options.organizationId}, period ${options.taxYear}/${options.taxPeriod}`,
    );

    try {
      // Get period date range
      const dateRange = this.getPeriodDateRange(
        options.taxYear,
        options.taxPeriod,
        options.periodType,
      );

      // Fetch invoices for the period
      const invoices = await this.fetchInvoicesForPeriod(
        options.organizationId,
        dateRange,
        options.includeDrafts ?? false,
      );

      // Fetch expenses for the period
      const expenses = await this.fetchExpensesForPeriod(
        options.organizationId,
        dateRange,
        options.includeDrafts ?? false,
      );

      // Calculate VAT data
      const calculationData = this.calculateVATData(invoices, expenses);

      // Convert to Kennzahlen
      const kennzahlen = this.calculateKennzahlen(calculationData);

      // Calculate total VAT
      const totalVAT = this.calculateTotalVAT(kennzahlen);

      // Get organization details
      const organization = await this.getOrganizationDetails(options.organizationId);

      // Build submission data
      const submissionData: UVASubmissionData = {
        organizationId: options.organizationId,
        taxYear: options.taxYear,
        taxPeriod: options.taxPeriod,
        periodType: options.periodType,
        teilnehmerId: organization.teilnehmerId,
        taxNumber: organization.taxNumber,
        vatId: organization.vatId,
        kennzahlen,
        calculationData,
        totalVAT,
        testSubmission: this.environment !== FinanzOnlineEnvironment.PRODUCTION,
        metadata: {
          preparedAt: new Date().toISOString(),
          invoiceCount: invoices.length,
          expenseCount: expenses.length,
          autoCalculated: options.autoCalculate ?? true,
        },
      };

      this.logger.log(`UVA prepared successfully. Total VAT: ${totalVAT}`);

      return submissionData;
    } catch (error) {
      this.logger.error(`Failed to prepare UVA: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to prepare UVA: ${error.message}`);
    }
  }

  /**
   * Submit UVA to FinanzOnline
   */
  async submitUVA(data: UVASubmissionDto, userId: string): Promise<UVAResponseDto> {
    this.logger.log(
      `Submitting UVA for organization ${data.organizationId}, period ${data.taxYear}/${data.taxPeriod}`,
    );

    try {
      // Validate UVA data
      const validation = await this.validateUVA(data);
      if (!validation.valid) {
        throw new BadRequestException({
          message: 'UVA validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      // Check if session exists for organization
      const session = await this.sessionService.findActiveSessionByOrganization(
        data.organizationId,
      );

      if (!session) {
        throw new BadRequestException(
          'No active FinanzOnline session found. Please login first.',
        );
      }

      // Create submission record in database
      const submissionId = await this.createSubmissionRecord(data, userId);

      // Submit via async queue (BullMQ)
      await this.uvaQueue.add(
        'submit-uva',
        {
          submissionId,
          data,
          sessionId: session.sessionId,
          userId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`UVA submission queued. Submission ID: ${submissionId}`);

      // Return immediate response
      return {
        submissionId,
        status: UVASubmissionStatus.PENDING,
        submittedAt: new Date(),
        errors: [],
        warnings: validation.warnings.map((w) => ({
          code: w.code,
          message: w.message,
          field: w.field,
        })),
      };
    } catch (error) {
      this.logger.error(`UVA submission failed: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(`UVA submission failed: ${error.message}`);
    }
  }

  /**
   * Get UVA submission status
   */
  async getUVAStatus(query: UVAStatusDto): Promise<UVAResponseDto> {
    this.logger.log(`Getting UVA status for: ${query.identifier}`);

    try {
      // Fetch submission from database
      const submission = await this.findSubmission(query.identifier, query.organizationId);

      if (!submission) {
        throw new NotFoundException('UVA submission not found');
      }

      // Map to response DTO
      return this.mapSubmissionToResponse(submission);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to get UVA status: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to get UVA status: ${error.message}`);
    }
  }

  /**
   * Get UVA submission history
   */
  async getUVAHistory(query: UVAHistoryDto): Promise<UVAHistoryEntry[]> {
    this.logger.log(`Getting UVA history for organization ${query.organizationId}`);

    try {
      // Fetch submissions from database
      const submissions = await this.fetchSubmissionHistory(
        query.organizationId,
        query.taxYear,
        query.limit ?? 10,
        query.offset ?? 0,
      );

      return submissions;
    } catch (error) {
      this.logger.error(`Failed to get UVA history: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to get UVA history: ${error.message}`);
    }
  }

  /**
   * Validate UVA data
   */
  async validateUVA(data: UVASubmissionDto | UVASubmissionData): Promise<UVAValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // Validate period type based on organization turnover
    const periodValidation = await this.validatePeriodType(
      data.organizationId,
      data.periodType,
    );

    if (!periodValidation.valid) {
      warnings.push({
        field: 'periodType',
        message: periodValidation.reason || 'Period type may not match organization requirements',
        code: 'PERIOD_TYPE_MISMATCH',
      });
    }

    // Validate Kennzahlen
    this.validateKennzahlen(data.kennzahlen, errors);

    // Validate business logic
    const businessChecks = this.validateBusinessLogic(data.kennzahlen, data.totalVAT);

    if (!businessChecks.totalsMatch) {
      errors.push({
        field: 'totalVAT',
        message: `Total VAT mismatch. Expected: ${businessChecks.expectedTotal}, Got: ${businessChecks.calculatedTotal}`,
        code: 'TOTAL_VAT_MISMATCH',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      businessChecks,
      periodValidation,
    };
  }

  /**
   * Calculate VAT data from invoices and expenses
   */
  private calculateVATData(invoices: any[], expenses: any[]): UVACalculationData {
    const data: UVACalculationData = {
      sales20: 0,
      vat20: 0,
      sales13: 0,
      vat13: 0,
      sales10: 0,
      vat10: 0,
      taxFreeSalesWithDeduction: 0,
      taxFreeSalesWithoutDeduction: 0,
      exports: 0,
      intraCommunityDeliveries: 0,
      intraCommunityAcquisitions20: 0,
      vatIntraCommunity20: 0,
      intraCommunityAcquisitions13: 0,
      vatIntraCommunity13: 0,
      reverseChargeBase: 0,
      reverseChargeVAT: 0,
      totalInputVAT: 0,
      inputVATIntraCommunity: 0,
      inputVATReverseCharge: 0,
      inputVATImports: 0,
      ownConsumption20: 0,
      vatOwnConsumption20: 0,
      corrections: 0,
      previousAdvancePayments: 0,
    };

    // Process invoices (sales)
    for (const invoice of invoices) {
      const vatRate = invoice.vatRate;
      const netAmount = invoice.netAmount;
      const vatAmount = invoice.vatAmount;

      if (invoice.isExport) {
        data.exports += netAmount;
      } else if (invoice.isIntraCommunityDelivery) {
        data.intraCommunityDeliveries += netAmount;
      } else if (invoice.isTaxFree) {
        if (invoice.hasInputTaxDeduction) {
          data.taxFreeSalesWithDeduction += netAmount;
        } else {
          data.taxFreeSalesWithoutDeduction += netAmount;
        }
      } else {
        // Taxable sales
        switch (vatRate) {
          case AustrianVATRate.STANDARD:
            data.sales20 += netAmount;
            data.vat20 += vatAmount;
            break;
          case AustrianVATRate.REDUCED_13:
          case AustrianVATRate.PARKING:
            data.sales13 += netAmount;
            data.vat13 += vatAmount;
            break;
          case AustrianVATRate.REDUCED_10:
            data.sales10 += netAmount;
            data.vat10 += vatAmount;
            break;
        }
      }
    }

    // Process expenses (input VAT)
    for (const expense of expenses) {
      const vatAmount = expense.vatAmount;
      const netAmount = expense.netAmount;

      if (expense.isIntraCommunityAcquisition) {
        const vatRate = expense.vatRate;
        if (vatRate === AustrianVATRate.STANDARD) {
          data.intraCommunityAcquisitions20 += netAmount;
          data.vatIntraCommunity20 += vatAmount;
          data.inputVATIntraCommunity += vatAmount;
        } else if (vatRate === AustrianVATRate.REDUCED_13) {
          data.intraCommunityAcquisitions13 += netAmount;
          data.vatIntraCommunity13 += vatAmount;
          data.inputVATIntraCommunity += vatAmount;
        }
      } else if (expense.isReverseCharge) {
        data.reverseChargeBase += netAmount;
        data.reverseChargeVAT += vatAmount;
        data.inputVATReverseCharge += vatAmount;
      } else if (expense.isImport) {
        data.inputVATImports += vatAmount;
      } else {
        // Regular input VAT
        data.totalInputVAT += vatAmount;
      }
    }

    return data;
  }

  /**
   * Convert calculation data to Kennzahlen
   */
  private calculateKennzahlen(data: UVACalculationData): UVAKennzahlen {
    const kennzahlen: UVAKennzahlen = {};

    // Total tax base
    kennzahlen.kz000 =
      data.sales20 +
      data.sales13 +
      data.sales10 +
      data.taxFreeSalesWithDeduction +
      data.taxFreeSalesWithoutDeduction +
      data.exports +
      data.intraCommunityDeliveries;

    // Tax-free with/without deduction
    kennzahlen.kz001 = data.taxFreeSalesWithDeduction + data.exports + data.intraCommunityDeliveries;
    kennzahlen.kz011 = data.taxFreeSalesWithoutDeduction;

    // Exports and IC deliveries
    kennzahlen.kz020 = data.exports;
    kennzahlen.kz021 = data.intraCommunityDeliveries;

    // Sales at 20%
    kennzahlen.kz022 = data.sales20;
    kennzahlen.kz029 = data.vat20;

    // Sales at 13%
    kennzahlen.kz006 = data.sales13;
    kennzahlen.kz037 = data.vat13;

    // Sales at 10%
    kennzahlen.kz007 = data.sales10;
    kennzahlen.kz008 = data.vat10;

    // Intra-community acquisitions at 20%
    if (data.intraCommunityAcquisitions20 > 0) {
      kennzahlen.kz070 = data.intraCommunityAcquisitions20;
      kennzahlen.kz071 = data.vatIntraCommunity20;
    }

    // Intra-community acquisitions at 13%
    if (data.intraCommunityAcquisitions13 > 0) {
      kennzahlen.kz072 = data.intraCommunityAcquisitions13;
      kennzahlen.kz073 = data.vatIntraCommunity13;
    }

    // Reverse charge
    if (data.reverseChargeBase > 0) {
      kennzahlen.kz048 = data.reverseChargeBase;
      kennzahlen.kz088 = data.reverseChargeVAT;
    }

    // Input VAT
    const totalDeductibleInputVAT =
      data.totalInputVAT +
      data.inputVATIntraCommunity +
      data.inputVATReverseCharge +
      data.inputVATImports;

    kennzahlen.kz060_vorsteuer = totalDeductibleInputVAT;

    if (data.inputVATIntraCommunity > 0) {
      kennzahlen.kz083 = data.inputVATIntraCommunity;
    }

    if (data.inputVATReverseCharge > 0) {
      kennzahlen.kz065 = data.inputVATReverseCharge;
    }

    if (data.inputVATImports > 0) {
      kennzahlen.kz066 = data.inputVATImports;
    }

    // Corrections
    if (data.corrections !== 0) {
      kennzahlen.kz090 = data.corrections;
    }

    // Calculate payment
    const totalOutputVAT = data.vat20 + data.vat13 + data.vat10 + data.vatIntraCommunity20 + data.vatIntraCommunity13 + data.reverseChargeVAT;
    const paymentDue = totalOutputVAT - totalDeductibleInputVAT + (data.corrections || 0);

    if (paymentDue > 0) {
      kennzahlen.kz095 = paymentDue;
      kennzahlen.kz096 = 0;
    } else {
      kennzahlen.kz095 = 0;
      kennzahlen.kz096 = Math.abs(paymentDue);
    }

    return kennzahlen;
  }

  /**
   * Calculate total VAT from Kennzahlen
   */
  private calculateTotalVAT(kennzahlen: UVAKennzahlen): number {
    const outputVAT =
      (kennzahlen.kz029 || 0) +
      (kennzahlen.kz037 || 0) +
      (kennzahlen.kz008 || 0) +
      (kennzahlen.kz071 || 0) +
      (kennzahlen.kz073 || 0) +
      (kennzahlen.kz088 || 0) +
      (kennzahlen.kz061 || 0) +
      (kennzahlen.kz045 || 0) +
      (kennzahlen.kz026 || 0);

    const inputVAT = kennzahlen.kz060_vorsteuer || 0;

    const corrections = kennzahlen.kz090 || 0;

    return outputVAT - inputVAT + corrections;
  }

  /**
   * Validate Kennzahlen
   */
  private validateKennzahlen(
    kennzahlen: UVAKennzahlen,
    errors: Array<{ field: string; message: string; code: string }>,
  ): void {
    // Check that VAT amounts match tax bases
    if (kennzahlen.kz022 && kennzahlen.kz029) {
      const expectedVAT = Math.round((kennzahlen.kz022 * 0.2) * 100) / 100;
      const actualVAT = kennzahlen.kz029;
      if (Math.abs(expectedVAT - actualVAT) > 0.01) {
        errors.push({
          field: 'kz029',
          message: `VAT at 20% mismatch. Expected: ${expectedVAT}, Got: ${actualVAT}`,
          code: 'VAT_20_MISMATCH',
        });
      }
    }

    if (kennzahlen.kz006 && kennzahlen.kz037) {
      const expectedVAT = Math.round((kennzahlen.kz006 * 0.13) * 100) / 100;
      const actualVAT = kennzahlen.kz037;
      if (Math.abs(expectedVAT - actualVAT) > 0.01) {
        errors.push({
          field: 'kz037',
          message: `VAT at 13% mismatch. Expected: ${expectedVAT}, Got: ${actualVAT}`,
          code: 'VAT_13_MISMATCH',
        });
      }
    }

    if (kennzahlen.kz007 && kennzahlen.kz008) {
      const expectedVAT = Math.round((kennzahlen.kz007 * 0.1) * 100) / 100;
      const actualVAT = kennzahlen.kz008;
      if (Math.abs(expectedVAT - actualVAT) > 0.01) {
        errors.push({
          field: 'kz008',
          message: `VAT at 10% mismatch. Expected: ${expectedVAT}, Got: ${actualVAT}`,
          code: 'VAT_10_MISMATCH',
        });
      }
    }

    // Validate negative values
    for (const [key, value] of Object.entries(kennzahlen)) {
      if (typeof value === 'number' && value < 0 && !key.startsWith('kz090')) {
        errors.push({
          field: key,
          message: `${key} cannot be negative`,
          code: 'NEGATIVE_VALUE',
        });
      }
    }
  }

  /**
   * Validate business logic
   */
  private validateBusinessLogic(
    kennzahlen: UVAKennzahlen,
    totalVAT: number,
  ): {
    totalsMatch: boolean;
    expectedTotal: number;
    calculatedTotal: number;
    difference: number;
  } {
    const calculatedTotal = this.calculateTotalVAT(kennzahlen);
    const expectedTotal = totalVAT;
    const difference = Math.abs(calculatedTotal - expectedTotal);

    return {
      totalsMatch: difference < 0.01,
      expectedTotal,
      calculatedTotal,
      difference,
    };
  }

  /**
   * Validate period type for organization
   */
  private async validatePeriodType(
    organizationId: string,
    periodType: UVAPeriodType,
  ): Promise<{ valid: boolean; requiredPeriodType: UVAPeriodType; reason?: string }> {
    // Fetch organization turnover for previous year
    const organization = await this.getOrganizationDetails(organizationId);

    // In Austria:
    // - Businesses with annual turnover > 100,000 EUR must file monthly
    // - Businesses with annual turnover <= 100,000 EUR can file quarterly
    // - New businesses can opt for quarterly in first year

    const annualTurnover = organization.annualTurnover || 0;

    if (annualTurnover > 100000 && periodType !== UVAPeriodType.MONTHLY) {
      return {
        valid: false,
        requiredPeriodType: UVAPeriodType.MONTHLY,
        reason: 'Monthly filing required for businesses with turnover > 100,000 EUR',
      };
    }

    return {
      valid: true,
      requiredPeriodType: periodType,
    };
  }

  /**
   * Get period date range
   */
  private getPeriodDateRange(
    year: number,
    period: string,
    periodType: UVAPeriodType,
  ): PeriodDateRange {
    let startDate: Date;
    let endDate: Date;

    if (periodType === UVAPeriodType.MONTHLY) {
      const month = parseInt(period, 10);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (periodType === UVAPeriodType.QUARTERLY) {
      const quarter = parseInt(period.replace('Q', ''), 10);
      const startMonth = (quarter - 1) * 3;
      startDate = new Date(year, startMonth, 1);
      endDate = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    } else {
      // Annual
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  /**
   * Fetch invoices for period
   */
  private async fetchInvoicesForPeriod(
    organizationId: string,
    dateRange: PeriodDateRange,
    includeDrafts: boolean,
  ): Promise<any[]> {
    // TODO: Implement actual invoice fetching from database
    // This is a placeholder
    this.logger.debug(`Fetching invoices for ${organizationId} from ${dateRange.startDate} to ${dateRange.endDate}`);
    return [];
  }

  /**
   * Fetch expenses for period
   */
  private async fetchExpensesForPeriod(
    organizationId: string,
    dateRange: PeriodDateRange,
    includeDrafts: boolean,
  ): Promise<any[]> {
    // TODO: Implement actual expense fetching from database
    // This is a placeholder
    this.logger.debug(`Fetching expenses for ${organizationId} from ${dateRange.startDate} to ${dateRange.endDate}`);
    return [];
  }

  /**
   * Get organization details
   */
  private async getOrganizationDetails(organizationId: string): Promise<{
    teilnehmerId: string;
    taxNumber: string;
    vatId?: string;
    annualTurnover?: number;
  }> {
    // TODO: Implement actual organization fetching from database
    // This is a placeholder
    this.logger.debug(`Getting organization details for ${organizationId}`);

    return {
      teilnehmerId: '000000000',
      taxNumber: '00-000/0000',
      vatId: 'ATU00000000',
      annualTurnover: 50000,
    };
  }

  /**
   * Create submission record in database
   */
  private async createSubmissionRecord(data: UVASubmissionDto, userId: string): Promise<string> {
    // TODO: Implement actual database insertion
    // This is a placeholder
    const submissionId = `uva_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.logger.debug(`Creating submission record: ${submissionId}`);
    return submissionId;
  }

  /**
   * Find submission by ID or transfer ticket
   */
  private async findSubmission(
    identifier: string,
    organizationId?: string,
  ): Promise<any | null> {
    // TODO: Implement actual database query
    // This is a placeholder
    this.logger.debug(`Finding submission: ${identifier}`);
    return null;
  }

  /**
   * Fetch submission history
   */
  private async fetchSubmissionHistory(
    organizationId: string,
    taxYear?: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<UVAHistoryEntry[]> {
    // TODO: Implement actual database query
    // This is a placeholder
    this.logger.debug(`Fetching submission history for ${organizationId}`);
    return [];
  }

  /**
   * Map submission to response DTO
   */
  private mapSubmissionToResponse(submission: any): UVAResponseDto {
    return {
      submissionId: submission.id,
      transferTicket: submission.transferTicket,
      status: submission.status,
      submittedAt: submission.submittedAt,
      response: submission.response,
      errors: submission.errors || [],
      warnings: submission.warnings || [],
      receiptNumber: submission.receiptNumber,
      nextDueDate: submission.nextDueDate,
    };
  }
}
