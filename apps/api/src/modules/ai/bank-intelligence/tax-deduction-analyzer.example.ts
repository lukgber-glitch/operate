/**
 * Tax Deduction Analyzer Example
 * Demonstrates usage of the TaxDeductionAnalyzerService
 */

import { TaxDeductionAnalyzerService } from './tax-deduction-analyzer.service';
import { EnhancedTransactionClassifierService } from './transaction-classifier.service';
import { TaxCategory } from './types/tax-categories.types';

/**
 * Example 1: Analyze a single software subscription expense
 */
async function example1(
  classifier: EnhancedTransactionClassifierService,
  analyzer: TaxDeductionAnalyzerService,
) {
  console.log('\n=== Example 1: Software Subscription ===\n');

  // Transaction from bank
  const transaction = {
    amount: -11900, // -119.00 EUR (including 19% VAT)
    description: 'GitHub Pro Subscription',
    type: 'DEBIT' as const,
    counterparty: 'GitHub Inc.',
    currency: 'EUR',
  };

  // Step 1: Classify transaction
  const classification = await classifier.classifyTransaction(transaction);

  console.log('Classification:');
  console.log(`  Category: ${classification.category}`);
  console.log(`  Tax Category: ${classification.tax.taxCategory}`);
  console.log(`  Confidence: ${(classification.confidence * 100).toFixed(1)}%`);

  // Step 2: Analyze deduction
  const deduction = await analyzer.analyzeDeduction(transaction, classification);

  console.log('\nDeduction Analysis:');
  console.log(`  Gross Amount: ${(deduction.grossAmount / 100).toFixed(2)} EUR`);
  console.log(`  Net Amount: ${(deduction.netAmount / 100).toFixed(2)} EUR`);
  console.log(`  VAT (19%): ${((deduction.grossAmount - deduction.netAmount) / 100).toFixed(2)} EUR`);
  console.log(`  Deductible: ${(deduction.deductibleAmount / 100).toFixed(2)} EUR (${deduction.deductionPercentage}%)`);
  console.log(`  VAT Reclaimable: ${(deduction.vatReclaimable / 100).toFixed(2)} EUR`);
  console.log(`  Net Tax Benefit: ${(deduction.netTaxBenefit / 100).toFixed(2)} EUR`);
  console.log(`  EÜR Line: ${deduction.eurLineNumber} - ${deduction.eurDescription}`);
  console.log(`  Documentation: ${deduction.documentationRequired.join(', ')}`);
}

/**
 * Example 2: Analyze business meal (70% deductible)
 */
async function example2(
  classifier: EnhancedTransactionClassifierService,
  analyzer: TaxDeductionAnalyzerService,
) {
  console.log('\n=== Example 2: Business Meal (Bewirtung) ===\n');

  const transaction = {
    amount: -8500, // -85.00 EUR
    description: 'Restaurant Zur Post - Geschäftsessen',
    type: 'DEBIT' as const,
    counterparty: 'Restaurant Zur Post',
    currency: 'EUR',
  };

  const classification = await classifier.classifyTransaction(transaction);
  const deduction = await analyzer.analyzeDeduction(transaction, classification);

  console.log('Deduction Analysis:');
  console.log(`  Gross Amount: ${(deduction.grossAmount / 100).toFixed(2)} EUR`);
  console.log(`  Deductible: ${(deduction.deductibleAmount / 100).toFixed(2)} EUR (${deduction.deductionPercentage}%)`);
  console.log(`  VAT Reclaimable: ${(deduction.vatReclaimable / 100).toFixed(2)} EUR (NOT reclaimable for Bewirtung!)`);
  console.log(`  EÜR Line: ${deduction.eurLineNumber} - ${deduction.eurDescription}`);
  console.log('\nSpecial Requirements:');
  deduction.warnings.forEach((w) => console.log(`  - ${w}`));
}

/**
 * Example 3: Analyze phone/internet (50% business use)
 */
