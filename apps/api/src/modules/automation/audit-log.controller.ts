import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AutomationAuditLogService } from './audit-log.service';
import {
  AuditLogQueryDto,
  PaginatedAuditLogDto,
  AutomationStatsDto,
  ExportAuditLogsDto,
  EntityAuditTrailDto,
} from './dto/audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

/**
 * Automation Audit Log Controller
 * Provides secure access to automation audit logs
 * Admin-only for full access, users can see their own actions
 */
@ApiTags('Automation Audit')
@Controller('api/v1/organisations/:orgId/automation/audit-logs')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class AutomationAuditLogController {
  constructor(
    private readonly auditLogService: AutomationAuditLogService,
  ) {}

  /**
   * Get paginated and filtered audit logs
   * Admins can see all logs, users only see their own actions
   */
  @Get()
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({
    summary: 'Get automation audit logs',
    description:
      'Retrieve paginated and filtered automation audit logs. Admins can see all logs, regular users only see their own actions.',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    example: 'org_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: PaginatedAuditLogDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @HttpCode(HttpStatus.OK)
  async getAuditLogs(
    @Param('orgId') orgId: string,
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedAuditLogDto> {
    // Check if user is admin
    const isAdmin = user.permissions?.includes(Permission.AUDIT_READ);

    // If not admin, force filter to only their actions
    const queryParams = {
      ...query,
      organisationId: orgId,
      ...((!isAdmin && user.id) && { userId: user.id }),
    };

    return this.auditLogService.getAuditLogs(queryParams);
  }

  /**
   * Get automation statistics for dashboard
   * Admin-only endpoint for analytics
   */
  @Get('stats')
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({
    summary: 'Get automation statistics',
    description:
      'Retrieve automation statistics including approval rates, confidence scores, and breakdown by feature.',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    example: 'org_123456789',
  })
  @ApiQuery({
    name: 'period',
    enum: ['day', 'week', 'month'],
    description: 'Time period for statistics',
    example: 'week',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics calculated successfully',
    type: AutomationStatsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  @HttpCode(HttpStatus.OK)
  async getAutomationStats(
    @Param('orgId') orgId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ): Promise<AutomationStatsDto> {
    return this.auditLogService.getAutomationStats(orgId, period);
  }

  /**
   * Export audit logs for compliance
   * Admin-only, rate-limited endpoint
   */
  @Get('export')
  @RequirePermissions(Permission.AUDIT_EXPORT)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Export audit logs',
    description:
      'Export audit logs in JSON or CSV format for compliance and reporting. Rate-limited to 5 requests per minute. Maximum date range: 1 year.',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    example: 'org_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs exported successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: { type: 'array' },
          },
        },
      },
      'text/csv': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @HttpCode(HttpStatus.OK)
  async exportAuditLogs(
    @Param('orgId') orgId: string,
    @Query() exportDto: ExportAuditLogsDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const exportResult = await this.auditLogService.exportAuditLogs({
      ...exportDto,
      organisationId: orgId,
    });

    // Set response headers
    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportResult.filename}"`,
    );

    if (exportResult.contentType === 'text/csv') {
      return exportResult.content;
    }

    // For JSON, parse and return as object
    return JSON.parse(exportResult.content as string);
  }

  /**
   * Get complete audit trail for a specific entity
   * Shows all automation actions performed on an entity
   */
  @Get('entity/:entityType/:entityId')
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({
    summary: 'Get entity audit trail',
    description:
      'Retrieve complete audit trail for a specific entity, showing all automation actions performed on it.',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    example: 'org_123456789',
  })
  @ApiParam({
    name: 'entityType',
    description: 'Type of entity (e.g., Invoice, Expense)',
    example: 'Invoice',
  })
  @ApiParam({
    name: 'entityId',
    description: 'Entity ID',
    example: 'inv_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Entity audit trail retrieved successfully',
    type: EntityAuditTrailDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @HttpCode(HttpStatus.OK)
  async getEntityAuditTrail(
    @Param('orgId') orgId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<EntityAuditTrailDto> {
    const auditTrail = await this.auditLogService.getEntityAuditTrail(
      orgId,
      entityType,
      entityId,
    );

    return {
      entityType,
      entityId,
      auditTrail,
      totalEntries: auditTrail.length,
    };
  }

  /**
   * Get audit logs for current user
   * Shows only actions performed by the authenticated user
   */
  @Get('my-actions')
  @ApiOperation({
    summary: 'Get my automation actions',
    description:
      'Retrieve audit logs for actions performed by the authenticated user.',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    example: 'org_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'User audit logs retrieved successfully',
    type: PaginatedAuditLogDto,
  })
  @HttpCode(HttpStatus.OK)
  async getMyActions(
    @Param('orgId') orgId: string,
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedAuditLogDto> {
    // Always filter to current user's actions
    return this.auditLogService.getAuditLogs({
      ...query,
      organisationId: orgId,
      userId: user.id,
    });
  }
}
