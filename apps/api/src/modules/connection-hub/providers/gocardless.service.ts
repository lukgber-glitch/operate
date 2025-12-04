import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  TokenResponse,
  Institution,
  Requisition,
  BankAccount,
  Transaction,
  Balance,
  TransactionsResponse,
  BalancesResponse,
  CreateRequisitionRequest,
  CreateAgreementRequest,
  EndUserAgreement,
  GoCardlessError,
} from './gocardless.types';

/**
 * GoCardless Banking Service
 * Handles OAuth 2.0 integration with GoCardless Bank Account Data API
 * for EU Open Banking
 *
 * API Docs: https://developer.gocardless.com/bank-account-data/overview
 *
 * Flow:
 * 1. Get authorization URL and redirect user to bank
 * 2. User grants consent at their bank
 * 3. Bank redirects back with code
 * 4. Exchange code for access/refresh tokens
 * 5. Use tokens to create requisitions and access account data
 */
@Injectable()
export class GoCardlessService {
  private readonly logger = new Logger(GoCardlessService.name);
  private readonly baseUrl: string;
  private readonly secretId: string;
  private readonly secretKey: string;
  private readonly httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    // Load configuration
    this.baseUrl =
      this.configService.get<string>('GOCARDLESS_BASE_URL') ||
      'https://bankaccountdata.gocardless.com/api/v2';
    this.secretId = this.configService.get<string>('GOCARDLESS_SECRET_ID') || '';
    this.secretKey = this.configService.get<string>('GOCARDLESS_SECRET_KEY') || '';

