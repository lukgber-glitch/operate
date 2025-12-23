/**
 * Search Documents Action Handler
 * Handles document search via chatbot with full-text and filter capabilities
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { PrismaService } from '@/modules/database/prisma.service';
import { DocumentType, DocumentStatus } from '@prisma/client';

@Injectable()
export class SearchDocumentsHandler extends BaseActionHandler {
  constructor(private prisma: PrismaService) {
    super('SearchDocumentsHandler');
  }

  get actionType(): ActionType {
    return ActionType.SEARCH_DOCUMENTS;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'Search query for document name or description',
        validation: (value) => typeof value === 'string' && value.length > 0,
      },
      {
        name: 'documentType',
        type: 'string',
        required: false,
        description: 'Filter by document type: CONTRACT, INVOICE, RECEIPT, REPORT, POLICY, FORM, CERTIFICATE, OTHER',
      },
      {
        name: 'dateFrom',
        type: 'string',
        required: false,
        description: 'Filter documents created from this date (ISO format)',
      },
      {
        name: 'dateTo',
        type: 'string',
        required: false,
        description: 'Filter documents created until this date (ISO format)',
      },
      {
        name: 'status',
        type: 'string',
        required: false,
        description: 'Filter by status: DRAFT, ACTIVE, ARCHIVED, DELETED',
        default: 'ACTIVE',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of documents to return',
        default: 20,
        validation: (value) => value > 0 && value <= 100,
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'documents:view')) {
        return this.error(
          'You do not have permission to search documents',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);
      const query = normalized.query;
      const limit = Math.min(normalized.limit || 20, 100);
      const status = normalized.status || 'ACTIVE';

      // Build search filter
      const where: any = {
        orgId: context.organizationId,
        status: status as DocumentStatus,
      };

      // Add full-text search on name and description
      if (query && query.trim().length > 0) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { fileName: { contains: query, mode: 'insensitive' } },
        ];
      }

      // Add document type filter
      if (normalized.documentType) {
        const docType = normalized.documentType.toUpperCase();
        if (Object.values(DocumentType).includes(docType as DocumentType)) {
          where.type = docType as DocumentType;
        }
      }

      // Add date range filters
      if (normalized.dateFrom || normalized.dateTo) {
        where.createdAt = {};

        if (normalized.dateFrom) {
          const fromDate = new Date(normalized.dateFrom);
          if (!isNaN(fromDate.getTime())) {
            where.createdAt.gte = fromDate;
          }
        }

        if (normalized.dateTo) {
          const toDate = new Date(normalized.dateTo);
          if (!isNaN(toDate.getTime())) {
            where.createdAt.lte = toDate;
          }
        }
      }

      // Execute search
      const documents = await this.prisma.document.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          status: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          fileUrl: true,
          tags: true,
          uploadedBy: true,
          createdAt: true,
          updatedAt: true,
          version: true,
        },
      });

      // Get total count (for pagination info)
      const totalCount = await this.prisma.document.count({ where });

      // Format document details for response
      const documentDetails = documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        type: doc.type,
        status: doc.status,
        fileName: doc.fileName,
        fileSize: this.formatFileSize(doc.fileSize),
        mimeType: doc.mimeType,
        url: doc.fileUrl,
        tags: doc.tags,
        version: doc.version,
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      }));

      const message = this.buildResultMessage(
        documents.length,
        totalCount,
        query,
        normalized.documentType,
      );

      this.logger.log(
        `Searched documents for user ${context.userId}: found ${documents.length} results for query "${query}"`,
      );

      return this.success(
        message,
        undefined,
        'DocumentSearchResult',
        {
          count: documents.length,
          total: totalCount,
          hasMore: totalCount > documents.length,
          query,
          filters: {
            documentType: normalized.documentType,
            status,
            dateFrom: normalized.dateFrom,
            dateTo: normalized.dateTo,
          },
          documents: documentDetails,
        },
      );
    } catch (error) {
      this.logger.error('Failed to search documents:', error);
      return this.error(
        'Failed to search documents',
        error.message || 'Unknown error',
      );
    }
  }

  /**
   * Build a descriptive result message
   */
  private buildResultMessage(
    count: number,
    total: number,
    query: string,
    documentType?: string,
  ): string {
    if (count === 0) {
      return `No documents found matching "${query}"`;
    }

    let message = `Found ${count} document${count !== 1 ? 's' : ''}`;

    if (documentType) {
      message += ` of type ${documentType}`;
    }

    message += ` matching "${query}"`;

    if (total > count) {
      message += ` (showing first ${count} of ${total} total results)`;
    }

    return message;
  }

  /**
   * Format file size to human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
