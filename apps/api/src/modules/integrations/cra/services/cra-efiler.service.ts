import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CraAuthService } from '../cra-auth.service';
import { CraNetFileClient } from '../cra-netfile.client';
import {
  GstHstReturn,
  CraFilingRequest,
  CraFilingResponse,
  CraFilingStatus,
  CraValidationResult,
  CraAuditAction,
  CraErrorCode,
  GstHstPeriod,
} from '../interfaces/cra.interface';
import {
  CRA_VALIDATION_RULES,
  isValidBusinessNumber,
  CRA_LINE_DESCRIPTIONS,
} from '../cra.constants';

/**
 * CRA E-Filer Service
 *
 * Handles GST/HST return filing operations
 *
 * Features:
 * - GST34, GST62, GST106 return support
 * - Return validation before submission
 * - Filing status tracking
 * - Duplicate prevention
 * - Comprehensive error handling
 * - Audit trail for all filings
 */
@Injectable()
export class CraEfilerService {
  private readonly logger = new Logger(CraEfilerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: CraAuthService,
    private readonly netfileClient: CraNetFileClient,
  ) {}

  /**
   * Validate GST/HST return before submission
   */
  async validateReturn(
    organizationId: string,
    returnData: GstHstReturn,
  ): Promise<CraValidationResult> {
    try {
      this.logger.log(`Validating GST/HST return for org: ${organizationId}`);

      // Perform local validation first
      const localValidation = this.performLocalValidation(returnData);
      if (!localValidation.valid) {
        return localValidation;
      }

      // Get active session
      const connectionInfo = await this.authService.getConnectionInfo(organizationId);
      if (!connectionInfo || connectionInfo.status !== 'CONNECTED') {
        throw new BadRequestException('CRA connection not active');
      }

      // Find active session
      const session = await this.findActiveSession(organizationId);
      if (!session) {
        throw new BadRequestException('No active CRA session');
      }

      // Validate with CRA
      const craResponse = await this.netfileClient.validateReturn(
        session.sessionId,
        returnData,
      );

      // Map to validation result
      const result: CraValidationResult = {
        valid: craResponse.status === CraFilingStatus.VALIDATED,
        errors: craResponse.errors || [],
        warnings: craResponse.warnings,
      };

      // Audit log
      await this.auditLog(organizationId, CraAuditAction.VALIDATE_RETURN, {
        businessNumber: returnData.businessNumber,
        valid: result.valid,
        errorCount: result.errors.length,
      });

      return result;
    } catch (error) {
      this.logger.error(`Return validation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Validation failed: ${error.message}`,
      );
    }
  }

