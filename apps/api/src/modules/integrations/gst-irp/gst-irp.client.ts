/**
 * GST IRP Client
 *
 * HTTP client for communicating with GSP (GST Suvidha Provider) APIs
 * Handles authentication, rate limiting, retries, and TLS configuration
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';
import { createHash, createSign } from 'crypto';
import {
  IrpEnvironment,
  GspConfig,
  IrpAuthRequest,
  IrpAuthResponse,
  IrpApiResponse,
  IrpErrorResponse,
} from './gst-irp.types';
import {
  IRP_SANDBOX_ENDPOINTS,
  IRP_PRODUCTION_ENDPOINTS,
  TIMEOUT_CONFIG,
  RETRY_CONFIG,
  TLS_CONFIG,
  IRP_RATE_LIMITS,
  ERROR_MESSAGES,
} from './gst-irp.constants';

interface RateLimitState {
  requestsThisSecond: number;
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsToday: number;
  lastResetSecond: number;
  lastResetMinute: number;
  lastResetHour: number;
  lastResetDay: number;
}

@Injectable()
export class GstIrpClient {
  private readonly logger = new Logger(GstIrpClient.name);
  private authToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private readonly config: GspConfig;
  private readonly endpoints: typeof IRP_SANDBOX_ENDPOINTS;
  private readonly rateLimitState: RateLimitState;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Load configuration from environment
    this.config = {
      environment:
        (this.configService.get<string>('GST_IRP_ENVIRONMENT') as IrpEnvironment) ||
        IrpEnvironment.SANDBOX,
      gstin: this.configService.get<string>('GST_IRP_GSTIN', ''),
      username: this.configService.get<string>('GST_IRP_USERNAME', ''),
      password: this.configService.get<string>('GST_IRP_PASSWORD', ''),
      clientId: this.configService.get<string>('GST_IRP_CLIENT_ID', ''),
      clientSecret: this.configService.get<string>('GST_IRP_CLIENT_SECRET', ''),
      gspApiUrl: this.configService.get<string>('GST_IRP_API_URL', ''),
      certificatePath: this.configService.get<string>('GST_IRP_CERTIFICATE_PATH'),
      certificatePassword: this.configService.get<string>('GST_IRP_CERTIFICATE_PASSWORD'),
      timeout: this.configService.get<number>('GST_IRP_TIMEOUT', TIMEOUT_CONFIG.DEFAULT),
      maxRetries: this.configService.get<number>('GST_IRP_MAX_RETRIES', RETRY_CONFIG.MAX_RETRIES),
    };

    // Select endpoints based on environment
    this.endpoints =
      this.config.environment === IrpEnvironment.PRODUCTION
        ? IRP_PRODUCTION_ENDPOINTS
        : IRP_SANDBOX_ENDPOINTS;

    // Use custom API URL if provided, otherwise use default
    if (this.config.gspApiUrl) {
      this.endpoints.BASE_URL = this.config.gspApiUrl;
    }

    // Initialize rate limit state
    this.rateLimitState = {
      requestsThisSecond: 0,
      requestsThisMinute: 0,
      requestsThisHour: 0,
      requestsToday: 0,
      lastResetSecond: Date.now(),
      lastResetMinute: Date.now(),
      lastResetHour: Date.now(),
      lastResetDay: Date.now(),
    };

    this.logger.log(`GST IRP Client initialized for ${this.config.environment} environment`);
  }

  /**
   * Authenticate with GSP and obtain access token
   */
  async authenticate(): Promise<string> {
    // Check if token is still valid
    if (this.authToken && Date.now() < this.tokenExpiresAt) {
      return this.authToken;
    }

    this.logger.log('Authenticating with GSP...');

    const authRequest: IrpAuthRequest = {
      username: this.config.username,
      password: this.config.password,
      gstin: this.config.gstin,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
    };

    try {
      const response = await this.makeRequest<IrpAuthResponse>(
        'POST',
        this.endpoints.AUTH,
        authRequest,
        TIMEOUT_CONFIG.AUTH,
        false, // Don't use auth for auth request
      );

      this.authToken = response.access_token;
      // Set expiry to 90% of actual expiry time for safety
      this.tokenExpiresAt = Date.now() + response.expires_in * 1000 * 0.9;

      this.logger.log('Authentication successful');
      return this.authToken;
    } catch (error) {
      this.logger.error('Authentication failed', error);
      throw new Error(ERROR_MESSAGES.AUTHENTICATION_FAILED);
    }
  }

  /**
   * Make HTTP request to GSP API with retry logic
   */
  async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    timeout: number = this.config.timeout,
    useAuth: boolean = true,
    retryCount: number = 0,
  ): Promise<T> {
    // Check rate limits
    await this.checkRateLimit();

    const url = `${this.endpoints.BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Operate-CoachOS/1.0',
    };

    // Add authorization header if needed
    if (useAuth) {
      const token = await this.authenticate();
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add digital signature if certificate is configured
    if (this.config.certificatePath && data) {
      const signature = this.generateDigitalSignature(JSON.stringify(data));
      headers['X-Digital-Signature'] = signature;
    }

    // Configure HTTPS agent with TLS 1.3
    const httpsAgent = new https.Agent({
      minVersion: TLS_CONFIG.MIN_VERSION,
      ciphers: TLS_CONFIG.CIPHERS,
      rejectUnauthorized: TLS_CONFIG.REJECT_UNAUTHORIZED,
    });

    try {
      this.logger.debug(`${method} ${url}`);

      const response = await firstValueFrom(
        this.httpService.request<IrpApiResponse<T>>({
          method,
          url,
          data,
          headers,
          timeout,
          httpsAgent,
        }),
      );

      // Increment rate limit counters
      this.incrementRateLimit();

      // Handle API response
      if (response.data.status === 'error') {
        throw this.handleApiError(response.data.error);
      }

      return response.data.data as T;
    } catch (error) {
      // Check if error is retryable
      if (this.isRetryableError(error) && retryCount < this.config.maxRetries) {
        const delay = this.calculateRetryDelay(retryCount);
        this.logger.warn(`Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.config.maxRetries})`);

        await this.sleep(delay);
        return this.makeRequest<T>(method, endpoint, data, timeout, useAuth, retryCount + 1);
      }

      this.logger.error(`Request failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate digital signature for request
   */
  private generateDigitalSignature(data: string): string {
    try {
      // In production, this would use actual certificate
      // For now, we'll use a hash as placeholder
      const hash = createHash('sha256').update(data).digest('hex');
      return hash;

      // Actual implementation would be:
      // const sign = createSign('RSA-SHA256');
      // sign.update(data);
      // const privateKey = fs.readFileSync(this.config.certificatePath);
      // return sign.sign(privateKey, 'base64');
    } catch (error) {
      this.logger.error('Failed to generate digital signature', error);
      throw new Error(ERROR_MESSAGES.INVALID_SIGNATURE);
    }
  }

  /**
   * Check rate limits before making request
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset counters if time windows have passed
    if (now - this.rateLimitState.lastResetSecond >= 1000) {
      this.rateLimitState.requestsThisSecond = 0;
      this.rateLimitState.lastResetSecond = now;
    }

    if (now - this.rateLimitState.lastResetMinute >= 60000) {
      this.rateLimitState.requestsThisMinute = 0;
      this.rateLimitState.lastResetMinute = now;
    }

    if (now - this.rateLimitState.lastResetHour >= 3600000) {
      this.rateLimitState.requestsThisHour = 0;
      this.rateLimitState.lastResetHour = now;
    }

    if (now - this.rateLimitState.lastResetDay >= 86400000) {
      this.rateLimitState.requestsToday = 0;
      this.rateLimitState.lastResetDay = now;
    }

    // Check if we've exceeded any limits
    if (this.rateLimitState.requestsThisSecond >= IRP_RATE_LIMITS.requestsPerSecond) {
      const waitTime = 1000 - (now - this.rateLimitState.lastResetSecond);
      this.logger.warn(`Rate limit (per second) reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.rateLimitState.requestsThisSecond = 0;
      this.rateLimitState.lastResetSecond = Date.now();
    }

    if (this.rateLimitState.requestsThisMinute >= IRP_RATE_LIMITS.requestsPerMinute) {
      const waitTime = 60000 - (now - this.rateLimitState.lastResetMinute);
      this.logger.warn(`Rate limit (per minute) reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.rateLimitState.requestsThisMinute = 0;
      this.rateLimitState.lastResetMinute = Date.now();
    }

    if (this.rateLimitState.requestsThisHour >= IRP_RATE_LIMITS.requestsPerHour) {
      throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
    }

    if (this.rateLimitState.requestsToday >= IRP_RATE_LIMITS.dailyLimit) {
      throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
    }
  }

  /**
   * Increment rate limit counters
   */
  private incrementRateLimit(): void {
    this.rateLimitState.requestsThisSecond++;
    this.rateLimitState.requestsThisMinute++;
    this.rateLimitState.requestsThisHour++;
    this.rateLimitState.requestsToday++;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Check for retryable HTTP status codes
    if (error.response?.status && RETRY_CONFIG.RETRYABLE_STATUS_CODES.includes(error.response.status)) {
      return true;
    }

    // Check for retryable error codes
    if (error.code && RETRY_CONFIG.RETRYABLE_ERROR_CODES.includes(error.code)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = Math.min(
      RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount),
      RETRY_CONFIG.MAX_DELAY,
    );
    // Add jitter to avoid thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Handle API error response
   */
  private handleApiError(error: IrpErrorResponse): Error {
    this.logger.error(`API Error: ${error.errorCode} - ${error.errorMessage}`);

    if (error.errorDetails && error.errorDetails.length > 0) {
      const details = error.errorDetails.map(d => `${d.errorField}: ${d.errorMessage}`).join(', ');
      this.logger.error(`Error details: ${details}`);
    }

    return new Error(`GST IRP API Error [${error.errorCode}]: ${error.errorMessage}`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    return {
      requestsThisSecond: this.rateLimitState.requestsThisSecond,
      requestsThisMinute: this.rateLimitState.requestsThisMinute,
      requestsThisHour: this.rateLimitState.requestsThisHour,
      requestsToday: this.rateLimitState.requestsToday,
      limits: IRP_RATE_LIMITS,
    };
  }

  /**
   * Clear authentication token (force re-authentication)
   */
  clearAuth(): void {
    this.authToken = null;
    this.tokenExpiresAt = 0;
    this.logger.log('Authentication token cleared');
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return this.authToken !== null && Date.now() < this.tokenExpiresAt;
  }

  /**
   * Get configuration (masked sensitive data)
   */
  getConfig() {
    return {
      environment: this.config.environment,
      gstin: this.config.gstin,
      username: this.config.username,
      apiUrl: this.endpoints.BASE_URL,
      hasCertificate: !!this.config.certificatePath,
    };
  }
}
