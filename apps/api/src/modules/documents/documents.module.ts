import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { FoldersController } from './folders/folders.controller';
import { FoldersService } from './folders/folders.service';
import { FoldersRepository } from './folders/folders.repository';
import { RbacModule } from '../auth/rbac/rbac.module';

/**
 * Documents Module
 * Manages documents and folder structure
 */
@Module({
  imports: [RbacModule],
  controllers: [DocumentsController, FoldersController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    FoldersService,
    FoldersRepository,
  ],
  exports: [DocumentsService, FoldersService],
})
export class DocumentsModule {}
