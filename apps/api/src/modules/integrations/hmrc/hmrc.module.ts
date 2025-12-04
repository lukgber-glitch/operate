import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HmrcController } from './hmrc.controller';
import { HmrcAuthService } from './hmrc-auth.service';
import { HmrcVatService } from './services/hmrc-vat.service';
import { VatCalculationService } from './services/vat-calculation.service';
import { DatabaseModule } from '../../database/database.module';

/**
 * HMRC MTD Integration Module
 *
 * Provides UK HMRC Making Tax Digital capabilities through HMRC API
 *
 * Features:
 * - OAuth2 authentication with PKCE
 * - VAT return submission
 * - VAT obligations retrieval
 * - VAT liabilities and payments
 * - Fraud prevention headers (HMRC requirement)
 * - AES-256-GCM encrypted token storage
 *
 * @see https://developer.service.hmrc.gov.uk/api-documentation
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  controllers: [HmrcController],
  providers: [
    HmrcAuthService,
    HmrcVatService,
    VatCalculationService,
  ],
  exports: [
    HmrcAuthService,
    HmrcVatService,
    VatCalculationService,
  ],
})
export class HmrcModule {}
