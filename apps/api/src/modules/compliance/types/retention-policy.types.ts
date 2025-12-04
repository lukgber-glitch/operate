/**
 * Retention Policy Types
 * Types and interfaces for GoBD-compliant retention policy enforcement
 */

import { RetentionCategory, ArchiveStatus } from '@prisma/client';

/**
 * Retention policy report
 */
export interface RetentionReport {
  tenantId: string;
  generatedAt: Date;
  summary: {
    totalDocuments: number;
    activeDocuments: number;
    expiredDocuments: number;
    documentsOnHold: number;
    documentsInGracePeriod: number;
  };
  byCategory: Record<
    RetentionCategory,
    {
      total: number;
      active: number;
      expired: number;
      onHold: number;
      nearingExpiration: number; // Within 90 days
    }
  >;
  complianceStatus: {
    compliant: boolean;
    issues: string[];
    warnings: string[];
  };
}

/**
 * Expired document information
 */
export interface ExpiredDocument {
  id: string;
  organisationId: string;
  originalFilename: string;
  retentionCategory: RetentionCategory;
  retentionEndDate: Date;
  daysOverdue: number;
  hasLegalHold: boolean;
  legalHoldReason?: string;
  entityType?: string;
  entityId?: string;
  archivedAt: Date;
  lastAccessedAt?: Date;
  fileSizeBytes: number;
  gracePeriodEndsAt: Date; // 90 days after retention end
  canDelete: boolean; // True if past grace period and no hold
}

/**
 * Document processing result
 */
export interface ProcessingResult {
  tenantId: string;
  processedAt: Date;
  documentsReviewed: number;
  documentsMarkedForDeletion: number;
  documentsDeleted: number;
  documentsSkipped: number; // Due to holds or grace period
  errors: ProcessingError[];
  summary: {
    storageFreed: number; // Bytes
    oldestDocumentDeleted?: Date;
    newestDocumentDeleted?: Date;
  };
}

/**
 * Processing error
 */
export interface ProcessingError {
  documentId: string;
  filename: string;
  error: string;
  timestamp: Date;
}

/**
 * Retention hold information
 */
export interface RetentionHold {
  id: string;
  documentId: string;
  reason: string;
  placedBy: string;
  placedAt: Date;
  releasedAt?: Date;
  isActive: boolean;
}

/**
 * Annual retention report
 */
export interface AnnualRetentionReport {
  tenantId: string;
  year: number;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  statistics: {
    documentsArchived: number;
    documentsDeleted: number;
    documentsOnHold: number;
    totalStorageUsed: number; // Bytes
    storageFreed: number; // Bytes
  };
  byCategory: Record<
    RetentionCategory,
    {
      archived: number;
      deleted: number;
      active: number;
      averageRetentionDays: number;
    }
  >;
  legalHolds: {
    total: number;
    active: number;
    released: number;
    averageDuration: number; // Days
  };
  complianceEvents: ComplianceEvent[];
}

/**
 * Compliance event for audit trail
 */
export interface ComplianceEvent {
  type: 'DOCUMENT_EXPIRED' | 'DOCUMENT_DELETED' | 'HOLD_PLACED' | 'HOLD_RELEASED' | 'INTEGRITY_FAILED';
  timestamp: Date;
  documentId: string;
  details: Record<string, any>;
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

/**
 * Deletion confirmation request
 */
export interface DeletionConfirmation {
  documentIds: string[];
  confirmedBy: string;
  confirmedAt: Date;
  reason?: string;
}

/**
 * GoBD retention periods (updated 2025)
 */
export const GOBD_RETENTION_PERIODS: Record<RetentionCategory, { years: number; description: string }> = {
  TAX_RELEVANT: {
    years: 10,
    description: 'Tax-relevant documents (invoices, receipts, tax returns) - increased from 8 years in 2024',
  },
  BUSINESS: {
    years: 6,
    description: 'Business documents (contracts, correspondence)',
  },
  CORRESPONDENCE: {
    years: 6,
    description: 'General business correspondence',
  },
  HR: {
    years: 10,
    description: 'HR documents (employment contracts, payslips)',
  },
  LEGAL: {
    years: 30,
    description: 'Legal documents requiring long-term retention',
  },
  TEMPORARY: {
    years: 1,
    description: 'Temporary documents (working drafts, internal notes)',
  },
};

/**
 * Grace period configuration
 */
export const GRACE_PERIOD_DAYS = 90; // Days after expiration before deletion allowed

/**
 * Deletion review status
 */
export type DeletionStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'DELETED';

/**
 * Document deletion record
 */
export interface DocumentDeletionRecord {
  documentId: string;
  filename: string;
  retentionCategory: RetentionCategory;
  retentionEndDate: Date;
  deletedAt: Date;
  deletedBy: string;
  reason: string;
  gracePeriodRespected: boolean;
  hadLegalHold: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}
