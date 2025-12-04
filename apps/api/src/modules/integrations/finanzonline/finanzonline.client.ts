/**
 * FinanzOnline SOAP Client
 * SOAP client wrapper for Austrian FinanzOnline Session-Webservice
 * Uses native SOAP protocol via 'soap' npm package
 *
 * Documentation: https://www.bmf.gv.at/dam/jcr:95d0e370-4efb-4ac9-9132-165189ac30ba/BMF_Session_Webservice_Englisch.pdf
 */

import * as soap from 'soap';
import { Logger } from '@nestjs/common';
import {
  FINANZONLINE_WSDL,
  FINANZONLINE_ENDPOINTS,
  FINANZONLINE_NAMESPACES,
  FINANZONLINE_TLS_CONFIG,
  FINANZONLINE_REQUEST_TIMEOUT,
  FINANZONLINE_MAX_RETRIES,
  FINANZONLINE_RETRY_DELAY,
  FinanzOnlineEnvironment,
  FINANZONLINE_ERROR_CODES,
} from './finanzonline.constants';
import {
  FinanzOnlineClientConfig,
  IFinanzOnlineClient,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  PingRequest,
  PingResponse,
  GetParticipantInfoRequest,
  GetParticipantInfoResponse,
  FinanzOnlineSession,
  FinanzOnlineError,
  SoapFault,
  SoapOperationResult,
} from './finanzonline.types';

/**
 * FinanzOnline SOAP Client Implementation
 */
export class FinanzOnlineClient implements IFinanzOnlineClient {
  private readonly logger = new Logger(FinanzOnlineClient.name);
  private soapClient: soap.Client | null = null;
  private session: FinanzOnlineSession | null = null;
  private readonly config: Required<FinanzOnlineClientConfig>;

  constructor(config: FinanzOnlineClientConfig) {
    // Set default configuration
    this.config = {
      environment: config.environment,
      wsdlUrl: config.wsdlUrl || this.getDefaultWsdlUrl(config.environment),
      endpoint: config.endpoint || this.getDefaultEndpoint(config.environment),
      timeout: config.timeout || FINANZONLINE_REQUEST_TIMEOUT,
      debug: config.debug || false,
      maxRetries: config.maxRetries || FINANZONLINE_MAX_RETRIES,
      retryDelay: config.retryDelay || FINANZONLINE_RETRY_DELAY,
      tls: {
        minVersion: FINANZONLINE_TLS_CONFIG.MIN_VERSION,
        maxVersion: FINANZONLINE_TLS_CONFIG.MAX_VERSION,
        ciphers: FINANZONLINE_TLS_CONFIG.CIPHERS,
        rejectUnauthorized: config.environment === FinanzOnlineEnvironment.PRODUCTION,
        ...config.tls,
      },
      soap: {
        forceSoap11: true,
        wsdl_options: {
          timeout: this.config?.timeout || FINANZONLINE_REQUEST_TIMEOUT,
        },
        ...config.soap,
      },
    };

    this.logger.log(
      `Initializing FinanzOnline SOAP client for ${this.config.environment} environment`,
    );
  }

  /**
   * Initialize the SOAP client
   */
  async initialize(): Promise<void> {
    try {
      this.logger.log(`Loading WSDL from: ${this.config.wsdlUrl}`);

      const wsdlOptions: soap.IOptions = {
        ...this.config.soap.wsdl_options,
        endpoint: this.config.endpoint,
        request: this.createHttpsAgent(),
      };

      // Create SOAP client from WSDL
      this.soapClient = await soap.createClientAsync(
        this.config.wsdlUrl,
        wsdlOptions,
      );

      // Set endpoint
      this.soapClient.setEndpoint(this.config.endpoint);

      // Enable logging if debug mode
      if (this.config.debug) {
        this.enableDebugLogging();
      }

      this.logger.log('FinanzOnline SOAP client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SOAP client', error);
      throw this.createError(
        FINANZONLINE_ERROR_CODES.INTERNAL_ERROR,
        'Failed to initialize SOAP client',
        error,
      );
    }
  }

