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
  LexOfficeCredentials,
  LexOfficeContact,
  ContactListResponse,
  ContactSearchParams,
  LexOfficeInvoice,
  CreateInvoiceRequest,
  InvoiceListResponse,
  InvoiceSearchParams,
  LexOfficeVoucher,
  CreateVoucherRequest,
  VoucherListResponse,
  VoucherListFilters,
  LexOfficeTransaction,
  LexOfficeWebhookEvent,
  WebhookRegistration,
  LexOfficeErrorResponse,
  RateLimitInfo,
  FileUploadResponse,
  DownloadFileResponse,
} from './lexoffice.types';
import {
  LEXOFFICE_API_BASE_URL,
  RATE_LIMIT,
  PAGINATION_DEFAULTS,
  API_VERSION_HEADER,
  LexOfficeErrorCode,
} from './lexoffice.constants';

/**
 * LexOffice Integration Service
 * Handles API integration with LexOffice accounting software
 *
 * API Documentation: https://developers.lexoffice.io/docs/
 *
 * Features:
 * - Contact management (customers, vendors)
 * - Invoice creation and management
 * - Voucher (Beleg) management for expenses
 * - Transaction tracking
 * - Webhook handling for real-time updates
 * - Rate limiting compliance (60 req/min)
 *
 * Authentication:
 * - API Key authentication via Bearer token
 */
