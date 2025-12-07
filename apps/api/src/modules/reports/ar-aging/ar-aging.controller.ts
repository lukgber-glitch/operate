/**
 * AR Aging Report Controller
 * RESTful API endpoints for Accounts Receivable aging reports
 */

import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ArAgingService } from './ar-aging.service';
import { AgingReportFilters } from '../aging/types/aging-report.types';

@ApiTags('AR Aging Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports/ar-aging')
export class ArAgingController {
  private readonly logger = new Logger(ArAgingController.name);

  constructor(private readonly arAgingService: ArAgingService) {}

  /**
   * Generate AR Aging Report
   * GET /reports/ar-aging
   */
  @Get()
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate AR Aging Report',
    description: 'Generate an Accounts Receivable aging report with standard aging buckets',
  })
  @ApiResponse({
    status: 200,
    description: 'AR aging report generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({
    name: 'asOfDate',
    required: false,
    type: String,
    description: 'As of date (YYYY-MM-DD), defaults to today',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by specific customer ID',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Minimum amount to include',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    type: String,
    description: 'Currency code',
    example: 'EUR',
  })
  async getReport(
    @CurrentUser('organisationId') organisationId: string,
    @Query('asOfDate') asOfDate?: string,
    @Query('customerId') customerId?: string,
    @Query('minAmount') minAmount?: number,
    @Query('currency') currency?: string,
  ) {
    this.logger.log(`Generating AR Aging Report for org ${organisationId}`);

    const filters: AgingReportFilters = {
      asOfDate: asOfDate ? new Date(asOfDate) : undefined,
      customerId,
      minAmount: minAmount ? Number(minAmount) : undefined,
      currency,
    };

    return this.arAgingService.generateReport(organisationId, filters);
  }

  /**
   * Export AR Aging Report to CSV
   * GET /reports/ar-aging/export/csv
   */
  @Get('export/csv')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export AR Aging to CSV',
    description: 'Export Accounts Receivable aging report as CSV file',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({
    name: 'asOfDate',
    required: false,
    type: String,
    description: 'As of date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by customer ID',
  })
  async exportCsv(
    @CurrentUser('organisationId') organisationId: string,
    @Res() res: Response,
    @Query('asOfDate') asOfDate?: string,
    @Query('customerId') customerId?: string,
    @Query('minAmount') minAmount?: number,
    @Query('currency') currency?: string,
  ) {
    this.logger.log(`Exporting AR Aging Report to CSV for org ${organisationId}`);

    const filters: AgingReportFilters = {
      asOfDate: asOfDate ? new Date(asOfDate) : undefined,
      customerId,
      minAmount: minAmount ? Number(minAmount) : undefined,
      currency,
    };

    const csv = await this.arAgingService.exportToCsv(organisationId, filters);

    const filename = `AR_Aging_${asOfDate || new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export AR Aging Report to PDF
   * GET /reports/ar-aging/export/pdf
   */
  @Get('export/pdf')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export AR Aging to PDF',
    description: 'Export Accounts Receivable aging report as PDF file',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF file generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({
    name: 'asOfDate',
    required: false,
    type: String,
    description: 'As of date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by customer ID',
  })
  async exportPdf(
    @CurrentUser('organisationId') organisationId: string,
    @Res() res: Response,
    @Query('asOfDate') asOfDate?: string,
    @Query('customerId') customerId?: string,
    @Query('minAmount') minAmount?: number,
    @Query('currency') currency?: string,
  ) {
    this.logger.log(`Exporting AR Aging Report to PDF for org ${organisationId}`);

    const filters: AgingReportFilters = {
      asOfDate: asOfDate ? new Date(asOfDate) : undefined,
      customerId,
      minAmount: minAmount ? Number(minAmount) : undefined,
      currency,
    };

    const pdfBuffer = await this.arAgingService.exportToPdf(organisationId, filters);

    const filename = `AR_Aging_${asOfDate || new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }
}
