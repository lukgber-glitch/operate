import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ExportSchedulerService } from './export-scheduler.service';
import {
  CreateScheduledExportDto,
  UpdateScheduledExportDto,
  ScheduledExportResponseDto,
  ScheduledExportRunResponseDto,
} from './dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RbacGuard } from '../auth/rbac/rbac.guard';
// import { Roles } from '../auth/rbac/roles.decorator';
// import { OrgId } from '../auth/decorators/org-id.decorator';

/**
 * Export Scheduler Controller
 * REST API endpoints for managing scheduled exports
 */
@ApiTags('Export Scheduler')
@Controller('export-scheduler')
// @UseGuards(JwtAuthGuard, RbacGuard)
// @ApiBearerAuth()
export class ExportSchedulerController {
  constructor(
    private readonly exportSchedulerService: ExportSchedulerService,
  ) {}

  /**
   * Create a new scheduled export
   */
  @Post()
  @ApiOperation({ summary: 'Create a new scheduled export' })
  @ApiResponse({
    status: 201,
    description: 'Scheduled export created successfully',
    type: ScheduledExportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  // @Roles('ADMIN', 'MANAGER')
  async create(
    @Body() dto: CreateScheduledExportDto,
    // @OrgId() orgId: string,
  ): Promise<ScheduledExportResponseDto> {
    // Use orgId from JWT instead of dto in production
    return this.exportSchedulerService.create(dto);
  }

  /**
   * Get all scheduled exports for an organization
   */
  @Get()
  @ApiOperation({ summary: 'Get all scheduled exports' })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of scheduled exports',
    type: [ScheduledExportResponseDto],
  })
  async findAll(
    @Query('orgId') orgId: string,
    // @OrgId() orgId: string,
  ): Promise<ScheduledExportResponseDto[]> {
    return this.exportSchedulerService.findAll(orgId);
  }

  /**
   * Get a single scheduled export
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a scheduled export by ID' })
  @ApiParam({ name: 'id', description: 'Scheduled export ID' })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled export details',
    type: ScheduledExportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Scheduled export not found' })
  async findOne(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    // @OrgId() orgId: string,
  ): Promise<ScheduledExportResponseDto> {
    return this.exportSchedulerService.findOne(id, orgId);
  }

  /**
   * Update a scheduled export
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a scheduled export' })
  @ApiParam({ name: 'id', description: 'Scheduled export ID' })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled export updated successfully',
    type: ScheduledExportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Scheduled export not found' })
  // @Roles('ADMIN', 'MANAGER')
  async update(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() dto: UpdateScheduledExportDto,
    // @OrgId() orgId: string,
  ): Promise<ScheduledExportResponseDto> {
    return this.exportSchedulerService.update(id, orgId, dto);
  }

  /**
   * Delete a scheduled export
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a scheduled export' })
  @ApiParam({ name: 'id', description: 'Scheduled export ID' })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Scheduled export deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Scheduled export not found' })
  // @Roles('ADMIN')
  async remove(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    // @OrgId() orgId: string,
  ): Promise<void> {
    return this.exportSchedulerService.remove(id, orgId);
  }

  /**
   * Get run history for a scheduled export
   */
  @Get(':id/runs')
  @ApiOperation({ summary: 'Get run history for a scheduled export' })
  @ApiParam({ name: 'id', description: 'Scheduled export ID' })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of runs to return',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of export runs',
    type: [ScheduledExportRunResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Scheduled export not found' })
  async getRunHistory(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Query('limit') limit?: number,
    // @OrgId() orgId: string,
  ): Promise<ScheduledExportRunResponseDto[]> {
    return this.exportSchedulerService.getRunHistory(
      id,
      orgId,
      limit ? parseInt(limit.toString(), 10) : undefined,
    );
  }

  /**
   * Execute a scheduled export immediately
   */
  @Post(':id/execute')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Execute a scheduled export immediately' })
  @ApiParam({ name: 'id', description: 'Scheduled export ID' })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
  })
  @ApiResponse({
    status: 202,
    description: 'Export execution queued',
  })
  @ApiResponse({ status: 404, description: 'Scheduled export not found' })
  // @Roles('ADMIN', 'MANAGER')
  async executeNow(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    // @OrgId() orgId: string,
  ): Promise<{ message: string }> {
    await this.exportSchedulerService.executeNow(id, orgId);
    return { message: 'Export execution queued successfully' };
  }
}
