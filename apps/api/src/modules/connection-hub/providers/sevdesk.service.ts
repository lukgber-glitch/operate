import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  SevDeskCredentials,
  SevDeskTokenResponse,
  SevDeskApiResponse,
  SevDeskContact,
  ContactListParams,
  SevDeskInvoice,
  CreateSevDeskInvoiceRequest,
  InvoiceListParams,
  SevDeskVoucher,
  CreateSevDeskVoucherRequest,
  VoucherListParams,
  SevDeskTransaction,
  TransactionListParams,
  SevDeskAccount,
  AccountListParams,
  SevDeskCategory,
  SevDeskWebhookEvent,
  SevDeskWebhookRegistration,
  SevDeskErrorResponse,
  RateLimitInfo,
  SevDeskFileUploadResponse,
  SevDeskExportResponse,
  SevDeskPart,
} from './sevdesk.types';
import {
  SEVDESK_API_BASE_URL,
  SEVDESK_OAUTH,
  RATE_LIMIT,
  PAGINATION_DEFAULTS,
  SevDeskErrorCode,
} from './sevdesk.constants';

/**
 * SevDesk Integration Service
 * Handles API integration with SevDesk cloud accounting software
 *
 * API Documentation: https://api.sevdesk.de/
 *
 * Features:
 * - OAuth2 authentication flow
 * - Contact management (customers, vendors)
 * - Invoice creation and management
 * - Voucher (expense/receipt) management
 * - Bank transaction import
 * - Account chart synchronization
 * - Webhook handling for real-time updates
 * - Rate limiting compliance (300 req/min)
 *
 * Authentication:
 * - OAuth2 with access/refresh tokens
 * - API key fallback for legacy integrations
 */
