import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoCardlessService } from './gocardless.service';
import { GoCardlessController } from './gocardless.controller';
import { GoCardlessWebhookController } from './gocardless-webhook.controller';
import { DatabaseModule } from '../../database/database.module';
import gocardlessConfig from './gocardless.config';

// Services
import { GoCardlessAuthService } from './services/gocardless-auth.service';
import { GoCardlessMandateService } from './services/gocardless-mandate.service';
import { GoCardlessPaymentService } from './services/gocardless-payment.service';
import { GoCardlessCustomerService } from './services/gocardless-customer.service';

/**
 * GoCardless Integration Module
 * Provides UK/EU Direct Debit payment capabilities via GoCardless
 *
 * Features:
 * - Direct Debit mandate creation (BACS for UK, SEPA for EU)
 * - One-off and recurring payment collection
 * - Customer bank account management
 * - Webhook handling for real-time updates
 * - OAuth2-style authorization flows
 * - AES-256-GCM encrypted access token storage
 * - Comprehensive audit logging
 *
 * Supported Schemes:
 * - BACS (UK) - 3-day payment cycle
 * - SEPA Core (EU) - 2-day payment cycle
 * - SEPA COR1 (EU - faster) - 1-day payment cycle
 * - Autogiro (Sweden)
 * - Betalingsservice (Denmark)
 * - PAD (Canada)
 *
 * Security:
 * - Access tokens encrypted before database storage
 * - Webhook signature verification (HMAC-SHA256)
 * - Idempotency keys for payment creation
 * - Rate limiting on all endpoints
 * - Comprehensive audit logging
 *
 * Background Jobs:
 * - Payment status sync
 * - Webhook event processing
 * - Failed payment retry
 *
 * @see https://developer.gocardless.com/api-reference/
 */
@Module({
  imports: [
    ConfigModule.forFeature(gocardlessConfig),
    DatabaseModule,
  ],
  controllers: [
    GoCardlessController,
    GoCardlessWebhookController,
  ],
  providers: [
    // Core service
    GoCardlessService,

    // Auth service
    GoCardlessAuthService,

    // Business services
    GoCardlessMandateService,
    GoCardlessPaymentService,
    GoCardlessCustomerService,
  ],
  exports: [
    GoCardlessService,
    GoCardlessAuthService,
    GoCardlessMandateService,
    GoCardlessPaymentService,
    GoCardlessCustomerService,
  ],
})
export class GoCardlessModule {}