  /**
   * Submit GST/HST return to CRA
   */
  async submitReturn(
    filingRequest: CraFilingRequest,
  ): Promise<CraFilingResponse> {
    const { organizationId, gstHstReturn, transmitterInfo } = filingRequest;

    try {
      this.logger.log(
        `Submitting GST/HST return for org: ${organizationId}, BN: ${gstHstReturn.businessNumber}`,
      );

      // Validate return locally
      const validation = this.performLocalValidation(gstHstReturn);
      if (!validation.valid) {
        throw new BadRequestException(
          `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
        );
      }

      // Check for duplicate submissions
      await this.checkDuplicateSubmission(organizationId, gstHstReturn);

      // Get active session
      const session = await this.findActiveSession(organizationId);
      if (!session) {
        throw new BadRequestException('No active CRA session');
      }

      // Submit to CRA
      const response = await this.netfileClient.submitReturn(
        session.sessionId,
        gstHstReturn,
        transmitterInfo,
      );

      // Store filing record
      await this.storeFilingRecord(organizationId, gstHstReturn, response);

      // Audit log
      await this.auditLog(organizationId, CraAuditAction.SUBMIT_RETURN, {
        businessNumber: gstHstReturn.businessNumber,
        confirmationNumber: response.confirmationNumber,
        status: response.status,
        periodStart: gstHstReturn.reportingPeriod.startDate,
        periodEnd: gstHstReturn.reportingPeriod.endDate,
      });

      this.logger.log(
        `GST/HST return submitted successfully. Confirmation: ${response.confirmationNumber}`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Return submission failed: ${error.message}`, error.stack);

      // Audit error
      await this.auditLog(organizationId, CraAuditAction.ERROR, {
        action: 'submitReturn',
        error: error.message,
        businessNumber: gstHstReturn.businessNumber,
      });

      throw error;
    }
  }

  /**
   * Check filing status
   */
  async checkFilingStatus(
    organizationId: string,
    confirmationNumber: string,
  ): Promise<CraFilingResponse> {
    try {
      this.logger.log(
        `Checking filing status for confirmation: ${confirmationNumber}`,
      );

      // Get active session
      const session = await this.findActiveSession(organizationId);
      if (!session) {
        throw new BadRequestException('No active CRA session');
      }

      // Check status with CRA
      const response = await this.netfileClient.checkStatus(
        session.sessionId,
        confirmationNumber,
      );

      // Update stored record
      await this.updateFilingStatus(confirmationNumber, response);

      // Audit log
      await this.auditLog(organizationId, CraAuditAction.CHECK_STATUS, {
        confirmationNumber,
        status: response.status,
      });

      return response;
    } catch (error) {
      this.logger.error(`Status check failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Status check failed: ${error.message}`,
      );
    }
  }

  /**
   * Get filing history for organization
   */
  async getFilingHistory(
    organizationId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      status?: CraFilingStatus;
      limit?: number;
    },
  ): Promise<any[]> {
    try {
      const where: any = {
        organizationId,
        provider: 'CRA',
      };

      if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) {
          where.createdAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.createdAt.lte = options.endDate;
        }
      }

      if (options?.status) {
        where.details = {
          path: ['status'],
          equals: options.status,
        };
      }