  /**
   * Login to FinanzOnline
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    this.logger.log(`Attempting login for participant: ${request.teilnehmerId}`);

    const result = await this.executeOperation<LoginResponse>(
      'login',
      {
        teilnehmerId: request.teilnehmerId,
        benId: request.benId,
        pin: request.pin,
        authType: request.authType,
        herstellerId: request.herstellerId,
      },
    );

    if (result.success && result.data) {
      // Store session
      this.session = {
        sessionId: result.data.sessionId,
        token: result.data.sessionToken,
        teilnehmerId: request.teilnehmerId,
        benId: request.benId,
        createdAt: result.data.sessionCreated,
        expiresAt: result.data.sessionExpires,
        environment: this.config.environment,
        participantInfo: result.data.participantInfo,
      };

      this.logger.log(`Login successful. Session ID: ${this.session.sessionId}`);
      return result.data;
    }

    throw result.error || this.createError(
      FINANZONLINE_ERROR_CODES.INVALID_CREDENTIALS,
      'Login failed',
    );
  }

  /**
   * Logout from FinanzOnline
   */
  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    this.logger.log(`Logging out session: ${request.sessionId}`);

    const result = await this.executeOperation<LogoutResponse>(
      'logout',
      { sessionId: request.sessionId },
    );

    if (result.success && result.data) {
      // Clear session if it matches
      if (this.session?.sessionId === request.sessionId) {
        this.session = null;
      }

      this.logger.log('Logout successful');
      return result.data;
    }

