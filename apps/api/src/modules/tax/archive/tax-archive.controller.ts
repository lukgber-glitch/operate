import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TaxArchiveService, TaxDocument, SearchFilters } from './tax-archive.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Tax Archive Controller
 *
 * Provides REST API endpoints for accessing archived tax documents.
 *
 * All endpoints require authentication and automatically filter
 * by the user's organisation.
 *
 * Endpoints:
 * - GET /tax/archive - Search documents with filters
 * - GET /tax/archive/:id - Get specific document
 * - GET /tax/archive/:id/verify - Verify document integrity
 * - GET /tax/archive/year/:year - Get all documents for a year
 * - GET /tax/archive/stats - Get archive statistics
 * - GET /tax/archive/expiring - Get documents expiring soon
 */
@Controller('tax/archive')
@UseGuards(JwtAuthGuard)
export class TaxArchiveController {
  private readonly logger = new Logger(TaxArchiveController.name);

  constructor(private readonly archiveService: TaxArchiveService) {}

  /**
   * Search tax documents
   *
   * GET /tax/archive?year=2025&type=vat_return&search=Januar
   *
   * @param req - Request with user context
   * @param year - Filter by year
   * @param type - Filter by document type
   * @param search - Full-text search in title/description
   * @returns Array of matching documents
   */
  @Get()
  async getDocuments(
    @Request() req: any,
    @Query('year') year?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ): Promise<TaxDocument[]> {
    const orgId = req.user.organisationId;

    if (!orgId) {
      throw new HttpException(
        'Organisation ID not found in user context',
        HttpStatus.BAD_REQUEST,
      );
    }

    const filters: SearchFilters = {
      ...(year && { year: parseInt(year, 10) }),
      ...(type && { type }),
      ...(search && { search }),
    };

    this.logger.log(`Searching documents for org ${orgId}`, filters);

    return this.archiveService.searchDocuments(orgId, filters);
  }

  /**
   * Get a specific document by ID
   *
   * GET /tax/archive/:id
   *
   * @param req - Request with user context
   * @param id - Document ID
   * @returns TaxDocument
   */
  @Get(':id')
  async getDocument(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<TaxDocument> {
    const orgId = req.user.organisationId;

    this.logger.log(`Fetching document ${id} for org ${orgId}`);

    const document = await this.archiveService.getDocument(id);

    // Verify user has access to this document
    if (document.organisationId !== orgId) {
      throw new HttpException(
        'Access denied to this document',
        HttpStatus.FORBIDDEN,
      );
    }

    return document;
  }

  /**
   * Verify document integrity
   *
   * GET /tax/archive/:id/verify
   *
   * Checks if the document hash matches the stored content.
   *
   * @param req - Request with user context
   * @param id - Document ID
   * @returns Object with verification result
   */
  @Get(':id/verify')
  async verifyIntegrity(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<{ valid: boolean; documentId: string; checkedAt: Date }> {
    const orgId = req.user.organisationId;

    this.logger.log(`Verifying integrity of document ${id}`);

    const document = await this.archiveService.getDocument(id);

    // Verify user has access to this document
    if (document.organisationId !== orgId) {
      throw new HttpException(
        'Access denied to this document',
        HttpStatus.FORBIDDEN,
      );
    }

    const valid = await this.archiveService.verifyIntegrity(id);

    return {
      valid,
      documentId: id,
      checkedAt: new Date(),
    };
  }

  /**
   * Get all documents for a specific year
   *
   * GET /tax/archive/year/:year
   *
   * Useful for preparing annual tax returns or audits.
   *
   * @param req - Request with user context
   * @param year - Tax year
   * @returns Array of documents for the year
   */
  @Get('year/:year')
  async getYearDocuments(
    @Request() req: any,
    @Param('year') year: string,
  ): Promise<TaxDocument[]> {
    const orgId = req.user.organisationId;
    const yearNum = parseInt(year, 10);

    if (isNaN(yearNum)) {
      throw new HttpException(
        'Invalid year parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Fetching documents for org ${orgId}, year ${yearNum}`);

    return this.archiveService.getYearDocuments(orgId, yearNum);
  }

  /**
   * Get archive statistics
   *
   * GET /tax/archive/stats
   *
   * Returns overview of archived documents, sizes, and breakdown by type/year.
   *
   * @param req - Request with user context
   * @returns Statistics object
   */
  @Get('stats')
  async getStats(
    @Request() req: any,
  ): Promise<{
    totalDocuments: number;
    totalSize: number;
    totalSizeMB: number;
    documentsByType: Record<string, number>;
    documentsByYear: Record<number, number>;
    oldestDocument: Date | null;
    newestDocument: Date | null;
  }> {
    const orgId = req.user.organisationId;

    this.logger.log(`Fetching archive stats for org ${orgId}`);

    const stats = await this.archiveService.getArchiveStats(orgId);

    return {
      ...stats,
      totalSizeMB: parseFloat((stats.totalSize / 1024 / 1024).toFixed(2)),
    };
  }

  /**
   * Get documents with retention expiring soon
   *
   * GET /tax/archive/expiring?days=90
   *
   * Returns documents that will be eligible for deletion within the specified timeframe.
   *
   * @param req - Request with user context
   * @param days - Number of days (default: 90)
   * @returns Array of expiring documents
   */
  @Get('expiring')
  async getExpiringDocuments(
    @Request() req: any,
    @Query('days') days?: string,
  ): Promise<TaxDocument[]> {
    const orgId = req.user.organisationId;
    const daysNum = days ? parseInt(days, 10) : 90;

    if (isNaN(daysNum) || daysNum < 0) {
      throw new HttpException(
        'Invalid days parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Fetching expiring documents for org ${orgId} (${daysNum} days)`);

    return this.archiveService.getExpiringDocuments(orgId, daysNum);
  }

  /**
   * Get documents by type
   *
   * GET /tax/archive/type/:type
   *
   * @param req - Request with user context
   * @param type - Document type
   * @returns Array of documents of the specified type
   */
  @Get('type/:type')
  async getDocumentsByType(
    @Request() req: any,
    @Param('type') type: string,
  ): Promise<TaxDocument[]> {
    const orgId = req.user.organisationId;

    const validTypes = ['vat_return', 'elster_receipt', 'annual_return', 'tax_assessment', 'supporting_doc'];
    if (!validTypes.includes(type)) {
      throw new HttpException(
        `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Fetching ${type} documents for org ${orgId}`);

    return this.archiveService.getDocumentsByType(
      orgId,
      type as TaxDocument['type'],
    );
  }
}
