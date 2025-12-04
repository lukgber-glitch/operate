import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  AtoAuthCredentials,
  AtoTokenResponse,
  AtoError,
} from './ato.types';
import {
  ATO_API_URLS,
  ATO_ERROR_CODES,
  ATO_ERROR_MESSAGES,
  ATO_TLS_CONFIG,
} from './ato.constants';

/**
 * ATO Authentication Service
 *
 * Handles myGovID and RAM (Relationship Authorisation Manager) authentication
 * Manages OAuth 2.0 tokens with PKCE (Proof Key for Code Exchange)
 *
 * @see https://www.ato.gov.au/business/online-services/relationship-authorisation-manager/
 */
@Injectable()
export class AtoAuthService {
  private readonly logger = new Logger(AtoAuthService.name);
  private readonly httpClient: AxiosInstance;
  private readonly tokenCache = new Map<string, AtoTokenResponse>();

  constructor(private readonly configService: ConfigService) {
    this.httpClient = axios.create({
      httpsAgent: {
        minVersion: ATO_TLS_CONFIG.MIN_VERSION,
        ciphers: ATO_TLS_CONFIG.CIPHERS,
      },
      timeout: 30000,
    });
  }

  /**
   * Generate authorization URL for myGovID login
   */
  generateAuthUrl(
    credentials: AtoAuthCredentials,
    state?: string,
  ): { url: string; codeVerifier: string; state: string } {
    this.logger.log(`Generating auth URL for ABN: ${credentials.abn}`);

    // Generate PKCE code verifier and challenge
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const finalState = state || this.generateState();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri,
      scope: credentials.scope.join(' '),
      state: finalState,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${ATO_API_URLS.AUTH}/authorize?${params.toString()}`;

    return {
      url: authUrl,
      codeVerifier,
      state: finalState,
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    credentials: AtoAuthCredentials,
    authorizationCode: string,
    codeVerifier: string,
  ): Promise<AtoTokenResponse> {
    this.logger.log('Exchanging authorization code for token');

    try {
      const response = await this.httpClient.post(
        `${ATO_API_URLS.AUTH}/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: credentials.redirectUri,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          code_verifier: codeVerifier,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const tokenData = response.data;
      const tokenResponse: AtoTokenResponse = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        issuedAt: new Date(),
      };

      // Cache token
      this.tokenCache.set(credentials.abn, tokenResponse);

      this.logger.log('Successfully obtained access token');
      return tokenResponse;
    } catch (error) {
      this.logger.error('Failed to exchange code for token', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(
    credentials: AtoAuthCredentials,
    refreshToken: string,
  ): Promise<AtoTokenResponse> {
    this.logger.log('Refreshing access token');

    try {
      const response = await this.httpClient.post(
        `${ATO_API_URLS.AUTH}/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const tokenData = response.data;
      const tokenResponse: AtoTokenResponse = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        issuedAt: new Date(),
      };

      // Update cache
      this.tokenCache.set(credentials.abn, tokenResponse);

      this.logger.log('Successfully refreshed access token');
      return tokenResponse;
    } catch (error) {
      this.logger.error('Failed to refresh token', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Machine-to-Machine (M2M) authentication for automated systems
   */
  async authenticateM2M(
    credentials: AtoAuthCredentials,
  ): Promise<AtoTokenResponse> {
    this.logger.log('Performing M2M authentication');

    try {
      const response = await this.httpClient.post(
        `${ATO_API_URLS.AUTH}/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          scope: credentials.scope.join(' '),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const tokenData = response.data;
      const tokenResponse: AtoTokenResponse = {
        accessToken: tokenData.access_token,
        refreshToken: '', // M2M doesn't use refresh tokens
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        issuedAt: new Date(),
      };

      // Cache token
      this.tokenCache.set(credentials.abn, tokenResponse);

      this.logger.log('M2M authentication successful');
      return tokenResponse;
    } catch (error) {
      this.logger.error('M2M authentication failed', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Validate current token and refresh if needed
   */
  async validateAndRefreshToken(
    credentials: AtoAuthCredentials,
    currentToken: AtoTokenResponse,
  ): Promise<AtoTokenResponse> {
    const expiryTime = new Date(
      currentToken.issuedAt.getTime() + currentToken.expiresIn * 1000,
    );

    const now = new Date();
    const bufferMinutes = 5; // Refresh 5 minutes before expiry

    if (now.getTime() + bufferMinutes * 60000 >= expiryTime.getTime()) {
      this.logger.log('Token expired or about to expire, refreshing');
      return this.refreshAccessToken(credentials, currentToken.refreshToken);
    }

    return currentToken;
  }

  /**
   * Revoke access token
   */
  async revokeToken(
    credentials: AtoAuthCredentials,
    token: string,
  ): Promise<void> {
    this.logger.log('Revoking access token');

    try {
      await this.httpClient.post(
        `${ATO_API_URLS.AUTH}/revoke`,
        new URLSearchParams({
          token,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      // Remove from cache
      this.tokenCache.delete(credentials.abn);

      this.logger.log('Token revoked successfully');
    } catch (error) {
      this.logger.error('Failed to revoke token', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get cached token if available and valid
   */
  getCachedToken(abn: string): AtoTokenResponse | null {
    return this.tokenCache.get(abn) || null;
  }

  /**
   * Clear token cache for specific ABN
   */
  clearTokenCache(abn: string): void {
    this.tokenCache.delete(abn);
  }

  /**
   * Generate PKCE code verifier (128 chars)
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(96).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): UnauthorizedException {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        return new UnauthorizedException({
          code: ATO_ERROR_CODES.INVALID_CREDENTIALS,
          message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_CREDENTIALS],
          details: data,
        });
      }

      if (status === 400) {
        return new UnauthorizedException({
          code: ATO_ERROR_CODES.INVALID_TOKEN,
          message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.INVALID_TOKEN],
          details: data,
        });
      }
    }

    return new UnauthorizedException({
      code: ATO_ERROR_CODES.RAM_AUTH_FAILED,
      message: ATO_ERROR_MESSAGES[ATO_ERROR_CODES.RAM_AUTH_FAILED],
      details: error.message,
    });
  }

  /**
   * Encrypt token for secure storage (AES-256-GCM)
   */
  encryptToken(token: string, abn: string): { encrypted: string; iv: string; tag: string } {
    const key = this.getEncryptionKey(abn);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  /**
   * Decrypt token from storage
   */
  decryptToken(
    encrypted: string,
    iv: string,
    tag: string,
    abn: string,
  ): string {
    const key = this.getEncryptionKey(abn);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Get encryption key for ABN
   */
  private getEncryptionKey(abn: string): Buffer {
    const secret = this.configService.get<string>('ATO_ENCRYPTION_SECRET');
    return crypto.scryptSync(`${secret}-${abn}`, 'salt', 32);
  }
}
