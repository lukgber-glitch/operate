/**
 * AP Aging Report Controller
 * RESTful API endpoints for Accounts Payable aging reports
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
import { ApAgingService } from './ap-aging.service';
import { AgingReportFilters } from '../aging/types/aging-report.types';

@ApiTags('AP Aging Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports/ap-aging')
export class ApAgingController {
  private readonly logger = new Logger(ApAgingController.name);

  constructor(private readonly apAgingService: ApAgingService) {}

  /**
   * Generate AP Aging Report
   * GET /reports/ap-aging
   */
  @Get()
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate AP Aging Report',
    description: 'Generate an Accounts Payable aging report with standard aging buckets',
  })
  @ApiResponse({
    status: 200,
    description: 'AP aging report generated successfully',
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
    name: 'vendorId',
    required: false,
    type: String,
    description: 'Filter by specific vendor ID',
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
    @Query('vendorId') vendorId?: string,
    @Query('minAmount') minAmount?: number,
    @Query('currency') currency?: string,
  ) {
    this.logger.log(`Generating AP Aging Report for org ${organisationId}`);

    const filters: AgingReportFilters = {
      asOfDate: asOfDate ? new Date(asOfDate) : undefined,
      vendorId,
      minAmount: minAmount ? Number(minAmount) : undefined,
      currency,
    };

    return this.apAgingService.generateReport(organisationId, filters);
  }

  /**
   * Export AP Aging Report to CSV
   * GET /reports/ap-aging/export/csv
   */
  @Get('export/csv')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export AP Aging to CSV',
    description: 'Export Accounts Payable aging report as CSV file',
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
    name: 'vendorId',
    required: false,
    type: String,
    description: 'Filter by vendor ID',
  })
  async exportCsv(
    @CurrentUser('organisationId') organisationId: string,
    @Res() res: Response,
    @Query('asOfDate') asOfDate?: string,
    @Query('vendorId') vendorId?: string,
    @Query('minAmount') minAmount?: number,
    @Query('currency') currency?: string,
  ) {
    this.logger.log(`Exporting AP Aging Report to CSV for org ${organisationId}`);

    const filters: AgingReportFilters = {
      asOfDate: asOfDate ? new Date(asOfDate) : undefined,
      vendorId,
      minAmount: minAmount ? Number(minAmount) : undefined,
      currency,
    };

    const csv = await this.apAgingService.exportToCsv(organisationId, filters);

    const filename = `AP_Aging_${asOfDate || new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export AP Aging Report to PDF
   * GET /reports/ap-aging/export/pdf
   */
  @Get('export/pdf')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export AP Aging to PDF',
    description: 'Export Accounts Payable aging report as PDF file',
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
    name: 'vendorId',
    required: false,
    type: String,
    description: 'Filter by vendor ID',
  })
  async exportPdf(
    @CurrentUser('organisationId') organisationId: string,
    @Res() res: Response,
    @Query('asOfDate') asOfDate?: string,
    @Query('vendorId') vendorId?: string,
    @Query('minAmount') minAmount?: number,
    @Query('currency') currency?: string,
  ) {
    this.logger.log(`Exporting AP Aging Report to PDF for org ${organisationId}`);

    const filters: AgingReportFilters = {
      asOfDate: asOfDate ? new Date(asOfDate) : undefined,
      vendorId,
      minAmount: minAmount ? Number(minAmount) : undefined,
      currency,
    };

    const pdfBuffer = await this.apAgingService.exportToPdf(organisationId, filters);

    const filename = `AP_Aging_${asOfDate || new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }
}
