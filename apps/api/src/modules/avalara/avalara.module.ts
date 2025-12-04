import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AvalaraController } from './avalara.controller';
import { AvalaraService } from './avalara.service';
import {
  USSalesTaxService,
  TaxExemptionService,
  TaxReportingService,
  NexusConfigurationService,
} from './services';
import { NexusController } from './controllers/nexus.controller';
import avalaraConfig from './avalara.config';

/**
 * Avalara AvaTax Module
 * Provides US sales tax calculation via Avalara AvaTax API
 * Includes nexus management, exemption tracking, and tax reporting
 */
@Module({
  imports: [ConfigModule.forFeature(avalaraConfig)],
  controllers: [AvalaraController, NexusController],
  providers: [
    AvalaraService,
    USSalesTaxService,
    TaxExemptionService,
    TaxReportingService,
    NexusConfigurationService,
  ],
  exports: [
    AvalaraService,
    USSalesTaxService,
    TaxExemptionService,
    TaxReportingService,
    NexusConfigurationService,
  ],
})
export class AvalaraModule {}
