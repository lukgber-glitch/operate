/**
 * Invoice Matcher Service - Usage Examples
 *
 * This file demonstrates how to use the InvoiceMatcherService
 * for auto-reconciling payments with invoices.
 */

import { InvoiceMatcherService } from './invoice-matcher.service';
import { MatchType, SuggestedAction } from './types/invoice-matching.types';

/**
 * Example 1: Basic Payment Matching
 */
async function exampleBasicMatching(
  invoiceMatcher: InvoiceMatcherService,
  orgId: string,
) {
  console.log('=== Example 1: Basic Payment Matching ===\n');

  const payment = {
    amount: 1000.0,
    description: 'Payment for Invoice INV-2024-001',
    counterparty: 'Acme Corporation',
    date: new Date(),
  };

  const result = await invoiceMatcher.matchPaymentToInvoice(payment, orgId);

  console.log('Payment:', payment);
  console.log('\nMatch Result:');
  console.log('- Matched:', result.matched);
  console.log('- Match Type:', result.matchType);
  console.log('- Confidence:', `${result.confidence}%`);
  console.log('- Suggested Action:', result.suggestedAction);
  console.log('- Reasons:', result.matchReasons);

  if (result.invoice) {
    console.log('\nMatched Invoice:');
    console.log('- Number:', result.invoice.number);
    console.log('- Customer:', result.invoice.customerName);
    console.log('- Amount:', `€${result.invoice.totalAmount}`);
  }
}

/**
 * Example 2: Auto-Reconciliation
 */
async function exampleAutoReconciliation(
  invoiceMatcher: InvoiceMatcherService,
  orgId: string,
  transactionId: string,
) {
  console.log('\n=== Example 2: Auto-Reconciliation ===\n');

  const payment = {
    amount: 1500.0,
    description: 'RE-2024-042 Payment',
    counterparty: 'Tech Solutions GmbH',
    date: new Date(),
  };

  const result = await invoiceMatcher.matchPaymentToInvoice(payment, orgId);

  console.log('Match Confidence:', `${result.confidence}%`);
  console.log('Suggested Action:', result.suggestedAction);

  // Auto-reconcile if confidence is high enough
  if (result.suggestedAction === SuggestedAction.AUTO_RECONCILE && result.invoice) {
    console.log('\n✓ Auto-reconciling invoice...');
    await invoiceMatcher.autoReconcile(transactionId, result.invoice.id);
    console.log('✓ Invoice', result.invoice.number, 'marked as PAID');
  } else {
    console.log('\n⚠ Confidence too low for auto-reconciliation');
    console.log('Manual review recommended');
  }
}

/**
 * Example 3: Partial Payment
 */
async function examplePartialPayment(
  invoiceMatcher: InvoiceMatcherService,
  orgId: string,
  transactionId: string,
) {
  console.log('\n=== Example 3: Partial Payment ===\n');

  const payment = {
    amount: 500.0, // Only half of the invoice
    description: 'Partial payment INV-2024-005',
    counterparty: 'Small Business Ltd',
    date: new Date(),
  };

  const result = await invoiceMatcher.matchPaymentToInvoice(payment, orgId);

  console.log('Payment:', `€${payment.amount}`);
  console.log('Match Type:', result.matchType);

  if (result.matchType === MatchType.PARTIAL && result.invoice) {
    console.log('\n✓ Partial payment detected');
    console.log('- Invoice Amount:', `€${result.invoice.totalAmount}`);
    console.log('- Payment Amount:', `€${payment.amount}`);
    console.log('- Remaining:', `€${result.amountRemaining}`);

    await invoiceMatcher.recordPartialPayment(
      transactionId,
      result.invoice.id,
      payment.amount,
    );
    console.log('✓ Partial payment recorded');
  }
}

/**
 * Example 4: Multiple Potential Matches
 */
async function exampleMultipleMatches(
  invoiceMatcher: InvoiceMatcherService,
  orgId: string,
) {
  console.log('\n=== Example 4: Multiple Potential Matches ===\n');

  const payment = {
    amount: 1000.0,
    description: 'Payment from customer',
    counterparty: 'Acme Corp',
    date: new Date(),
  };

  const potentialMatches = await invoiceMatcher.findPotentialMatches(payment, orgId);

  console.log(`Found ${potentialMatches.length} potential matches:\n`);

  potentialMatches.forEach((match, index) => {
    console.log(`Match ${index + 1}:`);
    console.log('- Invoice:', match.invoice.number);
    console.log('- Amount:', `€${match.invoice.totalAmount}`);
    console.log('- Confidence:', `${match.confidence}%`);
    console.log('- Match Type:', match.matchType);
    console.log('- Reasons:', match.matchReasons.join(', '));
    console.log();
  });
}

/**
 * Example 5: Fuzzy Name Matching
 */
