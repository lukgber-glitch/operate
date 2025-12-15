import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaxAssistantController } from './tax-assistant.controller';
import { TaxAssistantService } from './tax-assistant.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [TaxAssistantController],
  providers: [TaxAssistantService],
  exports: [TaxAssistantService],
})
export class TaxAssistantModule {}
