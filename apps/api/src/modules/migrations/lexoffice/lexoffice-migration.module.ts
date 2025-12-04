import { Module } from '@nestjs/common';
import { LexofficeMigrationController } from './lexoffice-migration.controller';
import { LexofficeMigrationService } from './lexoffice-migration.service';
import { LexofficeParserService } from './lexoffice-parser.service';
import { LexofficeMapperService } from './lexoffice-mapper.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LexofficeMigrationController],
  providers: [
    LexofficeMigrationService,
    LexofficeParserService,
    LexofficeMapperService,
  ],
  exports: [LexofficeMigrationService],
})
export class LexofficeMigrationModule {}
