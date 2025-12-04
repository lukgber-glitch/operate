import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  PersonaConfig,
  PersonaEnvironment,
  PersonaApiResponse,
  PersonaErrorResponse,
} from './types/persona.types';
import {
  validatePersonaConfig,
  getPersonaEnvironmentName,
  isTestMode,
} from './persona.config';
import { PersonaEncryptionUtil } from './utils/persona-encryption.util';

/**
 * Persona Core Service
 * Provides low-level Persona API wrapper with configuration and error handling
 *
 * Features:
 * - Axios HTTP client configured for Persona API
 * - Automatic authentication with API key
 * - Error handling and logging
 * - Request/response interceptors
 * - Webhook signature verification
 */
@Injectable()
export class PersonaService {
  private readonly logger = new Logger(PersonaService.name);
  private readonly config: PersonaConfig;
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionUtil: PersonaEncryptionUtil,
  ) {
    // Load configuration
    this.config = {
      apiKey: this.configService.get<string>('PERSONA_API_KEY') || '',
      webhookSecret:
        this.configService.get<string>('PERSONA_WEBHOOK_SECRET') || '',
      environment:
        (this.configService.get<string>('PERSONA_ENVIRONMENT') as PersonaEnvironment) ||
        PersonaEnvironment.SANDBOX,
      apiVersion: 'v1',
      baseUrl:
        this.configService.get<string>('PERSONA_API_BASE_URL') ||
        'https://withpersona.com/api/v1',
    };

    // Validate configuration
    validatePersonaConfig(this.config);

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'Persona-Version': '2023-01-05', // API version
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `Persona API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => {
        this.logger.error('Persona API Request Error', error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `Persona API Response: ${response.status} ${response.config.url}`,
        );
        return response;
      },
      (error) => {
        this.handlePersonaError(error);
        return Promise.reject(error);
      },
    );

    const testMode = isTestMode(this.config.apiKey);
    this.logger.log(
      `Persona Service initialized (${getPersonaEnvironmentName(this.config.environment)} mode, Test: ${testMode})`,
    );
  }

  /**
   * Get HTTP client instance for making API requests
   */
  getClient(): AxiosInstance {
    return this.httpClient;
  }

  /**
   * Get Persona configuration
   */
  getConfig(): PersonaConfig {
    return { ...this.config };
  }

  /**
   * Get webhook secret for signature verification
   */
  getWebhookSecret(): string {
    return this.config.webhookSecret;
  }

  /**
   * Check if running in test mode
   */
  isTestMode(): boolean {
    return isTestMode(this.config.apiKey);
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   *
   * Persona webhook signatures format: "t=timestamp,v1=signature"
   *
   * @param payload - Raw webhook payload (string)
   * @param signature - Signature from Persona-Signature header
   * @returns True if signature is valid
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Parse signature header
      const parts = signature.split(',');
      let timestamp: string | null = null;
      let v1Signature: string | null = null;

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 't') {
          timestamp = value;
        } else if (key === 'v1') {
          v1Signature = value;
        }
      }

      if (!timestamp || !v1Signature) {
        this.logger.error('Invalid signature format');
        return false;
      }

      // Verify signature age (prevent replay attacks)
      const signatureAge = Date.now() / 1000 - parseInt(timestamp, 10);
      const maxAge = 300; // 5 minutes
      if (signatureAge > maxAge) {
        this.logger.error(
          `Signature too old: ${signatureAge}s (max: ${maxAge}s)`,
        );
        return false;
      }

      // Construct signed payload: timestamp.payload
      const signedPayload = `${timestamp}.${payload}`;

      // Verify HMAC signature
      const isValid = this.encryptionUtil.verifyHmacSignature(
        signedPayload,
        v1Signature,
        this.config.webhookSecret,
      );

      if (!isValid) {
        this.logger.error('Webhook signature verification failed');
      }

      return isValid;
    } catch (error) {
      this.logger.error('Webhook signature verification error', error);
      return false;
    }
  }

  /**
   * Handle Persona API errors with proper logging
   */
  private handlePersonaError(error: AxiosError): void {
    if (error.response) {
      const errorData = error.response.data as PersonaErrorResponse;
      const errors = errorData.errors || [];

      this.logger.error('Persona API Error', {
        status: error.response.status,
        errors: errors.map((e) => ({
          title: e.title,
          detail: e.detail,
          code: e.code,
        })),
      });

      // Log detailed error for debugging
      if (errors.length > 0) {
        const firstError = errors[0];
        this.logger.error(
          `Persona Error: ${firstError.title} - ${firstError.detail}`,
        );
      }
    } else if (error.request) {
      this.logger.error('Persona API Network Error', {
        message: 'No response received from Persona API',
        error: error.message,
      });
    } else {
      this.logger.error('Persona API Request Setup Error', {
        error: error.message,
      });
    }
  }

  /**
   * Transform Persona API error to user-friendly error
   */
  handleApiError(error: any, operation: string): never {
    this.logger.error(`Persona ${operation} failed`, error);

    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as PersonaErrorResponse;
      const errors = errorData.errors || [];

      if (errors.length > 0) {
        const firstError = errors[0];
        throw new InternalServerErrorException(
          `Persona ${operation} failed: ${firstError.detail || firstError.title}`,
        );
      }
    }

    throw new InternalServerErrorException(
      `Persona ${operation} failed: ${error.message}`,
    );
  }

  /**
   * Make a GET request to Persona API
   */
  async get<T = any>(url: string, params?: any): Promise<PersonaApiResponse<T>> {
    try {
      const response = await this.httpClient.get<PersonaApiResponse<T>>(url, {
        params,
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error, `GET ${url}`);
    }
  }

  /**
   * Make a POST request to Persona API
   */
  async post<T = any>(
    url: string,
    data?: any,
  ): Promise<PersonaApiResponse<T>> {
    try {
      const response = await this.httpClient.post<PersonaApiResponse<T>>(
        url,
        data,
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, `POST ${url}`);
    }
  }

  /**
   * Make a PATCH request to Persona API
   */
  async patch<T = any>(
    url: string,
    data?: any,
  ): Promise<PersonaApiResponse<T>> {
    try {
      const response = await this.httpClient.patch<PersonaApiResponse<T>>(
        url,
        data,
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, `PATCH ${url}`);
    }
  }

  /**
   * Make a DELETE request to Persona API
   */
  async delete<T = any>(url: string): Promise<PersonaApiResponse<T>> {
    try {
      const response = await this.httpClient.delete<PersonaApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      this.handleApiError(error, `DELETE ${url}`);
    }
  }
}
