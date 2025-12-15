# Chat Result Cards

Enhanced inline result card components for displaying rich action results in chat messages.

## Overview

These components provide specialized, beautifully designed cards for displaying various types of action results inline within chat conversations. They are designed to be:

- **Visually Rich**: Show detailed information at a glance
- **Interactive**: Include quick action buttons
- **Responsive**: Work seamlessly on mobile and desktop
- **Animated**: Smooth entrance and interaction animations
- **Accessible**: Support keyboard navigation and screen readers
- **Themeable**: Automatically adapt to dark/light themes

## Components

### 1. InlineResultCard

A versatile base component for general action results.

```tsx
import { InlineResultCard } from '@/components/chat/results';

<InlineResultCard
  type="success"
  title="Task Completed"
  subtitle="Successfully processed 50 records"
  metrics={[
    { label: 'Processed', value: 50, trend: 'up' },
    { label: 'Failed', value: 0 }
  ]}
  actions={[
    { label: 'View Report', onClick: () => {}, variant: 'primary' }
  ]}
/>
```

**Props:**
- `type`: 'success' | 'warning' | 'error' | 'info'
- `title`: Main heading
- `subtitle?`: Optional description
- `metrics?`: Array of metrics with optional trend indicators
- `actions?`: Array of action buttons
- `expandable?`: Enable expand functionality
- `onExpand?`: Callback for expand action

### 2. InvoiceResultCard

Specialized card for invoice-related results.

```tsx
import { InvoiceResultCard } from '@/components/chat/results';

<InvoiceResultCard
  invoiceNumber="INV-2024-001"
  clientName="Acme Corp"
  amount={2500}
  currency="USD"
  dueDate="2024-03-15"
  status="SENT"
  lineItems={[
    {
      description: 'Consulting Services',
      quantity: 10,
      rate: 250,
      amount: 2500
    }
  ]}
  onViewDetails={() => router.push('/finance/invoices/123')}
  onSend={() => sendInvoice('123')}
  onDownload={() => downloadPDF('123')}
/>
```

**Features:**
- Invoice number and client name display
- Status badge (Draft, Sent, Paid, Overdue, Cancelled)
- Due date with overdue warning
- Expandable line items preview
- Quick actions: View Details, Send, Download PDF

**Props:**
- `invoiceNumber`: Invoice identifier
- `clientName`: Client/customer name
- `amount`: Invoice total
- `currency?`: Currency code (default: 'USD')
- `dueDate`: Due date string
- `status`: Invoice status
- `lineItems?`: Array of line items
- `onViewDetails?`: View details callback
- `onSend?`: Send invoice callback
- `onDownload?`: Download PDF callback

### 3. ExpenseResultCard

Specialized card for expense-related results.

```tsx
import { ExpenseResultCard } from '@/components/chat/results';

<ExpenseResultCard
  vendorName="Office Depot"
  amount={125.50}
  currency="USD"
  category="Office Supplies"
  date="2024-02-20"
  receiptUrl="/uploads/receipt-123.jpg"
  hasReceipt={true}
  onView={() => router.push('/finance/expenses/123')}
  onEdit={() => editExpense('123')}
  onCategorize={() => categorizeExpense('123')}
/>
```

**Features:**
- Vendor name and amount display
- Category badge
- Date information
- Receipt thumbnail preview
- Quick actions: View, Edit, Categorize

**Props:**
- `vendorName`: Merchant/vendor name
- `amount`: Expense amount
- `currency?`: Currency code
- `category?`: Expense category
- `date`: Expense date
- `receiptUrl?`: Receipt image URL
- `hasReceipt?`: Receipt availability flag
- `onView?`: View callback
- `onEdit?`: Edit callback
- `onCategorize?`: Categorize callback

### 4. ClientResultCard

Specialized card for client/vendor results.

```tsx
import { ClientResultCard } from '@/components/chat/results';

<ClientResultCard
  type="client"
  name="Acme Corp"
  email="billing@acme.com"
  phone="+1 555-0100"
  address="123 Main St, New York, NY"
  totalAmount={50000}
  outstandingBalance={5000}
  currency="USD"
  paymentStatus="current"
  documentCount={12}
  onViewProfile={() => router.push('/clients/123')}
  onCreateInvoice={() => createInvoice('123')}
  onEmail={() => sendEmail('billing@acme.com')}
/>
```

**Features:**
- Client/vendor name and type
- Contact information (email, phone, address)
- Financial metrics (total revenue/spend, outstanding balance)
- Payment status indicator
- Document count
- Quick actions: View Profile, Create Invoice, Email

**Props:**
- `type`: 'client' | 'vendor'
- `name`: Entity name
- `email?`: Email address
- `phone?`: Phone number
- `address?`: Physical address
- `totalAmount?`: Total revenue (clients) or spend (vendors)
- `outstandingBalance?`: Outstanding balance
- `currency?`: Currency code
- `paymentStatus?`: Payment status
- `documentCount?`: Number of invoices/bills
- `onViewProfile?`: View profile callback
- `onCreateInvoice?`: Create invoice callback (clients only)
- `onEmail?`: Email callback

### 5. TransactionResultCard