    if (!this.secretId || !this.secretKey) {
      this.logger.warn(
        'GoCardless credentials not configured. Set GOCARDLESS_SECRET_ID and GOCARDLESS_SECRET_KEY',
      );
    }

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError<GoCardlessError>) => {
        this.handleApiError(error);
      },
    );

    this.logger.log('GoCardless Service initialized');
  }

  /**
   * Get authorization URL for OAuth flow
   * This URL redirects user to select their bank and grant consent
   */
  getAuthorizationUrl(orgId: string, redirectUri: string): string {
    // GoCardless uses a requisition-based flow rather than traditional OAuth
    // The authorization happens when creating a requisition
    // This method is kept for consistency with OAuth flow interface
    // In practice, you would:
    // 1. Create an End User Agreement
    // 2. Create a Requisition with that agreement
    // 3. Return the requisition.link which is the authorization URL

    // For now, return a placeholder that indicates the requisition flow
    return `${this.baseUrl}/requisitions/create?reference=${orgId}&redirect=${encodeURIComponent(redirectUri)}`;
  }

  /**
   * Exchange authorization code for access tokens
   * GoCardless uses JWT tokens obtained via Secret ID/Key
   */
  async exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
    // In GoCardless, there's no traditional code exchange
    // Instead, we obtain tokens using Secret ID and Secret Key
    return this.obtainToken();
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
      accessToken: response.access,
      refreshToken: response.refresh,
      expiresIn: response.access_expires,
    };
  }

  /**
   * Obtain access token using Secret ID and Secret Key
   */
  async obtainToken(): Promise<TokenResponse> {
    try {
      this.logger.log('Obtaining GoCardless access token');

      const response = await this.httpClient.post<TokenResponse>('/token/new/', {
        secret_id: this.secretId,
        secret_key: this.secretKey,
      });

      const tokenData = response.data;

      // Store token for internal use
      this.accessToken = tokenData.access;
      this.tokenExpiresAt = new Date(Date.now() + tokenData.access_expires * 1000);

      this.logger.log('Successfully obtained GoCardless access token');
      return tokenData;
    } catch (error) {
      this.logger.error('Failed to obtain GoCardless token', error);
      throw new UnauthorizedException('Failed to authenticate with GoCardless');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      this.logger.log('Refreshing GoCardless access token');

      const response = await this.httpClient.post<TokenResponse>('/token/refresh/', {
        refresh: refreshToken,
      });

      const tokenData = response.data;

      // Update stored token
      this.accessToken = tokenData.access;
      this.tokenExpiresAt = new Date(Date.now() + tokenData.access_expires * 1000);

      this.logger.log('Successfully refreshed GoCardless access token');
      return tokenData;
    } catch (error) {
      this.logger.error('Failed to refresh GoCardless token', error);
      throw new UnauthorizedException('Failed to refresh GoCardless token');
    }
  }

  /**
   * Get list of supported financial institutions for a country
   * @param country ISO 3166 two-letter country code (e.g., 'DE', 'AT', 'GB')
   */
  async getInstitutions(country: string): Promise<Institution[]> {
    await this.ensureValidToken();

    try {
      this.logger.log(`Fetching institutions for country: ${country}`);

      const response = await this.httpClient.get<{ results: Institution[] }>(
        '/institutions/',
        {
          params: { country },
          headers: this.getAuthHeaders(),
        },
      );

      this.logger.log(`Found ${response.data.results.length} institutions for ${country}`);
      return response.data.results;
    } catch (error) {
      this.logger.error(`Failed to fetch institutions for ${country}`, error);
      throw new BadRequestException('Failed to fetch financial institutions');
    }
  }

  /**
   * Create End User Agreement (required before creating requisition)
   * This defines the data access scope and duration
   */
  async createAgreement(
    institutionId: string,
    maxHistoricalDays: number = 90,
    accessValidForDays: number = 90,
  ): Promise<EndUserAgreement> {
    await this.ensureValidToken();

    try {
      this.logger.log(`Creating End User Agreement for institution: ${institutionId}`);

      const request: CreateAgreementRequest = {
        institution_id: institutionId,
        max_historical_days: maxHistoricalDays,
        access_valid_for_days: accessValidForDays,
        access_scope: ['balances', 'details', 'transactions'],
      };

      const response = await this.httpClient.post<EndUserAgreement>(
        '/agreements/enduser/',
        request,
        {
          headers: this.getAuthHeaders(),
        },
      );

      this.logger.log(`Created End User Agreement: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create End User Agreement', error);
      throw new BadRequestException('Failed to create End User Agreement');
    }
  }

  /**
   * Create bank account requisition (consent request)
   * This generates a link for the user to authorize access to their bank account
   * @param institutionId The bank's institution ID
   * @param redirectUri URL to redirect user after authorization
   * @param reference Optional reference (e.g., orgId)
   * @param agreementId Optional agreement ID (created via createAgreement)
   */
  async createRequisition(
    institutionId: string,
    redirectUri: string,
    reference?: string,
    agreementId?: string,
  ): Promise<Requisition> {
    await this.ensureValidToken();

    try {
      this.logger.log(`Creating requisition for institution: ${institutionId}`);

      // If no agreement provided, create one
      let agreement = agreementId;
      if (!agreement) {
        const agreementResponse = await this.createAgreement(institutionId);
        agreement = agreementResponse.id;
      }

      const request: CreateRequisitionRequest = {
        redirect: redirectUri,
        institution_id: institutionId,
        reference: reference || `req-${Date.now()}`,
        agreement,
        account_selection: false,
        redirect_immediate: false,
      };

      const response = await this.httpClient.post<Requisition>(
        '/requisitions/',
        request,
        {
          headers: this.getAuthHeaders(),
        },
      );

      this.logger.log(`Created requisition: ${response.data.id}`);
      this.logger.log(`Authorization link: ${response.data.link}`);

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create requisition', error);
      throw new BadRequestException('Failed to create bank authorization request');
    }
  }

  /**
   * Get requisition by ID
   */
  async getRequisition(requisitionId: string): Promise<Requisition> {
    await this.ensureValidToken();

    try {
      const response = await this.httpClient.get<Requisition>(
        `/requisitions/${requisitionId}/`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch requisition: ${requisitionId}`, error);
      throw new BadRequestException('Failed to fetch requisition');
    }
  }

  /**
   * Get bank accounts associated with a requisition
   * Once user completes authorization, the requisition will have account IDs
   */
  async getAccounts(requisitionId: string): Promise<BankAccount[]> {
    await this.ensureValidToken();

    try {
      this.logger.log(`Fetching accounts for requisition: ${requisitionId}`);

      // First, get the requisition to get account IDs
      const requisition = await this.getRequisition(requisitionId);

      if (!requisition.accounts || requisition.accounts.length === 0) {
        this.logger.warn(`No accounts found for requisition: ${requisitionId}`);
        return [];
      }

      // Fetch details for each account
      const accounts: BankAccount[] = [];
      for (const accountId of requisition.accounts) {
        const account = await this.getAccountDetails(accountId);
        accounts.push(account);
      }

      this.logger.log(`Found ${accounts.length} accounts for requisition: ${requisitionId}`);
      return accounts;
    } catch (error) {
      this.logger.error(`Failed to fetch accounts for requisition: ${requisitionId}`, error);
      throw new BadRequestException('Failed to fetch bank accounts');
    }
  }

  /**
   * Get account details by account ID
   */
  async getAccountDetails(accountId: string): Promise<BankAccount> {
    await this.ensureValidToken();

    try {
      const response = await this.httpClient.get<BankAccount>(
        `/accounts/${accountId}/details/`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      return {
        id: accountId,
        created: '',
        iban: response.data.iban || '',
        institution_id: response.data.institution_id || '',
        status: response.data.status,
        owner_name: response.data.owner_name,
        details: response.data.details,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch account details: ${accountId}`, error);
      throw new BadRequestException('Failed to fetch account details');
    }
  }

  /**
   * Get transactions for a bank account
   * @param accountId Account ID
   * @param dateFrom Optional start date (defaults to 90 days ago)
   * @param dateTo Optional end date (defaults to today)
   */
  async getTransactions(
    accountId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<Transaction[]> {
    await this.ensureValidToken();

    try {
      // Default date range: last 90 days
      const from = dateFrom || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const to = dateTo || new Date();

      const dateFromStr = from.toISOString().split('T')[0];
      const dateToStr = to.toISOString().split('T')[0];

      this.logger.log(
        `Fetching transactions for account: ${accountId} (${dateFromStr} to ${dateToStr})`,
      );

      const response = await this.httpClient.get<TransactionsResponse>(
        `/accounts/${accountId}/transactions/`,
        {
          params: {
            date_from: dateFromStr,
            date_to: dateToStr,
          },
          headers: this.getAuthHeaders(),
        },
      );

      const transactions = response.data.transactions.booked || [];
      const pendingTransactions = response.data.transactions.pending || [];

      this.logger.log(
        `Found ${transactions.length} booked and ${pendingTransactions.length} pending transactions`,
      );

      return [...transactions, ...pendingTransactions];
    } catch (error) {
      this.logger.error(`Failed to fetch transactions for account: ${accountId}`, error);
      throw new BadRequestException('Failed to fetch transactions');
    }
  }

  /**
   * Get account balances
   */
  async getBalances(accountId: string): Promise<Balance[]> {
    await this.ensureValidToken();

    try {
      this.logger.log(`Fetching balances for account: ${accountId}`);

      const response = await this.httpClient.get<BalancesResponse>(
        `/accounts/${accountId}/balances/`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      this.logger.log(`Found ${response.data.balances.length} balances`);
      return response.data.balances;
    } catch (error) {
      this.logger.error(`Failed to fetch balances for account: ${accountId}`, error);
      throw new BadRequestException('Failed to fetch account balances');
    }
  }

  /**
   * Delete requisition (revoke access)
   */
  async deleteRequisition(requisitionId: string): Promise<void> {
    await this.ensureValidToken();

    try {
      this.logger.log(`Deleting requisition: ${requisitionId}`);

      await this.httpClient.delete(`/requisitions/${requisitionId}/`, {
        headers: this.getAuthHeaders(),
      });

      this.logger.log(`Deleted requisition: ${requisitionId}`);
    } catch (error) {
      this.logger.error(`Failed to delete requisition: ${requisitionId}`, error);
      throw new BadRequestException('Failed to delete requisition');
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt) {
      await this.obtainToken();
      return;
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    if (Date.now() + expiryBuffer >= this.tokenExpiresAt.getTime()) {
      this.logger.log('Access token expired or expiring soon, obtaining new token');
      await this.obtainToken();
    }
  }

  /**
   * Get authorization headers with access token
   */
  private getAuthHeaders(): Record<string, string> {
    if (!this.accessToken) {
      throw new UnauthorizedException('No access token available');
    }

    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: AxiosError<GoCardlessError>): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      this.logger.error(
        `GoCardless API error (${status}): ${data?.summary || error.message}`,
        {
          detail: data?.detail,
          type: data?.type,
        },
      );

      switch (status) {
        case 400:
          throw new BadRequestException(data?.detail || 'Invalid request');
        case 401:
          throw new UnauthorizedException(data?.detail || 'Authentication failed');
        case 403:
          throw new UnauthorizedException(data?.detail || 'Access forbidden');
        case 404:
          throw new BadRequestException(data?.detail || 'Resource not found');
        case 429:
          throw new ServiceUnavailableException('Rate limit exceeded');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new ServiceUnavailableException('GoCardless service unavailable');
        default:
          throw new ServiceUnavailableException('GoCardless API error');
      }
    }

    if (error.code === 'ECONNABORTED') {
      throw new ServiceUnavailableException('Request timeout');
    }

    this.logger.error('GoCardless API error', error);
    throw new ServiceUnavailableException('Failed to communicate with GoCardless');
  }
}
