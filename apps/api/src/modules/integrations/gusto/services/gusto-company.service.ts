import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import axios from 'axios';
import { GustoService } from '../gusto.service';
import {
  GustoProvisionRequest,
  GustoProvisionResponse,
  GustoCompany,
  GustoLocation,
  GustoTokens,
} from '../gusto.types';
import { getGustoApiUrl } from '../gusto.config';

/**
 * Gusto Company Service
 * Handles company provisioning and management
 *
 * Features:
 * - Company provisioning (create company + get access token)
 * - Company information retrieval
 * - Location management
 */
@Injectable()
export class GustoCompanyService {
  private readonly logger = new Logger(GustoCompanyService.name);
  private readonly apiUrl: string;

  constructor(private readonly gustoService: GustoService) {
    this.apiUrl = getGustoApiUrl(this.gustoService.getConfig().environment);
  }

  /**
   * Provision a new company in Gusto
   * This creates a company and returns an access token
   *
   * NOTE: This is a special endpoint that doesn't require OAuth
   * It's used for onboarding new companies to the platform
   */
  async provisionCompany(
    request: GustoProvisionRequest,
  ): Promise<{
    tokens: GustoTokens;
    companyUuid: string;
  }> {
    try {
      const config = this.gustoService.getConfig();

      const response = await axios.post<GustoProvisionResponse>(
        `${this.apiUrl}/v1/provision`,
        request,
        {
          auth: {
            username: config.clientId,
            password: config.clientSecret,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;

      const tokens: GustoTokens = {
        accessToken: data.access_token,
        refreshToken: '', // Provision doesn't return refresh token
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope,
        tokenType: data.token_type,
      };

      this.logger.log('Successfully provisioned company', {
        companyUuid: data.company_uuid,
        companyName: request.company.name,
      });

      return {
        tokens,
        companyUuid: data.company_uuid,
      };
    } catch (error) {
      this.logger.error('Company provisioning failed', {
        error: error.response?.data || error.message,
        companyName: request.company.name,
      });
      throw new BadRequestException(
        `Failed to provision company: ${error.response?.data?.error_description || error.message}`,
      );
    }
  }

  /**
   * Get company details
   */
  async getCompany(
    accessToken: string,
    companyUuid: string,
  ): Promise<GustoCompany> {
    return this.gustoService.getCompany(accessToken, companyUuid);
  }

  /**
   * Get company locations
   */
  async getCompanyLocations(
    accessToken: string,
    companyUuid: string,
  ): Promise<GustoLocation[]> {
    const company = await this.getCompany(accessToken, companyUuid);
    return company.locations || [];
  }

  /**
   * Validate company data before provisioning
   */
  validateCompanyData(request: GustoProvisionRequest): void {
    const errors: string[] = [];

    // Validate user
    if (!request.user.first_name) {
      errors.push('User first name is required');
    }
    if (!request.user.last_name) {
      errors.push('User last name is required');
    }
    if (!request.user.email) {
      errors.push('User email is required');
    } else if (!this.isValidEmail(request.user.email)) {
      errors.push('User email is invalid');
    }

    // Validate company
    if (!request.company.name) {
      errors.push('Company name is required');
    }

    // Validate locations
    if (!request.company.locations || request.company.locations.length === 0) {
      errors.push('At least one company location is required');
    } else {
      request.company.locations.forEach((location, index) => {
        if (!location.street_1) {
          errors.push(`Location ${index + 1}: Street address is required`);
        }
        if (!location.city) {
          errors.push(`Location ${index + 1}: City is required`);
        }
        if (!location.state) {
          errors.push(`Location ${index + 1}: State is required`);
        }
        if (!location.zip) {
          errors.push(`Location ${index + 1}: ZIP code is required`);
        } else if (!this.isValidZipCode(location.zip)) {
          errors.push(`Location ${index + 1}: Invalid ZIP code format`);
        }
      });
    }

    // Validate EIN if provided
    if (request.company.ein && !this.isValidEIN(request.company.ein)) {
      errors.push('Invalid EIN format (should be XX-XXXXXXX)');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Company validation failed',
        errors,
      });
    }
  }

  /**
   * Helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper: Validate ZIP code format (US)
   */
  private isValidZipCode(zip: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  }

  /**
   * Helper: Validate EIN format (XX-XXXXXXX)
   */
  private isValidEIN(ein: string): boolean {
    const einRegex = /^\d{2}-\d{7}$/;
    return einRegex.test(ein);
  }

  /**
   * Format EIN (add hyphen if missing)
   */
  formatEIN(ein: string): string {
    const cleaned = ein.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    }
    return ein;
  }

  /**
   * Parse company status
   */
  getCompanyStatusDescription(status: string): string {
    const statusMap: Record<string, string> = {
      'approved': 'Company is approved and active',
      'not_approved': 'Company setup is incomplete',
      'suspended': 'Company account is suspended',
      'cancelled': 'Company account has been cancelled',
    };
    return statusMap[status] || 'Unknown status';
  }
}
