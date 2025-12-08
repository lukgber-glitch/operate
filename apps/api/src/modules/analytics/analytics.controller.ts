import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CashFlowForecastService } from './cash-flow-forecast.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly cashFlowForecastService: CashFlowForecastService,
  ) {}

  /**
   * GET /analytics/cash-flow-forecast
   *
   * Generate multi-month cash flow forecast
   *
   * Query params:
   * - months: Number of months to forecast (default: 3, max: 12)
   */
  @Get('cash-flow-forecast')
  async getCashFlowForecast(
    @CurrentOrg() orgId: string,
    @Query('months', new ParseIntPipe({ optional: true }))
    months?: number,
  ) {
    const forecastMonths = Math.min(months || 3, 12); // Cap at 12 months
    return this.cashFlowForecastService.generateForecast(
      orgId,
      forecastMonths,
    );
  }
}
