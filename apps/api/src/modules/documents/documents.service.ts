import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DocumentsRepository } from './documents.repository';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentQueryDto } from './dto/document-query.dto';
import { Prisma, DocumentStatus } from '@prisma/client';

/**
 * Documents Service
 * Business logic for document management operations
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private repository: DocumentsRepository) {}

  /**
   * Find all documents with pagination and filters
   */
  async findAll(
    orgId: string,
    userId: string,
    query: DocumentQueryDto,
  ): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    const {
      search,
      type,
      status = DocumentStatus.ACTIVE,
      folderId,
      tags,
      uploadedBy,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.DocumentWhereInput = {
      orgId,
      status,
      ...(type && { type }),
      ...(folderId && { folderId }),
      ...(uploadedBy && { uploadedBy }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { fileName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Handle tags filter
    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      where.tags = {
        hasSome: tagArray,
      };
    }

    const skip = (page - 1) * pageSize;

    const [documents, total] = await Promise.all([
      this.repository.findAll({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          folder: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
        },
      }),
      this.repository.count(where),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Find document by ID
   */
  async findById(id: string, orgId: string): Promise<any> {
    const document = await this.repository.findById(id, {
      folder: {
        select: {
          id: true,
          name: true,
          path: true,
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.orgId !== orgId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  /**
   * Create new document
   */
  async create(
    orgId: string,
    userId: string,
    dto: CreateDocumentDto,
  ): Promise<any> {
    // Validate folder exists if provided
    if (dto.folderId) {
      // This will be validated by the folders service
      // For now, we'll let Prisma handle the foreign key constraint
    }

    const document = await this.repository.create({
      orgId,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      fileUrl: dto.fileUrl,
      ...(dto.folderId && { folder: { connect: { id: dto.folderId } } }),
      tags: dto.tags || [],
      uploadedBy: userId,
      metadata: dto.metadata as any,
      status: DocumentStatus.ACTIVE,
      version: 1,
    });

    this.logger.log(`Created document ${document.id} for organisation ${orgId}`);

    return document;
  }

  /**
   * Update document
   */
  async update(
    id: string,
    orgId: string,
    dto: UpdateDocumentDto,
  ): Promise<any> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existing.orgId !== orgId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existing.status === DocumentStatus.DELETED) {
      throw new BadRequestException('Cannot update deleted document');
    }

    const updateData: Prisma.DocumentUpdateInput = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    // Handle folder change
    if (dto.folderId !== undefined) {
      if (dto.folderId === null) {
        updateData.folder = { disconnect: true };
      } else {
        updateData.folder = { connect: { id: dto.folderId } };
      }
    }

    const document = await this.repository.update(id, updateData);

    this.logger.log(`Updated document ${id}`);

    return document;
  }

  /**
   * Soft delete document
   */
  async softDelete(id: string, orgId: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existing.orgId !== orgId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    await this.repository.softDelete(id);

    this.logger.log(`Soft deleted document ${id}`);
  }

  /**
   * Archive document
   */
  async archive(id: string, orgId: string): Promise<any> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existing.orgId !== orgId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existing.status === DocumentStatus.DELETED) {
      throw new BadRequestException('Cannot archive deleted document');
    }

    const document = await this.repository.archive(id);

    this.logger.log(`Archived document ${id}`);

    return document;
  }

  /**
   * Restore document
   */
  async restore(id: string, orgId: string): Promise<any> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existing.orgId !== orgId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (
      existing.status !== DocumentStatus.DELETED &&
      existing.status !== DocumentStatus.ARCHIVED
    ) {
      throw new BadRequestException('Document is not deleted or archived');
    }

    const document = await this.repository.restore(id);

    this.logger.log(`Restored document ${id}`);

    return document;
  }

  /**
   * Get version history
   */
  async getVersionHistory(id: string, orgId: string): Promise<any[]> {
    const document = await this.repository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.orgId !== orgId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Get the root document (if this is a version)
    const rootId = document.parentId || document.id;

    return this.repository.getVersionHistory(rootId);
  }
}
