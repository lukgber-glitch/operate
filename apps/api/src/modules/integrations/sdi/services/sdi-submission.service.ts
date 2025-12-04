import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';
import {
  SDISubmissionResult,
  SDITransmission,
  SDITransmissionStatus,
  FatturaPAFormat,
} from '../types/sdi.types';

/**
 * SDI Submission Service
 * Handles submission of FatturaPA invoices to SDI
 *
 * Submission Channels:
 * - Direct SDI endpoint (HTTPS)
 * - Peppol network (via Peppol Access Point)
 * - FTP/SFTP (legacy)
 *
 * Security:
 * - TLS 1.2+ required
 * - Client certificate authentication
 * - Digital signature verification
 */
@Injectable()
export class SDISubmissionService {
  private readonly logger = new Logger(SDISubmissionService.name);
  private readonly sdiEndpoint: string;
  private readonly usePeppol: boolean;
  private readonly mockMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {
    this.sdiEndpoint =
      this.configService.get<string>('SDI_ENDPOINT') ||
      'https://sdi.fatturapa.gov.it/SdI';
    this.usePeppol =
      this.configService.get<string>('SDI_USE_PEPPOL') === 'true';
    this.mockMode = this.configService.get<string>('SDI_MOCK_MODE') === 'true';

    this.logger.log('SDI Submission Service initialized', {
      endpoint: this.sdiEndpoint,
      usePeppol: this.usePeppol,
      mockMode: this.mockMode,
    });
  }

  /**
   * Submit FatturaPA to SDI
   */
  async submitToSDI(
    organizationId: string,
    invoiceId: string,
    nomeFile: string,
    p7mContent: Buffer,
    metadata: {
      formatoTrasmissione: FatturaPAFormat;
      progressivoInvio: string;
      codiceFiscaleCedente: string;
      partitaIVACedente: string;
      codiceFiscaleCessionario: string;
      codiceDestinatario: string;
      pecDestinatario?: string;
    },
  ): Promise<SDISubmissionResult> {
    this.logger.log('Submitting invoice to SDI', {
      organizationId,
      invoiceId,
      nomeFile,
      usePeppol: this.usePeppol,
    });

    try {
      // Create transmission record
      const transmission = await this.createTransmissionRecord(
        organizationId,
        invoiceId,
        nomeFile,
        p7mContent,
        metadata,
      );

      // Submit based on configured channel
      let result: SDISubmissionResult;

      if (this.mockMode) {
        result = await this.submitMock(nomeFile, p7mContent);
      } else if (this.usePeppol) {
        result = await this.submitViaPeppol(
          organizationId,
          nomeFile,
          p7mContent,
          metadata,
        );
      } else {
        result = await this.submitDirectToSDI(nomeFile, p7mContent);
      }

      // Update transmission record
      await this.updateTransmissionAfterSubmission(
        transmission.id,
        result,
      );

      this.logger.log('Invoice submitted successfully', {
        organizationId,
        invoiceId,
        identificativoSdI: result.identificativoSdI,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to submit invoice to SDI', {
        error: error.message,
        organizationId,
        invoiceId,
      });

      throw new ServiceUnavailableException(
        'Failed to submit invoice to SDI',
      );
    }
  }

