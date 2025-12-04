import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QuickBooksSyncEntityType } from '@prisma/client';

/**
 * QuickBooks Mapping Service
 * Manages ID mappings between QuickBooks and Operate entities
 */
@Injectable()
export class QuickBooksMappingService {
  private readonly logger = new Logger(QuickBooksMappingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or update a mapping between QuickBooks and Operate entities
   */
  async createMapping(params: {
    connectionId: string;
    orgId: string;
    entityType: QuickBooksSyncEntityType;
    operateId: string;
    quickbooksId: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.prisma.quickBooksSyncMapping.upsert({
      where: {
        connectionId_entityType_operateId: {
          connectionId: params.connectionId,
          entityType: params.entityType,
          operateId: params.operateId,
        },
      },
      create: {
        connectionId: params.connectionId,
        orgId: params.orgId,
        entityType: params.entityType,
        operateId: params.operateId,
        quickbooksId: params.quickbooksId,
        metadata: params.metadata || {},
        lastSyncAt: new Date(),
        lastModifiedAt: new Date(),
      },
      update: {
        quickbooksId: params.quickbooksId,
        metadata: params.metadata || {},
        lastSyncAt: new Date(),
        lastModifiedAt: new Date(),
        syncVersion: {
          increment: 1,
        },
      },
    });

    this.logger.debug(
      `Mapped ${params.entityType}: Operate(${params.operateId}) <-> QB(${params.quickbooksId})`,
    );
  }

  /**
   * Get QuickBooks ID from Operate ID
   */
  async getQuickBooksId(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
    operateId: string,
  ): Promise<string | null> {
    const mapping = await this.prisma.quickBooksSyncMapping.findUnique({
      where: {
        connectionId_entityType_operateId: {
          connectionId,
          entityType,
          operateId,
        },
      },
      select: { quickbooksId: true },
    });

    return mapping?.quickbooksId || null;
  }

  /**
   * Get Operate ID from QuickBooks ID
   */
  async getOperateId(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
    quickbooksId: string,
  ): Promise<string | null> {
    const mapping = await this.prisma.quickBooksSyncMapping.findUnique({
      where: {
        connectionId_entityType_quickbooksId: {
          connectionId,
          entityType,
          quickbooksId,
        },
      },
      select: { operateId: true },
    });

    return mapping?.operateId || null;
  }

  /**
   * Check if an entity exists in mapping
   */
  async hasMapping(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
    operateId: string,
  ): Promise<boolean> {
    const count = await this.prisma.quickBooksSyncMapping.count({
      where: {
        connectionId,
        entityType,
        operateId,
      },
    });

    return count > 0;
  }

  /**
   * Get mapping details
   */
  async getMapping(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
    operateId: string,
  ) {
    return this.prisma.quickBooksSyncMapping.findUnique({
      where: {
        connectionId_entityType_operateId: {
          connectionId,
          entityType,
          operateId,
        },
      },
    });
  }

  /**
   * Get all mappings for a connection and entity type
   */
  async getMappings(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
  ) {
    return this.prisma.quickBooksSyncMapping.findMany({
      where: {
        connectionId,
        entityType,
      },
      orderBy: {
        lastModifiedAt: 'desc',
      },
    });
  }

  /**
   * Get mappings modified since a specific date
   */
  async getModifiedSince(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
    since: Date,
  ) {
    return this.prisma.quickBooksSyncMapping.findMany({
      where: {
        connectionId,
        entityType,
        lastModifiedAt: {
          gt: since,
        },
      },
    });
  }

  /**
   * Mark mapping as having conflict
   */
  async markConflict(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
    operateId: string,
    conflictData?: Record<string, any>,
  ): Promise<void> {
    await this.prisma.quickBooksSyncMapping.update({
      where: {
        connectionId_entityType_operateId: {
          connectionId,
          entityType,
          operateId,
        },
      },
      data: {
        hasConflict: true,
        conflictData,
      },
    });
  }

  /**
   * Clear conflict flag
   */
  async clearConflict(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
    operateId: string,
  ): Promise<void> {
    await this.prisma.quickBooksSyncMapping.update({
      where: {
        connectionId_entityType_operateId: {
          connectionId,
          entityType,
          operateId,
        },
      },
      data: {
        hasConflict: false,
        conflictData: null,
      },
    });
  }

  /**
   * Get all conflicted mappings
   */
  async getConflicts(connectionId: string, entityType?: QuickBooksSyncEntityType) {
    return this.prisma.quickBooksSyncMapping.findMany({
      where: {
        connectionId,
        hasConflict: true,
        ...(entityType && { entityType }),
      },
      orderBy: {
        lastModifiedAt: 'desc',
      },
    });
  }

  /**
   * Delete a mapping
   */
  async deleteMapping(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
    operateId: string,
  ): Promise<void> {
    await this.prisma.quickBooksSyncMapping.delete({
      where: {
        connectionId_entityType_operateId: {
          connectionId,
          entityType,
          operateId,
        },
      },
    });
  }

  /**
   * Delete all mappings for a connection
   */
  async deleteAllMappings(connectionId: string): Promise<number> {
    const result = await this.prisma.quickBooksSyncMapping.deleteMany({
      where: { connectionId },
    });

    return result.count;
  }

  /**
   * Get sync statistics for an entity type
   */
  async getSyncStats(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
  ): Promise<{
    total: number;
    withConflicts: number;
    lastSyncAt: Date | null;
  }> {
    const [total, withConflicts, latest] = await Promise.all([
      this.prisma.quickBooksSyncMapping.count({
        where: { connectionId, entityType },
      }),
      this.prisma.quickBooksSyncMapping.count({
        where: { connectionId, entityType, hasConflict: true },
      }),
      this.prisma.quickBooksSyncMapping.findFirst({
        where: { connectionId, entityType },
        select: { lastSyncAt: true },
        orderBy: { lastSyncAt: 'desc' },
      }),
    ]);

    return {
      total,
      withConflicts,
      lastSyncAt: latest?.lastSyncAt || null,
    };
  }
}
