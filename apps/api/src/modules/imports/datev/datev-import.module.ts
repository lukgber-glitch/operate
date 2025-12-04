/**
 * DATEV Import Module
 */

import { Module } from '@nestjs/common';
import { DatevImportController } from './datev-import.controller';
import { DatevImportService } from './datev-import.service';
import { DatevImportParserService } from './datev-import-parser.service';
import { DatevImportMapperService } from './datev-import-mapper.service';
import { PrismaService } from '../../../database/prisma.service';
import { SKRMappingService } from '../../compliance/exports/datev/account-mapping/skr-mapping.service';

@Module({
  controllers: [DatevImportController],
  providers: [
    DatevImportService,
    DatevImportParserService,
    DatevImportMapperService,
    SKRMappingService,
    PrismaService,
  ],
  exports: [DatevImportService],
})
export class DatevImportModule {}