async function example3(
  classifier: EnhancedTransactionClassifierService,
  analyzer: TaxDeductionAnalyzerService,
) {
  console.log('\n=== Example 3: Phone/Internet (Mixed Use) ===\n');

  const transaction = {
    amount: -5950, // -59.50 EUR
    description: 'Telekom Mobilfunk',
    type: 'DEBIT' as const,
    counterparty: 'Deutsche Telekom',
    currency: 'EUR',
  };

  const classification = await classifier.classifyTransaction(transaction);
  const deduction = await analyzer.analyzeDeduction(transaction, classification);

  console.log('Deduction Analysis:');
  console.log(`  Gross Amount: ${(deduction.grossAmount / 100).toFixed(2)} EUR`);
  console.log(`  Business Percentage: 50% (standard for mixed use)`);
  console.log(`  Deductible: ${(deduction.deductibleAmount / 100).toFixed(2)} EUR`);
  console.log(`  VAT Reclaimable: ${(deduction.vatReclaimable / 100).toFixed(2)} EUR`);
  console.log(`  EÜR Line: ${deduction.eurLineNumber} - ${deduction.eurDescription}`);
}

/**
 * Example 4: Calculate quarterly deductions
 */
async function example4(analyzer: TaxDeductionAnalyzerService) {
  console.log('\n=== Example 4: Quarterly Deduction Summary ===\n');

  const orgId = 'org_12345';
  const quarter = 1;
  const year = 2024;

  const summary = await analyzer.calculateQuarterlyDeductions(
    orgId,
    quarter,
    year,
  );

  console.log(`Q${quarter} ${year} Summary:`);
  console.log(`  Total Expenses: ${(summary.totalExpenses / 100).toFixed(2)} EUR`);
  console.log(`  Total Deductible: ${(summary.totalDeductible / 100).toFixed(2)} EUR`);
  console.log(`  VAT Reclaimable: ${(summary.vatReclaimable / 100).toFixed(2)} EUR`);
  console.log(`  Transactions: ${summary.transactionCount}`);

  console.log('\nBy Category:');
  Object.entries(summary.byCategory)
    .sort((a, b) => b[1].deductible - a[1].deductible)
    .slice(0, 5)
    .forEach(([category, data]) => {
      console.log(
        `  ${category}: ${(data.deductible / 100).toFixed(2)} EUR (${data.count} transactions)`,
      );
    });

  console.log('\nEÜR Form Lines:');
  Object.entries(summary.eurSummary)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([line, amount]) => {
      console.log(`  Line ${line}: ${(amount / 100).toFixed(2)} EUR`);
    });
}

/**
 * Example 5: Estimate annual tax
 */
async function example5(analyzer: TaxDeductionAnalyzerService) {
  console.log('\n=== Example 5: Annual Tax Estimation ===\n');

  const orgId = 'org_12345';
  const year = 2024;

  const estimation = await analyzer.estimateAnnualTaxSavings(orgId, year);

  console.log(`Tax Estimation for ${year}:`);
  console.log(`  Estimated Income: ${(estimation.estimatedIncome / 100).toLocaleString('de-DE')} EUR`);
  console.log(`  Estimated Expenses: ${(estimation.estimatedExpenses / 100).toLocaleString('de-DE')} EUR`);
  console.log(`  Estimated Deductions: ${(estimation.estimatedDeductions / 100).toLocaleString('de-DE')} EUR`);
  console.log(`  Taxable Income: ${(estimation.estimatedTaxableIncome / 100).toLocaleString('de-DE')} EUR`);
  console.log(`\n  Income Tax: ${(estimation.estimatedIncomeTax / 100).toLocaleString('de-DE')} EUR`);
  console.log(`  Solidarity Surcharge: ${(estimation.estimatedSoli / 100).toLocaleString('de-DE')} EUR`);
  console.log(`  Total Tax: ${(estimation.estimatedTotalTax / 100).toLocaleString('de-DE')} EUR`);
  console.log(`  VAT Balance: ${(estimation.estimatedVatBalance / 100).toLocaleString('de-DE')} EUR`);
  console.log(`\n  Effective Tax Rate: ${estimation.effectiveTaxRate.toFixed(2)}%`);
  console.log(`  Tax Bracket: ${estimation.taxBracket}`);

  console.log('\nQuarterly Breakdown:');
  estimation.quarters.forEach((q) => {
    console.log(
      `  Q${q.quarter}: ${(q.totalDeductible / 100).toLocaleString('de-DE')} EUR deductible`,
    );
  });
}

