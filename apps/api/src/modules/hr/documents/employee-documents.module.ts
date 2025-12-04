import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { EmployeeDocumentsService } from './employee-documents.service';
import {
  EmployeeDocumentsController,
  OrganizationDocumentsController,
} from './employee-documents.controller';
import { DocumentStorageService } from './services/document-storage.service';
import { W4FormService } from './services/w4-form.service';
import { I9FormService } from './services/i9-form.service';

/**
 * Employee Documents Module
 * Handles US employment compliance documents (W-4, I-9)
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  controllers: [
    EmployeeDocumentsController,
    OrganizationDocumentsController,
  ],
  providers: [
    EmployeeDocumentsService,
    DocumentStorageService,
    W4FormService,
    I9FormService,
  ],
  exports: [
    EmployeeDocumentsService,
    W4FormService,
    I9FormService,
  ],
})
export class EmployeeDocumentsModule {}
