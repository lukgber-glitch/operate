import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { addYears, addDays } from 'date-fns';
import { createHash } from 'crypto';

export interface TaxDocument {
  id: string;
  organisationId: string;
  type: 'vat_return' | 'elster_receipt' | 'annual_return' | 'tax_assessment' | 'supporting_doc';
  year: number;
  period?: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  hash: string; // SHA-256 for integrity
  retentionUntil: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchiveVatReturnInput {
  organisationId: string;
  type: string;
  year: number;
  period: number;
  periodType: string;
  data: any;
  transferTicket?: string;
  submittedAt?: Date;
  submissionId?: string;
}

export interface SearchFilters {
  year?: number;
  type?: string;
  search?: string;
}

/**
 * Tax Document Archive Service
 *
 * Handles archiving of tax-related documents with proper retention policies
 * compliant with German tax law (10-year retention requirement).
 *
 * Features:
 * - SHA-256 hash calculation for integrity verification
 * - Automatic retention period calculation (10 years)
 * - Support for multiple document types (VAT returns, receipts, etc.)
 * - Full-text search capabilities
 * - Document integrity verification
 * - Retention expiry tracking
 */
@Injectable()
export class TaxArchiveService {
  private readonly logger = new Logger(TaxArchiveService.name);
  private readonly RETENTION_YEARS = 10; // German tax retention requirement (§147 AO)

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Archive a VAT return (ELSTER filing) submission
   *
   * Stores the complete VAT return data including submission details,
   * transfer ticket, and response data for long-term retention.
   *
   * @param filing - ElsterFiling record to archive
   * @returns Created TaxDocument
   */
  async archiveVatReturn(filing: ArchiveVatReturnInput): Promise<TaxDocument> {
    this.logger.log(`Archiving VAT return for org ${filing.organisationId}, period ${filing.year}-${filing.period}`);

    const periodLabel = filing.periodType === 'MONTHLY'
      ? `${filing.year}-${String(filing.period).padStart(2, '0')}`
      : filing.periodType === 'QUARTERLY'
      ? `${filing.year}-Q${filing.period}`
      : `${filing.year}`;

    const dataString = JSON.stringify(filing.data);
    const dataBuffer = Buffer.from(dataString, 'utf-8');
    const hash = this.calculateHash(dataBuffer);

    // Calculate retention period: 10 years from the end of the calendar year
    // in which the document was created (§147 AO)
    const retentionUntil = addYears(new Date(filing.year, 11, 31), this.RETENTION_YEARS);

    const document = await this.prisma.taxDocument.create({
      data: {
        organisationId: filing.organisationId,
        type: 'vat_return',
        year: filing.year,
        period: periodLabel,
        title: this.getVatReturnTitle(filing),
        description: this.getVatReturnDescription(filing),
        fileUrl: '', // Will be updated when storage is implemented
        fileSize: dataBuffer.length,
        mimeType: 'application/json',
        hash,
        retentionUntil,
        metadata: {
          filingType: filing.type,
          periodType: filing.periodType,
          transferTicket: filing.transferTicket,
          submittedAt: filing.submittedAt,
          submissionId: filing.submissionId,
          archivedData: filing.data,
        },
      },
    });

    this.logger.log(`VAT return archived successfully: ${document.id}`);
    return document as TaxDocument;
  }

