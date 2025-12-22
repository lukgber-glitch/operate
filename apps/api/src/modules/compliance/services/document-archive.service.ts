/**
 * Document Archive Service
 * Implements GoBD-compliant document archiving with encryption and hash chain integration
 *
 * Features:
 * - AES-256-GCM encryption at rest
 * - SHA-256 content hashing
 * - Immutable storage (no modifications allowed)
 * - Retention period enforcement
 * - Version tracking for re-archived documents
 * - Integration with HashChainService for audit trail
 * - Document integrity verification
 * - GoBD-compliant export for auditors
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HashChainService } from './hash-chain.service';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { AuditAction, AuditEntityType, AuditActorType, ArchiveStatus } from '@prisma/client';
import {
  ArchiveDocumentDto,
  ArchivedDocument,
  DocumentVersion,
  ArchiveSearchQuery,
  DocumentIntegrityResult,
  ExportOptions,
  ExportResult,
  RETENTION_PERIODS,
  EncryptionMetadata,
  RetrievalOptions,
  RetrievedDocument,
} from '../types/document-archive.types';

@Injectable()
export class DocumentArchiveService {
  private readonly logger = new Logger(DocumentArchiveService.name);
  private readonly algorithm = 'aes-256-gcm' as const;
  private readonly encryptionKey: Buffer;
  private readonly baseArchiveDir: string;
  private isConfigured: boolean = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashChain: HashChainService,
  ) {
    // Base directory for archives
    this.baseArchiveDir = process.env.ARCHIVE_BASE_DIR || './archives';

    // Get encryption key from environment (32 bytes for AES-256)
    const keyHex = process.env.ARCHIVE_ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      this.logger.warn(
        'Document Archive Service is disabled - ARCHIVE_ENCRYPTION_KEY not configured (requires 64 hex chars = 32 bytes)'
      );
      this.encryptionKey = Buffer.alloc(32); // Placeholder to avoid undefined errors
      return;
    }
    this.encryptionKey = Buffer.from(keyHex, 'hex');
    this.isConfigured = true;
    this.logger.log('Document Archive Service initialized with encryption enabled');
  }

  /**
   * Check if service is properly configured
   */
  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'Document Archive Service is not configured. Set ARCHIVE_ENCRYPTION_KEY environment variable.'
      );
    }
  }

  /**
   * Archive a document with GoBD compliance
   *
   * @param data - Document archiving data
   * @returns Archived document metadata
   */
  async archiveDocument(data: ArchiveDocumentDto): Promise<ArchivedDocument> {
    this.ensureConfigured();
    this.logger.debug(
      `Archiving document "${data.filename}" for tenant ${data.tenantId}, category: ${data.retentionCategory}`
    );

    try {
      // 1. Calculate content hash (before encryption)
      const contentHash = this.calculateHash(data.file);

      // 2. Check if document already exists (by hash)
      const existing = await this.prisma.archivedDocument.findUnique({
        where: { contentHash },
      });

      if (existing) {
        // Document already archived - create version entry
        this.logger.log(
          `Document with hash ${contentHash} already exists, creating version entry`
        );
        return this.createVersionEntry(existing, data);
      }

      // 3. Encrypt the file
      const { encrypted, iv, authTag } = this.encryptContent(data.file);

      // 4. Generate storage path
      const storagePath = this.generateStoragePath(data.tenantId, contentHash);

      // 5. Calculate retention end date
      const retentionEndDate = this.calculateRetentionEndDate(data.retentionCategory);

      // 6. Save encrypted file to disk
      await this.saveEncryptedFile(storagePath, encrypted);

      // 7. Create database entry
      const archived = await this.prisma.archivedDocument.create({
        data: {
          organisationId: data.tenantId,
          originalFilename: data.filename,
          mimeType: data.mimeType,
          fileSizeBytes: data.file.length,
          contentHash,
          storagePath,
          encryptionIv: iv,
          encryptionTag: authTag,
          status: ArchiveStatus.ACTIVE,
          retentionCategory: data.retentionCategory,
          retentionEndDate,
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: data.metadata || {},
          tags: data.tags || [],
          uploadedBy: data.uploadedBy,
        },
      });

      // 8. Create audit log entry via hash chain
      await this.hashChain.createEntry({
        tenantId: data.tenantId,
        entityType: AuditEntityType.DOCUMENT,
        entityId: archived.id,
        action: AuditAction.CREATE,
        actorType: AuditActorType.USER,
        actorId: data.uploadedBy,
        newState: {
          filename: data.filename,
          contentHash,
          retentionCategory: data.retentionCategory,
          retentionEndDate,
          entityType: data.entityType,
          entityId: data.entityId,
        },
        metadata: {
          operation: 'archive_document',
          fileSize: data.file.length,
          mimeType: data.mimeType,
        },
      });

      this.logger.log(
        `Successfully archived document ${archived.id} (hash: ${contentHash.substring(0, 16)}...) for tenant ${data.tenantId}`
      );

      return archived as ArchivedDocument;
    } catch (error) {
      this.logger.error(`Error archiving document: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to archive document: ${error.message}`);
    }
  }

  /**
   * Retrieve an archived document
   *
   * @param id - Document ID
   * @param tenantId - Tenant ID (for security)
   * @param options - Retrieval options
   * @returns Retrieved document with optional content
   */
  async retrieveDocument(
    id: string,
    tenantId: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievedDocument> {
    this.ensureConfigured();
    const {
      decrypt = true,
      updateAccessTime = true,
      includeVersions = false,
    } = options;

    this.logger.debug(`Retrieving document ${id} for tenant ${tenantId}`);

    // Fetch document
    const doc = await this.prisma.archivedDocument.findFirst({
      where: {
        id,
        organisationId: tenantId,
      },
      include: {
        versions: includeVersions
          ? {
              orderBy: { version: 'desc' },
            }
          : false,
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${id} not found for tenant ${tenantId}`);
    }

    if (doc.status !== ArchiveStatus.ACTIVE) {
      throw new BadRequestException(`Document ${id} is not active (status: ${doc.status})`);
    }

    // Prepare result
    const result: RetrievedDocument = {
      ...doc,
      versions: includeVersions ? (doc.versions as DocumentVersion[]) : undefined,
    };

    // Decrypt content if requested
    if (decrypt) {
      try {
        const encryptedContent = await fs.readFile(doc.storagePath);
        const decrypted = this.decryptContent(
          encryptedContent,
          doc.encryptionIv,
          doc.encryptionTag
        );
        result.content = decrypted;
      } catch (error) {
        this.logger.error(`Error decrypting document ${id}: ${error.message}`);
        throw new BadRequestException(`Failed to decrypt document: ${error.message}`);
      }
    }

    // Update access time if requested
    if (updateAccessTime) {
      await this.prisma.archivedDocument.update({
        where: { id },
        data: { lastAccessedAt: new Date() },
      });

      // Audit log for document retrieval
      await this.hashChain.createEntry({
        tenantId,
        entityType: AuditEntityType.DOCUMENT,
        entityId: id,
        action: AuditAction.VIEW,
        actorType: AuditActorType.USER,
        actorId: 'SYSTEM', // Should be passed from request context
        metadata: {
          operation: 'retrieve_document',
          decrypted: decrypt,
        },
      });
    }

    this.logger.debug(`Retrieved document ${id}`);
    return result;
  }

  /**
   * Search archived documents
   *
   * @param query - Search query
   * @returns List of matching archived documents
   */
  async searchArchive(query: ArchiveSearchQuery): Promise<ArchivedDocument[]> {
    this.ensureConfigured();
    this.logger.debug(`Searching archive for tenant ${query.tenantId}`);

    const where: any = {
      organisationId: query.tenantId,
    };

    // Apply filters
    if (query.filename) {
      where.originalFilename = { contains: query.filename, mode: 'insensitive' };
    }

    if (query.mimeType) {
      where.mimeType = query.mimeType;
    }

    if (query.retentionCategory) {
      where.retentionCategory = query.retentionCategory;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags };
    }

    if (query.uploadedBy) {
      where.uploadedBy = query.uploadedBy;
    }

    if (query.archivedAfter || query.archivedBefore) {
      where.archivedAt = {};
      if (query.archivedAfter) {
        where.archivedAt.gte = query.archivedAfter;
      }
      if (query.archivedBefore) {
        where.archivedAt.lte = query.archivedBefore;
      }
    }

    if (query.minSize || query.maxSize) {
      where.fileSizeBytes = {};
      if (query.minSize) {
        where.fileSizeBytes.gte = query.minSize;
      }
      if (query.maxSize) {
        where.fileSizeBytes.lte = query.maxSize;
      }
    }

    // Execute query
    const documents = await this.prisma.archivedDocument.findMany({
      where,
      orderBy: { archivedAt: 'desc' },
      take: query.limit || 100,
      skip: query.offset || 0,
    });

    this.logger.debug(`Found ${documents.length} documents matching search criteria`);
    return documents as ArchivedDocument[];
  }

  /**
   * Get version history for a document
   *
   * @param documentId - Document ID
   * @param tenantId - Tenant ID
   * @returns List of document versions
   */
  async getDocumentHistory(
    documentId: string,
    tenantId: string
  ): Promise<DocumentVersion[]> {
    this.ensureConfigured();
    this.logger.debug(`Fetching version history for document ${documentId}`);

    // Verify document belongs to tenant
    const doc = await this.prisma.archivedDocument.findFirst({
      where: {
        id: documentId,
        organisationId: tenantId,
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found for tenant ${tenantId}`);
    }

    // Fetch versions
    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
    });

    this.logger.debug(`Found ${versions.length} versions for document ${documentId}`);
    return versions as DocumentVersion[];
  }

  /**
   * Verify document integrity
   *
   * @param id - Document ID
   * @returns Integrity verification result
   */
  async verifyDocumentIntegrity(id: string): Promise<DocumentIntegrityResult> {
    this.ensureConfigured();
    this.logger.debug(`Verifying integrity of document ${id}`);

    try {
      // Fetch document
      const doc = await this.prisma.archivedDocument.findUnique({
        where: { id },
      });

      if (!doc) {
        return {
          documentId: id,
          valid: false,
          contentHashMatch: false,
          encryptionValid: false,
          chainIntegrityValid: false,
          verifiedAt: new Date(),
          error: 'Document not found',
        };
      }

      // 1. Check if file exists
      let fileExists = false;
      try {
        await fs.access(doc.storagePath);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      if (!fileExists) {
        await this.markDocumentCorrupted(id, 'MISSING');
        return {
          documentId: id,
          valid: false,
          contentHashMatch: false,
          encryptionValid: false,
          chainIntegrityValid: false,
          verifiedAt: new Date(),
          error: 'Archived file not found on disk',
          details: { corruptionType: 'MISSING' },
        };
      }

      // 2. Decrypt file
      let decrypted: Buffer;
      try {
        const encrypted = await fs.readFile(doc.storagePath);
        decrypted = this.decryptContent(encrypted, doc.encryptionIv, doc.encryptionTag);
      } catch (error) {
        await this.markDocumentCorrupted(id, 'ENCRYPTION');
        return {
          documentId: id,
          valid: false,
          contentHashMatch: false,
          encryptionValid: false,
          chainIntegrityValid: false,
          verifiedAt: new Date(),
          error: `Decryption failed: ${error.message}`,
          details: { corruptionType: 'ENCRYPTION' },
        };
      }

      // 3. Verify content hash
      const actualHash = this.calculateHash(decrypted);
      const contentHashMatch = actualHash === doc.contentHash;

      if (!contentHashMatch) {
        await this.markDocumentCorrupted(id, 'CONTENT');
        return {
          documentId: id,
          valid: false,
          contentHashMatch: false,
          encryptionValid: true,
          chainIntegrityValid: false,
          verifiedAt: new Date(),
          error: 'Content hash mismatch - document may have been tampered with',
          details: {
            expectedHash: doc.contentHash,
            actualHash,
            corruptionType: 'CONTENT',
          },
        };
      }

      // 4. Verify hash chain integrity for this document
      const chainResult = await this.hashChain.verifyChainIntegrity(doc.organisationId);

      // Update verification timestamp
      await this.prisma.archivedDocument.update({
        where: { id },
        data: {
          lastVerifiedAt: new Date(),
          verificationResult: 'VALID',
        },
      });

      this.logger.log(`Document ${id} integrity verified successfully`);

      return {
        documentId: id,
        valid: true,
        contentHashMatch: true,
        encryptionValid: true,
        chainIntegrityValid: chainResult.valid,
        verifiedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error verifying document ${id}: ${error.message}`);
      return {
        documentId: id,
        valid: false,
        contentHashMatch: false,
        encryptionValid: false,
        chainIntegrityValid: false,
        verifiedAt: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Export archive for auditors
   *
   * @param tenantId - Tenant ID
   * @param options - Export options
   * @returns Export result with file path
   */
  async exportArchive(tenantId: string, options: ExportOptions): Promise<ExportResult> {
    this.ensureConfigured();
    this.logger.log(
      `Creating archive export for tenant ${tenantId}, format: ${options.format}`
    );

    // Build query
    const where: any = {
      organisationId: tenantId,
      status: ArchiveStatus.ACTIVE,
    };

    if (options.retentionCategories && options.retentionCategories.length > 0) {
      where.retentionCategory = { in: options.retentionCategories };
    }

    if (options.startDate || options.endDate) {
      where.archivedAt = {};
      if (options.startDate) {
        where.archivedAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.archivedAt.lte = options.endDate;
      }
    }

    if (options.entityTypes && options.entityTypes.length > 0) {
      where.entityType = { in: options.entityTypes };
    }

    // Fetch documents
    const documents = await this.prisma.archivedDocument.findMany({
      where,
      include: {
        versions: options.includeVersionHistory || false,
      },
    });

    // TODO: Implement actual archive creation (ZIP/TAR)
    // This is a placeholder implementation
    const exportId = `export_${Date.now()}`;
    const exportPath = join(this.baseArchiveDir, 'exports', `${exportId}.${options.format}`);

    // Create export directory
    await fs.mkdir(dirname(exportPath), { recursive: true });

    // For now, just create a metadata file
    const metadata = {
      exportId,
      tenantId,
      exportedAt: new Date(),
      documentCount: documents.length,
      documents: documents.map((d) => ({
        id: d.id,
        filename: d.originalFilename,
        contentHash: d.contentHash,
        archivedAt: d.archivedAt,
      })),
    };

    await fs.writeFile(exportPath, JSON.stringify(metadata, null, 2));

    const stats = await fs.stat(exportPath);
    const checksum = this.calculateHash(await fs.readFile(exportPath));

    // Audit log
    await this.hashChain.createEntry({
      tenantId,
      entityType: AuditEntityType.DOCUMENT,
      entityId: exportId,
      action: AuditAction.EXPORT,
      actorType: AuditActorType.SYSTEM,
      metadata: {
        operation: 'export_archive',
        documentCount: documents.length,
        format: options.format,
      },
    });

    this.logger.log(`Created archive export ${exportId} with ${documents.length} documents`);

    return {
      exportId,
      tenantId,
      format: options.format,
      filePath: exportPath,
      fileSize: stats.size,
      documentCount: documents.length,
      totalVersions: documents.reduce((sum, d) => sum + (d.versions?.length || 0), 0),
      checksum,
      exportedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      metadata: {
        retentionCategories: options.retentionCategories,
        dateRange: options.startDate || options.endDate
          ? {
              start: options.startDate || new Date(0),
              end: options.endDate || new Date(),
            }
          : undefined,
      },
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate SHA-256 hash of content
   */
  private calculateHash(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Encrypt content using AES-256-GCM
   */
  private encryptContent(content: Buffer): EncryptionMetadata & { encrypted: Buffer } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      algorithm: this.algorithm,
      iv,
      authTag,
    };
  }

  /**
   * Decrypt content using AES-256-GCM
   */
  private decryptContent(encrypted: Buffer, iv: Buffer, authTag: Buffer): Buffer {
    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /**
   * Generate storage path for a document
   */
  private generateStoragePath(tenantId: string, contentHash: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const hashPrefix = contentHash.substring(0, 4);

    // Path: archives/{tenantId}/{year}/{month}/{hash-prefix}/{contentHash}.enc
    return join(
      this.baseArchiveDir,
      tenantId,
      String(year),
      month,
      hashPrefix,
      `${contentHash}.enc`
    );
  }

  /**
   * Calculate retention end date based on category
   */
  private calculateRetentionEndDate(category: string): Date {
    const years = RETENTION_PERIODS[category] || 10;
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + years);
    return endDate;
  }

  /**
   * Save encrypted file to disk
   */
  private async saveEncryptedFile(path: string, content: Buffer): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(dirname(path), { recursive: true });

    // Write file
    await fs.writeFile(path, content, { mode: 0o600 }); // Readable/writable by owner only
  }

  /**
   * Create version entry for re-archived document
   */
  private async createVersionEntry(
    existing: any,
    data: ArchiveDocumentDto
  ): Promise<ArchivedDocument> {
    // Get current version count
    const versionCount = await this.prisma.documentVersion.count({
      where: { documentId: existing.id },
    });

    const newVersion = versionCount + 1;

    // Create version entry
    await this.prisma.documentVersion.create({
      data: {
        documentId: existing.id,
        version: newVersion,
        changeReason: 'Document re-archived with same content',
        previousHash: existing.contentHash,
        archivedBy: data.uploadedBy,
        retentionDate: this.calculateRetentionEndDate(data.retentionCategory),
        contentHash: existing.contentHash,
      },
    });

    // Update document metadata
    const updated = await this.prisma.archivedDocument.update({
      where: { id: existing.id },
      data: {
        metadata: data.metadata || existing.metadata,
        tags: data.tags || existing.tags,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await this.hashChain.createEntry({
      tenantId: data.tenantId,
      entityType: AuditEntityType.DOCUMENT,
      entityId: existing.id,
      action: AuditAction.UPDATE,
      actorType: AuditActorType.USER,
      actorId: data.uploadedBy,
      metadata: {
        operation: 'create_version',
        version: newVersion,
      },
    });

    return updated as ArchivedDocument;
  }

  /**
   * Mark document as corrupted
   */
  private async markDocumentCorrupted(
    id: string,
    corruptionType: 'CONTENT' | 'ENCRYPTION' | 'MISSING'
  ): Promise<void> {
    await this.prisma.archivedDocument.update({
      where: { id },
      data: {
        status: ArchiveStatus.CORRUPTED,
        verificationResult: `CORRUPTED_${corruptionType}`,
        lastVerifiedAt: new Date(),
      },
    });

    this.logger.error(`Marked document ${id} as corrupted (type: ${corruptionType})`);
  }
}
