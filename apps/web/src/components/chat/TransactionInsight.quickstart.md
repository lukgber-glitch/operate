# TransactionInsight - Quick Start Guide

## Installation

The component is already installed and exported from the chat components.

## Import

```tsx
import { TransactionInsight } from '@/components/chat';
```

## Basic Usage

```tsx
<TransactionInsight
  transaction={{
    id: 'txn_001',
    amount: 234.50,
    currency: 'EUR',
    description: 'Amazon Web Services',
    bookingDate: '2024-01-15',
    reconciliationStatus: 'UNMATCHED',
    isDebit: true,
  }}
/>
```

## Full Example with Actions

```tsx
import { TransactionInsight } from '@/components/chat';

function MyComponent() {
  const handleCategorize = (id: string) => {
    console.log('Categorize:', id);
  };

  const handleMatch = (id: string) => {
    console.log('Match:', id);
  };

  const handleIgnore = (id: string) => {
    console.log('Ignore:', id);
  };

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
      onCategorize={handleCategorize}
      onMatch={handleMatch}
      onIgnore={handleIgnore}
    />
  );
}
```

## Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `transaction.id` | `string` | Unique identifier |
| `transaction.amount` | `number` | Transaction amount (positive number) |
| `transaction.currency` | `string` | Currency code ('USD', 'EUR', etc.) |
| `transaction.description` | `string` | Transaction description |
| `transaction.bookingDate` | `string` | ISO date string |
| `transaction.reconciliationStatus` | `'UNMATCHED' \| 'MATCHED' \| 'IGNORED'` | Current status |
| `transaction.isDebit` | `boolean` | `true` for expense, `false` for income |

### Optional Props

| Prop | Type | Description |
|------|------|-------------|
| `transaction.merchantName` | `string` | Merchant/vendor name |
| `transaction.category` | `string` | Category name |
| `transaction.taxCategory` | `string` | Tax classification |
| `transaction.confidence` | `number` | AI confidence (0-1) |
| `onCategorize` | `(id: string) => void` | Categorize button handler |
| `onMatch` | `(id: string) => void` | Match button handler |
| `onIgnore` | `(id: string) => void` | Ignore button handler |

## Common Scenarios

### 1. Expense Transaction (Debit)

```tsx
<TransactionInsight
  transaction={{
    id: 'txn_001',
    amount: 234.50,
    currency: 'EUR',
    description: 'Office Supplies',
    bookingDate: '2024-01-15',
    reconciliationStatus: 'UNMATCHED',
    isDebit: true,  // Expense
  }}
/>
```

**Result**: Red border, down arrow icon, minus sign

### 2. Income Transaction (Credit)

```tsx
<TransactionInsight
  transaction={{
    id: 'txn_002',
    amount: 1500.00,
    currency: 'USD',
    description: 'Client Payment',
    bookingDate: '2024-01-16',
    reconciliationStatus: 'UNMATCHED',
    isDebit: false,  // Income
  }}
/>
```

**Result**: Green border, up arrow icon, plus sign

### 3. With AI Classification

```tsx
<TransactionInsight
  transaction={{
    id: 'txn_003',
    amount: 450.00,
    currency: 'EUR',
    description: 'Cloud Services',
    bookingDate: '2024-01-14',
    category: 'IT Expenses',
    taxCategory: 'Operating Expenses',
    confidence: 0.92,  // 92% confidence
    reconciliationStatus: 'UNMATCHED',
    isDebit: true,
  }}
/>
```

**Result**: Shows category, tax category, and green progress bar (high confidence)

### 4. Matched Transaction

```tsx
<TransactionInsight
  transaction={{
    id: 'txn_004',
    amount: 1000.00,
    currency: 'EUR',
    description: 'Invoice Payment',
    bookingDate: '2024-01-10',
    reconciliationStatus: 'MATCHED',  // Already reconciled
    isDebit: false,
  }}
/>
```

**Result**: Green status badge, no action buttons, shows "matched and reconciled" message

## Styling & Theming

The component automatically adapts to:
- Light/Dark mode
- Your app's color scheme (via Tailwind CSS variables)
- Responsive breakpoints

## Integration with Chat

```tsx
function ChatMessage({ message, transaction }) {
  return (
    <div className="flex gap-3">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
        AI
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-2">
        {/* Text message */}
        <div className="bg-muted p-3 rounded-lg">
          <p>{message}</p>
        </div>

        {/* Transaction card */}
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

## Testing

View examples:
```tsx
import { TransactionInsightDemo } from '@/components/chat/TransactionInsight.example';

// In your page
<TransactionInsightDemo />
```

## Files

- **Component**: `apps/web/src/components/chat/TransactionInsight.tsx`
- **Examples**: `apps/web/src/components/chat/TransactionInsight.example.tsx`
- **Documentation**: `apps/web/src/components/chat/TRANSACTION_INSIGHT_README.md`
- **Visual Guide**: `apps/web/src/components/chat/TRANSACTION_INSIGHT_VISUAL_GUIDE.md`

## Need Help?

See full documentation in `TRANSACTION_INSIGHT_README.md`