@Injectable()
export class SevDeskService {
  private readonly logger = new Logger(SevDeskService.name);
  private readonly baseUrl: string;
  private readonly httpClient: AxiosInstance;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('SEVDESK_BASE_URL') || SEVDESK_API_BASE_URL;

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add response interceptor for rate limiting and error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        this.updateRateLimitInfo(response.headers);
        return response;
      },
      (error: AxiosError<SevDeskErrorResponse>) => {
        this.handleApiError(error);
      },
    );

    this.logger.log('SevDesk Service initialized');
  }

  /**
   * Get authorization headers with access token
   */
  private getAuthHeaders(accessToken: string): Record<string, string> {
    if (!accessToken) {
      throw new UnauthorizedException('SevDesk access token is required');
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(headers: any): void {
    if (headers['x-ratelimit-limit']) {
      this.rateLimitInfo = {
        limit: parseInt(headers['x-ratelimit-limit'], 10),
        remaining: parseInt(headers['x-ratelimit-remaining'], 10),
        reset: new Date(parseInt(headers['x-ratelimit-reset'], 10) * 1000),
      };
    }
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Check if rate limit is close to being exceeded
   */
  private checkRateLimit(): void {
    if (this.rateLimitInfo && this.rateLimitInfo.remaining < 10) {
      this.logger.warn(
        `Rate limit warning: ${this.rateLimitInfo.remaining} requests remaining`,
      );
    }
  }

  // =====================
  // OAUTH2 AUTHENTICATION
  // =====================

  /**
   * Generate OAuth2 authorization URL
   * @param clientId OAuth2 client ID
   * @param redirectUri Redirect URI after authorization
   * @param state Optional state parameter for CSRF protection
   * @param scopes Requested scopes
   */
  getAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    state?: string,
    scopes: string[] = ['read', 'write'],
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
    });

    if (state) {
      params.append('state', state);
    }

    return `${SEVDESK_OAUTH.AUTHORIZE_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param code Authorization code from OAuth callback
   * @param clientId OAuth2 client ID
   * @param clientSecret OAuth2 client secret
   * @param redirectUri Redirect URI used in authorization
   */
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<SevDeskCredentials> {
    try {
      this.logger.log('Exchanging authorization code for access token');

      const response = await axios.post<SevDeskTokenResponse>(
        SEVDESK_OAUTH.TOKEN_URL,
        {
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      this.logger.log('Successfully obtained access token');
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt,
        tokenType: response.data.token_type,
        scope: response.data.scope,
      };
    } catch (error) {
      this.logger.error('Failed to exchange code for token', error);
      throw new UnauthorizedException('Failed to authenticate with SevDesk');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken Refresh token
   * @param clientId OAuth2 client ID
   * @param clientSecret OAuth2 client secret
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<SevDeskCredentials> {
    try {
      this.logger.log('Refreshing access token');

      const response = await axios.post<SevDeskTokenResponse>(
        SEVDESK_OAUTH.TOKEN_URL,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      this.logger.log('Successfully refreshed access token');
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt,
        tokenType: response.data.token_type,
        scope: response.data.scope,
      };
    } catch (error) {
      this.logger.error('Failed to refresh access token', error);
      throw new UnauthorizedException('Failed to refresh SevDesk access token');
    }
  }

  /**
   * Revoke access token
   * @param credentials SevDesk credentials
   */
  async revokeToken(credentials: SevDeskCredentials): Promise<void> {
    try {
      this.logger.log('Revoking access token');

      await axios.post(
        SEVDESK_OAUTH.REVOKE_URL,
        {
          token: credentials.accessToken,
        },
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      this.logger.log('Successfully revoked access token');
    } catch (error) {
      this.logger.error('Failed to revoke token', error);
      throw new BadRequestException('Failed to revoke SevDesk token');
    }
  }

  // =====================
  // CONTACT MANAGEMENT
  // =====================

  /**
   * List all contacts with optional filtering
   * @param credentials SevDesk credentials
   * @param params Search and pagination parameters
   */
  async listContacts(
    credentials: SevDeskCredentials,
    params?: ContactListParams,
  ): Promise<SevDeskApiResponse<SevDeskContact>> {
    this.checkRateLimit();

    try {
      this.logger.log('Fetching contacts list');

      const queryParams: any = {
        limit: params?.limit || PAGINATION_DEFAULTS.LIMIT,
        offset: params?.offset || PAGINATION_DEFAULTS.OFFSET,
      };

      // Add optional filters
      if (params?.depth) {
        queryParams.depth = params.depth;
      }
      if (params?.customerNumber) {
        queryParams.customerNumber = params.customerNumber;
      }
      if (params?.name) {
        queryParams.name = params.name;
      }
      if (params?.embed) {
        queryParams.embed = params.embed.join(',');
      }

      const response = await this.httpClient.get<SevDeskApiResponse<SevDeskContact>>(
        '/Contact',
        {
          params: queryParams,
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      this.logger.log(`Found ${response.data.objects?.length || 0} contacts`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch contacts', error);
      throw new BadRequestException('Failed to fetch contacts from SevDesk');
    }
  }

  /**
   * Get contact by ID
   * @param credentials SevDesk credentials
   * @param contactId Contact ID
   */
  async getContact(
    credentials: SevDeskCredentials,
    contactId: number,
  ): Promise<SevDeskContact> {
    this.checkRateLimit();

    try {
      this.logger.log(`Fetching contact: ${contactId}`);

      const response = await this.httpClient.get<SevDeskApiResponse<SevDeskContact>>(
        `/Contact/${contactId}`,
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      if (!response.data.objects || response.data.objects.length === 0) {
        throw new NotFoundException(`Contact not found: ${contactId}`);
      }

      return response.data.objects[0];
    } catch (error) {
      this.logger.error(`Failed to fetch contact: ${contactId}`, error);
      throw new NotFoundException(`Contact not found: ${contactId}`);
    }
  }

  /**
   * Create a new contact
   * @param credentials SevDesk credentials
   * @param contact Contact data
   */
  async createContact(
    credentials: SevDeskCredentials,
    contact: SevDeskContact,
  ): Promise<SevDeskContact> {
    this.checkRateLimit();

    try {
      this.logger.log('Creating new contact');

      const response = await this.httpClient.post<SevDeskApiResponse<SevDeskContact>>(
        '/Contact',
        contact,
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      const createdContact = response.data.objects?.[0];
      if (!createdContact) {
        throw new BadRequestException('Failed to create contact');
      }

      this.logger.log(`Created contact: ${createdContact.id}`);
      return createdContact;
    } catch (error) {
      this.logger.error('Failed to create contact', error);
      throw new BadRequestException('Failed to create contact in SevDesk');
    }
  }

  /**
   * Update an existing contact
   * @param credentials SevDesk credentials
   * @param contactId Contact ID
   * @param contact Updated contact data
   */
  async updateContact(
    credentials: SevDeskCredentials,
    contactId: number,
    contact: Partial<SevDeskContact>,
  ): Promise<SevDeskContact> {
    this.checkRateLimit();

    try {
      this.logger.log(`Updating contact: ${contactId}`);

      const response = await this.httpClient.put<SevDeskApiResponse<SevDeskContact>>(
        `/Contact/${contactId}`,
        contact,
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      const updatedContact = response.data.objects?.[0];
      if (!updatedContact) {
        throw new BadRequestException('Failed to update contact');
      }

      this.logger.log(`Updated contact: ${contactId}`);
      return updatedContact;
    } catch (error) {
      this.logger.error(`Failed to update contact: ${contactId}`, error);
      throw new BadRequestException('Failed to update contact in SevDesk');
    }
  }

  /**
   * Delete a contact
   * @param credentials SevDesk credentials
   * @param contactId Contact ID
   */
  async deleteContact(credentials: SevDeskCredentials, contactId: number): Promise<void> {
    this.checkRateLimit();

    try {
      this.logger.log(`Deleting contact: ${contactId}`);

      await this.httpClient.delete(`/Contact/${contactId}`, {
        headers: this.getAuthHeaders(credentials.accessToken),
      });

      this.logger.log(`Deleted contact: ${contactId}`);
    } catch (error) {
      this.logger.error(`Failed to delete contact: ${contactId}`, error);
      throw new BadRequestException('Failed to delete contact in SevDesk');
    }
  }

  // =====================
  // INVOICE MANAGEMENT
  // =====================

  /**
   * List all invoices with optional filtering
   * @param credentials SevDesk credentials
   * @param params Search and pagination parameters
   */
  async listInvoices(
    credentials: SevDeskCredentials,
    params?: InvoiceListParams,
  ): Promise<SevDeskApiResponse<SevDeskInvoice>> {
    this.checkRateLimit();

    try {
      this.logger.log('Fetching invoices list');

      const queryParams: any = {
        limit: params?.limit || PAGINATION_DEFAULTS.LIMIT,
        offset: params?.offset || PAGINATION_DEFAULTS.OFFSET,
      };

      // Add optional filters
      if (params?.status) {
        queryParams.status = params.status;
      }
      if (params?.contactId) {
        queryParams['contact[id]'] = params.contactId;
        queryParams['contact[objectName]'] = params.contactObjectName || 'Contact';
      }
      if (params?.invoiceNumber) {
        queryParams.invoiceNumber = params.invoiceNumber;
      }
      if (params?.startDate) {
        queryParams.startDate = params.startDate;
      }
      if (params?.endDate) {
        queryParams.endDate = params.endDate;
      }
      if (params?.embed) {
        queryParams.embed = params.embed.join(',');
      }

      const response = await this.httpClient.get<SevDeskApiResponse<SevDeskInvoice>>(
        '/Invoice',
        {
          params: queryParams,
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      this.logger.log(`Found ${response.data.objects?.length || 0} invoices`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch invoices', error);
      throw new BadRequestException('Failed to fetch invoices from SevDesk');
    }
  }

  /**
   * Get invoice by ID
   * @param credentials SevDesk credentials
   * @param invoiceId Invoice ID
   */
  async getInvoice(
    credentials: SevDeskCredentials,
    invoiceId: number,
  ): Promise<SevDeskInvoice> {
    this.checkRateLimit();

    try {
      this.logger.log(`Fetching invoice: ${invoiceId}`);

      const response = await this.httpClient.get<SevDeskApiResponse<SevDeskInvoice>>(
        `/Invoice/${invoiceId}`,
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      if (!response.data.objects || response.data.objects.length === 0) {
        throw new NotFoundException(`Invoice not found: ${invoiceId}`);
      }

      return response.data.objects[0];
    } catch (error) {
      this.logger.error(`Failed to fetch invoice: ${invoiceId}`, error);
      throw new NotFoundException(`Invoice not found: ${invoiceId}`);
    }
  }

  /**
   * Create a new invoice
   * @param credentials SevDesk credentials
   * @param invoiceData Invoice creation request
   */
  async createInvoice(
    credentials: SevDeskCredentials,
    invoiceData: CreateSevDeskInvoiceRequest,
  ): Promise<SevDeskInvoice> {
    this.checkRateLimit();

    try {
      this.logger.log('Creating new invoice');

      const response = await this.httpClient.post<SevDeskApiResponse<SevDeskInvoice>>(
        '/Invoice/Factory/saveInvoice',
        invoiceData,
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      const createdInvoice = response.data.objects?.[0];
      if (!createdInvoice) {
        throw new BadRequestException('Failed to create invoice');
      }

      this.logger.log(`Created invoice: ${createdInvoice.id}`);
      return createdInvoice;
    } catch (error) {
      this.logger.error('Failed to create invoice', error);
      throw new BadRequestException('Failed to create invoice in SevDesk');
    }
  }

  /**
   * Send invoice via email
   * @param credentials SevDesk credentials
   * @param invoiceId Invoice ID
   * @param email Recipient email address
   */
  async sendInvoice(
    credentials: SevDeskCredentials,
    invoiceId: number,
    email: string,
  ): Promise<void> {
    this.checkRateLimit();

    try {
      this.logger.log(`Sending invoice ${invoiceId} to ${email}`);

      await this.httpClient.post(
        `/Invoice/${invoiceId}/sendViaEmail`,
        {
          toEmail: email,
          subject: 'Invoice',
          text: 'Please find your invoice attached.',
        },
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      this.logger.log(`Sent invoice: ${invoiceId}`);
    } catch (error) {
      this.logger.error(`Failed to send invoice: ${invoiceId}`, error);
      throw new BadRequestException('Failed to send invoice via SevDesk');
    }
  }

  /**
   * Download invoice PDF
   * @param credentials SevDesk credentials
   * @param invoiceId Invoice ID
   */
  async downloadInvoice(
    credentials: SevDeskCredentials,
    invoiceId: number,
  ): Promise<SevDeskExportResponse> {
    this.checkRateLimit();

    try {
      this.logger.log(`Downloading invoice PDF: ${invoiceId}`);

      const response = await this.httpClient.get(`/Invoice/${invoiceId}/getPdf`, {
        headers: this.getAuthHeaders(credentials.accessToken),
        responseType: 'arraybuffer',
      });

      return {
        content: Buffer.from(response.data),
        filename: `invoice-${invoiceId}.pdf`,
        contentType: response.headers['content-type'] || 'application/pdf',
      };
    } catch (error) {
      this.logger.error(`Failed to download invoice: ${invoiceId}`, error);
      throw new NotFoundException(`Invoice PDF not found: ${invoiceId}`);
    }
  }

  // =====================
  // VOUCHER MANAGEMENT
  // =====================

  /**
   * List all vouchers (expenses, receipts) with optional filtering
   * @param credentials SevDesk credentials
   * @param params Filter and pagination parameters
   */
  async listVouchers(
    credentials: SevDeskCredentials,
    params?: VoucherListParams,
  ): Promise<SevDeskApiResponse<SevDeskVoucher>> {
    this.checkRateLimit();

    try {
      this.logger.log('Fetching vouchers list');

      const queryParams: any = {
        limit: params?.limit || PAGINATION_DEFAULTS.LIMIT,
        offset: params?.offset || PAGINATION_DEFAULTS.OFFSET,
      };

      // Add optional filters
      if (params?.status) {
        queryParams.status = params.status;
      }
      if (params?.creditDebit) {
        queryParams.creditDebit = params.creditDebit;
      }
      if (params?.voucherType) {
        queryParams.voucherType = params.voucherType;
      }
      if (params?.supplierId) {
        queryParams['supplier[id]'] = params.supplierId;
      }
      if (params?.startDate) {
        queryParams.startDate = params.startDate;
      }
      if (params?.endDate) {
        queryParams.endDate = params.endDate;
      }
      if (params?.embed) {
        queryParams.embed = params.embed.join(',');
      }

      const response = await this.httpClient.get<SevDeskApiResponse<SevDeskVoucher>>(
        '/Voucher',
        {
          params: queryParams,
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      this.logger.log(`Found ${response.data.objects?.length || 0} vouchers`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch vouchers', error);
      throw new BadRequestException('Failed to fetch vouchers from SevDesk');
    }
  }

  /**
   * Get voucher by ID
   * @param credentials SevDesk credentials
   * @param voucherId Voucher ID
   */
  async getVoucher(
    credentials: SevDeskCredentials,
    voucherId: number,
  ): Promise<SevDeskVoucher> {
    this.checkRateLimit();

    try {
      this.logger.log(`Fetching voucher: ${voucherId}`);

      const response = await this.httpClient.get<SevDeskApiResponse<SevDeskVoucher>>(
        `/Voucher/${voucherId}`,
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      if (!response.data.objects || response.data.objects.length === 0) {
        throw new NotFoundException(`Voucher not found: ${voucherId}`);
      }

      return response.data.objects[0];
    } catch (error) {
      this.logger.error(`Failed to fetch voucher: ${voucherId}`, error);
      throw new NotFoundException(`Voucher not found: ${voucherId}`);
    }
  }

  /**
   * Create a new voucher (expense)
   * @param credentials SevDesk credentials
   * @param voucherData Voucher creation request
   */
  async createVoucher(
    credentials: SevDeskCredentials,
    voucherData: CreateSevDeskVoucherRequest,
  ): Promise<SevDeskVoucher> {
    this.checkRateLimit();

    try {
      this.logger.log('Creating new voucher');

      const response = await this.httpClient.post<SevDeskApiResponse<SevDeskVoucher>>(
        '/Voucher/Factory/saveVoucher',
        voucherData,
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      const createdVoucher = response.data.objects?.[0];
      if (!createdVoucher) {
        throw new BadRequestException('Failed to create voucher');
      }

      this.logger.log(`Created voucher: ${createdVoucher.id}`);
      return createdVoucher;
    } catch (error) {
      this.logger.error('Failed to create voucher', error);
      throw new BadRequestException('Failed to create voucher in SevDesk');
    }
  }

  /**
   * Upload file to voucher
   * @param credentials SevDesk credentials
   * @param fileContent Base64 encoded file content
   * @param filename Filename
   */
  async uploadVoucherFile(
    credentials: SevDeskCredentials,
    fileContent: string,
    filename: string,
  ): Promise<SevDeskFileUploadResponse> {
    this.checkRateLimit();

    try {
      this.logger.log(`Uploading voucher file: ${filename}`);

      // SevDesk expects multipart/form-data upload
      // Using axios with buffer directly for file upload
      const fileBuffer = Buffer.from(fileContent, 'base64');

      const response = await axios.post<SevDeskFileUploadResponse>(
        `${this.baseUrl}/Voucher/Factory/uploadTempFile`,
        {
          file: fileBuffer.toString('base64'),
          filename: filename,
        },
        {
          headers: {
            ...this.getAuthHeaders(credentials.accessToken),
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Uploaded voucher file: ${filename}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to upload voucher file: ${filename}`, error);
      throw new BadRequestException('Failed to upload voucher file to SevDesk');
    }
  }

  // =====================
  // BANK TRANSACTIONS
  // =====================

  /**
   * List bank transactions
   * @param credentials SevDesk credentials
   * @param params Filter and pagination parameters
   */
  async listTransactions(
    credentials: SevDeskCredentials,
    params?: TransactionListParams,
  ): Promise<SevDeskApiResponse<SevDeskTransaction>> {
    this.checkRateLimit();

    try {
      this.logger.log('Fetching transactions list');

      const queryParams: any = {
        limit: params?.limit || PAGINATION_DEFAULTS.LIMIT,
        offset: params?.offset || PAGINATION_DEFAULTS.OFFSET,
      };

      // Add optional filters
      if (params?.checkAccountId) {
        queryParams['checkAccount[id]'] = params.checkAccountId;
      }
      if (params?.status !== undefined) {
        queryParams.status = params.status;
      }
      if (params?.startDate) {
        queryParams.startDate = params.startDate;
      }
      if (params?.endDate) {
        queryParams.endDate = params.endDate;
      }
      if (params?.payeePayerName) {
        queryParams.payeePayerName = params.payeePayerName;
      }

      const response = await this.httpClient.get<
        SevDeskApiResponse<SevDeskTransaction>
      >('/CheckAccountTransaction', {
        params: queryParams,
        headers: this.getAuthHeaders(credentials.accessToken),
      });

      this.logger.log(`Found ${response.data.objects?.length || 0} transactions`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch transactions', error);
      throw new BadRequestException('Failed to fetch transactions from SevDesk');
    }
  }

  // =====================
  // CHART OF ACCOUNTS
  // =====================

  /**
   * List accounts from chart of accounts
   * @param credentials SevDesk credentials
   * @param params Filter and pagination parameters
   */
  async listAccounts(
    credentials: SevDeskCredentials,
    params?: AccountListParams,
  ): Promise<SevDeskApiResponse<SevDeskAccount>> {
    this.checkRateLimit();

    try {
      this.logger.log('Fetching accounts list');

      const queryParams: any = {
        limit: params?.limit || PAGINATION_DEFAULTS.LIMIT,
        offset: params?.offset || PAGINATION_DEFAULTS.OFFSET,
      };

      // Add optional filters
      if (params?.type) {
        queryParams.type = params.type;
      }
      if (params?.accountNumber) {
        queryParams.accountNumber = params.accountNumber;
      }

      const response = await this.httpClient.get<SevDeskApiResponse<SevDeskAccount>>(
        '/AccountingContact',
        {
          params: queryParams,
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      this.logger.log(`Found ${response.data.objects?.length || 0} accounts`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch accounts', error);
      throw new BadRequestException('Failed to fetch accounts from SevDesk');
    }
  }

  /**
   * Get account by ID
   * @param credentials SevDesk credentials
   * @param accountId Account ID
   */
  async getAccount(
    credentials: SevDeskCredentials,
    accountId: number,
  ): Promise<SevDeskAccount> {
    this.checkRateLimit();

    try {
      this.logger.log(`Fetching account: ${accountId}`);

      const response = await this.httpClient.get<SevDeskApiResponse<SevDeskAccount>>(
        `/AccountingContact/${accountId}`,
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      if (!response.data.objects || response.data.objects.length === 0) {
        throw new NotFoundException(`Account not found: ${accountId}`);
      }

      return response.data.objects[0];
    } catch (error) {
      this.logger.error(`Failed to fetch account: ${accountId}`, error);
      throw new NotFoundException(`Account not found: ${accountId}`);
    }
  }

  // =====================
  // CATEGORIES
  // =====================

  /**
   * List expense/income categories
   * @param credentials SevDesk credentials
   */
  async listCategories(
    credentials: SevDeskCredentials,
  ): Promise<SevDeskApiResponse<SevDeskCategory>> {
    this.checkRateLimit();

    try {
      this.logger.log('Fetching categories list');

      const response = await this.httpClient.get<SevDeskApiResponse<SevDeskCategory>>(
        '/Category',
        {
          headers: this.getAuthHeaders(credentials.accessToken),
        },
      );

      this.logger.log(`Found ${response.data.objects?.length || 0} categories`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch categories', error);
      throw new BadRequestException('Failed to fetch categories from SevDesk');
    }
  }

  // =====================
  // WEBHOOK MANAGEMENT
  // =====================

  /**
   * Handle incoming webhook event from SevDesk
   * @param event Webhook event payload
   */
  async handleWebhookEvent(event: SevDeskWebhookEvent): Promise<void> {
    try {
      this.logger.log(
        `Processing webhook event: ${event.eventType} for ${event.objectName} ${event.objectId}`,
      );

      // TODO: Implement webhook event processing based on event type
      // This would typically update local database records, trigger sync operations, etc.

      switch (event.eventType) {
        case 'Contact.create':
        case 'Contact.update':
        case 'Contact.delete':
          this.logger.log(`Contact event: ${event.eventType}`);
          break;
        case 'Invoice.create':
        case 'Invoice.update':
        case 'Invoice.delete':
          this.logger.log(`Invoice event: ${event.eventType}`);
          break;
        case 'Voucher.create':
        case 'Voucher.update':
        case 'Voucher.delete':
          this.logger.log(`Voucher event: ${event.eventType}`);
          break;
        default:
          this.logger.warn(`Unhandled webhook event type: ${event.eventType}`);
      }
    } catch (error) {
      this.logger.error('Failed to process webhook event', error);
      throw new BadRequestException('Failed to process webhook event');
    }
  }

  // =====================
  // ERROR HANDLING
  // =====================

  /**
   * Handle API errors from SevDesk
   */
  private handleApiError(error: AxiosError<SevDeskErrorResponse>): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      this.logger.error(
        `SevDesk API error (${status}): ${data?.error?.message || data?.message || error.message}`,
        {
          code: data?.error?.code,
          errors: data?.error?.errors,
        },
      );

      switch (status) {
        case 400:
          throw new BadRequestException(
            data?.error?.message || data?.message || 'Invalid request to SevDesk API',
          );
        case 401:
          throw new UnauthorizedException(
            data?.error?.message ||
              data?.message ||
              'Invalid credentials or authentication failed',
          );
        case 403:
          throw new UnauthorizedException(
            data?.error?.message ||
              data?.message ||
              'Insufficient permissions for SevDesk resource',
          );
        case 404:
          throw new NotFoundException(
            data?.error?.message || data?.message || 'Resource not found in SevDesk',
          );
        case 409:
          throw new ConflictException(
            data?.error?.message || data?.message || 'Resource conflict in SevDesk',
          );
        case 429:
          this.logger.error('Rate limit exceeded for SevDesk API');
          throw new ServiceUnavailableException(
            'SevDesk rate limit exceeded. Please try again later.',
          );
        case 500:
        case 502:
        case 503:
        case 504:
          throw new ServiceUnavailableException(
            'SevDesk service temporarily unavailable',
          );
        default:
          throw new ServiceUnavailableException('SevDesk API error');
      }
    }

    if (error.code === 'ECONNABORTED') {
      throw new ServiceUnavailableException('Request to SevDesk timed out');
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new ServiceUnavailableException('Cannot connect to SevDesk API');
    }

    this.logger.error('SevDesk API error', error);
    throw new ServiceUnavailableException('Failed to communicate with SevDesk');
  }
}
