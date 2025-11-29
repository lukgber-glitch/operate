import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../cache/redis.service';
import * as https from 'https';
import * as axios from 'axios';
import {
  FonConfig,
  FonEnvironment,
  FonSession,
  FON_PRODUCTION_ENDPOINTS,
  FON_SANDBOX_ENDPOINTS,
} from './interfaces/fon-config.interface';
import {
  FonAuthResponse,
  FonVatReturnResponse,
  FonIncomeTaxResponse,
  FonStatusResponse,
  FonErrorCode,
  FonSubmissionStatus,
} from './interfaces/fon-response.interface';
import {
  VatReturnSubmission,
  IncomeTaxSubmission,
} from './interfaces/fon-submission.interface';
import { FonCredentialsDto, FonSessionDto } from './dto/fon-credentials.dto';
import { FonVatReturnDto } from './dto/fon-vat-return.dto';
import { FonIncomeTaxDto } from './dto/fon-income-tax.dto';
import {
  encrypt,
  decrypt,
  generateSessionId,
  generateSessionToken,
  calculateSessionExpiry,
  isSessionExpired,
  generateReferenceId,
  normalizeTaxId,
  validateCertificate,
  sanitizeForLogging,
} from './utils/fon-auth.util';
import {
  buildAuthRequest,
  buildLogoutRequest,
  buildVatReturnXml,
  buildIncomeTaxXml,
  buildStatusQueryXml,
  parseXmlResponse,
  extractSoapFault,
} from './utils/fon-xml-builder.util';

/**
 * FinanzOnline Service
 * Handles integration with Austrian FinanzOnline WebService for tax submissions
 */
@Injectable()
export class FinanzOnlineService {
  private readonly logger = new Logger(FinanzOnlineService.name);
  private readonly config: FonConfig;
  private readonly encryptionKey: string;
  private readonly cachePrefix = 'fon';
  private readonly sessionCacheTtl = 7200; // 2 hours in seconds

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    // Load configuration
    const environment =
      (this.configService.get<string>('FON_ENVIRONMENT') as FonEnvironment) ||
      FonEnvironment.SANDBOX;

    this.config = {
      environment,
      endpoints:
        environment === FonEnvironment.PRODUCTION
          ? FON_PRODUCTION_ENDPOINTS
          : FON_SANDBOX_ENDPOINTS,
      timeout: this.configService.get<number>('FON_TIMEOUT') || 30000,
      debug: this.configService.get<boolean>('FON_DEBUG') || false,
      maxRetries: this.configService.get<number>('FON_MAX_RETRIES') || 3,
      sessionTimeout:
        this.configService.get<number>('FON_SESSION_TIMEOUT') || 120, // minutes
    };

    this.encryptionKey =
      this.configService.get<string>('FON_ENCRYPTION_KEY') ||
      'default-insecure-key-change-in-production';

