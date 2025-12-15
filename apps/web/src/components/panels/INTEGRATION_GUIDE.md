# Side Panel Integration Guide

Step-by-step guide for integrating side panels with chat result cards.

## Quick Start (5 Steps)

### Step 1: Import Hook in Parent Component

In `apps/web/src/app/(dashboard)/chat/page.tsx` or `ChatInterface.tsx`:

```typescript
import { useSidePanel } from '@/hooks/useSidePanel';

export default function ChatPage() {
  const { isOpen, panelType, panelData, openPanel, closePanel } = useSidePanel();

  // ... rest of component
}
```

### Step 2: Pass `openPanel` to Result Cards

```typescript
<ChatCentralPanel
  messages={messages}
  onViewDetails={openPanel} // Pass the openPanel function
  // ... other props
/>
```

### Step 3: Update Result Cards to Use `onViewDetails`

In `apps/web/src/components/chat/results/InvoiceResultCard.tsx`:

```typescript
interface InvoiceResultCardProps {
  invoice: any;
  onViewDetails?: (type: 'invoice', data: any) => void;
}

export function InvoiceResultCard({ invoice, onViewDetails }) {
  return (
    <Card>
      {/* ... existing card content ... */}

      <Button
        onClick={() => onViewDetails?.('invoice', invoice)}
        variant="outline"
        size="sm"
      >
        View Details
      </Button>
    </Card>
  );
}
```

### Step 4: Render Panels in Parent Component

At the end of your parent component, add panel renderers:

```typescript
export default function ChatPage() {
  const { isOpen, panelType, panelData, openPanel, closePanel } = useSidePanel();

  return (
    <>
      {/* Your existing chat UI */}
      <ChatInterface onViewDetails={openPanel} />

      {/* Panel Renderers */}
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
            onEdit={() => {
              closePanel();
              router.push(`/finance/invoices/${panelData.id}`);
            }}
          />
        </SidePanel>
      )}

      {/* Add similar blocks for expense, client, transaction, list */}
    </>
  );
}
```

### Step 5: Add Imports

```typescript
import {
  SidePanel,
  InvoiceDetailPanel,
  ExpenseDetailPanel,
  ClientDetailPanel,
  TransactionDetailPanel,
  ListDetailPanel,
} from '@/components/panels';
```

## Complete Example

```typescript
'use client';

import { useState } from 'react';
import { useSidePanel } from '@/hooks/useSidePanel';
import {
  SidePanel,
  InvoiceDetailPanel,
  ExpenseDetailPanel,
  ClientDetailPanel,
  TransactionDetailPanel,
  ListDetailPanel,
} from '@/components/panels';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const { isOpen, panelType, panelData, openPanel, closePanel } = useSidePanel();

  return (
    <div className="h-full">
      {/* Main Chat Interface */}
      <ChatInterface
        messages={messages}
        onViewDetails={openPanel}
      />

      {/* Invoice Panel */}
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
            onSend={() => console.log('Send')}
            onDownload={() => console.log('Download')}
            onEdit={() => console.log('Edit')}
          />
        </SidePanel>
      )}

      {/* Expense Panel */}
      {panelType === 'expense' && panelData && (
        <SidePanel
          isOpen={isOpen}
          onClose={closePanel}
          title="Expense Details"
          subtitle={panelData.vendor}
          width="lg"
        >
          <ExpenseDetailPanel
            expense={panelData}
            onEdit={() => console.log('Edit')}
            onDelete={() => console.log('Delete')}
          />
        </SidePanel>
      )}

      {/* Client Panel */}
      {panelType === 'client' && panelData && (
        <SidePanel
          isOpen={isOpen}
          onClose={closePanel}
          title="Client Details"
          subtitle={panelData.email}
          width="lg"
        >
          <ClientDetailPanel
            client={panelData}
            onEdit={() => console.log('Edit')}
            onCreateInvoice={() => console.log('Create Invoice')}
          />
        </SidePanel>
      )}

      {/* Transaction Panel */}
      {panelType === 'transaction' && panelData && (
        <SidePanel
          isOpen={isOpen}
          onClose={closePanel}
          title="Transaction Details"
          subtitle={panelData.description}
          width="lg"
        >
          <TransactionDetailPanel
            transaction={panelData}
            onMatch={() => console.log('Match')}
            onCategorize={() => console.log('Categorize')}
          />
        </SidePanel>
      )}

      {/* List Panel */}
      {panelType === 'list' && panelData && (
        <SidePanel
          isOpen={isOpen}
          onClose={closePanel}
          title={panelData.title}
          width="xl"
        >
          <ListDetailPanel
            {...panelData}
            onRowClick={(row) => {
              // Close list panel and open detail panel
              closePanel();
              setTimeout(() => openPanel(panelData.rowType, row), 300);
            }}
          />
        </SidePanel>
      )}
    </div>
  );
}
```

