/**
 * Tally ERP Integration Module
 *
 * NestJS module for Tally ERP integration with Operate platform.
 * Provides services for syncing companies, ledgers, vouchers, and stock items.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TallyService } from './tally.service';
import { TallyClient } from './tally.client';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  providers: [
    TallyService,
    TallyClient,
  ],
  exports: [
    TallyService,
    TallyClient,
  ],
})
export class TallyModule {}
