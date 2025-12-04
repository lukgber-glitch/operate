/**
 * Hash Chain Types
 * Type definitions for GoBD-compliant hash chain audit logging
 */

import { AuditEntityType, AuditAction, AuditActorType } from '@prisma/client';

/**
 * DTO for creating a new audit entry
 */
export interface CreateAuditEntryDto {
  // Tenant isolation
  tenantId: string;

  // Entity being audited
  entityType: AuditEntityType;
  entityId: string;

  // Action performed
  action: AuditAction;

  // State tracking
  previousState?: object;
  newState?: object;
  changes?: object;

  // Actor information
  actorType: AuditActorType;
  actorId?: string;

  // Request context
  ipAddress?: string;
  userAgent?: string;

  // Additional metadata
  metadata?: object;
}

/**
 * Payload used for hash generation
 * All fields that contribute to the hash
 */
export interface AuditEntryPayload {
  tenantId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  previousState?: object;
  newState?: object;
  timestamp: Date;
  previousHash: string | null;
  actorType: AuditActorType;
  actorId?: string;
}

/**
 * Result of hash chain integrity verification
 */
export interface ChainIntegrityResult {
  // Overall status
  valid: boolean;

  // Statistics
  totalEntries: number;
  verifiedEntries: number;

  // Error details (if invalid)
  firstInvalidEntryId?: string;
  error?: string;

  // Additional details
  details?: {
    expectedHash?: string;
    actualHash?: string;
    entryId?: string;
  };
}

/**
 * Options for chain verification
 */
export interface VerifyChainOptions {
  // Verify only a specific range
  startId?: string;
  endId?: string;

  // Stop on first error
  stopOnFirstError?: boolean;
}
