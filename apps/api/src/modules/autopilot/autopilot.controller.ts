import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AutopilotService } from './autopilot.service';
import { UpdateAutopilotConfigDto } from './dto/update-config.dto';
import { ActionQueryDto } from './dto/action-query.dto';
import { RejectActionDto } from './dto/reject-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Autopilot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('autopilot')
export class AutopilotController {
  constructor(private readonly autopilotService: AutopilotService) {}

  // ============================================================================
  // CONFIGURATION ENDPOINTS
  // ============================================================================

  @Get('config')
  @ApiOperation({ summary: 'Get autopilot configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getConfig(@Req() req: any) {
    return this.autopilotService.getConfig(req.organisationId);
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update autopilot configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfig(@Req() req: any, @Body() dto: UpdateAutopilotConfigDto) {
    return this.autopilotService.updateConfig(req.organisationId, dto);
  }

  @Post('enable')
  @ApiOperation({ summary: 'Enable autopilot' })
  @ApiResponse({ status: 200, description: 'Autopilot enabled successfully' })
  async enableAutopilot(@Req() req: any) {
    return this.autopilotService.enableAutopilot(req.organisationId);
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable autopilot' })
  @ApiResponse({ status: 200, description: 'Autopilot disabled successfully' })
  async disableAutopilot(@Req() req: any) {
    return this.autopilotService.disableAutopilot(req.organisationId);
  }

  // ============================================================================
  // ACTION ENDPOINTS
  // ============================================================================

  @Get('actions')
  @ApiOperation({ summary: 'List autopilot actions with filters' })
  @ApiResponse({ status: 200, description: 'Actions retrieved successfully' })
  async listActions(@Req() req: any, @Query() query: ActionQueryDto) {
    return this.autopilotService.listActions(req.organisationId, query);
  }

  @Get('actions/pending')
  @ApiOperation({ summary: 'Get actions pending approval' })
  @ApiResponse({ status: 200, description: 'Pending actions retrieved successfully' })
  async getPendingActions(@Req() req: any) {
    return this.autopilotService.getPendingActions(req.organisationId);
  }

  @Post('actions/:id/approve')
  @ApiOperation({ summary: 'Approve an autopilot action' })
  @ApiResponse({ status: 200, description: 'Action approved successfully' })
  async approveAction(@Req() req: any, @Param('id') actionId: string) {
    return this.autopilotService.approveAction(actionId, req.user.id);
  }

  @Post('actions/:id/reject')
  @ApiOperation({ summary: 'Reject an autopilot action' })
  @ApiResponse({ status: 200, description: 'Action rejected successfully' })
  async rejectAction(
    @Req() req: any,
    @Param('id') actionId: string,
    @Body() dto: RejectActionDto,
  ) {
    return this.autopilotService.rejectAction(actionId, req.user.id, dto.reason);
  }

  // ============================================================================
  // SUMMARY ENDPOINTS
  // ============================================================================

  @Get('summary/today')
  @ApiOperation({ summary: "Get today's autopilot summary" })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getTodaySummary(@Req() req: any) {
    const today = new Date();
    return this.autopilotService.getDailySummary(req.organisationId, today);
  }

  @Get('summary/:date')
  @ApiOperation({ summary: 'Get autopilot summary for a specific date' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getSummaryByDate(@Req() req: any, @Param('date') dateStr: string) {
    const date = new Date(dateStr);
    return this.autopilotService.getDailySummary(req.organisationId, date);
  }

  @Get('summary/weekly')
  @ApiOperation({ summary: 'Get weekly autopilot summary' })
  @ApiResponse({ status: 200, description: 'Weekly summary retrieved successfully' })
  async getWeeklySummary(@Req() req: any) {
    return this.autopilotService.getWeeklySummary(req.organisationId);
  }

  // ============================================================================
  // STATS ENDPOINTS
  // ============================================================================

  @Get('stats')
  @ApiOperation({ summary: 'Get autopilot dashboard stats' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  async getStats(@Req() req: any) {
    return this.autopilotService.getStats(req.organisationId);
  }
}
