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
  OutlookProfile,
  MessageList,
  OutlookMessage,
  MailFolder,
  MailFolderListResponse,
  GraphErrorResponse,
  SendMailRequest,
  EmailAddress,
  ItemBody,
} from './outlook.types';

/**
 * Outlook OAuth Service
 * Handles OAuth 2.0 authentication and Microsoft Graph API interactions
 *
 * Features:
 * - OAuth 2.0 authorization flow
 * - Token exchange and refresh
 * - User profile retrieval
 * - Email message listing and retrieval
 * - Email sending
 * - Mail folder management
 *
 * Configuration Required:
 * - MICROSOFT_CLIENT_ID
 * - MICROSOFT_CLIENT_SECRET
 * - MICROSOFT_TENANT_ID (optional, defaults to 'common')
 *
 * @see https://docs.microsoft.com/en-us/graph/api/resources/mail-api-overview
 */
@Injectable()
export class OutlookService {
  private readonly logger = new Logger(OutlookService.name);
  private readonly baseUrl = 'https://graph.microsoft.com/v1.0';
  private readonly authBaseUrl = 'https://login.microsoftonline.com';
  private readonly defaultTenant = 'common';

  private readonly defaultScopes = [
    'openid',
    'profile',
    'email',
    'User.Read',
    'Mail.Read',
    'Mail.Send',
    'offline_access',
  ];

  constructor(private configService: ConfigService) {}