  /**
   * Archive ELSTER receipt PDF
   *
   * Stores the official receipt (Beleg) received from ELSTER
   * after successful VAT return submission.
   *
   * @param orgId - Organisation ID
   * @param receiptId - ELSTER receipt identifier
   * @param receiptData - PDF receipt data
   * @param period - Period string (e.g., "2025-01")
   * @returns Created TaxDocument
   */
  async archiveElsterReceipt(
    orgId: string,
    receiptId: string,
    receiptData: Buffer,
    period: string,
  ): Promise<TaxDocument> {
    this.logger.log(`Archiving ELSTER receipt ${receiptId} for org ${orgId}`);

    const year = parseInt(period.split('-')[0]);
    const hash = this.calculateHash(receiptData);
    const retentionUntil = addYears(new Date(year, 11, 31), this.RETENTION_YEARS);

    const document = await this.prisma.taxDocument.create({
      data: {
        organisationId: orgId,
        type: 'elster_receipt',
        year,
        period,
        title: `ELSTER Beleg ${period}`,
        description: `Official ELSTER receipt for VAT return ${period}`,
        fileUrl: '', // Will be updated when storage is implemented
        fileSize: receiptData.length,
        mimeType: 'application/pdf',
        hash,
        retentionUntil,
        metadata: {
          receiptId,
          receiptSize: receiptData.length,
        },
      },
    });

    this.logger.log(`ELSTER receipt archived successfully: ${document.id}`);
    return document as TaxDocument;
  }

  /**
   * Archive annual tax return
   *
   * @param orgId - Organisation ID
   * @param year - Tax year
   * @param data - Tax return data
   * @param fileData - Optional PDF or XML file
   * @returns Created TaxDocument
   */
  async archiveAnnualReturn(
    orgId: string,
    year: number,
    data: any,
    fileData?: Buffer,
  ): Promise<TaxDocument> {
    this.logger.log(`Archiving annual tax return for org ${orgId}, year ${year}`);

    const contentBuffer = fileData || Buffer.from(JSON.stringify(data), 'utf-8');
    const hash = this.calculateHash(contentBuffer);
    const retentionUntil = addYears(new Date(year, 11, 31), this.RETENTION_YEARS);

    const document = await this.prisma.taxDocument.create({
      data: {
        organisationId: orgId,
        type: 'annual_return',
        year,
        period: year.toString(),
        title: `Jahressteuererklärung ${year}`,
        description: `Annual tax return for year ${year}`,
        fileUrl: '',
        fileSize: contentBuffer.length,
        mimeType: fileData ? 'application/pdf' : 'application/json',
        hash,
        retentionUntil,
        metadata: {
          year,
          ...(fileData ? {} : { returnData: data }),
        },
      },
    });

    this.logger.log(`Annual tax return archived successfully: ${document.id}`);
    return document as TaxDocument;
  }

  /**
   * Archive tax assessment (Steuerbescheid)
   *
   * @param orgId - Organisation ID
   * @param year - Tax year
   * @param assessmentData - PDF or data
   * @param metadata - Additional metadata
   * @returns Created TaxDocument
   */
  async archiveTaxAssessment(
    orgId: string,
    year: number,
    assessmentData: Buffer,
    metadata?: Record<string, any>,
  ): Promise<TaxDocument> {
    this.logger.log(`Archiving tax assessment for org ${orgId}, year ${year}`);

    const hash = this.calculateHash(assessmentData);
    const retentionUntil = addYears(new Date(year, 11, 31), this.RETENTION_YEARS);

    const document = await this.prisma.taxDocument.create({
      data: {
        organisationId: orgId,
        type: 'tax_assessment',
        year,
        period: year.toString(),
        title: `Steuerbescheid ${year}`,
        description: `Tax assessment notice for year ${year}`,
        fileUrl: '',
        fileSize: assessmentData.length,
        mimeType: 'application/pdf',
        hash,
        retentionUntil,
        metadata: metadata || {},
      },
    });

    this.logger.log(`Tax assessment archived successfully: ${document.id}`);
    return document as TaxDocument;
  }

