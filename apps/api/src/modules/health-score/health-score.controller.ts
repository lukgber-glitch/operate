import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HealthScoreService } from './health-score.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('health-score')
@UseGuards(JwtAuthGuard)
export class HealthScoreController {
  constructor(private readonly healthScoreService: HealthScoreService) {}

  /**
   * GET /health-score
   * Get current health score for the organization
   */
  @Get()
  async getCurrentScore(@Req() req: any) {
    const organisationId = req.user.organisationId;
    return this.healthScoreService.getCurrentScore(organisationId);
  }

  /**
   * GET /health-score/history
   * Get historical health scores
   * @query days - Number of days to look back (default: 30)
   */
  @Get('history')
  async getHistory(@Req() req: any, @Query('days') days?: string) {
    const organisationId = req.user.organisationId;
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.healthScoreService.getHistory(organisationId, daysNum);
  }

  /**
   * GET /health-score/breakdown
   * Get detailed score breakdown with component details
   */
  @Get('breakdown')
  async getBreakdown(@Req() req: any) {
    const organisationId = req.user.organisationId;
    return this.healthScoreService.getBreakdown(organisationId);
  }

  /**
   * POST /health-score/calculate
   * Force recalculation of health score
   */
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  async calculateScore(@Req() req: any) {
    const organisationId = req.user.organisationId;
    return this.healthScoreService.calculateScore(organisationId);
  }

  /**
   * GET /health-score/recommendations
   * Get AI-powered recommendations
   */
  @Get('recommendations')
  async getRecommendations(@Req() req: any) {
    const organisationId = req.user.organisationId;
    const recommendations =
      await this.healthScoreService.getRecommendations(organisationId);
    return { recommendations };
  }
}
