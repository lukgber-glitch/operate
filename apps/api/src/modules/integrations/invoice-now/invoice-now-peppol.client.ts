/**
 * InvoiceNow Peppol AS4 Client
 * Singapore-specific Peppol AS4 client for InvoiceNow network
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PeppolParticipantService } from '../peppol/services/peppol-participant.service';
import { PeppolMessageService } from '../peppol/services/peppol-message.service';
import { PeppolCertificateService } from '../peppol/services/peppol-certificate.service';
import {
  PeppolParticipantId,
  PeppolDocumentId,
  PeppolProcessId,
  AS4Message,
  AS4Receipt,
  SMPEndpoint,
} from '../peppol/types/peppol.types';
import {
  SINGAPORE_PEPPOL_SCHEME,
  PINT_SG,
  PEPPOL_TRANSPORT_PROFILE,
} from './invoice-now.constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * InvoiceNow Peppol Client
 * Handles Peppol AS4 protocol communication specific to Singapore's InvoiceNow network
 */
@Injectable()
export class InvoiceNowPeppolClient {
  private readonly logger = new Logger(InvoiceNowPeppolClient.name);
  private readonly mockMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly participantService: PeppolParticipantService,
    private readonly messageService: PeppolMessageService,
    private readonly certificateService: PeppolCertificateService,
  ) {
    this.mockMode = this.configService.get<string>('INVOICENOW_MOCK_MODE') === 'true';
  }

  /**
   * Create Peppol participant ID from Singapore UEN
   */
  createParticipantId(uen: string): PeppolParticipantId {
    return {
      scheme: SINGAPORE_PEPPOL_SCHEME,
      identifier: uen,
      formatted: `${SINGAPORE_PEPPOL_SCHEME}:${uen}`,
    };
  }

  /**
   * Create Peppol document ID for InvoiceNow invoice
   */
  createInvoiceDocumentId(): PeppolDocumentId {
    return {
      scheme: 'busdox-docid-qns',
      identifier: PINT_SG.DOCUMENT_TYPE_INVOICE,
    };
  }

  /**
   * Create Peppol document ID for InvoiceNow credit note
   */
  createCreditNoteDocumentId(): PeppolDocumentId {
    return {
      scheme: 'busdox-docid-qns',
      identifier: PINT_SG.DOCUMENT_TYPE_CREDIT_NOTE,
    };
  }

  /**
   * Create Peppol process ID for InvoiceNow
   */
  createProcessId(): PeppolProcessId {
    return {
      scheme: 'cenbii-procid-ubl',
      identifier: PINT_SG.PROFILE_ID,
    };
  }

  /**
   * Validate Singapore UEN participant
   */
  async validateParticipant(uen: string): Promise<boolean> {
    try {
      const participantId = this.createParticipantId(uen);

      // Validate participant ID format
      this.participantService.validateParticipantId(
        participantId.scheme,
        participantId.identifier,
      );

      // Lookup participant in SMP
      const smpResponse = await this.participantService.lookupParticipant(participantId);

      return smpResponse.documentTypes.length > 0;
    } catch (error) {
      this.logger.error('Participant validation failed', {
        uen,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Lookup endpoint for Singapore participant
   */
  async lookupEndpoint(uen: string, documentType: 'invoice' | 'creditNote'): Promise<SMPEndpoint> {
    const participantId = this.createParticipantId(uen);
    const documentId =
      documentType === 'invoice'
        ? this.createInvoiceDocumentId()
        : this.createCreditNoteDocumentId();

    this.logger.debug('Looking up endpoint', {
      uen,
      participantId: participantId.formatted,
      documentType,
    });

    const endpoint = await this.participantService.lookupEndpoint(participantId, documentId);

    // Verify transport profile
    if (endpoint.transportProfile !== PEPPOL_TRANSPORT_PROFILE) {
      throw new Error(
        `Unsupported transport profile: ${endpoint.transportProfile}. Expected: ${PEPPOL_TRANSPORT_PROFILE}`,
      );
    }

    return endpoint;
  }

  /**
   * Send AS4 message via Peppol network
   */
  async sendMessage(
    organizationId: string,
    fromUen: string,
    toUen: string,
    ublXml: string,
    documentType: 'invoice' | 'creditNote',
  ): Promise<{ messageId: string; conversationId: string }> {
    const startTime = Date.now();

    try {
      // Create participant IDs
      const fromParticipant = this.createParticipantId(fromUen);
      const toParticipant = this.createParticipantId(toUen);

      // Create document and process IDs
      const documentId =
        documentType === 'invoice'
          ? this.createInvoiceDocumentId()
          : this.createCreditNoteDocumentId();
      const processId = this.createProcessId();

      // Lookup receiver endpoint
      const endpoint = await this.lookupEndpoint(toUen, documentType);

      // Create AS4 message
      const message: AS4Message = {
        messageId: uuidv4(),
        conversationId: uuidv4(),
        timestamp: new Date(),
        from: fromParticipant,
        to: toParticipant,
        documentId,
        processId,
        payload: ublXml,
      };

      this.logger.log('Sending InvoiceNow message', {
        organizationId,
        messageId: message.messageId,
        fromUen,
        toUen,
        documentType,
        endpoint: endpoint.endpointUrl,
      });

      // Send message via Peppol message service
      const messageId = await this.messageService.sendMessage(
        organizationId,
        message,
        endpoint,
      );

      this.logger.log('InvoiceNow message sent successfully', {
        messageId,
        conversationId: message.conversationId,
        duration: Date.now() - startTime,
      });

      return {
        messageId,
        conversationId: message.conversationId,
      };
    } catch (error) {
      this.logger.error('Failed to send InvoiceNow message', {
        organizationId,
        fromUen,
        toUen,
        documentType,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Receive AS4 message from Peppol network
   */
  async receiveMessage(
    organizationId: string,
    soapEnvelope: string,
  ): Promise<AS4Receipt> {
    try {
      this.logger.log('Receiving InvoiceNow message', { organizationId });

      const receipt = await this.messageService.receiveMessage(
        organizationId,
        soapEnvelope,
      );

      this.logger.log('InvoiceNow message received successfully', {
        messageId: receipt.messageId,
        status: receipt.status,
      });

      return receipt;
    } catch (error) {
      this.logger.error('Failed to receive InvoiceNow message', {
        organizationId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verify certificate for Singapore participant
   */
  async verifyCertificate(certificate: string): Promise<boolean> {
    try {
      // Use Peppol certificate service for validation
      const certPem = `-----BEGIN CERTIFICATE-----\n${certificate}\n-----END CERTIFICATE-----`;

      // Parse certificate
      const crypto = await import('crypto');
      const cert = new crypto.X509Certificate(certPem);

      // Check validity dates
      const now = new Date();
      if (now < new Date(cert.validFrom) || now > new Date(cert.validTo)) {
        this.logger.warn('Certificate is expired or not yet valid', {
          validFrom: cert.validFrom,
          validTo: cert.validTo,
        });
        return false;
      }

      this.logger.debug('Certificate verified', {
        subject: cert.subject,
        validFrom: cert.validFrom,
        validTo: cert.validTo,
      });

      return true;
    } catch (error) {
      this.logger.error('Certificate verification failed', error);
      return false;
    }
  }

  /**
   * Get supported document types for participant
   */
  async getSupportedDocumentTypes(uen: string): Promise<string[]> {
    try {
      const participantId = this.createParticipantId(uen);
      const smpResponse = await this.participantService.lookupParticipant(participantId);

      return smpResponse.documentTypes.map((dt) => dt.documentId.identifier);
    } catch (error) {
      this.logger.error('Failed to get supported document types', {
        uen,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Check if participant is registered in InvoiceNow network
   */
  async isRegistered(uen: string): Promise<boolean> {
    try {
      return await this.validateParticipant(uen);
    } catch (error) {
      this.logger.error('Registration check failed', {
        uen,
        error: error.message,
      });
      return false;
    }
  }
}
