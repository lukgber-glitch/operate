import { Module } from '@nestjs/common';
import { AustriaTaxController } from './austria-tax.controller';
import { AustriaTaxService } from './austria-tax.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AustriaTaxController],
  providers: [AustriaTaxService],
  exports: [AustriaTaxService],
})
export class AustriaTaxModule {}
