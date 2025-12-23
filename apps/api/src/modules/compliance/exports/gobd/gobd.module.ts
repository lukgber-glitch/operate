import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GobdService } from './gobd.service';
import { GobdBuilderService } from './gobd-builder.service';
import { GobdController } from './gobd.controller';
import { DatabaseModule } from '@/modules/database/database.module';

/**
 * GoBD Export Module
 * Provides GoBD-compliant export functionality for German tax audits
 *
 * Features:
 * - GDPdU-compliant index.xml generation
 * - CSV data export (accounts, transactions, invoices, customers, suppliers)
 * - Document packaging (invoices, receipts, contracts)
 * - SHA-256 checksum verification
 * - ZIP archive creation
 * - 10-year retention support
 */
@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [GobdController],
  providers: [GobdService, GobdBuilderService],
  exports: [GobdService, GobdBuilderService],
})
export class GobdModule {}
