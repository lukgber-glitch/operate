import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import {
  TimeEntryFiltersDto,
  TimeSummaryDto,
} from './dto/time-entry-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Time Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('time-tracking')
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  // ============================================================================
  // Time Entries Routes
  // ============================================================================

  @Get('entries')
  @ApiOperation({ summary: 'List all time entries' })
  @ApiResponse({ status: 200, description: 'Returns all time entries' })
  findAll(@Req() req: any, @Query() filters: TimeEntryFiltersDto) {
    return this.timeTrackingService.findAllTimeEntries(
      req.user.organisationId,
      filters,
    );
  }

  @Get('entries/:id')
  @ApiOperation({ summary: 'Get a single time entry' })
  @ApiResponse({ status: 200, description: 'Returns the time entry' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.timeTrackingService.findOneTimeEntry(id, req.user.organisationId);
  }

  @Post('entries')
  @ApiOperation({ summary: 'Create a manual time entry' })
  @ApiResponse({
    status: 201,
    description: 'Time entry has been created',
  })
  create(@Body() createTimeEntryDto: CreateTimeEntryDto, @Req() req: any) {
    return this.timeTrackingService.createTimeEntry(
      req.user.organisationId,
      req.user.id,
      createTimeEntryDto,
    );
  }

  @Patch('entries/:id')
  @ApiOperation({ summary: 'Update a time entry' })
  @ApiResponse({ status: 200, description: 'Time entry has been updated' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  update(
    @Param('id') id: string,
    @Body() updateTimeEntryDto: UpdateTimeEntryDto,
    @Req() req: any,
  ) {
    return this.timeTrackingService.updateTimeEntry(
      id,
      req.user.organisationId,
      updateTimeEntryDto,
    );
  }

  @Delete('entries/:id')
  @ApiOperation({ summary: 'Delete a time entry' })
  @ApiResponse({ status: 200, description: 'Time entry has been deleted' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.timeTrackingService.deleteTimeEntry(id, req.user.organisationId);
  }

  @Post('entries/bulk/mark-billable')
  @ApiOperation({ summary: 'Bulk mark time entries as billable' })
  @ApiResponse({ status: 200, description: 'Time entries marked as billable' })
  bulkMarkBillable(@Body('ids') ids: string[], @Req() req: any) {
    return this.timeTrackingService.bulkMarkBillable(ids, req.user.organisationId);
  }

  @Post('entries/bulk/mark-billed')
  @ApiOperation({ summary: 'Bulk mark time entries as billed' })
  @ApiResponse({ status: 200, description: 'Time entries marked as billed' })
  bulkMarkBilled(@Body('ids') ids: string[], @Req() req: any) {
    return this.timeTrackingService.bulkMarkBilled(ids, req.user.organisationId);
  }

  @Get('entries/export')
  @ApiOperation({ summary: 'Export time entries to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file generated' })
  exportEntries(@Req() req: any, @Query() filters: TimeEntryFiltersDto) {
    return this.timeTrackingService.exportTimeEntries(req.user.organisationId, filters);
  }

  // ============================================================================
  // Timer Routes
  // ============================================================================

  @Get('timer')
  @ApiOperation({ summary: 'Get currently running timer' })
  @ApiResponse({ status: 200, description: 'Returns running timer if any' })
  @ApiResponse({ status: 404, description: 'No running timer' })
  getRunningTimer(@Req() req: any) {
    return this.timeTrackingService.getRunningTimer(
      req.user.organisationId,
      req.user.id,
    );
  }

  @Post('timer/start')
  @ApiOperation({ summary: 'Start a timer' })
  @ApiResponse({ status: 201, description: 'Timer has been started' })
  @ApiResponse({ status: 409, description: 'Already have a running timer' })
  startTimer(@Body() startTimerDto: StartTimerDto, @Req() req: any) {
    return this.timeTrackingService.startTimer(
      req.user.organisationId,
      req.user.id,
      startTimerDto,
    );
  }

  @Post('timer/stop')
  @ApiOperation({ summary: 'Stop the running timer' })
  @ApiResponse({ status: 200, description: 'Timer has been stopped' })
  @ApiResponse({ status: 404, description: 'No running timer' })
  stopTimer(@Body() stopTimerDto: any, @Req() req: any) {
    return this.timeTrackingService.stopRunningTimer(
      req.user.organisationId,
      req.user.id,
      stopTimerDto,
    );
  }

  @Patch('timer')
  @ApiOperation({ summary: 'Update the running timer' })
  @ApiResponse({ status: 200, description: 'Timer has been updated' })
  @ApiResponse({ status: 404, description: 'No running timer' })
  updateTimer(@Body() updateTimerDto: any, @Req() req: any) {
    return this.timeTrackingService.updateRunningTimer(
      req.user.organisationId,
      req.user.id,
      updateTimerDto,
    );
  }

  @Delete('timer')
  @ApiOperation({ summary: 'Discard the running timer' })
  @ApiResponse({ status: 200, description: 'Timer has been discarded' })
  @ApiResponse({ status: 404, description: 'No running timer' })
  discardTimer(@Req() req: any) {
    return this.timeTrackingService.discardTimer(
      req.user.organisationId,
      req.user.id,
    );
  }

  // ============================================================================
  // Summary & Stats Routes
  // ============================================================================

  @Get('summary')
  @ApiOperation({ summary: 'Get time tracking summary and statistics' })
  @ApiResponse({ status: 200, description: 'Returns summary statistics' })
  getSummary(@Req() req: any, @Query() filters: TimeSummaryDto) {
    return this.timeTrackingService.getSummary(req.user.organisationId, filters);
  }

  @Get('billable')
  @ApiOperation({ summary: 'Get unbilled billable hours' })
  @ApiResponse({ status: 200, description: 'Returns unbilled billable hours' })
  getBillableHours(@Req() req: any, @Query('clientId') clientId?: string) {
    return this.timeTrackingService.getBillableHours(
      req.user.organisationId,
      clientId,
    );
  }

  // ============================================================================
  // Legacy/Additional Routes
  // ============================================================================

  @Post('generate-invoice')
  @ApiOperation({ summary: 'Generate invoice from time entries' })
  @ApiResponse({
    status: 200,
    description: 'Invoice data generated from time entries',
  })
  generateInvoice(@Body() dto: GenerateInvoiceDto, @Req() req: any) {
    return this.timeTrackingService.generateInvoiceFromTime(
      req.user.organisationId,
      dto.entryIds,
    );
  }
}
