import { Module } from '@nestjs/common';
import { ReportsController, ComplianceController, DeadlinesController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DatabaseModule } from '../../database/database.module';
import { TaxContextService } from '../shared/tax-context.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController, ComplianceController, DeadlinesController],
  providers: [ReportsService, TaxContextService],
  exports: [ReportsService],
})
export class ReportsModule {}
