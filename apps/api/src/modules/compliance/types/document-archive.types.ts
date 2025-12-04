/**
 * Document Archive Types
 * Types and interfaces for GoBD-compliant document archiving
 */

import { RetentionCategory, ArchiveStatus } from '@prisma/client';

/**
 * DTO for archiving a document
 */
export interface ArchiveDocumentDto {
  tenantId: string;
  file: Buffer; // File content
  filename: string;
  mimeType: string;
  retentionCategory: RetentionCategory;
  entityType?: string; // Optional link to entity (Invoice, Expense, etc.)
  entityId?: string;
  uploadedBy: string; // User ID
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Archived document response
 */
export interface ArchivedDocument {
  id: string;
  organisationId: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  contentHash: string;
  storagePath: string;
  status: ArchiveStatus;
  retentionCategory: RetentionCategory;
  archivedAt: Date;
  retentionEndDate: Date;
  lastAccessedAt?: Date;
  lastVerifiedAt?: Date;
  verificationResult?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  tags: string[];
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document version history entry
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  changeReason?: string;
  previousHash?: string;
  archivedAt: Date;
  archivedBy: string;
  retentionDate: Date;
  storagePath?: string;
  contentHash: string;
  createdAt: Date;
}

/**
 * Search query for archived documents
 */
export interface ArchiveSearchQuery {
  tenantId: string;
  filename?: string; // Partial match
  mimeType?: string;
  retentionCategory?: RetentionCategory;
  status?: ArchiveStatus;
  entityType?: string;
  entityId?: string;
  tags?: string[];
  uploadedBy?: string;
  archivedAfter?: Date;
  archivedBefore?: Date;
  minSize?: number;
  maxSize?: number;
  limit?: number;
  offset?: number;
}

/**
 * Document integrity verification result
 */
export interface DocumentIntegrityResult {
  documentId: string;
  valid: boolean;
  contentHashMatch: boolean;
  encryptionValid: boolean;
  chainIntegrityValid: boolean; // From hash chain service
  verifiedAt: Date;
  error?: string;
  details?: {
    expectedHash?: string;
    actualHash?: string;
    corruptionType?: 'CONTENT' | 'ENCRYPTION' | 'CHAIN' | 'MISSING';
  };
}

/**
 * Export options for archived documents
 */
export interface ExportOptions {
  format: 'zip' | 'tar'; // Archive format
  includeMetadata?: boolean; // Include metadata JSON files
  includeVersionHistory?: boolean; // Include all versions
  retentionCategories?: RetentionCategory[]; // Filter by categories
  startDate?: Date;
  endDate?: Date;
  entityTypes?: string[];
}

/**
 * Export result
 */
export interface ExportResult {
  exportId: string;
  tenantId: string;
  format: string;
  filePath: string; // Path to generated export archive
  fileSize: number;
  documentCount: number;
  totalVersions: number;
  checksum: string; // SHA-256 of export file
  exportedAt: Date;
  expiresAt: Date; // When export file will be deleted
  metadata?: {
    retentionCategories?: RetentionCategory[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

/**
 * Retention period configuration
 */
export interface RetentionPeriod {
  category: RetentionCategory;
  years: number;
  description: string;
}

/**
 * Standard retention periods per GoBD
 */
export const RETENTION_PERIODS: Record<RetentionCategory, number> = {
  TAX_RELEVANT: 10, // 10 years for tax documents
  BUSINESS: 6, // 6 years for business documents
  CORRESPONDENCE: 6, // 6 years for correspondence
  HR: 10, // 10 years for HR documents (conservative)
  LEGAL: 30, // 30 years for legal documents
  TEMPORARY: 1, // 1 year for temporary documents
};

/**
 * Encryption metadata
 */
export interface EncryptionMetadata {
  algorithm: 'aes-256-gcm';
  iv: Buffer;
  authTag: Buffer;
  keyId?: string; // Reference to key if using key management system
}

/**
 * Storage path configuration
 */
export interface StorageConfig {
  baseDir: string; // Base directory for archives
  pathTemplate: string; // Template for storage path (e.g., "{tenantId}/{year}/{month}/{hash}")
  encryptionKey: string; // Master encryption key (from env)
}

/**
 * Document retrieval options
 */
export interface RetrievalOptions {
  decrypt?: boolean; // Whether to decrypt content (default: true)
  updateAccessTime?: boolean; // Update lastAccessedAt (default: true)
  includeVersions?: boolean; // Include version history
}

/**
 * Retrieved document with content
 */
export interface RetrievedDocument extends ArchivedDocument {
  content?: Buffer; // Decrypted file content (if decrypt = true)
  versions?: DocumentVersion[];
}
