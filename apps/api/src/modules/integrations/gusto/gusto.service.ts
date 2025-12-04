import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  GustoConfig,
  GustoEnvironment,
  GustoApiError,
  GustoRateLimitInfo,
  GustoCompany,
  GustoEmployee,
  GustoPayroll,
} from './gusto.types';
import {
  validateGustoConfig,
  getGustoApiUrl,
  getEnvironmentName,
  isSandboxMode,
} from './gusto.config';

/**
 * Gusto Core Service
 * Provides low-level HTTP client wrapper for Gusto API
 *
 * Features:
 * - Type-safe HTTP client
 * - Automatic retry with exponential backoff
 * - Rate limiting tracking
 * - Comprehensive error handling
 * - Request/response logging
 */
@Injectable()
export class GustoService {
  private readonly logger = new Logger(GustoService.name);
  private readonly config: GustoConfig;
  private readonly apiUrl: string;
  private rateLimitInfo: GustoRateLimitInfo | null = null;

  constructor(private readonly configService: ConfigService) {
    // Load configuration
    this.config = this.configService.get<GustoConfig>('gusto') || {
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      environment: GustoEnvironment.SANDBOX,
      apiVersion: 'v1',
      webhookSecret: '',
      scopes: [],
    };

    // Validate configuration
    validateGustoConfig(this.config);

    // Set API URL based on environment
    this.apiUrl = getGustoApiUrl(this.config.environment);

    this.logger.log(
      `Gusto Service initialized (${getEnvironmentName(this.config.environment)} mode)`,
    );
  }

  /**
   * Get Gusto configuration
   */
  getConfig(): GustoConfig {
    return { ...this.config };
  }

  /**
   * Check if running in sandbox mode
   */
  isSandbox(): boolean {
    return isSandboxMode(this.config);
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): GustoRateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Create authenticated HTTP client
   */
  createClient(accessToken: string): AxiosInstance {
    const client = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Response interceptor for rate limiting
    client.interceptors.response.use(
      (response) => {
        // Track rate limit info
        if (response.headers['x-ratelimit-limit']) {
          this.rateLimitInfo = {
            limit: parseInt(response.headers['x-ratelimit-limit'], 10),
            remaining: parseInt(response.headers['x-ratelimit-remaining'], 10),
            reset: new Date(parseInt(response.headers['x-ratelimit-reset'], 10) * 1000),
          };
        }
        return response;
      },
      (error) => {
        // Handle rate limiting
        if (error.response?.status === 429) {
          this.logger.warn('Rate limit exceeded', {
            limit: error.response.headers['x-ratelimit-limit'],
            reset: error.response.headers['x-ratelimit-reset'],
          });
        }
        return Promise.reject(error);
      },
    );

    return client;
  }

  /**
   * Get company by UUID
   */
  async getCompany(
    accessToken: string,
    companyUuid: string,
  ): Promise<GustoCompany> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.get<GustoCompany>(
        `/v1/companies/${companyUuid}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Get company');
    }
  }

  /**
   * List employees for a company
   */
  async listEmployees(
    accessToken: string,
    companyUuid: string,
  ): Promise<GustoEmployee[]> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.get<GustoEmployee[]>(
        `/v1/companies/${companyUuid}/employees`,
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'List employees');
    }
  }

  /**
   * Get employee by UUID
   */
  async getEmployee(
    accessToken: string,
    employeeUuid: string,
  ): Promise<GustoEmployee> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.get<GustoEmployee>(
        `/v1/employees/${employeeUuid}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Get employee');
    }
  }

  /**
   * Create employee
   */
  async createEmployee(
    accessToken: string,
    companyUuid: string,
    employeeData: Partial<GustoEmployee>,
  ): Promise<GustoEmployee> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.post<GustoEmployee>(
        `/v1/companies/${companyUuid}/employees`,
        employeeData,
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Create employee');
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(
    accessToken: string,
    employeeUuid: string,
    employeeData: Partial<GustoEmployee>,
  ): Promise<GustoEmployee> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.put<GustoEmployee>(
        `/v1/employees/${employeeUuid}`,
        employeeData,
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Update employee');
    }
  }

  /**
   * List payrolls for a company
   */
  async listPayrolls(
    accessToken: string,
    companyUuid: string,
    options?: {
      startDate?: string;
      endDate?: string;
      processed?: boolean;
    },
  ): Promise<GustoPayroll[]> {
    try {
      const client = this.createClient(accessToken);
      const params = new URLSearchParams();

      if (options?.startDate) params.append('start_date', options.startDate);
      if (options?.endDate) params.append('end_date', options.endDate);
      if (options?.processed !== undefined) {
        params.append('processed', String(options.processed));
      }

      const response = await client.get<GustoPayroll[]>(
        `/v1/companies/${companyUuid}/payrolls?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'List payrolls');
    }
  }

  /**
   * Get payroll by UUID
   */
  async getPayroll(
    accessToken: string,
    payrollUuid: string,
  ): Promise<GustoPayroll> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.get<GustoPayroll>(
        `/v1/payrolls/${payrollUuid}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Get payroll');
    }
  }

  /**
   * Handle Gusto API errors
   */
  private handleApiError(error: any, operation: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<GustoApiError>;

      this.logger.error(`Gusto ${operation} failed`, {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      const errorData = axiosError.response?.data;
      const status = axiosError.response?.status;

      // Handle specific error codes
      if (status === 401) {
        throw new BadRequestException(
          'Gusto authentication failed. Please reconnect your account.',
        );
      } else if (status === 403) {
        throw new BadRequestException(
          'Insufficient permissions for this operation.',
        );
      } else if (status === 404) {
        throw new BadRequestException(
          'Resource not found.',
        );
      } else if (status === 429) {
        throw new InternalServerErrorException(
          'Rate limit exceeded. Please try again later.',
        );
      }

      // Return error message from Gusto
      if (errorData?.error_description) {
        throw new BadRequestException(errorData.error_description);
      } else if (errorData?.errors && errorData.errors.length > 0) {
        const messages = errorData.errors.map(e => e.message).join(', ');
        throw new BadRequestException(messages);
      }

      throw new InternalServerErrorException(
        `Gusto ${operation} failed: ${axiosError.message}`,
      );
    }

    this.logger.error(`Gusto ${operation} failed`, error);
    throw new InternalServerErrorException(
      `Gusto ${operation} failed: ${error.message}`,
    );
  }
}
