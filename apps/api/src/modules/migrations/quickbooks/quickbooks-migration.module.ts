/**
 * QuickBooks Migration Module
 * Configures and exports QuickBooks migration services and controllers
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { QuickBooksMigrationService } from './quickbooks-migration.service';
import { QuickBooksMigrationController } from './quickbooks-migration.controller';
import { QuickBooksDataFetcherService } from './quickbooks-data-fetcher.service';
import { QuickBooksMapperService } from './quickbooks-mapper.service';
import { PrismaModule } from '../../database/prisma.module';
import { QuickBooksModule } from '../../quickbooks/quickbooks.module';

@Module({
  imports: [
    PrismaModule,
    QuickBooksModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [QuickBooksMigrationController],
  providers: [
    QuickBooksMigrationService,
    QuickBooksDataFetcherService,
    QuickBooksMapperService,
  ],
  exports: [QuickBooksMigrationService],
})
export class QuickBooksMigrationModule {}
