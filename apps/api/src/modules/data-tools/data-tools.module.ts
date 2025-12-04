import { Module } from '@nestjs/common';
import { DataToolsController } from './data-tools.controller';
import { DataToolsService } from './data-tools.service';
import { DataExporterService } from './services/data-exporter.service';
import { DataDeletionService } from './services/data-deletion.service';
import { DataAnonymizerService } from './services/data-anonymizer.service';
import { BulkOperationsService } from './services/bulk-operations.service';
import { DataExportProcessor } from './jobs/data-export.processor';
import { DataDeletionProcessor } from './jobs/data-deletion.processor';
import { DatabaseModule } from '../database/database.module';
import { GdprModule } from '../gdpr/gdpr.module';

/**
 * Data Tools Module
 * Comprehensive data export, deletion, and anonymization infrastructure
 *
 * Features:
 * - Multi-format data export (JSON, CSV, PDF, ZIP)
 * - Data deletion (soft, hard, scheduled)
 * - Data anonymization (GDPR-compliant)
 * - Bulk operations
 * - Background job processing with BullMQ
 * - Full audit logging
 * - Encryption support
 * - Deletion preview and verification
 *
 * Export Capabilities:
 * - User profile data
 * - Financial records (invoices, expenses)
 * - Tax records
 * - HR/Employee data
 * - Documents and attachments
 * - Activity logs
 * - Settings and preferences
 *
 * Deletion Modes:
 * - Soft delete (mark as deleted)
 * - Hard delete (permanent removal)
 * - Anonymize (replace with anonymous data)
 * - Scheduled deletion
 * - Cascade deletion
 *
 * Security:
 * - Admin-only endpoints
 * - Export file encryption
 * - Deletion confirmation tokens
 * - Full audit trail
 * - Rate limiting (TODO: implement)
 */
@Module({
  imports: [
    DatabaseModule,
    GdprModule, // Import GDPR module for audit logging
  ],
  controllers: [DataToolsController],
  providers: [
    DataToolsService,
    DataExporterService,
    DataDeletionService,
    DataAnonymizerService,
    BulkOperationsService,
    DataExportProcessor,
    DataDeletionProcessor,
  ],
  exports: [
    DataToolsService,
    DataExporterService,
    DataDeletionService,
    DataAnonymizerService,
    BulkOperationsService,
  ],
})
export class DataToolsModule {}
