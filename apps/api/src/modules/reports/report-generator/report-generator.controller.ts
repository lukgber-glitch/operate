/**
 * Report Generator Controller
 * RESTful API endpoints for report generation and management
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ReportGeneratorService } from './report-generator.service';
import {
  GenerateReportDto,
  CompareReportsDto,
  AnnotationDto,
  CreateTemplateDto,
  ScheduleReportDto,
} from './dto/generate-report.dto';
import {
  ReportDataResponseDto,
  ReportHistoryResponseDto,
  ReportTemplateResponseDto,
  ScheduledReportResponseDto,
  CompareReportsResponseDto,
} from './dto/report-response.dto';
import { ReportType } from './interfaces/report.interfaces';

@ApiTags('Report Generator')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportGeneratorController {
  private readonly logger = new Logger(ReportGeneratorController.name);

  constructor(private readonly reportGeneratorService: ReportGeneratorService) {}

  /**
   * Generate any type of report
   */
  @Post('generate')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a report',
    description: 'Generate any type of financial report with flexible parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
    type: ReportDataResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 500, description: 'Report generation failed' })
  async generateReport(
    @Request() req,
    @Body() params: GenerateReportDto,
  ): Promise<ReportDataResponseDto> {
    const organisationId = req.user.organisationId;
    const userId = req.user.userId;

    this.logger.log(
      `Generating ${params.reportType} report for org ${organisationId} by user ${userId}`,
    );

    const report = await this.reportGeneratorService.generateReport(
      organisationId,
      userId,
      params,
    );

    return report as ReportDataResponseDto;
  }

  /**
   * Retrieve a previously generated report
   */
  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER)
  @ApiOperation({
    summary: 'Get report by ID',
    description: 'Retrieve a previously generated report',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
    type: ReportDataResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReport(
    @Request() req,
    @Param('id') reportId: string,
  ): Promise<ReportDataResponseDto> {
    const organisationId = req.user.organisationId;

    this.logger.log(`Retrieving report ${reportId} for org ${organisationId}`);

    // In a real implementation, fetch from database/storage
    // For now, return placeholder
    return {
      metadata: {
        generatedAt: new Date(),
        generatedBy: req.user.userId,
        organisationId,
        reportType: ReportType.PL_STATEMENT,
        version: 1,
        correlationId: reportId,
        generationTimeMs: 0,
        cached: true,
      },
      summary: {},
      sections: [],
    };
  }

  /**
   * Get report generation history
   */
  @Get('history')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER)
  @ApiOperation({
    summary: 'Get report history',
    description: 'List all previously generated reports for the organization',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'reportType', required: false, enum: ReportType })
  @ApiResponse({
    status: 200,
    description: 'Report history retrieved',
    type: [ReportHistoryResponseDto],
  })
  async getReportHistory(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('reportType') reportType?: ReportType,
  ): Promise<ReportHistoryResponseDto[]> {
    const organisationId = req.user.organisationId;

    this.logger.log(`Fetching report history for org ${organisationId}`);

    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Add annotation to a report
   */
  @Post(':id/annotations')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({
    summary: 'Add annotation to report',
    description: 'Add a collaborative annotation/comment to a report section or line',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 201, description: 'Annotation added successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async addAnnotation(
    @Request() req,
    @Param('id') reportId: string,
    @Body() annotation: AnnotationDto,
  ): Promise<{ id: string; message: string }> {
    const userId = req.user.userId;

    this.logger.log(`Adding annotation to report ${reportId} by user ${userId}`);

    // In a real implementation, save to database
    return {
      id: 'annotation-id',
      message: 'Annotation added successfully',
    };
  }

  /**
   * List available report templates
   */
  @Get('templates')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER)
  @ApiOperation({
    summary: 'List report templates',
    description: 'Get all available report templates (public and organization-specific)',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved',
    type: [ReportTemplateResponseDto],
  })
  async listTemplates(@Request() req): Promise<ReportTemplateResponseDto[]> {
    const organisationId = req.user.organisationId;

    this.logger.log(`Listing report templates for org ${organisationId}`);

    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Create custom report template
   */
  @Post('templates')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Create report template',
    description: 'Create a custom report template with calculated fields',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: ReportTemplateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid template configuration' })
  async createTemplate(
    @Request() req,
    @Body() template: CreateTemplateDto,
  ): Promise<ReportTemplateResponseDto> {
    const organisationId = req.user.organisationId;
    const userId = req.user.userId;

    this.logger.log(`Creating report template for org ${organisationId}`);

    // In a real implementation, save to database
    return {
      id: 'template-id',
      name: template.name,
      description: template.description || '',
      reportType: template.reportType,
      configuration: template.configuration,
      customFields: template.customFields || [],
      isPublic: template.isPublic || false,
      createdBy: userId,
      organisationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Compare two reports
   */
  @Post('compare')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({
    summary: 'Compare two reports',
    description: 'Perform variance analysis between two reports',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparison completed',
    type: CompareReportsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'One or both reports not found' })
  async compareReports(
    @Request() req,
    @Body() params: CompareReportsDto,
  ): Promise<CompareReportsResponseDto> {
    const organisationId = req.user.organisationId;

    this.logger.log(
      `Comparing reports ${params.reportIdA} vs ${params.reportIdB} for org ${organisationId}`,
    );

    const result = await this.reportGeneratorService.compareReports(organisationId, params);

    return result;
  }

  /**
   * List scheduled reports
   */
  @Get('scheduled')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'List scheduled reports',
    description: 'Get all scheduled/recurring reports for the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled reports retrieved',
    type: [ScheduledReportResponseDto],
  })
  async listScheduledReports(@Request() req): Promise<ScheduledReportResponseDto[]> {
    const organisationId = req.user.organisationId;

    this.logger.log(`Listing scheduled reports for org ${organisationId}`);

    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Schedule a recurring report
   */
  @Post('scheduled')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Schedule recurring report',
    description: 'Set up automatic report generation on a schedule',
  })
  @ApiResponse({
    status: 201,
    description: 'Report scheduled successfully',
    type: ScheduledReportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid schedule configuration' })
  async scheduleReport(
    @Request() req,
    @Body() params: ScheduleReportDto,
  ): Promise<ScheduledReportResponseDto> {
    const organisationId = req.user.organisationId;

    this.logger.log(`Scheduling ${params.reportType} report for org ${organisationId}`);

    // In a real implementation, save to database and set up cron job
    return {
      id: 'scheduled-report-id',
      organisationId,
      reportType: params.reportType,
      schedule: params.schedule,
      recipients: params.recipients,
      options: params.options as any,
      nextRunAt: new Date(),
      enabled: params.enabled ?? true,
    };
  }

  /**
   * Quick endpoint for P&L report
   */
  @Get('quick/profit-loss')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER)
  @ApiOperation({
    summary: 'Quick P&L report',
    description: 'Generate a Profit & Loss report with default settings',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'currency', required: false, type: String })
  @ApiResponse({ status: 200, description: 'P&L report generated' })
  async quickProfitAndLoss(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('currency') currency?: string,
  ): Promise<ReportDataResponseDto> {
    const params: GenerateReportDto = {
      reportType: ReportType.PL_STATEMENT,
      dateRange: {
        type: 'CUSTOM' as any,
        startDate,
        endDate,
      },
      options: {
        currency: currency || 'EUR',
      } as any,
    };

    return this.generateReport(req, params);
  }

  /**
   * Quick endpoint for Cash Flow report
   */
  @Get('quick/cash-flow')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER)
  @ApiOperation({
    summary: 'Quick Cash Flow report',
    description: 'Generate a Cash Flow report with default settings',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'currency', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Cash Flow report generated' })
  async quickCashFlow(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('currency') currency?: string,
  ): Promise<ReportDataResponseDto> {
    const params: GenerateReportDto = {
      reportType: ReportType.CASH_FLOW,
      dateRange: {
        type: 'CUSTOM' as any,
        startDate,
        endDate,
      },
      options: {
        currency: currency || 'EUR',
      } as any,
    };

    return this.generateReport(req, params);
  }

  /**
   * Quick endpoint for AR Aging report
   */
  @Get('quick/ar-aging')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER)
  @ApiOperation({
    summary: 'Quick AR Aging report',
    description: 'Generate an Accounts Receivable Aging report',
  })
  @ApiQuery({ name: 'asOfDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'AR Aging report generated' })
  async quickARAging(
    @Request() req,
    @Query('asOfDate') asOfDate?: string,
  ): Promise<ReportDataResponseDto> {
    const endDate = asOfDate ? new Date(asOfDate) : new Date();
    const startDate = new Date(endDate.getFullYear(), 0, 1);

    const params: GenerateReportDto = {
      reportType: ReportType.AR_AGING,
      dateRange: {
        type: 'CUSTOM' as any,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };

    return this.generateReport(req, params);
  }

  /**
   * Quick endpoint for AP Aging report
   */
  @Get('quick/ap-aging')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER)
  @ApiOperation({
    summary: 'Quick AP Aging report',
    description: 'Generate an Accounts Payable Aging report',
  })
  @ApiQuery({ name: 'asOfDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'AP Aging report generated' })
  async quickAPAging(
    @Request() req,
    @Query('asOfDate') asOfDate?: string,
  ): Promise<ReportDataResponseDto> {
    const endDate = asOfDate ? new Date(asOfDate) : new Date();
    const startDate = new Date(endDate.getFullYear(), 0, 1);

    const params: GenerateReportDto = {
      reportType: ReportType.AP_AGING,
      dateRange: {
        type: 'CUSTOM' as any,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };

    return this.generateReport(req, params);
  }
}
