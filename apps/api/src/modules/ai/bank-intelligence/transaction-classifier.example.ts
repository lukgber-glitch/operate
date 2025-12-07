/**
 * Enhanced Transaction Classifier - Usage Examples
 * Demonstrates German tax-aware transaction classification
 */

import { EnhancedTransactionClassifierService } from './transaction-classifier.service';
import { TransactionForClassification, TaxCategory } from './types/tax-categories.types';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';

/**
 * Example: Classify a single transaction
 */
async function exampleSingleClassification() {
  const configService = new ConfigService();
  const prisma = new PrismaService(configService);
  const classifier = new EnhancedTransactionClassifierService(configService, prisma);

  const transaction: TransactionForClassification = {
    description: 'AWS Amazon Web Services EMEA SARL',
    amount: -15000, // 150.00 EUR (in cents, negative = expense)
    type: 'DEBIT',
    counterparty: 'Amazon Web Services',
    date: new Date('2024-12-01'),
  };

  const result = await classifier.classifyTransaction(transaction);

  console.log('Classification Result:');
  console.log('=====================');
  console.log(`Category: ${result.category}`);
  console.log(`Tax Category: ${result.tax.taxCategory}`);
  console.log(`EÜR Line: ${result.tax.eurLineNumber} - ${result.tax.eurDescription}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`\nTax Information:`);
  console.log(`  Deductible: ${result.tax.deductible ? 'Yes' : 'No'}`);
  console.log(`  Deduction %: ${result.tax.deductionPercentage}%`);
  console.log(`  Deductible Amount: ${(result.tax.deductibleAmount / 100).toFixed(2)} EUR`);
  console.log(`  VAT Reclaimable: ${result.tax.vatReclaimable ? 'Yes' : 'No'}`);
  console.log(`\nBusiness Information:`);
  console.log(`  Business Expense: ${result.business.isBusinessExpense ? 'Yes' : 'No'}`);
  console.log(`  Business %: ${result.business.businessPercentage}%`);
  console.log(`  Requires Documentation: ${result.business.requiresDocumentation ? 'Yes' : 'No'}`);
  console.log(`\nPattern Recognition:`);
  console.log(`  Vendor: ${result.pattern.vendor}`);
  console.log(`  Recurring: ${result.pattern.isRecurring ? 'Yes' : 'No'}`);
  if (result.pattern.frequency) {
    console.log(`  Frequency: ${result.pattern.frequency}`);
  }
  console.log(`\nReasoning: ${result.reasoning}`);

  if (result.flags?.needsReview) {
    console.log('\n⚠️  FLAGGED FOR REVIEW');
  }
}

/**
 * Example: Classify business meals (Bewirtung)
 */
async function exampleBewirtung() {
  const configService = new ConfigService();
  const prisma = new PrismaService(configService);
  const classifier = new EnhancedTransactionClassifierService(configService, prisma);

  const transaction: TransactionForClassification = {
    description: 'Restaurant Zum Goldenen Löwen',
    amount: -8500, // 85.00 EUR
    type: 'DEBIT',
    date: new Date('2024-12-05'),
  };

  const result = await classifier.classifyTransaction(transaction);

  console.log('\nBewirtung (Business Meal) Classification:');
  console.log('==========================================');
  console.log(`Tax Category: ${result.tax.taxCategory}`); // Should be BEWIRTUNG
  console.log(`Deduction %: ${result.tax.deductionPercentage}%`); // Should be 70%
  console.log(`Full Amount: 85.00 EUR`);
  console.log(`Deductible: ${(result.tax.deductibleAmount / 100).toFixed(2)} EUR`); // 59.50 EUR (70%)
  console.log(`\nSpecial Requirements:`);
  result.business.specialRequirements?.forEach((req) => {
    console.log(`  - ${req}`);
  });
}

/**
 * Example: Classify mixed-use phone expense
 */
async function exampleTelefonInternet() {
  const configService = new ConfigService();
  const prisma = new PrismaService(configService);
  const classifier = new EnhancedTransactionClassifierService(configService, prisma);

  const transaction: TransactionForClassification = {
    description: 'Telekom Deutschland GmbH Mobilfunk',
    amount: -4999, // 49.99 EUR
    type: 'DEBIT',
    date: new Date('2024-12-01'),
  };

  const result = await classifier.classifyTransaction(transaction);

  console.log('\nTelefon/Internet Classification:');
  console.log('=================================');
  console.log(`Tax Category: ${result.tax.taxCategory}`); // Should be TELEFON_INTERNET
  console.log(`Business %: ${result.business.businessPercentage}%`); // Likely 50%
  console.log(`Full Amount: 49.99 EUR`);
  console.log(
    `Business Portion: ${((result.business.businessPercentage / 100) * 49.99).toFixed(2)} EUR`,
  );
  if (result.flags?.possiblyPrivate) {
    console.log('\n⚠️  Mixed business/private use detected');
  }
}

/**
 * Example: Batch classification
 */
async function exampleBatchClassification() {
  const configService = new ConfigService();
  const prisma = new PrismaService(configService);
  const classifier = new EnhancedTransactionClassifierService(configService, prisma);

  const transactions: TransactionForClassification[] = [
    {
      description: 'Adobe Creative Cloud',
      amount: -5999,
      type: 'DEBIT',
      date: new Date('2024-12-01'),
    },
    {
      description: 'Shell Tankstelle 12345',
      amount: -7500,
      type: 'DEBIT',
      date: new Date('2024-12-03'),
    },
    {
      description: 'Booking.com Hotel Reservation',
      amount: -15000,
      type: 'DEBIT',
      date: new Date('2024-12-05'),
    },
    {
      description: 'Kunde Schmidt - Rechnung 2024-001',
      amount: 119000, // Income
      type: 'CREDIT',
      date: new Date('2024-12-06'),
    },
  ];

  const result = await classifier.classifyBatch(transactions);

  console.log('\nBatch Classification Results:');
  console.log('==============================');
  console.log(`Total: ${result.total}`);
  console.log(`Classified: ${result.classified}`);
  console.log(`Failed: ${result.failed}`);
  console.log(`Average Confidence: ${(result.averageConfidence * 100).toFixed(1)}%`);
  console.log(`Processing Time: ${result.processingTime}ms`);

  console.log('\nIndividual Results:');
  result.results.forEach((r, idx) => {
    console.log(`\n${idx + 1}. ${transactions[idx].description}`);
    console.log(`   Category: ${r.classification.category}`);
    console.log(`   Tax Category: ${r.classification.tax.taxCategory}`);
    console.log(`   EÜR Line: ${r.classification.tax.eurLineNumber}`);
    if (r.error) {
      console.log(`   ❌ Error: ${r.error}`);
    }
  });
}

/**
 * Example: Tax category suggestion
 */
async function exampleTaxCategorySuggestion() {
  const configService = new ConfigService();
  const prisma = new PrismaService(configService);
  const classifier = new EnhancedTransactionClassifierService(configService, prisma);

  const category = 'Software Subscription';
  const description = 'Monthly subscription for project management tool';

  const taxCategory = await classifier.suggestTaxCategory(category, description);

  console.log('\nTax Category Suggestion:');
  console.log('========================');
  console.log(`Category: ${category}`);
  console.log(`Description: ${description}`);
  console.log(`Suggested Tax Category: ${taxCategory}`);
}

/**
 * Example: Common expense types
 */
async function exampleCommonExpenses() {
  const configService = new ConfigService();
  const prisma = new PrismaService(configService);
  const classifier = new EnhancedTransactionClassifierService(configService, prisma);

  const commonExpenses = [
    { desc: 'Amazon Business Office Supplies', expected: TaxCategory.BUEROKOSTEN },
    { desc: 'Deutsche Bahn ICE Ticket', expected: TaxCategory.REISEKOSTEN },
    { desc: 'GitHub Team Subscription', expected: TaxCategory.SONSTIGE_KOSTEN },
    { desc: 'Allianz Betriebshaftpflicht', expected: TaxCategory.VERSICHERUNGEN },
    { desc: 'Steuerberater Müller - Beratung', expected: TaxCategory.RECHTSBERATUNG },
  ];

  console.log('\nCommon Expense Classifications:');
  console.log('================================');

  for (const expense of commonExpenses) {
    const result = await classifier.classifyTransaction({
      description: expense.desc,
      amount: -10000,
      type: 'DEBIT',
    });

    const match = result.tax.taxCategory === expense.expected ? '✓' : '✗';
    console.log(
      `${match} ${expense.desc} → ${result.tax.taxCategory} (expected: ${expense.expected})`,
    );
  }
}

/**
 * Run all examples
 */
export async function runExamples() {
  console.log('Enhanced Transaction Classifier Examples');
  console.log('=========================================\n');

  try {
    await exampleSingleClassification();
    await exampleBewirtung();
    await exampleTelefonInternet();
    await exampleBatchClassification();
    await exampleTaxCategorySuggestion();
    await exampleCommonExpenses();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
    throw error;
  }
}

// Uncomment to run examples:
// runExamples().catch(console.error);
