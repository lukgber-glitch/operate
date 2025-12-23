import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Entity types for QuickBooks sync
 */
export type QuickBooksSyncEntityType =
  | 'CUSTOMER'
  | 'INVOICE'
  | 'PAYMENT'
  | 'ACCOUNT'
  | 'ITEM'
  | 'PRODUCT'
  | 'VENDOR'
  | 'BILL'
  | 'EXPENSE';

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
        localId: params.operateId,
        operateId: params.operateId,
        externalId: params.quickbooksId,
        metadata: params.metadata || {},
        lastSyncedAt: new Date(),
      },
      update: {
        externalId: params.quickbooksId,
        metadata: params.metadata || {},
        lastSyncedAt: new Date(),
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
      select: { externalId: true },
    });

    return mapping?.externalId || null;
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
        connectionId_entityType_externalId: {
          connectionId,
          entityType,
          externalId: quickbooksId,
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
        updatedAt: 'desc',
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
        updatedAt: {
          gt: since,
        },
      },
    });
  }

  /**
   * Mark mapping as having conflict
   * Note: Conflict tracking is done via QuickBooksSyncConflict model
   */
  async markConflict(
    connectionId: string,
    entityType: QuickBooksSyncEntityType,
    operateId: string,
    conflictData?: Record<string, any>,
  ): Promise<void> {
    // Update metadata to indicate conflict
    await this.prisma.quickBooksSyncMapping.update({
      where: {
        connectionId_entityType_operateId: {
          connectionId,
          entityType,
          operateId,
        },
      },
      data: {
        metadata: {
          ...(typeof conflictData === 'object' ? conflictData : {}),
          hasConflict: true,
        },
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
    const mapping = await this.prisma.quickBooksSyncMapping.findUnique({
      where: {
        connectionId_entityType_operateId: {
          connectionId,
          entityType,
          operateId,
        },
      },
    });

    if (mapping && mapping.metadata) {
      const metadata = mapping.metadata as Record<string, any>;
      delete metadata.hasConflict;

      await this.prisma.quickBooksSyncMapping.update({
        where: {
          connectionId_entityType_operateId: {
            connectionId,
            entityType,
            operateId,
          },
        },
        data: {
          metadata,
        },
      });
    }
  }

  /**
   * Get all conflicted mappings
   */
  async getConflicts(connectionId: string, entityType?: QuickBooksSyncEntityType) {
    return this.prisma.quickBooksSyncMapping.findMany({
      where: {
        connectionId,
        ...(entityType && { entityType }),
        metadata: {
          path: ['hasConflict'],
          equals: true,
        },
      },
      orderBy: {
        updatedAt: 'desc',
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
        where: {
          connectionId,
          entityType,
          metadata: {
            path: ['hasConflict'],
            equals: true,
          },
        },
      }),
      this.prisma.quickBooksSyncMapping.findFirst({
        where: { connectionId, entityType },
        select: { lastSyncedAt: true },
        orderBy: { lastSyncedAt: 'desc' },
      }),
    ]);

    return {
      total,
      withConflicts,
      lastSyncAt: latest?.lastSyncedAt || null,
    };
  }
}
