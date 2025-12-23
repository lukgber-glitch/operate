/**
 * Xero Migration Service
 * Main orchestrator for full Xero data migration
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { XeroDataFetcherService } from './xero-data-fetcher.service';
import { XeroMapperService } from './xero-mapper.service';
import {
  MigrationConfig,
  MigrationProgress,
  MigrationStatus,
  EntityMigrationProgress,
  XeroEntityType,
  MigrationError,
  MigrationResumeContext,
} from './xero-migration.types';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class XeroMigrationService {
  private readonly logger = new Logger(XeroMigrationService.name);
  private activeMigrations: Map<string, MigrationProgress> = new Map();
  private migrationContexts: Map<string, MigrationResumeContext> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataFetcher: XeroDataFetcherService,
    private readonly mapper: XeroMapperService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Start a new migration
   */
  async startMigration(config: MigrationConfig): Promise<string> {
    const migrationId = uuidv4();

    this.logger.log(
      `Starting migration ${migrationId} for org ${config.orgId}, tenant ${config.xeroTenantId}`,
    );

    // Initialize migration progress
    const progress: MigrationProgress = {
      migrationId,
      status: MigrationStatus.PENDING,
      config,
      entityProgress: config.entityMappings
        .filter((m) => m.enabled)
        .map((m) => ({
          entityType: m.entityType,
          status: MigrationStatus.PENDING,
          totalCount: 0,
          processedCount: 0,
          successCount: 0,
          failedCount: 0,
          skippedCount: 0,
          errors: [],
        })),
      overallProgress: 0,
      startedAt: new Date(),
      totalEntitiesProcessed: 0,
      totalEntitiesSucceeded: 0,
      totalEntitiesFailed: 0,
      totalEntitiesSkipped: 0,
      errors: [],
      warnings: [],
      metadata: {},
    };

    // Store in memory
    this.activeMigrations.set(migrationId, progress);

    // Save to database
    await this.saveMigrationState(progress);

    // Start migration asynchronously
    this.executeMigration(migrationId).catch((error) => {
      this.logger.error(
        `Migration ${migrationId} failed: ${error.message}`,
        error.stack,
      );
    });

    return migrationId;
  }

  /**
   * Execute migration process
   */
  private async executeMigration(migrationId: string): Promise<void> {
    const progress = this.activeMigrations.get(migrationId);
    if (!progress) {
      throw new Error(`Migration ${migrationId} not found`);
    }

    try {
      // Update status to in progress
      progress.status = MigrationStatus.IN_PROGRESS;
      await this.saveMigrationState(progress);
      this.emitProgressUpdate(migrationId, 'started', progress);

      // Migrate entities in order (dependencies first)
      const orderedEntities = this.getOrderedEntityTypes(
        progress.config.entityMappings,
      );

      for (const mapping of orderedEntities) {
        // Check if migration is paused
        if (progress.status === MigrationStatus.PAUSED) {
          this.logger.log(`Migration ${migrationId} paused`);
          return;
        }

        await this.migrateEntityType(migrationId, mapping.entityType);
      }

      // Migration completed
      progress.status = MigrationStatus.COMPLETED;
      progress.completedAt = new Date();
      progress.overallProgress = 100;

      await this.saveMigrationState(progress);
      this.emitProgressUpdate(migrationId, 'completed', progress);

      this.logger.log(
        `Migration ${migrationId} completed successfully. ` +
          `Total: ${progress.totalEntitiesProcessed}, ` +
          `Success: ${progress.totalEntitiesSucceeded}, ` +
          `Failed: ${progress.totalEntitiesFailed}, ` +
          `Skipped: ${progress.totalEntitiesSkipped}`,
      );
    } catch (error) {
      this.logger.error(
        `Migration ${migrationId} failed: ${error.message}`,
        error.stack,
      );

      progress.status = MigrationStatus.FAILED;
      progress.completedAt = new Date();
      progress.errors.push({
        entityType: XeroEntityType.CONTACTS, // Default
        xeroId: 'N/A',
        errorMessage: error.message,
        timestamp: new Date(),
      });

      await this.saveMigrationState(progress);
      this.emitProgressUpdate(migrationId, 'failed', progress);
    }
  }

  /**
   * Migrate a specific entity type
   */
  private async migrateEntityType(
    migrationId: string,
    entityType: XeroEntityType,
  ): Promise<void> {
    const progress = this.activeMigrations.get(migrationId);
    if (!progress) return;

    const entityProgress = progress.entityProgress.find(
      (ep) => ep.entityType === entityType,
    );
    if (!entityProgress) return;

    const mapping = progress.config.entityMappings.find(
      (m) => m.entityType === entityType,
    );
    if (!mapping) return;

    this.logger.log(`Migrating ${entityType} for migration ${migrationId}`);

    try {
      entityProgress.status = MigrationStatus.IN_PROGRESS;
      entityProgress.startedAt = new Date();
      await this.saveMigrationState(progress);

      // Fetch data from Xero
      const xeroData = await this.dataFetcher.fetchEntityData(
        entityType,
        progress.config.orgId,
        progress.config.xeroTenantId,
        progress.config.startDate,
        (current, total) => {
          entityProgress.totalCount = total;
          this.updateOverallProgress(progress);
        },
      );

      entityProgress.totalCount = xeroData.length;
      this.logger.log(`Fetched ${xeroData.length} ${entityType} from Xero`);

      // Apply filters if any
      const filteredData = mapping.filters
        ? this.applyFilters(xeroData, mapping.filters)
        : xeroData;

      this.logger.log(
        `After filters: ${filteredData.length} ${entityType} to migrate`,
      );

      // Process in batches
      const batchSize = progress.config.batchSize || 100;
      for (let i = 0; i < filteredData.length; i += batchSize) {
        // Check if paused
        if (progress.status === MigrationStatus.PAUSED) {
          this.logger.log(
            `Migration ${migrationId} paused during ${entityType}`,
          );
          return;
        }

        const batch = filteredData.slice(i, i + batchSize);

        // Map entities
        const mappedResults = await this.mapper.batchMapEntities(
          entityType,
          batch,
          progress.config.orgId,
          mapping.conflictStrategy,
        );

        // Update progress
        for (const result of mappedResults) {
          entityProgress.processedCount++;
          progress.totalEntitiesProcessed++;

          if (result.status === 'SUCCESS') {
            entityProgress.successCount++;
            progress.totalEntitiesSucceeded++;
          } else if (result.status === 'FAILED') {
            entityProgress.failedCount++;
            progress.totalEntitiesFailed++;
            const error: MigrationError = {
              entityType,
              xeroId: result.xeroId,
              errorMessage: result.error || 'Unknown error',
              xeroData: result.xeroData,
              timestamp: new Date(),
            };
            entityProgress.errors.push(error);
            progress.errors.push(error);
          } else if (result.status === 'SKIPPED') {
            entityProgress.skippedCount++;
            progress.totalEntitiesSkipped++;
          }
        }

        // Update progress
        this.updateOverallProgress(progress);
        await this.saveMigrationState(progress);
        this.emitProgressUpdate(migrationId, 'progress', progress);

        this.logger.debug(
          `Processed batch for ${entityType}: ${entityProgress.processedCount}/${entityProgress.totalCount}`,
        );
      }

      // Entity migration completed
      entityProgress.status = MigrationStatus.COMPLETED;
      entityProgress.completedAt = new Date();

      await this.saveMigrationState(progress);
      this.emitProgressUpdate(migrationId, 'entity_complete', progress);

      this.logger.log(
        `Completed ${entityType}: ${entityProgress.successCount} succeeded, ` +
          `${entityProgress.failedCount} failed, ${entityProgress.skippedCount} skipped`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to migrate ${entityType}: ${error.message}`,
        error.stack,
      );

      entityProgress.status = MigrationStatus.FAILED;
      entityProgress.completedAt = new Date();

      const migrationError: MigrationError = {
        entityType,
        xeroId: 'BATCH',
        errorMessage: error.message,
        timestamp: new Date(),
      };
      entityProgress.errors.push(migrationError);
      progress.errors.push(migrationError);

      await this.saveMigrationState(progress);
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(migrationId: string): Promise<MigrationProgress> {
    // Check in-memory first
    let progress = this.activeMigrations.get(migrationId);

    // If not in memory, load from database
    if (!progress) {
      progress = await this.loadMigrationState(migrationId);
      if (!progress) {
        throw new NotFoundException(`Migration ${migrationId} not found`);
      }
    }

    return progress;
  }

  /**
   * Pause migration
   */
  async pauseMigration(migrationId: string): Promise<void> {
    const progress = this.activeMigrations.get(migrationId);
    if (!progress) {
      throw new NotFoundException(`Migration ${migrationId} not found`);
    }

    if (progress.status !== MigrationStatus.IN_PROGRESS) {
      throw new Error(
        `Cannot pause migration in status: ${progress.status}`,
      );
    }

    this.logger.log(`Pausing migration ${migrationId}`);

    progress.status = MigrationStatus.PAUSED;
    await this.saveMigrationState(progress);
    this.emitProgressUpdate(migrationId, 'paused', progress);
  }

  /**
   * Resume migration
   */
  async resumeMigration(migrationId: string): Promise<void> {
    let progress = this.activeMigrations.get(migrationId);

    if (!progress) {
      progress = await this.loadMigrationState(migrationId);
      if (!progress) {
        throw new NotFoundException(`Migration ${migrationId} not found`);
      }
      this.activeMigrations.set(migrationId, progress);
    }

    if (progress.status !== MigrationStatus.PAUSED) {
      throw new Error(
        `Cannot resume migration in status: ${progress.status}`,
      );
    }

    this.logger.log(`Resuming migration ${migrationId}`);

    progress.status = MigrationStatus.IN_PROGRESS;
    await this.saveMigrationState(progress);

    // Continue migration
    this.executeMigration(migrationId).catch((error) => {
      this.logger.error(
        `Failed to resume migration ${migrationId}: ${error.message}`,
      );
    });
  }

  /**
   * Get ordered entity types (respecting dependencies)
   */
  private getOrderedEntityTypes(
    mappings: any[],
  ): Array<{ entityType: XeroEntityType }> {
    // Define migration order (dependencies first)
    const order = [
      XeroEntityType.ACCOUNTS,
      XeroEntityType.TAX_RATES,
      XeroEntityType.TRACKING_CATEGORIES,
      XeroEntityType.CONTACTS,
      XeroEntityType.ITEMS,
      XeroEntityType.INVOICES,
      XeroEntityType.CREDIT_NOTES,
      XeroEntityType.PAYMENTS,
      XeroEntityType.BANK_TRANSACTIONS,
    ];

    return order
      .filter((entityType) =>
        mappings.find((m) => m.entityType === entityType && m.enabled),
      )
      .map((entityType) => ({ entityType }));
  }

  /**
   * Apply filters to data
   */
  private applyFilters(data: any[], filters: Record<string, any>): any[] {
    return data.filter((item) => {
      for (const [key, value] of Object.entries(filters)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Update overall progress percentage
   */
  private updateOverallProgress(progress: MigrationProgress): void {
    const totalEntities = progress.entityProgress.reduce(
      (sum, ep) => sum + ep.totalCount,
      0,
    );
    const processedEntities = progress.entityProgress.reduce(
      (sum, ep) => sum + ep.processedCount,
      0,
    );

    progress.overallProgress =
      totalEntities > 0 ? Math.round((processedEntities / totalEntities) * 100) : 0;

    // Estimate completion time
    if (processedEntities > 0 && progress.overallProgress < 100) {
      const elapsed = Date.now() - progress.startedAt.getTime();
      const estimatedTotal = (elapsed / processedEntities) * totalEntities;
      progress.estimatedCompletionAt = new Date(
        progress.startedAt.getTime() + estimatedTotal,
      );
    }
  }

  /**
   * Save migration state to database
   */
  private async saveMigrationState(progress: MigrationProgress): Promise<void> {
    try {
      await this.prisma.xeroMigration.upsert({
        where: { id: progress.migrationId },
        create: {
          id: progress.migrationId,
          orgId: progress.config.orgId,
          xeroTenantId: progress.config.xeroTenantId,
          status: progress.status,
          config: progress.config as unknown as Prisma.InputJsonValue,
          progress: progress as unknown as Prisma.InputJsonValue,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
        },
        update: {
          status: progress.status,
          progress: progress as unknown as Prisma.InputJsonValue,
          completedAt: progress.completedAt,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to save migration state: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Load migration state from database
   */
  private async loadMigrationState(
    migrationId: string,
  ): Promise<MigrationProgress | null> {
    try {
      const migration = await this.prisma.xeroMigration.findUnique({
        where: { id: migrationId },
      });

      if (!migration) return null;

      return migration.progress as unknown as MigrationProgress;
    } catch (error) {
      this.logger.error(
        `Failed to load migration state: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Emit progress update via WebSocket
   */
  private emitProgressUpdate(
    migrationId: string,
    event: string,
    progress: MigrationProgress,
  ): void {
    this.eventEmitter.emit('migration.progress', {
      migrationId,
      event,
      timestamp: new Date(),
      data: {
        status: progress.status,
        overallProgress: progress.overallProgress,
        totalEntitiesProcessed: progress.totalEntitiesProcessed,
        totalEntitiesSucceeded: progress.totalEntitiesSucceeded,
        totalEntitiesFailed: progress.totalEntitiesFailed,
        totalEntitiesSkipped: progress.totalEntitiesSkipped,
      },
    });
  }

  /**
   * List all migrations for an organization
   */
  async listMigrations(orgId: string): Promise<any[]> {
    const migrations = await this.prisma.xeroMigration.findMany({
      where: { orgId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return migrations.map((m) => ({
      migrationId: m.id,
      status: m.status,
      xeroTenantId: m.xeroTenantId,
      startedAt: m.startedAt,
      completedAt: m.completedAt,
      overallProgress: (m.progress as any)?.overallProgress || 0,
    }));
  }
}
