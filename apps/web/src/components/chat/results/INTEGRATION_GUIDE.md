# Result Cards Integration Guide

Quick guide for integrating the enhanced inline result cards into the chat system.

## Quick Start

### 1. Import Components

```tsx
import {
  InvoiceResultCard,
  ExpenseResultCard,
  TransactionResultCard,
  ClientResultCard,
  ListResultCard,
  InlineResultCard,
} from '@/components/chat/results';
```

### 2. Map Action Results

Create a helper function to map action results to the appropriate card:

```tsx
// utils/renderActionResult.tsx
import { ActionResult } from '@/types/chat';
import { useRouter } from 'next/navigation';
import * as ResultCards from '@/components/chat/results';

export function useActionResultRenderer() {
  const router = useRouter();

  const renderActionResult = (result: ActionResult) => {
    if (!result.success) {
      return (
        <ResultCards.InlineResultCard
          type="error"
          title="Action Failed"
          subtitle={result.message}
        />
      );
    }

    // Map entity types to specialized cards
    switch (result.entityType) {
      case 'invoice':
        return (
          <ResultCards.InvoiceResultCard
            invoiceNumber={result.data.invoiceNumber}
            clientName={result.data.clientName}
            amount={result.data.amount}
            currency={result.data.currency || 'USD'}
            dueDate={result.data.dueDate}
            status={result.data.status}
            lineItems={result.data.lineItems}
            onViewDetails={() =>
              router.push(`/finance/invoices/${result.entityId}`)
            }
            onSend={() => sendInvoice(result.entityId)}
            onDownload={() => downloadInvoicePDF(result.entityId)}
          />
        );

      case 'expense':
        return (
          <ResultCards.ExpenseResultCard
            vendorName={result.data.vendorName}
            amount={result.data.amount}
            currency={result.data.currency || 'USD'}
            category={result.data.category}
            date={result.data.date}
            receiptUrl={result.data.receiptUrl}
            hasReceipt={result.data.hasReceipt}
            onView={() =>
              router.push(`/finance/expenses/${result.entityId}`)
            }
            onEdit={() => editExpense(result.entityId)}
            onCategorize={() => categorizeExpense(result.entityId)}
          />
        );

      case 'transaction':
        return (
          <ResultCards.TransactionResultCard
            description={result.data.description}
            amount={result.data.amount}
            currency={result.data.currency || 'USD'}
            date={result.data.date}
            type={result.data.type}
            accountName={result.data.accountName}
            category={result.data.category}
            matchStatus={result.data.matchStatus || 'unmatched'}
            matchedTo={result.data.matchedTo}
            onMatch={() => matchTransaction(result.entityId)}
            onCategorize={() => categorizeTransaction(result.entityId)}
            onIgnore={() => ignoreTransaction(result.entityId)}
            onView={() =>
              router.push(`/finance/banking?transaction=${result.entityId}`)
            }
          />
        );

      case 'client':
      case 'vendor':
        return (
          <ResultCards.ClientResultCard
            type={result.entityType}
            name={result.data.name}
            email={result.data.email}
            phone={result.data.phone}
            address={result.data.address}
            totalAmount={result.data.totalAmount}
            outstandingBalance={result.data.outstandingBalance}
            currency={result.data.currency || 'USD'}
            paymentStatus={result.data.paymentStatus}
            documentCount={result.data.documentCount}
            onViewProfile={() =>
              router.push(`/${result.entityType}s/${result.entityId}`)
            }
            onCreateInvoice={
              result.entityType === 'client'
                ? () => createInvoiceForClient(result.entityId)
                : undefined
            }
            onEmail={
              result.data.email
                ? () => sendEmail(result.data.email)
                : undefined
            }
          />
        );

      case 'list':
        return (
          <ResultCards.ListResultCard
            title={result.data.title}
            subtitle={result.data.subtitle}
            count={result.data.count}
            total={result.data.total}
            currency={result.data.currency || 'USD'}
            items={result.data.items}
            onViewAll={() => router.push(result.data.viewAllUrl)}
            onExport={() => exportData(result.data.exportType)}
            onItemClick={(itemId) =>
              router.push(result.data.itemBaseUrl + itemId)
            }
          />
        );

      default:
        // Fallback to generic card
        return (
          <ResultCards.InlineResultCard
            type="success"
            title={result.message}
            actions={
              result.entityId
                ? [
                    {
                      label: 'View',
                      onClick: () =>
                        router.push(
                          `/${result.entityType}s/${result.entityId}`
                        ),
                      variant: 'primary',
                    },
                  ]
                : undefined
            }
          />
        );
    }
  };

  return renderActionResult;
}
```

### 3. Integrate into ChatMessage

```tsx
// components/chat/ChatMessage.tsx
import { useActionResultRenderer } from '@/utils/renderActionResult';

export function ChatMessage({ message, onRetry, onAction }: ChatMessageProps) {
  const renderActionResult = useActionResultRenderer();

  // ... existing code ...

  return (
    <div className={/* ... */}>
      {/* ... existing message content ... */}

      {/* Add action result card */}
      {message.metadata?.actionResult && (
        <div className="mt-3">
          {renderActionResult(message.metadata.actionResult)}
        </div>
      )}

      {/* ... rest of component ... */}
    </div>
  );
}
```

## Action Handler Integration

When actions are executed, populate the ActionResult with appropriate data:

