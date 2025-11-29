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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentQueryDto } from './dto/document-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions';

/**
 * Documents Controller
 * Handles document management operations
 */
@ApiTags('Documents')
@Controller('organisations/:orgId/documents')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

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