/**
 * Example 6: Gift limit (35 EUR per person)
 */
async function example6(
  classifier: EnhancedTransactionClassifierService,
  analyzer: TaxDeductionAnalyzerService,
) {
  console.log('\n=== Example 6: Business Gift (35 EUR Limit) ===\n');

  const transaction = {
    amount: -5000, // -50.00 EUR (exceeds limit!)
    description: 'Geschenk für Kunde - Weinpaket',
    type: 'DEBIT' as const,
    currency: 'EUR',
  };

  const classification = await classifier.classifyTransaction(transaction);
  const deduction = await analyzer.analyzeDeduction(transaction, classification);

  console.log('Deduction Analysis:');
  console.log(`  Gross Amount: ${(deduction.grossAmount / 100).toFixed(2)} EUR`);
  console.log(`  Deductible: ${(deduction.deductibleAmount / 100).toFixed(2)} EUR`);
  console.log(`  WARNING: Exceeds 35 EUR per person limit!`);
  console.log('\nWarnings:');
  deduction.warnings.forEach((w) => console.log(`  - ${w}`));
}

/**
 * Example 7: Batch analysis
 */
async function example7(
  classifier: EnhancedTransactionClassifierService,
  analyzer: TaxDeductionAnalyzerService,
) {
  console.log('\n=== Example 7: Batch Analysis ===\n');

  const transactions = [
    {
      amount: -11900,
      description: 'AWS Cloud Services',
      classification: await classifier.classifyTransaction({
        amount: -11900,
        description: 'AWS Cloud Services',
        type: 'DEBIT',
      }),
    },
    {
      amount: -2900,
      description: 'Office supplies - Staples',
      classification: await classifier.classifyTransaction({
        amount: -2900,
        description: 'Office supplies - Staples',
        type: 'DEBIT',
      }),
    },
    {
      amount: -15000,
      description: 'Steuerberater - Monatliche Beratung',
      classification: await classifier.classifyTransaction({
        amount: -15000,
        description: 'Steuerberater - Monatliche Beratung',
        type: 'DEBIT',
      }),
    },
  ];

  const results = await analyzer.analyzeBatchDeductions(transactions);

  console.log(`Analyzed ${results.length} transactions:\n`);

  results.forEach((result, idx) => {
    console.log(`${idx + 1}. ${transactions[idx].description}`);
    console.log(`   Deductible: ${(result.deductibleAmount / 100).toFixed(2)} EUR`);
    console.log(`   VAT Reclaimable: ${(result.vatReclaimable / 100).toFixed(2)} EUR`);
    console.log(`   Tax Benefit: ${(result.netTaxBenefit / 100).toFixed(2)} EUR`);
    console.log(`   EÜR Line: ${result.eurLineNumber}\n`);
  });

  const totalBenefit = results.reduce((sum, r) => sum + r.netTaxBenefit, 0);
  console.log(`Total Tax Benefit: ${(totalBenefit / 100).toFixed(2)} EUR`);
}

/**
 * Run all examples
 */
export async function runTaxDeductionExamples(
  classifier: EnhancedTransactionClassifierService,
  analyzer: TaxDeductionAnalyzerService,
) {
  console.log('='.repeat(60));
  console.log('TAX DEDUCTION ANALYZER EXAMPLES');
  console.log('='.repeat(60));

  await example1(classifier, analyzer);
  await example2(classifier, analyzer);
  await example3(classifier, analyzer);
  await example4(analyzer);
  await example5(analyzer);
  await example6(classifier, analyzer);
  await example7(classifier, analyzer);

  console.log('\n' + '='.repeat(60));
  console.log('All examples completed!');
  console.log('='.repeat(60) + '\n');
}
