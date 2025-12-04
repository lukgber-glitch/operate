import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import {
  TokenResponse,
  GmailProfile,
  MessageList,
  GmailMessage,
  Label,
  LabelListResponse,
  GmailErrorResponse,
} from './gmail.types';

/**
 * Gmail OAuth Service
 * Handles OAuth 2.0 authentication and Gmail API interactions
 *
 * Features:
 * - OAuth 2.0 authorization flow
 * - Token exchange and refresh
 * - User profile retrieval
 * - Email message listing and retrieval
 * - Label management
 *
 * Configuration Required:
 * - GOOGLE_GMAIL_CLIENT_ID
 * - GOOGLE_GMAIL_CLIENT_SECRET
 *
 * @see https://developers.google.com/gmail/api/guides
 */
@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly baseUrl = 'https://gmail.googleapis.com/gmail/v1';
  private readonly authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly userInfoUrl =
    'https://www.googleapis.com/oauth2/v2/userinfo';

  private readonly defaultScopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.metadata',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  constructor(private configService: ConfigService) {}

  /**
   * Get OAuth 2.0 authorization URL
   *
   * @param orgId - Organization ID (used as state parameter)
   * @param redirectUri - OAuth callback redirect URI
   * @param scopes - Optional custom scopes (defaults to read-only scopes)
   * @returns Authorization URL for user to visit
   */
  getAuthorizationUrl(
    orgId: string,
    redirectUri: string,
    scopes?: string[],
  ): string {
    const clientId = this.configService.get<string>('GOOGLE_GMAIL_CLIENT_ID');

    if (!clientId) {
      this.logger.error('GOOGLE_GMAIL_CLIENT_ID not configured');
      throw new BadRequestException(
        'Gmail integration is not configured on this server',
      );
    }

    const scopeList = scopes || this.defaultScopes;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopeList.join(' '),
      state: orgId,
      access_type: 'offline',
      prompt: 'consent',
    });

    const url = `${this.authUrl}?${params.toString()}`;

    this.logger.log(`Generated Gmail OAuth URL for org: ${orgId}`);

    return url;
  }

  /**
   * Exchange authorization code for access tokens
   *
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Same redirect URI used in authorization request
   * @returns Token response with access and refresh tokens
   */
  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('GOOGLE_GMAIL_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'GOOGLE_GMAIL_CLIENT_SECRET',
    );

    if (!clientId || !clientSecret) {
      this.logger.error('Gmail OAuth credentials not configured');
      throw new BadRequestException(
        'Gmail integration is not configured on this server',
      );
    }

    try {
      const response = await axios.post<TokenResponse>(
        this.tokenUrl,
        new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Successfully exchanged Gmail OAuth code for tokens');

      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange Gmail OAuth code', error);
      this.handleApiError(error as AxiosError<GmailErrorResponse>);
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - Valid refresh token
   * @returns New token response
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('GOOGLE_GMAIL_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'GOOGLE_GMAIL_CLIENT_SECRET',
    );

    if (!clientId || !clientSecret) {
      this.logger.error('Gmail OAuth credentials not configured');
      throw new BadRequestException(
        'Gmail integration is not configured on this server',
      );
    }

    try {
      const response = await axios.post<TokenResponse>(
        this.tokenUrl,
        new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Successfully refreshed Gmail access token');

      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh Gmail access token', error);
      this.handleApiError(error as AxiosError<GmailErrorResponse>);
    }
  }

  /**
   * Exchange authorization code for access tokens (wrapper for OAuth callback)
   *
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Same redirect URI used in authorization request
   * @returns Simplified token response
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri?: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    const response = await this.exchangeCode(code, redirectUri || '');
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in,
    };
  }

  /**
   * Get user profile information (alias for getUserProfile)
   *
   * @param accessToken - Valid access token
   * @returns User profile with email and basic info
   */
  async getProfile(accessToken: string): Promise<GmailProfile> {
    return this.getUserProfile(accessToken);
  }

  /**
   * Get user profile information
   *
   * @param accessToken - Valid access token
   * @returns User profile with email and basic info
   */
  async getUserProfile(accessToken: string): Promise<GmailProfile> {
    try {
      const response = await axios.get<GmailProfile>(this.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      this.logger.log(`Retrieved Gmail profile for: ${response.data.email}`);

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Gmail user profile', error);
      this.handleApiError(error as AxiosError<GmailErrorResponse>);
    }
  }

  /**
   * List Gmail messages
   *
   * @param accessToken - Valid access token
   * @param query - Optional Gmail search query (e.g., "is:unread", "from:user@example.com")
   * @param maxResults - Maximum number of messages to return (default: 10, max: 500)
   * @param pageToken - Optional page token for pagination
   * @returns List of messages with metadata
   *
   * @see https://support.google.com/mail/answer/7190?hl=en for query syntax
   */
  async listMessages(
    accessToken: string,
    query?: string,
    maxResults: number = 10,
    pageToken?: string,
  ): Promise<MessageList> {
    try {
      const params = new URLSearchParams({
        maxResults: Math.min(maxResults, 500).toString(),
        ...(query && { q: query }),
        ...(pageToken && { pageToken }),
      });

      const response = await axios.get<MessageList>(
        `${this.baseUrl}/users/me/messages?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log(
        `Listed ${response.data.messages?.length || 0} Gmail messages`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to list Gmail messages', error);
      this.handleApiError(error as AxiosError<GmailErrorResponse>);
    }
  }

  /**
   * Get a specific Gmail message
   *
   * @param accessToken - Valid access token
   * @param messageId - Message ID to retrieve
   * @param format - Message format (full, metadata, minimal, raw)
   * @returns Full message with headers, body, and attachments
   */
  async getMessage(
    accessToken: string,
    messageId: string,
    format: 'full' | 'metadata' | 'minimal' | 'raw' = 'full',
  ): Promise<GmailMessage> {
    try {
      const params = new URLSearchParams({
        format,
      });

      const response = await axios.get<GmailMessage>(
        `${this.baseUrl}/users/me/messages/${messageId}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log(`Retrieved Gmail message: ${messageId}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Gmail message ${messageId}`, error);
      this.handleApiError(error as AxiosError<GmailErrorResponse>);
    }
  }

  /**
   * List Gmail labels
   *
   * @param accessToken - Valid access token
   * @returns List of labels (system and user-defined)
   */
  async listLabels(accessToken: string): Promise<Label[]> {
    try {
      const response = await axios.get<LabelListResponse>(
        `${this.baseUrl}/users/me/labels`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log(`Listed ${response.data.labels?.length || 0} Gmail labels`);

      return response.data.labels || [];
    } catch (error) {
      this.logger.error('Failed to list Gmail labels', error);
      this.handleApiError(error as AxiosError<GmailErrorResponse>);
    }
  }

  /**
   * Handle Gmail API errors
   * Converts axios errors to NestJS exceptions
   *
   * @param error - Axios error from Gmail API
   * @throws BadRequestException for client errors
   * @throws UnauthorizedException for auth errors
   */
  private handleApiError(error: AxiosError<GmailErrorResponse>): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      const message =
        data?.error?.message || error.message || 'Gmail API error';

      if (status === 401 || status === 403) {
        throw new UnauthorizedException(
          `Gmail authentication failed: ${message}`,
        );
      }

      throw new BadRequestException(`Gmail API error: ${message}`);
    }

    throw new BadRequestException(
      `Gmail API request failed: ${error.message}`,
    );
  }
}
