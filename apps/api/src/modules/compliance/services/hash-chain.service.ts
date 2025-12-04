/**
 * Hash Chain Service
 * Implements GoBD-compliant hash chain for immutable audit logging
 *
 * Features:
 * - SHA-256 hash generation for audit entries
 * - Hash chain integrity verification
 * - Transaction-safe entry creation
 * - Chain recovery and rebuilding
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditLog, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import {
  CreateAuditEntryDto,
  AuditEntryPayload,
  ChainIntegrityResult,
  VerifyChainOptions,
} from '../types/hash-chain.types';

@Injectable()
export class HashChainService {
  private readonly logger = new Logger(HashChainService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new audit entry with hash chain
   * Atomically creates the entry and updates the sequence
   *
   * @param data - Audit entry data
   * @returns Created audit log entry
   */
  async createEntry(data: CreateAuditEntryDto): Promise<AuditLog> {
    this.logger.debug(
      `Creating audit entry for tenant ${data.tenantId}, entity ${data.entityType}:${data.entityId}, action ${data.action}`
    );

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Get the last hash for this tenant
      const lastHash = await this.getLastHashInTransaction(tx, data.tenantId);

      // Prepare timestamp
      const timestamp = new Date();

      // Generate hash for this entry
      const payload: AuditEntryPayload = {
        tenantId: data.tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        previousState: data.previousState,
        newState: data.newState,
        timestamp,
        previousHash: lastHash,
        actorType: data.actorType,
        actorId: data.actorId,
      };

      const hash = this.generateHash(payload);

      // Create the audit log entry
      const auditLog = await tx.auditLog.create({
        data: {
          tenantId: data.tenantId,
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          previousState: data.previousState as Prisma.JsonValue,
          newState: data.newState as Prisma.JsonValue,
          changes: data.changes as Prisma.JsonValue,
          actorType: data.actorType,
          actorId: data.actorId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp,
          hash,
          previousHash: lastHash,
          metadata: data.metadata as Prisma.JsonValue,
        },
      });

      // Update or create the sequence tracker
      await tx.auditLogSequence.upsert({
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

      this.logger.log(
        `Created audit entry ${auditLog.id} for tenant ${data.tenantId} with hash ${hash.substring(0, 16)}...`
      );

      return auditLog;
    });
  }

  /**
   * Generate SHA-256 hash for an audit entry
   * Hash includes all critical fields to ensure immutability
   *
   * @param entry - Entry payload
   * @returns SHA-256 hash in hexadecimal
   */
  generateHash(entry: AuditEntryPayload): string {
    // Create a deterministic string representation
    const hashInput = JSON.stringify({
      tenantId: entry.tenantId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      previousState: entry.previousState,
      newState: entry.newState,
      timestamp: entry.timestamp.toISOString(),
      previousHash: entry.previousHash,
      actorType: entry.actorType,
      actorId: entry.actorId,
    });

    // Generate SHA-256 hash
    const hash = createHash('sha256').update(hashInput).digest('hex');

    return hash;
  }

  /**
   * Verify the integrity of the hash chain for a tenant
   * Checks that each entry's hash matches and links correctly
   *
   * @param tenantId - Tenant ID
   * @param options - Verification options (range, etc.)
   * @returns Integrity verification result
   */
  async verifyChainIntegrity(
    tenantId: string,
    options?: VerifyChainOptions
  ): Promise<ChainIntegrityResult> {
    this.logger.debug(`Verifying hash chain integrity for tenant ${tenantId}`);

    try {
      // Build query for entries to verify
      const where: Prisma.AuditLogWhereInput = { tenantId };

      // Add range filters if specified
      if (options?.startId || options?.endId) {
        where.id = {};
        if (options.startId) {
          where.id.gte = options.startId;
        }
        if (options.endId) {
          where.id.lte = options.endId;
        }
      }

      // Fetch all entries in chronological order
      const entries = await this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'asc' },
      });

      if (entries.length === 0) {
        return {
          valid: true,
          totalEntries: 0,
          verifiedEntries: 0,
        };
      }

      let verifiedCount = 0;
      let previousHash: string | null = null;

      // Verify each entry
      for (const entry of entries) {
        // Check if previousHash matches
        if (entry.previousHash !== previousHash) {
          this.logger.warn(
            `Chain break at entry ${entry.id}: expected previousHash ${previousHash}, got ${entry.previousHash}`
          );

          return {
            valid: false,
            totalEntries: entries.length,
            verifiedEntries: verifiedCount,
            firstInvalidEntryId: entry.id,
            error: 'Previous hash mismatch',
            details: {
              expectedHash: previousHash || 'null',
              actualHash: entry.previousHash || 'null',
              entryId: entry.id,
            },
          };
        }

        // Recalculate hash for this entry
        const payload: AuditEntryPayload = {
          tenantId: entry.tenantId,
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          previousState: entry.previousState as object | undefined,
          newState: entry.newState as object | undefined,
          timestamp: entry.timestamp,
          previousHash: entry.previousHash,
          actorType: entry.actorType,
          actorId: entry.actorId || undefined,
        };

        const calculatedHash = this.generateHash(payload);

        // Verify hash matches
        if (calculatedHash !== entry.hash) {
          this.logger.warn(
            `Hash mismatch at entry ${entry.id}: expected ${calculatedHash}, got ${entry.hash}`
          );

          return {
            valid: false,
            totalEntries: entries.length,
            verifiedEntries: verifiedCount,
            firstInvalidEntryId: entry.id,
            error: 'Hash mismatch - entry may have been tampered with',
            details: {
              expectedHash: calculatedHash,
              actualHash: entry.hash,
              entryId: entry.id,
            },
          };
        }

        // Move to next entry
        previousHash = entry.hash;
        verifiedCount++;

        // Stop on first error if requested
        if (options?.stopOnFirstError && verifiedCount < entries.length) {
          // Already would have returned if error found
        }
      }

      this.logger.log(
        `Hash chain verified for tenant ${tenantId}: ${verifiedCount}/${entries.length} entries valid`
      );

      return {
        valid: true,
        totalEntries: entries.length,
        verifiedEntries: verifiedCount,
      };
    } catch (error) {
      this.logger.error(
        `Error verifying hash chain for tenant ${tenantId}:`,
        error
      );

      return {
        valid: false,
        totalEntries: 0,
        verifiedEntries: 0,
        error: error.message || 'Unknown error during verification',
      };
    }
  }

  /**
   * Get the last hash in the chain for a tenant
   * Used when creating new entries
   *
   * @param tenantId - Tenant ID
   * @returns Last hash or null if chain is empty
   */
  async getLastHash(tenantId: string): Promise<string | null> {
    const sequence = await this.prisma.auditLogSequence.findUnique({
      where: { tenantId },
      select: { lastHash: true },
    });

    return sequence?.lastHash || null;
  }

  /**
   * Get last hash within a transaction
   * Private helper to support transactional entry creation
   *
   * @param tx - Prisma transaction client
   * @param tenantId - Tenant ID
   * @returns Last hash or null
   */
  private async getLastHashInTransaction(
    tx: Prisma.TransactionClient,
    tenantId: string
  ): Promise<string | null> {
    const sequence = await tx.auditLogSequence.findUnique({
      where: { tenantId },
      select: { lastHash: true },
    });

    return sequence?.lastHash || null;
  }

  /**
   * Rebuild the chain sequence for a tenant
   * Used for recovery after data corruption or migration
   * WARNING: This is a heavy operation and should be used sparingly
   *
   * @param tenantId - Tenant ID
   */
  async rebuildChainSequence(tenantId: string): Promise<void> {
    this.logger.warn(
      `Rebuilding hash chain sequence for tenant ${tenantId}. This is a heavy operation.`
    );

    await this.prisma.$transaction(async (tx) => {
      // Get the last entry by timestamp
      const lastEntry = await tx.auditLog.findFirst({
        where: { tenantId },
        orderBy: { timestamp: 'desc' },
      });

      if (!lastEntry) {
        this.logger.warn(
          `No entries found for tenant ${tenantId}, deleting sequence if exists`
        );

        // Delete sequence if it exists
        await tx.auditLogSequence.deleteMany({
          where: { tenantId },
        });

        return;
      }

      // Count total entries
      const entryCount = await tx.auditLog.count({
        where: { tenantId },
      });

      // Update or create sequence
      await tx.auditLogSequence.upsert({
        where: { tenantId },
        create: {
          tenantId,
          lastEntryId: lastEntry.id,
          lastHash: lastEntry.hash,
          entryCount: BigInt(entryCount),
        },
        update: {
          lastEntryId: lastEntry.id,
          lastHash: lastEntry.hash,
          entryCount: BigInt(entryCount),
        },
      });

      this.logger.log(
        `Rebuilt sequence for tenant ${tenantId}: ${entryCount} entries, last hash ${lastEntry.hash.substring(0, 16)}...`
      );
    });
  }

  /**
   * Get statistics for a tenant's audit chain
   *
   * @param tenantId - Tenant ID
   * @returns Chain statistics
   */
  async getChainStats(tenantId: string) {
    const sequence = await this.prisma.auditLogSequence.findUnique({
      where: { tenantId },
    });

    if (!sequence) {
      return {
        entryCount: 0,
        lastEntryId: null,
        lastHash: null,
        updatedAt: null,
      };
    }

    return {
      entryCount: Number(sequence.entryCount),
      lastEntryId: sequence.lastEntryId,
      lastHash: sequence.lastHash,
      updatedAt: sequence.updatedAt,
    };
  }
}