async function exampleFuzzyMatching(
  invoiceMatcher: InvoiceMatcherService,
  orgId: string,
) {
  console.log('\n=== Example 5: Fuzzy Name Matching ===\n');

  // Payment with slightly different company name
  const payment = {
    amount: 2500.0,
    description: 'Invoice payment',
    counterparty: 'ACME CORPORATION LIMITED', // Note: different from "Acme Corp"
    date: new Date(),
  };

  const result = await invoiceMatcher.matchPaymentToInvoice(payment, orgId);

  console.log('Payment from:', payment.counterparty);
  console.log('\nMatch Result:');
  console.log('- Matched:', result.matched);
  console.log('- Confidence:', `${result.confidence}%`);
  console.log('- Match Reasons:', result.matchReasons);

  if (result.invoice) {
    console.log('\nMatched to invoice for:', result.invoice.customerName);
    console.log('(Fuzzy name matching detected variation)');
  }
}

/**
 * Example 6: No Match Scenario
 */
async function exampleNoMatch(
  invoiceMatcher: InvoiceMatcherService,
  orgId: string,
) {
  console.log('\n=== Example 6: No Match Scenario ===\n');

  const payment = {
    amount: 99.99,
    description: 'Random payment',
    counterparty: 'Unknown Company XYZ',
    date: new Date(),
  };

  const result = await invoiceMatcher.matchPaymentToInvoice(payment, orgId);

  console.log('Payment:', payment);
  console.log('\nMatch Result:');
  console.log('- Matched:', result.matched);
  console.log('- Match Type:', result.matchType);
  console.log('- Suggested Action:', result.suggestedAction);

  if (result.suggestedAction === SuggestedAction.CREATE_CUSTOMER) {
    console.log('\n💡 Suggestion: No matching invoice found');
    console.log('Consider creating a new customer for:', payment.counterparty);
  }
}

/**
 * Example 7: Multi-Invoice Match (Overpayment)
 */
async function exampleMultiInvoiceMatch(
  invoiceMatcher: InvoiceMatcherService,
  orgId: string,
) {
  console.log('\n=== Example 7: Multi-Invoice Match ===\n');

  const payment = {
    amount: 3500.0, // Might cover multiple invoices
    description: 'Bulk payment for outstanding invoices',
    counterparty: 'Regular Customer Ltd',
    date: new Date(),
  };

  const result = await invoiceMatcher.matchPaymentToInvoice(payment, orgId);

  console.log('Payment Amount:', `€${payment.amount}`);

  if (result.suggestedAction === SuggestedAction.MULTI_INVOICE && result.invoices) {
    console.log(`\n✓ Payment matches ${result.invoices.length} invoices:`);

    let total = 0;
    result.invoices.forEach((invoice) => {
      const amount = Number(invoice.totalAmount);
      total += amount;
      console.log(`- ${invoice.number}: €${amount}`);
    });

    console.log('\nTotal Matched:', `€${total}`);
    console.log('Remaining:', `€${result.amountRemaining || 0}`);
    console.log('\n💡 Multiple invoices can be reconciled at once');
  }
}

/**
 * Example 8: Reference Extraction Test
 */
async function exampleReferenceExtraction() {
  console.log('\n=== Example 8: Reference Extraction ===\n');

  const testDescriptions = [
    'Payment for Invoice #2024-001',
    'RE-123 Settlement',
    'INV-2024-042 Payment received',
    'Bill 12345',
    'Rechnung RG-2024-003',
    'Multiple refs: #123 and INV-456',
  ];

  // Import the reference matcher
  const { ReferenceMatcher } = await import('./matchers/reference-matcher');
  const matcher = new ReferenceMatcher();

  console.log('Testing reference extraction from descriptions:\n');

  testDescriptions.forEach((desc) => {
    const result = matcher.extractReferences(desc);
    console.log(`Description: "${desc}"`);
    console.log('- Found:', result.found);
    console.log('- References:', result.references.join(', ') || 'None');
    console.log('- Confidence:', `${result.confidence}%`);
    console.log();
  });
}

/**
 * Main example runner
 */
export async function runAllExamples(
  invoiceMatcher: InvoiceMatcherService,
  orgId: string,
  transactionId: string,
) {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Invoice Matcher Service - Usage Examples    ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    await exampleBasicMatching(invoiceMatcher, orgId);
    await exampleAutoReconciliation(invoiceMatcher, orgId, transactionId);
    await examplePartialPayment(invoiceMatcher, orgId, transactionId);
    await exampleMultipleMatches(invoiceMatcher, orgId);
    await exampleFuzzyMatching(invoiceMatcher, orgId);
    await exampleNoMatch(invoiceMatcher, orgId);
    await exampleMultiInvoiceMatch(invoiceMatcher, orgId);
    await exampleReferenceExtraction();

    console.log('\n✓ All examples completed successfully!');
  } catch (error) {
    console.error('\n✗ Error running examples:', error.message);
  }
}

/**
 * Export individual examples for selective testing
 */
export {
  exampleBasicMatching,
  exampleAutoReconciliation,
  examplePartialPayment,
  exampleMultipleMatches,
  exampleFuzzyMatching,
  exampleNoMatch,
  exampleMultiInvoiceMatch,
  exampleReferenceExtraction,
};
