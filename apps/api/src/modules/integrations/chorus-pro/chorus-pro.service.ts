import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { ChorusProAuthService } from './services/chorus-pro-auth.service';
import { ChorusProInvoiceService } from './services/chorus-pro-invoice.service';
import { ChorusProStatusService } from './services/chorus-pro-status.service';
import { ChorusProEntityService } from './services/chorus-pro-entity.service';
import {
  ChorusProSubmitInvoiceRequest,
  ChorusProSubmitInvoiceResponse,
  ChorusProStatusRequest,
  ChorusProStatusResponse,
  ChorusProInvoiceInfo,
  ChorusProEntityLookupRequest,
  ChorusProEntityLookupResponse,
  ChorusProDownloadRequest,
  ChorusProDownloadResponse,
  ChorusProStatistics,
  ChorusProInvoiceStatus,
} from './types/chorus-pro.types';

/**
 * Chorus Pro Service (France B2G)
 *
 * Main service for French government e-invoicing via Chorus Pro.
 *
 * Chorus Pro is mandatory for all suppliers invoicing French public entities
 * since January 2020. It supports the Factur-X format and provides a centralized
 * platform for B2G invoice exchange.
 *
 * Features:
 * - OAuth2 authentication via PISTE
 * - Invoice submission in Factur-X format
 * - Status tracking and notifications
 * - Public entity lookup by SIRET
 * - Service code resolution
 * - Payment tracking
 * - Rejection handling
 * - Statistics and reporting
 *
 * Legal Framework:
 * - Ordonnance n° 2014-697 (26 juin 2014)
 * - Decree 2016-1478 (mandatory since 2020)
 * - EN 16931 compliance required
 *
 * Integration Flow:
 * 1. Authenticate with PISTE (OAuth2)
 * 2. Lookup public entity (SIRET → service code)
 * 3. Generate Factur-X invoice
 * 4. Submit to Chorus Pro
 * 5. Track status until payment
 *
 * @see https://chorus-pro.gouv.fr
 * @see https://piste.gouv.fr
 */
@Injectable()
export class ChorusProService {
  private readonly logger = new Logger(ChorusProService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly authService: ChorusProAuthService,
    private readonly invoiceService: ChorusProInvoiceService,
    private readonly statusService: ChorusProStatusService,
    private readonly entityService: ChorusProEntityService,
  ) {
    this.logger.log('Chorus Pro Service initialized');
  }

