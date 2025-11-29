import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { RbacModule } from '../auth/rbac/rbac.module';

/**
 * Reports Module
 * Provides reporting and analytics functionality across all business areas
 * Includes financial, tax, invoice, and HR reports with export capabilities
 */
@Module({
  imports: [RbacModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
