import { Injectable, Logger } from '@nestjs/common';
import * as soap from 'soap';
import {
  ViesSoapResponse,
  ViesErrorCode,
} from './interfaces/vies-response.interface';

/**
 * VIES SOAP Client
 * Handles communication with the EU VIES service for VAT validation
 */
@Injectable()
export class ViesClient {
  private readonly logger = new Logger(ViesClient.name);
  private readonly wsdlUrl =
    'https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl';
  private readonly timeout = 30000; // 30 seconds
  private client: soap.Client | null = null;

  /**
   * Initialize SOAP client
   */
  private async getClient(): Promise<soap.Client> {
    if (this.client) {
      return this.client;
    }

    try {
      this.logger.debug('Initializing VIES SOAP client');
      this.client = await soap.createClientAsync(this.wsdlUrl, {
        endpoint:
          'https://ec.europa.eu/taxation_customs/vies/services/checkVatService',
      } as any);

      this.logger.debug('VIES SOAP client initialized successfully');
      return this.client;
    } catch (error) {
      this.logger.error('Failed to initialize VIES SOAP client', error);
      throw new Error('Failed to connect to VIES service');
    }
  }

  /**
   * Validate VAT number via VIES
   */
  async checkVat(
    countryCode: string,
    vatNumber: string,
  ): Promise<ViesSoapResponse> {
    try {
      this.logger.debug(
        `Validating VAT: ${countryCode}${vatNumber}`,
      );

      const client = await this.getClient();

      const response = await new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('VIES request timeout'));
        }, this.timeout);

        client.checkVat(
          {
            countryCode,
            vatNumber,
          },
          (err: any, result: any) => {
            clearTimeout(timeoutId);
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          },
        );
      });

      this.logger.debug(
        `VIES response received for ${countryCode}${vatNumber}`,
      );

      return {
        countryCode: response.countryCode || countryCode,
        vatNumber: response.vatNumber || vatNumber,
        requestDate: response.requestDate || new Date(),
        valid: response.valid === true || response.valid === 'true',
        name: response.name || '',
        address: response.address || '',
      };
    } catch (error) {
      this.logger.error(
        `VIES validation failed for ${countryCode}${vatNumber}`,
        error,
      );
      throw this.handleViesError(error);
    }
  }

  /**
   * Handle VIES errors and convert to standardized error codes
   */
  private handleViesError(error: any): Error {
    const errorMessage = error.message || error.toString();

    // Parse SOAP fault codes
    if (error.root?.Envelope?.Body?.Fault) {
      const faultString =
        error.root.Envelope.Body.Fault.faultstring || '';

      if (faultString.includes('INVALID_INPUT')) {
        return new Error(
          `${ViesErrorCode.INVALID_INPUT}: Invalid VAT number format`,
        );
      }
      if (faultString.includes('SERVICE_UNAVAILABLE')) {
        return new Error(
          `${ViesErrorCode.SERVICE_UNAVAILABLE}: VIES service is temporarily unavailable`,
        );
      }
      if (faultString.includes('MS_UNAVAILABLE')) {
        return new Error(
          `${ViesErrorCode.MS_UNAVAILABLE}: Member state service is unavailable`,
        );
      }
      if (faultString.includes('TIMEOUT')) {
        return new Error(
          `${ViesErrorCode.TIMEOUT}: Request timeout`,
        );
      }
      if (faultString.includes('SERVER_BUSY')) {
        return new Error(
          `${ViesErrorCode.SERVER_BUSY}: Server is busy, please try again later`,
        );
      }
      if (faultString.includes('GLOBAL_MAX_CONCURRENT_REQ')) {
        return new Error(
          `${ViesErrorCode.GLOBAL_MAX_CONCURRENT_REQ}: Maximum concurrent requests exceeded`,
        );
      }
    }

    // Handle timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('ETIMEDOUT')
    ) {
      return new Error(
        `${ViesErrorCode.TIMEOUT}: Request timeout`,
      );
    }

    // Generic service unavailable error
    if (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('connect')
    ) {
      return new Error(
        `${ViesErrorCode.SERVICE_UNAVAILABLE}: Cannot connect to VIES service`,
      );
    }

    // Default error
    return new Error(
      `${ViesErrorCode.SERVICE_UNAVAILABLE}: ${errorMessage}`,
    );
  }

  /**
   * Reset the SOAP client (useful for testing or connection issues)
   */
  resetClient(): void {
    this.client = null;
    this.logger.debug('VIES SOAP client reset');
  }
}
