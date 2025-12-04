import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import * as fs from 'fs';
import { ChorusProToken, ChorusProAuthConfig } from '../types/chorus-pro.types';

/**
 * Chorus Pro Authentication Service
 *
 * Handles OAuth2 authentication with PISTE (French government SSO)
 * for accessing the Chorus Pro API.
 *
 * Features:
 * - OAuth2 client credentials flow
 * - Token caching and automatic refresh
 * - Optional client certificate authentication
 * - Secure token storage
 *
 * PISTE Documentation: https://piste.gouv.fr/documentation
 */
@Injectable()
export class ChorusProAuthService {
  private readonly logger = new Logger(ChorusProAuthService.name);
  private readonly httpClient: AxiosInstance;
  private readonly authConfig: ChorusProAuthConfig;
  private cachedToken: ChorusProToken | null = null;

  constructor(private readonly configService: ConfigService) {
    // Load authentication configuration
    this.authConfig = {
      pisteUrl:
        this.configService.get<string>('CHORUS_PRO_PISTE_URL') ||
        'https://piste.gouv.fr/api/oauth/token',
      clientId: this.configService.get<string>('CHORUS_PRO_CLIENT_ID'),
      clientSecret: this.configService.get<string>('CHORUS_PRO_CLIENT_SECRET'),
      scope:
        this.configService.get<string>('CHORUS_PRO_SCOPE') ||
        'chorus-pro:invoice:submit chorus-pro:invoice:consult',
      certificatePath: this.configService.get<string>(
        'CHORUS_PRO_CERTIFICATE_PATH',
      ),
    };

    if (!this.authConfig.clientId || !this.authConfig.clientSecret) {
      this.logger.warn(
        'Chorus Pro credentials not configured. Service will not be functional.',
      );
    }

    // Create HTTP client with optional certificate
    const httpsAgent = this.createHttpsAgent();
    this.httpClient = axios.create({
      baseURL: this.authConfig.pisteUrl,
      timeout: 30000,
      httpsAgent,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CoachOS-ChorusPro/1.0',
      },
    });

    this.logger.log('Chorus Pro Authentication Service initialized');
  }

  /**
   * Get valid access token (from cache or request new one)
   */
  async getAccessToken(): Promise<string> {
    // Check if cached token is still valid
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      this.logger.debug('Using cached access token');
      return this.cachedToken.accessToken;
    }

    // Request new token
    this.logger.log('Requesting new access token from PISTE');
    this.cachedToken = await this.requestAccessToken();
    return this.cachedToken.accessToken;
  }

  /**
   * Request new access token from PISTE OAuth2
   */
  private async requestAccessToken(): Promise<ChorusProToken> {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.authConfig.clientId,
        client_secret: this.authConfig.clientSecret,
      });

      if (this.authConfig.scope) {
        params.append('scope', this.authConfig.scope);
      }

      const response = await this.httpClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = response.data;

      const token: ChorusProToken = {
        accessToken: data.access_token,
        tokenType: data.token_type || 'Bearer',
        expiresIn: data.expires_in || 3600,
        expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
        refreshToken: data.refresh_token,
        scope: data.scope,
      };

      this.logger.log(
        `Successfully obtained access token (expires in ${token.expiresIn}s)`,
      );

      return token;
    } catch (error) {
      this.logger.error(
        `Failed to obtain access token: ${error.message}`,
        error.stack,
      );

      if (error.response) {
        this.logger.error(
          `PISTE error response: ${JSON.stringify(error.response.data)}`,
        );
      }

      throw new UnauthorizedException(
        `Failed to authenticate with Chorus Pro: ${error.message}`,
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<ChorusProToken> {
    if (!this.cachedToken?.refreshToken) {
      this.logger.warn('No refresh token available, requesting new token');
      return this.requestAccessToken();
    }

    try {
      this.logger.log('Refreshing access token');

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.cachedToken.refreshToken,
        client_id: this.authConfig.clientId,
        client_secret: this.authConfig.clientSecret,
      });

      const response = await this.httpClient.post('', params.toString());
      const data = response.data;

      const token: ChorusProToken = {
        accessToken: data.access_token,
        tokenType: data.token_type || 'Bearer',
        expiresIn: data.expires_in || 3600,
        expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
        refreshToken: data.refresh_token || this.cachedToken.refreshToken,
        scope: data.scope,
      };

      this.cachedToken = token;
      this.logger.log('Successfully refreshed access token');

      return token;
    } catch (error) {
      this.logger.error(
        `Failed to refresh token: ${error.message}`,
        error.stack,
      );
      // Fall back to requesting new token
      return this.requestAccessToken();
    }
  }

  /**
   * Check if token is still valid (with 5-minute buffer)
   */
  private isTokenValid(token: ChorusProToken): boolean {
    if (!token || !token.expiresAt) {
      return false;
    }

    // Consider token invalid 5 minutes before expiry
    const bufferMs = 5 * 60 * 1000;
    const now = Date.now();
    const expiryTime = new Date(token.expiresAt).getTime() - bufferMs;

    return now < expiryTime;
  }

  /**
   * Invalidate cached token (force refresh on next request)
   */
  invalidateToken(): void {
    this.logger.log('Invalidating cached token');
    this.cachedToken = null;
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo(): {
    hasToken: boolean;
    isValid: boolean;
    expiresAt?: Date;
    expiresIn?: number;
  } {
    if (!this.cachedToken) {
      return { hasToken: false, isValid: false };
    }

    const isValid = this.isTokenValid(this.cachedToken);
    const expiresIn = this.cachedToken.expiresAt
      ? Math.floor(
          (new Date(this.cachedToken.expiresAt).getTime() - Date.now()) / 1000,
        )
      : 0;

    return {
      hasToken: true,
      isValid,
      expiresAt: this.cachedToken.expiresAt,
      expiresIn: expiresIn > 0 ? expiresIn : 0,
    };
  }

  /**
   * Create HTTPS agent with optional client certificate
   */
  private createHttpsAgent(): https.Agent | undefined {
    if (!this.authConfig.certificatePath) {
      return undefined;
    }

    try {
      const cert = fs.readFileSync(this.authConfig.certificatePath);

      // Assuming certificate file contains both cert and key
      // or separate key file with .key extension
      const keyPath = this.authConfig.certificatePath.replace(
        /\.(pem|crt)$/,
        '.key',
      );
      let key: Buffer;

      if (fs.existsSync(keyPath)) {
        key = fs.readFileSync(keyPath);
      } else {
        key = cert; // Use same file if no separate key
      }

      this.logger.log('Using client certificate for authentication');

      return new https.Agent({
        cert,
        key,
        rejectUnauthorized: true,
      });
    } catch (error) {
      this.logger.error(
        `Failed to load client certificate: ${error.message}`,
      );
      return undefined;
    }
  }

  /**
   * Test authentication (for health checks)
   */
  async testAuthentication(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      return !!token;
    } catch (error) {
      this.logger.error(`Authentication test failed: ${error.message}`);
      return false;
    }
  }
}