Specialized card for bank transaction results.

```tsx
import { TransactionResultCard } from '@/components/chat/results';

<TransactionResultCard
  description="Office supplies purchase"
  amount={125.50}
  currency="USD"
  date="2024-02-20"
  type="DEBIT"
  accountName="Business Checking"
  category="Office Supplies"
  matchStatus="unmatched"
  onMatch={() => matchTransaction('123')}
  onCategorize={() => categorizeTransaction('123')}
  onIgnore={() => ignoreTransaction('123')}
  onView={() => viewTransaction('123')}
/>
```

**Features:**
- Transaction description and merchant
- Debit/credit indicator with color coding
- Category badge
- Match status (matched, unmatched, ignored)
- Matched entity information (if matched)
- Quick actions: Match, Categorize, Ignore, View

**Props:**
- `description`: Transaction description
- `amount`: Transaction amount
- `currency?`: Currency code
- `date`: Transaction date
- `type`: 'DEBIT' | 'CREDIT'
- `accountName?`: Bank account name
- `category?`: Transaction category
- `matchStatus`: Match status
- `matchedTo?`: Matched entity info
- `onMatch?`: Match callback
- `onCategorize?`: Categorize callback
- `onIgnore?`: Ignore callback
- `onView?`: View callback

### 6. ListResultCard

Card for displaying lists of items.

```tsx
import { ListResultCard } from '@/components/chat/results';

<ListResultCard
  title="Outstanding Invoices"
  subtitle="Invoices awaiting payment"
  count={12}
  total={15000}
  currency="USD"
  items={[
    {
      id: '1',
      title: 'INV-2024-001',
      subtitle: 'Acme Corp',
      amount: 2500,
      currency: 'USD',
      status: 'Overdue',
      statusVariant: 'destructive',
      metadata: 'Due 5 days ago'
    },
    // ... more items
  ]}
  maxVisible={5}
  onViewAll={() => router.push('/finance/invoices?filter=outstanding')}
  onExport={() => exportInvoices()}
  onItemClick={(id) => router.push(`/finance/invoices/${id}`)}
/>
```

**Features:**
- Header with count and total
- Scrollable list with customizable max visible items
- Expandable to show more items
- Individual item click handlers
- View All and Export actions
- Empty state handling

**Props:**
- `title`: List title
- `subtitle?`: List description
- `count`: Total item count
- `total?`: Total amount
- `currency?`: Currency code
- `items`: Array of list items
- `maxVisible?`: Max items to show initially (default: 5)
- `onViewAll?`: View all callback
- `onExport?`: Export callback
- `onItemClick?`: Item click callback

## Loading States

All components include skeleton loading states:

```tsx
import { InvoiceResultCardSkeleton } from '@/components/chat/results';

<InvoiceResultCardSkeleton />
```

Or use the `isLoading` prop:

```tsx
<InvoiceResultCard
  isLoading={isLoadingInvoice}
  {...props}
/>
```

## Styling

All components:
- Use Tailwind CSS for styling
- Support dark/light theme automatically
- Have a max-width of 480px and center in chat
- Are mobile responsive with proper stacking
- Include smooth framer-motion animations
- Follow the existing design system

## Integration Example

```tsx
// In ChatMessage.tsx or action result handler
import {
  InvoiceResultCard,
  ExpenseResultCard,
  TransactionResultCard,
  ClientResultCard,
  ListResultCard,
} from '@/components/chat/results';

function renderActionResult(result: ActionResult) {
  switch (result.entityType) {
    case 'invoice':
      return (
        <InvoiceResultCard
          invoiceNumber={result.data.invoiceNumber}
          clientName={result.data.clientName}
          amount={result.data.amount}
          currency={result.data.currency}
          dueDate={result.data.dueDate}
          status={result.data.status}
          onViewDetails={() => router.push(`/finance/invoices/${result.entityId}`)}
        />
      );

    case 'expense':
      return (
        <ExpenseResultCard
          vendorName={result.data.vendorName}
          amount={result.data.amount}
          date={result.data.date}
          category={result.data.category}
          hasReceipt={result.data.hasReceipt}
          onView={() => router.push(`/finance/expenses/${result.entityId}`)}
        />
      );

    // ... other cases
  }
}
```

## Accessibility

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly content
- Sufficient color contrast
- Touch-friendly tap targets (min 44px)

## Performance

- Components use React.memo for optimization
- Animations are GPU-accelerated
- Lazy loading supported via `isLoading` prop
- Skeleton states prevent layout shift

## Best Practices

1. **Use specific cards** - Prefer specialized cards (InvoiceResultCard, etc.) over generic InlineResultCard
2. **Provide loading states** - Always show skeleton while data loads
3. **Include error handling** - Use error type for failed actions
4. **Add callbacks** - Enable user actions where applicable
5. **Keep items focused** - Don't overload cards with too much info
6. **Test mobile** - Verify all cards work on small screens

## Future Enhancements

Potential additions (not implemented yet):
- Animation customization props
- Print/share functionality
- Bulk selection mode for lists
- Drag-to-reorder for lists
- Advanced filtering for lists
- Custom card templates
