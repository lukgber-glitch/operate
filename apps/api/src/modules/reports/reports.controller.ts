import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { ExportReportDto } from './dto/export-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions';

/**
 * Reports Controller
 * Handles report generation and export operations
 */
@ApiTags('Reports')
@Controller('organisations/:orgId/reports')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  /**
   * Get financial summary report
   */
  @Get('financial')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({
    summary: 'Get financial report',
    description: 'Retrieve financial summary including revenue, expenses, and profit/loss',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial report retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getFinancialReport(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getFinancialReport(orgId, query);
  }

  /**
   * Get tax summary report
   */
  @Get('tax')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({
    summary: 'Get tax report',
    description: 'Retrieve tax summary including VAT and deductions',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax report retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getTaxReport(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getTaxReport(orgId, query);
  }

  /**
   * Get invoice summary report
   */
  @Get('invoices')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({
    summary: 'Get invoice report',
    description: 'Retrieve invoice summary including aging, outstanding, and paid invoices',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice report retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getInvoicesReport(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getInvoicesReport(orgId, query);
  }

  /**
   * Get HR summary report
   */
  @Get('hr')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({
    summary: 'Get HR report',
    description: 'Retrieve HR summary including payroll and leave balances',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'HR report retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getHrReport(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getHrReport(orgId, query);
  }

  /**
   * Export report in specified format
   */
  @Post('export')
  @RequirePermissions(Permission.REPORTS_EXPORT)
  @ApiOperation({
    summary: 'Export report',
    description: 'Export a report in PDF, CSV, or Excel format',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Report export initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid export parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async exportReport(
    @Param('orgId') orgId: string,
    @Body() exportReportDto: ExportReportDto,
  ) {
    return this.reportsService.exportReport(orgId, exportReportDto);
  }
}
