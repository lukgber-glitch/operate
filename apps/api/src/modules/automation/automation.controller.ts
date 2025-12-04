import {
  Controller,
  Get,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { AuditFilterDto } from './dto/automation-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Automation Controller
 * Manages automation settings and audit logs
 */
@ApiTags('Automation')
@Controller('api/v1/automation')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class AutomationController {
  constructor(private automationService: AutomationService) {}

  /**
   * Get all automation settings for organisation
   */
  @Get('settings')
  @RequirePermissions(Permission.SETTINGS_READ)
  @ApiOperation({
    summary: 'Get all automation settings',
    description:
      'Retrieve automation settings for all features (classification, expense, deduction, invoice)',
  })
  @ApiResponse({
    status: 200,
    description: 'Automation settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        classification: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
            mode: { type: 'string', example: 'SEMI_AUTO' },
            confidenceThreshold: { type: 'number', example: 0.9 },
            amountThreshold: { type: 'number', nullable: true, example: null },
          },
        },
        expense: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
            mode: { type: 'string', example: 'SEMI_AUTO' },
            confidenceThreshold: { type: 'number', example: 0.85 },
            amountThreshold: { type: 'number', example: 50000 },
          },
        },
        deduction: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
            mode: { type: 'string', example: 'SEMI_AUTO' },
            confidenceThreshold: { type: 'number', example: 0.95 },
            amountThreshold: { type: 'number', example: 100000 },
          },
        },
        invoice: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
            mode: { type: 'string', example: 'MANUAL' },
            confidenceThreshold: { type: 'number', example: 0.95 },
            amountThreshold: { type: 'number', example: 100000 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getSettings(@CurrentUser() user: any) {
    return this.automationService.getSettings(user.organisationId);
  }

  /**
   * Get automation settings for specific feature
   */
  @Get('settings/:feature')
  @RequirePermissions(Permission.SETTINGS_READ)
  @ApiOperation({
    summary: 'Get feature automation settings',
    description: 'Retrieve automation settings for a specific feature',
  })
  @ApiParam({
    name: 'feature',
    description: 'Automation feature',
    enum: ['classification', 'expense', 'deduction', 'invoice'],
  })
  @ApiResponse({
    status: 200,
    description: 'Feature settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', example: true },
        mode: { type: 'string', example: 'SEMI_AUTO' },
        confidenceThreshold: { type: 'number', example: 0.9 },
        amountThreshold: { type: 'number', nullable: true, example: 50000 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid feature name',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getSettingsByFeature(
    @CurrentUser() user: any,
    @Param('feature') feature: string,
  ) {
    return this.automationService.getSettingsByFeature(
      user.organisationId,
      feature,
    );
  }

  /**
   * Update automation settings for specific feature
   */
  @Patch('settings/:feature')
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({
    summary: 'Update feature automation settings',
    description:
      'Update automation settings for a specific feature (partial update supported)',
  })
  @ApiParam({
    name: 'feature',
    description: 'Automation feature',
    enum: ['classification', 'expense', 'deduction', 'invoice'],
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', example: true },
        mode: { type: 'string', example: 'SEMI_AUTO' },
        confidenceThreshold: { type: 'number', example: 0.9 },
        amountThreshold: { type: 'number', example: 50000 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or feature name',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async updateSettings(
    @CurrentUser() user: any,
    @Param('feature') feature: string,
    @Body() updateAutomationDto: UpdateAutomationDto,
  ) {
    return this.automationService.updateSettings(
      user.organisationId,
      feature,
      updateAutomationDto,
    );
  }

  /**
   * Get automation audit log
   */
  @Get('audit')
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({
    summary: 'Get automation audit log',
    description:
      'Retrieve audit log of automation actions with filtering and pagination',
  })
  @ApiQuery({
    name: 'feature',
    required: false,
    enum: ['classification', 'expense', 'deduction', 'invoice'],
    description: 'Filter by feature',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: [
      'AUTO_APPROVED',
      'MANUAL_REVIEW',
      'AUTO_CLASSIFIED',
      'AUTO_SUGGESTED',
    ],
    description: 'Filter by action type',
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
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              organisationId: { type: 'string' },
              feature: { type: 'string' },
              action: { type: 'string' },
              resourceId: { type: 'string' },
              confidence: { type: 'number', nullable: true },
              amount: { type: 'number', nullable: true },
              metadata: { type: 'object' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 150 },
            totalPages: { type: 'number', example: 8 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getAuditLog(
    @CurrentUser() user: any,
    @Query() filters: AuditFilterDto,
  ) {
    return this.automationService.getAuditLog(user.organisationId, filters);
  }

  /**
   * Test automation rules (dry run)
   */
  @Post('test/:feature')
  @RequirePermissions(Permission.SETTINGS_READ)
  @ApiOperation({
    summary: 'Test automation rules',
    description:
      'Test automation rules for a feature without applying them (dry run)',
  })
  @ApiParam({
    name: 'feature',
    description: 'Automation feature to test',
    enum: ['classification', 'expense', 'deduction', 'invoice'],
  })
  @ApiResponse({
    status: 200,
    description: 'Test results',
    schema: {
      type: 'object',
      properties: {
        settings: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            mode: { type: 'string' },
            confidenceThreshold: { type: 'number' },
            amountThreshold: { type: 'number', nullable: true },
          },
        },
        testData: {
          type: 'object',
          properties: {
            confidence: { type: 'number', example: 0.92 },
            amount: { type: 'number', example: 35000 },
          },
        },
        result: {
          type: 'object',
          properties: {
            shouldAutoApprove: { type: 'boolean', example: true },
            reasons: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'Confidence 0.92 meets threshold 0.85',
                'Amount 35000 within threshold 50000',
                'Semi-auto mode - will be suggested for approval',
              ],
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid feature name or test data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async testAutomationRules(
    @CurrentUser() user: any,
    @Param('feature') feature: string,
    @Body() testData: { confidence: number; amount: number },
  ) {
    return this.automationService.testAutomationRules(
      user.organisationId,
      feature,
      testData,
    );
  }
}
