/**
 * AI Module
 * Handles AI/ML features including transaction classification, receipt scanning, invoice extraction, email intelligence, and daily briefings
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
import { EmailIntelligenceModule } from './email-intelligence/email-intelligence.module';
import { BankIntelligenceModule } from './bank-intelligence/bank-intelligence.module';
import { BriefingModule } from './briefing/briefing.module';

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
    EmailIntelligenceModule,
    BankIntelligenceModule,
    BriefingModule,
  ],
  exports: [
    ClassificationModule,
    ReceiptScannerModule,
    LearningModule,
    TransactionCategorizationModule,
    InvoiceExtractorModule,
    EmailIntelligenceModule,
    BankIntelligenceModule,
    BriefingModule,
  ],
})
export class AiModule {}
