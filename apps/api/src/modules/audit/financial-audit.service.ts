import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  AuditEntityType,
  AuditAction,
  AuditActorType,
  Prisma,
} from '@prisma/client';
import * as crypto from 'crypto';

/**
 * Financial Audit Log Service
 *
 * Manages audit logging for all financial data access and modifications
 * Required for compliance (SOC2, GDPR, GoBD) and insider threat detection
 *
 * Features:
 * - Immutable audit trail
 * - Hash chain for tamper detection (GoBD compliance)
 * - Multi-tenant isolation
 * - Complete state tracking (before/after)
 * - Actor tracking (user, system, automation)
 */
@Injectable()
export class FinancialAuditService {
  private readonly logger = new Logger(FinancialAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log financial data access (READ operations)
   *
   * @param params Access log parameters
   * @returns Created audit log entry
   */
  async logAccess(params: {
    userId?: string;
    organisationId: string;
    entityType: AuditEntityType;
    entityId: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    return this.createAuditLog({
      tenantId: params.organisationId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: AuditAction.VIEW,
      actorType: params.userId ? AuditActorType.USER : AuditActorType.SYSTEM,
      actorId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });
  }

  /**
   * Log financial data creation
   *
   * @param params Creation log parameters including new state
   * @returns Created audit log entry
   */
  async logCreate(params: {
    userId?: string;
    organisationId: string;
    entityType: AuditEntityType;
    entityId: string;
    newState: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    return this.createAuditLog({
      tenantId: params.organisationId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: AuditAction.CREATE,
      actorType: params.userId ? AuditActorType.USER : AuditActorType.SYSTEM,
      actorId: params.userId,
      newState: params.newState,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });
  }

  /**
   * Log financial data update
   *
   * @param params Update log parameters including before/after states
   * @returns Created audit log entry
   */
  async logUpdate(params: {
    userId?: string;
    organisationId: string;
    entityType: AuditEntityType;
    entityId: string;
    previousState: any;
    newState: any;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    return this.createAuditLog({
      tenantId: params.organisationId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: AuditAction.UPDATE,
      actorType: params.userId ? AuditActorType.USER : AuditActorType.SYSTEM,
      actorId: params.userId,
      previousState: params.previousState,
      newState: params.newState,
      changes: params.changes,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });
  }

  /**
   * Log financial data deletion
   *
   * @param params Deletion log parameters including previous state
   * @returns Created audit log entry
   */
  async logDelete(params: {
    userId?: string;
    organisationId: string;
    entityType: AuditEntityType;
    entityId: string;
    previousState: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    return this.createAuditLog({
      tenantId: params.organisationId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: AuditAction.DELETE,
      actorType: params.userId ? AuditActorType.USER : AuditActorType.SYSTEM,
      actorId: params.userId,
      previousState: params.previousState,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });
  }

  /**
   * Log bulk export operations (high-risk for data exfiltration)
   *
   * @param params Export log parameters
   * @returns Created audit log entry
   */
  async logExport(params: {
    userId: string;
    organisationId: string;
    entityType: AuditEntityType;
    entityIds?: string[];
    exportFormat?: string;
    recordCount?: number;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    return this.createAuditLog({
      tenantId: params.organisationId,
      entityType: params.entityType,
      entityId: params.entityIds ? params.entityIds.join(',') : 'bulk',
      action: AuditAction.EXPORT,
      actorType: AuditActorType.USER,
      actorId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        ...params.metadata,
        exportFormat: params.exportFormat,
        recordCount: params.recordCount,
        entityIds: params.entityIds,
      },
    });
  }

  /**
   * Log approval/rejection actions
   *
   * @param params Approval/rejection log parameters
   * @returns Created audit log entry
   */
  async logApproval(params: {
    userId: string;
    organisationId: string;
    entityType: AuditEntityType;
    entityId: string;
    action: AuditAction;
    previousState: any;
    newState: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    return this.createAuditLog({
      tenantId: params.organisationId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorType: AuditActorType.USER,
      actorId: params.userId,
      previousState: params.previousState,
      newState: params.newState,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });
  }

  /**
   * Get audit trail for a specific entity
   *
   * @param organisationId Organisation ID
   * @param entityType Entity type
   * @param entityId Entity ID
   * @returns Array of audit log entries
   */
  async getEntityAuditTrail(
    organisationId: string,
    entityType: AuditEntityType,
    entityId: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId: organisationId,
        entityType,
        entityId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  /**
   * Get recent access logs for monitoring
   *
   * @param organisationId Organisation ID
   * @param limit Number of records to return
   * @returns Recent audit log entries
   */
  async getRecentAccessLogs(organisationId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId: organisationId,
        action: AuditAction.VIEW,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Detect suspicious access patterns
   *
   * @param organisationId Organisation ID
   * @param userId User ID
   * @param timeWindowMinutes Time window to check
   * @returns Suspicious activity metrics
   */
  async detectSuspiciousAccess(
    organisationId: string,
    userId: string,
    timeWindowMinutes = 60,
  ) {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    const [accessCount, exportCount, distinctEntities] = await Promise.all([
      // Total access count
      this.prisma.auditLog.count({
        where: {
          tenantId: organisationId,
          actorId: userId,
          action: AuditAction.VIEW,
          timestamp: { gte: since },
        },
      }),

      // Export count
      this.prisma.auditLog.count({
        where: {
          tenantId: organisationId,
          actorId: userId,
          action: AuditAction.EXPORT,
          timestamp: { gte: since },
        },
      }),

      // Distinct entities accessed
      this.prisma.auditLog.findMany({
        where: {
          tenantId: organisationId,
          actorId: userId,
          timestamp: { gte: since },
        },
        select: {
          entityType: true,
          entityId: true,
        },
        distinct: ['entityType', 'entityId'],
      }),
    ]);

    const isSuspicious =
      accessCount > 100 || // More than 100 accesses in time window
      exportCount > 5 || // More than 5 exports in time window
      distinctEntities.length > 50; // Accessing more than 50 distinct entities

    return {
      accessCount,
      exportCount,
      distinctEntitiesCount: distinctEntities.length,
      isSuspicious,
      timeWindowMinutes,
    };
  }

  /**
   * Create audit log entry with hash chain
   *
   * @param data Audit log data
   * @returns Created audit log entry
   */
  private async createAuditLog(data: {
    tenantId: string;
    entityType: AuditEntityType;
    entityId: string;
    action: AuditAction;
    actorType: AuditActorType;
    actorId?: string;
    previousState?: any;
    newState?: any;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      // Get the last hash for this tenant (for hash chain)
      const lastEntry = await this.prisma.auditLogSequence.findUnique({
        where: { tenantId: data.tenantId },
      });

      const previousHash = lastEntry?.lastHash || null;

      // Create hash of this entry
      const hashData = {
        tenantId: data.tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        actorType: data.actorType,
        actorId: data.actorId,
        timestamp: new Date().toISOString(),
        previousHash,
      };

      const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(hashData))
        .digest('hex');

      // Create audit log entry
      const auditLog = await this.prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          actorType: data.actorType,
          actorId: data.actorId,
          previousState: data.previousState,
          newState: data.newState,
          changes: data.changes,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata,
          hash,
          previousHash,
        } as Prisma.AuditLogUncheckedCreateInput,
      });

      // Update sequence
      await this.prisma.auditLogSequence.upsert({
        where: { tenantId: data.tenantId },
        create: {
          tenantId: data.tenantId,
          lastEntryId: auditLog.id,
          lastHash: hash,
          entryCount: 1,
        },
        update: {
          lastEntryId: auditLog.id,
          lastHash: hash,
          entryCount: { increment: 1 },
        },
      });

      this.logger.debug(
        `Audit log created: ${data.action} ${data.entityType}:${data.entityId} by ${data.actorType}:${data.actorId || 'system'}`,
      );

      return auditLog;
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
      // Don't throw - audit logging should not break business operations
      return null;
    }
  }

  /**
   * Verify hash chain integrity
   *
   * @param organisationId Organisation ID
   * @param limit Number of recent entries to verify
   * @returns Verification result
   */
  async verifyHashChain(organisationId: string, limit = 1000) {
    const entries = await this.prisma.auditLog.findMany({
      where: { tenantId: organisationId },
      orderBy: { timestamp: 'asc' },
      take: limit,
    });

    let previousHash: string | null = null;
    const brokenChains: Array<{ id: string; reason: string }> = [];

    for (const entry of entries) {
      // Verify previous hash matches
      if (entry.previousHash !== previousHash) {
        brokenChains.push({
          id: entry.id,
          reason: `Expected previousHash=${previousHash}, got ${entry.previousHash}`,
        });
      }

      previousHash = entry.hash;
    }

    return {
      verified: brokenChains.length === 0,
      entriesChecked: entries.length,
      brokenChains,
    };
  }
}
