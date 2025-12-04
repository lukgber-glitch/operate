import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AtoAuthService } from './ato-auth.service';
import { AtoBasService } from './ato-bas.service';
import { AtoStpClient } from './ato-stp.client';
import { AtoTparService } from './ato-tpar.service';
import {
  AtoAuthCredentials,
  AtoTokenResponse,
  BasFilingRequest,
  BasFilingResponse,
  StpPayEventSubmission,
  StpUpdateEventSubmission,
  StpFinalisationEvent,
  StpFilingResponse,
  TparSubmission,
  TparFilingResponse,
  AtoObligation,
  AbnLookupResult,
  AtoAuditLog,
} from './ato.types';
import axios from 'axios';
import { ATO_API_URLS, ATO_ENDPOINTS } from './ato.constants';

/**
 * ATO Core Service
 *
 * Main orchestration service for Australian Taxation Office integrations
 * Coordinates authentication, BAS, STP, and TPAR services
 *
 * @see https://www.ato.gov.au/business/
 */
@Injectable()
export class AtoService {
  private readonly logger = new Logger(AtoService.name);
  private readonly auditLogs: AtoAuditLog[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AtoAuthService,
    private readonly basService: AtoBasService,
    private readonly stpClient: AtoStpClient,
    private readonly tparService: AtoTparService,
  ) {
    this.logger.log('ATO Service initialized');
  }

  /**
   * Initialize ATO connection for an organization
   */
  async initializeConnection(
    credentials: AtoAuthCredentials,
  ): Promise<{ authUrl: string; codeVerifier: string; state: string }> {
    this.logger.log(`Initializing ATO connection for ABN: ${credentials.abn}`);

    try {
      const authData = this.authService.generateAuthUrl(credentials);

      await this.logAudit({
        organizationId: credentials.abn,
        abn: credentials.abn,
        action: 'AUTH',
        status: 'SUCCESS',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
      });

      return authData;
    } catch (error) {
      this.logger.error('Failed to initialize connection', error);

      await this.logAudit({
        organizationId: credentials.abn,
        abn: credentials.abn,
        action: 'AUTH',
        status: 'FAILURE',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        errors: [{ code: 'AUTH_INIT_FAILED', message: error.message }],
      });

      throw error;
    }
  }

  /**
   * Complete OAuth flow and obtain tokens
   */
  async completeAuthorization(
    credentials: AtoAuthCredentials,
    authorizationCode: string,
    codeVerifier: string,
  ): Promise<AtoTokenResponse> {
    this.logger.log('Completing authorization flow');

    try {
      const token = await this.authService.exchangeCodeForToken(
        credentials,
        authorizationCode,
        codeVerifier,
      );

      await this.logAudit({
        organizationId: credentials.abn,
        abn: credentials.abn,
        action: 'AUTH',
        status: 'SUCCESS',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        details: { tokenObtained: true },
      });

      return token;
    } catch (error) {
      this.logger.error('Authorization completion failed', error);

      await this.logAudit({
        organizationId: credentials.abn,
        abn: credentials.abn,
        action: 'AUTH',
        status: 'FAILURE',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        errors: [{ code: 'AUTH_COMPLETE_FAILED', message: error.message }],
      });

      throw error;
    }
  }

  /**
   * Submit Business Activity Statement
   */
  async submitBas(
    request: BasFilingRequest,
    token: AtoTokenResponse,
  ): Promise<BasFilingResponse> {
    this.logger.log(`Submitting BAS for ABN: ${request.abn}`);

    try {
      const response = await this.basService.submitBas(request, token);

      await this.logAudit({
        organizationId: request.organizationId,
        abn: request.abn,
        action: 'SUBMIT_BAS',
        status: 'SUCCESS',
        requestId: response.filingId,
        timestamp: new Date(),
        details: {
          period: request.statement.period,
          filingId: response.filingId,
        },
      });

      return response;
    } catch (error) {
      this.logger.error('BAS submission failed', error);

      await this.logAudit({
        organizationId: request.organizationId,
        abn: request.abn,
        action: 'SUBMIT_BAS',
        status: 'FAILURE',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        errors: [{ code: 'BAS_SUBMIT_FAILED', message: error.message }],
      });

      throw error;
    }
  }

