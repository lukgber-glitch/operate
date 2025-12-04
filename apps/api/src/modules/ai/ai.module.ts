/**
 * AI Module
 * Handles AI/ML features including transaction classification, receipt scanning, and invoice extraction
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AutomationModule } from '../automation/automation.module';
import { ClassificationModule } from './classification/classification.module';
import { ReceiptScannerModule } from './receipt-scanner/receipt-scanner.module';
import { LearningModule } from './learning/learning.module';
import { TransactionCategorizationModule } from './transaction-categorization/transaction-categorization.module';
import { InvoiceExtractorModule } from './extractors/invoice-extractor.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AutomationModule,
    ClassificationModule,
    ReceiptScannerModule,
    LearningModule,
    TransactionCategorizationModule,
    InvoiceExtractorModule,
  ],
  exports: [
    ClassificationModule,
    ReceiptScannerModule,
    LearningModule,
    TransactionCategorizationModule,
    InvoiceExtractorModule,
  ],
})
export class AiModule {}
