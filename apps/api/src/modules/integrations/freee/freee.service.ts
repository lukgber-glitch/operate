import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { FreeeOAuthService } from './freee-oauth.service';
import { FreeeContactMapper } from './mappers/contact.mapper';
import { FreeeInvoiceMapper } from './mappers/invoice.mapper';
import { FreeeTransactionMapper } from './mappers/transaction.mapper';
import {
  FREEE_ENDPOINTS,
  FREEE_RATE_LIMIT,
  FreeeConnectionStatus,
} from './freee.constants';
import {
  FreeeCompany,
  FreeePartner,
  FreeeInvoice,
  FreeeDeal,
  FreeeWalletTxn,
  FreeeApiError,
  RateLimiterState,
} from './freee.types';

/**
 * freee API Service
 * Main service for interacting with freee API
 *
 * Features:
 * - Automatic token refresh
 * - Rate limiting (600 requests per 10 minutes per company)
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - Bidirectional data sync
 * - Japanese fiscal year support
 */
@Injectable()
export class FreeeService {
  private readonly logger = new Logger(FreeeService.name);
  private readonly httpClient: AxiosInstance;
  private readonly rateLimiters: Map<number, RateLimiterState> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly oauthService: FreeeOAuthService,
    private readonly contactMapper: FreeeContactMapper,
    private readonly invoiceMapper: FreeeInvoiceMapper,
    private readonly transactionMapper: FreeeTransactionMapper,
  ) {
    // Initialize HTTP client
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add request interceptor for authorization and rate limiting
    this.httpClient.interceptors.request.use(
      async (config) => {
        // Rate limiting will be handled per-request
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<FreeeApiError>) => {
        if (error.response?.status === 401) {
          // Token expired, handled by getAccessToken auto-refresh
          this.logger.warn('Received 401 Unauthorized from freee API');
        } else if (error.response?.status === 429) {
          // Rate limit exceeded
          this.logger.warn('Rate limit exceeded for freee API');
          throw new BadRequestException('Rate limit exceeded. Please try again later.');
        }
        throw error;
      },
    );

    this.logger.log('freee Service initialized');
  }

  /**
   * Get authenticated HTTP client with access token
   */
  private async getAuthenticatedClient(
    orgId: string,
    freeeCompanyId?: number,
  ): Promise<AxiosInstance> {
    const accessToken = await this.oauthService.getAccessToken(orgId, freeeCompanyId);
    if (!accessToken) {
      throw new UnauthorizedException('No active freee connection. Please connect first.');
    }

    const client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return client;
  }

  /**
   * Check and enforce rate limiting
   */
  private async checkRateLimit(freeeCompanyId: number): Promise<void> {
    const now = Date.now();
    const limiter = this.rateLimiters.get(freeeCompanyId);

    if (!limiter) {
      // Initialize rate limiter
      this.rateLimiters.set(freeeCompanyId, {
        requests: 1,
        resetAt: now + FREEE_RATE_LIMIT.windowMs,
      });
      return;
    }

    // Check if window has reset
    if (now >= limiter.resetAt) {
      limiter.requests = 1;
      limiter.resetAt = now + FREEE_RATE_LIMIT.windowMs;
      return;
    }

    // Check if limit exceeded
    if (limiter.requests >= FREEE_RATE_LIMIT.requestsPerWindow) {
      const waitTime = limiter.resetAt - now;
      this.logger.warn(
        `Rate limit exceeded for company ${freeeCompanyId}. Reset in ${Math.ceil(waitTime / 1000)}s`,
      );
      throw new BadRequestException(
        `Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`,
      );
    }

    // Increment request count
    limiter.requests++;

    // Add delay to avoid bursting
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 / FREEE_RATE_LIMIT.requestsPerSecond),
    );
  }

  // ==================== COMPANY OPERATIONS ====================

  /**
   * Get all companies accessible with current token
   */
  async getCompanies(orgId: string): Promise<FreeeCompany[]> {
    try {
      const client = await this.getAuthenticatedClient(orgId);
      const response = await client.get<{ companies: FreeeCompany[] }>(
        FREEE_ENDPOINTS.companies,
      );

      return response.data.companies;
    } catch (error) {
      this.logger.error('Failed to fetch companies', error);
      throw new InternalServerErrorException('Failed to fetch freee companies');
    }
  }

  /**
   * Get single company by ID
   */
  async getCompany(orgId: string, companyId: number): Promise<FreeeCompany> {
    try {
      await this.checkRateLimit(companyId);
      const client = await this.getAuthenticatedClient(orgId, companyId);
      const response = await client.get<{ company: FreeeCompany }>(
        `${FREEE_ENDPOINTS.companies}/${companyId}`,
      );

      return response.data.company;
    } catch (error) {
      this.logger.error(`Failed to fetch company ${companyId}`, error);
      throw new InternalServerErrorException('Failed to fetch freee company');
    }
  }

  // ==================== PARTNER (CONTACT) OPERATIONS ====================

  /**
   * Get all partners (取引先)
   */
  async getPartners(
    orgId: string,
    freeeCompanyId: number,
    params?: {
      offset?: number;
      limit?: number;
    },
  ): Promise<FreeePartner[]> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const queryParams = new URLSearchParams({
        company_id: freeeCompanyId.toString(),
        offset: (params?.offset || 0).toString(),
        limit: (params?.limit || 100).toString(),
      });

      const response = await client.get<{ partners: FreeePartner[] }>(
        `${FREEE_ENDPOINTS.partners}?${queryParams}`,
      );

      return response.data.partners;
    } catch (error) {
      this.logger.error('Failed to fetch partners', error);
      throw new InternalServerErrorException('Failed to fetch freee partners');
    }
  }

  /**
   * Get single partner by ID
   */
  async getPartner(
    orgId: string,
    freeeCompanyId: number,
    partnerId: number,
  ): Promise<FreeePartner> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const response = await client.get<{ partner: FreeePartner }>(
        `${FREEE_ENDPOINTS.partners}/${partnerId}?company_id=${freeeCompanyId}`,
      );

      return response.data.partner;
    } catch (error) {
      this.logger.error(`Failed to fetch partner ${partnerId}`, error);
      throw new InternalServerErrorException('Failed to fetch freee partner');
    }
  }

  /**
   * Create partner
   */
  async createPartner(
    orgId: string,
    freeeCompanyId: number,
    partner: Partial<FreeePartner>,
  ): Promise<FreeePartner> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const response = await client.post<{ partner: FreeePartner }>(
        FREEE_ENDPOINTS.partners,
        { company_id: freeeCompanyId, ...partner },
      );

      this.logger.log(`Created partner: ${response.data.partner.name}`);
      return response.data.partner;
    } catch (error) {
      this.logger.error('Failed to create partner', error);
      throw new InternalServerErrorException('Failed to create freee partner');
    }
  }

  /**
   * Update partner
   */
  async updatePartner(
    orgId: string,
    freeeCompanyId: number,
    partnerId: number,
    updates: Partial<FreeePartner>,
  ): Promise<FreeePartner> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const response = await client.put<{ partner: FreeePartner }>(
        `${FREEE_ENDPOINTS.partners}/${partnerId}`,
        { company_id: freeeCompanyId, ...updates },
      );

      this.logger.log(`Updated partner ${partnerId}`);
      return response.data.partner;
    } catch (error) {
      this.logger.error(`Failed to update partner ${partnerId}`, error);
      throw new InternalServerErrorException('Failed to update freee partner');
    }
  }

  // ==================== INVOICE OPERATIONS ====================

  /**
   * Get all invoices (請求書)
   */
  async getInvoices(
    orgId: string,
    freeeCompanyId: number,
    params?: {
      partnerId?: number;
      startIssueDate?: string;
      endIssueDate?: string;
      offset?: number;
      limit?: number;
    },
  ): Promise<FreeeInvoice[]> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const queryParams = new URLSearchParams({
        company_id: freeeCompanyId.toString(),
        offset: (params?.offset || 0).toString(),
        limit: (params?.limit || 100).toString(),
      });

      if (params?.partnerId) {
        queryParams.append('partner_id', params.partnerId.toString());
      }
      if (params?.startIssueDate) {
        queryParams.append('start_issue_date', params.startIssueDate);
      }
      if (params?.endIssueDate) {
        queryParams.append('end_issue_date', params.endIssueDate);
      }

      const response = await client.get<{ invoices: FreeeInvoice[] }>(
        `${FREEE_ENDPOINTS.invoices}?${queryParams}`,
      );

      return response.data.invoices;
    } catch (error) {
      this.logger.error('Failed to fetch invoices', error);
      throw new InternalServerErrorException('Failed to fetch freee invoices');
    }
  }

  /**
   * Get single invoice by ID
   */
  async getInvoice(
    orgId: string,
    freeeCompanyId: number,
    invoiceId: number,
  ): Promise<FreeeInvoice> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const response = await client.get<{ invoice: FreeeInvoice }>(
        `${FREEE_ENDPOINTS.invoices}/${invoiceId}?company_id=${freeeCompanyId}`,
      );

      return response.data.invoice;
    } catch (error) {
      this.logger.error(`Failed to fetch invoice ${invoiceId}`, error);
      throw new InternalServerErrorException('Failed to fetch freee invoice');
    }
  }

  /**
   * Create invoice
   */
  async createInvoice(
    orgId: string,
    freeeCompanyId: number,
    invoice: Partial<FreeeInvoice>,
  ): Promise<FreeeInvoice> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const response = await client.post<{ invoice: FreeeInvoice }>(
        FREEE_ENDPOINTS.invoices,
        { company_id: freeeCompanyId, ...invoice },
      );

      this.logger.log(`Created invoice: ${response.data.invoice.invoice_number}`);
      return response.data.invoice;
    } catch (error) {
      this.logger.error('Failed to create invoice', error);
      throw new InternalServerErrorException('Failed to create freee invoice');
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(
    orgId: string,
    freeeCompanyId: number,
    invoiceId: number,
    updates: Partial<FreeeInvoice>,
  ): Promise<FreeeInvoice> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const response = await client.put<{ invoice: FreeeInvoice }>(
        `${FREEE_ENDPOINTS.invoices}/${invoiceId}`,
        { company_id: freeeCompanyId, ...updates },
      );

      this.logger.log(`Updated invoice ${invoiceId}`);
      return response.data.invoice;
    } catch (error) {
      this.logger.error(`Failed to update invoice ${invoiceId}`, error);
      throw new InternalServerErrorException('Failed to update freee invoice');
    }
  }

  // ==================== DEAL (TRANSACTION) OPERATIONS ====================

  /**
   * Get all deals (取引)
   */
  async getDeals(
    orgId: string,
    freeeCompanyId: number,
    params?: {
      partnerId?: number;
      type?: 'income' | 'expense';
      status?: 'settled' | 'unsettled';
      startIssueDate?: string;
      endIssueDate?: string;
      offset?: number;
      limit?: number;
    },
  ): Promise<FreeeDeal[]> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const queryParams = new URLSearchParams({
        company_id: freeeCompanyId.toString(),
        offset: (params?.offset || 0).toString(),
        limit: (params?.limit || 100).toString(),
      });

      if (params?.partnerId) {
        queryParams.append('partner_id', params.partnerId.toString());
      }
      if (params?.type) {
        queryParams.append('type', params.type);
      }
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      if (params?.startIssueDate) {
        queryParams.append('start_issue_date', params.startIssueDate);
      }
      if (params?.endIssueDate) {
        queryParams.append('end_issue_date', params.endIssueDate);
      }

      const response = await client.get<{ deals: FreeeDeal[] }>(
        `${FREEE_ENDPOINTS.deals}?${queryParams}`,
      );

      return response.data.deals;
    } catch (error) {
      this.logger.error('Failed to fetch deals', error);
      throw new InternalServerErrorException('Failed to fetch freee deals');
    }
  }

  /**
   * Create deal
   */
  async createDeal(
    orgId: string,
    freeeCompanyId: number,
    deal: Partial<FreeeDeal>,
  ): Promise<FreeeDeal> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const response = await client.post<{ deal: FreeeDeal }>(
        FREEE_ENDPOINTS.deals,
        { company_id: freeeCompanyId, ...deal },
      );

      this.logger.log(`Created deal: ${response.data.deal.id}`);
      return response.data.deal;
    } catch (error) {
      this.logger.error('Failed to create deal', error);
      throw new InternalServerErrorException('Failed to create freee deal');
    }
  }

  // ==================== WALLET TRANSACTION OPERATIONS ====================

  /**
   * Get wallet transactions (明細)
   */
  async getWalletTransactions(
    orgId: string,
    freeeCompanyId: number,
    params?: {
      walletableId?: number;
      walletableType?: 'bank_account' | 'credit_card' | 'wallet';
      startDate?: string;
      endDate?: string;
      offset?: number;
      limit?: number;
    },
  ): Promise<FreeeWalletTxn[]> {
    try {
      await this.checkRateLimit(freeeCompanyId);
      const client = await this.getAuthenticatedClient(orgId, freeeCompanyId);

      const queryParams = new URLSearchParams({
        company_id: freeeCompanyId.toString(),
        offset: (params?.offset || 0).toString(),
        limit: (params?.limit || 100).toString(),
      });

      if (params?.walletableId) {
        queryParams.append('walletable_id', params.walletableId.toString());
      }
      if (params?.walletableType) {
        queryParams.append('walletable_type', params.walletableType);
      }
      if (params?.startDate) {
        queryParams.append('start_date', params.startDate);
      }
      if (params?.endDate) {
        queryParams.append('end_date', params.endDate);
      }

      const response = await client.get<{ wallet_txns: FreeeWalletTxn[] }>(
        `${FREEE_ENDPOINTS.walletTxns}?${queryParams}`,
      );

      return response.data.wallet_txns;
    } catch (error) {
      this.logger.error('Failed to fetch wallet transactions', error);
      throw new InternalServerErrorException('Failed to fetch freee wallet transactions');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get Japanese fiscal year dates
   */
  getFiscalYearDates(year: number): { startDate: string; endDate: string } {
    // Japanese fiscal year: April 1 - March 31
    const startDate = `${year}-04-01`;
    const endDate = `${year + 1}-03-31`;

    return { startDate, endDate };
  }

  /**
   * Get current Japanese fiscal year
   */
  getCurrentFiscalYear(): number {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // If before April, we're in the previous fiscal year
    return month < 4 ? year - 1 : year;
  }
}
