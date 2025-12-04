import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DataToolsService } from './data-tools.service';
import { ExportRequestDto, ExportResultDto, DeletionRequestDto, DeletionResultDto } from './dto';
import { DataCategory } from './types/data-tools.types';

/**
 * Data Tools Controller
 * REST API endpoints for data export, deletion, and anonymization
 */
@ApiTags('Data Tools')
@Controller('data-tools')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard) // Uncomment when auth is ready
export class DataToolsController {
  constructor(private readonly dataToolsService: DataToolsService) {}

  /**
   * Start data export
   */
  @Post('export')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start data export',
    description: 'Initiate a background job to export user data in the specified format',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export job started successfully',
    type: ExportResultDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request parameters' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async startExport(
    @Body() dto: ExportRequestDto,
    @Request() req: any,
  ): Promise<ExportResultDto> {
    const userId = req.user?.id || 'anonymous'; // Extract from JWT
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.dataToolsService.startExport(dto, userId, ipAddress, userAgent);
  }

  /**
   * Get export status
   */
  @Get('export/:jobId')
  @ApiOperation({
    summary: 'Get export job status',
    description: 'Retrieve the current status and details of an export job',
  })
  @ApiParam({ name: 'jobId', description: 'Export job ID', example: 'export_abc123' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export job status retrieved',
    type: ExportResultDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Export job not found' })
  async getExportStatus(
    @Param('jobId') jobId: string,
    @Request() req: any,
  ): Promise<ExportResultDto> {
    const userId = req.user?.id || 'anonymous';
    return this.dataToolsService.getExportStatus(jobId, userId);
  }

  /**
   * Download export file
   */
  @Get('export/:jobId/download')
  @ApiOperation({
    summary: 'Download export file',
    description: 'Download the exported data file (requires valid download token)',
  })
  @ApiParam({ name: 'jobId', description: 'Export job ID', example: 'export_abc123' })
  @ApiQuery({ name: 'token', description: 'Download token', example: 'tok_xyz789' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File download started' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Export file not found or expired' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid download token' })
  async downloadExport(
    @Param('jobId') jobId: string,
    @Query('token') token: string,
    @Request() req: any,
  ) {
    // This would handle file download
    // Placeholder implementation
    return { message: 'File download would be handled here', jobId, token };
  }

  /**
   * Start data deletion
   */
  @Post('delete')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start data deletion',
    description: 'Initiate a background job to delete user data (may require confirmation)',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Deletion job started or confirmation required',
    type: DeletionResultDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request parameters' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async startDeletion(
    @Body() dto: DeletionRequestDto,
    @Request() req: any,
  ): Promise<DeletionResultDto> {
    const userId = req.user?.id || 'anonymous';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.dataToolsService.startDeletion(dto, userId, ipAddress, userAgent);
  }

  /**
   * Get deletion status
   */
  @Get('delete/:jobId')
  @ApiOperation({
    summary: 'Get deletion job status',
    description: 'Retrieve the current status and details of a deletion job',
  })
  @ApiParam({ name: 'jobId', description: 'Deletion job ID', example: 'del_abc123' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deletion job status retrieved',
    type: DeletionResultDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Deletion job not found' })
  async getDeletionStatus(
    @Param('jobId') jobId: string,
    @Request() req: any,
  ): Promise<DeletionResultDto> {
    const userId = req.user?.id || 'anonymous';
    return this.dataToolsService.getDeletionStatus(jobId, userId);
  }

  /**
   * Preview deletion
   */
  @Post('preview-deletion/:userId')
  @ApiOperation({
    summary: 'Preview data deletion',
    description: 'Preview what data would be deleted without actually deleting it',
  })
  @ApiParam({ name: 'userId', description: 'User ID to preview deletion for' })
  @ApiQuery({
    name: 'categories',
    description: 'Comma-separated list of categories',
    required: false,
    example: 'profile,financial',
  })
  @ApiQuery({
    name: 'organisationId',
    description: 'Organisation ID',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deletion preview generated',
  })
  async previewDeletion(
    @Param('userId') userId: string,
    @Query('categories') categoriesStr?: string,
    @Query('organisationId') organisationId?: string,
  ) {
    const categories = categoriesStr
      ? (categoriesStr.split(',') as DataCategory[])
      : [DataCategory.ALL];

    return this.dataToolsService.previewDeletion(userId, categories, organisationId);
  }

  /**
   * Anonymize user data
   */
  @Post('anonymize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Anonymize user data',
    description: 'Replace user data with anonymized values while preserving statistical integrity',
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to anonymize (admin only)',
    required: false,
  })
  @ApiQuery({
    name: 'organisationId',
    description: 'Organisation ID',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data anonymized successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async anonymizeUser(
    @Query('userId') targetUserId: string | undefined,
    @Query('organisationId') organisationId: string | undefined,
    @Request() req: any,
  ) {
    const userId = targetUserId || req.user?.id || 'anonymous';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.dataToolsService.anonymizeUser(userId, organisationId, ipAddress, userAgent);
  }

  /**
   * Get data tools statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get data tools statistics',
    description: 'Retrieve statistics about exports, deletions, and anonymizations',
  })
  @ApiQuery({
    name: 'organisationId',
    description: 'Organisation ID (admin only)',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved',
  })
  async getStatistics(
    @Query('organisationId') organisationId: string | undefined,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'anonymous';
    return this.dataToolsService.getStatistics(userId, organisationId);
  }
}
