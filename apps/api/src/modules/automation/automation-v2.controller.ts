import {
  Controller,
  Get,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';
import { AutomationSettingsService } from './automation-settings.service';
import { AutoApproveService } from './auto-approve.service';
import {
  UpdateAutomationSettingsDto,
  AutomationSettingsResponseDto,
  UpdateFeatureModeDto,
  FeatureModeDto,
} from './dto/automation-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Automation Controller V2
 * New implementation using updated schema and services
 */
@ApiTags('Automation V2')
@Controller('api/v2/organisations/:orgId/automation')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class AutomationV2Controller {
  constructor(
    private automationSettings: AutomationSettingsService,
    private autoApprove: AutoApproveService,
  ) {}

  /**
   * Get all automation settings for organisation
   */
  @Get('settings')
  @RequirePermissions(Permission.SETTINGS_READ)
  @ApiOperation({
    summary: 'Get all automation settings',
    description: 'Retrieve complete automation settings for the organisation',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Automation settings retrieved successfully',
    type: AutomationSettingsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async getSettings(
    @Param('orgId') orgId: string,
    @CurrentUser() user: any,
  ): Promise<AutomationSettingsResponseDto> {
    // Verify user has access to this organisation
    if (user.organisationId !== orgId) {
      throw new Error('Access denied to this organisation');
    }

    return this.automationSettings.getSettings(orgId);
  }

  /**
   * Update automation settings
   */
  @Patch('settings')
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({
    summary: 'Update automation settings',
    description: 'Update automation settings (partial update supported)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    type: AutomationSettingsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async updateSettings(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateAutomationSettingsDto,
    @CurrentUser() user: any,
  ): Promise<AutomationSettingsResponseDto> {
    // Verify user has access to this organisation
    if (user.organisationId !== orgId) {
      throw new Error('Access denied to this organisation');
    }

    return this.automationSettings.updateSettings(orgId, dto);
  }

  /**
   * Get automation mode for specific feature
   */
  @Get('settings/features/:feature')
  @RequirePermissions(Permission.SETTINGS_READ)
  @ApiOperation({
    summary: 'Get feature automation mode',
    description: 'Get automation mode and threshold for a specific feature',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'feature',
    description: 'Feature name',
    enum: ['invoices', 'expenses', 'tax', 'bankReconciliation'],
  })
  @ApiResponse({
    status: 200,
    description: 'Feature mode retrieved successfully',
    type: FeatureModeDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid feature name' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async getFeatureMode(
    @Param('orgId') orgId: string,
    @Param('feature') feature: string,
    @CurrentUser() user: any,
  ): Promise<FeatureModeDto> {
    // Verify user has access to this organisation
    if (user.organisationId !== orgId) {
      throw new Error('Access denied to this organisation');
    }

    return this.automationSettings.getFeatureMode(
      orgId,
      feature as 'invoices' | 'expenses' | 'tax' | 'bankReconciliation',
    );
  }

  /**
   * Update automation mode for specific feature
   */
  @Patch('settings/features/:feature')
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({
    summary: 'Update feature automation mode',
    description: 'Update automation mode and/or threshold for a specific feature',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'feature',
    description: 'Feature name',
    enum: ['invoices', 'expenses', 'tax', 'bankReconciliation'],
  })
  @ApiResponse({
    status: 200,
    description: 'Feature mode updated successfully',
    type: FeatureModeDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid feature name or input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async updateFeatureMode(
    @Param('orgId') orgId: string,
    @Param('feature') feature: string,
    @Body() dto: UpdateFeatureModeDto,
    @CurrentUser() user: any,
  ): Promise<FeatureModeDto> {
    // Verify user has access to this organisation
    if (user.organisationId !== orgId) {
      throw new Error('Access denied to this organisation');
    }

    return this.automationSettings.updateFeatureMode(
      orgId,
      feature as 'invoices' | 'expenses' | 'tax' | 'bankReconciliation',
      dto,
    );
  }

  /**
   * Get automation statistics
   */
  @Get('stats')
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({
    summary: 'Get automation statistics',
    description: 'Get statistics on auto-approvals vs manual reviews',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'feature',
    required: false,
    enum: ['invoices', 'expenses', 'tax', 'bankReconciliation'],
    description: 'Filter by feature',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalActions: { type: 'number', example: 150 },
        autoApproved: { type: 'number', example: 120 },
        suggested: { type: 'number', example: 30 },
        autoApprovalRate: { type: 'number', example: 80.0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getStats(
    @Param('orgId') orgId: string,
    @Query('feature') feature?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    // Verify user has access to this organisation
    if (user.organisationId !== orgId) {
      throw new Error('Access denied to this organisation');
    }

    return this.autoApprove.getAutomationStats(
      orgId,
      feature,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get recent automation actions
   */
  @Get('recent-actions')
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({
    summary: 'Get recent automation actions',
    description: 'Get recent automation actions for audit purposes',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of actions to return (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'feature',
    required: false,
    enum: ['invoices', 'expenses', 'tax', 'bankReconciliation'],
    description: 'Filter by feature',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent actions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          action: { type: 'string' },
          feature: { type: 'string' },
          mode: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          confidenceScore: { type: 'number', nullable: true },
          wasAutoApproved: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getRecentActions(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: number,
    @Query('feature') feature?: string,
    @CurrentUser() user?: any,
  ) {
    // Verify user has access to this organisation
    if (user.organisationId !== orgId) {
      throw new Error('Access denied to this organisation');
    }

    const actionLimit = Math.min(limit || 10, 100);
    return this.autoApprove.getRecentActions(orgId, actionLimit, feature);
  }
}
