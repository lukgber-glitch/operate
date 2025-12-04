import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AtoService } from './ato.service';
import { AtoAuthService } from './ato-auth.service';
import { AtoBasService } from './ato-bas.service';
import { AtoStpClient } from './ato-stp.client';
import { AtoTparService } from './ato-tpar.service';

/**
 * ATO Integration Module
 *
 * Provides Australian Taxation Office integration capabilities
 *
 * Features:
 * - myGovID/RAM authentication with OAuth 2.0 + PKCE
 * - Business Activity Statement (BAS) lodgement
 * - Single Touch Payroll (STP) Phase 2 compliance
 * - Taxable Payments Annual Report (TPAR) lodgement
 * - Secure token management with AES-256-GCM encryption
 * - Comprehensive audit logging
 *
 * @see https://www.ato.gov.au/business/software-developers/
 */
@Module({
  imports: [ConfigModule],
  providers: [
    AtoService,
    AtoAuthService,
    AtoBasService,
    AtoStpClient,
    AtoTparService,
  ],
  exports: [
    AtoService,
    AtoAuthService,
    AtoBasService,
    AtoStpClient,
    AtoTparService,
  ],
})
export class AtoModule {}
