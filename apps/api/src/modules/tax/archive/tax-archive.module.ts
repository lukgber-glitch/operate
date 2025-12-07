import { Module } from '@nestjs/common';
import { TaxArchiveService } from './tax-archive.service';
import { TaxArchiveController } from './tax-archive.controller';
import { DatabaseModule } from '../../database/database.module';

/**
 * Tax Archive Module
 *
 * Provides document archiving services for tax-related documents
 * with proper retention policies (10 years for German tax law).
 *
 * Features:
 * - VAT return archiving
 * - ELSTER receipt storage
 * - Annual tax return archiving
 * - Tax assessment storage
 * - Supporting document management
 * - Document integrity verification
 * - Retention policy management
 *
 * Exports:
 * - TaxArchiveService - For use by other modules (ELSTER, VAT, etc.)
 */
@Module({
  imports: [DatabaseModule],
  controllers: [TaxArchiveController],
  providers: [TaxArchiveService],
  exports: [TaxArchiveService],
})
export class TaxArchiveModule {}
