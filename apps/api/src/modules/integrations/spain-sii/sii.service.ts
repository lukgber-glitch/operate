import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../cache/redis.service';
import { SiiEnvironment, SII_CACHE_TTL } from './constants/sii.constants';
import { SiiInvoiceSubmissionService } from './sii-invoice-submission.service';
import { SiiXmlBuilderService } from './sii-xml-builder.service';
import { SiiSoapClient } from './sii-soap.client';
import { SiiErrorHandlerService } from './sii-error-handler.service';
import {
  SubmitIssuedInvoiceDto,
  SubmitReceivedInvoiceDto,
  SubmitPaymentDto,
} from './dto/submit-invoice.dto';
import {
  QueryInvoicesDto,
  GetSubmissionStatusDto,
  DeleteInvoiceDto,
} from './dto/sii-query.dto';
import {
  SiiInvoiceSubmissionResponse,
  SiiQueryResponse,
  SiiStatusResponse,
  SiiSubmissionStatus,
  CachedSiiSubmission,
} from './interfaces/sii-response.interface';
import {
  SiiIssuedInvoice,
  SiiReceivedInvoice,
  SiiPaymentRecord,
} from './interfaces/sii-invoice.interface';
import * as fs from 'fs';

/**
 * Main SII Service
 * Facade for all SII operations
 */