```tsx
// Example: Creating an invoice
async function createInvoice(params) {
  try {
    const response = await api.post('/invoices', params);

    return {
      success: true,
      message: 'Invoice created successfully',
      entityId: response.data.id,
      entityType: 'invoice',
      data: {
        invoiceNumber: response.data.invoiceNumber,
        clientName: response.data.client.name,
        amount: response.data.amount,
        currency: response.data.currency,
        dueDate: response.data.dueDate,
        status: response.data.status,
        lineItems: response.data.lineItems,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create invoice',
      error: error.message,
    };
  }
}
```

## Loading States

Show loading skeleton while action is executing:

```tsx
const [isExecuting, setIsExecuting] = useState(false);

// In your action handler
const executeAction = async (action) => {
  setIsExecuting(true);
  try {
    const result = await performAction(action);
    // ... handle result
  } finally {
    setIsExecuting(false);
  }
};

// In render
{isExecuting && <InvoiceResultCardSkeleton />}
{!isExecuting && result && renderActionResult(result)}
```

## List Results Example

For actions that return multiple items:

```tsx
// Example: Search invoices
async function searchInvoices(query) {
  const response = await api.get('/invoices/search', { params: { q: query } });

  return {
    success: true,
    message: `Found ${response.data.length} invoices`,
    entityType: 'list',
    data: {
      title: 'Search Results',
      subtitle: `Invoices matching "${query}"`,
      count: response.data.length,
      total: response.data.reduce((sum, inv) => sum + inv.amount, 0),
      currency: 'USD',
      items: response.data.map(invoice => ({
        id: invoice.id,
        title: invoice.invoiceNumber,
        subtitle: invoice.client.name,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        statusVariant: getStatusVariant(invoice.status),
        metadata: `Due ${formatDate(invoice.dueDate)}`,
      })),
      viewAllUrl: `/finance/invoices?q=${encodeURIComponent(query)}`,
      exportType: 'invoices',
      itemBaseUrl: '/finance/invoices/',
    },
  };
}

function getStatusVariant(status) {
  switch (status) {
    case 'PAID': return 'default';
    case 'SENT': return 'secondary';
    case 'OVERDUE': return 'destructive';
    default: return 'outline';
  }
}
```

## Custom Actions Example

Add custom action handlers:

```tsx
// Example: Send invoice
const sendInvoice = async (invoiceId: string) => {
  try {
    await api.post(`/invoices/${invoiceId}/send`);
    toast({
      title: 'Invoice Sent',
      description: 'The invoice has been sent to the client.',
    });
  } catch (error) {
    toast({
      title: 'Send Failed',
      description: error.message,
      variant: 'destructive',
    });
  }
};

// Example: Download PDF
const downloadInvoicePDF = async (invoiceId: string) => {
  const response = await api.get(`/invoices/${invoiceId}/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `invoice-${invoiceId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

## Error Handling

Handle errors gracefully with the error type:

```tsx
try {
  const result = await executeAction(action);
  return result;
} catch (error) {
  return {
    success: false,
    message: 'Something went wrong',
    error: error.message,
  };
}

// Renders as:
<InlineResultCard
  type="error"
  title="Action Failed"
  subtitle="Something went wrong"
/>
```

## TypeScript Types

Extend ActionResult type if needed:

```tsx
// types/chat.ts
export interface ActionResult {
  success: boolean;
  message: string;
  entityId?: string;
  entityType?: 'invoice' | 'expense' | 'transaction' | 'client' | 'vendor' | 'list';
  data?: InvoiceData | ExpenseData | TransactionData | ClientData | ListData;
  error?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  lineItems?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

// ... other data interfaces
```

## Testing

Test your integration:

```tsx
// Test rendering different result types
const testResults: ActionResult[] = [
  {
    success: true,
    message: 'Invoice created',
    entityType: 'invoice',
    entityId: '123',
    data: { /* invoice data */ },
  },
  {
    success: false,
    message: 'Failed to create expense',
    error: 'Network error',
  },
];

testResults.forEach(result => {
  render(renderActionResult(result));
  // ... assertions
});
```

## Checklist

- [ ] Import result card components
- [ ] Create action result renderer function
- [ ] Integrate into ChatMessage component
- [ ] Update action handlers to return proper data structure
- [ ] Add loading states
- [ ] Implement custom action callbacks
- [ ] Add error handling
- [ ] Test all result card types
- [ ] Test mobile responsiveness
- [ ] Test dark/light themes
- [ ] Add analytics tracking (optional)

## Tips

1. **Consistent Data Structure**: Ensure all action handlers return consistently structured ActionResult objects
2. **Loading States**: Always show loading skeleton during action execution
3. **Error Handling**: Handle errors gracefully with helpful messages
4. **Mobile Testing**: Test all cards on mobile devices
5. **Analytics**: Consider tracking which actions users take from result cards
6. **Customization**: Extend cards with additional props as needed
7. **Performance**: Use React.memo if cards re-render unnecessarily

## Support

For detailed component documentation, see:
- [README.md](./README.md) - Comprehensive component documentation
- [InlineResultCard.tsx](./InlineResultCard.tsx) - Base component source
- [INLINE_RESULT_CARDS_IMPLEMENTATION.md](../../../INLINE_RESULT_CARDS_IMPLEMENTATION.md) - Full implementation details
