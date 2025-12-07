import { Module } from '@nestjs/common';
import { DatabaseModule } from '@operate/database';
import { VatReturnController } from './vat-return.controller';
import { VatReturnService } from './vat-return.service';
import { VatReturnPreviewService } from './vat-return-preview.service';
import { VatCalculationService } from './vat-calculation.service';
import { ElsterXmlGeneratorService } from './elster-xml-generator.service';

@Module({
  imports: [DatabaseModule],
  controllers: [VatReturnController],
  providers: [
    VatReturnService,
    VatReturnPreviewService,
    VatCalculationService,
    ElsterXmlGeneratorService,
  ],
  exports: [
    VatReturnService,
    VatReturnPreviewService,
    VatCalculationService,
    ElsterXmlGeneratorService,
  ],
})
export class VatReturnModule {}
