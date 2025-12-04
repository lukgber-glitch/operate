import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ChorusProAuthService } from './chorus-pro-auth.service';
import {
  ChorusProStatusRequest,
  ChorusProStatusResponse,
  ChorusProInvoiceInfo,
  ChorusProInvoiceStatus,
  ChorusProStatusHistoryEntry,
  ChorusProApiConfig,
} from '../types/chorus-pro.types';

/**
 * Chorus Pro Status Service
 *
 * Handles invoice status tracking and history retrieval.
 *
 * Features:
 * - Query invoice status by ID or number
 * - Retrieve invoice history
 * - Track payment status
 * - Monitor rejection reasons
 * - Bulk status queries
 *
 * Status Flow:
 * DEPOSEE → EN_COURS_DE_TRAITEMENT → MISE_A_DISPOSITION → MANDATEE → MISE_EN_PAIEMENT → SOLDEE
 *                                  ↓
 *                              REJETEE (can be RECYCLEE)
 */
@Injectable()
export class ChorusProStatusService {
  private readonly logger = new Logger(ChorusProStatusService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiConfig: ChorusProApiConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: ChorusProAuthService,
  ) {
    // Load API configuration
    this.apiConfig = {
      baseUrl:
        this.configService.get<string>('CHORUS_PRO_API_URL') ||
        'https://chorus-pro.gouv.fr/cpro/transverses',
      version: this.configService.get<string>('CHORUS_PRO_API_VERSION') || 'v1',
      timeout:
        this.configService.get<number>('CHORUS_PRO_API_TIMEOUT') || 60000,
      retryAttempts:
        this.configService.get<number>('CHORUS_PRO_RETRY_ATTEMPTS') || 3,
      retryDelay:
        this.configService.get<number>('CHORUS_PRO_RETRY_DELAY') || 1000,
    };

    // Create HTTP client
    this.httpClient = axios.create({
      baseURL: this.apiConfig.baseUrl,
      timeout: this.apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoachOS-ChorusPro/1.0',
      },
    });

