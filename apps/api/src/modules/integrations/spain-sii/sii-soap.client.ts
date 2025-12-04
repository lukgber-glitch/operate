import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import axios, { AxiosInstance } from 'axios';
import {
  SiiEnvironment,
  SII_ENDPOINTS,
  SII_CERTIFICATE_REQUIREMENTS,
  SII_RETRY_CONFIG,
} from './constants/sii.constants';
import { SiiSoapFault } from './interfaces/sii-response.interface';

/**
 * SII SOAP Client
 * Handles SOAP/XML communication with Spanish Tax Agency (AEAT)
 */
@Injectable()
export class SiiSoapClient {
  private readonly logger = new Logger(SiiSoapClient.name);
  private readonly environment: SiiEnvironment;
  private readonly endpoints: typeof SII_ENDPOINTS.production;
  private readonly timeout: number;
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.environment =
      (this.configService.get<string>('SII_ENVIRONMENT') as SiiEnvironment) ||
      SiiEnvironment.TEST;

    this.endpoints =
      this.environment === SiiEnvironment.PRODUCTION
        ? SII_ENDPOINTS.production
        : SII_ENDPOINTS.test;

    this.timeout = this.configService.get<number>('SII_TIMEOUT') || 60000; // 60 seconds

    // Create axios instance with default config
    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: '',
        'User-Agent': 'Operate-CoachOS-SII-Client/1.0',
      },
    });

    this.logger.log(`SII SOAP Client initialized in ${this.environment} mode`);
  }

  /**
   * Send SOAP request for issued invoices
   */
  async submitIssuedInvoices(
    soapEnvelope: string,
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<string> {
    const endpoint = `${this.endpoints.baseUrl}${this.endpoints.issuedInvoices}`;
    return this.sendSoapRequest(
      endpoint,
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );
  }

  /**
   * Send SOAP request for received invoices
   */
  async submitReceivedInvoices(
    soapEnvelope: string,
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<string> {
    const endpoint = `${this.endpoints.baseUrl}${this.endpoints.receivedInvoices}`;
    return this.sendSoapRequest(
      endpoint,
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );
  }

  /**
   * Send SOAP request for payment/collection records
   */
  async submitPayments(
    soapEnvelope: string,
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<string> {
    const endpoint = `${this.endpoints.baseUrl}${this.endpoints.payment}`;
    return this.sendSoapRequest(
      endpoint,
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );
  }

  /**
   * Query invoices
   */
  async queryInvoices(
    soapEnvelope: string,
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<string> {
    const endpoint = `${this.endpoints.baseUrl}${this.endpoints.issuedInvoices}`;
    return this.sendSoapRequest(
      endpoint,
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );
  }

  /**
   * Delete/Cancel invoice
   */
  async deleteInvoice(
    soapEnvelope: string,
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
  ): Promise<string> {
    const endpoint = `${this.endpoints.baseUrl}${this.endpoints.issuedInvoices}`;
    return this.sendSoapRequest(
      endpoint,
      soapEnvelope,
      certificate,
      certificateKey,
      certificatePassword,
    );
  }

  /**
   * Send SOAP request with retry logic and certificate authentication
   */
  private async sendSoapRequest(
    endpoint: string,
    soapEnvelope: string,
    certificate: Buffer,
    certificateKey: Buffer,
    certificatePassword?: string,
    attempt = 1,
  ): Promise<string> {
    try {
      this.logger.debug(`Sending SOAP request to ${endpoint} (attempt ${attempt})`);

      // Create HTTPS agent with client certificate
      const httpsAgent = new https.Agent({
        cert: certificate,
        key: certificateKey,
        passphrase: certificatePassword,
        rejectUnauthorized: this.environment === SiiEnvironment.PRODUCTION,
        minVersion: SII_CERTIFICATE_REQUIREMENTS.TLS_VERSION as any,
        maxVersion: SII_CERTIFICATE_REQUIREMENTS.TLS_VERSION as any,
      });

      const response = await this.axiosInstance.post(endpoint, soapEnvelope, {
        httpsAgent,
      });

      this.logger.debug('SOAP request successful');
      return response.data;
    } catch (error) {
      this.logger.error(
        `SOAP request failed (attempt ${attempt}/${SII_RETRY_CONFIG.MAX_RETRIES}): ${error.message}`,
      );

      // Check if we should retry
      if (attempt < SII_RETRY_CONFIG.MAX_RETRIES && this.shouldRetry(error)) {
        const delay = this.calculateRetryDelay(attempt);
        this.logger.warn(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.sendSoapRequest(
          endpoint,
          soapEnvelope,
          certificate,
          certificateKey,
          certificatePassword,
          attempt + 1,
        );
      }

      // Handle SOAP faults
      if (error.response?.data) {
        const fault = this.extractSoapFault(error.response.data);
        if (fault) {
          throw new ServiceUnavailableException(
            `SII SOAP Fault: ${fault.faultString} (${fault.faultCode})`,
          );
        }
      }

      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new ServiceUnavailableException(
          'SII service is currently unavailable',
        );
      }

      if (error.code === 'CERT_HAS_EXPIRED') {
        throw new ServiceUnavailableException('SII certificate has expired');
      }

      if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        throw new ServiceUnavailableException('SII certificate validation failed');
      }

      throw new ServiceUnavailableException(
        `Failed to communicate with SII: ${error.message}`,
      );
    }
  }

  /**
   * Determine if error is retryable
   */
  private shouldRetry(error: any): boolean {
    // Network errors
    if (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED'
    ) {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.response?.status) {
      const status = error.response.status;
      return status === 408 || status === 429 || status >= 500;
    }

    // SOAP faults that are retryable
    if (error.response?.data) {
      const fault = this.extractSoapFault(error.response.data);
      if (fault) {
        // Service temporarily unavailable
        return (
          fault.faultCode === 'Server.Busy' ||
          fault.faultCode === 'Server.Unavailable'
        );
      }
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attempt: number): number {
    const delay =
      SII_RETRY_CONFIG.INITIAL_DELAY *
      Math.pow(SII_RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
    return Math.min(delay, SII_RETRY_CONFIG.MAX_DELAY);
  }

  /**
   * Extract SOAP fault from response
   */
  private extractSoapFault(xmlData: string): SiiSoapFault | null {
    try {
      // Simple XML parsing for SOAP fault
      const faultMatch = xmlData.match(
        /<soap:Fault>[\s\S]*?<\/soap:Fault>|<soapenv:Fault>[\s\S]*?<\/soapenv:Fault>/i,
      );

      if (!faultMatch) {
        return null;
      }

      const faultXml = faultMatch[0];

      const faultCodeMatch = faultXml.match(
        /<faultcode>(.*?)<\/faultcode>|<soap:Code>[\s\S]*?<soap:Value>(.*?)<\/soap:Value>/i,
      );
      const faultStringMatch = faultXml.match(
        /<faultstring>(.*?)<\/faultstring>|<soap:Reason>[\s\S]*?<soap:Text>(.*?)<\/soap:Text>/i,
      );

      const faultCode = faultCodeMatch ? faultCodeMatch[1] || faultCodeMatch[2] : 'Unknown';
      const faultString = faultStringMatch
        ? faultStringMatch[1] || faultStringMatch[2]
        : 'Unknown error';

      return {
        faultCode,
        faultString,
      };
    } catch (error) {
      this.logger.warn(`Failed to extract SOAP fault: ${error.message}`);
      return null;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate certificate
   */
  validateCertificate(certificate: Buffer): boolean {
    try {
      // Basic validation - check if it's a valid PEM or DER certificate
      const certString = certificate.toString();
      return (
        certString.includes('-----BEGIN CERTIFICATE-----') ||
        certString.includes('-----BEGIN RSA PRIVATE KEY-----') ||
        certString.includes('-----BEGIN PRIVATE KEY-----')
      );
    } catch (error) {
      this.logger.error(`Certificate validation failed: ${error.message}`);
      return false;
    }
  }
}
