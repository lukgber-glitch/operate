/**
 * QuickBooks Migration Service
 * Main orchestrator for QuickBooks to Operate data migration
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, MigrationStatus as PrismaMigrationStatus } from '@prisma/client';
import { QuickBooksAuthService } from '../../quickbooks/quickbooks-auth.service';
import { QuickBooksDataFetcherService } from './quickbooks-data-fetcher.service';
import { QuickBooksMapperService } from './quickbooks-mapper.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  MigrationStatus,
  MigrationEntityType,
  MigrationConfig,
  MigrationState,
  EntityMigrationProgress,
  MigrationError,
  MigrationResult,
  RollbackPoint,
  MigrationProgressEvent,
  MigrationCompleteEvent,
} from './quickbooks-migration.types';
import { StartMigrationDto } from './quickbooks-migration.dto';

@Injectable()
export class QuickBooksMigrationService {
  private readonly logger = new Logger(QuickBooksMigrationService.name);
  private activeMigrations: Map<string, boolean> = new Map(); // migrationId -> isPaused

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: QuickBooksAuthService,
    private readonly dataFetcher: QuickBooksDataFetcherService,
    private readonly mapper: QuickBooksMapperService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Map internal MigrationStatus to Prisma MigrationStatus
   */
  private mapStatusToPrisma(status: MigrationStatus): PrismaMigrationStatus {
    switch (status) {
      case MigrationStatus.PENDING:
        return PrismaMigrationStatus.PENDING;
      case MigrationStatus.IN_PROGRESS:
        return PrismaMigrationStatus.IN_PROGRESS;
      case MigrationStatus.COMPLETED:
        return PrismaMigrationStatus.COMPLETED;
      case MigrationStatus.FAILED:
        return PrismaMigrationStatus.FAILED;
      case MigrationStatus.PAUSED:
      case MigrationStatus.ROLLING_BACK:
      case MigrationStatus.ROLLED_BACK:
        // Store extended status in metadata
        return PrismaMigrationStatus.IN_PROGRESS;
      default:
        return PrismaMigrationStatus.PENDING;
    }
  }

  /**
   * Start a new migration
   */
  async startMigration(
    orgId: string,
    userId: string,
    dto: StartMigrationDto,
  ): Promise<{ migrationId: string; status: MigrationStatus }> {
    this.logger.log(`Starting migration for org ${orgId}`);

    // Check for active migrations
    const activeMigration = await this.prisma.quickBooksMigration.findFirst({
      where: {
        orgId,
        status: {
          in: [PrismaMigrationStatus.IN_PROGRESS, PrismaMigrationStatus.PENDING],
        },
      },
    });

    if (activeMigration) {
      throw new ConflictException(
        'Another migration is already in progress. Please wait or pause it first.',
      );
    }

    // Verify QuickBooks connection
    const connection = await this.getActiveConnection(orgId);
    const { accessToken } = await this.authService.getDecryptedTokens(orgId);

    // Test connection
    const testResult = await this.dataFetcher.testConnection(
      accessToken,
      connection.companyId,
    );

    if (!testResult.success) {
      throw new BadRequestException(
        `QuickBooks connection test failed: ${testResult.error}`,
      );
    }

    // Create migration config
    const config: MigrationConfig = {
      entities: dto.entities,
      conflictResolution: dto.conflictResolution,
      batchSize: dto.batchSize,
      rateLimitDelay: dto.rateLimitDelay,
      includeInactive: dto.includeInactive,
      dateRangeStart: dto.dateRangeStart ? new Date(dto.dateRangeStart) : undefined,
      dateRangeEnd: dto.dateRangeEnd ? new Date(dto.dateRangeEnd) : undefined,
      fieldMappings: dto.fieldMappings,
    };

    // Create migration record
    const migration = await this.prisma.quickBooksMigration.create({
      data: {
        orgId,
        connectionId: connection.id,
        status: PrismaMigrationStatus.PENDING,
        config: config as unknown as Prisma.InputJsonValue,
        progress: [] as unknown as Prisma.InputJsonValue,
        totalItems: 0,
        processedItems: 0,
        failedItems: 0,
        metadata: {
          companyName: testResult.companyName,
          startedFrom: 'web',
          createdBy: userId,
          extendedStatus: MigrationStatus.PENDING,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Start migration in background
    this.processMigration(migration.id, accessToken, connection.companyId).catch(
      (error) => {
        this.logger.error(`Migration ${migration.id} failed:`, error);
      },
    );

    return {
      migrationId: migration.id,
      status: MigrationStatus.IN_PROGRESS,
    };
  }

  /**
   * Process migration (runs in background)
   */
  private async processMigration(
    migrationId: string,
    accessToken: string,
    companyId: string,
  ): Promise<void> {
    const startTime = Date.now();
    this.activeMigrations.set(migrationId, false); // false = not paused

    try {
      // Update status to IN_PROGRESS
      await this.prisma.quickBooksMigration.update({
        where: { id: migrationId },
        data: {
          status: PrismaMigrationStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      // Load migration config
      const migration = await this.prisma.quickBooksMigration.findUnique({
        where: { id: migrationId },
      });

      if (!migration) {
        throw new Error('Migration not found');
      }

      const config = migration.config as unknown as MigrationConfig;
      const progress: EntityMigrationProgress[] = [];
      const errors: MigrationError[] = [];
      const rollbackPoints: RollbackPoint[] = [];

      // Process each entity type in order
      const entityOrder = this.getEntityProcessingOrder(config.entities);

      for (const entityType of entityOrder) {
        // Check if paused
        if (this.activeMigrations.get(migrationId)) {
          this.logger.log(`Migration ${migrationId} paused at ${entityType}`);
          await this.updateMigrationStatus(migrationId, MigrationStatus.PAUSED);
          return;
        }

        const entityProgress = await this.processEntity(
          migrationId,
          entityType,
          config,
          accessToken,
          companyId,
          migration.orgId,
          migration.connectionId,
          errors,
          rollbackPoints,
        );

        progress.push(entityProgress);

        // Emit progress event
        this.emitProgressEvent(migrationId, entityProgress, progress);
      }

      // Calculate totals
      const totals = this.calculateTotals(progress);
      const duration = Date.now() - startTime;

      // Update final status
      const currentMetadata = (migration.metadata as Record<string, any>) || {};
      await this.prisma.quickBooksMigration.update({
        where: { id: migrationId },
        data: {
          status: PrismaMigrationStatus.COMPLETED,
          progress: progress as unknown as Prisma.InputJsonValue,
          totalItems: totals.total,
          processedItems: totals.processed,
          failedItems: totals.failed,
          completedAt: new Date(),
          metadata: {
            ...currentMetadata,
            successfulItems: totals.successful,
            skippedItems: totals.skipped,
            duration,
            rollbackPoints,
            extendedStatus: MigrationStatus.COMPLETED,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      // Store errors
      if (errors.length > 0) {
        await this.prisma.quickBooksMigrationError.createMany({
          data: errors.map((err) => ({
            migrationId,
            entityType: err.entityType,
            entityId: err.entityId,
            message: err.error,
            errorCode: err.errorCode,
            details: err.entityData as unknown as Prisma.InputJsonValue,
          })),
        });
      }

      this.logger.log(`Migration ${migrationId} completed successfully`);

      // Emit completion event
      this.emitCompleteEvent(migrationId, {
        migrationId,
        status: MigrationStatus.COMPLETED,
        summary: {
          totalEntities: totals.total,
          successfulEntities: totals.successful,
          failedEntities: totals.failed,
          skippedEntities: totals.skipped,
          duration,
        },
        entityResults: progress,
        errors,
      });
    } catch (error) {
      this.logger.error(`Migration ${migrationId} failed:`, error);

      await this.prisma.quickBooksMigration.update({
        where: { id: migrationId },
        data: {
          status: PrismaMigrationStatus.FAILED,
          errorMessage: error.message,
          metadata: {
            error: error.message,
            stack: error.stack,
            extendedStatus: MigrationStatus.FAILED,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      throw error;
    } finally {
      this.activeMigrations.delete(migrationId);
    }
  }

  /**
   * Process single entity type
   */
  private async processEntity(
    migrationId: string,
    entityType: MigrationEntityType,
    config: MigrationConfig,
    accessToken: string,
    companyId: string,
    orgId: string,
    connectionId: string,
    errors: MigrationError[],
    rollbackPoints: RollbackPoint[],
  ): Promise<EntityMigrationProgress> {
    this.logger.log(`Processing ${entityType} for migration ${migrationId}`);

    const progress: EntityMigrationProgress = {
      entityType,
      status: MigrationStatus.IN_PROGRESS,
      totalItems: 0,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      skippedItems: 0,
      currentBatch: 0,
      totalBatches: 0,
      startedAt: new Date(),
    };

    try {
      // Update current entity in metadata
      const migration = await this.prisma.quickBooksMigration.findUnique({
        where: { id: migrationId },
      });
      const currentMetadata = (migration?.metadata as Record<string, any>) || {};
      await this.prisma.quickBooksMigration.update({
        where: { id: migrationId },
        data: {
          metadata: {
            ...currentMetadata,
            currentEntity: entityType,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      // Fetch data
      const fetchOptions = {
        accessToken,
        companyId,
        includeInactive: config.includeInactive,
        dateRangeStart: config.dateRangeStart,
        dateRangeEnd: config.dateRangeEnd,
        batchSize: config.batchSize,
        rateLimitDelay: config.rateLimitDelay,
      };

      const fetchResult = await this.fetchEntityData(entityType, fetchOptions);
      const items = fetchResult.items;

      progress.totalItems = items.length;
      progress.totalBatches = Math.ceil(items.length / config.batchSize);

      const rollbackPoint: RollbackPoint = {
        entityType,
        operateIds: [],
        quickbooksIds: [],
        mappingIds: [],
        timestamp: new Date(),
      };

      // Process in batches
      for (let i = 0; i < items.length; i += config.batchSize) {
        // Check if paused
        if (this.activeMigrations.get(migrationId)) {
          progress.status = MigrationStatus.PAUSED;
          progress.lastProcessedId = items[i - 1]?.Id;
          break;
        }

        const batch = items.slice(i, i + config.batchSize);
        progress.currentBatch = Math.floor(i / config.batchSize) + 1;

        for (const item of batch) {
          const result = await this.mapEntity(
            entityType,
            item,
            orgId,
            connectionId,
            config.conflictResolution,
          );

          progress.processedItems++;

          if (result.success) {
            if (result.skipped) {
              progress.skippedItems++;
            } else {
              progress.successfulItems++;
              rollbackPoint.operateIds.push(result.operateId);
              rollbackPoint.quickbooksIds.push(item.Id);
            }
          } else {
            progress.failedItems++;
            errors.push({
              entityType,
              entityId: item.Id,
              entityData: item,
              error: result.error,
              timestamp: new Date(),
            });
          }
        }

        // Update progress in database
        await this.updateEntityProgress(migrationId, progress);

        // Rate limiting
        await this.delay(config.rateLimitDelay);
      }

      progress.status = MigrationStatus.COMPLETED;
      progress.completedAt = new Date();
      rollbackPoints.push(rollbackPoint);

      this.logger.log(
        `Completed ${entityType}: ${progress.successfulItems}/${progress.totalItems} successful`,
      );

      return progress;
    } catch (error) {
      this.logger.error(`Error processing ${entityType}:`, error);
      progress.status = MigrationStatus.FAILED;
      progress.error = error.message;
      return progress;
    }
  }

  /**
   * Fetch entity data based on type
   */
  private async fetchEntityData(entityType: MigrationEntityType, options: any) {
    switch (entityType) {
      case MigrationEntityType.CUSTOMERS:
        return this.dataFetcher.fetchCustomers(options);
      case MigrationEntityType.VENDORS:
        return this.dataFetcher.fetchVendors(options);
      case MigrationEntityType.ITEMS:
        return this.dataFetcher.fetchItems(options);
      case MigrationEntityType.INVOICES:
        return this.dataFetcher.fetchInvoices(options);
      case MigrationEntityType.BILLS:
        return this.dataFetcher.fetchBills(options);
      case MigrationEntityType.PAYMENTS:
        return this.dataFetcher.fetchPayments(options);
      case MigrationEntityType.ACCOUNTS:
        return this.dataFetcher.fetchAccounts(options);
      case MigrationEntityType.TAX_RATES:
        return this.dataFetcher.fetchTaxRates(options);
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Map entity based on type
   */
  private async mapEntity(
    entityType: MigrationEntityType,
    item: any,
    orgId: string,
    connectionId: string,
    strategy: any,
  ) {
    switch (entityType) {
      case MigrationEntityType.CUSTOMERS:
        return this.mapper.mapCustomer(item, orgId, connectionId, strategy);
      case MigrationEntityType.VENDORS:
        return this.mapper.mapVendor(item, orgId, connectionId, strategy);
      case MigrationEntityType.ITEMS:
        return this.mapper.mapItem(item, orgId, connectionId, strategy);
      case MigrationEntityType.INVOICES:
        return this.mapper.mapInvoice(item, orgId, connectionId, strategy);
      case MigrationEntityType.PAYMENTS:
        return this.mapper.mapPayment(item, orgId, connectionId, strategy);
      default:
        return { success: false, error: `Unsupported entity type: ${entityType}` };
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(migrationId: string): Promise<MigrationState> {
    const migration = await this.prisma.quickBooksMigration.findUnique({
      where: { id: migrationId },
      include: {
        errors: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!migration) {
      throw new NotFoundException('Migration not found');
    }

    const metadata = (migration.metadata as Record<string, any>) || {};
    const progress = (migration.progress as unknown as EntityMigrationProgress[]) || [];
    const percentComplete = this.calculatePercentComplete(progress);
    const estimatedTimeRemaining = this.estimateTimeRemaining(migration, percentComplete);

    return {
      id: migration.id,
      orgId: migration.orgId,
      status: (metadata.extendedStatus as MigrationStatus) || migration.status as unknown as MigrationStatus,
      config: migration.config as unknown as MigrationConfig,
      progress,
      totalItems: migration.totalItems,
      processedItems: migration.processedItems,
      successfulItems: metadata.successfulItems || 0,
      failedItems: migration.failedItems,
      skippedItems: metadata.skippedItems || 0,
      currentEntity: metadata.currentEntity as MigrationEntityType,
      startedAt: migration.startedAt,
      completedAt: migration.completedAt,
      pausedAt: metadata.pausedAt,
      estimatedCompletionTime: estimatedTimeRemaining
        ? new Date(Date.now() + estimatedTimeRemaining)
        : undefined,
      createdBy: metadata.createdBy || 'system',
      metadata,
    };
  }

  /**
   * Pause migration
   */
  async pauseMigration(migrationId: string): Promise<void> {
    const migration = await this.prisma.quickBooksMigration.findUnique({
      where: { id: migrationId },
    });

    if (!migration) {
      throw new NotFoundException('Migration not found');
    }

    if (migration.status !== PrismaMigrationStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress migrations can be paused');
    }

    this.activeMigrations.set(migrationId, true); // Set pause flag

    const currentMetadata = (migration.metadata as Record<string, any>) || {};
    await this.prisma.quickBooksMigration.update({
      where: { id: migrationId },
      data: {
        metadata: {
          ...currentMetadata,
          extendedStatus: MigrationStatus.PAUSED,
          pausedAt: new Date(),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Migration ${migrationId} paused`);
  }

  /**
   * Resume migration
   */
  async resumeMigration(migrationId: string): Promise<void> {
    const migration = await this.prisma.quickBooksMigration.findUnique({
      where: { id: migrationId },
    });

    if (!migration) {
      throw new NotFoundException('Migration not found');
    }

    const metadata = (migration.metadata as Record<string, any>) || {};
    if (metadata.extendedStatus !== MigrationStatus.PAUSED) {
      throw new BadRequestException('Only paused migrations can be resumed');
    }

    // Get fresh tokens
    const connection = await this.getActiveConnection(migration.orgId);
    const { accessToken } = await this.authService.getDecryptedTokens(migration.orgId);

    await this.prisma.quickBooksMigration.update({
      where: { id: migrationId },
      data: {
        status: PrismaMigrationStatus.IN_PROGRESS,
        metadata: {
          ...metadata,
          extendedStatus: MigrationStatus.IN_PROGRESS,
          pausedAt: null,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Migration ${migrationId} resumed`);

    // Continue processing
    this.processMigration(migrationId, accessToken, connection.companyId).catch((error) => {
      this.logger.error(`Migration ${migrationId} failed after resume:`, error);
    });
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(migrationId: string): Promise<{ entitiesRolledBack: number }> {
    const migration = await this.prisma.quickBooksMigration.findUnique({
      where: { id: migrationId },
    });

    if (!migration) {
      throw new NotFoundException('Migration not found');
    }

    this.logger.log(`Starting rollback for migration ${migrationId}`);

    const metadata = (migration.metadata as Record<string, any>) || {};
    await this.prisma.quickBooksMigration.update({
      where: { id: migrationId },
      data: {
        metadata: {
          ...metadata,
          extendedStatus: MigrationStatus.ROLLING_BACK,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    const rollbackPoints = (metadata.rollbackPoints as RollbackPoint[]) || [];
    let totalRolledBack = 0;

    // Rollback in reverse order
    for (const rollbackPoint of rollbackPoints.reverse()) {
      // Delete created entities and mappings
      for (const operateId of rollbackPoint.operateIds) {
        try {
          await this.deleteEntity(rollbackPoint.entityType, operateId);
          totalRolledBack++;
        } catch (error) {
          this.logger.error(`Failed to rollback entity ${operateId}:`, error);
        }
      }

      // Delete mappings
      await this.prisma.quickBooksEntityMapping.deleteMany({
        where: {
          connectionId: migration.connectionId,
          entityType: this.mapEntityTypeToString(rollbackPoint.entityType),
          quickbooksId: { in: rollbackPoint.quickbooksIds },
        },
      });
    }

    await this.prisma.quickBooksMigration.update({
      where: { id: migrationId },
      data: {
        metadata: {
          ...metadata,
          extendedStatus: MigrationStatus.ROLLED_BACK,
          rolledBackAt: new Date(),
          entitiesRolledBack: totalRolledBack,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Rollback completed: ${totalRolledBack} entities removed`);

    return { entitiesRolledBack: totalRolledBack };
  }

  /**
   * Helper: Get active connection
   */
  private async getActiveConnection(orgId: string) {
    const connection = await this.prisma.quickBooksConnection.findFirst({
      where: {
        orgId,
        isConnected: true,
        status: 'CONNECTED',
      },
    });

    if (!connection) {
      throw new NotFoundException('No active QuickBooks connection found');
    }

    return connection;
  }

  /**
   * Helper: Get entity processing order (dependencies first)
   */
  private getEntityProcessingOrder(entities: MigrationEntityType[]): MigrationEntityType[] {
    const order: MigrationEntityType[] = [];

    // Dependencies first
    const orderPriority = [
      MigrationEntityType.ACCOUNTS,
      MigrationEntityType.TAX_RATES,
      MigrationEntityType.CUSTOMERS,
      MigrationEntityType.VENDORS,
      MigrationEntityType.ITEMS,
      MigrationEntityType.INVOICES,
      MigrationEntityType.BILLS,
      MigrationEntityType.PAYMENTS,
    ];

    for (const type of orderPriority) {
      if (entities.includes(type)) {
        order.push(type);
      }
    }

    return order;
  }

  /**
   * Helper: Calculate totals from progress
   */
  private calculateTotals(progress: EntityMigrationProgress[]) {
    return progress.reduce(
      (acc, p) => ({
        total: acc.total + p.totalItems,
        processed: acc.processed + p.processedItems,
        successful: acc.successful + p.successfulItems,
        failed: acc.failed + p.failedItems,
        skipped: acc.skipped + p.skippedItems,
      }),
      { total: 0, processed: 0, successful: 0, failed: 0, skipped: 0 },
    );
  }

  /**
   * Helper: Calculate percent complete
   */
  private calculatePercentComplete(progress: EntityMigrationProgress[]): number {
    const totals = this.calculateTotals(progress);
    return totals.total > 0 ? (totals.processed / totals.total) * 100 : 0;
  }

  /**
   * Helper: Estimate time remaining
   */
  private estimateTimeRemaining(migration: any, percentComplete: number): number | undefined {
    if (!migration.startedAt || percentComplete === 0) return undefined;

    const elapsed = Date.now() - new Date(migration.startedAt).getTime();
    const estimated = (elapsed / percentComplete) * (100 - percentComplete);

    return Math.round(estimated);
  }

  /**
   * Helper: Update migration status
   */
  private async updateMigrationStatus(migrationId: string, status: MigrationStatus) {
    const migration = await this.prisma.quickBooksMigration.findUnique({
      where: { id: migrationId },
    });
    const metadata = (migration?.metadata as Record<string, any>) || {};

    await this.prisma.quickBooksMigration.update({
      where: { id: migrationId },
      data: {
        status: this.mapStatusToPrisma(status),
        metadata: {
          ...metadata,
          extendedStatus: status,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Helper: Update entity progress
   */
  private async updateEntityProgress(
    migrationId: string,
    entityProgress: EntityMigrationProgress,
  ) {
    const migration = await this.prisma.quickBooksMigration.findUnique({
      where: { id: migrationId },
    });

    const progress = (migration.progress as unknown as EntityMigrationProgress[]) || [];
    const index = progress.findIndex((p) => p.entityType === entityProgress.entityType);

    if (index >= 0) {
      progress[index] = entityProgress;
    } else {
      progress.push(entityProgress);
    }

    const totals = this.calculateTotals(progress);
    const metadata = (migration?.metadata as Record<string, any>) || {};

    await this.prisma.quickBooksMigration.update({
      where: { id: migrationId },
      data: {
        progress: progress as unknown as Prisma.InputJsonValue,
        processedItems: totals.processed,
        failedItems: totals.failed,
        metadata: {
          ...metadata,
          successfulItems: totals.successful,
          skippedItems: totals.skipped,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Helper: Emit progress event
   */
  private emitProgressEvent(
    migrationId: string,
    entityProgress: EntityMigrationProgress,
    allProgress: EntityMigrationProgress[],
  ) {
    const percentComplete = this.calculatePercentComplete(allProgress);

    const event: MigrationProgressEvent = {
      migrationId,
      status: MigrationStatus.IN_PROGRESS,
      currentEntity: entityProgress.entityType,
      progress: allProgress,
      percentComplete,
    };

    this.eventEmitter.emit('migration.progress', event);
  }

  /**
   * Helper: Emit complete event
   */
  private emitCompleteEvent(migrationId: string, result: MigrationResult) {
    const event: MigrationCompleteEvent = {
      migrationId,
      result,
    };

    this.eventEmitter.emit('migration.complete', event);
  }

  /**
   * Helper: Delete entity by type
   */
  private async deleteEntity(entityType: MigrationEntityType, operateId: string) {
    switch (entityType) {
      case MigrationEntityType.CUSTOMERS:
        await this.prisma.customer.delete({ where: { id: operateId } });
        break;
      case MigrationEntityType.VENDORS:
        await this.prisma.vendor.delete({ where: { id: operateId } });
        break;
      case MigrationEntityType.ITEMS:
        await this.prisma.product.delete({ where: { id: operateId } });
        break;
      case MigrationEntityType.INVOICES:
        await this.prisma.invoice.delete({ where: { id: operateId } });
        break;
      case MigrationEntityType.PAYMENTS:
        await this.prisma.payment.delete({ where: { id: operateId } });
        break;
    }
  }

  /**
   * Helper: Map entity type to string
   */
  private mapEntityTypeToString(type: MigrationEntityType): string {
    return type.toString();
  }

  /**
   * Helper: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * List migrations for organization
   */
  async listMigrations(
    orgId: string,
    status?: MigrationStatus,
    limit = 20,
    offset = 0,
  ) {
    const where: Prisma.QuickBooksMigrationWhereInput = {
      orgId,
    };

    // Map status if provided
    if (status) {
      where.status = this.mapStatusToPrisma(status);
    }

    return this.prisma.quickBooksMigration.findMany({
      where,
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get migration errors
   */
  async getMigrationErrors(migrationId: string) {
    return this.prisma.quickBooksMigrationError.findMany({
      where: { migrationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete migration record
   */
  async deleteMigration(migrationId: string): Promise<void> {
    // Delete errors first
    await this.prisma.quickBooksMigrationError.deleteMany({
      where: { migrationId },
    });

    // Delete migration
    await this.prisma.quickBooksMigration.delete({
      where: { id: migrationId },
    });

    this.logger.log(`Migration ${migrationId} deleted`);
  }
}
