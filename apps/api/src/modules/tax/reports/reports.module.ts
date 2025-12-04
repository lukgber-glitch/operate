import { Module } from '@nestjs/common';
import { ReportsController, ComplianceController, DeadlinesController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController, ComplianceController, DeadlinesController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
