import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GustoService } from './gusto.service';
import { GustoOAuthService } from './services/gusto-oauth.service';
import { GustoCompanyService } from './services/gusto-company.service';
import { GustoEmployeeService } from './services/gusto-employee.service';
import { GustoPayrollService } from './services/gusto-payroll.service';
import { GustoPayStubService } from './services/gusto-pay-stub.service';
import { GustoTaxService } from './services/gusto-tax.service';
import { GustoBenefitsService } from './services/gusto-benefits.service';
import { GustoController } from './gusto.controller';
import { GustoWebhookController } from './gusto-webhook.controller';
import { GustoEncryptionUtil } from './utils/gusto-encryption.util';
import gustoConfig from './gusto.config';

/**
 * Gusto Embedded Payroll Integration Module
 * Provides US payroll processing capabilities via Gusto API
 *
 * Features:
 * - OAuth2 PKCE authentication flow
 * - Company provisioning (onboarding)
 * - Employee management and sync
 * - Payroll processing
 * - Real-time webhook updates
 * - Multi-company support
 * - Comprehensive audit logging
 *
 * Security:
 * - OAuth2 with PKCE (Proof Key for Code Exchange)
 * - Tokens encrypted at rest (AES-256-GCM)
 * - Webhook signature verification (HMAC-SHA256)
 * - No sensitive data in logs
 * - Rate limiting
 * - Automatic token refresh
 *
 * Use Cases:
 * - US payroll processing
 * - Employee onboarding
 * - Benefits administration
 * - Tax filing (W-2, 1099)
 * - Contractor payments
 * - Time tracking integration
 * - PTO/vacation management
 *
 * API Documentation:
 * @see https://docs.gusto.com/embedded-payroll/docs/introduction
 *
 * Environment Variables Required:
 * - GUSTO_CLIENT_ID - Gusto OAuth client ID
 * - GUSTO_CLIENT_SECRET - Gusto OAuth client secret
 * - GUSTO_REDIRECT_URI - OAuth callback URL
 * - GUSTO_WEBHOOK_SECRET - Webhook signing secret
 * - GUSTO_ENCRYPTION_KEY - Encryption key for token storage
 * - GUSTO_ENVIRONMENT - 'production' or 'sandbox' (default: sandbox)
 *
 * Supported Countries:
 * - United States (US) only
 *
 * Webhook Events Handled:
 * - company.created/updated
 * - employee.created/updated/terminated
 * - payroll.created/updated/processed/cancelled
 * - payment.initiated/completed/failed
 *
 * @module GustoModule
 */
@Module({
  imports: [ConfigModule.forFeature(gustoConfig)],
  controllers: [GustoController, GustoWebhookController],
  providers: [
    GustoService,
    GustoOAuthService,
    GustoCompanyService,
    GustoEmployeeService,
    GustoPayrollService,
    GustoPayStubService,
    GustoTaxService,
    GustoBenefitsService,
    GustoEncryptionUtil,
  ],
  exports: [
    GustoService,
    GustoOAuthService,
    GustoCompanyService,
    GustoEmployeeService,
    GustoPayrollService,
    GustoPayStubService,
    GustoTaxService,
    GustoBenefitsService,
  ],
})
export class GustoModule {}