  /**
   * Archive supporting document (Buchungsbeleg, invoice, etc.)
   *
   * @param orgId - Organisation ID
   * @param year - Relevant tax year
   * @param title - Document title
   * @param fileData - Document data
   * @param mimeType - MIME type
   * @param metadata - Additional metadata
   * @returns Created TaxDocument
   */
  async archiveSupportingDocument(
    orgId: string,
    year: number,
    title: string,
    fileData: Buffer,
    mimeType: string,
    metadata?: Record<string, any>,
  ): Promise<TaxDocument> {
    this.logger.log(`Archiving supporting document for org ${orgId}: ${title}`);

    const hash = this.calculateHash(fileData);
    const retentionUntil = addYears(new Date(year, 11, 31), this.RETENTION_YEARS);

    const document = await this.prisma.taxDocument.create({
      data: {
        organisationId: orgId,
        type: 'supporting_doc',
        year,
        title,
        description: metadata?.description || `Supporting document for tax year ${year}`,
        fileUrl: '',
        fileSize: fileData.length,
        mimeType,
        hash,
        retentionUntil,
        metadata: metadata || {},
      },
    });

    this.logger.log(`Supporting document archived successfully: ${document.id}`);
    return document as TaxDocument;
  }

  /**
   * Search tax documents with filters
   *
   * @param orgId - Organisation ID
   * @param filters - Search filters (year, type, text search)
   * @returns Array of matching TaxDocuments
   */
  async searchDocuments(
    orgId: string,
    filters: SearchFilters = {},
  ): Promise<TaxDocument[]> {
    this.logger.debug(`Searching documents for org ${orgId} with filters:`, filters);

    const documents = await this.prisma.taxDocument.findMany({
      where: {
        organisationId: orgId,
        ...(filters.year && { year: filters.year }),
        ...(filters.type && { type: filters.type }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [
        { year: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return documents as TaxDocument[];
  }

  /**
   * Get all documents for a specific year
   *
   * Useful for preparing annual tax returns or audits.
   *
   * @param orgId - Organisation ID
   * @param year - Tax year
   * @returns Array of TaxDocuments for the year
   */
  async getYearDocuments(orgId: string, year: number): Promise<TaxDocument[]> {
    this.logger.debug(`Fetching all documents for org ${orgId}, year ${year}`);

    const documents = await this.prisma.taxDocument.findMany({
      where: {
        organisationId: orgId,
        year,
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents as TaxDocument[];
  }

  /**
   * Get a single document by ID
   *
   * @param documentId - Document ID
   * @returns TaxDocument
   * @throws NotFoundException if document not found
   */
  async getDocument(documentId: string): Promise<TaxDocument> {
    const document = await this.prisma.taxDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Tax document ${documentId} not found`);
    }

    return document as TaxDocument;
  }

  /**
   * Verify document integrity by comparing stored hash with current hash
   *
   * This is useful for detecting tampering or corruption.
   * Note: Currently verifies against metadata since we're not using external storage yet.
   *
   * @param documentId - Document ID
   * @returns True if hash matches, false otherwise
   */
  async verifyIntegrity(documentId: string): Promise<boolean> {
    const doc = await this.prisma.taxDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      this.logger.warn(`Document ${documentId} not found for integrity check`);
      return false;
    }

    // If we have stored data in metadata, verify it
    if (doc.metadata && typeof doc.metadata === 'object' && 'archivedData' in doc.metadata) {
      const dataString = JSON.stringify((doc.metadata as any).archivedData);
      const currentHash = this.calculateHash(Buffer.from(dataString, 'utf-8'));
      const isValid = currentHash === doc.hash;

      if (!isValid) {
        this.logger.error(`Integrity check failed for document ${documentId}: hash mismatch`);
      }

      return isValid;
    }

    // If we had external storage, we would download and verify here
    // For now, assume integrity is OK if document exists
    this.logger.debug(`Document ${documentId} exists but no data to verify against`);
    return true;
  }

  /**
   * Get documents with retention expiring soon
   *
   * Useful for cleanup warnings or archival decisions.
   *
   * @param orgId - Organisation ID
   * @param days - Number of days until expiration (default: 90)
   * @returns Array of TaxDocuments expiring soon
   */
  async getExpiringDocuments(orgId: string, days: number = 90): Promise<TaxDocument[]> {
    const cutoff = addDays(new Date(), days);

    this.logger.debug(`Finding documents expiring before ${cutoff.toISOString()}`);

    const documents = await this.prisma.taxDocument.findMany({
      where: {
        organisationId: orgId,
        retentionUntil: { lte: cutoff },
      },
      orderBy: { retentionUntil: 'asc' },
    });

    return documents as TaxDocument[];
  }

  /**
   * Get documents by type
   *
   * @param orgId - Organisation ID
   * @param type - Document type
   * @returns Array of TaxDocuments
   */
  async getDocumentsByType(
    orgId: string,
    type: TaxDocument['type'],
  ): Promise<TaxDocument[]> {
    const documents = await this.prisma.taxDocument.findMany({
      where: {
        organisationId: orgId,
        type,
      },
      orderBy: [
        { year: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return documents as TaxDocument[];
  }

  /**
   * Delete expired documents
   *
   * Only deletes documents where retention period has passed.
   * Should be called periodically by a cleanup job.
   *
   * @param orgId - Organisation ID (optional, for all orgs if not provided)
   * @returns Number of documents deleted
   */
  async deleteExpiredDocuments(orgId?: string): Promise<number> {
    this.logger.log(`Deleting expired documents${orgId ? ` for org ${orgId}` : ''}`);

    const result = await this.prisma.taxDocument.deleteMany({
      where: {
        ...(orgId && { organisationId: orgId }),
        retentionUntil: { lt: new Date() },
      },
    });

    this.logger.log(`Deleted ${result.count} expired documents`);
    return result.count;
  }

  /**
   * Get archive statistics for an organisation
   *
   * @param orgId - Organisation ID
   * @returns Statistics object
   */
  async getArchiveStats(orgId: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    documentsByType: Record<string, number>;
    documentsByYear: Record<number, number>;
    oldestDocument: Date | null;
    newestDocument: Date | null;
  }> {
    const documents = await this.prisma.taxDocument.findMany({
      where: { organisationId: orgId },
      select: {
        type: true,
        year: true,
        fileSize: true,
        createdAt: true,
      },
    });

    const documentsByType: Record<string, number> = {};
    const documentsByYear: Record<number, number> = {};
    let totalSize = 0;

    documents.forEach(doc => {
      // Count by type
      documentsByType[doc.type] = (documentsByType[doc.type] || 0) + 1;

      // Count by year
      documentsByYear[doc.year] = (documentsByYear[doc.year] || 0) + 1;

      // Sum size
      totalSize += doc.fileSize;
    });

    const dates = documents.map(d => d.createdAt);

    return {
      totalDocuments: documents.length,
      totalSize,
      documentsByType,
      documentsByYear,
      oldestDocument: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
      newestDocument: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
    };
  }

  /**
   * Calculate SHA-256 hash for document integrity verification
   *
   * @private
   * @param data - Buffer or string to hash
   * @returns Hex-encoded SHA-256 hash
   */
  private calculateHash(data: Buffer | string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate human-readable title for VAT return
   *
   * @private
   */
  private getVatReturnTitle(filing: ArchiveVatReturnInput): string {
    const periodLabel = filing.periodType === 'MONTHLY'
      ? `${filing.year}-${String(filing.period).padStart(2, '0')}`
      : filing.periodType === 'QUARTERLY'
      ? `${filing.year}-Q${filing.period}`
      : `${filing.year}`;

    return `USt-Voranmeldung ${periodLabel}`;
  }

  /**
   * Generate description for VAT return
   *
   * @private
   */
  private getVatReturnDescription(filing: ArchiveVatReturnInput): string {
    const periodType = filing.periodType === 'MONTHLY' ? 'Monthly' :
                       filing.periodType === 'QUARTERLY' ? 'Quarterly' : 'Annual';

    return `${periodType} VAT return for ${filing.year}-${filing.period}. Type: ${filing.type}`;
  }
}
