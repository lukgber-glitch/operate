import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { CashFlowForecastService } from './cash-flow-forecast.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AnalyticsController],
  providers: [CashFlowForecastService],
  exports: [CashFlowForecastService],
})
export class AnalyticsModule {}
