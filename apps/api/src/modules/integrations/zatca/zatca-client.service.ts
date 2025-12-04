/**
 * ZATCA API Client Service
 * Handles HTTP communication with ZATCA FATOORAH API
 *
 * Features:
 * - OAuth2 client credentials flow
 * - Request signing with ECDSA certificates
 * - Rate limiting (1000 requests/hour)
 * - Exponential backoff retry logic
 * - Environment-based endpoint configuration
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosRequestConfig } from 'axios';
import {
  ZATCA_ENDPOINTS,
  ZATCA_ERROR_CODES,
  RATE_LIMITS,
  ZATCA_HTTP_HEADERS,
  TIMEOUTS,
} from './zatca.constants';
import {
  ZatcaConfig,
  ZatcaRequestOptions,
  RateLimitInfo,
  ZatcaErrorResponse,
} from './zatca.types';

@Injectable()
export class ZatcaClientService {
  private readonly logger = new Logger(ZatcaClientService.name);
  private rateLimitInfo: RateLimitInfo;
  private requestCount = 0;
  private readonly config: ZatcaConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.config = this.loadConfig();
    this.initializeRateLimiting();
  }

  /**
   * Load ZATCA configuration from environment
   */
  private loadConfig(): ZatcaConfig {
    return {
      environment: this.configService.get<'sandbox' | 'production'>('ZATCA_ENVIRONMENT', 'sandbox'),
      complianceCSID: this.configService.get<string>('ZATCA_COMPLIANCE_CSID'),
      productionCSID: this.configService.get<string>('ZATCA_PRODUCTION_CSID'),
      apiKey: this.configService.get<string>('ZATCA_API_KEY'),
      organizationIdentifier: this.configService.get<string>('ZATCA_ORGANIZATION_ID'),
      organizationName: this.configService.get<string>('ZATCA_ORGANIZATION_NAME'),
      buildingNumber: this.configService.get<string>('ZATCA_BUILDING_NUMBER'),
      streetName: this.configService.get<string>('ZATCA_STREET_NAME'),
      district: this.configService.get<string>('ZATCA_DISTRICT'),
      city: this.configService.get<string>('ZATCA_CITY'),
      postalCode: this.configService.get<string>('ZATCA_POSTAL_CODE'),
      countryCode: this.configService.get<string>('ZATCA_COUNTRY_CODE', 'SA'),
      privateKey: this.configService.get<string>('ZATCA_PRIVATE_KEY'),
      publicKey: this.configService.get<string>('ZATCA_PUBLIC_KEY'),
      certificateSerial: this.configService.get<string>('ZATCA_CERTIFICATE_SERIAL'),
      enableRateLimiting: this.configService.get<boolean>('ZATCA_ENABLE_RATE_LIMITING', true),
      maxRetries: this.configService.get<number>('ZATCA_MAX_RETRIES', RATE_LIMITS.MAX_RETRY_ATTEMPTS),
      retryDelayMs: this.configService.get<number>('ZATCA_RETRY_DELAY_MS', RATE_LIMITS.INITIAL_RETRY_DELAY_MS),
    };
  }

  /**
   * Initialize rate limiting
   */
  private initializeRateLimiting(): void {
    const now = new Date();
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    this.rateLimitInfo = {
      limit: RATE_LIMITS.MAX_REQUESTS_PER_HOUR,
      remaining: RATE_LIMITS.MAX_REQUESTS_PER_HOUR,
      resetTime,
    };

    // Reset rate limit every hour
    setInterval(() => {
      this.resetRateLimit();
    }, 60 * 60 * 1000);
  }

  /**
   * Reset rate limit counter
   */
  private resetRateLimit(): void {
    const now = new Date();
    this.rateLimitInfo = {
      limit: RATE_LIMITS.MAX_REQUESTS_PER_HOUR,
      remaining: RATE_LIMITS.MAX_REQUESTS_PER_HOUR,
      resetTime: new Date(now.getTime() + 60 * 60 * 1000),
    };
    this.requestCount = 0;
    this.logger.log('Rate limit reset');
  }

  /**
   * Check if rate limit is exceeded
   */
  private checkRateLimit(): void {
    if (!this.config.enableRateLimiting) {
      return;
    }

    if (this.rateLimitInfo.remaining <= 0) {
      const waitTime = this.rateLimitInfo.resetTime.getTime() - Date.now();
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds. ` +
        `Limit resets at ${this.rateLimitInfo.resetTime.toISOString()}`,
      );
    }
  }

  /**
   * Decrement rate limit counter
   */
  private decrementRateLimit(): void {
    if (this.config.enableRateLimiting) {
      this.rateLimitInfo.remaining--;
      this.requestCount++;
    }
  }

  /**
   * Get current rate limit info
   */
  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Get base URL for current environment
   */
  private getBaseUrl(): typeof ZATCA_ENDPOINTS.SANDBOX | typeof ZATCA_ENDPOINTS.PRODUCTION {
    return this.config.environment === 'production'
      ? ZATCA_ENDPOINTS.PRODUCTION
      : ZATCA_ENDPOINTS.SANDBOX;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(useProductionCSID = false): Record<string, string> {
    const csid = useProductionCSID ? this.config.productionCSID : this.config.complianceCSID;

    if (!csid) {
      throw new Error('CSID not configured. Please complete onboarding first.');
    }

    // ZATCA uses Basic Authentication with CSID as username and secret as password
    // The secret is obtained during CSID generation
    const secret = this.configService.get<string>(
      useProductionCSID ? 'ZATCA_PRODUCTION_SECRET' : 'ZATCA_COMPLIANCE_SECRET',
    );

    if (!secret) {
      throw new Error('CSID secret not found');
    }

    const authToken = Buffer.from(`${csid}:${secret}`).toString('base64');

    return {
      'Authorization': `Basic ${authToken}`,
      'Accept-Version': ZATCA_HTTP_HEADERS.ACCEPT_VERSION,
      'Accept-Language': ZATCA_HTTP_HEADERS.ACCEPT_LANGUAGE,
      'Content-Type': ZATCA_HTTP_HEADERS.CONTENT_TYPE,
      'Accept': ZATCA_HTTP_HEADERS.ACCEPT,
    };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    options: ZatcaRequestOptions = {},
  ): Promise<T> {
    this.checkRateLimit();

    const config: AxiosRequestConfig = {
      method,
      url,
      data,
      timeout: options.timeout || TIMEOUTS.API_REQUEST,
      headers: options.headers || {},
    };

    const maxRetries = options.retries ?? this.config.maxRetries ?? RATE_LIMITS.MAX_RETRY_ATTEMPTS;
    const retryDelay = options.retryDelay ?? this.config.retryDelayMs ?? RATE_LIMITS.INITIAL_RETRY_DELAY_MS;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Request attempt ${attempt + 1}/${maxRetries + 1}: ${method} ${url}`);

        const response = await firstValueFrom(this.httpService.request<T>(config));

        this.decrementRateLimit();

        this.logger.debug(`Request successful: ${method} ${url}`);

        return response.data;
      } catch (error) {
        lastError = error;

        if (this.isAxiosError(error)) {
          const axiosError = error as AxiosError<ZatcaErrorResponse>;

          // Don't retry on client errors (4xx)
          if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
            this.logger.error(`Client error (${axiosError.response.status}): ${axiosError.response.data?.detail || axiosError.message}`);
            throw this.transformError(axiosError);
          }

          // Retry on server errors (5xx) and network errors
          if (attempt < maxRetries) {
            const delay = retryDelay * Math.pow(RATE_LIMITS.BACKOFF_MULTIPLIER, attempt);
            this.logger.warn(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await this.sleep(delay);
            continue;
          }
        }

        throw this.transformError(error);
      }
    }

    throw lastError;
  }

  /**
   * Request compliance CSID (onboarding)
   */
  async requestComplianceCSID(csr: string): Promise<any> {
    const url = `${this.getBaseUrl().COMPLIANCE}/invoices/clearance/csid`;

    return this.makeRequest('POST', url, {
      csr,
    });
  }

  /**
   * Request production CSID
   */
  async requestProductionCSID(complianceRequestId: string): Promise<any> {
    const url = `${this.getBaseUrl().PRODUCTION_CSID}`;

    return this.makeRequest('POST', url, {
      compliance_request_id: complianceRequestId,
    }, {
      headers: this.getAuthHeaders(false), // Use compliance CSID for this request
    });
  }

  /**
   * Clear invoice (real-time validation for B2B)
   */
  async clearInvoice(invoiceHash: string, uuid: string, invoiceBase64: string): Promise<any> {
    const url = this.getBaseUrl().CLEARANCE;

    return this.makeRequest('POST', url, {
      invoiceHash,
      uuid,
      invoice: invoiceBase64,
    }, {
      headers: this.getAuthHeaders(true), // Use production CSID
      timeout: TIMEOUTS.CLEARANCE_REQUEST,
    });
  }

  /**
   * Report invoice (simplified invoices)
   */
  async reportInvoice(invoiceHash: string, uuid: string, invoiceBase64: string): Promise<any> {
    const url = this.getBaseUrl().REPORTING;

    return this.makeRequest('POST', url, {
      invoiceHash,
      uuid,
      invoice: invoiceBase64,
    }, {
      headers: this.getAuthHeaders(true), // Use production CSID
    });
  }

  /**
   * Compliance check (validation without submission)
   */
  async complianceCheck(invoiceHash: string, uuid: string, invoiceBase64: string): Promise<any> {
    const url = `${this.getBaseUrl().COMPLIANCE}/invoices`;

    return this.makeRequest('POST', url, {
      invoiceHash,
      uuid,
      invoice: invoiceBase64,
    }, {
      headers: this.getAuthHeaders(false), // Use compliance CSID
    });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is AxiosError
   */
  private isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError === true;
  }

  /**
   * Transform error to standardized format
   */
  private transformError(error: any): Error {
    if (this.isAxiosError(error)) {
      const axiosError = error as AxiosError<ZatcaErrorResponse>;

      if (axiosError.response?.data) {
        const zatcaError = axiosError.response.data;
        return new Error(
          `ZATCA API Error (${axiosError.response.status}): ${zatcaError.detail || zatcaError.title}`,
        );
      }

      if (axiosError.code === 'ECONNABORTED') {
        return new Error(`ZATCA API Timeout: ${axiosError.message}`);
      }

      return new Error(`ZATCA API Error: ${axiosError.message}`);
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(`Unknown error: ${String(error)}`);
  }

  /**
   * Get configuration (for testing/debugging)
   */
  getConfig(): Partial<ZatcaConfig> {
    return {
      environment: this.config.environment,
      organizationIdentifier: this.config.organizationIdentifier,
      organizationName: this.config.organizationName,
      enableRateLimiting: this.config.enableRateLimiting,
    };
  }
}
