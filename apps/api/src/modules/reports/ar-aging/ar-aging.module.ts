/**
 * AR Aging Module
 * Module for Accounts Receivable aging reports
 */

import { Module } from '@nestjs/common';
import { ArAgingService } from './ar-aging.service';
import { ArAgingController } from './ar-aging.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ArAgingController],
  providers: [ArAgingService],
  exports: [ArAgingService],
})
export class ArAgingModule {}