  /**
   * Submit invoice to Chorus Pro
   */
  async submitInvoice(
    request: ChorusProSubmitInvoiceRequest,
  ): Promise<ChorusProSubmitInvoiceResponse> {
    try {
      this.logger.log(
        `Submitting invoice ${request.invoiceNumber} to Chorus Pro`,
      );

      // Validate entity and service code if provided
      if (request.serviceReference?.serviceCode) {
        const isValid = await this.entityService.validateServiceCode(
          request.recipientSiret,
          request.serviceReference.serviceCode,
        );

        if (!isValid) {
          this.logger.warn(
            `Invalid service code ${request.serviceReference.serviceCode} for SIRET ${request.recipientSiret}`,
          );
        }
      }

      // Submit invoice
      const result = await this.invoiceService.submitInvoice(request);

      // Log submission in database
      if (result.success && result.chorusInvoiceId) {
        await this.logSubmission(request, result);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to submit invoice: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(
    chorusInvoiceId: string,
  ): Promise<ChorusProInvoiceInfo> {
    return await this.statusService.getInvoiceStatus(chorusInvoiceId);
  }

  /**
   * Query invoices by criteria
   */
  async queryInvoices(
    request: ChorusProStatusRequest,
  ): Promise<ChorusProStatusResponse> {
    return await this.statusService.queryInvoices(request);
  }

  /**
   * Get invoices by supplier SIRET
   */
  async getInvoicesBySupplier(
    supplierSiret: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<ChorusProInvoiceInfo[]> {
    return await this.statusService.getInvoicesBySupplier(
      supplierSiret,
      dateFrom,
      dateTo,
    );
  }

  /**
   * Get rejected invoices for a supplier
   */
  async getRejectedInvoices(
    supplierSiret: string,
    dateFrom?: Date,
  ): Promise<ChorusProInvoiceInfo[]> {
    return await this.statusService.getRejectedInvoices(
      supplierSiret,
      dateFrom,
    );
  }

  /**
   * Get paid invoices for a supplier
   */
  async getPaidInvoices(
    supplierSiret: string,
    dateFrom?: Date,
  ): Promise<ChorusProInvoiceInfo[]> {
    return await this.statusService.getPaidInvoices(supplierSiret, dateFrom);
  }

  /**
   * Get pending invoices for a supplier
   */
  async getPendingInvoices(
    supplierSiret: string,
  ): Promise<ChorusProInvoiceInfo[]> {
    return await this.statusService.getPendingInvoices(supplierSiret);
  }

  /**
   * Download invoice from Chorus Pro
   */
  async downloadInvoice(
    request: ChorusProDownloadRequest,
  ): Promise<ChorusProDownloadResponse> {
    return await this.invoiceService.downloadInvoice(request);
  }

  /**
   * Lookup public entity by SIRET
   */
  async lookupEntity(
    request: ChorusProEntityLookupRequest,
  ): Promise<ChorusProEntityLookupResponse> {
    return await this.entityService.lookupEntity(request);
  }

  /**
   * Check if entity accepts electronic invoices
   */
  async entityAcceptsEInvoices(siret: string): Promise<boolean> {
    return await this.entityService.acceptsEInvoices(siret);
  }

  /**
   * Get service codes for an entity
   */
  async getServiceCodes(siret: string) {
    return await this.entityService.getServiceCodes(siret);
  }

  /**
   * Check if service requires engagement number
   */
  async requiresEngagement(
    siret: string,
    serviceCode: string,
  ): Promise<boolean> {
    return await this.entityService.requiresEngagement(siret, serviceCode);
  }

  /**
   * Get statistics for supplier
   */
  async getStatistics(
    supplierSiret: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<ChorusProStatistics> {
    try {
      const invoices = await this.getInvoicesBySupplier(
        supplierSiret,
        dateFrom,
        dateTo,
      );

      const byStatus: Record<ChorusProInvoiceStatus, number> = {
        [ChorusProInvoiceStatus.DEPOSEE]: 0,
        [ChorusProInvoiceStatus.EN_COURS_DE_TRAITEMENT]: 0,
        [ChorusProInvoiceStatus.MISE_A_DISPOSITION]: 0,
        [ChorusProInvoiceStatus.REJETEE]: 0,
        [ChorusProInvoiceStatus.SUSPENDUE]: 0,
        [ChorusProInvoiceStatus.RECYCLEE]: 0,
        [ChorusProInvoiceStatus.MANDATEE]: 0,
        [ChorusProInvoiceStatus.MISE_EN_PAIEMENT]: 0,
        [ChorusProInvoiceStatus.SOLDEE]: 0,
      };

      const byMonth: Record<string, number> = {};

      let totalProcessingTime = 0;
      let totalPaymentTime = 0;
      let processedCount = 0;
      let paidCount = 0;

      invoices.forEach((invoice) => {
        // Count by status
        byStatus[invoice.status]++;

        // Count by month
        const month = invoice.invoiceDate.toISOString().substring(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;

        // Calculate processing time
        if (invoice.processingDate) {
          const processingDays = Math.floor(
            (invoice.processingDate.getTime() -
              invoice.depositDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          totalProcessingTime += processingDays;
          processedCount++;
        }

        // Calculate payment time
        if (invoice.paymentDate) {
          const paymentDays = Math.floor(
            (invoice.paymentDate.getTime() - invoice.depositDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          totalPaymentTime += paymentDays;
          paidCount++;
        }
      });

      return {
        totalSubmitted: invoices.length,
        totalAccepted:
          invoices.length - byStatus[ChorusProInvoiceStatus.REJETEE],
        totalRejected: byStatus[ChorusProInvoiceStatus.REJETEE],
        totalPaid: byStatus[ChorusProInvoiceStatus.SOLDEE],
        averageProcessingTime:
          processedCount > 0 ? totalProcessingTime / processedCount : 0,
        averagePaymentTime: paidCount > 0 ? totalPaymentTime / paidCount : 0,
        byStatus,
        byMonth,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get statistics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Test Chorus Pro connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.authService.testAuthentication();
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get authentication status
   */
  getAuthStatus() {
    return this.authService.getTokenInfo();
  }

  /**
   * Log invoice submission to database
   */
  private async logSubmission(
    request: ChorusProSubmitInvoiceRequest,
    response: ChorusProSubmitInvoiceResponse,
  ): Promise<void> {
    try {
      // This would store submission details in the database
      // Implementation depends on Prisma schema
      this.logger.log(
        `Logged submission: ${request.invoiceNumber} → ${response.chorusInvoiceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log submission: ${error.message}`,
        error.stack,
      );
      // Don't throw - this is non-critical
    }
  }
}
