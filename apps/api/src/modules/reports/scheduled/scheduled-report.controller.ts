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
import { ScheduledReportService } from './scheduled-report.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleResponseDto,
  ScheduleListResponseDto,
  ScheduleHistoryResponseDto,
  HistoryQueryDto,
} from './dto';

/**
 * Scheduled Report Controller
 *
 * Handles CRUD operations and management of scheduled reports.
 *
 * Endpoints:
 * - POST /reports/scheduled - Create a new scheduled report
 * - GET /reports/scheduled - List all scheduled reports for organization
 * - GET /reports/scheduled/:id - Get specific schedule details
 * - PUT /reports/scheduled/:id - Update schedule configuration
 * - DELETE /reports/scheduled/:id - Delete a schedule
 * - POST /reports/scheduled/:id/pause - Pause report generation
 * - POST /reports/scheduled/:id/resume - Resume paused schedule
 * - POST /reports/scheduled/:id/execute - Manually trigger report generation
 * - GET /reports/scheduled/:id/history - Get execution history
 * - POST /reports/scheduled/:id/retry - Retry failed delivery
 */
@ApiTags('Scheduled Reports')
@ApiBearerAuth()
@Controller('reports/scheduled')
// @UseGuards(JwtAuthGuard, RolesGuard) // Uncomment when auth is ready
export class ScheduledReportController {
  private readonly logger = new Logger(ScheduledReportController.name);

  constructor(
    private readonly scheduledReportService: ScheduledReportService,
  ) {}

  /**
   * Create a new scheduled report
   */
  @Post()
  @ApiOperation({
    summary: 'Create scheduled report',
    description:
      'Create a new scheduled report with automatic generation and delivery',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Schedule created successfully',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid schedule configuration',
  })
  async createSchedule(
    @Body() dto: CreateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    this.logger.log(`Creating scheduled report: ${dto.name}`);
    return this.scheduledReportService.createSchedule(dto);
  }

  /**
   * List all schedules for an organization
   */
  @Get()
  @ApiOperation({
    summary: 'List scheduled reports',
    description: 'Get all scheduled reports for an organization',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
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
    description: 'Page size (default: 20)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedules retrieved successfully',
    type: ScheduleListResponseDto,
  })
  async getSchedules(
    @Query('orgId') orgId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<ScheduleListResponseDto> {
    this.logger.log(`Fetching schedules for org: ${orgId}`);
    return this.scheduledReportService.getSchedules(
      orgId,
      page || 1,
      pageSize || 20,
    );
  }

  /**
   * Get schedule by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get schedule details',
    description: 'Get detailed information about a specific schedule',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule details',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  async getSchedule(@Param('id') id: string): Promise<ScheduleResponseDto> {
    this.logger.log(`Fetching schedule: ${id}`);
    return this.scheduledReportService.getSchedule(id);
  }

  /**
   * Update schedule
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update schedule',
    description: 'Update schedule configuration',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule updated successfully',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data',
  })
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    this.logger.log(`Updating schedule: ${id}`);
    return this.scheduledReportService.updateSchedule(id, dto);
  }

  /**
   * Delete schedule
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete schedule',
    description: 'Permanently delete a scheduled report',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Schedule deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  async deleteSchedule(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting schedule: ${id}`);
    return this.scheduledReportService.deleteSchedule(id);
  }

  /**
   * Pause schedule
   */
  @Post(':id/pause')
  @ApiOperation({
    summary: 'Pause schedule',
    description: 'Temporarily pause report generation',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule paused successfully',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Schedule is already paused',
  })
  async pauseSchedule(@Param('id') id: string): Promise<ScheduleResponseDto> {
    this.logger.log(`Pausing schedule: ${id}`);
    return this.scheduledReportService.pauseSchedule(id);
  }

  /**
   * Resume schedule
   */
  @Post(':id/resume')
  @ApiOperation({
    summary: 'Resume schedule',
    description: 'Resume a paused schedule',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule resumed successfully',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Schedule is already active',
  })
  async resumeSchedule(@Param('id') id: string): Promise<ScheduleResponseDto> {
    this.logger.log(`Resuming schedule: ${id}`);
    return this.scheduledReportService.resumeSchedule(id);
  }

  /**
   * Execute schedule manually
   */
  @Post(':id/execute')
  @ApiOperation({
    summary: 'Execute schedule manually',
    description: 'Trigger immediate report generation (does not affect schedule)',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report execution started',
    schema: {
      properties: {
        success: { type: 'boolean' },
        executionId: { type: 'string' },
        reportId: { type: 'string' },
        deliveryStatus: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  async executeSchedule(@Param('id') id: string) {
    this.logger.log(`Manually executing schedule: ${id}`);
    return this.scheduledReportService.executeScheduledReport(id, true);
  }

  /**
   * Get execution history
   */
  @Get(':id/history')
  @ApiOperation({
    summary: 'Get execution history',
    description: 'Get execution history and statistics for a schedule',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by execution status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Page size',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter from date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter to date',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Execution history',
    type: ScheduleHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  async getHistory(
    @Param('id') id: string,
    @Query() query: HistoryQueryDto,
  ): Promise<ScheduleHistoryResponseDto> {
    this.logger.log(`Fetching history for schedule: ${id}`);
    return this.scheduledReportService.getScheduleHistory(id, query);
  }

  /**
   * Retry failed delivery
   */
  @Post(':id/retry')
  @ApiOperation({
    summary: 'Retry failed delivery',
    description: 'Retry delivery for a failed execution',
  })
  @ApiParam({
    name: 'id',
    description: 'Execution ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retry initiated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Execution not found',
  })
  async retryDelivery(@Param('id') executionId: string): Promise<void> {
    this.logger.log(`Retrying delivery for execution: ${executionId}`);
    return this.scheduledReportService.retryFailedDelivery(executionId);
  }
}
