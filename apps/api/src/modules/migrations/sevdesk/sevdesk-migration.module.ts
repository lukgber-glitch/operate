import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SevDeskMigrationController } from './sevdesk-migration.controller';
import { SevDeskMigrationService } from './sevdesk-migration.service';
import { SevDeskParserService } from './sevdesk-parser.service';
import { SevDeskMapperService } from './sevdesk-mapper.service';
import { DatabaseModule } from '../../database/database.module';
import { RbacModule } from '../../auth/rbac/rbac.module';

/**
 * sevDesk Migration Module
 * Handles CSV/Excel migration from sevDesk to Operate
 */
@Module({
  imports: [ConfigModule, DatabaseModule, RbacModule],
  controllers: [SevDeskMigrationController],
  providers: [
    SevDeskMigrationService,
    SevDeskParserService,
    SevDeskMapperService,
  ],
  exports: [SevDeskMigrationService],
})
export class SevDeskMigrationModule {}