  /**
   * Get BAS obligations
   */
  async getBasObligations(
    abn: string,
    organizationId: string,
    token: AtoTokenResponse,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<AtoObligation[]> {
    this.logger.log(`Retrieving BAS obligations for ABN: ${abn}`);

    try {
      const obligations = await this.basService.getObligations(
        abn,
        token,
        fromDate,
        toDate,
      );

      await this.logAudit({
        organizationId,
        abn,
        action: 'RETRIEVE',
        status: 'SUCCESS',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        details: { obligationCount: obligations.length },
      });

      return obligations;
    } catch (error) {
      this.logger.error('Failed to retrieve obligations', error);

      await this.logAudit({
        organizationId,
        abn,
        action: 'RETRIEVE',
        status: 'FAILURE',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        errors: [{ code: 'OBLIGATION_RETRIEVAL_FAILED', message: error.message }],
      });

      throw error;
    }
  }

  /**
   * Submit STP Pay Event
   */
  async submitStpPayEvent(
    organizationId: string,
    submission: StpPayEventSubmission,
    token: AtoTokenResponse,
  ): Promise<StpFilingResponse> {
    this.logger.log(`Submitting STP Pay Event for ABN: ${submission.abn}`);

    try {
      const response = await this.stpClient.submitPayEvent(submission, token);

      await this.logAudit({
        organizationId,
        abn: submission.abn,
        action: 'SUBMIT_STP',
        status: 'SUCCESS',
        requestId: response.filingId,
        timestamp: new Date(),
        details: {
          eventType: 'PAY_EVENT',
          employeeCount: submission.employees.length,
        },
      });

      return response;
    } catch (error) {
      this.logger.error('STP Pay Event submission failed', error);

      await this.logAudit({
        organizationId,
        abn: submission.abn,
        action: 'SUBMIT_STP',
        status: 'FAILURE',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        errors: [{ code: 'STP_PAY_EVENT_FAILED', message: error.message }],
      });

      throw error;
    }
  }

  /**
   * Submit STP Update Event
   */
  async submitStpUpdateEvent(
    organizationId: string,
    submission: StpUpdateEventSubmission,
    token: AtoTokenResponse,
  ): Promise<StpFilingResponse> {
    this.logger.log(`Submitting STP Update Event for ABN: ${submission.abn}`);

    try {
      const response = await this.stpClient.submitUpdateEvent(submission, token);

      await this.logAudit({
        organizationId,
        abn: submission.abn,
        action: 'SUBMIT_STP',
        status: 'SUCCESS',
        requestId: response.filingId,
        timestamp: new Date(),
        details: {
          eventType: 'UPDATE_EVENT',
          updateCount: submission.updates.length,
        },
      });

      return response;
    } catch (error) {
      this.logger.error('STP Update Event submission failed', error);

      await this.logAudit({
        organizationId,
        abn: submission.abn,
        action: 'SUBMIT_STP',
        status: 'FAILURE',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        errors: [{ code: 'STP_UPDATE_EVENT_FAILED', message: error.message }],
      });

      throw error;
    }
  }

  /**
   * Submit STP Finalisation
   */
  async submitStpFinalisation(
    organizationId: string,
    event: StpFinalisationEvent,
    token: AtoTokenResponse,
  ): Promise<StpFilingResponse> {
    this.logger.log(`Submitting STP Finalisation for ABN: ${event.abn}`);

    try {
      const response = await this.stpClient.submitFinalisation(event, token);

      await this.logAudit({
        organizationId,
        abn: event.abn,
        action: 'SUBMIT_STP',
        status: 'SUCCESS',
        requestId: response.filingId,
        timestamp: new Date(),
        details: {
          eventType: 'FINALISATION',
          financialYear: event.financialYear,
          employeeCount: event.employees.length,
        },
      });

      return response;
    } catch (error) {
      this.logger.error('STP Finalisation submission failed', error);

      await this.logAudit({
        organizationId,
        abn: event.abn,
        action: 'SUBMIT_STP',
        status: 'FAILURE',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        errors: [{ code: 'STP_FINALISATION_FAILED', message: error.message }],
      });

      throw error;
    }
  }

  /**
   * Submit TPAR
   */
  async submitTpar(
    organizationId: string,
    submission: TparSubmission,
    token: AtoTokenResponse,
  ): Promise<TparFilingResponse> {
    this.logger.log(`Submitting TPAR for ABN: ${submission.abn}`);

    try {
      const response = await this.tparService.submitTpar(submission, token);

      await this.logAudit({
        organizationId,
        abn: submission.abn,
        action: 'SUBMIT_TPAR',
        status: 'SUCCESS',
        requestId: response.filingId,
        timestamp: new Date(),
        details: {
          financialYear: submission.financialYear,
          contractorCount: submission.payments.length,
        },
      });

      return response;
    } catch (error) {
      this.logger.error('TPAR submission failed', error);

      await this.logAudit({
        organizationId,
        abn: submission.abn,
        action: 'SUBMIT_TPAR',
        status: 'FAILURE',
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        errors: [{ code: 'TPAR_SUBMIT_FAILED', message: error.message }],
      });

      throw error;
    }
  }

  /**
   * Lookup ABN details
   */
  async lookupAbn(abn: string): Promise<AbnLookupResult> {
    this.logger.log(`Looking up ABN: ${abn}`);

    try {
      const environment = this.configService.get<string>('ATO_ENVIRONMENT', 'sandbox');
      const baseUrl =
        environment === 'production'
          ? ATO_API_URLS.PRODUCTION
          : ATO_API_URLS.SANDBOX;

      const response = await axios.get(`${baseUrl}${ATO_ENDPOINTS.ABN_LOOKUP}`, {
        params: { abn },
        headers: {
          'X-ATO-Client-ID': this.configService.get<string>('ATO_CLIENT_ID'),
        },
      });

      return response.data.data;
    } catch (error) {
      this.logger.error('ABN lookup failed', error);
      throw error;
    }
  }

  /**
   * Get audit logs for an organization
   */
  async getAuditLogs(
    organizationId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<AtoAuditLog[]> {
    let logs = this.auditLogs.filter((log) => log.organizationId === organizationId);

    if (fromDate) {
      logs = logs.filter((log) => log.timestamp >= fromDate);
    }

    if (toDate) {
      logs = logs.filter((log) => log.timestamp <= toDate);
    }

    return logs;
  }

  /**
   * Check ATO API health status
   */
  async checkApiStatus(): Promise<{ available: boolean; message: string }> {
    try {
      const environment = this.configService.get<string>('ATO_ENVIRONMENT', 'sandbox');
      const baseUrl =
        environment === 'production'
          ? ATO_API_URLS.PRODUCTION
          : ATO_API_URLS.SANDBOX;

      const response = await axios.get(`${baseUrl}${ATO_ENDPOINTS.STATUS_CHECK}`, {
        timeout: 5000,
      });

      return {
        available: response.status === 200,
        message: 'ATO API is operational',
      };
    } catch (error) {
      this.logger.warn('ATO API health check failed', error);
      return {
        available: false,
        message: 'ATO API is currently unavailable',
      };
    }
  }

  /**
   * Log audit entry
   */
  private async logAudit(entry: AtoAuditLog): Promise<void> {
    this.auditLogs.push(entry);

    // In production, this would persist to database
    this.logger.log(
      `Audit: ${entry.action} - ${entry.status} - ABN: ${entry.abn}`,
    );
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