    // Add request interceptor for authentication
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.authService.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          this.logger.warn('Token expired, refreshing...');
          this.authService.invalidateToken();
          const token = await this.authService.getAccessToken();
          error.config.headers.Authorization = `Bearer ${token}`;
          return this.httpClient.request(error.config);
        }
        return Promise.reject(error);
      },
    );

    this.logger.log('Chorus Pro Status Service initialized');
  }

  /**
   * Get invoice status by Chorus Pro ID
   */
  async getInvoiceStatus(
    chorusInvoiceId: string,
  ): Promise<ChorusProInvoiceInfo> {
    try {
      this.logger.log(`Querying status for invoice ${chorusInvoiceId}`);

      const response = await this.httpClient.get(
        `/factures/${this.apiConfig.version}/consulter/${chorusInvoiceId}`,
      );

      const invoice = this.parseInvoiceInfo(response.data);

      this.logger.log(
        `Invoice ${chorusInvoiceId} status: ${invoice.status}`,
      );

      return invoice;
    } catch (error) {
      this.logger.error(
        `Failed to get invoice status: ${error.message}`,
        error.stack,
      );

      if (error.response?.status === 404) {
        throw new NotFoundException(
          `Invoice ${chorusInvoiceId} not found in Chorus Pro`,
        );
      }

      throw error;
    }
  }

  /**
   * Query invoices by criteria
   */
  async queryInvoices(
    request: ChorusProStatusRequest,
  ): Promise<ChorusProStatusResponse> {
    try {
      this.logger.log('Querying invoices with criteria:', request);

      const params = this.buildQueryParams(request);

      const response = await this.httpClient.get(
        `/factures/${this.apiConfig.version}/rechercher`,
        { params },
      );

      const invoices = this.parseInvoiceList(
        response.data.factures || response.data.invoices || [],
      );

      this.logger.log(`Found ${invoices.length} invoices`);

      return {
        success: true,
        invoices,
      };
    } catch (error) {
      this.logger.error(
        `Failed to query invoices: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        invoices: [],
      };
    }
  }

  /**
   * Get invoices by supplier SIRET
   */
  async getInvoicesBySupplier(
    supplierSiret: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<ChorusProInvoiceInfo[]> {
    const response = await this.queryInvoices({
      supplierSiret,
      dateFrom,
      dateTo,
    });

    return response.invoices;
  }

  /**
   * Get invoices by recipient SIRET
   */
  async getInvoicesByRecipient(
    recipientSiret: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<ChorusProInvoiceInfo[]> {
    const response = await this.queryInvoices({
      recipientSiret,
      dateFrom,
      dateTo,
    });

    return response.invoices;
  }

  /**
   * Get rejected invoices for a supplier
   */
  async getRejectedInvoices(
    supplierSiret: string,
    dateFrom?: Date,
  ): Promise<ChorusProInvoiceInfo[]> {
    const allInvoices = await this.getInvoicesBySupplier(
      supplierSiret,
      dateFrom,
    );

    return allInvoices.filter(
      (inv) => inv.status === ChorusProInvoiceStatus.REJETEE,
    );
  }

  /**
   * Get paid invoices for a supplier
   */
  async getPaidInvoices(
    supplierSiret: string,
    dateFrom?: Date,
  ): Promise<ChorusProInvoiceInfo[]> {
    const allInvoices = await this.getInvoicesBySupplier(
      supplierSiret,
      dateFrom,
    );

    return allInvoices.filter(
      (inv) => inv.status === ChorusProInvoiceStatus.SOLDEE,
    );
  }

  /**
   * Get pending invoices for a supplier
   */
  async getPendingInvoices(
    supplierSiret: string,
  ): Promise<ChorusProInvoiceInfo[]> {
    const allInvoices = await this.getInvoicesBySupplier(supplierSiret);

    return allInvoices.filter(
      (inv) =>
        inv.status !== ChorusProInvoiceStatus.SOLDEE &&
        inv.status !== ChorusProInvoiceStatus.REJETEE,
    );
  }

  /**
   * Check if invoice is paid
   */
  async isInvoicePaid(chorusInvoiceId: string): Promise<boolean> {
    try {
      const invoice = await this.getInvoiceStatus(chorusInvoiceId);
      return invoice.status === ChorusProInvoiceStatus.SOLDEE;
    } catch (error) {
      this.logger.error(`Failed to check payment status: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if invoice is rejected
   */
  async isInvoiceRejected(chorusInvoiceId: string): Promise<boolean> {
    try {
      const invoice = await this.getInvoiceStatus(chorusInvoiceId);
      return invoice.status === ChorusProInvoiceStatus.REJETEE;
    } catch (error) {
      this.logger.error(`Failed to check rejection status: ${error.message}`);
      return false;
    }
  }

  /**
   * Get invoice status history
   */
  async getInvoiceHistory(
    chorusInvoiceId: string,
  ): Promise<ChorusProStatusHistoryEntry[]> {
    const invoice = await this.getInvoiceStatus(chorusInvoiceId);
    return invoice.statusHistory || [];
  }

  /**
   * Parse invoice info from API response
   */
  private parseInvoiceInfo(data: any): ChorusProInvoiceInfo {
    return {
      chorusInvoiceId: data.identifiantFacture || data.invoiceId,
      invoiceNumber: data.numeroFacture || data.invoiceNumber,
      invoiceDate: new Date(data.dateFacture || data.invoiceDate),
      invoiceType: data.typeFacture || data.invoiceType,
      status: this.mapStatus(data.statut || data.status),
      statusDate: new Date(data.dateStatut || data.statusDate || Date.now()),
      statusHistory: this.parseStatusHistory(
        data.historiqueStatuts || data.statusHistory || [],
      ),
      supplierSiret: data.siretFournisseur || data.supplierSiret,
      supplierName: data.nomFournisseur || data.supplierName,
      recipientSiret: data.siretDestinataire || data.recipientSiret,
      recipientName: data.nomDestinataire || data.recipientName,
      amountExcludingTax: parseFloat(data.montantHT || data.amountExcludingTax || '0'),
      vatAmount: parseFloat(data.montantTVA || data.vatAmount || '0'),
      amountIncludingTax: parseFloat(data.montantTTC || data.amountIncludingTax || '0'),
      depositDate: new Date(data.dateDepot || data.depositDate),
      processingDate: data.dateTraitement
        ? new Date(data.dateTraitement)
        : undefined,
      paymentDate: data.datePaiement ? new Date(data.datePaiement) : undefined,
      depositNumber: data.numeroDepot || data.depositNumber,
      serviceCode: data.codeService || data.serviceCode,
      engagementNumber: data.numeroEngagement || data.engagementNumber,
      rejectionReason: data.motifRejet || data.rejectionReason,
      rejectionDate: data.dateRejet ? new Date(data.dateRejet) : undefined,
      paymentReference: data.referencePaiement || data.paymentReference,
      paymentAmount: data.montantPaiement
        ? parseFloat(data.montantPaiement)
        : undefined,
    };
  }

  /**
   * Parse list of invoices
   */
  private parseInvoiceList(data: any[]): ChorusProInvoiceInfo[] {
    return data.map((item) => this.parseInvoiceInfo(item));
  }

  /**
   * Parse status history
   */
  private parseStatusHistory(data: any[]): ChorusProStatusHistoryEntry[] {
    return data.map((entry) => ({
      status: this.mapStatus(entry.statut || entry.status),
      date: new Date(entry.date || entry.timestamp),
      comment: entry.commentaire || entry.comment,
      author: entry.auteur || entry.author,
    }));
  }

  /**
   * Build query parameters
   */
  private buildQueryParams(request: ChorusProStatusRequest): any {
    const params: any = {};

    if (request.chorusInvoiceId) {
      params.identifiantFacture = request.chorusInvoiceId;
    }

    if (request.invoiceNumber) {
      params.numeroFacture = request.invoiceNumber;
    }

    if (request.supplierSiret) {
      params.siretFournisseur = request.supplierSiret;
    }

    if (request.recipientSiret) {
      params.siretDestinataire = request.recipientSiret;
    }

    if (request.dateFrom) {
      params.dateDebut = request.dateFrom.toISOString().split('T')[0];
    }

    if (request.dateTo) {
      params.dateFin = request.dateTo.toISOString().split('T')[0];
    }

    return params;
  }

  /**
   * Map status from API response
   */
  private mapStatus(status: string): ChorusProInvoiceStatus {
    const statusMap: Record<string, ChorusProInvoiceStatus> = {
      DEPOSEE: ChorusProInvoiceStatus.DEPOSEE,
      EN_COURS_DE_TRAITEMENT: ChorusProInvoiceStatus.EN_COURS_DE_TRAITEMENT,
      MISE_A_DISPOSITION: ChorusProInvoiceStatus.MISE_A_DISPOSITION,
      REJETEE: ChorusProInvoiceStatus.REJETEE,
      SUSPENDUE: ChorusProInvoiceStatus.SUSPENDUE,
      RECYCLEE: ChorusProInvoiceStatus.RECYCLEE,
      MANDATEE: ChorusProInvoiceStatus.MANDATEE,
      MISE_EN_PAIEMENT: ChorusProInvoiceStatus.MISE_EN_PAIEMENT,
      SOLDEE: ChorusProInvoiceStatus.SOLDEE,
    };

    return statusMap[status] || ChorusProInvoiceStatus.EN_COURS_DE_TRAITEMENT;
  }
}
