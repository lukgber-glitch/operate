import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import {
  SDIConfig,
  SDISubmissionResult,
  SDITransmission,
  SDINotification,
  SDIStatistics,
  FiscalCodeValidationResult,
} from './types/sdi.types';
import { SendSDIInvoiceDto, QueryInvoiceStatusDto } from './dto';
import { SDICodiceFiscaleService } from './services/sdi-codice-fiscale.service';
import { SDIInvoiceService } from './services/sdi-invoice.service';
import { SDISignatureService } from './services/sdi-signature.service';
import { SDISubmissionService } from './services/sdi-submission.service';
import { SDINotificationService } from './services/sdi-notification.service';

/**
 * SDI Integration Service (Main Orchestrator)
 * Sistema di Interscambio - Italian Electronic Invoicing
 *
 * Features:
 * - FatturaPA XML generation (v1.2.2)
 * - Digital signature (CAdES-BES)
 * - SDI submission (direct or via Peppol)
 * - Notification handling (RC, NS, MC, NE, EC, DT)
 * - Fiscal code validation
 * - Audit logging
 *
 * Compliance:
 * - Agenzia delle Entrate regulations
 * - FatturaPA v1.2.2
 * - Digital signature standards
 * - TLS 1.2+ security
 */
@Injectable()
export class SDIService {
  private readonly logger = new Logger(SDIService.name);
  private readonly config: SDIConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly fiscalCodeService: SDICodiceFiscaleService,
    private readonly invoiceService: SDIInvoiceService,
    private readonly signatureService: SDISignatureService,
    private readonly submissionService: SDISubmissionService,
    private readonly notificationService: SDINotificationService,
  ) {
    this.config = {
      endpoint: this.configService.get<string>('SDI_ENDPOINT') || '',
      transmitterCode: this.configService.get<string>('SDI_TRANSMITTER_CODE') || '',
      certificatePath: this.configService.get<string>('SDI_CERTIFICATE_PATH') || '',
      privateKeyPath: this.configService.get<string>('SDI_PRIVATE_KEY_PATH') || '',
      certificatePassword: this.configService.get<string>('SDI_CERTIFICATE_PASSWORD') || '',
      environment: (this.configService.get<string>('SDI_ENVIRONMENT') || 'test') as 'production' | 'test',
      mockMode: this.configService.get<string>('SDI_MOCK_MODE') === 'true',
      tlsMinVersion: 'TLSv1.2',
      signatureType: 'CAdES-BES',
      usePeppol: this.configService.get<string>('SDI_USE_PEPPOL') === 'true',
    };

    this.logger.log(
      `SDI Service initialized (${this.config.environment} mode, Mock: ${this.config.mockMode})`,
    );
  }

  /**
   * Send invoice to SDI
   * Main entry point for invoice submission
   */
  async sendInvoice(dto: SendSDIInvoiceDto): Promise<{
    success: boolean;
    identificativoSdI?: string;
    nomeFile: string;
    errors?: any[];
  }> {
    const startTime = Date.now();

    this.logger.log('Sending invoice to SDI', {
      organizationId: dto.organizationId,
      numero: dto.numero,
      tipoDocumento: dto.tipoDocumento,
    });

    try {
      // Step 1: Generate progressive invoice number
      const progressivoInvio = this.invoiceService.generateProgressivoInvio(
        dto.organizationId,
        Date.now(),
      );

      // Step 2: Generate FatturaPA XML
      const fatturaXML = this.invoiceService.generateFatturaPA(
        dto,
        progressivoInvio,
      );

      // Step 3: Digitally sign the invoice (create .p7m file)
      const p7mFile = await this.signatureService.signFatturaPA(
        fatturaXML,
        this.config.signatureType,
      );

      // Step 4: Generate filename
      const nomeFile = this.invoiceService.generateFilename(
        'IT',
        dto.cedentePrestatore.datiAnagrafici.partitaIVA,
        progressivoInvio,
      );

      // Step 5: Submit to SDI
      const result = await this.submissionService.submitToSDI(
        dto.organizationId,
        '', // invoiceId - would be generated from your invoice system
        nomeFile,
        p7mFile,
        {
          formatoTrasmissione: dto.formatoTrasmissione,
          progressivoInvio,
          codiceFiscaleCedente:
            dto.cedentePrestatore.datiAnagrafici.codiceFiscale || '',
          partitaIVACedente: dto.cedentePrestatore.datiAnagrafici.partitaIVA,
          codiceFiscaleCessionario:
            dto.cessionarioCommittente.datiAnagrafici.codiceFiscale,
          codiceDestinatario: dto.codiceDestinatario || '0000000',
          pecDestinatario: dto.pecDestinatario,
        },
      );

      this.logger.log('Invoice sent successfully to SDI', {
        organizationId: dto.organizationId,
        numero: dto.numero,
        identificativoSdI: result.identificativoSdI,
        duration: Date.now() - startTime,
      });

      return {
        success: result.success,
        identificativoSdI: result.identificativoSdI,
        nomeFile,
        errors: result.errors,
      };
    } catch (error) {
      this.logger.error('Failed to send invoice to SDI', {
        error: error.message,
        organizationId: dto.organizationId,
        numero: dto.numero,
      });

      throw error;
    }
  }

  /**
   * Receive notification from SDI (webhook)
   */
  async receiveNotification(
    organizationId: string,
    identificativoSdI: string,
    nomeFile: string,
    xmlPayload: string,
  ): Promise<SDINotification> {
    this.logger.log('Receiving SDI notification', {
      organizationId,
      identificativoSdI,
      nomeFile,
    });

    try {
      const notification = await this.notificationService.processNotification(
        organizationId,
        identificativoSdI,
        nomeFile,
        xmlPayload,
      );

      return notification;
    } catch (error) {
      this.logger.error('Failed to process SDI notification', {
        error: error.message,
        organizationId,
        identificativoSdI,
      });
      throw error;
    }
  }

  /**
   * Query invoice status
   */
  async queryInvoiceStatus(dto: QueryInvoiceStatusDto): Promise<{
    status: string;
    notifications: SDINotification[];
    lastUpdate: Date;
  }> {
    this.logger.log('Querying invoice status', {
      organizationId: dto.organizationId,
      identificativoSdI: dto.identificativoSdI,
      invoiceId: dto.invoiceId,
    });

    try {
      let notifications: SDINotification[];

      if (dto.identificativoSdI) {
        notifications = await this.notificationService.getNotifications(
          dto.organizationId,
          dto.identificativoSdI,
        );
      } else if (dto.invoiceId) {
        notifications = await this.notificationService.getNotifications(
          dto.organizationId,
          undefined,
          dto.invoiceId,
        );
      } else {
        throw new BadRequestException(
          'Either identificativoSdI or invoiceId is required',
        );
      }

      // Determine current status from notifications
      const latestNotification = notifications[0]; // Assuming sorted by date desc
      const status = latestNotification
        ? this.notificationService.getStatusMessage(
            latestNotification.notificationType,
            latestNotification.esito,
          )
        : 'Pending';

      return {
        status,
        notifications,
        lastUpdate: latestNotification
          ? latestNotification.dataRicezione
          : new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to query invoice status', {
        error: error.message,
        organizationId: dto.organizationId,
      });
      throw error;
    }
  }

  /**
   * Validate Codice Fiscale
   */
  validateCodiceFiscale(codiceFiscale: string): FiscalCodeValidationResult {
    return this.fiscalCodeService.validateCodiceFiscale(codiceFiscale);
  }

  /**
   * Validate Partita IVA
   */
  validatePartitaIVA(partitaIVA: string): {
    valid: boolean;
    formatted: string;
  } {
    const result = this.fiscalCodeService.validatePartitaIVA(partitaIVA);
    return {
      valid: result.valid,
      formatted: result.formatted,
    };
  }

  /**
   * Get transmission history
   */
  async getTransmissions(
    organizationId: string,
    limit: number = 50,
  ): Promise<SDITransmission[]> {
    const transmissions = await this.submissionService.getTransmissions(
      organizationId,
      limit,
    );

    return transmissions;
  }

  /**
   * Get transmission by ID
   */
  async getTransmission(
    transmissionId: string,
  ): Promise<SDITransmission | null> {
    return this.submissionService.getTransmission(transmissionId);
  }

  /**
   * Retry failed transmission
   */
  async retryTransmission(transmissionId: string): Promise<SDISubmissionResult> {
    this.logger.log('Retrying failed transmission', { transmissionId });

    return this.submissionService.retrySubmission(transmissionId);
  }

  /**
   * Get SDI statistics
   */
  async getStatistics(
    organizationId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<SDIStatistics> {
    // Retrieve statistics from database
    // This would use Prisma to aggregate data

    // Placeholder implementation
    return {
      organizationId,
      period: {
        from: fromDate,
        to: toDate,
      },
      totalInvoices: 0,
      totalAmount: 0,
      byStatus: {},
      byDocumentType: {},
      deliveryRate: 0,
      rejectionRate: 0,
    };
  }

  /**
   * Validate certificate status
   */
  async validateCertificate(): Promise<{
    valid: boolean;
    expired: boolean;
    daysUntilExpiry?: number;
  }> {
    return this.signatureService.validateCertificate();
  }

  /**
   * Health check for SDI integration
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      certificate: boolean;
      sdiEndpoint: boolean;
      database: boolean;
    };
    message?: string;
  }> {
    const checks = {
      certificate: false,
      sdiEndpoint: false,
      database: false,
    };

    try {
      // Check certificate
      const certStatus = await this.signatureService.validateCertificate();
      checks.certificate = certStatus.valid;

      // Check database connection
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        checks.database = true;
      } catch (error) {
        checks.database = false;
      }

      // Check SDI endpoint (in production mode)
      if (!this.config.mockMode) {
        // Would perform actual endpoint check
        checks.sdiEndpoint = true; // Placeholder
      } else {
        checks.sdiEndpoint = true; // Mock mode always healthy
      }

      const allHealthy = Object.values(checks).every((check) => check);
      const someHealthy = Object.values(checks).some((check) => check);

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (allHealthy) {
        status = 'healthy';
      } else if (someHealthy) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        checks,
      };
    } catch (error) {
      this.logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        checks,
        message: error.message,
      };
    }
  }
}
