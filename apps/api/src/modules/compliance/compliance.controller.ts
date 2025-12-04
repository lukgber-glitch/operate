import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { Readable } from 'stream';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { CreateExportDto } from './dto/create-export.dto';
import { ExportResponseDto, PaginatedExportResponseDto } from './dto/export-response.dto';
import { ExportFilterDto } from './dto/export-filter.dto';
import {
  ScheduleExportDto,
  UpdateScheduleExportDto,
  ScheduleResponseDto,
} from './dto/schedule-export.dto';
import { ValidationResultDto } from './dto/validation-result.dto';
import { ExportAccessGuard, RetentionPolicyGuard } from './guards/export-access.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Request object with user context
 */
interface AuthenticatedRequest {
  user: {
    userId: string;
    organizationId: string;
  };
}

/**
 * Compliance Controller
 * Handles all compliance export-related API endpoints
 */
@Controller('compliance')
@UseGuards(JwtAuthGuard)
@ApiTags('Compliance')
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /**
   * Create a new compliance export (GoBD or SAF-T)
   */
  @Post('exports')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create compliance export',
    description: 'Create a new GoBD or SAF-T export for the specified date range',
  })
  @ApiResponse({
    status: 201,
    description: 'Export created successfully and queued for processing',
    type: ExportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async createExport(
    @Body() createExportDto: CreateExportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ExportResponseDto> {
    return this.complianceService.createExport(
      createExportDto,
      req.user.userId,
      req.user.organizationId,
    );
  }

  /**
   * List all exports for the organization
   */
  @Get('exports')
  @ApiOperation({
    summary: 'List exports',
    description: 'Get a paginated list of compliance exports with optional filtering',
  })
  @ApiQuery({ name: 'type', required: false, enum: ['gobd', 'saft'] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Exports retrieved successfully',
    type: PaginatedExportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async listExports(
    @Query() filter: ExportFilterDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedExportResponseDto> {
    return this.complianceService.listExports(filter, req.user.organizationId);
  }

  /**
   * Get a specific export by ID
   */
  @Get('exports/:id')
  @UseGuards(ExportAccessGuard)
  @ApiOperation({
    summary: 'Get export details',
    description: 'Retrieve detailed information about a specific export',
  })
  @ApiParam({
    name: 'id',
    description: 'Export ID',
    example: 'exp_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Export details retrieved successfully',
    type: ExportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this export',
  })
  @ApiResponse({
    status: 404,
    description: 'Export not found',
  })
  async getExport(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<ExportResponseDto> {
    return this.complianceService.getExport(id, req.user.organizationId);
  }

  /**
   * Download a completed export
   */
  @Get('exports/:id/download')
  @UseGuards(ExportAccessGuard)
  @ApiOperation({
    summary: 'Download export',
    description: 'Download the ZIP file of a completed export',
  })
  @ApiParam({
    name: 'id',
    description: 'Export ID',
    example: 'exp_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Export file download',
    headers: {
      'Content-Type': {
        description: 'application/zip',
      },
      'Content-Disposition': {
        description: 'attachment; filename="export.zip"',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Export not ready for download or has expired',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this export',
  })
  @ApiResponse({
    status: 404,
    description: 'Export not found',
  })
  @Header('Content-Type', 'application/zip')
  async downloadExport(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<StreamableFile> {
    const stream = await this.complianceService.getExportStream(id, req.user.organizationId);

    return new StreamableFile(Readable.from(stream), {
      type: 'application/zip',
      disposition: `attachment; filename="export-${id}.zip"`,
    });
  }

  /**
   * Delete an export
   */
  @Delete('exports/:id')
  @UseGuards(RolesGuard, RetentionPolicyGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Delete export',
    description: 'Delete an export (subject to retention policy)',
  })
  @ApiParam({
    name: 'id',
    description: 'Export ID',
    example: 'exp_123456789',
  })
  @ApiResponse({
    status: 204,
    description: 'Export deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions or retention policy violation',
  })
  @ApiResponse({
    status: 404,
    description: 'Export not found',
  })
  async deleteExport(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
    await this.complianceService.deleteExport(id, req.user.organizationId);
  }

  /**
   * Validate an export against its schema
   */
  @Post('exports/:id/validate')
  @UseGuards(ExportAccessGuard)
  @ApiOperation({
    summary: 'Validate export',
    description: 'Validate a completed export against GoBD or SAF-T schema',
  })
  @ApiParam({
    name: 'id',
    description: 'Export ID',
    example: 'exp_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed',
    type: ValidationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Export not ready for validation',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this export',
  })
  @ApiResponse({
    status: 404,
    description: 'Export not found',
  })
  async validateExport(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<ValidationResultDto> {
    return this.complianceService.validateExport(id, req.user.organizationId);
  }

  /**
   * Create a scheduled export
   */
  @Post('schedules')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Schedule recurring export',
    description: 'Create a schedule for recurring compliance exports',
  })
  @ApiResponse({
    status: 201,
    description: 'Schedule created successfully',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid schedule configuration',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async createSchedule(
    @Body() scheduleDto: ScheduleExportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ScheduleResponseDto> {
    return this.complianceService.createSchedule(
      scheduleDto,
      req.user.userId,
      req.user.organizationId,
    );
  }

  /**
   * List scheduled exports
   */
  @Get('schedules')
  @ApiOperation({
    summary: 'List scheduled exports',
    description: 'Get all scheduled exports for the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedules retrieved successfully',
    type: [ScheduleResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async listSchedules(@Request() req: AuthenticatedRequest): Promise<ScheduleResponseDto[]> {
    return this.complianceService.listSchedules(req.user.organizationId);
  }

  /**
   * Update a scheduled export
   */
  @Patch('schedules/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update scheduled export',
    description: 'Update configuration of a scheduled export',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
    example: 'sched_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated successfully',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions or access denied',
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule not found',
  })
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateDto: UpdateScheduleExportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ScheduleResponseDto> {
    return this.complianceService.updateSchedule(id, updateDto, req.user.organizationId);
  }

  /**
   * Delete a scheduled export
   */
  @Delete('schedules/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Cancel scheduled export',
    description: 'Delete a scheduled export',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
    example: 'sched_123456789',
  })
  @ApiResponse({
    status: 204,
    description: 'Schedule deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions or access denied',
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule not found',
  })
  async deleteSchedule(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
    await this.complianceService.deleteSchedule(id, req.user.organizationId);
  }
}