## Prop Drilling vs Context

### Option A: Prop Drilling (Simple)
```typescript
<ChatInterface onViewDetails={openPanel} />
  ↓
<ChatCentralPanel onViewDetails={openPanel} />
  ↓
<ActionResultCard onViewDetails={openPanel} />
  ↓
<InvoiceResultCard onViewDetails={openPanel} />
```

### Option B: Context (Scalable)

Create a context:

```typescript
// contexts/SidePanelContext.tsx
import { createContext, useContext } from 'react';
import { useSidePanel } from '@/hooks/useSidePanel';

const SidePanelContext = createContext(null);

export function SidePanelProvider({ children }) {
  const sidePanelState = useSidePanel();
  return (
    <SidePanelContext.Provider value={sidePanelState}>
      {children}
    </SidePanelContext.Provider>
  );
}

export function useSidePanelContext() {
  return useContext(SidePanelContext);
}
```

Use in components:

```typescript
// In parent
<SidePanelProvider>
  <ChatInterface />
  {/* Panel renderers */}
</SidePanelProvider>

// In any child
import { useSidePanelContext } from '@/contexts/SidePanelContext';

function InvoiceResultCard({ invoice }) {
  const { openPanel } = useSidePanelContext();

  return (
    <Button onClick={() => openPanel('invoice', invoice)}>
      View Details
    </Button>
  );
}
```

## Data Mapping Examples

### Invoice from API

```typescript
// Map API response to panel format
const mappedInvoice = {
  id: apiInvoice.id,
  invoiceNumber: apiInvoice.invoice_number,
  status: apiInvoice.status,
  issueDate: apiInvoice.issue_date,
  dueDate: apiInvoice.due_date,
  client: {
    name: apiInvoice.client.name,
    email: apiInvoice.client.email,
    address: apiInvoice.client.address,
  },
  lineItems: apiInvoice.line_items.map(item => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    taxRate: item.tax_rate,
    total: item.total,
  })),
  subtotal: apiInvoice.subtotal,
  taxTotal: apiInvoice.tax_total,
  total: apiInvoice.total,
  currency: apiInvoice.currency,
};

openPanel('invoice', mappedInvoice);
```

## Action Handlers

### Navigate to Edit Page
```typescript
onEdit={() => {
  closePanel();
  router.push(`/finance/invoices/${panelData.id}`);
}}
```

### Show Confirmation Dialog
```typescript
onDelete={() => {
  if (confirm('Delete this invoice?')) {
    handleDeleteInvoice(panelData.id);
    closePanel();
  }
}}
```

### Open Another Panel
```typescript
onCreateInvoice={() => {
  closePanel();
  setTimeout(() => {
    router.push('/finance/invoices/new?clientId=' + panelData.id);
  }, 300);
}}
```

## Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleOpenPanel = async (type, data) => {
  setLoading(true);
  try {
    const fullData = await fetchFullDetails(type, data.id);
    openPanel(type, fullData);
  } finally {
    setLoading(false);
  }
};

// Render loading skeleton
{loading && (
  <SidePanelSkeleton
    isOpen={true}
    onClose={closePanel}
    variant={panelType}
  />
)}
```

## Troubleshooting

### Panel doesn't slide in smoothly
- Check that framer-motion is installed
- Ensure no CSS transitions conflict
- Verify z-index is correct

### Click outside doesn't close
- Check overlay is rendered
- Ensure onClick handler is on overlay div
- Verify event isn't stopped by child

### Mobile full-screen not working
- Check Tailwind breakpoints (md:w-96)
- Verify responsive classes are correct
- Test on actual mobile device

### Actions not working
- Ensure handlers are passed as props
- Check closePanel is called after action
- Verify navigation/mutations work

## Performance Tips

1. **Lazy load panels**: Only import when needed
2. **Memoize panel data**: Use useMemo for complex data
3. **Debounce search**: In ListDetailPanel
4. **Virtual scroll**: For very long lists
5. **Close on navigate**: Clean up on route change

## Next Steps

1. ✅ Install system (completed)
2. ✅ Create panel components (completed)
3. ⬜ Update result cards with "View Details" buttons
4. ⬜ Add panel renderers to chat page
5. ⬜ Test on mobile
6. ⬜ Add analytics tracking
7. ⬜ Implement action handlers
