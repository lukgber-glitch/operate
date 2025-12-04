import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PeppolService } from './peppol.service';
import { PeppolController } from './peppol.controller';
import { PeppolCertificateService } from './services/peppol-certificate.service';
import { PeppolParticipantService } from './services/peppol-participant.service';
import { PeppolMessageService } from './services/peppol-message.service';
import { DatabaseModule } from '../../database/database.module';
import peppolConfig from './peppol.config';

/**
 * Peppol Access Point Integration Module
 * Provides Peppol e-invoicing and document exchange capabilities
 *
 * Features:
 * - CEF eDelivery AS4 Profile conformant
 * - UBL 2.1 Invoice and Credit Note support
 * - SMP (Service Metadata Publisher) lookup
 * - TLS 1.3 with certificate pinning
 * - Digital signatures (RSA-SHA256)
 * - Message acknowledgment (MDN)
 * - Multi-country support (EU markets)
 * - Comprehensive audit logging
 *
 * Supported Markets:
 * - France (FR)
 * - Italy (IT)
 * - Netherlands (NL)
 * - Belgium (BE)
 * - Sweden (SE)
 * - Ireland (IE)
 * - All other Peppol-enabled countries
 *
 * Standards Compliance:
 * - OASIS AS4 Profile
 * - CEF eDelivery
 * - UBL 2.1
 * - EN 16931 (European e-invoicing standard)
 * - ISO/IEC 6523 (Participant IDs)
 * - OASIS SMP 1.0
 *
 * Security:
 * - TLS 1.3 minimum
 * - Certificate pinning
 * - RSA-SHA256 signatures
 * - X.509 certificate validation
 * - Audit logging for all operations
 */
@Module({
  imports: [ConfigModule.forFeature(peppolConfig), DatabaseModule],
  providers: [
    PeppolCertificateService,
    PeppolParticipantService,
    PeppolMessageService,
    PeppolService,
  ],
  controllers: [PeppolController],
  exports: [PeppolService],
})
export class PeppolModule {}
