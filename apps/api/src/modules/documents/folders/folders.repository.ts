import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DocumentFolder, Prisma } from '@prisma/client';

/**
 * Folders Repository
 * Handles all database operations for DocumentFolder entity
 */
@Injectable()
export class FoldersRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all folders for an organisation
   */
  async findAll(params: {
    where?: Prisma.DocumentFolderWhereInput;
    include?: Prisma.DocumentFolderInclude;
    orderBy?: Prisma.DocumentFolderOrderByWithRelationInput;
  }): Promise<DocumentFolder[]> {
    const { where, include, orderBy } = params;

    return this.prisma.documentFolder.findMany({
      where,
      include,
      orderBy,
    });
  }

  /**
   * Find folder by ID
   */
  async findById(
    id: string,
    include?: Prisma.DocumentFolderInclude,
  ): Promise<DocumentFolder | null> {
    return this.prisma.documentFolder.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find folder by path
   */
  async findByPath(
    orgId: string,
    path: string,
  ): Promise<DocumentFolder | null> {
    return this.prisma.documentFolder.findUnique({
      where: {
        orgId_path: {
          orgId,
          path,
        },
      },
    });
  }

  /**
   * Create new folder
   */
  async create(
    data: Prisma.DocumentFolderCreateInput,
  ): Promise<DocumentFolder> {
    return this.prisma.documentFolder.create({
      data,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Update folder by ID
   */
  async update(
    id: string,
    data: Prisma.DocumentFolderUpdateInput,
  ): Promise<DocumentFolder> {
    return this.prisma.documentFolder.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Delete folder by ID
   */
  async delete(id: string): Promise<DocumentFolder> {
    return this.prisma.documentFolder.delete({
      where: { id },
    });
  }

  /**
   * Count folders matching filters
   */
  async count(where?: Prisma.DocumentFolderWhereInput): Promise<number> {
    return this.prisma.documentFolder.count({ where });
  }

  /**
   * Get folder tree structure
   */
  async getFolderTree(orgId: string): Promise<DocumentFolder[]> {
    return this.prisma.documentFolder.findMany({
      where: {
        orgId,
        parentId: null, // Root folders
      },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get folder with contents (documents)
   */
  async getFolderWithContents(id: string): Promise<DocumentFolder | null> {
    return this.prisma.documentFolder.findUnique({
      where: { id },
      include: {
        documents: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'desc' },
        },
        children: true,
        parent: true,
      },
    });
  }

  /**
   * Check if folder has documents
   */
  async hasDocuments(id: string): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: { folderId: id },
    });
    return count > 0;
  }

  /**
   * Check if folder has children
   */
  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.documentFolder.count({
      where: { parentId: id },
    });
    return count > 0;
  }
}
