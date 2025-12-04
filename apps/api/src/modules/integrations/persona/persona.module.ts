import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PersonaService } from './persona.service';
import { PersonaInquiryService } from './services/persona-inquiry.service';
import { PersonaVerificationService } from './services/persona-verification.service';
import { PersonaEncryptionUtil } from './utils/persona-encryption.util';
import { PersonaController } from './persona.controller';
import { PersonaWebhookController } from './persona-webhook.controller';
import { DatabaseModule } from '../../database/database.module';
import personaConfig from './persona.config';

/**
 * Persona Integration Module
 * Provides comprehensive KYC (Know Your Customer) verification capabilities
 *
 * Features:
 * - Inquiry creation and management
 * - Multi-level verification (Basic, Enhanced, Full, Business)
 * - Government ID verification
 * - Selfie/liveness checks
 * - Document verification
 * - Database checks (watchlists, sanctions)
 * - Phone and email verification
 * - Business registration verification (KYB)
 * - Real-time webhook event processing
 * - Verification history and analytics
 * - Failure reason analysis
 * - Session token management
 * - Template-based inquiry flows
 *
 * Security:
 * - API key encryption (AES-256-GCM)
 * - Webhook signature verification (HMAC-SHA256)
 * - PII data encryption at rest
 * - Comprehensive audit logging
 * - Rate limiting on all endpoints (via global throttler)
 * - Signature age validation (prevents replay attacks)
 * - Timing-safe signature comparison
 *
 * Webhook Events:
 * - inquiry.completed - User completed the verification flow
 * - inquiry.approved - Verification passed all checks
 * - inquiry.declined - Verification failed checks
 * - inquiry.expired - Inquiry expired without completion
 * - inquiry.failed - Technical failure during verification
 * - inquiry.marked-for-review - Requires manual review
 * - verification.created - New verification check created
 * - verification.passed - Individual check passed
 * - verification.failed - Individual check failed
 *
 * Environment Variables:
 * - PERSONA_API_KEY (required) - Persona API key
 * - PERSONA_WEBHOOK_SECRET (required) - Webhook signing secret
 * - PERSONA_ENVIRONMENT (optional) - 'sandbox' or 'production' (default: sandbox)
 * - PERSONA_ENCRYPTION_KEY (required) - Encryption key for sensitive data
 * - PERSONA_API_BASE_URL (optional) - Custom API base URL
 *
 * Database Tables:
 * - persona_inquiries - Stores inquiry records
 * - persona_verifications - Stores verification check results
 * - persona_webhook_logs - Audit log for webhook events
 *
 * @see https://docs.withpersona.com
 */
@Module({
  imports: [ConfigModule.forFeature(personaConfig), DatabaseModule],
  controllers: [PersonaController, PersonaWebhookController],
  providers: [
    PersonaService,
    PersonaInquiryService,
    PersonaVerificationService,
    PersonaEncryptionUtil,
  ],
  exports: [
    PersonaService,
    PersonaInquiryService,
    PersonaVerificationService,
    PersonaEncryptionUtil,
  ],
})
export class PersonaModule {}
