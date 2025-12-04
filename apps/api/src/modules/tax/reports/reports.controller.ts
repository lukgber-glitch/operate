import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

/**
 * Tax Reports Controller
 * Handles tax report generation and export
 */
@ApiTags('Tax Reports')
@ApiBearerAuth()
@Controller('tax/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get tax report for a specific year
   */
  @Get(':year')
  @ApiOperation({
    summary: 'Get tax report',
    description: 'Get comprehensive tax report for a specific year',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax report retrieved successfully',
  })
  async getTaxReport(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('year') year: string,
  ) {
    const orgId = user.orgId;
    return this.reportsService.getTaxReport(orgId, year);
  }

  /**
   * Export tax report
   */
  @Get(':year/export')
  @ApiOperation({
    summary: 'Export tax report',
    description: 'Export tax report in specified format (PDF, EXCEL, CSV)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax report exported successfully',
  })
  async exportTaxReport(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('year') year: string,
    @Query('format') format: 'PDF' | 'EXCEL' | 'CSV',
    @Res() res: Response,
  ) {
    const orgId = user.orgId;
    const buffer = await this.reportsService.exportTaxReport(orgId, year, format);

    const contentTypes = {
      PDF: 'application/pdf',
      EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      CSV: 'text/csv',
    };

    const extensions = {
      PDF: 'pdf',
      EXCEL: 'xlsx',
      CSV: 'csv',
    };

    res.setHeader('Content-Type', contentTypes[format]);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=tax-report-${year}.${extensions[format]}`,
    );
    res.send(buffer);
  }

  /**
   * Get tax deadlines
   */
  @Get('deadlines/list')
  @ApiOperation({
    summary: 'Get tax deadlines',
    description: 'Get upcoming tax deadlines',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax deadlines retrieved successfully',
  })
  async getTaxDeadlines(
    @CurrentUser() user: { id: string; orgId: string },
    @Query('upcoming') upcoming?: string,
  ) {
    const orgId = user.orgId;
    const upcomingOnly = upcoming === 'true';
    return this.reportsService.getTaxDeadlines(orgId, upcomingOnly);
  }

  /**
   * Mark deadline as completed
   */
  @Post('deadlines/:id/complete')
  @ApiOperation({
    summary: 'Mark deadline as completed',
    description: 'Mark a tax deadline as completed',
  })
  @ApiResponse({
    status: 200,
    description: 'Deadline marked as completed',
  })
  async markDeadlineCompleted(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') deadlineId: string,
  ) {
    const orgId = user.orgId;
    return this.reportsService.markDeadlineCompleted(orgId, deadlineId);
  }

  /**
   * Get tax compliance status
   */
  @Get('compliance/status')
  @ApiOperation({
    summary: 'Get tax compliance status',
    description: 'Get current tax compliance status and issues',
  })
  @ApiResponse({
    status: 200,
    description: 'Compliance status retrieved successfully',
  })
  async getComplianceStatus(@CurrentUser() user: { id: string; orgId: string }) {
    const orgId = user.orgId;
    return this.reportsService.getComplianceStatus(orgId);
  }
}

/**
 * Tax Compliance Controller
 * Separate controller for compliance endpoints at /tax/compliance
 */
@ApiTags('Tax Compliance')
@ApiBearerAuth()
@Controller('tax/compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get tax compliance status
   */
  @Get()
  @ApiOperation({
    summary: 'Get tax compliance status',
    description: 'Get current tax compliance status and issues',
  })
  @ApiResponse({
    status: 200,
    description: 'Compliance status retrieved successfully',
  })
  async getComplianceStatus(@CurrentUser() user: { id: string; orgId: string }) {
    const orgId = user.orgId;
    return this.reportsService.getComplianceStatus(orgId);
  }
}

/**
 * Tax Deadlines Controller
 * Separate controller for deadlines endpoints at /tax/deadlines
 */
@ApiTags('Tax Deadlines')
@ApiBearerAuth()
@Controller('tax/deadlines')
@UseGuards(JwtAuthGuard)
export class DeadlinesController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get tax deadlines
   */
  @Get()
  @ApiOperation({
    summary: 'Get tax deadlines',
    description: 'Get upcoming tax deadlines',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax deadlines retrieved successfully',
  })
  async getTaxDeadlines(
    @CurrentUser() user: { id: string; orgId: string },
    @Query('upcoming') upcoming?: string,
  ) {
    const orgId = user.orgId;
    const upcomingOnly = upcoming === 'true';
    return this.reportsService.getTaxDeadlines(orgId, upcomingOnly);
  }

  /**
   * Mark deadline as completed
   */
  @Post(':id/complete')
  @ApiOperation({
    summary: 'Mark deadline as completed',
    description: 'Mark a tax deadline as completed',
  })
  @ApiResponse({
    status: 200,
    description: 'Deadline marked as completed',
  })
  async markDeadlineCompleted(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') deadlineId: string,
  ) {
    const orgId = user.orgId;
    return this.reportsService.markDeadlineCompleted(orgId, deadlineId);
  }
}
