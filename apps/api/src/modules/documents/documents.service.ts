import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentsRepository } from './documents.repository';
import { ClassificationService } from './classification.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentQueryDto } from './dto/document-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ClassifyDocumentDto } from './dto/classify-document.dto';
import { ClassificationResultDto } from './dto/classification-result.dto';
import { Prisma, DocumentStatus, DocumentType } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * Documents Service
 * Business logic for document management operations including upload and AI classification
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly storageBasePath: string;
  private readonly storageType: string;

  constructor(
    private repository: DocumentsRepository,
    private classificationService: ClassificationService,
    private configService: ConfigService,
  ) {
    this.storageType = this.configService.get<string>('STORAGE_TYPE', 'local');
    this.storageBasePath = this.configService.get<string>(
      'STORAGE_PATH',
      './uploads/documents',
    );
  }

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
      metadata: dto.metadata as Prisma.InputJsonValue,
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

  /**
   * Upload document with optional AI classification
   */
  async uploadDocument(
    orgId: string,
    userId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ): Promise<any> {
    this.logger.log(
      `Uploading document: ${file.originalname} (${file.size} bytes)`,
    );

    try {
      // Store file
      const fileUrl = await this.storeFile(orgId, file);

      // Classify document if requested
      let classificationResult: ClassificationResultDto | null = null;
      let documentType: DocumentType = DocumentType.OTHER;

      if (dto.autoClassify !== false) {
        try {
          const result = await this.classificationService.classifyDocument(
            file.buffer,
            file.mimetype,
            file.originalname,
          );

          classificationResult = {
            type: result.type,
            confidence: result.confidence,
            extractedData: result.extractedData,
            autoCategorizationRecommended: result.confidence >= 0.8,
          };

          // Auto-apply classification if confidence is high
          if (result.confidence >= 0.8) {
            documentType = result.type;
            this.logger.log(
              `Auto-classified document as ${documentType} (confidence: ${result.confidence})`,
            );
          }
        } catch (classificationError) {
          this.logger.warn(
            `Classification failed for ${file.originalname}:`,
            classificationError,
          );
          // Continue with upload even if classification fails
        }
      }

      // Create document record
      const document = await this.repository.create({
        orgId,
        name: dto.name || file.originalname,
        description: dto.description,
        type: documentType,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl,
        ...(dto.folderId && { folder: { connect: { id: dto.folderId } } }),
        tags: dto.tags || [],
        uploadedBy: userId,
        metadata: (classificationResult
          ? { classification: classificationResult }
          : {}) as Prisma.InputJsonValue,
        status: DocumentStatus.ACTIVE,
        version: 1,
      });

      this.logger.log(`Created document ${document.id} for organisation ${orgId}`);

      return {
        ...document,
        classification: classificationResult,
      };
    } catch (error) {
      this.logger.error(`Failed to upload document:`, error);
      throw new InternalServerErrorException('Failed to upload document');
    }
  }

  /**
   * Classify an existing document
   */
  async classifyExistingDocument(
    orgId: string,
    dto: ClassifyDocumentDto,
  ): Promise<ClassificationResultDto> {
    // Find document
    const document = await this.repository.findById(dto.documentId);

    if (!document) {
      throw new NotFoundException(
        `Document with ID ${dto.documentId} not found`,
      );
    }

    if (document.orgId !== orgId) {
      throw new NotFoundException(
        `Document with ID ${dto.documentId} not found`,
      );
    }

    try {
      // Download file for classification
      const fileBuffer = await this.downloadFile(document.fileUrl);

      // Classify
      const result = await this.classificationService.classifyDocument(
        fileBuffer,
        document.mimeType,
        document.fileName,
        {
          useVision: dto.useVision,
          model: dto.model,
          temperature: dto.temperature,
        },
      );

      const classificationResult: ClassificationResultDto = {
        type: result.type,
        confidence: result.confidence,
        extractedData: result.extractedData,
        autoCategorizationRecommended: result.confidence >= 0.8,
      };

      // Apply classification if requested and confidence is high
      if (dto.applyClassification && result.confidence >= 0.8) {
        await this.repository.update(dto.documentId, {
          type: result.type,
          metadata: {
            ...(document.metadata as Prisma.InputJsonValue),
            classification: classificationResult,
            classifiedAt: new Date().toISOString(),
          },
        });

        this.logger.log(
          `Applied classification to document ${dto.documentId}: ${result.type} (confidence: ${result.confidence})`,
        );
      }

      return classificationResult;
    } catch (error) {
      this.logger.error(
        `Classification failed for document ${dto.documentId}:`,
        error,
      );
      throw new InternalServerErrorException('Document classification failed');
    }
  }

  /**
   * Store file to configured storage
   */
  private async storeFile(
    orgId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (this.storageType === 'local') {
      return this.storeFileLocally(orgId, file);
    } else if (this.storageType === 's3') {
      // TODO: Implement S3 storage
      throw new Error('S3 storage not implemented yet');
    } else {
      throw new Error(`Unsupported storage type: ${this.storageType}`);
    }
  }

  /**
   * Store file to local filesystem
   */
  private async storeFileLocally(
    orgId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    // Generate unique filename
    const fileId = uuidv4();
    const extension = file.originalname.split('.').pop();
    const fileName = `${fileId}.${extension}`;

    // Create directory structure
    const orgPath = join(this.storageBasePath, orgId);
    await mkdir(orgPath, { recursive: true });

    // Write file
    const filePath = join(orgPath, fileName);
    await writeFile(filePath, file.buffer);

    // Return relative URL
    return `/uploads/documents/${orgId}/${fileName}`;
  }

  /**
   * Download file from URL (for classification)
   */
  private async downloadFile(fileUrl: string): Promise<Buffer> {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      // External URL
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    } else {
      // Local file
      const { readFile } = await import('fs/promises');
      const filePath = join(process.cwd(), fileUrl);
      return await readFile(filePath);
    }
  }
}
