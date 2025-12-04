import { Module } from '@nestjs/common';
import { VatController } from './vat.controller';
import { VatService } from './vat.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VatController],
  providers: [VatService],
  exports: [VatService],
})
export class VatModule {}
