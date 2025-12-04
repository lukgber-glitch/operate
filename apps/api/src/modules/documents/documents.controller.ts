import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentQueryDto } from './dto/document-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ClassifyDocumentDto } from './dto/classify-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions';

/**
 * Documents Controller
 * Handles document management operations including upload and AI classification
 */
@ApiTags('Documents')
@Controller('organisations/:orgId/documents')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  /**
   * Upload a new document with optional AI classification
   */
  @Post('upload')
  @RequirePermissions(Permission.DOCUMENTS_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload document',
    description: 'Upload a new document file with optional automatic AI classification',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiBody({
    description: 'Document file and metadata',
    type: UploadDocumentDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded and classified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or data',
  })
  @ApiResponse({
    status: 413,
    description: 'File too large',
  })
  async uploadDocument(
    @Param('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not supported. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    return this.documentsService.uploadDocument(
      orgId,
      req.user.id,
      file,
      dto,
    );
  }

  /**
   * Classify an existing document using AI
   */
  @Post('classify')
  @RequirePermissions(Permission.DOCUMENTS_UPDATE)
  @ApiOperation({
    summary: 'Classify document',
    description: 'Classify an existing document using AI to determine type and extract fields',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Document classified successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Classification failed',
  })
  async classifyDocument(
    @Param('orgId') orgId: string,
    @Body() dto: ClassifyDocumentDto,
  ) {
    return this.documentsService.classifyExistingDocument(orgId, dto);
  }

  /**
   * List all documents in organisation
   */
  @Get()
  @RequirePermissions(Permission.DOCUMENTS_READ)
  @ApiOperation({
    summary: 'List documents',
    description: 'Get paginated list of documents with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(
    @Param('orgId') orgId: string,
    @Query() query: DocumentQueryDto,
    @Request() req: any,
  ) {
    return this.documentsService.findAll(orgId, req.user.id, query);
  }

  /**
   * Get single document by ID
   */
  @Get(':id')
  @RequirePermissions(Permission.DOCUMENTS_READ)
  @ApiOperation({
    summary: 'Get document',
    description: 'Retrieve single document by ID',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async findOne(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.documentsService.findById(id, orgId);
  }

  /**
   * Create new document
   */
  @Post()
  @RequirePermissions(Permission.DOCUMENTS_CREATE)
  @ApiOperation({
    summary: 'Create document',
    description: 'Create a new document metadata record (file upload handled separately)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Document created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req: any,
  ) {
    return this.documentsService.create(orgId, req.user.id, createDocumentDto);
  }

  /**
   * Update document
   */
  @Patch(':id')
  @RequirePermissions(Permission.DOCUMENTS_UPDATE)
  @ApiOperation({
    summary: 'Update document',
    description: 'Update document metadata',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async update(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, orgId, updateDocumentDto);
  }

  /**
   * Delete document
   */
  @Delete(':id')
  @RequirePermissions(Permission.DOCUMENTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Soft delete a document (sets status to DELETED)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Document deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async delete(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.documentsService.softDelete(id, orgId);
  }

  /**
   * Archive document
   */
  @Post(':id/archive')
  @RequirePermissions(Permission.DOCUMENTS_UPDATE)
  @ApiOperation({
    summary: 'Archive document',
    description: 'Archive a document (sets status to ARCHIVED)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Document archived successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async archive(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.documentsService.archive(id, orgId);
  }

  /**
   * Restore document
   */
  @Post(':id/restore')
  @RequirePermissions(Permission.DOCUMENTS_UPDATE)
  @ApiOperation({
    summary: 'Restore document',
    description: 'Restore an archived or deleted document',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Document restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async restore(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.documentsService.restore(id, orgId);
  }

  /**
   * Get document version history
   */
  @Get(':id/versions')
  @RequirePermissions(Permission.DOCUMENTS_READ)
  @ApiOperation({
    summary: 'Get version history',
    description: 'Get all versions of a document',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Version history retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async getVersionHistory(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
  ) {
    return this.documentsService.getVersionHistory(id, orgId);
  }
}
