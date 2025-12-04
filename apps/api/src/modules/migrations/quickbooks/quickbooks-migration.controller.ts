/**
 * QuickBooks Migration Controller
 * REST API endpoints for QuickBooks migration wizard
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QuickBooksMigrationService } from './quickbooks-migration.service';
import {
  StartMigrationDto,
  StartMigrationResponseDto,
  MigrationStatusResponseDto,
  PauseMigrationResponseDto,
  ResumeMigrationResponseDto,
  RollbackMigrationResponseDto,
  ListMigrationsQueryDto,
  MigrationListItemDto,
} from './quickbooks-migration.dto';
import { MigrationStatus } from './quickbooks-migration.types';

@ApiTags('QuickBooks Migration')
@ApiBearerAuth()
@Controller('migrations/quickbooks')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class QuickBooksMigrationController {
  constructor(private readonly migrationService: QuickBooksMigrationService) {}

  /**
   * Start a new migration
   */
  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start QuickBooks migration',
    description: 'Initiates a full data migration from QuickBooks Online to Operate',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Migration started successfully',
    type: StartMigrationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Another migration is already in progress',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid configuration or QuickBooks connection error',
  })
  async startMigration(
    @Request() req: any,
    @Body() dto: StartMigrationDto,
  ): Promise<StartMigrationResponseDto> {
    // TODO: Extract from JWT token
    const orgId = req.user?.orgId || 'test-org-id';
    const userId = req.user?.userId || 'test-user-id';

    const result = await this.migrationService.startMigration(orgId, userId, dto);

    return {
      migrationId: result.migrationId,
      status: result.status,
      config: {
        entities: dto.entities,
        conflictResolution: dto.conflictResolution,
        batchSize: dto.batchSize,
        rateLimitDelay: dto.rateLimitDelay,
        includeInactive: dto.includeInactive,
        dateRangeStart: dto.dateRangeStart ? new Date(dto.dateRangeStart) : undefined,
        dateRangeEnd: dto.dateRangeEnd ? new Date(dto.dateRangeEnd) : undefined,
        fieldMappings: dto.fieldMappings,
      },
      startedAt: new Date(),
      message: 'Migration started successfully',
    };
  }

  /**
   * Get migration status
   */
  @Get('status/:migrationId')
  @ApiOperation({
    summary: 'Get migration status',
    description: 'Retrieve detailed status and progress of a migration',
  })
  @ApiParam({
    name: 'migrationId',
    description: 'Migration ID',
    example: 'cm123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Migration status retrieved successfully',
    type: MigrationStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Migration not found',
  })
  async getMigrationStatus(
    @Param('migrationId') migrationId: string,
  ): Promise<MigrationStatusResponseDto> {
    const state = await this.migrationService.getMigrationStatus(migrationId);

    // Calculate percent complete
    const percentComplete =
      state.totalItems > 0 ? (state.processedItems / state.totalItems) * 100 : 0;

    // Calculate estimated time remaining
    let estimatedTimeRemaining: number | undefined;
    if (state.startedAt && percentComplete > 0 && percentComplete < 100) {
      const elapsed = Date.now() - state.startedAt.getTime();
      estimatedTimeRemaining = (elapsed / percentComplete) * (100 - percentComplete);
    }

    return {
      id: state.id,
      orgId: state.orgId,
      status: state.status,
      config: state.config,
      progress: state.progress,
      totalItems: state.totalItems,
      processedItems: state.processedItems,
      successfulItems: state.successfulItems,
      failedItems: state.failedItems,
      skippedItems: state.skippedItems,
      currentEntity: state.currentEntity,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      pausedAt: state.pausedAt,
      estimatedCompletionTime: estimatedTimeRemaining
        ? new Date(Date.now() + estimatedTimeRemaining)
        : undefined,
      createdBy: state.createdBy,
      percentComplete,
      estimatedTimeRemaining,
    };
  }

  /**
   * Pause migration
   */
  @Post('pause/:migrationId')
  @ApiOperation({
    summary: 'Pause migration',
    description: 'Pause an in-progress migration. Can be resumed later.',
  })
  @ApiParam({
    name: 'migrationId',
    description: 'Migration ID',
    example: 'cm123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Migration paused successfully',
    type: PauseMigrationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Migration cannot be paused in current state',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Migration not found',
  })
  async pauseMigration(
    @Param('migrationId') migrationId: string,
  ): Promise<PauseMigrationResponseDto> {
    await this.migrationService.pauseMigration(migrationId);

    return {
      migrationId,
      status: MigrationStatus.PAUSED,
      pausedAt: new Date(),
      message: 'Migration paused successfully',
    };
  }

  /**
   * Resume migration
   */
  @Post('resume/:migrationId')
  @ApiOperation({
    summary: 'Resume migration',
    description: 'Resume a paused migration from where it left off',
  })
  @ApiParam({
    name: 'migrationId',
    description: 'Migration ID',
    example: 'cm123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Migration resumed successfully',
    type: ResumeMigrationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Migration cannot be resumed in current state',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Migration not found',
  })
  async resumeMigration(
    @Param('migrationId') migrationId: string,
  ): Promise<ResumeMigrationResponseDto> {
    await this.migrationService.resumeMigration(migrationId);

    return {
      migrationId,
      status: MigrationStatus.IN_PROGRESS,
      resumedAt: new Date(),
      message: 'Migration resumed successfully',
    };
  }

  /**
   * Rollback migration
   */
  @Post('rollback/:migrationId')
  @ApiOperation({
    summary: 'Rollback migration',
    description: 'Rollback a migration by deleting all created entities and mappings',
  })
  @ApiParam({
    name: 'migrationId',
    description: 'Migration ID',
    example: 'cm123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Migration rolled back successfully',
    type: RollbackMigrationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Migration not found',
  })
  async rollbackMigration(
    @Param('migrationId') migrationId: string,
  ): Promise<RollbackMigrationResponseDto> {
    const result = await this.migrationService.rollbackMigration(migrationId);

    return {
      migrationId,
      status: MigrationStatus.ROLLED_BACK,
      rolledBackAt: new Date(),
      entitiesRolledBack: result.entitiesRolledBack,
      message: 'Migration rolled back successfully',
    };
  }

  /**
   * List migrations
   */
  @Get('list')
  @ApiOperation({
    summary: 'List migrations',
    description: 'Get a paginated list of migrations for the organization',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Migrations retrieved successfully',
    type: [MigrationListItemDto],
  })
  async listMigrations(
    @Request() req: any,
    @Query() query: ListMigrationsQueryDto,
  ): Promise<MigrationListItemDto[]> {
    // TODO: Extract from JWT
    const orgId = req.user?.orgId || 'test-org-id';

    const migrations = await this.migrationService.listMigrations(
      orgId,
      query.status,
      query.limit,
      query.offset,
    );

    return migrations.map((m) => ({
      id: m.id,
      status: m.status as MigrationStatus,
      entities: (m.config as any).entities,
      percentComplete:
        m.totalItems > 0 ? (m.processedItems / m.totalItems) * 100 : 0,
      totalItems: m.totalItems,
      successfulItems: m.successfulItems,
      failedItems: m.failedItems,
      startedAt: m.startedAt,
      completedAt: m.completedAt,
      createdBy: m.createdBy,
    }));
  }

  /**
   * Get migration errors
   */
  @Get('errors/:migrationId')
  @ApiOperation({
    summary: 'Get migration errors',
    description: 'Retrieve all errors that occurred during a migration',
  })
  @ApiParam({
    name: 'migrationId',
    description: 'Migration ID',
    example: 'cm123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Migration errors retrieved successfully',
  })
  async getMigrationErrors(@Param('migrationId') migrationId: string) {
    return this.migrationService.getMigrationErrors(migrationId);
  }

  /**
   * Delete migration record
   */
  @Post('delete/:migrationId')
  @ApiOperation({
    summary: 'Delete migration record',
    description: 'Delete a migration record (does not rollback, only removes the record)',
  })
  @ApiParam({
    name: 'migrationId',
    description: 'Migration ID',
    example: 'cm123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Migration record deleted successfully',
  })
  async deleteMigration(@Param('migrationId') migrationId: string) {
    await this.migrationService.deleteMigration(migrationId);

    return {
      success: true,
      message: 'Migration record deleted successfully',
    };
  }
}
