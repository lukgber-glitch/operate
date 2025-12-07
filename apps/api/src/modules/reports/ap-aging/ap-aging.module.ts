/**
 * AP Aging Module
 * Module for Accounts Payable aging reports
 */

import { Module } from '@nestjs/common';
import { ApAgingService } from './ap-aging.service';
import { ApAgingController } from './ap-aging.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ApAgingController],
  providers: [ApAgingService],
  exports: [ApAgingService],
})
export class ApAgingModule {}
