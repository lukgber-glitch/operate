import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { FoldersRepository } from './folders.repository';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { UpdateFolderDto } from '../dto/update-folder.dto';

/**
 * Folders Service
 * Business logic for folder management operations
 */
@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(private repository: FoldersRepository) {}

  /**
   * Get folder tree structure
   */
  async getFolderTree(orgId: string): Promise<any[]> {
    return this.repository.getFolderTree(orgId);
  }

  /**
   * Get folder by ID with contents
   */
  async findById(id: string, orgId: string): Promise<any> {
    const folder = await this.repository.getFolderWithContents(id);

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    if (folder.orgId !== orgId) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    return folder;
  }

  /**
   * Create new folder
   */
  async create(
    orgId: string,
    userId: string,
    dto: CreateFolderDto,
  ): Promise<any> {
    // Build folder path
    let path = `/${this.sanitizePath(dto.name)}`;
    let parentFolder = null;

    if (dto.parentId) {
      parentFolder = await this.repository.findById(dto.parentId);

      if (!parentFolder) {
        throw new BadRequestException(
          `Parent folder with ID ${dto.parentId} not found`,
        );
      }

      if (parentFolder.orgId !== orgId) {
        throw new BadRequestException('Parent folder does not belong to this organisation');
      }

      path = `${parentFolder.path}/${this.sanitizePath(dto.name)}`;
    }

    // Check if path already exists
    const existingFolder = await this.repository.findByPath(orgId, path);
    if (existingFolder) {
      throw new ConflictException(`Folder with path ${path} already exists`);
    }

    const folder = await this.repository.create({
      orgId,
      name: dto.name,
      description: dto.description,
      path,
      createdBy: userId,
      ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
    });

    this.logger.log(`Created folder ${folder.id} at path ${path}`);

    return folder;
  }

  /**
   * Update folder
   */
  async update(id: string, orgId: string, dto: UpdateFolderDto): Promise<any> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    if (existing.orgId !== orgId) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // Check for circular reference if moving folder
    if (dto.parentId && dto.parentId !== existing.parentId) {
      await this.validateNoCircularReference(id, dto.parentId);
    }

    let newPath = existing.path;

    // Handle rename
    if (dto.name && dto.name !== existing.name) {
      const pathParts = existing.path.split('/');
      pathParts[pathParts.length - 1] = this.sanitizePath(dto.name);
      newPath = pathParts.join('/');
    }

    // Handle move
    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      if (dto.parentId === null) {
        // Move to root
        newPath = `/${this.sanitizePath(dto.name || existing.name)}`;
      } else {
        const newParent = await this.repository.findById(dto.parentId);
        if (!newParent) {
          throw new BadRequestException(
            `Parent folder with ID ${dto.parentId} not found`,
          );
        }
        if (newParent.orgId !== orgId) {
          throw new BadRequestException(
            'Parent folder does not belong to this organisation',
          );
        }
        newPath = `${newParent.path}/${this.sanitizePath(dto.name || existing.name)}`;
      }
    }

    // Check if new path already exists
    if (newPath !== existing.path) {
      const existingFolder = await this.repository.findByPath(orgId, newPath);
      if (existingFolder && existingFolder.id !== id) {
        throw new ConflictException(`Folder with path ${newPath} already exists`);
      }
    }

    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(newPath !== existing.path && { path: newPath }),
    };

    // Handle parent change
    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        updateData.parent = { disconnect: true };
      } else {
        updateData.parent = { connect: { id: dto.parentId } };
      }
    }

    const folder = await this.repository.update(id, updateData);

    // Update paths of all children recursively
    if (newPath !== existing.path) {
      await this.updateChildrenPaths(id, existing.path, newPath);
    }

    this.logger.log(`Updated folder ${id}`);

    return folder;
  }

  /**
   * Delete folder
   */
  async delete(id: string, orgId: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    if (existing.orgId !== orgId) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // Check if folder has documents
    const hasDocuments = await this.repository.hasDocuments(id);
    if (hasDocuments) {
      throw new BadRequestException('Cannot delete folder with documents');
    }

    // Check if folder has children
    const hasChildren = await this.repository.hasChildren(id);
    if (hasChildren) {
      throw new BadRequestException('Cannot delete folder with subfolders');
    }

    await this.repository.delete(id);

    this.logger.log(`Deleted folder ${id}`);
  }

  /**
   * Validate no circular reference when moving folders
   */
  private async validateNoCircularReference(
    folderId: string,
    newParentId: string,
  ): Promise<void> {
    let currentFolder = await this.repository.findById(newParentId);

    while (currentFolder) {
      if (currentFolder.id === folderId) {
        throw new BadRequestException(
          'Cannot move folder into itself or its descendants',
        );
      }

      if (!currentFolder.parentId) {
        break;
      }

      currentFolder = await this.repository.findById(currentFolder.parentId);
    }
  }

  /**
   * Update paths of all children recursively
   */
  private async updateChildrenPaths(
    folderId: string,
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    const children = await this.repository.findAll({
      where: { parentId: folderId },
    });

    for (const child of children) {
      const childNewPath = child.path.replace(oldPath, newPath);
      await this.repository.update(child.id, { path: childNewPath });

      // Recursively update grandchildren
      await this.updateChildrenPaths(child.id, child.path, childNewPath);
    }
  }

  /**
   * Sanitize folder name for path
   */
  private sanitizePath(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
