import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  FTAEnvironment,
  FTA_ENDPOINTS,
  FTA_RATE_LIMITS,
  FTA_ERROR_CODES,
  RETRY_CONFIG,
  TIMEOUT_CONFIG,
} from './constants/uae.constants';
import {
  UAEConfig,
  FTATokenResponse,
  FTAResponse,
  UAEInvoiceSubmissionResult,
  UAEInvoiceStatusResult,
  UAETRNValidation,
  UBLInvoiceDocument,
  FTASubmissionOptions,
  RateLimitStatus,
} from './interfaces/uae.types';

/**
 * UAE FTA Client Service
 * Handles communication with Federal Tax Authority (FTA) API
 */
@Injectable()
export class UAEFTAClientService {
  private readonly logger = new Logger(UAEFTAClientService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private requestCount = 0;
  private requestWindowStart = Date.now();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get FTA configuration
   */
  private getConfig(): UAEConfig {
    return {
      environment: this.configService.get<FTAEnvironment>('UAE_FTA_ENVIRONMENT') || FTAEnvironment.SANDBOX,
      clientId: this.configService.get<string>('UAE_FTA_CLIENT_ID')!,
      clientSecret: this.configService.get<string>('UAE_FTA_CLIENT_SECRET')!,
      trn: this.configService.get<string>('UAE_FTA_TRN')!,
      companyName: this.configService.get<string>('UAE_FTA_COMPANY_NAME')!,
      enableRetry: this.configService.get<boolean>('UAE_FTA_ENABLE_RETRY', true),
      maxRetries: this.configService.get<number>('UAE_FTA_MAX_RETRIES', RETRY_CONFIG.MAX_RETRIES),
      timeout: this.configService.get<number>('UAE_FTA_TIMEOUT', TIMEOUT_CONFIG.SUBMIT),
    };
  }

  /**
   * Get FTA API base URL
   */
  private getBaseUrl(): string {
    const config = this.getConfig();
    return FTA_ENDPOINTS[config.environment].baseUrl;
  }

  /**
   * Get OAuth2 access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    this.logger.log('Requesting new FTA access token');

    const config = this.getConfig();
    const url = `${this.getBaseUrl()}${FTA_ENDPOINTS[config.environment].auth}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<FTATokenResponse>(
          url,
          {
            grant_type: 'client_credentials',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            scope: 'einvoicing',
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: TIMEOUT_CONFIG.AUTH,
          },
        ),
      );

      this.accessToken = response.data.access_token;

      // Set token expiration (subtract 5 minutes for safety margin)
      const expiresIn = response.data.expires_in - 300;
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      this.logger.log('Successfully obtained FTA access token');
      return this.accessToken;
    } catch (error) {
      this.logger.error(`Failed to obtain FTA access token: ${error.message}`);
      throw new HttpException(
        {
          code: 'AUTH_001',
          message: 'Failed to authenticate with FTA',
          error: error.response?.data || error.message,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute

    // Reset counter if window has passed
    if (now - this.requestWindowStart >= windowDuration) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }

    // Check if limit exceeded
    if (this.requestCount >= FTA_RATE_LIMITS.REQUESTS_PER_MINUTE) {
      const waitTime = windowDuration - (now - this.requestWindowStart);
      this.logger.warn(`Rate limit exceeded, waiting ${waitTime}ms`);

      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Reset after waiting
      this.requestCount = 0;
      this.requestWindowStart = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Submit invoice to FTA
   */
  async submitInvoice(
    invoiceDocument: UBLInvoiceDocument,
    options: FTASubmissionOptions = {},
  ): Promise<UAEInvoiceSubmissionResult> {
    this.logger.log('Submitting invoice to FTA');

    await this.checkRateLimit();

    const config = this.getConfig();
    const endpoint = options.validateOnly
      ? FTA_ENDPOINTS[config.environment].validate
      : FTA_ENDPOINTS[config.environment].submit;

    const url = `${this.getBaseUrl()}${endpoint}`;

    try {
      const token = await this.getAccessToken();

      const response = await this.executeWithRetry(async () => {
        return await firstValueFrom(
          this.httpService.post<FTAResponse>(
            url,
            {
              invoiceXml: Buffer.from(invoiceDocument.xml).toString('base64'),
              hash: invoiceDocument.hash,
              clearanceRequired: options.clearanceRequired || false,
              notifyCustomer: options.notifyCustomer || false,
              language: options.language || 'en',
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              timeout: TIMEOUT_CONFIG.SUBMIT,
            },
          ),
        );
      });

      return {
        success: response.data.success,
        submissionId: response.data.submissionId,
        invoiceNumber: this.extractInvoiceNumber(invoiceDocument.xml),
        status: response.data.success ? 'SUBMITTED' : 'REJECTED',
        validationErrors: response.data.errors,
        validationWarnings: response.data.warnings,
        submittedAt: new Date(),
        clearanceStatus: response.data.data?.clearanceStatus || 'PENDING',
      };
    } catch (error) {
      this.logger.error(`Invoice submission failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(submissionId: string): Promise<UAEInvoiceStatusResult> {
    this.logger.log(`Fetching invoice status for submission ${submissionId}`);

    await this.checkRateLimit();

    const config = this.getConfig();
    const url = `${this.getBaseUrl()}${FTA_ENDPOINTS[config.environment].status}/${submissionId}`;

    try {
      const token = await this.getAccessToken();

      const response = await this.executeWithRetry(async () => {
        return await firstValueFrom(
          this.httpService.get<FTAResponse>(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            timeout: TIMEOUT_CONFIG.STATUS,
          }),
        );
      });

      return {
        invoiceNumber: response.data.data.invoiceNumber,
        submissionId,
        status: response.data.data.status,
        submittedAt: new Date(response.data.data.submittedAt),
        processedAt: response.data.data.processedAt ? new Date(response.data.data.processedAt) : undefined,
        clearanceStatus: response.data.data.clearanceStatus,
        errors: response.data.errors,
        warnings: response.data.warnings,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch invoice status: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(submissionId: string, reason: string): Promise<boolean> {
    this.logger.log(`Cancelling invoice submission ${submissionId}`);

    await this.checkRateLimit();

    const config = this.getConfig();
    const url = `${this.getBaseUrl()}${FTA_ENDPOINTS[config.environment].cancel}`;

    try {
      const token = await this.getAccessToken();

      const response = await this.executeWithRetry(async () => {
        return await firstValueFrom(
          this.httpService.post<FTAResponse>(
            url,
            {
              submissionId,
              reason,
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              timeout: TIMEOUT_CONFIG.SUBMIT,
            },
          ),
        );
      });

      return response.data.success;
    } catch (error) {
      this.logger.error(`Invoice cancellation failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Validate TRN with FTA
   */
  async validateTRNWithFTA(trn: string): Promise<UAETRNValidation> {
    this.logger.log(`Validating TRN with FTA: ${trn}`);

    await this.checkRateLimit();

    const config = this.getConfig();
    const url = `${this.getBaseUrl()}${FTA_ENDPOINTS[config.environment].trnValidation}`;

    try {
      const token = await this.getAccessToken();

      const response = await this.executeWithRetry(async () => {
        return await firstValueFrom(
          this.httpService.post<FTAResponse>(
            url,
            { trn },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              timeout: TIMEOUT_CONFIG.VALIDATE,
            },
          ),
        );
      });

      return {
        trn,
        valid: response.data.success,
        registered: response.data.data?.registered,
        companyName: response.data.data?.companyName,
        registrationDate: response.data.data?.registrationDate
          ? new Date(response.data.data.registrationDate)
          : undefined,
        status: response.data.data?.status,
        errors: response.data.errors?.map((e) => e.message),
      };
    } catch (error) {
      this.logger.error(`TRN validation failed: ${error.message}`);

      // Return invalid result on error
      return {
        trn,
        valid: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0,
  ): Promise<T> {
    const config = this.getConfig();
    const maxRetries = config.maxRetries || RETRY_CONFIG.MAX_RETRIES;

    try {
      return await operation();
    } catch (error) {
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        if (error.response.status !== 429) {
          throw error;
        }
      }

      // Retry if enabled and not exceeded max retries
      if (config.enableRetry && retryCount < maxRetries) {
        const delay = this.calculateBackoff(retryCount);
        this.logger.warn(`Retry ${retryCount + 1}/${maxRetries} after ${delay}ms`);

        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.executeWithRetry(operation, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const delay = RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount);
    return Math.min(delay, RETRY_CONFIG.MAX_DELAY);
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): HttpException {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Map FTA error codes to appropriate HTTP status
      let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

      if (status === 400) {
        httpStatus = HttpStatus.BAD_REQUEST;
      } else if (status === 401) {
        httpStatus = HttpStatus.UNAUTHORIZED;
      } else if (status === 403) {
        httpStatus = HttpStatus.FORBIDDEN;
      } else if (status === 404) {
        httpStatus = HttpStatus.NOT_FOUND;
      } else if (status === 429) {
        httpStatus = HttpStatus.TOO_MANY_REQUESTS;
      }

      return new HttpException(
        {
          code: data.errors?.[0]?.code || 'FTA_ERROR',
          message: data.errors?.[0]?.message || 'FTA API error',
          errors: data.errors,
        },
        httpStatus,
      );
    }

    return new HttpException(
      {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error occurred',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Extract invoice number from XML
   */
  private extractInvoiceNumber(xml: string): string {
    const match = xml.match(/<cbc:ID>([^<]+)<\/cbc:ID>/);
    return match ? match[1] : 'UNKNOWN';
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitStatus {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute
    const elapsed = now - this.requestWindowStart;
    const remaining = Math.max(0, FTA_RATE_LIMITS.REQUESTS_PER_MINUTE - this.requestCount);
    const resetAt = new Date(this.requestWindowStart + windowDuration);

    return {
      remaining,
      limit: FTA_RATE_LIMITS.REQUESTS_PER_MINUTE,
      resetAt,
      retryAfter: elapsed < windowDuration ? Math.ceil((windowDuration - elapsed) / 1000) : 0,
    };
  }
}
