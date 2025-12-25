# Chat Action Components

Components for chat-triggered actions in the Operate application.

## Components

### InvoiceModal

A modal dialog for creating invoices from chat interactions.

**Features:**
- Client selection dropdown
- Multiple line items with add/remove functionality
- Automatic calculation of subtotals, tax, and totals
- Prefill support from chat AI suggestions
- Date selection (issue date and due date)
- Notes/payment instructions field
- Currency formatting based on selected client
- Loading states during submission
- Form validation

**Props:**

```typescript
interface InvoiceModalProps {
  open: boolean;                    // Controls modal visibility
  onClose: () => void;               // Called when modal is closed
  onSubmit: (data: CreateInvoiceRequest) => void | Promise<void>;  // Handle invoice creation
  prefillData?: {                    // Optional prefill data from AI
    clientId?: string;
    items?: Array<{
      description: string;
      quantity?: number;
      unitPrice?: number;
      taxRate?: number;
    }>;
  };
  clients?: Client[];                // List of clients for dropdown
  isLoading?: boolean;               // Loading state during submission
}
```

**Usage:**

```tsx
import { InvoiceModal } from '@/components/chat/actions';
import { financeApi } from '@/lib/api/finance';
import { useClients } from '@/hooks/use-clients';

function ChatInterface() {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { clients } = useClients();

  const handleCreateInvoice = async (data: CreateInvoiceRequest) => {
    setIsCreating(true);
    try {
      await financeApi.createInvoice(data);
      setShowInvoiceModal(false);
      // Show success message
    } catch (error) {
      // Handle error
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowInvoiceModal(true)}>
        Create Invoice
      </Button>

      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSubmit={handleCreateInvoice}
        clients={clients}
        isLoading={isCreating}
        prefillData={{
          clientId: 'client-123',
          items: [
            { description: 'Consulting Services', quantity: 5, unitPrice: 100, taxRate: 20 }
          ]
        }}
      />
    </>
  );
}
```

**Line Items:**

Each line item includes:
- Description (required)
- Quantity (default: 1)
- Unit Price (default: 0)
- Tax Rate (default: 0, percentage)

Users can add/remove items dynamically. At least one item is always present.

**Calculations:**

- Line Total = Quantity × Unit Price
- Subtotal = Sum of all line totals
- Tax Amount = Sum of (Line Total × Tax Rate %)
- Total = Subtotal + Tax Amount

**Validation:**

- Client selection is required
- At least one line item with a description is required
- All numeric fields accept decimal values
- Dates must be valid

## File Structure

```
actions/
├── InvoiceModal.tsx    # Invoice creation modal
├── index.ts            # Exports
└── README.md           # Documentation
```

## Future Components

Additional action modals to be added:
- ExpenseModal
- ClientModal
- TaskModal
- ReminderModal
