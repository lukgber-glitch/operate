import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ChorusProAuthService } from './chorus-pro-auth.service';
import { FacturXService } from '../../factur-x/factur-x.service';
import {
  ChorusProSubmitInvoiceRequest,
  ChorusProSubmitInvoiceResponse,
  ChorusProInvoiceStatus,
  ChorusProDocumentFormat,
  ChorusProApiConfig,
  ChorusProDownloadRequest,
  ChorusProDownloadResponse,
  ChorusProValidationMessage,
} from '../types/chorus-pro.types';
import { FacturXInvoiceData } from '../../factur-x/types/factur-x.types';

/**
 * Chorus Pro Invoice Service
 *
 * Handles invoice submission and retrieval operations with Chorus Pro.
 *
 * Features:
 * - Submit invoices to French public entities
 * - Download invoices from Chorus Pro
 * - Automatic Factur-X format conversion
 * - Validation and error handling
 * - Retry logic for transient failures
 *
 * API Endpoints:
 * - POST /factures/v1/soumettre - Submit invoice
 * - GET /factures/v1/consulter - Query invoice
 * - GET /factures/v1/telecharger - Download invoice
 */
@Injectable()
export class ChorusProInvoiceService {
  private readonly logger = new Logger(ChorusProInvoiceService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiConfig: ChorusProApiConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: ChorusProAuthService,
    private readonly facturXService: FacturXService,
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
          // Token expired, invalidate and retry once
          this.logger.warn('Token expired, refreshing...');
          this.authService.invalidateToken();

          const token = await this.authService.getAccessToken();
          error.config.headers.Authorization = `Bearer ${token}`;

          return this.httpClient.request(error.config);
        }
        return Promise.reject(error);
      },
    );

    this.logger.log('Chorus Pro Invoice Service initialized');
  }

  /**
   * Submit invoice to Chorus Pro
   */
  async submitInvoice(
    request: ChorusProSubmitInvoiceRequest,
  ): Promise<ChorusProSubmitInvoiceResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Submitting invoice ${request.invoiceNumber} to Chorus Pro`,
      );

      // Validate request
      this.validateSubmitRequest(request);

      // Prepare submission payload
      const payload = this.prepareSubmissionPayload(request);

      // Submit to Chorus Pro
      const response = await this.httpClient.post(
        `/factures/${this.apiConfig.version}/soumettre`,
        payload,
        {
          headers: {
            'Content-Type':
              request.documentFormat === ChorusProDocumentFormat.FACTURX
                ? 'multipart/form-data'
                : 'application/json',
          },
        },
      );

      const result = this.parseSubmissionResponse(response.data);

      this.logger.log(
        `Successfully submitted invoice ${request.invoiceNumber} (${Date.now() - startTime}ms) - Chorus ID: ${result.chorusInvoiceId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to submit invoice ${request.invoiceNumber}: ${error.message}`,
        error.stack,
      );

      if (error.response) {
        const chorusError = this.parseChorusError(error.response.data);
        throw new BadRequestException({
          message: 'Chorus Pro submission failed',
          errors: chorusError,
        });
      }

      throw new InternalServerErrorException(
        `Failed to submit invoice to Chorus Pro: ${error.message}`,
      );
    }
  }

  /**
   * Submit Factur-X invoice directly
   */
  async submitFacturXInvoice(
    invoice: FacturXInvoiceData,
    options?: {
      serviceCode?: string;
      engagementNumber?: string;
      structureId?: string;
      purchaseOrderNumber?: string;
      comments?: string;
    },
  ): Promise<ChorusProSubmitInvoiceResponse> {
    try {
      this.logger.log(
        `Generating and submitting Factur-X invoice ${invoice.number}`,
      );

      // Generate Factur-X PDF
      const facturXPdf = await this.facturXService.generateFacturXInvoice(
        invoice,
        {
          profile: 'EN16931' as any,
          validateSIRET: true,
          validateTVA: true,
        },
      );

      // Prepare submission request
      const submitRequest: ChorusProSubmitInvoiceRequest = {
        invoiceNumber: invoice.number,
        invoiceDate: invoice.issueDate,
        invoiceType: this.mapInvoiceType(invoice.type),
        supplierSiret: invoice.seller.identifiers.siret,
        supplierName: invoice.seller.name,
        recipientSiret: invoice.buyer.identifiers.siret,
        recipientName: invoice.buyer.name,
        serviceReference: options?.serviceCode
          ? {
              serviceCode: options.serviceCode,
            }
          : undefined,
        engagement: options?.engagementNumber
          ? {
              engagementNumber: options.engagementNumber,
            }
          : undefined,
        amountExcludingTax: invoice.subtotal,
        vatAmount: invoice.totalVAT,
        amountIncludingTax: invoice.totalAmount,
        documentFormat: ChorusProDocumentFormat.FACTURX,
        documentData: facturXPdf,
        purchaseOrderNumber: options?.purchaseOrderNumber,
        comments: options?.comments,
        structureId: options?.structureId,
      };

      return await this.submitInvoice(submitRequest);
    } catch (error) {
      this.logger.error(
        `Failed to submit Factur-X invoice: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Download invoice from Chorus Pro
   */
  async downloadInvoice(
    request: ChorusProDownloadRequest,
  ): Promise<ChorusProDownloadResponse> {
    try {
      this.logger.log(
        `Downloading invoice ${request.chorusInvoiceId} from Chorus Pro`,
      );

      const response = await this.httpClient.get(
        `/factures/${this.apiConfig.version}/telecharger/${request.chorusInvoiceId}`,
        {
          params: {
            format: request.format || 'FACTURX',
          },
          responseType: 'arraybuffer',
        },
      );

      const filename =
        response.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] ||
        `invoice-${request.chorusInvoiceId}.pdf`;

      this.logger.log(
        `Successfully downloaded invoice ${request.chorusInvoiceId}`,
      );

      return {
        success: true,
        data: Buffer.from(response.data),
        filename,
        mimeType:
          response.headers['content-type'] || 'application/pdf',
      };
    } catch (error) {
      this.logger.error(
        `Failed to download invoice: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: `Failed to download invoice: ${error.message}`,
      };
    }
  }

  /**
   * Validate submit request
   */
  private validateSubmitRequest(request: ChorusProSubmitInvoiceRequest): void {
    const errors: string[] = [];

    if (!request.invoiceNumber) {
      errors.push('Invoice number is required');
    }

    if (!request.supplierSiret || request.supplierSiret.length !== 14) {
      errors.push('Valid supplier SIRET (14 digits) is required');
    }

    if (!request.recipientSiret || request.recipientSiret.length !== 14) {
      errors.push('Valid recipient SIRET (14 digits) is required');
    }

    if (!request.documentData || request.documentData.length === 0) {
      errors.push('Invoice document data is required');
    }

    if (request.amountIncludingTax <= 0) {
      errors.push('Invoice amount must be greater than zero');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Invalid invoice submission request',
        errors,
      });
    }
  }

  /**
   * Prepare submission payload for Chorus Pro API
   */
  private prepareSubmissionPayload(
    request: ChorusProSubmitInvoiceRequest,
  ): any {
    const payload: any = {
      numeroFacture: request.invoiceNumber,
      dateFacture: request.invoiceDate.toISOString().split('T')[0],
      typeFacture: request.invoiceType,
      siretFournisseur: request.supplierSiret,
      nomFournisseur: request.supplierName,
      siretDestinataire: request.recipientSiret,
      nomDestinataire: request.recipientName,
      montantHT: request.amountExcludingTax,
      montantTVA: request.vatAmount,
      montantTTC: request.amountIncludingTax,
      formatDocument: request.documentFormat,
    };

    // Add service reference if provided
    if (request.serviceReference) {
      payload.codeService = request.serviceReference.serviceCode;
      if (request.serviceReference.serviceName) {
        payload.nomService = request.serviceReference.serviceName;
      }
    }

    // Add engagement if provided
    if (request.engagement) {
      payload.numeroEngagement = request.engagement.engagementNumber;
      if (request.engagement.engagementDate) {
        payload.dateEngagement = request.engagement.engagementDate
          .toISOString()
          .split('T')[0];
      }
      if (request.engagement.amount) {
        payload.montantEngagement = request.engagement.amount;
      }
    }

    // Add references
    if (request.purchaseOrderNumber) {
      payload.numeroBonCommande = request.purchaseOrderNumber;
    }
    if (request.contractReference) {
      payload.referenceContrat = request.contractReference;
    }
    if (request.customerReference) {
      payload.referenceClient = request.customerReference;
    }

    // Add comments
    if (request.comments) {
      payload.commentaires = request.comments;
    }

    // Add structure ID
    if (request.structureId) {
      payload.identifiantStructure = request.structureId;
    }

    // Add document as base64
    payload.fichier = request.documentData.toString('base64');

    return payload;
  }

  /**
   * Parse Chorus Pro submission response
   */
  private parseSubmissionResponse(data: any): ChorusProSubmitInvoiceResponse {
    return {
      success: data.codeRetour === '0' || data.success === true,
      chorusInvoiceId: data.identifiantFacture || data.invoiceId,
      depositNumber: data.numeroDepot || data.depositNumber,
      depositDate: data.dateDepot ? new Date(data.dateDepot) : new Date(),
      status: this.mapStatus(data.statut || data.status),
      validationMessages: this.parseValidationMessages(
        data.messagesValidation || data.validationMessages || [],
      ),
      errors: data.erreurs || data.errors || [],
    };
  }

  /**
   * Parse validation messages
   */
  private parseValidationMessages(messages: any[]): ChorusProValidationMessage[] {
    return messages.map((msg) => ({
      code: msg.code || msg.messageCode || '',
      message: msg.message || msg.libelle || '',
      severity: this.mapSeverity(msg.severity || msg.gravite),
      field: msg.field || msg.champ,
    }));
  }

  /**
   * Map severity to standard values
   */
  private mapSeverity(severity: string): 'INFO' | 'WARNING' | 'ERROR' {
    const s = severity?.toUpperCase();
    if (s === 'ERROR' || s === 'ERREUR') return 'ERROR';
    if (s === 'WARNING' || s === 'AVERTISSEMENT') return 'WARNING';
    return 'INFO';
  }

  /**
   * Map invoice type from Factur-X to Chorus Pro
   */
  private mapInvoiceType(type: any): any {
    const typeStr = type.toString();
    if (typeStr.includes('381')) return 'AVOIR';
    if (typeStr.includes('386')) return 'ACOMPTE';
    if (typeStr.includes('384')) return 'FACTURE_RECTIFICATIVE';
    return 'FACTURE';
  }

  /**
   * Map status from Chorus Pro response
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

  /**
   * Parse Chorus Pro error response
   */
  private parseChorusError(data: any): string[] {
    if (Array.isArray(data.erreurs)) {
      return data.erreurs.map((e: any) => e.message || e.toString());
    }
    if (data.message) {
      return [data.message];
    }
    if (data.error) {
      return [data.error];
    }
    return ['Unknown Chorus Pro error'];
  }
}
