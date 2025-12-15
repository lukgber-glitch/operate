import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { ClassificationService } from './classification.service';
import { ClassificationQueueService } from './classification-queue.service';
import { ExpenseCategorizerService } from './expense-categorizer.service';
import { FoldersController } from './folders/folders.controller';
import { FoldersService } from './folders/folders.service';
import { FoldersRepository } from './folders/folders.repository';
import { RbacModule } from '../auth/rbac/rbac.module';

/**
 * Documents Module
 * Manages documents, folder structure, and AI-powered classification
 *
 * Features:
 * - Document CRUD operations
 * - Folder management
 * - AI-powered document classification with queue management
 * - Expense categorization
 */
@Module({
  imports: [RbacModule, ConfigModule, EventEmitterModule.forRoot()],
  controllers: [DocumentsController, FoldersController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    ClassificationService,
    ClassificationQueueService,
    ExpenseCategorizerService,
    FoldersService,
    FoldersRepository,
  ],
  exports: [
    DocumentsService,
    FoldersService,
    ClassificationService,
    ClassificationQueueService,
    ExpenseCategorizerService,
  ],
})
export class DocumentsModule {}
