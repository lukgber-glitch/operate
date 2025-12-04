import { Module } from '@nestjs/common';
import { FreeFinanceMigrationController } from './freefinance-migration.controller';
import { FreeFinanceMigrationService } from './freefinance-migration.service';
import { FreeFinanceParserService } from './freefinance-parser.service';
import { FreeFinanceMapperService } from './freefinance-mapper.service';

/**
 * FreeFinance migration module
 * Handles CSV/Excel imports from FreeFinance (Austrian competitor)
 */
@Module({
  controllers: [FreeFinanceMigrationController],
  providers: [
    FreeFinanceMigrationService,
    FreeFinanceParserService,
    FreeFinanceMapperService,
  ],
  exports: [FreeFinanceMigrationService],
})
export class FreeFinanceMigrationModule {}
