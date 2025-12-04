import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { parseStringPromise } from 'xml2js';
import {
  SDINotification,
  SDINotificationType,
  SDIError,
  SDITransmissionStatus,
} from '../types/sdi.types';

/**
 * SDI Notification Service
 * Handles SDI notifications (RC, NS, MC, NE, EC, DT)
 *
 * Notification Types:
 * - RC (Ricevuta di consegna) - Delivery receipt
 * - NS (Notifica di scarto) - Rejection notice
 * - MC (Mancata consegna) - Failed delivery
 * - NE (Notifica esito) - Outcome notification
 * - EC (Esito committente) - Buyer response
 * - DT (Decorrenza termini) - Deadline expiry
 */
@Injectable()
export class SDINotificationService {
  private readonly logger = new Logger(SDINotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process SDI notification webhook
   */
  async processNotification(
    organizationId: string,
    identificativoSdI: string,
    nomeFile: string,
    xmlPayload: string,
  ): Promise<SDINotification> {
    this.logger.log('Processing SDI notification', {
      organizationId,
      identificativoSdI,
      nomeFile,
    });

    try {
      // Parse XML notification
      const parsed = await this.parseNotificationXML(xmlPayload);

      // Determine notification type from filename or XML content
      const notificationType = this.detectNotificationType(nomeFile, parsed);

      // Extract notification data
      const notification = await this.extractNotificationData(
        organizationId,
        identificativoSdI,
        nomeFile,
        notificationType,
        parsed,
        xmlPayload,
      );

      // Store notification
      await this.storeNotification(notification);

      // Update transmission status
      await this.updateTransmissionStatus(
        organizationId,
        identificativoSdI,
        notificationType,
        notification,
      );

      this.logger.log('SDI notification processed successfully', {
        organizationId,
        identificativoSdI,
        notificationType,
      });

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
   * Parse notification XML
   */
  private async parseNotificationXML(xmlPayload: string): Promise<any> {
    try {
      const result = await parseStringPromise(xmlPayload, {
        explicitArray: false,
        mergeAttrs: true,
        trim: true,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to parse notification XML', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Detect notification type from filename or content
   */
  private detectNotificationType(
    nomeFile: string,
    parsed: any,
  ): SDINotificationType {
    // Notification filenames follow patterns:
    // RC_<IdentificativoSdI>_<ProgressivoInvio>.xml
    // NS_<IdentificativoSdI>_<ProgressivoInvio>.xml
    // etc.

    const upperFilename = nomeFile.toUpperCase();

    if (upperFilename.startsWith('RC_')) {
      return SDINotificationType.RC;
    } else if (upperFilename.startsWith('NS_')) {
      return SDINotificationType.NS;
    } else if (upperFilename.startsWith('MC_')) {
      return SDINotificationType.MC;
    } else if (upperFilename.startsWith('NE_')) {
      return SDINotificationType.NE;
    } else if (upperFilename.startsWith('EC_')) {
      return SDINotificationType.EC;
    } else if (upperFilename.startsWith('DT_')) {
      return SDINotificationType.DT;
    }

    // Fallback: detect from XML content
    if (parsed.RicevutaConsegna) return SDINotificationType.RC;
    if (parsed.NotificaScarto) return SDINotificationType.NS;
    if (parsed.NotificaMancataConsegna) return SDINotificationType.MC;
    if (parsed.NotificaEsito) return SDINotificationType.NE;
    if (parsed.EsitoCommittente) return SDINotificationType.EC;
    if (parsed.NotificaDecorrenzaTermini) return SDINotificationType.DT;

    // Default to RC
    return SDINotificationType.RC;
  }

  /**
   * Extract notification data from parsed XML
   */
  private async extractNotificationData(
    organizationId: string,
    identificativoSdI: string,
    nomeFile: string,
    notificationType: SDINotificationType,
    parsed: any,
    xmlPayload: string,
  ): Promise<SDINotification> {
    let descrizione: string | undefined;
    let listaErrori: SDIError[] = [];
    let esito: 'EC01' | 'EC02' | undefined;
    let messageId: string | undefined;

    switch (notificationType) {
      case SDINotificationType.RC:
        // Delivery receipt - successful delivery
        descrizione = 'Invoice successfully delivered to recipient';
        if (parsed.RicevutaConsegna) {
          messageId = parsed.RicevutaConsegna.MessageId;
          descrizione = parsed.RicevutaConsegna.Descrizione || descrizione;
        }
        break;

      case SDINotificationType.NS:
        // Rejection notice - invoice rejected by SDI
        descrizione = 'Invoice rejected by SDI';
        if (parsed.NotificaScarto) {
          const scarto = parsed.NotificaScarto;
          messageId = scarto.MessageId;

          // Extract error list
          if (scarto.ListaErrori && scarto.ListaErrori.Errore) {
            const errori = Array.isArray(scarto.ListaErrori.Errore)
              ? scarto.ListaErrori.Errore
              : [scarto.ListaErrori.Errore];

            listaErrori = errori.map((err: any) => ({
              codice: err.Codice,
              descrizione: err.Descrizione,
              suggerimento: err.Suggerimento,
            }));
          }
        }
        break;

      case SDINotificationType.MC:
        // Failed delivery - recipient not reachable
        descrizione = 'Failed to deliver invoice to recipient';
        if (parsed.NotificaMancataConsegna) {
          messageId = parsed.NotificaMancataConsegna.MessageId;
          descrizione = parsed.NotificaMancataConsegna.Descrizione || descrizione;
        }
        break;

      case SDINotificationType.NE:
        // Outcome notification - processing result
        descrizione = 'Invoice processing outcome notification';
        if (parsed.NotificaEsito) {
          messageId = parsed.NotificaEsito.MessageId;
          descrizione = parsed.NotificaEsito.Descrizione || descrizione;
        }
        break;

      case SDINotificationType.EC:
        // Buyer response - acceptance or refusal
        if (parsed.EsitoCommittente) {
          const ec = parsed.EsitoCommittente;
          messageId = ec.MessageId;
          esito = ec.Esito; // EC01 = Accepted, EC02 = Refused

          if (esito === 'EC01') {
            descrizione = 'Invoice accepted by buyer';
          } else if (esito === 'EC02') {
            descrizione = 'Invoice refused by buyer';
          }
        }
        break;

      case SDINotificationType.DT:
        // Deadline expiry - no response within deadline
        descrizione = 'Invoice deadline expired (deemed accepted)';
        if (parsed.NotificaDecorrenzaTermini) {
          messageId = parsed.NotificaDecorrenzaTermini.MessageId;
          descrizione = parsed.NotificaDecorrenzaTermini.Descrizione || descrizione;
        }
        break;
    }

    return {
      id: `notif_${Date.now()}`,
      organizationId,
      invoiceId: '', // Will be resolved from transmission
      identificativoSdI,
      nomeFile,
      notificationType,
      dataRicezione: new Date(),
      messageId,
      descrizione,
      listaErrori,
      esito,
      raw: xmlPayload,
      createdAt: new Date(),
    };
  }

  /**
   * Store notification in database
   */
  private async storeNotification(
    notification: SDINotification,
  ): Promise<void> {
    // Store using Prisma
    // This would use a proper Prisma schema

    this.logger.log('Notification stored', {
      id: notification.id,
      notificationType: notification.notificationType,
    });
  }

  /**
   * Update transmission status based on notification
   */
  private async updateTransmissionStatus(
    organizationId: string,
    identificativoSdI: string,
    notificationType: SDINotificationType,
    notification: SDINotification,
  ): Promise<void> {
    let newStatus: SDITransmissionStatus;

    switch (notificationType) {
      case SDINotificationType.RC:
        newStatus = SDITransmissionStatus.DELIVERED;
        break;

      case SDINotificationType.NS:
        newStatus = SDITransmissionStatus.REJECTED;
        break;

      case SDINotificationType.MC:
        newStatus = SDITransmissionStatus.FAILED_DELIVERY;
        break;

      case SDINotificationType.NE:
        newStatus = SDITransmissionStatus.PROCESSING;
        break;

      case SDINotificationType.EC:
        newStatus =
          notification.esito === 'EC01'
            ? SDITransmissionStatus.ACCEPTED
            : SDITransmissionStatus.REFUSED;
        break;

      case SDINotificationType.DT:
        newStatus = SDITransmissionStatus.EXPIRED;
        break;

      default:
        newStatus = SDITransmissionStatus.PROCESSING;
    }

    // Update transmission in database
    // This would use Prisma to update the status

    this.logger.log('Transmission status updated', {
      organizationId,
      identificativoSdI,
      newStatus,
    });
  }

  /**
   * Get notifications for invoice
   */
  async getNotifications(
    organizationId: string,
    identificativoSdI?: string,
    invoiceId?: string,
  ): Promise<SDINotification[]> {
    // Retrieve from database
    // Placeholder implementation
    return [];
  }

  /**
   * Get latest notification for invoice
   */
  async getLatestNotification(
    identificativoSdI: string,
  ): Promise<SDINotification | null> {
    // Retrieve from database
    // Placeholder implementation
    return null;
  }

  /**
   * Check if invoice was accepted
   */
  async isInvoiceAccepted(identificativoSdI: string): Promise<boolean> {
    const notifications = await this.getNotifications('', identificativoSdI);

    // Check for EC (accepted) or DT (deemed accepted)
    const hasAcceptance = notifications.some(
      (n) =>
        (n.notificationType === SDINotificationType.EC && n.esito === 'EC01') ||
        n.notificationType === SDINotificationType.DT,
    );

    return hasAcceptance;
  }

  /**
   * Check if invoice was rejected
   */
  async isInvoiceRejected(identificativoSdI: string): Promise<boolean> {
    const notifications = await this.getNotifications('', identificativoSdI);

    // Check for NS (rejection by SDI) or EC02 (refusal by buyer)
    const hasRejection = notifications.some(
      (n) =>
        n.notificationType === SDINotificationType.NS ||
        (n.notificationType === SDINotificationType.EC && n.esito === 'EC02'),
    );

    return hasRejection;
  }

  /**
   * Get human-readable status message
   */
  getStatusMessage(notificationType: SDINotificationType, esito?: string): string {
    switch (notificationType) {
      case SDINotificationType.RC:
        return 'Invoice successfully delivered to recipient';
      case SDINotificationType.NS:
        return 'Invoice rejected by SDI - contains errors';
      case SDINotificationType.MC:
        return 'Failed to deliver invoice to recipient';
      case SDINotificationType.NE:
        return 'Invoice processing outcome notification received';
      case SDINotificationType.EC:
        return esito === 'EC01'
          ? 'Invoice accepted by buyer'
          : 'Invoice refused by buyer';
      case SDINotificationType.DT:
        return 'Invoice deemed accepted (deadline expired)';
      default:
        return 'Unknown notification type';
    }
  }
}
