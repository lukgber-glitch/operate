import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ComplyAdvantageService } from './comply-advantage.service';
import { CreateSearchDto } from './dto/create-search.dto';
import { ReviewAlertDto } from './dto/alert.dto';
import { CreateMonitoringDto, ListScreeningsDto } from './dto/webhook-payload.dto';

/**
 * ComplyAdvantage AML Screening Controller
 * Handles AML screening, monitoring, and case management
 */
@Controller('aml')
export class ComplyAdvantageController {
  constructor(private readonly complyAdvantageService: ComplyAdvantageService) {}

  /**
   * Create new AML screening
   * POST /aml/screen
   */
  @Post('screen')
  @HttpCode(HttpStatus.CREATED)
  async createScreening(@Body() dto: CreateSearchDto) {
    return this.complyAdvantageService.screening.createSearch(dto);
  }

  /**
   * Get screening by ID
   * GET /aml/screenings/:id
   */
  @Get('screenings/:id')
  async getScreening(@Param('id') id: string) {
    return this.complyAdvantageService.screening.getScreening(id);
  }

  /**
   * List screenings for organization
   * GET /aml/screenings/organization/:orgId
   */
  @Get('screenings/organization/:orgId')
  async listScreenings(
    @Param('orgId') orgId: string,
    @Query() query: ListScreeningsDto,
  ) {
    return this.complyAdvantageService.screening.listScreenings(orgId, query);
  }

  /**
   * Re-screen an entity
   * POST /aml/screenings/:id/rescreen
   */
  @Post('screenings/:id/rescreen')
  @HttpCode(HttpStatus.CREATED)
  async reScreen(@Param('id') id: string) {
    return this.complyAdvantageService.screening.reScreen(id);
  }

  /**
   * Enable ongoing monitoring
   * POST /aml/monitoring
   */
  @Post('monitoring')
  @HttpCode(HttpStatus.CREATED)
  async enableMonitoring(@Body() dto: CreateMonitoringDto) {
    return this.complyAdvantageService.monitoring.enableMonitoring(dto);
  }

  /**
   * Disable monitoring
   * PUT /aml/monitoring/:screeningId/disable
   */
  @Put('monitoring/:screeningId/disable')
  async disableMonitoring(@Param('screeningId') screeningId: string) {
    await this.complyAdvantageService.monitoring.disableMonitoring(screeningId);
    return { message: 'Monitoring disabled successfully' };
  }

  /**
   * Get monitoring status
   * GET /aml/monitoring/:screeningId
   */
  @Get('monitoring/:screeningId')
  async getMonitoringStatus(@Param('screeningId') screeningId: string) {
    return this.complyAdvantageService.monitoring.getMonitoringStatus(screeningId);
  }

  /**
   * List active monitoring
   * GET /aml/monitoring/organization/:orgId
   */
  @Get('monitoring/organization/:orgId')
  async listActiveMonitoring(@Param('orgId') orgId: string) {
    return this.complyAdvantageService.monitoring.listActiveMonitoring(orgId);
  }

  /**
   * Review an alert
   * PUT /aml/alerts/:id/review
   */
  @Put('alerts/:id/review')
  async reviewAlert(@Param('id') id: string, @Body() dto: ReviewAlertDto) {
    return this.complyAdvantageService.caseManagement.reviewAlert(id, dto);
  }

  /**
   * Get alert by ID
   * GET /aml/alerts/:id
   */
  @Get('alerts/:id')
  async getAlert(@Param('id') id: string) {
    return this.complyAdvantageService.caseManagement.getAlert(id);
  }

  /**
   * List alerts for screening
   * GET /aml/screenings/:id/alerts
   */
  @Get('screenings/:id/alerts')
  async listAlerts(
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.complyAdvantageService.caseManagement.listAlerts(id, status);
  }

  /**
   * Get alert statistics
   * GET /aml/statistics/:orgId
   */
  @Get('statistics/:orgId')
  async getStatistics(@Param('orgId') orgId: string) {
    return this.complyAdvantageService.caseManagement.getAlertStatistics(orgId);
  }

  /**
   * Get pending review cases
   * GET /aml/pending-reviews/:orgId
   */
  @Get('pending-reviews/:orgId')
  async getPendingReviews(@Param('orgId') orgId: string) {
    return this.complyAdvantageService.caseManagement.getPendingReviewCases(orgId);
  }

  /**
   * Get overdue reviews
   * GET /aml/overdue-reviews/:orgId
   */
  @Get('overdue-reviews/:orgId')
  async getOverdueReviews(@Param('orgId') orgId: string) {
    return this.complyAdvantageService.caseManagement.getOverdueReviews(orgId);
  }

  /**
   * Escalate alert
   * POST /aml/alerts/:id/escalate
   */
  @Post('alerts/:id/escalate')
  async escalateAlert(
    @Param('id') id: string,
    @Body() body: { escalatedBy: string; reason: string },
  ) {
    return this.complyAdvantageService.caseManagement.escalateAlert(
      id,
      body.escalatedBy,
      body.reason,
    );
  }

  /**
   * Health check
   * GET /aml/health
   */
  @Get('health')
  async healthCheck() {
    return this.complyAdvantageService.healthCheck();
  }
}