  /**
   * Get OAuth 2.0 authorization URL
   *
   * @param orgId - Organization ID (used as state parameter)
   * @param redirectUri - OAuth callback redirect URI
   * @param scopes - Optional custom scopes (defaults to read/send mail scopes)
   * @returns Authorization URL for user to visit
   */
  getAuthorizationUrl(
    orgId: string,
    redirectUri: string,
    scopes?: string[],
  ): string {
    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
    const tenantId =
      this.configService.get<string>('MICROSOFT_TENANT_ID') ||
      this.defaultTenant;

    if (!clientId) {
      this.logger.error('MICROSOFT_CLIENT_ID not configured');
      throw new BadRequestException(
        'Outlook integration is not configured on this server',
      );
    }

    const scopeList = scopes || this.defaultScopes;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scopeList.join(' '),
      state: orgId,
    });

    const url = `${this.authBaseUrl}/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

    this.logger.log(`Generated Outlook OAuth URL for org: ${orgId}`);

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
    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'MICROSOFT_CLIENT_SECRET',
    );
    const tenantId =
      this.configService.get<string>('MICROSOFT_TENANT_ID') ||
      this.defaultTenant;

    if (!clientId || !clientSecret) {
      this.logger.error('Outlook OAuth credentials not configured');
      throw new BadRequestException(
        'Outlook integration is not configured on this server',
      );
    }

    try {
      const response = await axios.post<TokenResponse>(
        `${this.authBaseUrl}/${tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Successfully exchanged Outlook OAuth code for tokens');

      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange Outlook OAuth code', error);
      this.handleApiError(error as AxiosError<GraphErrorResponse>);
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - Valid refresh token
   * @returns New token response
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'MICROSOFT_CLIENT_SECRET',
    );
    const tenantId =
      this.configService.get<string>('MICROSOFT_TENANT_ID') ||
      this.defaultTenant;

    if (!clientId || !clientSecret) {
      this.logger.error('Outlook OAuth credentials not configured');
      throw new BadRequestException(
        'Outlook integration is not configured on this server',
      );
    }

    try {
      const response = await axios.post<TokenResponse>(
        `${this.authBaseUrl}/${tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Successfully refreshed Outlook access token');

      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh Outlook access token', error);
      this.handleApiError(error as AxiosError<GraphErrorResponse>);
    }
  }

  /**
   * Exchange authorization code for tokens (wrapper for OAuth callback)
   * Returns simplified token response compatible with OAuth callback controller
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
   * Get user profile (alias for getUserProfile)
   *
   * @param accessToken - Valid access token
   * @returns User profile with email and basic info
   */
  async getProfile(accessToken: string): Promise<OutlookProfile> {
    return this.getUserProfile(accessToken);
  }

  /**
   * Get user profile information
   *
   * @param accessToken - Valid access token
   * @returns User profile with email and basic info
   */
  async getUserProfile(accessToken: string): Promise<OutlookProfile> {
    try {
      const response = await axios.get<OutlookProfile>(
        `${this.baseUrl}/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log(`Retrieved Outlook profile for: ${response.data.mail}`);

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Outlook user profile', error);
      this.handleApiError(error as AxiosError<GraphErrorResponse>);
    }
  }

  /**
   * List Outlook messages
   *
   * @param accessToken - Valid access token
   * @param filter - Optional OData filter query (e.g., "isRead eq false", "from/emailAddress/address eq 'user@example.com'")
   * @param top - Maximum number of messages to return (default: 10, max: 999)
   * @param skip - Number of messages to skip for pagination
   * @param orderBy - Optional order by clause (e.g., "receivedDateTime DESC")
   * @returns List of messages with metadata
   *
   * @see https://docs.microsoft.com/en-us/graph/query-parameters for OData query syntax
   */
  async listMessages(
    accessToken: string,
    filter?: string,
    top: number = 10,
    skip?: number,
    orderBy?: string,
  ): Promise<MessageList> {
    try {
      const params = new URLSearchParams({
        $top: Math.min(top, 999).toString(),
        ...(filter && { $filter: filter }),
        ...(skip !== undefined && { $skip: skip.toString() }),
        ...(orderBy && { $orderby: orderBy }),
      });

      const response = await axios.get<MessageList>(
        `${this.baseUrl}/me/messages?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log(
        `Listed ${response.data.value?.length || 0} Outlook messages`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to list Outlook messages', error);
      this.handleApiError(error as AxiosError<GraphErrorResponse>);
    }
  }

  /**
   * Get a specific Outlook message
   *
   * @param accessToken - Valid access token
   * @param messageId - Message ID to retrieve
   * @returns Full message with headers, body, and metadata
   */
  async getMessage(
    accessToken: string,
    messageId: string,
  ): Promise<OutlookMessage> {
    try {
      const response = await axios.get<OutlookMessage>(
        `${this.baseUrl}/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log(`Retrieved Outlook message: ${messageId}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Outlook message ${messageId}`, error);
      this.handleApiError(error as AxiosError<GraphErrorResponse>);
    }
  }

  /**
   * Send an email via Outlook
   *
   * @param accessToken - Valid access token
   * @param to - Array of recipient email addresses
   * @param subject - Email subject
   * @param body - Email body content
   * @param isHtml - Whether body is HTML (default: false)
   * @param cc - Optional CC recipients
   * @param bcc - Optional BCC recipients
   * @param saveToSentItems - Whether to save to Sent Items folder (default: true)
   */
  async sendEmail(
    accessToken: string,
    to: string[],
    subject: string,
    body: string,
    isHtml: boolean = false,
    cc?: string[],
    bcc?: string[],
    saveToSentItems: boolean = true,
  ): Promise<void> {
    try {
      const toRecipients: EmailAddress[] = to.map((email) => ({
        emailAddress: { name: '', address: email },
      }));

      const ccRecipients: EmailAddress[] | undefined = cc?.map((email) => ({
        emailAddress: { name: '', address: email },
      }));

      const bccRecipients: EmailAddress[] | undefined = bcc?.map((email) => ({
        emailAddress: { name: '', address: email },
      }));

      const bodyContent: ItemBody = {
        contentType: isHtml ? 'html' : 'text',
        content: body,
      };

      const sendMailRequest: SendMailRequest = {
        message: {
          subject,
          body: bodyContent,
          toRecipients,
          ...(ccRecipients && { ccRecipients }),
          ...(bccRecipients && { bccRecipients }),
        },
        saveToSentItems,
      };

      await axios.post(
        `${this.baseUrl}/me/sendMail`,
        sendMailRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Successfully sent Outlook email to: ${to.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to send Outlook email', error);
      this.handleApiError(error as AxiosError<GraphErrorResponse>);
    }
  }

  /**
   * List mail folders
   *
   * @param accessToken - Valid access token
   * @returns List of mail folders (inbox, sent items, drafts, etc.)
   */
  async listMailFolders(accessToken: string): Promise<MailFolder[]> {
    try {
      const response = await axios.get<MailFolderListResponse>(
        `${this.baseUrl}/me/mailFolders`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log(
        `Listed ${response.data.value?.length || 0} Outlook mail folders`,
      );

      return response.data.value || [];
    } catch (error) {
      this.logger.error('Failed to list Outlook mail folders', error);
      this.handleApiError(error as AxiosError<GraphErrorResponse>);
    }
  }

  /**
   * Mark message as read/unread
   *
   * @param accessToken - Valid access token
   * @param messageId - Message ID to update
   * @param isRead - Whether to mark as read (true) or unread (false)
   */
  async updateMessageReadStatus(
    accessToken: string,
    messageId: string,
    isRead: boolean,
  ): Promise<void> {
    try {
      await axios.patch(
        `${this.baseUrl}/me/messages/${messageId}`,
        { isRead },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        `Updated message ${messageId} read status to: ${isRead}`,
      );
    } catch (error) {
      this.logger.error('Failed to update message read status', error);
      this.handleApiError(error as AxiosError<GraphErrorResponse>);
    }
  }

  /**
   * Handle Microsoft Graph API errors
   * Converts axios errors to NestJS exceptions
   *
   * @param error - Axios error from Graph API
   * @throws BadRequestException for client errors
   * @throws UnauthorizedException for auth errors
   */
  private handleApiError(error: AxiosError<GraphErrorResponse>): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      const message =
        data?.error?.message || error.message || 'Microsoft Graph API error';

      if (status === 401 || status === 403) {
        throw new UnauthorizedException(
          `Outlook authentication failed: ${message}`,
        );
      }

      throw new BadRequestException(`Microsoft Graph API error: ${message}`);
    }

    throw new BadRequestException(
      `Microsoft Graph API request failed: ${error.message}`,
    );
  }
}
