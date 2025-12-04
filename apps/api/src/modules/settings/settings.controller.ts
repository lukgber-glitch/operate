import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions';

/**
 * Settings Controller
 * Handles organisation settings operations
 */
@ApiTags('Settings')
@Controller('organisations/:orgId/settings')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  /**
   * Get all settings for organisation
   */
  @Get()
  @RequirePermissions(Permission.SETTINGS_READ)
  @ApiOperation({
    summary: 'Get all settings',
    description: 'Retrieve all organisation settings (profile, tax, invoice, notifications, integrations)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Acme Corporation GmbH' },
            country: { type: 'string', example: 'DE' },
            timezone: { type: 'string', example: 'Europe/Berlin' },
            currency: { type: 'string', example: 'EUR' },
          },
        },
        tax: {
          type: 'object',
          properties: {
            vatId: { type: 'string', example: 'DE123456789' },
            taxNumber: { type: 'string', example: '12/345/67890' },
            taxOfficeCode: { type: 'string', example: '2893' },
            fiscalYearStart: { type: 'string', example: '01-01' },
          },
        },
        invoice: {
          type: 'object',
          properties: {
            invoicePrefix: { type: 'string', example: 'INV' },
            nextInvoiceNumber: { type: 'number', example: 1001 },
            footerText: { type: 'string', example: 'Thank you for your business!' },
            defaultPaymentTerms: { type: 'number', example: 30 },
            defaultVatRate: { type: 'number', example: 19 },
            enableLateFees: { type: 'boolean', example: true },
          },
        },
        notifications: {
          type: 'object',
          properties: {
            emailExpenseNotifications: { type: 'boolean', example: true },
            emailApprovalNotifications: { type: 'boolean', example: true },
            emailInvoiceNotifications: { type: 'boolean', example: true },
            emailPayrollNotifications: { type: 'boolean', example: false },
            emailWeeklyDigest: { type: 'boolean', example: true },
            inAppNotifications: { type: 'boolean', example: true },
          },
        },
        integrations: {
          type: 'object',
          properties: {
            elsterEnabled: { type: 'boolean', example: true },
            viesEnabled: { type: 'boolean', example: true },
            bankSyncEnabled: { type: 'boolean', example: false },
            aiClassificationEnabled: { type: 'boolean', example: true },
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
  @ApiResponse({
    status: 404,
    description: 'Organisation not found',
  })
  async getSettings(@Param('orgId') orgId: string) {
    return this.settingsService.getSettings(orgId);
  }

  /**
   * Update all settings
   */
  @Patch()
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({
    summary: 'Update settings',
    description: 'Update organisation settings (partial update supported)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Organisation not found',
  })
  async updateSettings(
    @Param('orgId') orgId: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(orgId, updateSettingsDto);
  }

  /**
   * Get specific category settings
   */
  @Get(':category')
  @RequirePermissions(Permission.SETTINGS_READ)
  @ApiOperation({
    summary: 'Get category settings',
    description: 'Retrieve settings for a specific category (profile, tax, invoice, notifications, integrations)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'category',
    description: 'Settings category',
    type: 'string',
    enum: ['profile', 'tax', 'invoice', 'notifications', 'integrations'],
  })
  @ApiResponse({
    status: 200,
    description: 'Category settings retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Organisation or category not found',
  })
  async getCategorySettings(
    @Param('orgId') orgId: string,
    @Param('category') category: string,
  ) {
    return this.settingsService.getCategorySettings(orgId, category);
  }

  /**
   * Update specific category settings
   */
  @Patch(':category')
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({
    summary: 'Update category settings',
    description: 'Update settings for a specific category',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'category',
    description: 'Settings category',
    type: 'string',
    enum: ['profile', 'tax', 'invoice', 'notifications', 'integrations'],
  })
  @ApiResponse({
    status: 200,
    description: 'Category settings updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Organisation or category not found',
  })
  async updateCategorySettings(
    @Param('orgId') orgId: string,
    @Param('category') category: string,
    @Body() data: Record<string, any>,
  ) {
    return this.settingsService.updateCategorySettings(orgId, category, data);
  }
}
