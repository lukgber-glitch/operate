/**
 * Bill Matcher Service - Usage Examples
 *
 * This file demonstrates how to use the BillMatcherService
 * for auto-reconciling outgoing payments with vendor bills.
 */

import { BillMatcherService } from './bill-matcher.service';
import { OutgoingPaymentInput, BillSuggestedAction } from './types/bill-matching.types';

/**
 * Example 1: Basic Payment Matching
 */
async function exampleBasicMatching(
  billMatcher: BillMatcherService,
  orgId: string,
) {
  console.log('=== Example 1: Basic Payment Matching ===\n');

  const payment: OutgoingPaymentInput = {
    amount: 500.0,
    description: 'AWS Invoice #12345',
    counterparty: 'Amazon Web Services',
    date: new Date('2024-01-15'),
  };

  const result = await billMatcher.matchPaymentToBill(payment, orgId);

  console.log('Payment:', payment);
  console.log('\nMatch Result:');
  console.log('  Matched:', result.matched);
  console.log('  Type:', result.matchType);
  console.log('  Confidence:', `${result.confidence}%`);
  console.log('  Suggested Action:', result.suggestedAction);
  console.log('  Reasons:', result.matchReasons);

  // Auto-reconcile if confidence is high
  if (
    result.matched &&
    result.suggestedAction === BillSuggestedAction.AUTO_RECONCILE &&
    result.bill
  ) {
    await billMatcher.autoReconcileBill('transaction-123', result.bill.id);
    console.log(`\n✓ Bill ${result.bill.billNumber} marked as PAID`);
  }
}

/**
 * Example 2: Partial Payment Handling
 */
async function examplePartialPayment(
  billMatcher: BillMatcherService,
  orgId: string,
) {
  console.log('\n=== Example 2: Partial Payment ===\n');

  const payment: OutgoingPaymentInput = {
    amount: 250.0, // Only half the bill amount
    description: 'Partial payment for Invoice #67890',
    counterparty: 'Office Supplies Inc',
    date: new Date('2024-01-20'),
  };

  const result = await billMatcher.matchPaymentToBill(payment, orgId);

  console.log('Payment:', payment);
  console.log('\nMatch Result:');
  console.log('  Matched:', result.matched);
  console.log('  Type:', result.matchType);
  console.log('  Confidence:', `${result.confidence}%`);
  console.log('  Amount Remaining:', result.amountRemaining);

  if (
    result.matched &&
    result.suggestedAction === BillSuggestedAction.PARTIAL_PAYMENT &&
    result.bill
  ) {
    await billMatcher.recordPartialBillPayment('transaction-124', result.bill.id, payment.amount);
    console.log(`\n✓ Partial payment of €${payment.amount} recorded`);
  }
}

/**
 * Example 3: Recurring Payment Detection
 */
async function exampleRecurringPayment(
  billMatcher: BillMatcherService,
  orgId: string,
) {
  console.log('\n=== Example 3: Recurring Payment Detection ===\n');

  const payment: OutgoingPaymentInput = {
    amount: 523.50,
    description: 'AWS monthly billing',
    counterparty: 'Amazon Web Services',
    date: new Date('2024-02-01'),
  };

  const recurringInfo = await billMatcher.detectRecurringPayment(payment, orgId);

  console.log('Payment:', payment);
  console.log('\nRecurring Info:');
  console.log('  Is Recurring:', recurringInfo.isRecurring);
  console.log('  Confidence:', `${recurringInfo.confidence}%`);
  console.log('  Frequency:', recurringInfo.frequency);
  console.log('  Average Amount:', recurringInfo.averageAmount?.toFixed(2));
  console.log('  Predicted Next:', recurringInfo.predictedNextDate?.toISOString().split('T')[0]);
}

/**
 * Example 4: Find Potential Matches
 */
async function exampleFindMatches(
  billMatcher: BillMatcherService,
  orgId: string,
) {
  console.log('\n=== Example 4: Find Potential Matches ===\n');

  const payment: OutgoingPaymentInput = {
    amount: 299.0,
    description: 'Consulting services',
    counterparty: 'Tech Consulting GmbH',
    date: new Date('2024-02-10'),
  };

  const matches = await billMatcher.findPotentialBillMatches(payment, orgId);

  console.log('Payment:', payment);
  console.log(`\nFound ${matches.length} potential matches:\n`);

  matches.forEach((match, index) => {
    console.log(`Match ${index + 1}:`);
    console.log('  Bill:', match.bill.billNumber);
    console.log('  Vendor:', match.bill.vendorName);
    console.log('  Amount:', match.bill.totalAmount);
    console.log('  Confidence:', `${match.confidence}%`);
    console.log('  Reasons:', match.matchReasons.join(', '));
    console.log('');
  });
}

// Export examples
export {
  exampleBasicMatching,
  examplePartialPayment,
  exampleRecurringPayment,
  exampleFindMatches,
};

/**
 * Integration Example - Bank Feed Processing
 *
 * When processing outgoing transactions from bank feed:
 *
 * const payment: OutgoingPaymentInput = {
 *   amount: Math.abs(transaction.amount),
 *   description: transaction.description,
 *   counterparty: transaction.counterparty,
 *   date: transaction.date,
 * };
 *
 * const result = await billMatcher.matchPaymentToBill(payment, orgId);
 *
 * switch (result.suggestedAction) {
 *   case BillSuggestedAction.AUTO_RECONCILE:
 *     await billMatcher.autoReconcileBill(transaction.id, result.bill.id);
 *     // Notify: "Bill #12345 automatically paid"
 *     break;
 *
 *   case BillSuggestedAction.REVIEW:
 *     // Create notification for user review
 *     // Show suggested matches with confidence scores
 *     break;
 *
 *   case BillSuggestedAction.CREATE_BILL:
 *     // Suggest creating a bill or vendor
 *     const recurringInfo = await billMatcher.detectRecurringPayment(payment, orgId);
 *     if (recurringInfo.isRecurring) {
 *       // Notify: "Recurring payment detected (monthly AWS)"
 *     }
 *     break;
 * }
 */
