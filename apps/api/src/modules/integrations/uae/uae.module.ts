import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UAEService } from './uae.service';
import { UAEInvoiceService } from './uae-invoice.service';
import { UAETaxService } from './uae-tax.service';
import { UAEValidationService } from './uae-validation.service';
import { UAEFTAClientService } from './uae-fta-client.service';

/**
 * UAE Integration Module
 * Provides UAE e-invoicing and FTA integration services
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [
    UAEService,
    UAEInvoiceService,
    UAETaxService,
    UAEValidationService,
    UAEFTAClientService,
  ],
  exports: [
    UAEService,
    UAEInvoiceService,
    UAETaxService,
    UAEValidationService,
    UAEFTAClientService,
  ],
})
export class UAEModule {}
