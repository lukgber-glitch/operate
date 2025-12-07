# InvoicePreview Component

## Overview

The `InvoicePreview` component displays invoice details inline in chat messages, providing a rich preview with status indicators, due date warnings, and quick actions.

## File Location

```
apps/web/src/components/chat/InvoicePreview.tsx
```

## Components

### 1. InvoicePreview (Full Card)

Main component for displaying complete invoice information with all actions.

**Features:**
- Invoice number and customer name
- Amount with currency formatting
- Status badge with color coding (DRAFT, SENT, PAID, OVERDUE, CANCELLED)
- Issue and due date display
- Overdue indicator with alert icon
- Days until/overdue calculation
- Line items summary
- Quick action buttons (View, Send, Download PDF)

**Visual Design:**
- Card layout with colored left border based on status
- Status-based icon colors
- Responsive grid layout
- Hover effects and transitions
- Dark mode support

### 2. InvoicePreviewCompact

Compact version for inline display in message lists.

**Features:**
- Condensed layout
- Status badge
- Amount and item count
- Overdue alert for past-due invoices
- Click handler for navigation

## Props Interface

```typescript
interface InvoicePreviewProps {
  invoice: {
    id: string;
    number: string;              // e.g., "INV-2024-001"
    customerName: string;        // Customer/client name
    amount: number;              // Invoice amount
    currency: string;            // ISO currency code (USD, EUR, GBP)
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    dueDate: string;             // ISO date string
    issueDate: string;           // ISO date string
    lineItemCount: number;       // Number of line items
  };
  onView?: (id: string) => void;     // View invoice details
  onSend?: (id: string) => void;     // Send invoice (DRAFT only)
  onDownload?: (id: string) => void; // Download PDF
}
```

## Status Color Coding

| Status    | Border Color | Icon Color | Background |
|-----------|--------------|------------|------------|
| DRAFT     | Gray         | Gray       | Gray-100   |
| SENT      | Blue         | Blue       | Blue-100   |
| PAID      | Green        | Green      | Green-100  |
| OVERDUE   | Red          | Red        | Red-100    |
| CANCELLED | Gray         | Gray       | Gray-50    |

## Usage Examples

### Basic Usage

```tsx
import { InvoicePreview } from '@/components/chat';

function ChatMessage() {
  const invoice = {
    id: 'inv_001',
    number: 'INV-2024-001',
    customerName: 'Acme Corporation',
    amount: 5250.00,
    currency: 'USD',
    status: 'SENT',
    dueDate: '2025-12-20',
    issueDate: '2025-12-01',
    lineItemCount: 5,
  };

  return (
    <InvoicePreview
      invoice={invoice}
      onView={(id) => router.push(`/invoices/${id}`)}
      onSend={(id) => handleSendInvoice(id)}
      onDownload={(id) => downloadInvoicePDF(id)}
    />
  );
}
```

### Compact Version

```tsx
import { InvoicePreviewCompact } from '@/components/chat';

function InvoiceList() {
  return (
    <div className="space-y-2">
      {invoices.map((invoice) => (
        <InvoicePreviewCompact
          key={invoice.id}
          invoice={invoice}
          onClick={() => router.push(`/invoices/${invoice.id}`)}
        />
      ))}
    </div>
  );
}
```

### In Chat Message

```tsx
function AIMessage({ content, invoice }) {
  return (
    <div className="bg-muted p-4 rounded-lg space-y-3">
      <p className="text-sm">{content}</p>
      {invoice && (
        <InvoicePreview
          invoice={invoice}
          onView={handleView}
          onSend={handleSend}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
```

## Feature Details

### Date Formatting

The component includes intelligent date formatting:
- **Future dates**: "Due in X days"
- **Today**: "Due today"
- **Tomorrow**: "Due tomorrow"
- **Past dates**: "X days overdue"

### Currency Formatting

Uses `Intl.NumberFormat` for proper currency display:
```typescript
$5,250.00 USD
€12,750.00 EUR
£8,500.00 GBP
```

### Conditional Actions

- **Send button**: Only shown for DRAFT invoices
- **Overdue indicator**: Automatically displayed for past-due, unpaid invoices
- **Paid checkmark**: Green checkmark shown for PAID invoices
- **Alert icon**: Red alert shown for OVERDUE invoices

### Responsive Design

- **Mobile**: Stacked layout with full-width buttons
- **Tablet/Desktop**: Grid layout with inline buttons
- **Text truncation**: Long customer names truncate with ellipsis

## Visual States

### 1. Draft Invoice
- Gray border and icon
- Shows "Send" button
- No due date warning

### 2. Sent Invoice
- Blue border and icon
- Shows days until due
- All action buttons visible

### 3. Overdue Invoice
- Red border and icon
- Red alert indicator
- Bold "X days overdue" message
- No send button

### 4. Paid Invoice
- Green border and icon
- Green checkmark on due date
- No due date warning

### 5. Cancelled Invoice
- Gray border (lighter)
- Muted styling
- No action buttons except View

## Accessibility

- Semantic HTML with proper heading hierarchy
- ARIA labels for icon buttons
- Keyboard navigation support
- Screen reader friendly date and amount formatting
- High contrast colors for status indicators

## Dark Mode Support

All colors and backgrounds adapt to dark mode:
- Status colors maintain contrast
- Border colors remain visible
- Background colors adjust automatically
- Icon colors remain distinguishable

## Integration Points

### With Chat System
```tsx
// In ChatMessage component
{message.type === 'invoice' && (
  <InvoicePreview
    invoice={message.data.invoice}
    onView={(id) => router.push(`/invoices/${id}`)}
  />
)}
```

### With Action System
```tsx
// After invoice creation
const result = await createInvoice(data);
if (result.success) {
  return {
    message: 'Invoice created successfully',
    component: (
      <InvoicePreview
        invoice={result.invoice}
        onView={handleView}
        onSend={handleSend}
        onDownload={handleDownload}
      />
    )
  };
}
```

## Testing

See `InvoicePreview.example.tsx` for comprehensive examples:
- Full preview with all statuses
- Compact preview
- Chat integration
- Multiple invoices
- Edge cases (cancelled, overdue)

## Dependencies

- `lucide-react` - Icons
- `@/components/ui/badge` - Status badges
- `@/components/ui/button` - Action buttons
- `@/components/ui/card` - Card layout
- `@/lib/utils` - cn() utility

## Future Enhancements

Potential additions:
- [ ] PDF preview on hover
- [ ] Payment status timeline
- [ ] Quick edit mode
- [ ] Batch actions for multiple invoices
- [ ] Export options (CSV, Excel)
- [ ] Email preview before send
- [ ] Attachment indicators
- [ ] Custom status labels
- [ ] Multi-currency support improvements
