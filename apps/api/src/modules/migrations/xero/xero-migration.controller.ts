/**
 * Xero Migration Controller
 * REST API endpoints for Xero migration wizard
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { XeroMigrationService } from './xero-migration.service';
import { XeroAuthService } from '../../integrations/xero/xero-auth.service';
import {
  StartMigrationDto,
  MigrationStatusDto,
  ListOrganizationsDto,
  PauseMigrationDto,
  ResumeMigrationDto,
  XeroOrganizationDto,
  ListMigrationsDto,
} from './xero-migration.dto';
import { XeroDataFetcherService } from './xero-data-fetcher.service';

@ApiTags('migrations/xero')
@Controller('migrations/xero')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class XeroMigrationController {
  constructor(
    private readonly migrationService: XeroMigrationService,
    private readonly xeroAuthService: XeroAuthService,
    private readonly dataFetcher: XeroDataFetcherService,
  ) {}

  /**
   * List connected Xero organizations
   */
  @Get('organizations')
  @ApiOperation({
    summary: 'List connected Xero organizations',
    description:
      'Returns all Xero organizations connected to the user\'s account',
  })
  @ApiResponse({
    status: 200,
    description: 'List of connected organizations',
    type: ListOrganizationsDto,
  })
  async listOrganizations(@Request() req): Promise<ListOrganizationsDto> {
    const orgId = req.user.orgId;

    // Get all connections
    const connections = await this.xeroAuthService.getConnections(orgId);

    if (connections.length === 0) {
      return {
        organizations: [],
        connectionStatus: 'DISCONNECTED',
        connectedAt: new Date(),
      };
    }

    // Get organization details for each connection
    const organizations: XeroOrganizationDto[] = [];

    for (const connection of connections) {
      try {
        const orgDetails = await this.dataFetcher.fetchOrganization(
          orgId,
          connection.xeroTenantId,
        );

        organizations.push({
          id: orgDetails.OrganisationID,
          tenantId: connection.xeroTenantId,
          name: orgDetails.Name,
          type: orgDetails.OrganisationType || 'COMPANY',
          countryCode: orgDetails.CountryCode,
          baseCurrency: orgDetails.BaseCurrency,
          isDemoCompany: orgDetails.IsDemoCompany,
          taxNumber: orgDetails.TaxNumber,
          registrationNumber: orgDetails.RegistrationNumber,
          createdDate: orgDetails.CreatedDateUTC,
          updatedDate: orgDetails.CreatedDateUTC,
        });
      } catch (error) {
        // Log error but continue with other organizations
        console.error(
          `Failed to fetch details for tenant ${connection.xeroTenantId}:`,
          error.message,
        );
      }
    }

    return {
      organizations,
      connectionStatus: connections[0].status,
      connectedAt: connections[0].connectedAt,
      lastSyncAt: connections[0].lastSyncAt || undefined,
    };
  }

  /**
   * Start a new migration
   */
  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start Xero migration',
    description:
      'Initiates a full data migration from Xero to Operate. ' +
      'Returns immediately with a migration ID. Use the status endpoint to track progress.',
  })
  @ApiResponse({
    status: 202,
    description: 'Migration started',
    schema: {
      type: 'object',
      properties: {
        migrationId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid configuration or Xero not connected',
  })
  async startMigration(
    @Request() req,
    @Body() dto: StartMigrationDto,
  ): Promise<{ migrationId: string; message: string }> {
    const orgId = req.user.orgId;

    // Verify Xero connection
    const connection = await this.xeroAuthService.getConnectionStatus(
      orgId,
      dto.xeroTenantId,
    );

    if (!connection || !connection.isConnected) {
      throw new Error(
        'Xero not connected. Please connect to Xero first.',
      );
    }

    // Start migration
    const migrationId = await this.migrationService.startMigration({
      xeroTenantId: dto.xeroTenantId,
      orgId,
      entityMappings: dto.entityMappings,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      batchSize: dto.batchSize || 100,
      parallelRequests: dto.parallelRequests || 3,
    });

    return {
      migrationId,
      message:
        'Migration started. Use the status endpoint to track progress.',
    };
  }

  /**
   * Get migration status
   */
  @Get('status/:migrationId')
  @ApiOperation({
    summary: 'Get migration status',
    description:
      'Returns detailed status and progress information for a migration',
  })
  @ApiParam({
    name: 'migrationId',
    description: 'Migration ID returned from start endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration status',
    type: MigrationStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Migration not found',
  })
  async getMigrationStatus(
    @Param('migrationId') migrationId: string,
  ): Promise<MigrationStatusDto> {
    const progress = await this.migrationService.getMigrationStatus(
      migrationId,
    );

    return {
      migrationId: progress.migrationId,
      status: progress.status,
      overallProgress: progress.overallProgress,
      startedAt: progress.startedAt,
      estimatedCompletionAt: progress.estimatedCompletionAt,
      completedAt: progress.completedAt,
      totalEntitiesProcessed: progress.totalEntitiesProcessed,
      totalEntitiesSucceeded: progress.totalEntitiesSucceeded,
      totalEntitiesFailed: progress.totalEntitiesFailed,
      totalEntitiesSkipped: progress.totalEntitiesSkipped,
      entityProgress: progress.entityProgress,
      errors: progress.errors,
      warnings: progress.warnings,
      metadata: progress.metadata,
    };
  }

  /**
   * Pause a running migration
   */
  @Post('pause/:migrationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pause migration',
    description:
      'Pauses a running migration. The migration can be resumed later.',
  })
  @ApiParam({
    name: 'migrationId',
    description: 'Migration ID to pause',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration paused',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Migration not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot pause migration in current status',
  })
  async pauseMigration(
    @Param('migrationId') migrationId: string,
  ): Promise<{ message: string }> {
    await this.migrationService.pauseMigration(migrationId);

    return {
      message: `Migration ${migrationId} paused. Use resume endpoint to continue.`,
    };
  }

  /**
   * Resume a paused migration
   */
  @Post('resume/:migrationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resume migration',
    description: 'Resumes a paused migration from where it left off.',
  })
  @ApiParam({
    name: 'migrationId',
    description: 'Migration ID to resume',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration resumed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Migration not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot resume migration in current status',
  })
  async resumeMigration(
    @Param('migrationId') migrationId: string,
  ): Promise<{ message: string }> {
    await this.migrationService.resumeMigration(migrationId);

    return {
      message: `Migration ${migrationId} resumed.`,
    };
  }

  /**
   * List all migrations for the organization
   */
  @Get('list')
  @ApiOperation({
    summary: 'List migrations',
    description:
      'Returns a list of all migrations for the current organization',
  })
  @ApiResponse({
    status: 200,
    description: 'List of migrations',
    type: ListMigrationsDto,
  })
  async listMigrations(@Request() req): Promise<any> {
    const orgId = req.user.orgId;

    const migrations = await this.migrationService.listMigrations(orgId);

    return {
      migrations,
      total: migrations.length,
      page: 1,
      pageSize: 50,
    };
  }
}
