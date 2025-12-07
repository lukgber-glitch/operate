import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/modules/database/database.module';
import { BmdController } from './bmd.controller';
import { BmdExportService } from './bmd-export.service';

/**
 * BMD Export Module
 * Provides Austrian BMD accounting software export functionality
 *
 * Features:
 * - Booking journal export (Buchungsjournal)
 * - Chart of accounts export (Kontenstamm)
 * - Customer master data export (Kundenstamm)
 * - Supplier master data export (Lieferantenstamm)
 * - Tax account mapping export
 * - Austrian-specific formatting (date, number, VAT ID)
 * - CSV export with semicolon separator
 * - UTF-8 or ISO-8859-1 encoding support
 * - ZIP packaging
 */
@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [BmdController],
  providers: [BmdExportService],
  exports: [BmdExportService],
})
export class BmdModule {}
