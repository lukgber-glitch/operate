import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SDIService } from './sdi.service';
import { SDIController } from './sdi.controller';
import { SDICodiceFiscaleService } from './services/sdi-codice-fiscale.service';
import { SDIInvoiceService } from './services/sdi-invoice.service';
import { SDISignatureService } from './services/sdi-signature.service';
import { SDISubmissionService } from './services/sdi-submission.service';
import { SDINotificationService } from './services/sdi-notification.service';
import { DatabaseModule } from '../../database/database.module';
import sdiConfig from './sdi.config';

/**
 * SDI Integration Module
 * Sistema di Interscambio - Italian Electronic Invoicing System
 *
 * Features:
 * - FatturaPA XML generation (v1.2.2)
 * - Digital signatures (CAdES-BES, XAdES-BES)
 * - Italian fiscal code and VAT validation
 * - SDI submission (direct HTTPS and Peppol)
 * - SDI notification handling (RC, NS, MC, NE, EC, DT)
 * - TLS 1.2+ security
 * - Comprehensive audit logging
 *
 * Supported Document Types:
 * - FPA12 (Public Administration invoices)
 * - FPR12 (Private sector invoices B2B/B2C)
 *
 * Compliance:
 * - Agenzia delle Entrate regulations
 * - FatturaPA v1.2.2 schema
 * - Italian Digital Signature standards
 * - GDPR data protection
 *
 * Integration Channels:
 * - Direct SDI endpoint (HTTPS)
 * - Peppol network (via Peppol Access Point)
 *
 * Notification Types:
 * - RC: Ricevuta di consegna (Delivery receipt)
 * - NS: Notifica di scarto (Rejection notice)
 * - MC: Mancata consegna (Failed delivery)
 * - NE: Notifica esito (Outcome notification)
 * - EC: Esito committente (Buyer response)
 * - DT: Decorrenza termini (Deadline expiry)
 *
 * Security:
 * - TLS 1.2+ minimum
 * - Client certificate authentication
 * - Digital signatures for all invoices
 * - Codice Fiscale validation
 * - Partita IVA validation
 * - Audit logging for all operations
 */
@Module({
  imports: [
    ConfigModule.forFeature(sdiConfig),
    DatabaseModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    SDICodiceFiscaleService,
    SDIInvoiceService,
    SDISignatureService,
    SDISubmissionService,
    SDINotificationService,
    SDIService,
  ],
  controllers: [SDIController],
  exports: [SDIService],
})
export class SDIModule {}
