/**
 * Fraud Prevention Controller
 *
 * REST API endpoints for fraud detection and management
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequireAnyRole } from '../../../common/decorators/require-role.decorator';
import { Role } from '../../auth/rbac/roles';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { FraudPreventionService } from './fraud-prevention.service';
import {
  FraudAlertDto,
  AlertFiltersDto,
  ReviewDecisionDto,
  FraudStatisticsDto,
  ThresholdStatusDto,
  FraudCheckResultDto,
  CheckTransactionDto,
  CheckBatchDto,
} from './dto';

@ApiTags('Fraud Prevention')
@ApiBearerAuth()
@Controller('tax/fraud')
@UseGuards(JwtAuthGuard, RbacGuard)
export class FraudPreventionController {
  constructor(
    private readonly fraudPreventionService: FraudPreventionService,
  ) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @RequireAnyRole(Role.MEMBER, Role.ADMIN)
  @ApiOperation({ summary: 'Check transaction for fraud signals' })
  @ApiResponse({
    status: 200,
    description: 'Fraud check result',
    type: FraudCheckResultDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async checkTransaction(
    @Body() dto: CheckTransactionDto,
    @CurrentUser() user: any,
  ): Promise<FraudCheckResultDto> {
    return this.fraudPreventionService.checkTransaction(
      dto.transactionId,
      user.orgId,
      user.userId,
      dto.countryCode || 'DE',
    );
  }

  @Post('check-batch')
  @HttpCode(HttpStatus.OK)
  @RequireAnyRole(Role.MEMBER, Role.ADMIN)
  @ApiOperation({ summary: 'Check multiple transactions in batch' })
  @ApiResponse({
    status: 200,
    description: 'Batch fraud check results',
    type: [FraudCheckResultDto],
  })
  async checkBatch(
    @Body() dto: CheckBatchDto,
    @CurrentUser() user: any,
  ): Promise<FraudCheckResultDto[]> {
    return this.fraudPreventionService.checkBatch(
      dto.transactionIds,
      user.orgId,
      user.userId,
      dto.countryCode || 'DE',
    );
  }

  @Get('alerts')
  @RequireAnyRole(Role.MEMBER, Role.ADMIN)
  @ApiOperation({ summary: 'Get fraud alerts' })
  @ApiResponse({
    status: 200,
    description: 'List of fraud alerts',
    type: [FraudAlertDto],
  })
  @ApiQuery({ name: 'status', required: false, isArray: true })
  @ApiQuery({ name: 'severity', required: false, isArray: true })
  @ApiQuery({ name: 'type', required: false, isArray: true })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'categoryCode', required: false })
  async getAlerts(
    @CurrentUser() user: any,
    @Query() filters: AlertFiltersDto,
  ): Promise<FraudAlertDto[]> {
    return this.fraudPreventionService.getAlerts(user.orgId, filters);
  }

  @Get('alerts/:id')
  @RequireAnyRole(Role.MEMBER, Role.ADMIN)
  @ApiOperation({ summary: 'Get fraud alert by ID' })
  @ApiResponse({
    status: 200,
    description: 'Fraud alert details',
    type: FraudAlertDto,
  })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async getAlert(
    @Param('id') alertId: string,
    @CurrentUser() user: any,
  ): Promise<FraudAlertDto> {
    return this.fraudPreventionService.getAlert(alertId, user.orgId);
  }

  @Post('alerts/:id/review')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireAnyRole(Role.MEMBER, Role.ADMIN)
  @ApiOperation({ summary: 'Review fraud alert' })
  @ApiResponse({ status: 204, description: 'Alert reviewed successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async reviewAlert(
    @Param('id') alertId: string,
    @Body() decision: ReviewDecisionDto,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.fraudPreventionService.reviewAlert(
      alertId,
      user.orgId,
      user.userId,
      decision,
    );
  }

  @Get('thresholds')
  @RequireAnyRole(Role.MEMBER, Role.ADMIN)
  @ApiOperation({ summary: 'Get current threshold status' })
  @ApiResponse({
    status: 200,
    description: 'Threshold status by category',
    type: [ThresholdStatusDto],
  })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'countryCode', required: false })
  async getThresholds(
    @CurrentUser() user: any,
    @Query('year') year?: number,
    @Query('countryCode') countryCode?: string,
  ): Promise<ThresholdStatusDto[]> {
    const targetYear = year || new Date().getFullYear();
    return this.fraudPreventionService.getThresholdStatus(
      user.orgId,
      targetYear,
      countryCode || 'DE',
    );
  }

  @Get('statistics')
  @RequireAnyRole(Role.MEMBER, Role.ADMIN)
  @ApiOperation({ summary: 'Get fraud statistics' })
  @ApiResponse({
    status: 200,
    description: 'Fraud detection statistics',
    type: FraudStatisticsDto,
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getStatistics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<FraudStatisticsDto> {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1); // Start of current year

    const end = endDate ? new Date(endDate) : new Date(); // Now

    return this.fraudPreventionService.getStatistics(user.orgId, start, end);
  }
}
