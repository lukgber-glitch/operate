import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { ClassificationService } from './classification.service';
import { ExpenseCategorizerService } from './expense-categorizer.service';
import { FoldersController } from './folders/folders.controller';
import { FoldersService } from './folders/folders.service';
import { FoldersRepository } from './folders/folders.repository';
import { RbacModule } from '../auth/rbac/rbac.module';

/**
 * Documents Module
 * Manages documents, folder structure, and AI-powered classification
 */
@Module({
  imports: [RbacModule, ConfigModule],
  controllers: [DocumentsController, FoldersController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    ClassificationService,
    ExpenseCategorizerService,
    FoldersService,
    FoldersRepository,
  ],
  exports: [DocumentsService, FoldersService, ClassificationService, ExpenseCategorizerService],
})
export class DocumentsModule {}
