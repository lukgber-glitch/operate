import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import {
  GustoConfig,
  GustoTokens,
  GustoOAuthState,
  GustoApiError,
  GustoConnectionStatus,
} from '../gusto.types';
import {
  getGustoAuthUrl,
  getGustoTokenUrl,
} from '../gusto.config';
import { GustoEncryptionUtil } from '../utils/gusto-encryption.util';

/**
 * Gusto OAuth Service
 * Handles OAuth2 PKCE flow for Gusto Embedded Payroll
 *
 * Features:
 * - OAuth2 authorization with PKCE
 * - Token exchange
 * - Token refresh
 * - State management for security
 */
@Injectable()
export class GustoOAuthService {
  private readonly logger = new Logger(GustoOAuthService.name);
  private readonly config: GustoConfig;
  private readonly authUrl: string;
  private readonly tokenUrl: string;
  private readonly stateStore = new Map<string, GustoOAuthState>();

  constructor(
    private readonly configService: ConfigService,
    private readonly encryption: GustoEncryptionUtil,
  ) {
    this.config = this.configService.get<GustoConfig>('gusto')!;
    this.authUrl = getGustoAuthUrl(this.config.environment);
    this.tokenUrl = getGustoTokenUrl(this.config.environment);
  }

  /**
   * Generate OAuth authorization URL with PKCE
   */
  generateAuthorizationUrl(
    organisationId: string,
    userId: string,
  ): { url: string; state: string } {
    // Generate PKCE parameters
    const state = this.encryption.generateState();
    const codeVerifier = this.encryption.generateCodeVerifier();
    const codeChallenge = this.encryption.generateCodeChallenge(codeVerifier);

    // Store state for verification
    const stateData: GustoOAuthState = {
      state,
      codeVerifier,
      organisationId,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };
    this.stateStore.set(state, stateData);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const url = `${this.authUrl}?${params.toString()}`;

    this.logger.log('Generated OAuth authorization URL', {
      organisationId,
      userId,
      state,
    });

    return { url, state };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    state: string,
  ): Promise<{
    tokens: GustoTokens;
    organisationId: string;
    userId: string;
  }> {
    // Verify state
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }

    // Check expiration
    if (new Date() > stateData.expiresAt) {
      this.stateStore.delete(state);
      throw new BadRequestException('OAuth state expired');
    }

    // Exchange code for token
    try {
      const response = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          code_verifier: stateData.codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const data = response.data;

      // Parse tokens
      const tokens: GustoTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope,
        tokenType: data.token_type,
      };

      this.logger.log('Successfully exchanged code for token', {
        organisationId: stateData.organisationId,
        userId: stateData.userId,
        expiresAt: tokens.expiresAt,
      });

      // Clean up state
      this.stateStore.delete(state);

      return {
        tokens,
        organisationId: stateData.organisationId,
        userId: stateData.userId,
      };
    } catch (error) {
      this.logger.error('Token exchange failed', error);
      this.stateStore.delete(state);
      throw this.handleOAuthError(error, 'Token exchange');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<GustoTokens> {
    try {
      const response = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const data = response.data;

      const tokens: GustoTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Use old if not provided
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope,
        tokenType: data.token_type,
      };

      this.logger.log('Successfully refreshed access token', {
        expiresAt: tokens.expiresAt,
      });

      return tokens;
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw this.handleOAuthError(error, 'Token refresh');
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      // Gusto doesn't have a revoke endpoint, so we just mark as revoked
      this.logger.log('Token marked for revocation');
    } catch (error) {
      this.logger.error('Token revocation failed', error);
      throw this.handleOAuthError(error, 'Token revocation');
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt: Date): boolean {
    // Add 5 minute buffer
    const buffer = 5 * 60 * 1000;
    return new Date().getTime() > (expiresAt.getTime() - buffer);
  }

  /**
   * Determine connection status from token
   */
  getConnectionStatus(
    expiresAt: Date,
    isRevoked: boolean = false,
  ): GustoConnectionStatus {
    if (isRevoked) {
      return GustoConnectionStatus.REVOKED;
    }
    if (this.isTokenExpired(expiresAt)) {
      return GustoConnectionStatus.EXPIRED;
    }
    return GustoConnectionStatus.ACTIVE;
  }

  /**
   * Clean up expired states
   */
  cleanupExpiredStates(): void {
    const now = new Date();
    for (const [state, data] of this.stateStore.entries()) {
      if (now > data.expiresAt) {
        this.stateStore.delete(state);
      }
    }
  }

  /**
   * Handle OAuth errors
   */
  private handleOAuthError(error: any, operation: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<GustoApiError>;
      const errorData = axiosError.response?.data;

      this.logger.error(`OAuth ${operation} failed`, {
        status: axiosError.response?.status,
        data: errorData,
      });

      if (errorData?.error_description) {
        throw new BadRequestException(
          `OAuth error: ${errorData.error_description}`,
        );
      } else if (errorData?.error) {
        throw new BadRequestException(
          `OAuth error: ${errorData.error}`,
        );
      }

      throw new InternalServerErrorException(
        `OAuth ${operation} failed: ${axiosError.message}`,
      );
    }

    throw new InternalServerErrorException(
      `OAuth ${operation} failed: ${error.message}`,
    );
  }
}