@Injectable()
export class SiiService {
  private readonly logger = new Logger(SiiService.name);
  private readonly environment: SiiEnvironment;
  private readonly cachePrefix = 'sii';

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly submissionService: SiiInvoiceSubmissionService,
    private readonly xmlBuilder: SiiXmlBuilderService,
    private readonly soapClient: SiiSoapClient,
    private readonly errorHandler: SiiErrorHandlerService,
  ) {
    this.environment =
      (this.configService.get<string>('SII_ENVIRONMENT') as SiiEnvironment) ||
      SiiEnvironment.TEST;

    this.logger.log(`SII Service initialized in ${this.environment} mode`);
  }

  /**
   * Submit issued invoice
   */
  async submitIssuedInvoice(
    dto: SubmitIssuedInvoiceDto,
    certificatePath: string,
    certificateKeyPath: string,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    try {
      this.logger.log(
        `Submitting issued invoice ${dto.invoiceNumber} for ${dto.holder.nif}`,
      );

      // Load certificate files
      const certificate = await this.loadCertificate(certificatePath);
      const certificateKey = await this.loadCertificate(certificateKeyPath);

      // Convert DTO to SiiIssuedInvoice
      const invoice = this.dtoToIssuedInvoice(dto);

      // Submit to SII
      return await this.submissionService.submitIssuedInvoices(
        dto.holder,
        dto.fiscalYear,
        dto.period,
        [invoice],
        certificate,
        certificateKey,
        certificatePassword,
      );
    } catch (error) {
      this.logger.error(
        `Failed to submit issued invoice: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Submit multiple issued invoices (batch)
   */
  async submitIssuedInvoicesBatch(
    dtos: SubmitIssuedInvoiceDto[],
    certificatePath: string,
    certificateKeyPath: string,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    try {
      if (dtos.length === 0) {
        throw new BadRequestException('No invoices to submit');
      }

      this.logger.log(`Submitting batch of ${dtos.length} issued invoices`);

      // Load certificates
      const certificate = await this.loadCertificate(certificatePath);
      const certificateKey = await this.loadCertificate(certificateKeyPath);

      // Get holder from first DTO (all should have same holder)
      const holder = dtos[0].holder;
      const fiscalYear = dtos[0].fiscalYear;
      const period = dtos[0].period;

      // Convert all DTOs to invoices
      const invoices = dtos.map((dto) => this.dtoToIssuedInvoice(dto));

      // Submit to SII
      return await this.submissionService.submitIssuedInvoices(
        holder,
        fiscalYear,
        period,
        invoices,
        certificate,
        certificateKey,
        certificatePassword,
      );
    } catch (error) {
      this.logger.error(
        `Failed to submit issued invoices batch: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Submit received invoice
   */
  async submitReceivedInvoice(
    dto: SubmitReceivedInvoiceDto,
    certificatePath: string,
    certificateKeyPath: string,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    try {
      this.logger.log(
        `Submitting received invoice ${dto.invoiceNumber} for ${dto.holder.nif}`,
      );

      // Load certificates
      const certificate = await this.loadCertificate(certificatePath);
      const certificateKey = await this.loadCertificate(certificateKeyPath);

      // Convert DTO to SiiReceivedInvoice
      const invoice = this.dtoToReceivedInvoice(dto);

      // Submit to SII
      return await this.submissionService.submitReceivedInvoices(
        dto.holder,
        dto.fiscalYear,
        dto.period,
        [invoice],
        certificate,
        certificateKey,
        certificatePassword,
      );
    } catch (error) {
      this.logger.error(
        `Failed to submit received invoice: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Submit payment/collection record
   */
  async submitPayment(
    dto: SubmitPaymentDto,
    certificatePath: string,
    certificateKeyPath: string,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    try {
      this.logger.log(
        `Submitting payment for invoice ${dto.invoiceNumber} for ${dto.holder.nif}`,
      );

      // Load certificates
      const certificate = await this.loadCertificate(certificatePath);
      const certificateKey = await this.loadCertificate(certificateKeyPath);

      // Convert DTO to SiiPaymentRecord
      const payment: SiiPaymentRecord = {
        invoiceId: {
          invoiceNumber: dto.invoiceNumber,
          issueDate: dto.issueDate,
          invoiceType: 'F1' as Prisma.InputJsonValue, // Default to standard invoice
        },
        holder: dto.holder,
        paymentDate: dto.paymentDate,
        paymentAmount: dto.paymentAmount,
        paymentMethod: dto.paymentMethod,
        accountOrReference: dto.accountOrReference,
      };

      // Submit to SII
      return await this.submissionService.submitPayments(
        dto.holder,
        dto.fiscalYear,
        dto.period,
        [payment],
        certificate,
        certificateKey,
        certificatePassword,
      );
    } catch (error) {
      this.logger.error(
        `Failed to submit payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Query invoices
   */
  async queryInvoices(
    dto: QueryInvoicesDto,
    certificatePath: string,
    certificateKeyPath: string,
    certificatePassword?: string,
  ): Promise<SiiQueryResponse> {
    try {
      this.logger.log(`Querying invoices for ${dto.holder.nif}`);

      // Load certificates
      const certificate = await this.loadCertificate(certificatePath);
      const certificateKey = await this.loadCertificate(certificateKeyPath);

      // Build query request
      const soapEnvelope = this.xmlBuilder.buildQueryRequest(
        dto.holder,
        dto.fiscalYear,
        dto.period,
        dto.invoiceNumber,
        dto.dateFrom,
      );

      // Send request
      const xmlResponse = await this.soapClient.queryInvoices(
        soapEnvelope,
        certificate,
        certificateKey,
        certificatePassword,
      );

      // Parse response
      return this.parseQueryResponse(xmlResponse);
    } catch (error) {
      this.logger.error(
        `Failed to query invoices: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get submission status
   */
  async getSubmissionStatus(
    dto: GetSubmissionStatusDto,
  ): Promise<SiiStatusResponse> {
    try {
      this.logger.log(`Getting status for submission ${dto.submissionId}`);

      // Check cache first
      const cached = await this.submissionService.getSubmissionStatus(
        dto.submissionId,
      );

      if (!cached) {
        throw new NotFoundException(
          `Submission ${dto.submissionId} not found`,
        );
      }

      return {
        success: true,
        timestamp: new Date(),
        submissionId: cached.submissionId,
        status: cached.status,
        submittedAt: new Date(cached.submittedAt),
        processedAt: cached.processedAt
          ? new Date(cached.processedAt)
          : undefined,
        csvReference: cached.csvReference,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get submission status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete/cancel invoice
   */
  async deleteInvoice(
    dto: DeleteInvoiceDto,
    certificatePath: string,
    certificateKeyPath: string,
    certificatePassword?: string,
  ): Promise<SiiInvoiceSubmissionResponse> {
    try {
      this.logger.log(
        `Deleting invoice ${dto.invoiceNumber} for ${dto.holder.nif}`,
      );

      // Load certificates
      const certificate = await this.loadCertificate(certificatePath);
      const certificateKey = await this.loadCertificate(certificateKeyPath);

      // Build delete request
      const soapEnvelope = this.xmlBuilder.buildDeleteRequest(
        dto.holder,
        dto.fiscalYear,
        dto.period,
        dto.invoiceNumber,
        dto.issueDate,
      );

      // Send request
      const xmlResponse = await this.soapClient.deleteInvoice(
        soapEnvelope,
        certificate,
        certificateKey,
        certificatePassword,
      );

      // Parse response
      return this.parseSubmissionResponse(xmlResponse);
    } catch (error) {
      this.logger.error(
        `Failed to delete invoice: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Convert DTO to SiiIssuedInvoice
   */
  private dtoToIssuedInvoice(
    dto: SubmitIssuedInvoiceDto,
  ): SiiIssuedInvoice {
    return {
      invoiceId: {
        invoiceNumber: dto.invoiceNumber,
        issueDate: dto.issueDate,
        invoiceType: dto.invoiceType,
      },
      issuer: dto.issuer,
      recipient: dto.recipient,
      operationType: dto.operationType,
      specialCircumstance: dto.specialCircumstance,
      invoiceDescription: dto.invoiceDescription,
      totalInvoiceAmount: dto.totalInvoiceAmount,
      vatLines: dto.vatLines,
      internalReference: dto.internalReference,
      externalReference: dto.externalReference,
      simplifiedInvoice: dto.simplifiedInvoice,
      issuedByThirdParty: dto.issuedByThirdParty,
      thirdPartyIssuer: dto.thirdPartyIssuer,
      rectification: dto.rectification,
      isCashBasis: dto.isCashBasis,
      collectionDate: dto.collectionDate,
      isIntracommunity: dto.isIntracommunity,
      destinationCountry: dto.destinationCountry,
      relatedInvoices: dto.relatedInvoices,
      remarks: dto.remarks,
    };
  }

  /**
   * Convert DTO to SiiReceivedInvoice
   */
  private dtoToReceivedInvoice(
    dto: SubmitReceivedInvoiceDto,
  ): SiiReceivedInvoice {
    return {
      invoiceId: {
        invoiceNumber: dto.invoiceNumber,
        issueDate: dto.issueDate,
        invoiceType: dto.invoiceType,
      },
      issuer: dto.issuer,
      recipient: dto.recipient,
      operationType: dto.operationType,
      specialCircumstance: dto.specialCircumstance,
      invoiceDescription: dto.invoiceDescription,
      totalInvoiceAmount: dto.totalInvoiceAmount,
      vatLines: dto.vatLines,
      deductibleAmount: dto.deductibleAmount,
      deductionPercentage: dto.deductionPercentage,
      internalReference: dto.internalReference,
      registrationDate: dto.registrationDate,
      isReverseCharge: dto.isReverseCharge,
      isIntracommunity: dto.isIntracommunity,
      originCountry: dto.originCountry,
      isImport: dto.isImport,
      duaReference: dto.duaReference,
      rectification: dto.rectification,
      relatedInvoices: dto.relatedInvoices,
      remarks: dto.remarks,
    };
  }

  /**
   * Load certificate from file
   */
  private async loadCertificate(path: string): Promise<Buffer> {
    try {
      return fs.readFileSync(path);
    } catch (error) {
      throw new BadRequestException(
        `Failed to load certificate from ${path}: ${error.message}`,
      );
    }
  }

  /**
   * Parse submission response (simplified)
   */
  private parseSubmissionResponse(
    xmlResponse: string,
  ): SiiInvoiceSubmissionResponse {
    const isSuccess = !xmlResponse.includes('soap:Fault');
    return {
      success: isSuccess,
      timestamp: new Date(),
      submissionId: isSuccess ? `SII-${Date.now()}` : undefined,
      acceptedCount: isSuccess ? 1 : 0,
      rejectedCount: isSuccess ? 0 : 1,
    };
  }

  /**
   * Parse query response (simplified)
   */
  private parseQueryResponse(xmlResponse: string): SiiQueryResponse {
    const isSuccess = !xmlResponse.includes('soap:Fault');
    return {
      success: isSuccess,
      timestamp: new Date(),
      invoices: [],
      totalRecords: 0,
    };
  }
}
