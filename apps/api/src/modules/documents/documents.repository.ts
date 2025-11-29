import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Document, Prisma, DocumentStatus } from '@prisma/client';

/**
 * Documents Repository
 * Handles all database operations for Document entity
 */
@Injectable()
export class DocumentsRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all documents for an organisation with filters
   */
  async findAll(params: {
    where?: Prisma.DocumentWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.DocumentOrderByWithRelationInput;
    include?: Prisma.DocumentInclude;
  }): Promise<Document[]> {
    const { where, skip, take, orderBy, include } = params;

    return this.prisma.document.findMany({
      where,
      skip,
      take,
      orderBy,
      include,
    });
  }

  /**
   * Count documents matching filters
   */
  async count(where?: Prisma.DocumentWhereInput): Promise<number> {
    return this.prisma.document.count({ where });
  }

  /**
   * Find document by ID
   */
  async findById(
    id: string,
    include?: Prisma.DocumentInclude,
  ): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Create new document
   */
  async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    return this.prisma.document.create({
      data,
      include: {
        folder: true,
      },
    });
  }

  /**
   * Update document by ID
   */
  async update(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data,
      include: {
        folder: true,
      },
    });
  }

  /**
   * Soft delete document (set status to DELETED)
   */
  async softDelete(id: string): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.DELETED },
    });
  }

  /**
   * Archive document
   */
  async archive(id: string): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.ARCHIVED },
    });
  }

  /**
   * Restore document (set status to ACTIVE)
   */
  async restore(id: string): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.ACTIVE },
    });
  }

  /**
   * Get version history for a document
   */
  async getVersionHistory(parentId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: {
        OR: [{ id: parentId }, { parentId }],
      },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Get documents by folder
   */
  async findByFolder(folderId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { folderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
