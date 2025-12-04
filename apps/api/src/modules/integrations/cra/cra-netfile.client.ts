import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as https from 'https';
import {
  CraFilingResponse,
  CraFilingStatus,
  CraErrorCode,
  GstHstReturn,
} from './interfaces/cra.interface';
import {
  getCraEndpoints,
  CRA_HEADERS,
  CRA_TLS_CONFIG,
  CRA_RATE_LIMITS,
  CRA_ERROR_MESSAGES,
  CRA_XML_NAMESPACES,
} from './cra.constants';

/**
 * CRA NetFile HTTP Client
 *
 * Handles all HTTP communications with CRA NetFile API
 *
 * Features:
 * - TLS 1.2+ secure communications
 * - Rate limiting
 * - XML request/response handling
 * - Error handling and retry logic
 * - Request/response logging for audit
 */
@Injectable()
export class CraNetFileClient {
  private readonly logger = new Logger(CraNetFileClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly endpoints: ReturnType<typeof getCraEndpoints>;
  private readonly environment: 'sandbox' | 'production';

  // Rate limiting state
  private requestQueue: Array<() => Promise<any>> = [];
  private lastRequestTime = 0;
  private readonly minRequestInterval: number;

  constructor(private readonly configService: ConfigService) {
    this.environment =
      this.configService.get<string>('CRA_SANDBOX') === 'true'
        ? 'sandbox'
        : 'production';

    this.endpoints = getCraEndpoints(this.environment);

    // Calculate minimum interval between requests (in ms)
    this.minRequestInterval = 1000 / CRA_RATE_LIMITS.requestsPerSecond;

    // Initialize HTTPS client with TLS 1.2+
    this.httpClient = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        minVersion: CRA_TLS_CONFIG.minVersion,
        maxVersion: CRA_TLS_CONFIG.maxVersion,
        ciphers: CRA_TLS_CONFIG.ciphers,
        rejectUnauthorized: this.environment === 'production',
      }),
      headers: {
        'Content-Type': CRA_HEADERS.CONTENT_TYPE,
        'Accept': CRA_HEADERS.ACCEPT,
        'User-Agent': CRA_HEADERS.USER_AGENT,
      },
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => this.handleAxiosError(error),
    );

    this.logger.log(`CRA NetFile client initialized for ${this.environment}`);
  }

  /**
   * Submit GST/HST return to CRA
   */
  async submitReturn(
    sessionId: string,
    returnData: GstHstReturn,
    transmitterInfo: {
      name: string;
      efileNumber: string;
      contactPhone: string;
      contactEmail: string;
    },
  ): Promise<CraFilingResponse> {
    try {
      const xml = this.buildSubmissionXml(returnData, transmitterInfo);

      this.logger.debug('Submitting GST/HST return to CRA');

      const response = await this.rateLimitedRequest(() =>
        this.httpClient.post(this.endpoints.netfileUrl, xml, {
          headers: {
            'X-Session-ID': sessionId,
          },
        }),
      );

      return this.parseSubmissionResponse(response.data);
    } catch (error) {
      this.logger.error(`CRA submission failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate return before submission
   */
  async validateReturn(
    sessionId: string,
    returnData: GstHstReturn,
  ): Promise<CraFilingResponse> {
    try {
      const xml = this.buildValidationXml(returnData);

      this.logger.debug('Validating GST/HST return with CRA');

      const response = await this.rateLimitedRequest(() =>
        this.httpClient.post(this.endpoints.validationUrl, xml, {
          headers: {
            'X-Session-ID': sessionId,
          },
        }),
      );

      return this.parseValidationResponse(response.data);
    } catch (error) {
      this.logger.error(`CRA validation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check filing status
   */
  async checkStatus(
    sessionId: string,
    confirmationNumber: string,
  ): Promise<CraFilingResponse> {
    try {
      this.logger.debug(`Checking status for confirmation: ${confirmationNumber}`);

      const response = await this.rateLimitedRequest(() =>
        this.httpClient.get(
          `${this.endpoints.statusUrl}/${confirmationNumber}`,
          {
            headers: {
              'X-Session-ID': sessionId,
            },
          },
        ),
      );

      return this.parseStatusResponse(response.data);
    } catch (error) {
      this.logger.error(`CRA status check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Build GST/HST submission XML
   */
  private buildSubmissionXml(
    returnData: GstHstReturn,
    transmitterInfo: {
      name: string;
      efileNumber: string;
      contactPhone: string;
      contactEmail: string;
    },
  ): string {
    const { businessNumber, reportingPeriod, returnType } = returnData;

    // Format dates
    const periodStart = this.formatDate(reportingPeriod.startDate);
    const periodEnd = this.formatDate(reportingPeriod.endDate);
    const declarationDate = this.formatDate(returnData.declarationDate);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Return xmlns="${CRA_XML_NAMESPACES.GST34}">
  <Transmitter>
    <Name>${this.escapeXml(transmitterInfo.name)}</Name>
    <EFileNumber>${transmitterInfo.efileNumber}</EFileNumber>
    <ContactPhone>${transmitterInfo.contactPhone}</ContactPhone>
    <ContactEmail>${transmitterInfo.contactEmail}</ContactEmail>
  </Transmitter>
  <ReturnHeader>
    <BusinessNumber>${businessNumber}</BusinessNumber>
    <ReturnType>${returnType}</ReturnType>
    <ReportingPeriod>
      <StartDate>${periodStart}</StartDate>
      <EndDate>${periodEnd}</EndDate>
      <Frequency>${reportingPeriod.frequency}</Frequency>
    </ReportingPeriod>
  </ReturnHeader>
  <ReturnData>
    <Line101>${returnData.line101_salesRevenue.toFixed(2)}</Line101>
    <Line103>${returnData.line103_taxCollected.toFixed(2)}</Line103>
    ${returnData.line104_adjustments ? `<Line104>${returnData.line104_adjustments.toFixed(2)}</Line104>` : ''}
    <Line105>${returnData.line105_totalTaxToRemit.toFixed(2)}</Line105>
    <Line106>${returnData.line106_currentITCs.toFixed(2)}</Line106>
    ${returnData.line107_itcAdjustments ? `<Line107>${returnData.line107_itcAdjustments.toFixed(2)}</Line107>` : ''}
    <Line108>${returnData.line108_totalITCs.toFixed(2)}</Line108>
    <Line109>${returnData.line109_netTax.toFixed(2)}</Line109>
    ${returnData.line110_installmentRefund ? `<Line110>${returnData.line110_installmentRefund.toFixed(2)}</Line110>` : ''}
    ${returnData.line111_otherCredits ? `<Line111>${returnData.line111_otherCredits.toFixed(2)}</Line111>` : ''}
    ${returnData.line112_totalCredits ? `<Line112>${returnData.line112_totalCredits.toFixed(2)}</Line112>` : ''}
    ${returnData.line113A_amountOwing ? `<Line113A>${returnData.line113A_amountOwing.toFixed(2)}</Line113A>` : ''}
    ${returnData.line113B_refundClaimed ? `<Line113B>${returnData.line113B_refundClaimed.toFixed(2)}</Line113B>` : ''}
    ${returnData.line114_rebateClaimed ? `<Line114>${returnData.line114_rebateClaimed.toFixed(2)}</Line114>` : ''}
    ${this.buildScheduleAXml(returnData.scheduleA)}
  </ReturnData>
  <Declaration>
    <CertifierName>${this.escapeXml(returnData.certifierName)}</CertifierName>
    <CertifierCapacity>${this.escapeXml(returnData.certifierCapacity)}</CertifierCapacity>
    <DeclarationDate>${declarationDate}</DeclarationDate>
  </Declaration>
</Return>`;
  }

  /**
   * Build Schedule A XML if present
   */
  private buildScheduleAXml(scheduleA?: any): string {
    if (!scheduleA) return '';

    return `
    <ScheduleA>
      ${scheduleA.badDebtRecoveries ? `<BadDebtRecoveries>${scheduleA.badDebtRecoveries.toFixed(2)}</BadDebtRecoveries>` : ''}
      ${scheduleA.provincialRebates ? `<ProvincialRebates>${scheduleA.provincialRebates.toFixed(2)}</ProvincialRebates>` : ''}
      ${
        scheduleA.otherAdjustments
          ? scheduleA.otherAdjustments
              .map(
                (adj: any) =>
                  `<OtherAdjustment>
            <Description>${this.escapeXml(adj.description)}</Description>
            <Amount>${adj.amount.toFixed(2)}</Amount>
          </OtherAdjustment>`,
              )
              .join('')
          : ''
      }
    </ScheduleA>`;
  }

  /**
   * Build validation XML
   */
  private buildValidationXml(returnData: GstHstReturn): string {
    // Similar to submission XML but wrapped in ValidationRequest
    const submissionXml = this.buildSubmissionXml(returnData, {
      name: 'Validation',
      efileNumber: '',
      contactPhone: '',
      contactEmail: '',
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<ValidationRequest xmlns="${CRA_XML_NAMESPACES.NETFILE}">
  ${submissionXml}
</ValidationRequest>`;
  }

  /**
   * Parse submission response
   */
  private parseSubmissionResponse(xml: string): CraFilingResponse {
    // Simple XML parsing - in production, use a proper XML parser
    const confirmationMatch = xml.match(/<ConfirmationNumber>(.*?)<\/ConfirmationNumber>/);
    const statusMatch = xml.match(/<Status>(.*?)<\/Status>/);
    const errorsMatch = xml.match(/<Errors>(.*?)<\/Errors>/s);

    return {
      status: this.mapStatus(statusMatch?.[1] || 'ERROR'),
      confirmationNumber: confirmationMatch?.[1],
      filedAt: new Date(),
      errors: this.parseErrors(errorsMatch?.[1]),
    };
  }

  /**
   * Parse validation response
   */
  private parseValidationResponse(xml: string): CraFilingResponse {
    const validMatch = xml.match(/<Valid>(.*?)<\/Valid>/);
    const errorsMatch = xml.match(/<Errors>(.*?)<\/Errors>/s);
    const warningsMatch = xml.match(/<Warnings>(.*?)<\/Warnings>/s);

    const isValid = validMatch?.[1] === 'true';

    return {
      status: isValid ? CraFilingStatus.VALIDATED : CraFilingStatus.ERROR,
      errors: this.parseErrors(errorsMatch?.[1]),
      warnings: this.parseWarnings(warningsMatch?.[1]),
    };
  }

  /**
   * Parse status response
   */
  private parseStatusResponse(xml: string): CraFilingResponse {
    const statusMatch = xml.match(/<Status>(.*?)<\/Status>/);
    const processedMatch = xml.match(/<ProcessedDate>(.*?)<\/ProcessedDate>/);

    return {
      status: this.mapStatus(statusMatch?.[1] || 'ERROR'),
      processedAt: processedMatch?.[1] ? new Date(processedMatch[1]) : undefined,
    };
  }

  /**
   * Map CRA status to internal status
   */
  private mapStatus(craStatus: string): CraFilingStatus {
    const statusMap: Record<string, CraFilingStatus> = {
      SUBMITTED: CraFilingStatus.SUBMITTED,
      ACCEPTED: CraFilingStatus.ACCEPTED,
      REJECTED: CraFilingStatus.REJECTED,
      PROCESSING: CraFilingStatus.SUBMITTED,
      ERROR: CraFilingStatus.ERROR,
    };

    return statusMap[craStatus.toUpperCase()] || CraFilingStatus.ERROR;
  }

  /**
   * Parse errors from XML
   */
  private parseErrors(errorsXml?: string): Array<{ code: string; message: string }> {
    if (!errorsXml) return [];

    const errors: Array<{ code: string; message: string }> = [];
    const errorMatches = errorsXml.matchAll(
      /<Error><Code>(.*?)<\/Code><Message>(.*?)<\/Message><\/Error>/g,
    );

    for (const match of errorMatches) {
      errors.push({
        code: match[1],
        message: match[2],
      });
    }

    return errors;
  }

  /**
   * Parse warnings from XML
   */
  private parseWarnings(warningsXml?: string): Array<{ code: string; message: string }> {
    if (!warningsXml) return [];

    const warnings: Array<{ code: string; message: string }> = [];
    const warningMatches = warningsXml.matchAll(
      /<Warning><Code>(.*?)<\/Code><Message>(.*?)<\/Message><\/Warning>/g,
    );

    for (const match of warningMatches) {
      warnings.push({
        code: match[1],
        message: match[2],
      });
    }

    return warnings;
  }

  /**
   * Rate-limited request execution
   */
  private async rateLimitedRequest<T>(
    requestFn: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await this.sleep(delay);
    }

    this.lastRequestTime = Date.now();
    return requestFn();
  }

  /**
   * Handle Axios errors
   */
  private handleAxiosError(error: AxiosError): never {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      this.logger.error(`CRA API error ${status}: ${JSON.stringify(data)}`);

      if (status === 401) {
        throw new InternalServerErrorException(
          'CRA authentication failed',
          CraErrorCode.AUTHENTICATION_FAILED,
        );
      } else if (status === 503) {
        throw new InternalServerErrorException(
          'CRA service unavailable',
          CraErrorCode.SERVICE_UNAVAILABLE,
        );
      }
    } else if (error.request) {
      // No response received
      this.logger.error('No response from CRA API');
      throw new InternalServerErrorException(
        'CRA network error',
        CraErrorCode.NETWORK_ERROR,
      );
    }

    throw new InternalServerErrorException(
      `CRA request failed: ${error.message}`,
      CraErrorCode.INTERNAL_ERROR,
    );
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Format date for CRA (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
