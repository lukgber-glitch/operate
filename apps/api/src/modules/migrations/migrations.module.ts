import { Module } from '@nestjs/common';
import { LexofficeMigrationModule } from './lexoffice/lexoffice-migration.module';

@Module({
  imports: [LexofficeMigrationModule],
  exports: [LexofficeMigrationModule],
})
export class MigrationsModule {}