      const filings = await this.prisma.integrationSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
      });

      return filings;
    } catch (error) {
      this.logger.error(`Failed to get filing history: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to get filing history: ${error.message}`,
      );
    }
  }

  /**
   * Perform local validation of return data
   */
  private performLocalValidation(returnData: GstHstReturn): CraValidationResult {
    const errors: Array<{
      code: string;
      message: string;
      field?: string;
      severity: 'error' | 'warning';
    }> = [];

    // Validate Business Number
    if (!isValidBusinessNumber(returnData.businessNumber)) {
      errors.push({
        code: CraErrorCode.INVALID_BUSINESS_NUMBER,
        message: 'Invalid Business Number format',
        field: 'businessNumber',
        severity: 'error',
      });
    }

    // Validate reporting period
    if (
      returnData.reportingPeriod.startDate >= returnData.reportingPeriod.endDate
    ) {
      errors.push({
        code: CraErrorCode.INVALID_REPORTING_PERIOD,
        message: 'Reporting period start date must be before end date',
        field: 'reportingPeriod',
        severity: 'error',
      });
    }

    // Validate Line 101 - Sales and revenue
    if (
      returnData.line101_salesRevenue < CRA_VALIDATION_RULES.MIN_SALES_REVENUE ||
      returnData.line101_salesRevenue > CRA_VALIDATION_RULES.MAX_SALES_REVENUE
    ) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 101 value out of range: ${returnData.line101_salesRevenue}`,
        field: 'line101_salesRevenue',
        severity: 'error',
      });
    }

    // Validate Line 103 - Tax collected
    if (
      returnData.line103_taxCollected < CRA_VALIDATION_RULES.MIN_TAX_COLLECTED ||
      returnData.line103_taxCollected > CRA_VALIDATION_RULES.MAX_TAX_COLLECTED
    ) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 103 value out of range: ${returnData.line103_taxCollected}`,
        field: 'line103_taxCollected',
        severity: 'error',
      });
    }

    // Validate Line 105 calculation
    const expectedLine105 =
      returnData.line103_taxCollected + (returnData.line104_adjustments || 0);
    if (Math.abs(returnData.line105_totalTaxToRemit - expectedLine105) > 0.01) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 105 calculation error. Expected: ${expectedLine105}, Got: ${returnData.line105_totalTaxToRemit}`,
        field: 'line105_totalTaxToRemit',
        severity: 'error',
      });
    }

    // Validate Line 108 calculation
    const expectedLine108 =
      returnData.line106_currentITCs + (returnData.line107_itcAdjustments || 0);
    if (Math.abs(returnData.line108_totalITCs - expectedLine108) > 0.01) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 108 calculation error. Expected: ${expectedLine108}, Got: ${returnData.line108_totalITCs}`,
        field: 'line108_totalITCs',
        severity: 'error',
      });
    }

    // Validate Line 109 calculation
    const expectedLine109 = returnData.line105_totalTaxToRemit - returnData.line108_totalITCs;
    if (Math.abs(returnData.line109_netTax - expectedLine109) > 0.01) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 109 calculation error. Expected: ${expectedLine109}, Got: ${returnData.line109_netTax}`,
        field: 'line109_netTax',
        severity: 'error',
      });
    }

    // Validate declaration fields
    if (!returnData.certifierName || returnData.certifierName.trim().length === 0) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: 'Certifier name is required',
        field: 'certifierName',
        severity: 'error',
      });
    }

    if (!returnData.certifierCapacity || returnData.certifierCapacity.trim().length === 0) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: 'Certifier capacity is required',
        field: 'certifierCapacity',
        severity: 'error',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for duplicate submissions
   */
  private async checkDuplicateSubmission(
    organizationId: string,
    returnData: GstHstReturn,
  ): Promise<void> {
    const existing = await this.prisma.integrationSubmission.findFirst({
      where: {
        organizationId,
        provider: 'CRA',
        details: {
          path: ['businessNumber'],
          equals: returnData.businessNumber,
        },
        createdAt: {
          gte: returnData.reportingPeriod.startDate,
          lte: returnData.reportingPeriod.endDate,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Return already submitted for this period',
        CraErrorCode.DUPLICATE_SUBMISSION,
      );
    }
  }

  /**
   * Store filing record in database
   */
  private async storeFilingRecord(
    organizationId: string,
    returnData: GstHstReturn,
    response: CraFilingResponse,
  ): Promise<void> {
    await this.prisma.integrationSubmission.create({
      data: {
        organizationId,
        provider: 'CRA',
        submissionType: returnData.returnType,
        status: response.status,
        confirmationNumber: response.confirmationNumber,
        details: {
          businessNumber: returnData.businessNumber,
          reportingPeriod: returnData.reportingPeriod,
          netTax: returnData.line109_netTax,
          returnData,
          response,
        },
        submittedAt: response.filedAt || new Date(),
      },
    });
  }

  /**
   * Update filing status
   */
  private async updateFilingStatus(
    confirmationNumber: string,
    response: CraFilingResponse,
  ): Promise<void> {
    await this.prisma.integrationSubmission.updateMany({
      where: {
        confirmationNumber,
        provider: 'CRA',
      },
      data: {
        status: response.status,
        processedAt: response.processedAt,
        details: {
          // Merge with existing details
        },
      },
    });
  }

  /**
   * Find active session for organization
   */
  private async findActiveSession(organizationId: string): Promise<any> {
    // In a real implementation, this would query active sessions
    // For now, we'll get from auth service
    const connectionInfo = await this.authService.getConnectionInfo(organizationId);
    if (!connectionInfo || connectionInfo.status !== 'CONNECTED') {
      return null;
    }

    // Return mock session - in real impl, get from auth service
    return {
      sessionId: 'active-session-id',
      organizationId,
    };
  }

  /**
   * Audit logging
   */
  private async auditLog(
    organizationId: string,
    action: CraAuditAction,
    details: Record<string, any>,
  ): Promise<void> {
    try {
      await this.prisma.integrationAuditLog.create({
        data: {
          organizationId,
          provider: 'CRA',
          action,
          details,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`);
    }
  }
}
