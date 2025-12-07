/**
 * Example Test Script for Transaction Classification Pipeline
 *
 * This file demonstrates how to test the pipeline manually.
 * Copy this file and modify as needed for testing.
 *
 * DO NOT commit this file with real credentials or data.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { TransactionPipelineService } from './transaction-pipeline.service';
import { BankSyncService } from '../bank-sync/bank-sync.service';

async function testPipeline() {
  // Bootstrap the NestJS application
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get service instances
  const pipelineService = app.get(TransactionPipelineService);
  const bankSyncService = app.get(BankSyncService);

  try {
    // Example 1: Trigger pipeline for a specific connection
    console.log('\n=== Test 1: Trigger Pipeline for Connection ===');
    const connectionId = 'YOUR_CONNECTION_ID_HERE'; // Replace with actual connection ID

    const result = await pipelineService.triggerPipeline(connectionId);

    console.log('Pipeline Result:');
    console.log(`  Total Processed: ${result.totalProcessed}`);
    console.log(`  Categorized: ${result.categorized}`);
    console.log(`  Auto-Categorized: ${result.autoCategorized}`);
    console.log(`  Tax Deductions Applied: ${result.taxDeductionsApplied}`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Duration: ${result.duration}ms`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(err => {
        console.log(`  - Transaction ${err.transactionId}: ${err.error}`);
      });
    }

    // Example 2: Re-classify specific transactions
    console.log('\n=== Test 2: Re-classify Transactions ===');
    const transactionIds = [
      'TRANSACTION_ID_1', // Replace with actual transaction IDs
      'TRANSACTION_ID_2',
    ];

    await pipelineService.reclassifyTransactions(transactionIds);
    console.log(`Re-classified ${transactionIds.length} transactions`);

    // Example 3: Sync bank and trigger pipeline automatically
    console.log('\n=== Test 3: Sync Bank (Pipeline triggers automatically) ===');
    const syncResult = await bankSyncService.syncConnection({
      connectionId
    });

    console.log('Sync Result:');
    console.log(`  Success: ${syncResult.success}`);
    console.log(`  Accounts Synced: ${syncResult.accountsSynced}`);
    console.log(`  Transactions Synced: ${syncResult.transactionsSynced}`);
    console.log(`  New Transactions: ${syncResult.newTransactions}`);
    console.log('\nNote: Pipeline will process automatically via event listener');

    // Example 4: Query categorized transactions
    console.log('\n=== Test 4: Query Categorized Transactions ===');
    const prisma = app.get('PrismaService');

    const categorizedTx = await prisma.bankTransactionNew.findMany({
      where: {
        category: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        description: true,
        amount: true,
        category: true,
        metadata: true,
      },
    });

    console.log(`Found ${categorizedTx.length} categorized transactions:`);
    categorizedTx.forEach((tx, idx) => {
      console.log(`\n${idx + 1}. ${tx.description}`);
      console.log(`   Amount: ${tx.amount} (Category: ${tx.category})`);

      if (tx.metadata && typeof tx.metadata === 'object') {
        const meta = tx.metadata as any;
        if (meta.categorization) {
          console.log(`   Confidence: ${meta.categorization.confidence}`);
        }
        if (meta.taxDeduction) {
          console.log(`   Tax Deduction: ${meta.taxDeduction.deductionPercentage}%`);
        }
      }
    });

    // Example 5: Query unclassified transactions
    console.log('\n=== Test 5: Query Unclassified Transactions ===');

    const unclassifiedTx = await prisma.bankTransactionNew.findMany({
      where: {
        category: null,
        reconciliationStatus: 'UNMATCHED',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        description: true,
        amount: true,
        merchantName: true,
      },
    });

    console.log(`Found ${unclassifiedTx.length} unclassified transactions:`);
    unclassifiedTx.forEach((tx, idx) => {
      console.log(`${idx + 1}. ${tx.description} (${tx.amount})`);
      console.log(`   Merchant: ${tx.merchantName || 'N/A'}`);
    });

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await app.close();
  }
}

// Run the test
testPipeline()
  .then(() => {
    console.log('\n=== Test Complete ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== Test Failed ===');
    console.error(error);
    process.exit(1);
  });

/**
 * Usage:
 *
 * 1. Copy this file to test-pipeline.ts
 * 2. Replace placeholder IDs with actual data
 * 3. Run: npx ts-node test-pipeline.ts
 * 4. Check console output
 * 5. Verify database changes
 *
 * Expected Output:
 * - Pipeline processes unclassified transactions
 * - High-confidence transactions get category field populated
 * - All transactions get metadata with categorization results
 * - Tax deductions calculated for expense transactions
 * - Events emitted (check logs)
 */
