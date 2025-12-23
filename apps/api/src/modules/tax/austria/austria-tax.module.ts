import { Module } from '@nestjs/common';
import { AustriaTaxController } from './austria-tax.controller';
import { AustriaTaxService } from './austria-tax.service';
import { TaxContextService } from '../shared/tax-context.service';

@Module({
  controllers: [AustriaTaxController],
  providers: [AustriaTaxService, TaxContextService],
  exports: [AustriaTaxService],
})
export class AustriaTaxModule {}
