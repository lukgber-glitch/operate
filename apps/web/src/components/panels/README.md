# Side Panel System

A comprehensive side panel system for displaying detailed views of entities (invoices, expenses, clients, transactions, etc.) that slide in from the right side of the screen.

## Overview

The side panel system consists of:
- **SidePanel**: Base reusable panel component with slide-in animation
- **Entity Detail Panels**: Specialized panels for different entity types
- **ListDetailPanel**: Full table view for "View All" scenarios
- **useSidePanel**: Hook for managing panel state
- **SidePanelSkeleton**: Loading state variants

## Features

- ✅ Smooth slide-in animation from right
- ✅ Click outside or ESC to close
- ✅ Focus trap for accessibility
- ✅ Responsive (full-screen on mobile)
- ✅ Dark theme styling
- ✅ Scroll area for long content
- ✅ Optional footer for actions
- ✅ Loading skeleton variants
- ✅ Z-index management (above content, below modals)

## Installation

All components are already created in `apps/web/src/components/panels/`.

```typescript
import {
  SidePanel,
  InvoiceDetailPanel,
  ExpenseDetailPanel,
  ClientDetailPanel,
  TransactionDetailPanel,
  ListDetailPanel,
  SidePanelSkeleton,
} from '@/components/panels';
import { useSidePanel } from '@/hooks/useSidePanel';
```

## Basic Usage

### 1. Setup the Hook

In your parent component (e.g., ChatInterface):

```typescript
'use client';

import { useSidePanel } from '@/hooks/useSidePanel';

export function ChatInterface() {
  const { isOpen, panelType, panelData, openPanel, closePanel } = useSidePanel();

  // ... rest of your component
}
```

### 2. Trigger Panel from Child Components

In your result cards or any component:

```typescript
// Pass openPanel down via props or context
<Button onClick={() => openPanel('invoice', invoiceData)}>
  View Details
</Button>
```

### 3. Render Panel Conditionally

At the end of your parent component:

```typescript
{panelType === 'invoice' && panelData && (
  <SidePanel
    isOpen={isOpen}
    onClose={closePanel}
    title="Invoice Details"
    subtitle={`#${panelData.invoiceNumber}`}
    width="lg"
  >
    <InvoiceDetailPanel
      invoice={panelData}
      onSend={() => handleSendInvoice(panelData.id)}
      onDownload={() => handleDownloadInvoice(panelData.id)}
      onEdit={() => handleEditInvoice(panelData.id)}
      onDuplicate={() => handleDuplicateInvoice(panelData.id)}
      onDelete={() => handleDeleteInvoice(panelData.id)}
    />
  </SidePanel>
)}
```

## Panel Types

### InvoiceDetailPanel

Full invoice view with:
- Invoice header (number, status, dates)
- Client information
- Line items with quantities and prices
- Totals breakdown
- Payment history
- Timeline of events
- Actions: Send, Download, Edit, Duplicate, Delete

```typescript
interface InvoiceDetailPanelProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    issueDate: string;
    dueDate: string;
    paidDate?: string;
    client: {
      name: string;
      email: string;
      address?: string;
    };
    lineItems: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      total: number;
    }>;
    subtotal: number;
    taxTotal: number;
    total: number;
    currency: string;
    payments?: Array<{...}>;
    timeline?: Array<{...}>;
  };
  onSend?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}
```

### ExpenseDetailPanel

Full expense view with:
- Expense header
- Receipt image viewer (zoom, rotate)
- Tax deduction status
- Categorization controls
- Linked bank transaction
- Actions: Edit, Delete, Split, Recategorize

### ClientDetailPanel

Full client/vendor view with:
- Contact information
- Financial summary (revenue, outstanding, payment time)
- Recent invoices
- Recent payments
- Communication history
- Actions: Edit, Create Invoice, Send Email

### TransactionDetailPanel

Full bank transaction view with:
- Transaction details
- Account information
- Merchant details
- Match status with invoice/expense
- Categorization with confidence
- Actions: Match, Ignore, Categorize, Split

### ListDetailPanel

Full table view with:
- Sortable columns
- Search and filters
- Bulk actions toolbar
- Pagination
- Export to CSV/PDF
- Click row to open detail panel

```typescript
<ListDetailPanel
  title="All Outstanding Invoices"
  columns={[
    { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
    { key: 'client', label: 'Client', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true },
  ]}
  data={invoices}
  onRowClick={(row) => openPanel('invoice', row)}
  onExport={(format) => handleExport(format)}
  onBulkAction={(action, rows) => handleBulkAction(action, rows)}
  bulkActions={[
    { label: 'Send Reminder', value: 'send_reminder' },
    { label: 'Delete', value: 'delete', variant: 'destructive' },
  ]}
/>
```

## Panel Widths

```typescript
width?: 'sm' | 'md' | 'lg' | 'xl'
// sm: 320px
// md: 400px (default)
// lg: 480px
// xl: 600px
// Mobile: always full-screen
```

## Loading States

Use `SidePanelSkeleton` while fetching data:

```typescript
{isLoading ? (
  <SidePanelSkeleton
    isOpen={isOpen}
    onClose={closePanel}
    width="lg"
    variant="invoice"
  />
) : (
  <SidePanel {...props}>
    <InvoiceDetailPanel {...props} />
  </SidePanel>
)}
```

## Integration with Chat Result Cards

Example integration in a chat result card:

```typescript
// In apps/web/src/components/chat/results/InvoiceResultCard.tsx

interface InvoiceResultCardProps {
  invoice: Invoice;
  onViewDetails: (type: 'invoice', data: any) => void; // from useSidePanel
}

export function InvoiceResultCard({ invoice, onViewDetails }) {
  return (
    <Card>
      {/* ... card content ... */}
      <Button onClick={() => onViewDetails('invoice', invoice)}>
        View Details
      </Button>
    </Card>
  );
}
```

## Accessibility

- **Focus Trap**: Focus stays within panel when open
- **ESC Key**: Closes panel
- **ARIA Labels**: Proper dialog roles and labels
- **Keyboard Navigation**: Full keyboard support

## Z-Index Layers

```
Chat content: z-0
Side panel overlay: z-40
Side panel: z-50
Modals: z-50+
```

## Mobile Behavior

On screens < 768px:
- Panel becomes full-screen
- Overlay covers entire viewport
- Smooth slide-in from right

## Examples

Refer to the usage examples in the sections above for integration patterns.

## Notes

- **Additive Design**: Does not modify existing chat structure
- **Overlay Mode**: Panel overlays content, doesn't push it
- **State Management**: Use `useSidePanel` hook for consistent state
- **Action Handlers**: Pass callbacks for all actions (edit, delete, etc.)

## Future Enhancements

Potential additions:
- Panel history (back button to previous panel)
- Multiple panels stacked
- Panel-to-panel transitions
- Quick actions in header
- Collaborative features (who's viewing)