@Injectable()
export class LexOfficeService {
  private readonly logger = new Logger(LexOfficeService.name);
  private readonly baseUrl: string;
  private readonly httpClient: AxiosInstance;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('LEXOFFICE_BASE_URL') || LEXOFFICE_API_BASE_URL;

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: API_VERSION_HEADER,
      },
    });

    // Add response interceptor for rate limiting and error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        this.updateRateLimitInfo(response.headers);
        return response;
      },
      (error: AxiosError<LexOfficeErrorResponse>) => {
        this.handleApiError(error);
      },
    );

    this.logger.log('LexOffice Service initialized');
  }

  /**
   * Get authorization headers with API key
   */
  private getAuthHeaders(apiKey: string): Record<string, string> {
    if (!apiKey) {
      throw new UnauthorizedException('LexOffice API key is required');
    }

    return {
      Authorization: `Bearer ${apiKey}`,
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
    if (this.rateLimitInfo && this.rateLimitInfo.remaining < 5) {
      this.logger.warn(
        `Rate limit warning: ${this.rateLimitInfo.remaining} requests remaining`,
      );
    }
  }

  // =====================
  // CONTACT MANAGEMENT
  // =====================

  /**
   * List all contacts with optional filtering
   * @param credentials LexOffice API credentials
   * @param params Search and pagination parameters
   */
  async listContacts(
    credentials: LexOfficeCredentials,
    params?: ContactSearchParams,
  ): Promise<ContactListResponse> {
    this.checkRateLimit();

    try {
      this.logger.log('Fetching contacts list');

      const queryParams: any = {
        page: params?.page || 0,
        size: params?.size || PAGINATION_DEFAULTS.PAGE_SIZE,
        direction: params?.direction || 'ASC',
        property: params?.property || 'name',
      };

      // Add optional filters
      if (params?.email) {
        queryParams.email = params.email;
      }
      if (params?.name) {
        queryParams.name = params.name;
      }
      if (params?.customer !== undefined) {
        queryParams.customer = params.customer;
      }
      if (params?.vendor !== undefined) {
        queryParams.vendor = params.vendor;
      }

      const response = await this.httpClient.get<ContactListResponse>('/contacts', {
        params: queryParams,
        headers: this.getAuthHeaders(credentials.apiKey),
      });

      this.logger.log(`Found ${response.data.numberOfElements} contacts`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch contacts', error);
      throw new BadRequestException('Failed to fetch contacts from LexOffice');
    }
  }

  /**
   * Get contact by ID
   * @param credentials LexOffice API credentials
   * @param contactId Contact ID
   */
  async getContact(
    credentials: LexOfficeCredentials,
    contactId: string,
  ): Promise<LexOfficeContact> {
    this.checkRateLimit();

    try {
      this.logger.log(`Fetching contact: ${contactId}`);

      const response = await this.httpClient.get<LexOfficeContact>(
        `/contacts/${contactId}`,
        {
          headers: this.getAuthHeaders(credentials.apiKey),
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch contact: ${contactId}`, error);
      throw new NotFoundException(`Contact not found: ${contactId}`);
    }
  }

  /**
   * Create a new contact
   * @param credentials LexOffice API credentials
   * @param contact Contact data
   */
  async createContact(
    credentials: LexOfficeCredentials,
    contact: LexOfficeContact,
  ): Promise<{ id: string; resourceUri: string }> {
    this.checkRateLimit();

    try {
      this.logger.log('Creating new contact');

      const response = await this.httpClient.post('/contacts', contact, {
        headers: this.getAuthHeaders(credentials.apiKey),
      });

      const locationHeader = response.headers['location'];
      const contactId = locationHeader ? locationHeader.split('/').pop() : '';

      this.logger.log(`Created contact: ${contactId}`);
      return {
        id: contactId,
        resourceUri: locationHeader,
      };
    } catch (error) {
      this.logger.error('Failed to create contact', error);
      throw new BadRequestException('Failed to create contact in LexOffice');
    }
  }

  /**
   * Update an existing contact
   * @param credentials LexOffice API credentials
   * @param contactId Contact ID
   * @param contact Updated contact data
   */
  async updateContact(
    credentials: LexOfficeCredentials,
    contactId: string,
    contact: LexOfficeContact,
  ): Promise<void> {
    this.checkRateLimit();

    try {
      this.logger.log(`Updating contact: ${contactId}`);

      await this.httpClient.put(`/contacts/${contactId}`, contact, {
        headers: this.getAuthHeaders(credentials.apiKey),
      });

      this.logger.log(`Updated contact: ${contactId}`);
    } catch (error) {
      this.logger.error(`Failed to update contact: ${contactId}`, error);
      throw new BadRequestException('Failed to update contact in LexOffice');
    }
  }

  // =====================
  // INVOICE MANAGEMENT
  // =====================

  /**
   * List all invoices with optional filtering
   * @param credentials LexOffice API credentials
   * @param params Search and pagination parameters
   */
  async listInvoices(
    credentials: LexOfficeCredentials,
    params?: InvoiceSearchParams,
  ): Promise<InvoiceListResponse> {
    this.checkRateLimit();

    try {
      this.logger.log('Fetching invoices list');

      const queryParams: any = {
        page: params?.page || 0,
        size: params?.size || PAGINATION_DEFAULTS.PAGE_SIZE,
        direction: params?.direction || 'DESC',
        property: params?.property || 'voucherDate',
      };

      // Add optional filters
      if (params?.voucherStatus) {
        queryParams.voucherStatus = params.voucherStatus;
      }
      if (params?.voucherDateFrom) {
        queryParams.voucherDateFrom = params.voucherDateFrom;
      }
      if (params?.voucherDateTo) {
        queryParams.voucherDateTo = params.voucherDateTo;
      }
      if (params?.contactId) {
        queryParams.contactId = params.contactId;
      }

      const response = await this.httpClient.get<InvoiceListResponse>('/voucherlist', {
        params: {
          ...queryParams,
          voucherType: 'invoice,salesinvoice',
        },
        headers: this.getAuthHeaders(credentials.apiKey),
      });

      this.logger.log(`Found ${response.data.numberOfElements} invoices`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch invoices', error);
      throw new BadRequestException('Failed to fetch invoices from LexOffice');
    }
  }

  /**
   * Get invoice by ID
   * @param credentials LexOffice API credentials
   * @param invoiceId Invoice ID
   */
  async getInvoice(
    credentials: LexOfficeCredentials,
    invoiceId: string,
  ): Promise<LexOfficeInvoice> {
    this.checkRateLimit();

    try {
      this.logger.log(`Fetching invoice: ${invoiceId}`);

      const response = await this.httpClient.get<LexOfficeInvoice>(
        `/invoices/${invoiceId}`,
        {
          headers: this.getAuthHeaders(credentials.apiKey),
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch invoice: ${invoiceId}`, error);
      throw new NotFoundException(`Invoice not found: ${invoiceId}`);
    }
  }

  /**
   * Create a new invoice (finalized)
   * @param credentials LexOffice API credentials
   * @param invoice Invoice data
   * @param finalize Whether to finalize the invoice immediately
   */
  async createInvoice(
    credentials: LexOfficeCredentials,
    invoice: CreateInvoiceRequest,
    finalize: boolean = true,
  ): Promise<{ id: string; resourceUri: string; documentFileId?: string }> {
    this.checkRateLimit();

    try {
      this.logger.log(`Creating new invoice (finalized: ${finalize})`);

      const endpoint = finalize ? '/invoices' : '/invoices?finalize=false';
      const response = await this.httpClient.post(endpoint, invoice, {
        headers: this.getAuthHeaders(credentials.apiKey),
      });

      const locationHeader = response.headers['location'];
      const invoiceId = locationHeader ? locationHeader.split('/').pop() : '';

      this.logger.log(`Created invoice: ${invoiceId}`);
      return {
        id: invoiceId,
        resourceUri: locationHeader,
        documentFileId: response.data?.documentFileId,
      };
    } catch (error) {
      this.logger.error('Failed to create invoice', error);
      throw new BadRequestException('Failed to create invoice in LexOffice');
    }
  }

  /**
   * Finalize a draft invoice
   * @param credentials LexOffice API credentials
   * @param invoiceId Invoice ID
   */
  async finalizeInvoice(
    credentials: LexOfficeCredentials,
    invoiceId: string,
  ): Promise<{ documentFileId: string }> {
    this.checkRateLimit();

    try {
      this.logger.log(`Finalizing invoice: ${invoiceId}`);

      const response = await this.httpClient.put(
        `/invoices/${invoiceId}/finalize`,
        {},
        {
          headers: this.getAuthHeaders(credentials.apiKey),
        },
      );

      this.logger.log(`Finalized invoice: ${invoiceId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to finalize invoice: ${invoiceId}`, error);
      throw new BadRequestException('Failed to finalize invoice in LexOffice');
    }
  }

  /**
   * Download invoice PDF
   * @param credentials LexOffice API credentials
   * @param documentFileId Document file ID from invoice
   */
  async downloadInvoice(
    credentials: LexOfficeCredentials,
    documentFileId: string,
  ): Promise<DownloadFileResponse> {
    this.checkRateLimit();

    try {
      this.logger.log(`Downloading invoice PDF: ${documentFileId}`);

      const response = await this.httpClient.get(`/files/${documentFileId}`, {
        headers: this.getAuthHeaders(credentials.apiKey),
        responseType: 'arraybuffer',
      });

      return {
        content: Buffer.from(response.data),
        filename: `invoice-${documentFileId}.pdf`,
        contentType: response.headers['content-type'] || 'application/pdf',
      };
    } catch (error) {
      this.logger.error(`Failed to download invoice: ${documentFileId}`, error);
      throw new NotFoundException(`Invoice file not found: ${documentFileId}`);
    }
  }

  // =====================
  // VOUCHER MANAGEMENT
  // =====================

  /**
   * List all vouchers (expenses, receipts) with optional filtering
   * @param credentials LexOffice API credentials
   * @param filters Filter and pagination parameters
   */
  async listVouchers(
    credentials: LexOfficeCredentials,
    filters?: VoucherListFilters,
  ): Promise<VoucherListResponse> {
    this.checkRateLimit();

    try {
      this.logger.log('Fetching vouchers list');

      const queryParams: any = {
        page: filters?.page || 0,
        size: filters?.size || PAGINATION_DEFAULTS.PAGE_SIZE,
        direction: filters?.direction || 'DESC',
        property: filters?.property || 'voucherDate',
      };

      // Add optional filters
      if (filters?.voucherType) {
        queryParams.voucherType = filters.voucherType;
      }
      if (filters?.voucherStatus) {
        queryParams.voucherStatus = filters.voucherStatus;
      }
      if (filters?.voucherDateFrom) {
        queryParams.voucherDateFrom = filters.voucherDateFrom;
      }
      if (filters?.voucherDateTo) {
        queryParams.voucherDateTo = filters.voucherDateTo;
      }
      if (filters?.contactId) {
        queryParams.contactId = filters.contactId;
      }

      const response = await this.httpClient.get<VoucherListResponse>('/voucherlist', {
        params: queryParams,
        headers: this.getAuthHeaders(credentials.apiKey),
      });

      const numberOfElements = response.data.content?.length || 0;
      this.logger.log(`Found ${numberOfElements} vouchers`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch vouchers', error);
      throw new BadRequestException('Failed to fetch vouchers from LexOffice');
    }
  }

  /**
   * Get voucher by ID
   * @param credentials LexOffice API credentials
   * @param voucherId Voucher ID
   */
  async getVoucher(
    credentials: LexOfficeCredentials,
    voucherId: string,
  ): Promise<LexOfficeVoucher> {
    this.checkRateLimit();

    try {
      this.logger.log(`Fetching voucher: ${voucherId}`);

      const response = await this.httpClient.get<LexOfficeVoucher>(
        `/vouchers/${voucherId}`,
        {
          headers: this.getAuthHeaders(credentials.apiKey),
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch voucher: ${voucherId}`, error);
      throw new NotFoundException(`Voucher not found: ${voucherId}`);
    }
  }

  /**
   * Create a new voucher (expense)
   * @param credentials LexOffice API credentials
   * @param voucher Voucher data
   */
  async createVoucher(
    credentials: LexOfficeCredentials,
    voucher: CreateVoucherRequest,
  ): Promise<{ id: string; resourceUri: string }> {
    this.checkRateLimit();

    try {
      this.logger.log('Creating new voucher');

      const response = await this.httpClient.post('/vouchers', voucher, {
        headers: this.getAuthHeaders(credentials.apiKey),
      });

      const locationHeader = response.headers['location'];
      const voucherId = locationHeader ? locationHeader.split('/').pop() : '';

      this.logger.log(`Created voucher: ${voucherId}`);
      return {
        id: voucherId,
        resourceUri: locationHeader,
      };
    } catch (error) {
      this.logger.error('Failed to create voucher', error);
      throw new BadRequestException('Failed to create voucher in LexOffice');
    }
  }

  /**
   * Upload file to voucher
   * @param credentials LexOffice API credentials
   * @param voucherId Voucher ID
   * @param fileContent Base64 encoded file content
   * @param filename Filename
   */
  async uploadVoucherFile(
    credentials: LexOfficeCredentials,
    voucherId: string,
    fileContent: string,
    filename: string,
  ): Promise<FileUploadResponse> {
    this.checkRateLimit();

    try {
      this.logger.log(`Uploading file to voucher: ${voucherId}`);

      const response = await this.httpClient.post<FileUploadResponse>(
        `/vouchers/${voucherId}/files`,
        {
          file: {
            content: fileContent,
            filename: filename,
          },
        },
        {
          headers: this.getAuthHeaders(credentials.apiKey),
        },
      );

      this.logger.log(`Uploaded file to voucher: ${voucherId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to upload file to voucher: ${voucherId}`, error);
      throw new BadRequestException('Failed to upload file to voucher');
    }
  }

  // =====================
  // WEBHOOK MANAGEMENT
  // =====================

  /**
   * Handle incoming webhook event from LexOffice
   * @param event Webhook event payload
   */
  async handleWebhookEvent(event: LexOfficeWebhookEvent): Promise<void> {
    try {
      this.logger.log(
        `Processing webhook event: ${event.eventType} for resource ${event.resourceId}`,
      );

      // TODO: Implement webhook event processing based on event type
      // This would typically update local database records, trigger sync operations, etc.

      switch (event.eventType) {
        case 'contact.created':
        case 'contact.updated':
          this.logger.log(`Contact ${event.eventType.split('.')[1]}: ${event.resourceId}`);
          break;
        case 'invoice.created':
        case 'invoice.updated':
          this.logger.log(`Invoice ${event.eventType.split('.')[1]}: ${event.resourceId}`);
          break;
        case 'voucher.created':
        case 'voucher.updated':
          this.logger.log(`Voucher ${event.eventType.split('.')[1]}: ${event.resourceId}`);
          break;
        default:
          this.logger.warn(`Unhandled webhook event type: ${event.eventType}`);
      }
    } catch (error) {
      this.logger.error('Failed to process webhook event', error);
      throw new BadRequestException('Failed to process webhook event');
    }
  }

  /**
   * Register webhook endpoint with LexOffice
   * Note: Webhook registration is typically done via LexOffice dashboard
   * This method is for reference purposes
   */
  async registerWebhook(
    credentials: LexOfficeCredentials,
    registration: WebhookRegistration,
  ): Promise<void> {
    this.logger.log(
      `Webhook registration should be done via LexOffice dashboard at: https://app.lexoffice.de/settings/integrations/webhooks`,
    );
    this.logger.log(`Callback URL: ${registration.callbackUrl}`);
    this.logger.log(`Events: ${registration.events.join(', ')}`);
  }

  // =====================
  // ERROR HANDLING
  // =====================

  /**
   * Handle API errors from LexOffice
   */
  private handleApiError(error: AxiosError<LexOfficeErrorResponse>): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      this.logger.error(`LexOffice API error (${status}): ${data?.message || error.message}`, {
        details: data?.details,
        path: data?.path,
        traceId: data?.traceId,
      });

      switch (status) {
        case 400:
          throw new BadRequestException(
            data?.message || 'Invalid request to LexOffice API',
          );
        case 401:
          throw new UnauthorizedException(
            data?.message || 'Invalid API key or authentication failed',
          );
        case 402:
          throw new UnauthorizedException(
            'LexOffice subscription required or quota exceeded',
          );
        case 403:
          throw new UnauthorizedException(
            data?.message || 'Insufficient permissions for LexOffice resource',
          );
        case 404:
          throw new NotFoundException(data?.message || 'Resource not found in LexOffice');
        case 406:
          throw new BadRequestException('Unsupported content type or format');
        case 409:
          throw new ConflictException(data?.message || 'Resource conflict in LexOffice');
        case 429:
          this.logger.error('Rate limit exceeded for LexOffice API');
          throw new ServiceUnavailableException(
            'LexOffice rate limit exceeded. Please try again later.',
          );
        case 500:
        case 502:
        case 503:
        case 504:
          throw new ServiceUnavailableException('LexOffice service temporarily unavailable');
        default:
          throw new ServiceUnavailableException('LexOffice API error');
      }
    }

    if (error.code === 'ECONNABORTED') {
      throw new ServiceUnavailableException('Request to LexOffice timed out');
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new ServiceUnavailableException('Cannot connect to LexOffice API');
    }

    this.logger.error('LexOffice API error', error);
    throw new ServiceUnavailableException('Failed to communicate with LexOffice');
  }
}
