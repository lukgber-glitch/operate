# TransactionInsight Component

## Overview

The `TransactionInsight` component is a React card component designed to display bank transaction insights within chat messages. It provides a comprehensive view of transaction details including amount, category, tax classification, AI confidence scores, and reconciliation status.

## File Location

```
apps/web/src/components/chat/TransactionInsight.tsx
```

## Features

- **Visual Transaction Type Indicator**: Color-coded border and icons for debit (red) vs credit (green) transactions
- **Amount Display**: Prominently displayed with currency formatting and debit/credit indicator
- **Transaction Details**: Description, merchant name, and booking date
- **Category & Tax Classification**: Shows assigned category and tax category with clear labels
- **AI Confidence Score**: Visual progress bar indicating classification confidence level (High/Medium/Low)
- **Reconciliation Status**: Badge showing UNMATCHED, MATCHED, or IGNORED status
- **Quick Actions**: Contextual action buttons for categorize, match, and ignore operations
- **Responsive Design**: Adapts to different screen sizes while maintaining readability
- **Dark Mode Support**: Fully compatible with light and dark themes

## Component Props

```typescript
interface TransactionInsightProps {
  transaction: {
    id: string;                    // Unique transaction identifier
    amount: number;                 // Transaction amount (absolute value)
    currency: string;               // ISO currency code (e.g., 'USD', 'EUR')
    description: string;            // Transaction description
    merchantName?: string;          // Optional merchant/vendor name
    bookingDate: string;            // ISO date string
    category?: string;              // Assigned category name
    taxCategory?: string;           // Tax classification
    confidence?: number;            // AI confidence (0-1)
    reconciliationStatus: 'UNMATCHED' | 'MATCHED' | 'IGNORED';
    isDebit: boolean;               // true for expenses, false for income
  };
  onCategorize?: (id: string) => void;  // Handler for categorization action
  onMatch?: (id: string) => void;       // Handler for matching action
  onIgnore?: (id: string) => void;      // Handler for ignore action
}
```

## Usage Examples

### Basic Usage

```tsx
import { TransactionInsight } from '@/components/chat';

function ChatMessage() {
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
      onCategorize={(id) => handleCategorize(id)}
      onMatch={(id) => handleMatch(id)}
      onIgnore={(id) => handleIgnore(id)}
    />
  );
}
```

### Income Transaction (Credit)

```tsx
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
    isDebit: false,  // This is a credit/income transaction
  }}
  onMatch={(id) => handleMatch(id)}
/>
```

### Matched Transaction (Read-only)

```tsx
<TransactionInsight
  transaction={{
    id: 'txn_003',
    amount: 450.00,
    currency: 'EUR',
    description: 'Office Supplies',
    bookingDate: '2024-01-14',
    category: 'Office Expenses',
    reconciliationStatus: 'MATCHED',
    isDebit: true,
  }}
  // No action handlers needed - component shows as reconciled
/>
```

### Minimal Transaction

```tsx
<TransactionInsight
  transaction={{
    id: 'txn_004',
    amount: 125.00,
    currency: 'USD',
    description: 'Cash Withdrawal',
    bookingDate: '2024-01-18',
    reconciliationStatus: 'UNMATCHED',
    isDebit: true,
  }}
/>
```

## Visual Design

### Color Coding

- **Debit Transactions (Expenses)**: Red border, red icons, negative indicator
- **Credit Transactions (Income)**: Green border, green icons, positive indicator

### Status Badges

- **UNMATCHED**: Yellow badge - Indicates transaction needs attention
- **MATCHED**: Green badge - Successfully reconciled
- **IGNORED**: Gray badge - Marked as not requiring action

### Confidence Levels

- **High (80-100%)**: Green progress bar
- **Medium (60-79%)**: Yellow progress bar
- **Low (0-59%)**: Red progress bar

## Integration with Chat

The component is designed to be embedded within chat messages from the AI assistant:

```tsx
function ChatConversation() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary">AI</div>
      <div className="flex-1 space-y-2">
        <div className="bg-muted p-3 rounded-lg">
          <p>I found this unmatched transaction. Would you like to categorize it?</p>
        </div>

        <TransactionInsight
          transaction={transaction}
          onCategorize={handleCategorize}
          onMatch={handleMatch}
          onIgnore={handleIgnore}
        />
      </div>
    </div>
  );
}
```

## Action Handlers

### Categorize Action
Opens a dialog or sidebar to assign a category to the transaction.

```tsx
const handleCategorize = (transactionId: string) => {
  // Open category selection dialog
  // Update transaction with selected category
};
```

### Match Action
Opens a dialog to match the transaction with an invoice or expense.

```tsx
const handleMatch = (transactionId: string) => {
  // Open matching dialog with suggested matches
  // Create reconciliation record
};
```

### Ignore Action
Marks the transaction as not requiring further action.

```tsx
const handleIgnore = (transactionId: string) => {
  // Update transaction status to IGNORED
  // Optionally prompt for ignore reason
};
```

## Accessibility

- Semantic HTML structure with proper headings
- Color indicators supplemented with icons and text labels
- Keyboard accessible action buttons
- Screen reader friendly status indicators
- Proper ARIA labels where needed

## Responsive Behavior

- **Desktop**: Full layout with all details visible
- **Tablet**: Adapts grid layout for transaction details
- **Mobile**: Stacks elements vertically, maintains readability

## Dependencies

- `@/components/ui/badge` - Status and category badges
- `@/components/ui/button` - Action buttons
- `@/components/ui/card` - Card container and layout
- `@/components/ui/progress` - Confidence score visualization
- `lucide-react` - Icons
- `@/lib/utils` - Utility functions (cn for className merging)

## See Also

- `TransactionInsight.example.tsx` - Complete usage examples
- `ActionResultCard.tsx` - Companion component for action results
- `InvoicePreview.tsx` - Related component for invoice displays

## Task Reference

**Sprint 4, Task S4-03**: Create TransactionInsight Component
- Part of the Document Intelligence Sprint
- Enables AI to display transaction insights in chat messages
- Supports automation of transaction classification and reconciliation
