/**
 * Report Generator Module
 * Provides comprehensive reporting and analytics functionality
 */

import { Module } from '@nestjs/common';
import { ReportGeneratorController } from './report-generator.controller';
import { ReportGeneratorService } from './report-generator.service';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../cache/cache.module';
import { RbacModule } from '../../auth/rbac/rbac.module';

@Module({
  imports: [DatabaseModule, CacheModule, RbacModule],
  controllers: [ReportGeneratorController],
  providers: [ReportGeneratorService],
  exports: [ReportGeneratorService],
})
export class ReportGeneratorModule {}
