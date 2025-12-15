import { Module } from '@nestjs/common';
import { VatController } from './vat.controller';
import { VatService } from './vat.service';
import { DatabaseModule } from '../../database/database.module';
import { TaxContextService } from '../shared/tax-context.service';

@Module({
  imports: [DatabaseModule],
  controllers: [VatController],
  providers: [VatService, TaxContextService],
  exports: [VatService],
})
export class VatModule {}
