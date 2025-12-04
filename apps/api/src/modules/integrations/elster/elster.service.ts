import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import * as forge from 'node-forge';
import {
  ElsterConfig,
  ElsterCertificate,
  ElsterEnvironment,
  ElsterTransmissionMeta,
  ElsterCertificateValidation,
} from './interfaces/elster-config.interface';
import {
  ElsterResponse,
  ElsterResponseStatus,
  ElsterSubmissionStatus,
  ElsterError,
  ElsterErrorSeverity,
} from './interfaces/elster-response.interface';
import {
  VATReturnSubmission,
  IncomeTaxSubmission,
  EmployeeTaxSubmission,
  ElsterSubmissionType,
  ElsterSubmissionAudit,
} from './interfaces/elster-submission.interface';
import { VATReturnDto } from './dto/vat-return.dto';
import { IncomeTaxReturnDto } from './dto/income-tax-return.dto';
import { EmployeeTaxDto } from './dto/employee-tax.dto';
import { ElsterCertificateUtil } from './utils/elster-certificate.util';
import { ElsterXmlBuilderUtil } from './utils/elster-xml-builder.util';

/**
 * ELSTER Service
 * Handles German tax filing through ELSTER API
 */
@Injectable()
export class ElsterService {
  private readonly logger = new Logger(ElsterService.name);
  private readonly config: ElsterConfig;
  private readonly httpClient: AxiosInstance;
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load ELSTER configuration
    this.config = {
      apiUrl:
        this.configService.get<string>('ELSTER_API_URL') ||
        'https://www.elster.de/elsterxml/submission/v1',
      vendorId:
        this.configService.get<string>('ELSTER_VENDOR_ID') ||
        'OPERATE',
      environment:
        (this.configService.get<string>(
          'ELSTER_ENVIRONMENT',
        ) as ElsterEnvironment) || ElsterEnvironment.SANDBOX,
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 2000,
      certificateEncryptionKey:
        this.configService.get<string>(
          'ELSTER_CERTIFICATE_ENCRYPTION_KEY',
        ) || '',
      enableLogging:
        this.configService.get<boolean>('ELSTER_ENABLE_LOGGING') ||
        false,
    };

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/xml; charset=ISO-8859-1',
        'User-Agent': 'Operate-CoachOS/1.0',
      },
    });

    this.logger.log(
      `ELSTER Service initialized (${this.config.environment} mode)`,
    );
  }

  /**
   * Load certificate for organization
   */
  async loadCertificate(
    organizationId: string,
  ): Promise<ElsterCertificate> {
    try {
      // TODO: Load from database
      // For now, this is a placeholder that would need to be implemented
      // based on your database schema

      const certRecord = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM elster_certificates
        WHERE organization_id = ${organizationId}
        AND active = true
        AND valid_until > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!certRecord || certRecord.length === 0) {
        throw new UnauthorizedException(
          'No valid ELSTER certificate found for organization',
        );
      }

      const cert = certRecord[0];

      // Decrypt certificate data
      const decryptedData = ElsterCertificateUtil.decryptCertificateData(
        cert.certificate_data,
        this.config.certificateEncryptionKey,
      );

      const decryptedPassword = ElsterCertificateUtil.decryptPassword(
        cert.password,
        this.config.certificateEncryptionKey,
      );

      // Load and validate certificate
      const { certificate } =
        await ElsterCertificateUtil.loadPfxCertificate(
          decryptedData,
          decryptedPassword,
        );

      const validation =
        ElsterCertificateUtil.validateCertificate(certificate);

      if (!validation.valid) {
        throw new UnauthorizedException(
          `Certificate validation failed: ${validation.errors.join(', ')}`,
        );
      }

      return {
        id: cert.id,
        organizationId: cert.organization_id,
        certificateData: decryptedData,
        password: decryptedPassword,
        issuer: validation.issuer,
        subject: validation.subject,
        validFrom: validation.validFrom,
        validUntil: validation.validUntil,
        active: cert.active,
        createdAt: cert.created_at,
        updatedAt: cert.updated_at,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load certificate for organization ${organizationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Submit VAT return (Umsatzsteuervoranmeldung)
   */
  async submitVATReturn(data: VATReturnDto): Promise<ElsterResponse> {
    this.logger.log(
      `Submitting VAT return for organization ${data.organizationId}`,
    );

    try {
      // Load certificate
      const certificate = await this.loadCertificate(
        data.organizationId,
      );

      // Build submission data
      const submission: VATReturnSubmission = {
        type: ElsterSubmissionType.VAT_RETURN,
        organizationId: data.organizationId,
        taxId: data.taxId,
        taxYear: data.taxYear,
        testSubmission: data.testSubmission,
        createdBy: 'system', // TODO: Get from context
        taxPeriod: data.taxPeriod,
        taxableSales19: data.taxableSales19,
        vat19: data.vat19,
        taxableSales7: data.taxableSales7,
        vat7: data.vat7,
        intraCommunityAcquisitions: data.intraCommunityAcquisitions ?? 0,
        vatIntraCommunity: data.vatIntraCommunity ?? 0,
        inputTaxDeduction: data.inputTaxDeduction,
        otherTaxableSales: data.otherTaxableSales,
        otherInputTax: data.otherInputTax,
        totalVat: data.totalVat,
        previousAdvancePayments: data.previousAdvancePayments,
        specialCircumstances: data.specialCircumstances,
      };

      // Generate transmission metadata
      const meta: ElsterTransmissionMeta = {
        transmissionId: this.generateTransmissionId(),
        dataType: ElsterSubmissionType.VAT_RETURN,
        taxYear: data.taxYear,
        taxPeriod: data.taxPeriod,
        testSubmission: data.testSubmission,
        compressed: true,
        encrypted: true,
      };

      // Build XML
      const xml = ElsterXmlBuilderUtil.buildVATReturnXml(
        submission,
        meta,
      );

      // Validate XML
      const xmlValidation = ElsterXmlBuilderUtil.validateXml(xml);
      if (!xmlValidation.valid) {
        throw new BadRequestException(
          `XML validation failed: ${xmlValidation.errors.join(', ')}`,
        );
      }

      // Submit to ELSTER
      const response = await this.submitToElster(
        xml,
        certificate,
        meta,
      );

      // Log audit trail
      await this.logAuditTrail({
        organizationId: data.organizationId,
        submissionType: ElsterSubmissionType.VAT_RETURN,
        transferTicket: response.transferTicket,
        status: response.status,
        submittedBy: 'system',
        requestPayload: { ...data, testSubmission: data.testSubmission },
        responsePayload: response,
      });

      return response;
    } catch (error) {
      this.logger.error('VAT return submission failed', error);
      throw this.handleSubmissionError(error);
    }
  }

  /**
   * Submit income tax return (Einkommensteuererklärung)
   */
  async submitIncomeTaxReturn(
    data: IncomeTaxReturnDto,
  ): Promise<ElsterResponse> {
    this.logger.log(
      `Submitting income tax return for organization ${data.organizationId}`,
    );

    try {
      const certificate = await this.loadCertificate(
        data.organizationId,
      );

      const submission: IncomeTaxSubmission = {
        type: ElsterSubmissionType.INCOME_TAX,
        organizationId: data.organizationId,
        taxId: data.taxpayer.taxId,
        taxYear: data.taxYear,
        testSubmission: data.testSubmission,
        createdBy: 'system',
        taxpayer: {
          firstName: data.taxpayer.firstName,
          lastName: data.taxpayer.lastName,
          dateOfBirth: new Date(data.taxpayer.dateOfBirth),
          taxId: data.taxpayer.taxId,
          address: data.taxpayer.address,
        },
        spouse: data.spouse
          ? {
              firstName: data.spouse.firstName,
              lastName: data.spouse.lastName,
              dateOfBirth: new Date(data.spouse.dateOfBirth),
              taxId: data.spouse.taxId,
            }
          : undefined,
        employmentIncome: data.employmentIncome,
        selfEmploymentIncome: data.selfEmploymentIncome,
        capitalIncome: data.capitalIncome,
        rentalIncome: data.rentalIncome,
        otherIncome: data.otherIncome,
        specialExpenses: data.specialExpenses,
        extraordinaryExpenses: data.extraordinaryExpenses,
        businessExpenses: data.businessExpenses,
        churchTaxApplicable: data.churchTaxApplicable,
        supportingDocuments: data.supportingDocuments || [],
      };

      const meta: ElsterTransmissionMeta = {
        transmissionId: this.generateTransmissionId(),
        dataType: ElsterSubmissionType.INCOME_TAX,
        taxYear: data.taxYear,
        testSubmission: data.testSubmission,
        compressed: true,
        encrypted: true,
      };

      const xml = ElsterXmlBuilderUtil.buildIncomeTaxReturnXml(
        submission,
        meta,
      );

      const response = await this.submitToElster(
        xml,
        certificate,
        meta,
      );

      await this.logAuditTrail({
        organizationId: data.organizationId,
        submissionType: ElsterSubmissionType.INCOME_TAX,
        transferTicket: response.transferTicket,
        status: response.status,
        submittedBy: 'system',
        requestPayload: { ...data, taxpayer: { ...data.taxpayer } },
        responsePayload: response,
      });

      return response;
    } catch (error) {
      this.logger.error('Income tax return submission failed', error);
      throw this.handleSubmissionError(error);
    }
  }

  /**
   * Submit employee tax (Lohnsteueranmeldung)
   */
  async submitEmployeeTax(
    data: EmployeeTaxDto,
  ): Promise<ElsterResponse> {
    this.logger.log(
      `Submitting employee tax for organization ${data.organizationId}`,
    );

    try {
      const certificate = await this.loadCertificate(
        data.organizationId,
      );

      const submission: EmployeeTaxSubmission = {
        type: ElsterSubmissionType.EMPLOYEE_TAX,
        organizationId: data.organizationId,
        taxId: data.employer.taxNumber,
        taxYear: data.taxYear,
        testSubmission: data.testSubmission,
        createdBy: 'system',
        taxPeriod: data.taxPeriod,
        employer: data.employer,
        totalGrossWages: data.totalGrossWages,
        totalWageTax: data.totalWageTax,
        solidaritySurcharge: data.solidaritySurcharge,
        churchTax: data.churchTax,
        numberOfEmployees: data.numberOfEmployees,
        socialSecurityContributions: data.socialSecurityContributions,
        specialPayments: data.specialPayments,
      };

      const meta: ElsterTransmissionMeta = {
        transmissionId: this.generateTransmissionId(),
        dataType: ElsterSubmissionType.EMPLOYEE_TAX,
        taxYear: data.taxYear,
        taxPeriod: data.taxPeriod,
        testSubmission: data.testSubmission,
        compressed: true,
        encrypted: true,
      };

      const xml = ElsterXmlBuilderUtil.buildEmployeeTaxXml(
        submission,
        meta,
      );

      const response = await this.submitToElster(
        xml,
        certificate,
        meta,
      );

      await this.logAuditTrail({
        organizationId: data.organizationId,
        submissionType: ElsterSubmissionType.EMPLOYEE_TAX,
        transferTicket: response.transferTicket,
        status: response.status,
        submittedBy: 'system',
        requestPayload: { ...data },
        responsePayload: response,
      });

      return response;
    } catch (error) {
      this.logger.error('Employee tax submission failed', error);
      throw this.handleSubmissionError(error);
    }
  }

  /**
   * Check submission status
   */
  async checkSubmissionStatus(
    transferTicket: string,
  ): Promise<ElsterSubmissionStatus> {
    this.logger.log(`Checking status for ticket ${transferTicket}`);

    try {
      // TODO: Implement audit log lookup when elsterAuditLog table is created
      // For now, just query ELSTER API directly

      try {
        const response = await this.httpClient.get(
          `/status/${transferTicket}`,
        );

        const status = this.parseStatusResponse(response.data);

        return status;
      } catch (apiError) {
        // If API call fails, return error
        this.logger.warn(
          `ELSTER API unavailable for status check of ${transferTicket}`,
        );

        throw new ServiceUnavailableException(
          'Unable to retrieve submission status from ELSTER',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Status check failed', error);
      throw new ServiceUnavailableException(
        'Failed to check submission status',
      );
    }
  }

  /**
   * Submit XML to ELSTER with retry logic
   */
  private async submitToElster(
    xml: string,
    certificate: ElsterCertificate,
    meta: ElsterTransmissionMeta,
    attempt = 1,
  ): Promise<ElsterResponse> {
    try {
      this.logger.debug(
        `Submitting to ELSTER (attempt ${attempt}/${this.maxRetries})`,
      );

      // Load certificate for HTTPS client
      const { certificate: cert, privateKey } =
        await ElsterCertificateUtil.loadPfxCertificate(
          certificate.certificateData,
          certificate.password,
        );

      // Create HTTPS agent with certificate
      const httpsAgent = new https.Agent({
        cert: ElsterCertificateUtil.certificateToPem(cert),
        key: ElsterCertificateUtil.privateKeyToPem(privateKey),
        rejectUnauthorized: this.config.environment === ElsterEnvironment.PRODUCTION,
      });

      // Compress XML if needed
      const payload = meta.compressed
        ? await ElsterXmlBuilderUtil.compressXml(xml)
        : xml;

      // Submit
      const response = await this.httpClient.post('/submission', payload, {
        httpsAgent,
        headers: {
          'Content-Type': meta.compressed
            ? 'application/octet-stream'
            : 'application/xml',
          'X-Transmission-ID': meta.transmissionId,
        },
      });

      return this.parseSubmissionResponse(response.data);
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Submission failed, retrying in ${delay}ms...`,
        );
        await this.sleep(delay);
        return this.submitToElster(xml, certificate, meta, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Parse ELSTER submission response
   */
  private parseSubmissionResponse(data: any): ElsterResponse {
    // TODO: Implement actual XML parsing from ELSTER response
    // This is a placeholder

    return {
      status: ElsterResponseStatus.ACCEPTED,
      transferTicket: data.transferTicket || this.generateTransmissionId(),
      dataTransferNumber: data.dataTransferNumber,
      timestamp: new Date(),
      errors: [],
      warnings: [],
      serverResponseCode: data.code,
      serverResponseMessage: data.message,
    };
  }

  /**
   * Parse status response
   */
  private parseStatusResponse(data: any): ElsterSubmissionStatus {
    return {
      transferTicket: data.transferTicket,
      status: data.status as ElsterResponseStatus,
      statusDescription: data.statusDescription,
      lastUpdate: new Date(data.lastUpdate),
      errors: data.errors || [],
    };
  }

  /**
   * Log audit trail
   */
  private async logAuditTrail(
    audit: Partial<ElsterSubmissionAudit>,
  ): Promise<void> {
    try {
      await this.prisma.elsterAuditLog.create({
        data: {
          orgId: audit.organizationId || '',
          submissionType: audit.submissionType || 'UNKNOWN',
          transferTicket: audit.transferTicket || '',
          status: audit.status || 'PENDING',
          submittedBy: audit.submittedBy || 'system',
          requestPayload: audit.requestPayload as any,
          responsePayload: audit.responsePayload as any,
        },
      });

      this.logger.log(
        `Audit logged: ${audit.submissionType} - ${audit.transferTicket} (Status: ${audit.status})`,
      );
    } catch (error) {
      this.logger.error('Failed to log audit trail', error);
      // Don't throw - audit logging failure shouldn't break the submission
    }
  }

  /**
   * Handle submission errors
   */
  private handleSubmissionError(error: any): Error {
    if (error instanceof BadRequestException) {
      return error;
    }

    if (error.response?.status === 401) {
      return new UnauthorizedException(
        'ELSTER authentication failed. Please check certificate.',
      );
    }

    if (error.response?.status >= 500) {
      return new ServiceUnavailableException(
        'ELSTER service is currently unavailable',
      );
    }

    return new BadRequestException(
      `Submission failed: ${error.message}`,
    );
  }

  /**
   * Generate transmission ID
   */
  private generateTransmissionId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${this.config.vendorId}-${timestamp}-${random}`;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
