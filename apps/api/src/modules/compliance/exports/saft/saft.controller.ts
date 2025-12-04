/**
 * SAF-T Export Controller
 * Handles HTTP endpoints for SAF-T export operations
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SaftService } from './saft.service';
import {
  CreateSaftExportDto,
  SaftExportResponseDto,
  SaftExportListResponseDto,
  ValidationResultDto,
} from './dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';

/**
 * SAF-T Export Controller
 */
@ApiTags('Compliance - SAF-T Exports')
@ApiBearerAuth()
@Controller('compliance/exports/saft')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SaftController {
  constructor(private readonly saftService: SaftService) {}

  /**
   * Create a new SAF-T export
   */
  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create SAF-T export',
    description:
      'Creates a new SAF-T (Standard Audit File for Tax) export for the specified period',
  })
  @ApiResponse({
    status: 201,
    description: 'Export created successfully',
    type: SaftExportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createExport(
    @Request() req: any,
    @Body() createDto: CreateSaftExportDto,
  ): Promise<SaftExportResponseDto> {
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;

    return this.saftService.createExport(organizationId, userId, createDto);
  }

  /**
   * List all exports
   */
  @Get()
  @Roles('ADMIN', 'ACCOUNTANT', 'VIEWER')
  @ApiOperation({
    summary: 'List SAF-T exports',
    description: 'Retrieves a paginated list of SAF-T exports',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List retrieved successfully',
    type: SaftExportListResponseDto,
  })
  async listExports(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<SaftExportListResponseDto> {
    const organizationId = req.user.organizationId;
    return this.saftService.listExports(
      organizationId,
      page ? parseInt(page.toString(), 10) : 1,
      pageSize ? parseInt(pageSize.toString(), 10) : 10,
    );
  }

  /**
   * Get export status
   */
  @Get(':exportId')
  @Roles('ADMIN', 'ACCOUNTANT', 'VIEWER')
  @ApiOperation({
    summary: 'Get export status',
    description: 'Retrieves the status and details of a specific export',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Export details retrieved',
    type: SaftExportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Export not found' })
  async getExportStatus(
    @Request() req: any,
    @Param('exportId') exportId: string,
  ): Promise<SaftExportResponseDto> {
    const organizationId = req.user.organizationId;
    return this.saftService.getExportStatus(organizationId, exportId);
  }

  /**
   * Download export file
   */
  @Get(':exportId/download')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Download export file',
    description: 'Downloads the generated SAF-T XML file',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'File download started',
    content: {
      'application/xml': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Export not ready' })
  @ApiResponse({ status: 404, description: 'Export or file not found' })
  async downloadExport(
    @Request() req: any,
    @Param('exportId') exportId: string,
  ) {
    const organizationId = req.user.organizationId;
    return this.saftService.downloadExport(organizationId, exportId);
  }

  /**
   * Validate export
   */
  @Post(':exportId/validate')
  @Roles('ADMIN', 'ACCOUNTANT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate export',
    description: 'Validates the SAF-T XML against schema and business rules',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed',
    type: ValidationResultDto,
  })
  @ApiResponse({ status: 400, description: 'Export not ready for validation' })
  @ApiResponse({ status: 404, description: 'Export not found' })
  async validateExport(
    @Request() req: any,
    @Param('exportId') exportId: string,
  ): Promise<ValidationResultDto> {
    const organizationId = req.user.organizationId;
    return this.saftService.validateExport(organizationId, exportId);
  }

  /**
   * Delete export
   */
  @Delete(':exportId')
  @Roles('ADMIN', 'ACCOUNTANT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete export',
    description: 'Deletes a SAF-T export and its associated file',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'Export deleted successfully' })
  @ApiResponse({ status: 404, description: 'Export not found' })
  async deleteExport(
    @Request() req: any,
    @Param('exportId') exportId: string,
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    await this.saftService.deleteExport(organizationId, exportId);
  }
}