    throw result.error || this.createError(
      FINANZONLINE_ERROR_CODES.INVALID_SESSION_ID,
      'Logout failed',
    );
  }

  /**
   * Ping session (keep-alive)
   */
  async ping(request: PingRequest): Promise<PingResponse> {
    this.logger.debug(`Pinging session: ${request.sessionId}`);

    const result = await this.executeOperation<PingResponse>(
      'ping',
      { sessionId: request.sessionId },
    );

    if (result.success && result.data) {
      // Update session expiration if this is our current session
      if (this.session?.sessionId === request.sessionId && result.data.sessionExpires) {
        this.session.expiresAt = result.data.sessionExpires;
      }

      return result.data;
    }

    throw result.error || this.createError(
      FINANZONLINE_ERROR_CODES.INVALID_SESSION_ID,
      'Ping failed',
    );
  }

  /**
   * Get participant information
   */
  async getParticipantInfo(
    request: GetParticipantInfoRequest,
  ): Promise<GetParticipantInfoResponse> {
    this.logger.log(`Getting participant info for: ${request.teilnehmerId}`);

    const result = await this.executeOperation<GetParticipantInfoResponse>(
      'getParticipantInfo',
      {
        teilnehmerId: request.teilnehmerId,
        sessionId: request.sessionId,
      },
    );

    if (result.success && result.data) {
      return result.data;
    }

    throw result.error || this.createError(
      FINANZONLINE_ERROR_CODES.INVALID_PARTICIPANT_ID,
      'Failed to get participant info',
    );
  }

  /**
   * Get current session
   */
  getSession(): FinanzOnlineSession | null {
    return this.session;
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    if (!this.session) {
      return false;
    }

    const now = new Date();
    return now < this.session.expiresAt;
  }

  /**
   * Destroy the client
   */
  destroy(): void {
    this.logger.log('Destroying FinanzOnline SOAP client');
    this.soapClient = null;
    this.session = null;
  }

  /**
   * Execute a SOAP operation with retry logic and error handling
   */
  private async executeOperation<T>(
    operationName: string,
    args: any,
    attempt = 1,
  ): Promise<SoapOperationResult<T>> {
    const startTime = new Date();

    try {
      // Ensure client is initialized
      if (!this.soapClient) {
        await this.initialize();
      }

      if (!this.soapClient) {
        throw new Error('SOAP client not initialized');
      }

      // Execute SOAP operation
      this.logger.debug(`Executing operation: ${operationName} (attempt ${attempt})`);

      const result = await this.invokeSoapMethod<T>(operationName, args);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.debug(`Operation ${operationName} completed in ${duration}ms`);

      return {
        success: true,
        data: result,
        metadata: {
          operation: operationName,
          requestTime: startTime,
          responseTime: endTime,
          duration,
        },
      };
    } catch (error) {
      this.logger.error(
        `Operation ${operationName} failed (attempt ${attempt}/${this.config.maxRetries})`,
        error,
      );

      // Check if should retry
      if (attempt < this.config.maxRetries && this.shouldRetry(error)) {
        this.logger.log(`Retrying operation ${operationName} after ${this.config.retryDelay}ms`);
        await this.sleep(this.config.retryDelay);
        return this.executeOperation<T>(operationName, args, attempt + 1);
      }

      // Convert error to FinanzOnlineError
      const fonError = this.handleSoapError(error);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        success: false,
        error: fonError,
        metadata: {
          operation: operationName,
          requestTime: startTime,
          responseTime: endTime,
          duration,
        },
      };
    }
  }

  /**
   * Invoke SOAP method
   */
  private async invokeSoapMethod<T>(methodName: string, args: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.soapClient) {
        reject(new Error('SOAP client not initialized'));
        return;
      }

      const method = (this.soapClient as any)[methodName];
      if (typeof method !== 'function') {
        reject(new Error(`SOAP method '${methodName}' not found`));
        return;
      }

      method.call(this.soapClient, args, (err: any, result: T) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Handle SOAP errors and convert to FinanzOnlineError
   */
  private handleSoapError(error: any): FinanzOnlineError {
    // Check if it's a SOAP fault
    if (error.root?.Envelope?.Body?.Fault) {
      const fault: SoapFault = error.root.Envelope.Body.Fault;
      return this.createError(
        fault.detail?.errorCode || FINANZONLINE_ERROR_CODES.INTERNAL_ERROR,
        fault.faultstring,
        fault,
      );
    }

    // Check for network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return this.createError(
        FINANZONLINE_ERROR_CODES.SERVICE_UNAVAILABLE,
        'FinanzOnline service is unavailable',
        error,
      );
    }

    // Check for timeout
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      return this.createError(
        FINANZONLINE_ERROR_CODES.TIMEOUT,
        'Request timeout',
        error,
      );
    }

    // Generic error
    return this.createError(
      FINANZONLINE_ERROR_CODES.INTERNAL_ERROR,
      error.message || 'Unknown error occurred',
      error,
    );
  }

  /**
   * Create FinanzOnlineError
   */
  private createError(
    code: string,
    message: string,
    details?: any,
  ): FinanzOnlineError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * Check if operation should be retried
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // Retry on service unavailable
    if (error.code === 'ENOTFOUND') {
      return true;
    }

    // Don't retry on authentication errors
    if (error.code === FINANZONLINE_ERROR_CODES.INVALID_CREDENTIALS) {
      return false;
    }

    // Don't retry on invalid data
    if (error.code === FINANZONLINE_ERROR_CODES.INVALID_PARTICIPANT_ID) {
      return false;
    }

    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create HTTPS agent with TLS configuration
   */
  private createHttpsAgent(): any {
    const https = require('https');
    return new https.Agent({
      minVersion: this.config.tls.minVersion,
      maxVersion: this.config.tls.maxVersion,
      ciphers: this.config.tls.ciphers,
      rejectUnauthorized: this.config.tls.rejectUnauthorized,
      keepAlive: true,
      keepAliveMsecs: 30000,
    });
  }

  /**
   * Enable debug logging
   */
  private enableDebugLogging(): void {
    if (!this.soapClient) {
      return;
    }

    // Log last request
    this.soapClient.on('request', (xml: string) => {
      this.logger.debug('SOAP Request:');
      this.logger.debug(this.sanitizeXmlForLogging(xml));
    });

    // Log last response
    this.soapClient.on('response', (body: string) => {
      this.logger.debug('SOAP Response:');
      this.logger.debug(this.sanitizeXmlForLogging(body));
    });

    // Log SOAP errors
    this.soapClient.on('soapError', (error: any) => {
      this.logger.error('SOAP Error:', error);
    });
  }

  /**
   * Sanitize XML for logging (remove sensitive data)
   */
  private sanitizeXmlForLogging(xml: string): string {
    return xml
      .replace(/<pin>.*?<\/pin>/gi, '<pin>***</pin>')
      .replace(/<password>.*?<\/password>/gi, '<password>***</password>')
      .replace(/<Password>.*?<\/Password>/gi, '<Password>***</Password>')
      .replace(/<BinarySecurityToken>.*?<\/BinarySecurityToken>/gi, '<BinarySecurityToken>***</BinarySecurityToken>');
  }

  /**
   * Get default WSDL URL for environment
   */
  private getDefaultWsdlUrl(environment: FinanzOnlineEnvironment): string {
    return environment === FinanzOnlineEnvironment.PRODUCTION
      ? FINANZONLINE_WSDL.PRODUCTION
      : FINANZONLINE_WSDL.TEST;
  }

  /**
   * Get default endpoint for environment
   */
  private getDefaultEndpoint(environment: FinanzOnlineEnvironment): string {
    return environment === FinanzOnlineEnvironment.PRODUCTION
      ? FINANZONLINE_ENDPOINTS.PRODUCTION
      : FINANZONLINE_ENDPOINTS.TEST;
  }
}

/**
 * Factory function to create FinanzOnline client
 */
export async function createFinanzOnlineClient(
  config: FinanzOnlineClientConfig,
): Promise<FinanzOnlineClient> {
  const client = new FinanzOnlineClient(config);
  await client.initialize();
  return client;
}
