import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChorusProController } from './chorus-pro.controller';
import { ChorusProService } from './chorus-pro.service';
import { ChorusProAuthService } from './services/chorus-pro-auth.service';
import { ChorusProInvoiceService } from './services/chorus-pro-invoice.service';
import { ChorusProStatusService } from './services/chorus-pro-status.service';
import { ChorusProEntityService } from './services/chorus-pro-entity.service';
import { DatabaseModule } from '../../database/database.module';
import { FacturXModule } from '../factur-x/factur-x.module';

/**
 * Chorus Pro Integration Module (France B2G)
 *
 * Provides integration with the French government's Chorus Pro platform
 * for Business-to-Government (B2G) electronic invoicing.
 *
 * Features:
 * - OAuth2 authentication via PISTE (French government SSO)
 * - Invoice submission in Factur-X format
 * - Real-time status tracking
 * - Public entity lookup by SIRET
 * - Service code resolution
 * - Payment tracking
 * - Rejection handling and notifications
 * - Statistics and reporting
 *
 * Legal Framework:
 * - Mandatory for all B2G invoicing in France since January 2020
 * - Based on Ordonnance n° 2014-697 (26 juin 2014)
 * - Decree 2016-1478 (progressive rollout 2017-2020)
 * - EN 16931 European e-invoicing standard
 *
 * Architecture:
 * - ChorusProAuthService: OAuth2 token management
 * - ChorusProInvoiceService: Invoice submission and retrieval
 * - ChorusProStatusService: Status tracking and history
 * - ChorusProEntityService: Public entity lookup
 * - ChorusProService: Main orchestration service
 *
 * Dependencies:
 * - FacturX module for invoice generation
 * - Database module for logging and caching
 * - Config module for API credentials
 *
 * Configuration Required:
 * Environment variables:
 * - CHORUS_PRO_PISTE_URL: PISTE OAuth2 endpoint
 * - CHORUS_PRO_CLIENT_ID: OAuth2 client ID
 * - CHORUS_PRO_CLIENT_SECRET: OAuth2 client secret
 * - CHORUS_PRO_API_URL: Chorus Pro API base URL
 * - CHORUS_PRO_CERTIFICATE_PATH: Optional client certificate
 *
 * API Documentation:
 * @see https://chorus-pro.gouv.fr/documentation
 * @see https://piste.gouv.fr
 *
 * Usage Example:
 * ```typescript
 * // Submit Factur-X invoice
 * const result = await chorusProService.submitInvoice({
 *   invoiceNumber: 'FAC2024-001',
 *   supplierSiret: '12345678901234',
 *   recipientSiret: '98765432109876',
 *   serviceReference: { serviceCode: 'SERVICE001' },
 *   documentData: facturXPdfBuffer,
 *   // ... other fields
 * });
 *
 * // Track status
 * const status = await chorusProService.getInvoiceStatus(
 *   result.chorusInvoiceId
 * );
 * ```
 *
 * Status Flow:
 * DEPOSEE (Submitted)
 *   → EN_COURS_DE_TRAITEMENT (Processing)
 *   → MISE_A_DISPOSITION (Available to entity)
 *   → MANDATEE (Payment ordered)
 *   → MISE_EN_PAIEMENT (In payment)
 *   → SOLDEE (Paid)
 *
 * OR
 *
 * → REJETEE (Rejected)
 *   → RECYCLEE (Resubmitted after correction)
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    FacturXModule, // For Factur-X invoice generation
  ],
  providers: [
    ChorusProAuthService,
    ChorusProInvoiceService,
    ChorusProStatusService,
    ChorusProEntityService,
    ChorusProService,
  ],
  controllers: [ChorusProController],
  exports: [ChorusProService],
})
export class ChorusProModule {}
