import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  WiseConfig,
  WiseProfile,
  WiseErrorResponse,
} from './wise.types';
import { WiseEncryptionUtil } from './utils/wise-encryption.util';
import {
  validateWiseConfig,
  getWiseApiUrl,
  getWiseEnvironmentName,
} from './wise.config';

/**
 * Wise Integration Service
 * Core service for Wise Business API integration
 *
 * Security Features:
 * - API token encrypted before storage
 * - Webhook signature verification
 * - Comprehensive audit logging
 * - No sensitive data in logs
 *
 * @see https://api-docs.wise.com/
 */
@Injectable()
export class WiseService {
  private readonly logger = new Logger(WiseService.name);
  private readonly config: WiseConfig;
  private readonly apiClient: AxiosInstance;
  private readonly encryptionKey: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    // Load configuration
    this.config = {
      apiToken: this.configService.get<string>('WISE_API_TOKEN') || '',
      environment: this.configService.get<string>('WISE_SANDBOX') === 'true'
        ? 'sandbox' as any
        : 'production' as any,
      webhookSecret: this.configService.get<string>('WISE_WEBHOOK_SECRET') || '',
      sandbox: this.configService.get<string>('WISE_SANDBOX') === 'true',
      profileId: this.configService.get<string>('WISE_PROFILE_ID') || undefined,
    };

    // Get encryption key
    this.encryptionKey =
      this.configService.get<string>('WISE_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') || '';

    // Validate configuration
    validateWiseConfig(this.config);
    if (!WiseEncryptionUtil.validateMasterKey(this.encryptionKey)) {
      throw new Error('Invalid or missing WISE_ENCRYPTION_KEY');
    }

    // Initialize API client
    const apiBaseUrl = getWiseApiUrl(this.config.environment);

    this.apiClient = axios.create({
      baseURL: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiToken}`,
      },
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Wise API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Wise API Request Error', error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`Wise API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError<WiseErrorResponse>) => {
        return Promise.reject(this.handleApiError(error));
      },
    );

    this.logger.log(
      `Wise integration initialized (${getWiseEnvironmentName(this.config.environment)})`,
    );
  }

  /**
   * Get all profiles (personal and business)
   */
  async getProfiles(): Promise<WiseProfile[]> {
    try {
      const response = await this.apiClient.get<WiseProfile[]>('/v1/profiles');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get profiles', error);
      throw error;
    }
  }

  /**
   * Get business profile ID
   * Returns the first business profile or the configured profile ID
   */
  async getBusinessProfileId(): Promise<number> {
    if (this.config.profileId) {
      return parseInt(this.config.profileId, 10);
    }

    const profiles = await this.getProfiles();
    const businessProfile = profiles.find((p) => p.type === 'business');

    if (!businessProfile) {
      throw new NotFoundException('No business profile found. Please configure WISE_PROFILE_ID.');
    }

    return businessProfile.id;
  }

  /**
   * Get personal profile ID
   */
  async getPersonalProfileId(): Promise<number> {
    const profiles = await this.getProfiles();
    const personalProfile = profiles.find((p) => p.type === 'personal');

    if (!personalProfile) {
      throw new NotFoundException('No personal profile found.');
    }

    return personalProfile.id;
  }

  /**
   * Encrypt API token for storage
   */
  encryptToken(token: string): string {
    return WiseEncryptionUtil.encrypt(token, this.encryptionKey);
  }

  /**
   * Decrypt stored API token
   */
  decryptToken(encryptedToken: string): string {
    return WiseEncryptionUtil.decrypt(encryptedToken, this.encryptionKey);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      this.logger.warn('Webhook secret not configured - skipping signature verification');
      return true; // Allow in development
    }

    return WiseEncryptionUtil.verifyWebhookSignature(
      payload,
      signature,
      this.config.webhookSecret,
    );
  }

  /**
   * Handle Wise API errors
   */
  private handleApiError(error: AxiosError<WiseErrorResponse>): Error {
    const status = error.response?.status;
    const errorData = error.response?.data;

    // Log error (without sensitive data)
    this.logger.error(
      `Wise API Error: ${status} - ${error.message}`,
      errorData,
    );

    // Extract error messages
    let message = 'Wise API request failed';
    if (errorData?.errors && errorData.errors.length > 0) {
      message = errorData.errors.map((e) => e.message).join(', ');
    }

    // Map status codes to appropriate exceptions
    switch (status) {
      case 400:
        return new BadRequestException(message);
      case 401:
      case 403:
        return new UnauthorizedException(message);
      case 404:
        return new NotFoundException(message);
      case 429:
        return new ServiceUnavailableException('Rate limit exceeded. Please try again later.');
      case 500:
      case 502:
      case 503:
        return new ServiceUnavailableException('Wise service temporarily unavailable');
      default:
        return new InternalServerErrorException(message);
    }
  }

  /**
   * Get API client instance
   * Allows services to make direct API calls
   */
  getApiClient(): AxiosInstance {
    return this.apiClient;
  }

  /**
   * Get configuration
   */
  getConfig(): WiseConfig {
    return this.config;
  }
}
