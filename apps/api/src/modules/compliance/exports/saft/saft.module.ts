/**
 * SAF-T Export Module
 * Provides SAF-T export functionality
 */

import { Module } from '@nestjs/common';
import { SaftService } from './saft.service';
import { SaftBuilderService } from './saft-builder.service';
import { SaftController } from './saft.controller';
import { DatabaseModule } from '@/modules/database/database.module';

/**
 * SAF-T Export Module
 */
@Module({
  imports: [DatabaseModule],
  controllers: [SaftController],
  providers: [SaftService, SaftBuilderService],
  exports: [SaftService, SaftBuilderService],
})
export class SaftModule {}