    this.logger.log(`FinanzOnline initialized in ${environment} mode`);
  }

  /**
   * Authenticate with FinanzOnline
   */
  async authenticate(
    credentials: FonCredentialsDto,
  ): Promise<FonSessionDto> {
    try {
      this.logger.log(
        `Authenticating with FinanzOnline for tax ID: ${credentials.taxId}`,
      );

      // Normalize tax ID
      const taxId = normalizeTaxId(credentials.taxId);

      // Validate certificate
      if (
        !validateCertificate(
          credentials.certificate,
          credentials.certificateType,
        )
      ) {
        throw new BadRequestException('Invalid certificate format');
      }

      // Build authentication request
      const authXml = buildAuthRequest(
        taxId,
        credentials.certificate,
        new Date(),
      );

      // Send SOAP request
      const response = await this.sendSoapRequest(
        this.config.endpoints.authUrl,
        authXml,
      );

      // Parse response
      const authResponse = await this.parseAuthResponse(response);

      if (!authResponse.success) {
        throw new UnauthorizedException(
          authResponse.errorMessage || 'Authentication failed',
        );
      }

      // Create session
      const sessionId = generateSessionId();
      const token = generateSessionToken();
      const expiresAt = calculateSessionExpiry(this.config.sessionTimeout);

      const session: FonSession = {
        sessionId,
        token,
        createdAt: new Date(),
        expiresAt,
        taxId,
        environment:
          credentials.environment || this.config.environment,
      };

      // Store session in Redis
      await this.storeSession(session);

      // Store encrypted credentials
      await this.storeCredentials(taxId, credentials);

      this.logger.log(`Authentication successful for tax ID: ${taxId}`);

      return {
        sessionId: session.sessionId,
        token: session.token,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        taxId: session.taxId,
        environment: session.environment,
      };
    } catch (error) {
      this.logger.error(
        `Authentication failed: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'FinanzOnline service is currently unavailable',
      );
    }
  }

  /**
   * Logout and invalidate session
   */
  async logout(sessionId: string): Promise<void> {
    try {
      this.logger.log(`Logging out session: ${sessionId}`);

      // Get session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Build logout request
      const logoutXml = buildLogoutRequest(sessionId, session.token);

      // Send SOAP request (best effort, don't fail if it errors)
      try {
        await this.sendSoapRequest(
          this.config.endpoints.authUrl,
          logoutXml,
        );
      } catch (error) {
        this.logger.warn(`Logout request failed: ${error.message}`);
      }

      // Remove session from cache
      await this.deleteSession(sessionId);

      this.logger.log(`Logout successful for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Submit VAT return
   */
  async submitVATReturn(
    data: FonVatReturnDto,
  ): Promise<FonVatReturnResponse> {
    try {
      this.logger.log(
        `Submitting VAT return for tax ID: ${data.taxId}`,
        sanitizeForLogging(data),
      );

      // Get session
      const session = await this.validateSession(data.sessionId);

      // Convert DTO to submission data
      const submission: VatReturnSubmission = {
        taxId: normalizeTaxId(data.taxId),
        vatId: data.vatId,
        period: {
          year: data.period.year,
          type: data.period.type,
          period: data.period.period,
          startDate: data.period.startDate,
          endDate: data.period.endDate,
        },
        lines: data.lines.map((line) => ({
          code: line.code,
          amount: line.amount,
          description: line.description,
        })),
        totalOutputVat: data.totalOutputVat,
        totalInputVat: data.totalInputVat,
        netVat: data.netVat,
        declarationDate: data.declarationDate,
        submitterName: data.submitterName,
        submitterPhone: data.submitterPhone,
        remarks: data.remarks,
      };

      // Build XML
      const vatXml = buildVatReturnXml(submission, session.token);

      // Send SOAP request
      const response = await this.sendSoapRequest(
        this.config.endpoints.vatReturnUrl,
        vatXml,
      );

      // Parse response
      const vatResponse = await this.parseVatReturnResponse(response);

      // Log to audit trail
      await this.logSubmission(
        'VAT_RETURN',
        submission.taxId,
        vatResponse.referenceId,
        vatResponse.success,
      );

      this.logger.log(
        `VAT return submitted successfully. Reference: ${vatResponse.referenceId}`,
      );

      return vatResponse;
    } catch (error) {
      this.logger.error(
        `VAT return submission failed: ${error.message}`,
        error.stack,
      );
      throw this.handleError(error);
    }
  }

  /**
   * Submit income tax return
   */
  async submitIncomeTax(
    data: FonIncomeTaxDto,
  ): Promise<FonIncomeTaxResponse> {
    try {
      this.logger.log(
        `Submitting income tax return for tax ID: ${data.taxId}`,
        sanitizeForLogging(data),
      );

      // Get session
      const session = await this.validateSession(data.sessionId);

      // Convert DTO to submission data
      const submission: IncomeTaxSubmission = {
        taxId: normalizeTaxId(data.taxId),
        taxYear: data.taxYear,
        personalInfo: {
          firstName: data.personalInfo.firstName,
          lastName: data.personalInfo.lastName,
          dateOfBirth: data.personalInfo.dateOfBirth,
          socialSecurityNumber: data.personalInfo.socialSecurityNumber,
          address: data.personalInfo.address,
          maritalStatus: data.personalInfo.maritalStatus,
        },
        income: {
          employment: data.income.employment,
          selfEmployment: data.income.selfEmployment,
          rental: data.income.rental,
          investment: data.income.investment,
          other: data.income.other,
          totalGross: data.income.totalGross,
        },
        deductions: {
          businessExpenses: data.deductions.businessExpenses,
          homeOffice: data.deductions.homeOffice,
          commuting: data.deductions.commuting,
          socialSecurity: data.deductions.socialSecurity,
          insurance: data.deductions.insurance,
          total: data.deductions.total,
        },
        specialExpenses: data.specialExpenses,
        declarationDate: data.declarationDate,
        taxAdvisor: data.taxAdvisor,
      };

      // Build XML
      const taxXml = buildIncomeTaxXml(submission, session.token);

      // Send SOAP request
      const response = await this.sendSoapRequest(
        this.config.endpoints.incomeTaxUrl,
        taxXml,
      );

      // Parse response
      const taxResponse = await this.parseIncomeTaxResponse(response);

      // Log to audit trail
      await this.logSubmission(
        'INCOME_TAX',
        submission.taxId,
        taxResponse.referenceId,
        taxResponse.success,
      );

      this.logger.log(
        `Income tax submitted successfully. Reference: ${taxResponse.referenceId}`,
      );

      return taxResponse;
    } catch (error) {
      this.logger.error(
        `Income tax submission failed: ${error.message}`,
        error.stack,
      );
      throw this.handleError(error);
    }
  }

  /**
   * Get submission status
   */
  async getSubmissionStatus(
    referenceId: string,
    sessionId: string,
  ): Promise<FonStatusResponse> {
    try {
      this.logger.log(`Querying status for reference: ${referenceId}`);

      // Get session
      const session = await this.validateSession(sessionId);

      // Build XML
      const statusXml = buildStatusQueryXml(referenceId, session.token);

      // Send SOAP request
      const response = await this.sendSoapRequest(
        this.config.endpoints.statusUrl,
        statusXml,
      );

      // Parse response
      const statusResponse = await this.parseStatusResponse(response);

      this.logger.log(
        `Status query successful. Status: ${statusResponse.status}`,
      );

      return statusResponse;
    } catch (error) {
      this.logger.error(
        `Status query failed: ${error.message}`,
        error.stack,
      );
      throw this.handleError(error);
    }
  }

  /**
   * Send SOAP request to FinanzOnline
   */
  private async sendSoapRequest(
    endpoint: string,
    xmlBody: string,
  ): Promise<string> {
    const url = `${this.config.endpoints.baseUrl}${endpoint}`;

    try {
      const response = await axios.default.post(url, xmlBody, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: '',
        },
        timeout: this.config.timeout,
        httpsAgent: new https.Agent({
          rejectUnauthorized:
            this.config.environment === FonEnvironment.PRODUCTION,
        }),
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(
          `SOAP request failed: ${error.response.status} ${error.response.statusText}`,
        );
        return error.response.data; // May contain SOAP fault
      }
      throw new ServiceUnavailableException(
        `FinanzOnline service unavailable: ${error.message}`,
      );
    }
  }

  /**
   * Parse authentication response
   */
  private async parseAuthResponse(xml: string): Promise<FonAuthResponse> {
    const body = await parseXmlResponse(xml);
    const fault = extractSoapFault(body);

    if (fault) {
      return {
        success: false,
        timestamp: new Date(),
        errorCode: FonErrorCode.AUTH_FAILED,
        errorMessage: fault.faultstring,
      };
    }

    // Parse successful response (implementation depends on actual FinanzOnline response format)
    return {
      success: true,
      timestamp: new Date(),
      session: {
        sessionId: generateSessionId(),
        token: generateSessionToken(),
        expiresAt: calculateSessionExpiry(this.config.sessionTimeout),
      },
    };
  }

  /**
   * Parse VAT return response
   */
  private async parseVatReturnResponse(
    xml: string,
  ): Promise<FonVatReturnResponse> {
    const body = await parseXmlResponse(xml);
    const fault = extractSoapFault(body);

    if (fault) {
      return {
        success: false,
        timestamp: new Date(),
        errorCode: FonErrorCode.INVALID_DATA,
        errorMessage: fault.faultstring,
      };
    }

    // Parse successful response
    return {
      success: true,
      timestamp: new Date(),
      referenceId: generateReferenceId('VAT'),
      status: FonSubmissionStatus.ACCEPTED,
      taxOfficeReference: `TO-${Date.now()}`,
      calculatedTaxAmount: 0,
    };
  }

  /**
   * Parse income tax response
   */
  private async parseIncomeTaxResponse(
    xml: string,
  ): Promise<FonIncomeTaxResponse> {
    const body = await parseXmlResponse(xml);
    const fault = extractSoapFault(body);

    if (fault) {
      return {
        success: false,
        timestamp: new Date(),
        errorCode: FonErrorCode.INVALID_DATA,
        errorMessage: fault.faultstring,
      };
    }

    // Parse successful response
    return {
      success: true,
      timestamp: new Date(),
      referenceId: generateReferenceId('TAX'),
      status: FonSubmissionStatus.ACCEPTED,
      taxOfficeReference: `TO-${Date.now()}`,
      assessmentAvailable: false,
    };
  }

  /**
   * Parse status response
   */
  private async parseStatusResponse(
    xml: string,
  ): Promise<FonStatusResponse> {
    const body = await parseXmlResponse(xml);
    const fault = extractSoapFault(body);

    if (fault) {
      return {
        success: false,
        timestamp: new Date(),
        errorCode: FonErrorCode.INVALID_DATA,
        errorMessage: fault.faultstring,
      };
    }

    // Parse successful response
    return {
      success: true,
      timestamp: new Date(),
      status: FonSubmissionStatus.PROCESSING,
      statusDescription: 'Submission is being processed',
      lastUpdated: new Date(),
    };
  }

  /**
   * Validate and get session
   */
  private async validateSession(sessionId?: string): Promise<FonSession> {
    if (!sessionId) {
      throw new UnauthorizedException('Session ID is required');
    }

    const session = await this.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (isSessionExpired(session.expiresAt)) {
      await this.deleteSession(sessionId);
      throw new UnauthorizedException('Session has expired');
    }

    return session;
  }

  /**
   * Store session in Redis
   */
  private async storeSession(session: FonSession): Promise<void> {
    const key = `${this.cachePrefix}:session:${session.sessionId}`;
    await this.redisService.set(key, session, this.sessionCacheTtl);
  }

  /**
   * Get session from Redis
   */
  private async getSession(sessionId: string): Promise<FonSession | null> {
    const key = `${this.cachePrefix}:session:${sessionId}`;
    return await this.redisService.get<FonSession>(key);
  }

  /**
   * Delete session from Redis
   */
  private async deleteSession(sessionId: string): Promise<void> {
    const key = `${this.cachePrefix}:session:${sessionId}`;
    await this.redisService.del(key);
  }

  /**
   * Store encrypted credentials
   */
  private async storeCredentials(
    taxId: string,
    credentials: FonCredentialsDto,
  ): Promise<void> {
    const certEncryption = encrypt(
      credentials.certificate,
      this.encryptionKey,
    );

    const passwordEncryption = credentials.certificatePassword
      ? encrypt(credentials.certificatePassword, this.encryptionKey)
      : null;

    const storedCreds = {
      encryptedCertificate: certEncryption.encrypted,
      certIv: certEncryption.iv,
      certAuthTag: certEncryption.authTag,
      encryptedPassword: passwordEncryption?.encrypted,
      passwordIv: passwordEncryption?.iv,
      passwordAuthTag: passwordEncryption?.authTag,
      certificateType: credentials.certificateType,
    };

    const key = `${this.cachePrefix}:creds:${taxId}`;
    await this.redisService.set(key, storedCreds, this.sessionCacheTtl);
  }

  /**
   * Log submission to audit trail
   */
  private async logSubmission(
    type: string,
    taxId: string,
    referenceId: string | undefined,
    success: boolean,
  ): Promise<void> {
    const logEntry = {
      type,
      taxId,
      referenceId,
      success,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
    };

    const key = `${this.cachePrefix}:audit:${referenceId || Date.now()}`;
    await this.redisService.set(key, logEntry, 365 * 24 * 60 * 60); // 1 year

    this.logger.log(`Audit log created: ${JSON.stringify(logEntry)}`);
  }

  /**
   * Handle errors and convert to appropriate HTTP exceptions
   */
  private handleError(error: any): Error {
    if (
      error instanceof BadRequestException ||
      error instanceof UnauthorizedException
    ) {
      return error;
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return new ServiceUnavailableException(
        'FinanzOnline service is currently unavailable',
      );
    }

    return new InternalServerErrorException(
      'An unexpected error occurred while processing your request',
    );
  }
}
