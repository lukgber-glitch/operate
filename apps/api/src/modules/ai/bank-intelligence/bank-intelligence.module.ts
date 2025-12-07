import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/modules/database/database.module';
import { InvoiceMatcherService } from './invoice-matcher.service';
import { BillMatcherService } from './bill-matcher.service';
import { EnhancedTransactionClassifierService } from './transaction-classifier.service';
import { TaxDeductionAnalyzerService } from './tax-deduction-analyzer.service';
import { RecurringDetectorService } from './recurring-detector.service';
import { CashFlowPredictorService } from './cash-flow-predictor.service';
import { TaxLiabilityTrackerService } from './tax-liability-tracker.service';
import { BankIntelligenceSuggestionService } from './bank-intelligence-suggestion.service';
import { BankIntelligenceController } from './bank-intelligence.controller';

/**
 * Bank Intelligence Module
 * Provides AI-powered banking intelligence features including:
 * - Enhanced transaction classification with German tax awareness
 * - Tax deduction analysis and calculation
 * - Tax liability tracking and estimates
 * - Invoice auto-matching and reconciliation
 * - Bill auto-matching and reconciliation (AP automation)
 * - Recurring transaction detection and prediction
 * - Cash flow predictions and runway analysis
 * - Transaction classification
 * - Anomaly detection
 * - Bank-to-chat bridge: automatic suggestion creation for matches
 */
@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [BankIntelligenceController],
  providers: [
    InvoiceMatcherService,
    BillMatcherService,
    EnhancedTransactionClassifierService,
    TaxDeductionAnalyzerService,
    RecurringDetectorService,
    CashFlowPredictorService,
    TaxLiabilityTrackerService,
    BankIntelligenceSuggestionService,
  ],
  exports: [
    InvoiceMatcherService,
    BillMatcherService,
    EnhancedTransactionClassifierService,
    TaxDeductionAnalyzerService,
    RecurringDetectorService,
    CashFlowPredictorService,
    TaxLiabilityTrackerService,
    BankIntelligenceSuggestionService,
  ],
})
export class BankIntelligenceModule {}
