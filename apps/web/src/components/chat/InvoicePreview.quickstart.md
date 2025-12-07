# InvoicePreview Component - Quick Start

## Installation

The component is already installed and exported from the chat components:

```tsx
import { InvoicePreview, InvoicePreviewCompact } from '@/components/chat';
```

## 5-Minute Integration

### Step 1: Import the Component

```tsx
import { InvoicePreview } from '@/components/chat';
```

### Step 2: Prepare Invoice Data

```tsx
const invoice = {
  id: 'inv_123',
  number: 'INV-2024-001',
  customerName: 'Acme Corp',
  amount: 5250.00,
  currency: 'USD',
  status: 'SENT', // DRAFT | SENT | PAID | OVERDUE | CANCELLED
  dueDate: '2025-12-20',
  issueDate: '2025-12-01',
  lineItemCount: 5,
};
```

### Step 3: Add to Your Component

```tsx
<InvoicePreview
  invoice={invoice}
  onView={(id) => router.push(`/invoices/${id}`)}
  onSend={(id) => sendInvoice(id)}
  onDownload={(id) => downloadPDF(id)}
/>
```

## Common Patterns

### 1. In Chat Messages

```tsx
function ChatMessage({ message }) {
  if (message.invoice) {
    return (
      <div className="space-y-3">
        <p>{message.text}</p>
        <InvoicePreview
          invoice={message.invoice}
          onView={handleView}
          onDownload={handleDownload}
        />
      </div>
    );
  }
  return <p>{message.text}</p>;
}
```

### 2. Invoice List (Compact)

```tsx
function InvoiceList({ invoices }) {
  return (
    <div className="space-y-2">
      {invoices.map(inv => (
        <InvoicePreviewCompact
          key={inv.id}
          invoice={inv}
          onClick={() => router.push(`/invoices/${inv.id}`)}
        />
      ))}
    </div>
  );
}
```

### 3. After Invoice Creation

```tsx
async function createInvoice(data) {
  const result = await api.post('/invoices', data);

  // Show success with preview
  return (
    <div>
      <p>Invoice created successfully!</p>
      <InvoicePreview
        invoice={result.invoice}
        onView={handleView}
        onSend={handleSend}
      />
    </div>
  );
}
```

## Props Reference

### Required Props

```tsx
invoice: {
  id: string;           // Unique invoice ID
  number: string;       // Display number (e.g., "INV-2024-001")
  customerName: string; // Client/customer name
  amount: number;       // Invoice total
  currency: string;     // ISO code (USD, EUR, GBP, etc.)
  status: InvoiceStatus;// DRAFT | SENT | PAID | OVERDUE | CANCELLED
  dueDate: string;      // ISO date string
  issueDate: string;    // ISO date string
  lineItemCount: number;// Number of line items
}
```

### Optional Props

```tsx
onView?: (id: string) => void;     // View invoice details
onSend?: (id: string) => void;     // Send invoice (DRAFT only)
onDownload?: (id: string) => void; // Download PDF
```

## Status Guide

| Status    | When to Use | Action Buttons |
|-----------|-------------|----------------|
| DRAFT     | Invoice created but not sent | View, Send, Download |
| SENT      | Invoice sent to customer | View, Download |
| PAID      | Payment received | View, Download |
| OVERDUE   | Past due date, unpaid | View, Download |
| CANCELLED | Invoice cancelled | View |

## Visual Indicators

- **Green**: Paid invoices
- **Blue**: Sent invoices
- **Red**: Overdue invoices
- **Gray**: Draft/Cancelled invoices

## Smart Features

### Automatic Overdue Detection
The component automatically calculates if an invoice is overdue based on the current date and due date.

### Days Calculation
Shows:
- "Due today"
- "Due tomorrow"
- "Due in 5 days"
- "3 days overdue"

### Currency Formatting
Automatically formats amounts based on currency:
- USD: $5,250.00
- EUR: €5.250,00
- GBP: £5,250.00

### Conditional Actions
- Send button only appears for DRAFT invoices
- Overdue alert only for unpaid, past-due invoices
- Paid checkmark only for PAID invoices

## Examples

See `InvoicePreview.example.tsx` for 8 complete examples:
1. Full invoice preview
2. Overdue invoice
3. Paid invoice
4. Draft invoice with send
5. Compact version
6. Multiple invoices
7. Chat integration
8. Cancelled invoice

## Troubleshooting

### Invoice not displaying correctly?

Check that all required fields are present:
```tsx
console.log(invoice); // Verify all fields exist
```

### Actions not triggering?

Verify handlers are defined:
```tsx
onView={(id) => {
  console.log('View clicked:', id);
  router.push(`/invoices/${id}`);
}}
```

### Styling issues?

Ensure parent container has proper width:
```tsx
<div className="max-w-md"> {/* Or max-w-2xl for wider */}
  <InvoicePreview invoice={invoice} />
</div>
```

## Next Steps

1. Check `INVOICE_PREVIEW_README.md` for full documentation
2. Review `InvoicePreview.example.tsx` for examples
3. Test with different invoice statuses
4. Integrate with your invoice API
5. Add to chat message types

## Support

For issues or questions:
- Check the README.md file
- Review example implementations
- Test with the example data provided
