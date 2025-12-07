/**
 * TransactionInsight Component - Usage Examples
 *
 * This file demonstrates various use cases and configurations
 * of the TransactionInsight component for chat messages.
 */

'use client';

import { TransactionInsight } from './TransactionInsight';

/**
 * Example 1: Unmatched Debit Transaction with High Confidence
 * This shows a typical expense transaction that needs to be categorized
 */
export function UnmatchedDebitExample() {
  return (
    <TransactionInsight
      transaction={{
        id: 'txn_001',
        amount: 234.50,
        currency: 'EUR',
        description: 'Amazon Web Services',
        merchantName: 'AWS EMEA SARL',
        bookingDate: '2024-01-15',
        category: 'Cloud Services',
        taxCategory: 'Operating Expenses',
        confidence: 0.92,
        reconciliationStatus: 'UNMATCHED',
        isDebit: true,
      }}
      onCategorize={(id) => console.log('Categorize transaction:', id)}
      onMatch={(id) => console.log('Match transaction:', id)}
      onIgnore={(id) => console.log('Ignore transaction:', id)}
    />
  );
}

/**
 * Example 2: Unmatched Credit Transaction (Income)
 * Shows an incoming payment that could be matched to an invoice
 */
export function UnmatchedCreditExample() {
  return (
    <TransactionInsight
      transaction={{
        id: 'txn_002',
        amount: 1500.00,
        currency: 'USD',
        description: 'Client Payment - Invoice #INV-2024-001',
        merchantName: 'Acme Corp',
        bookingDate: '2024-01-16',
        category: 'Client Payments',
        taxCategory: 'Revenue',
        confidence: 0.88,
        reconciliationStatus: 'UNMATCHED',
        isDebit: false,
      }}
      onMatch={(id) => console.log('Match to invoice:', id)}
    />
  );
}

/**
 * Example 3: Matched Transaction
 * Shows a transaction that has been successfully reconciled
 */
export function MatchedTransactionExample() {
  return (
    <TransactionInsight
      transaction={{
        id: 'txn_003',
        amount: 450.00,
        currency: 'EUR',
        description: 'Office Supplies - Staples',
        merchantName: 'Staples Inc.',
        bookingDate: '2024-01-14',
        category: 'Office Expenses',
        taxCategory: 'Deductible Expenses',
        confidence: 0.95,
        reconciliationStatus: 'MATCHED',
        isDebit: true,
      }}
    />
  );
}

/**
 * Example 4: Ignored Transaction
 * Shows a transaction that was marked as not requiring action
 */
export function IgnoredTransactionExample() {
  return (
    <TransactionInsight
      transaction={{
        id: 'txn_004',
        amount: 5.00,
        currency: 'EUR',
        description: 'Bank Fee - Monthly Maintenance',
        bookingDate: '2024-01-01',
        category: 'Bank Fees',
        confidence: 0.99,
        reconciliationStatus: 'IGNORED',
        isDebit: true,
      }}
    />
  );
}

/**
 * Example 5: Low Confidence Transaction
 * Shows a transaction where AI classification is uncertain
 */
export function LowConfidenceExample() {
  return (
    <TransactionInsight
      transaction={{
        id: 'txn_005',
        amount: 89.99,
        currency: 'GBP',
        description: 'POS Purchase - Unknown Merchant',
        bookingDate: '2024-01-17',
        category: 'Miscellaneous',
        confidence: 0.45,
        reconciliationStatus: 'UNMATCHED',
        isDebit: true,
      }}
      onCategorize={(id) => console.log('Categorize transaction:', id)}
    />
  );
}

/**
 * Example 6: Transaction Without Tax Category
 * Shows a basic transaction with minimal information
 */
export function MinimalTransactionExample() {
  return (
    <TransactionInsight
      transaction={{
        id: 'txn_006',
        amount: 125.00,
        currency: 'USD',
        description: 'Cash Withdrawal ATM',
        bookingDate: '2024-01-18',
        reconciliationStatus: 'UNMATCHED',
        isDebit: true,
      }}
      onIgnore={(id) => console.log('Ignore transaction:', id)}
    />
  );
}

/**
 * Example 7: Large Credit Transaction
 * Shows a significant incoming payment
 */
export function LargeCreditExample() {
  return (
    <TransactionInsight
      transaction={{
        id: 'txn_007',
        amount: 25000.00,
        currency: 'EUR',
        description: 'Investment Income - Q1 Dividends',
        merchantName: 'Investment Fund XYZ',
        bookingDate: '2024-01-20',
        category: 'Investment Income',
        taxCategory: 'Capital Gains',
        confidence: 0.97,
        reconciliationStatus: 'UNMATCHED',
        isDebit: false,
      }}
      onMatch={(id) => console.log('Match transaction:', id)}
    />
  );
}

/**
 * Example 8: Demo Page with Multiple Transaction Types
 * Shows all transaction types in a scrollable list
 */
export function TransactionInsightDemo() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">TransactionInsight Component Examples</h2>
        <p className="text-muted-foreground mb-6">
          Various states and configurations of the TransactionInsight card component
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. Unmatched Debit (High Confidence)</h3>
          <UnmatchedDebitExample />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">2. Unmatched Credit (Income)</h3>
          <UnmatchedCreditExample />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">3. Matched Transaction</h3>
          <MatchedTransactionExample />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">4. Ignored Transaction</h3>
          <IgnoredTransactionExample />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">5. Low Confidence Classification</h3>
          <LowConfidenceExample />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">6. Minimal Information</h3>
          <MinimalTransactionExample />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">7. Large Credit Transaction</h3>
          <LargeCreditExample />
        </div>
      </div>
    </div>
  );
}

/**
 * Integration Example: Using in Chat Message
 * Shows how to integrate TransactionInsight in a chat conversation
 */
export function ChatIntegrationExample() {
  const handleCategorize = (id: string) => {
    // Open categorization dialog
    console.log('Opening category selector for:', id);
  };

  const handleMatch = (id: string) => {
    // Open matching dialog
    console.log('Opening match dialog for:', id);
  };

  const handleIgnore = (id: string) => {
    // Mark transaction as ignored
    console.log('Marking transaction as ignored:', id);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {/* Chat message from assistant */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
          AI
        </div>
        <div className="flex-1 space-y-2">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              I found this unmatched transaction from yesterday. It looks like a cloud service expense.
              Would you like me to categorize it or match it to an existing expense?
            </p>
          </div>

          <TransactionInsight
            transaction={{
              id: 'txn_chat_001',
              amount: 234.50,
              currency: 'EUR',
              description: 'Amazon Web Services',
              merchantName: 'AWS EMEA SARL',
              bookingDate: '2024-01-15',
              category: 'Cloud Services',
              taxCategory: 'Operating Expenses',
              confidence: 0.92,
              reconciliationStatus: 'UNMATCHED',
              isDebit: true,
            }}
            onCategorize={handleCategorize}
            onMatch={handleMatch}
            onIgnore={handleIgnore}
          />
        </div>
      </div>
    </div>
  );
}
