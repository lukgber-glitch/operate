import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { DashboardService } from './dashboard.service';

/**
 * Dashboard Controller
 * Provides dashboard widget endpoints for real-time business metrics
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/cash-flow
   *
   * Get cash flow summary for the last N days
   *
   * Query params:
   * - days: Number of days to analyze (default: 7, max: 90)
   *
   * Response:
   * {
   *   inflow: number,
   *   outflow: number,
   *   net: number,
   *   trend: 'up' | 'down' | 'stable',
   *   data: [{ date: string, inflow: number, outflow: number }]
   * }
   */
  @Get('cash-flow')
  async getCashFlow(
    @CurrentOrg() orgId: string,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    const analyzeDays = Math.min(days || 7, 90); // Cap at 90 days
    return this.dashboardService.getCashFlowSummary(orgId, analyzeDays);
  }

  /**
   * GET /dashboard/receivables
   *
   * Get accounts receivable summary (invoices owed to you)
   *
   * Response:
   * {
   *   total: number,
   *   overdue: number,
   *   current: number,
   *   agingBuckets: [
   *     { range: string, amount: number }
   *   ]
   * }
   */
  @Get('receivables')
  async getReceivables(@CurrentOrg() orgId: string) {
    return this.dashboardService.getReceivablesSummary(orgId);
  }

  /**
   * GET /dashboard/payables
   *
   * Get accounts payable summary (bills you owe)
   *
   * Response:
   * {
   *   total: number,
   *   overdue: number,
   *   upcoming: number,
   *   agingBuckets: [
   *     { range: string, amount: number }
   *   ]
   * }
   */
  @Get('payables')
  async getPayables(@CurrentOrg() orgId: string) {
    return this.dashboardService.getPayablesSummary(orgId);
  }

  /**
   * GET /dashboard/runway
   *
   * Get cash runway calculation (how long until you run out of money)
   *
   * Response:
   * {
   *   months: number,
   *   burnRate: number,
   *   cashBalance: number,
   *   projectedZeroDate: string | null
   * }
   */
  @Get('runway')
  async getRunway(@CurrentOrg() orgId: string) {
    return this.dashboardService.getRunwaySummary(orgId);
  }
}
