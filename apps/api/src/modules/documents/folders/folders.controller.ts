import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { FoldersService } from './folders.service';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { UpdateFolderDto } from '../dto/update-folder.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';

/**
 * Folders Controller
 * Handles folder management operations
 */
@ApiTags('Documents - Folders')
@Controller('organisations/:orgId/documents/folders')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  /**
   * Get folder tree structure
   */
  @Get()
  @RequirePermissions(Permission.DOCUMENTS_READ)
  @ApiOperation({
    summary: 'List folders',
    description: 'Get folder tree structure',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Folder tree retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getFolderTree(@Param('orgId') orgId: string) {
    return this.foldersService.getFolderTree(orgId);
  }

  /**
   * Get folder by ID with contents
   */
  @Get(':id')
  @RequirePermissions(Permission.DOCUMENTS_READ)
  @ApiOperation({
    summary: 'Get folder',
    description: 'Get folder by ID with its contents',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Folder ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Folder retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Folder not found',
  })
  async findOne(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.foldersService.findById(id, orgId);
  }

  /**
   * Create new folder
   */
  @Post()
  @RequirePermissions(Permission.DOCUMENTS_CREATE)
  @ApiOperation({
    summary: 'Create folder',
    description: 'Create a new document folder',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Folder created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Folder with same path already exists',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createFolderDto: CreateFolderDto,
    @Request() req: any,
  ) {
    return this.foldersService.create(orgId, req.user.id, createFolderDto);
  }

  /**
   * Update folder
   */
  @Patch(':id')
  @RequirePermissions(Permission.DOCUMENTS_UPDATE)
  @ApiOperation({
    summary: 'Update folder',
    description: 'Update folder (rename or move)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Folder ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Folder updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Folder not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid operation (e.g., circular reference)',
  })
  async update(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.foldersService.update(id, orgId, updateFolderDto);
  }

  /**
   * Delete folder
   */
  @Delete(':id')
  @RequirePermissions(Permission.DOCUMENTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete folder',
    description: 'Delete an empty folder',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Folder ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Folder deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Folder not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Folder is not empty',
  })
  async delete(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.foldersService.delete(id, orgId);
  }
}