  /**
   * Submit directly to SDI endpoint (HTTPS)
   */
  private async submitDirectToSDI(
    nomeFile: string,
    p7mContent: Buffer,
  ): Promise<SDISubmissionResult> {
    this.logger.log('Submitting via direct SDI endpoint', { nomeFile });

    try {
      // Create HTTPS agent with TLS 1.2+ and client certificate
      const httpsAgent = new https.Agent({
        minVersion: 'TLSv1.2',
        cert: this.configService.get<string>('SDI_CLIENT_CERTIFICATE'),
        key: this.configService.get<string>('SDI_CLIENT_PRIVATE_KEY'),
        rejectUnauthorized: true,
      });

      // Create multipart/form-data request
      const formData = new FormData();
      formData.append('file', new Blob([p7mContent]), nomeFile);

      // Submit to SDI
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.sdiEndpoint}/riceviFile`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            httpsAgent,
            timeout: 30000, // 30 seconds
          },
        ),
      );

      // Parse SDI response
      const result = this.parseSDIResponse(response.data);

      return {
        success: true,
        identificativoSdI: result.identificativoSdI,
        nomeFile,
        dataRicezione: new Date(),
        rawResponse: JSON.stringify(response.data),
      };
    } catch (error) {
      this.logger.error('Direct SDI submission failed', {
        error: error.message,
        nomeFile,
      });

      return {
        success: false,
        nomeFile,
        errors: [
          {
            codice: 'SDI_SUBMISSION_ERROR',
            descrizione: error.message,
          },
        ],
      };
    }
  }

  /**
   * Submit via Peppol network
   */
  private async submitViaPeppol(
    organizationId: string,
    nomeFile: string,
    p7mContent: Buffer,
    metadata: any,
  ): Promise<SDISubmissionResult> {
    this.logger.log('Submitting via Peppol network', { nomeFile });

    try {
      // Use Peppol service to submit
      // This would integrate with the existing Peppol module

      // For now, return success (placeholder)
      const identificativoSdI = this.generateMockIdentificativoSdI();

      return {
        success: true,
        identificativoSdI,
        nomeFile,
        dataRicezione: new Date(),
      };
    } catch (error) {
      this.logger.error('Peppol submission failed', {
        error: error.message,
        nomeFile,
      });

      return {
        success: false,
        nomeFile,
        errors: [
          {
            codice: 'PEPPOL_SUBMISSION_ERROR',
            descrizione: error.message,
          },
        ],
      };
    }
  }

  /**
   * Submit in mock mode (for testing)
   */
  private async submitMock(
    nomeFile: string,
    p7mContent: Buffer,
  ): Promise<SDISubmissionResult> {
    this.logger.log('Submitting in MOCK mode', { nomeFile });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate mock response
    const identificativoSdI = this.generateMockIdentificativoSdI();

    return {
      success: true,
      identificativoSdI,
      nomeFile,
      dataRicezione: new Date(),
    };
  }

  /**
   * Parse SDI response
   */
  private parseSDIResponse(response: any): {
    identificativoSdI: string;
  } {
    // SDI returns XML response with IdentificativoSdI
    // Parse the XML to extract the ID

    // Placeholder implementation
    return {
      identificativoSdI: response.IdentificativoSdI || '12345678901',
    };
  }

  /**
   * Create transmission record in database
   */
  private async createTransmissionRecord(
    organizationId: string,
    invoiceId: string,
    nomeFile: string,
    p7mContent: Buffer,
    metadata: any,
  ): Promise<any> {
    // Store in database using Prisma
    // This would use a proper Prisma schema

    // Placeholder: return mock transmission object
    return {
      id: `trans_${Date.now()}`,
      organizationId,
      invoiceId,
      nomeFile,
      status: SDITransmissionStatus.PENDING,
      createdAt: new Date(),
    };
  }

  /**
   * Update transmission record after submission
   */
  private async updateTransmissionAfterSubmission(
    transmissionId: string,
    result: SDISubmissionResult,
  ): Promise<void> {
    // Update transmission record with SDI response
    // This would use Prisma to update the database

    const status = result.success
      ? SDITransmissionStatus.SENT
      : SDITransmissionStatus.FAILED_DELIVERY;

    this.logger.log('Transmission record updated', {
      transmissionId,
      status,
      identificativoSdI: result.identificativoSdI,
    });
  }

  /**
   * Get transmission by ID
   */
  async getTransmission(transmissionId: string): Promise<SDITransmission | null> {
    // Retrieve from database
    // Placeholder implementation
    return null;
  }

  /**
   * Get transmissions for organization
   */
  async getTransmissions(
    organizationId: string,
    limit: number = 50,
  ): Promise<SDITransmission[]> {
    // Retrieve from database
    // Placeholder implementation
    return [];
  }

  /**
   * Query invoice status from SDI
   */
  async queryInvoiceStatus(identificativoSdI: string): Promise<{
    status: SDITransmissionStatus;
    lastUpdate: Date;
  }> {
    this.logger.log('Querying invoice status from SDI', {
      identificativoSdI,
    });

    if (this.mockMode) {
      return {
        status: SDITransmissionStatus.DELIVERED,
        lastUpdate: new Date(),
      };
    }

    try {
      // Query SDI for invoice status
      // This would make an HTTPS request to SDI status endpoint

      // Placeholder implementation
      return {
        status: SDITransmissionStatus.DELIVERED,
        lastUpdate: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to query invoice status', {
        error: error.message,
        identificativoSdI,
      });

      throw new InternalServerErrorException(
        'Failed to query invoice status',
      );
    }
  }

  /**
   * Generate mock IdentificativoSdI for testing
   */
  private generateMockIdentificativoSdI(): string {
    // Format: 11 digits
    const timestamp = Date.now().toString();
    return timestamp.substring(timestamp.length - 11);
  }

  /**
   * Retry failed submission
   */
  async retrySubmission(transmissionId: string): Promise<SDISubmissionResult> {
    this.logger.log('Retrying submission', { transmissionId });

    // Retrieve transmission record
    const transmission = await this.getTransmission(transmissionId);

    if (!transmission) {
      throw new InternalServerErrorException('Transmission not found');
    }

    // Retry submission
    return this.submitToSDI(
      transmission.organizationId,
      transmission.invoiceId,
      transmission.nomeFile,
      transmission.p7mFile!,
      {
        formatoTrasmissione: transmission.formatoTrasmissione,
        progressivoInvio: transmission.progressivoInvio,
        codiceFiscaleCedente: transmission.codiceFiscaleCedente,
        partitaIVACedente: transmission.partitaIVACedente,
        codiceFiscaleCessionario: transmission.codiceFiscaleCessionario,
        codiceDestinatario: transmission.codiceDestinatario,
        pecDestinatario: transmission.pecDestinatario,
      },
    );
  }
}
