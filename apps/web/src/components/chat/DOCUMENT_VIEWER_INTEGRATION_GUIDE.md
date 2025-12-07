# DocumentViewer Integration Guide

## Quick Start: Adding to Chat Interface

This guide shows how to integrate the DocumentViewer component into the existing chat interface for Sprint 4.

---

## Step 1: Import the Component

```tsx
// In ChatInterface.tsx or ChatMessage.tsx
import { DocumentViewer, type DocumentViewerProps } from '@/components/chat';
```

---

## Step 2: Add State Management

```tsx
function ChatInterface() {
  // Existing state...
  const [messages, setMessages] = useState<Message[]>([]);

  // Add document viewer state
  const [documentViewer, setDocumentViewer] = useState<{
    isOpen: boolean;
    document: DocumentViewerProps['document'] | null;
  }>({
    isOpen: false,
    document: null,
  });

  const openDocument = (document: DocumentViewerProps['document']) => {
    setDocumentViewer({ isOpen: true, document });
  };

  const closeDocument = () => {
    setDocumentViewer({ isOpen: false, document: documentViewer.document });
  };

  // ... rest of component
}
```

---

## Step 3: Integrate with Message Display

### Option A: In ChatMessage Component

```tsx
function ChatMessage({ message }: { message: Message }) {
  const { openDocument } = useChatContext(); // Or pass as prop

  // Check if message has document metadata
  const documentRef = message.metadata?.document;

  return (
    <div className="message">
      <p>{message.content}</p>

      {/* Show document button if available */}
      {documentRef && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDocument({
            id: documentRef.id,
            type: documentRef.type,
            title: documentRef.title,
            url: documentRef.url,
            data: documentRef.data,
          })}
          className="mt-2"
        >
          <FileText className="w-4 h-4 mr-2" />
          View {documentRef.type}
        </Button>
      )}
    </div>
  );
}
```

### Option B: In ActionResultCard

```tsx
function ActionResultCard({ result }: { result: ActionResult }) {
  const { openDocument } = useChatContext();

  // If action result includes a document (e.g., created invoice)
  if (result.type === 'invoice_created' && result.invoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Created Successfully</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Invoice #{result.invoice.number} for ${result.invoice.total}</p>
          <Button
            onClick={() => openDocument({
              id: result.invoice.id,
              type: 'INVOICE',
              title: `Invoice #${result.invoice.number}`,
              data: result.invoice,
            })}
          >
            View Invoice
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <div>...</div>;
}
```

---

## Step 4: Add DocumentViewer to Component Tree

```tsx
function ChatInterface() {
  const [documentViewer, setDocumentViewer] = useState({
    isOpen: false,
    document: null,
  });

  return (
    <div className="chat-interface">
      {/* Chat messages */}
      <div className="messages">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onOpenDocument={(doc) => setDocumentViewer({ isOpen: true, document: doc })}
          />
        ))}
      </div>

      {/* Chat input */}
      <ChatInput onSend={handleSend} />

      {/* Document Viewer - rendered at root level */}
      {documentViewer.document && (
        <DocumentViewer
          isOpen={documentViewer.isOpen}
          onClose={() => setDocumentViewer({ isOpen: false, document: null })}
          document={documentViewer.document}
        />
      )}
    </div>
  );
}
```

---

## Step 5: Handle API Responses

### Example: Invoice Extraction from Email

```tsx
// When assistant processes email and extracts invoice
async function handleEmailInvoiceExtraction(emailId: string) {
  const response = await fetch(`/api/v1/integrations/email-sync/extract/${emailId}`);
  const result = await response.json();

  if (result.invoice) {
    // Add message to chat
    setMessages((prev) => [...prev, {
      id: generateId(),
      role: 'assistant',
      content: `I found an invoice in your email: ${result.invoice.number}`,
      metadata: {
        document: {
          id: result.invoice.id,
          type: 'INVOICE',
          title: `Invoice #${result.invoice.number}`,
          data: result.invoice,
          url: result.invoice.attachmentUrl, // Optional PDF URL
        },
      },
    }]);
  }
}
```

### Example: Bank Transaction Document

```tsx
// When user asks about a transaction with receipt
async function handleTransactionQuery(transactionId: string) {
  const response = await fetch(`/api/v1/banking/transactions/${transactionId}`);
  const transaction = await response.json();

  if (transaction.receiptUrl) {
    setMessages((prev) => [...prev, {
      id: generateId(),
      role: 'assistant',
      content: `Here's the transaction for $${transaction.amount}`,
      metadata: {
        document: {
          id: transaction.id,
          type: 'IMAGE',
          title: `Receipt - ${transaction.description}`,
          url: transaction.receiptUrl,
        },
      },
    }]);
  }
}
```

---

## Step 6: Context Provider (Optional but Recommended)

Create a context to share document viewer across components:

```tsx
// DocumentViewerContext.tsx
import { createContext, useContext, useState } from 'react';
import { DocumentViewer, type DocumentViewerProps } from '@/components/chat';

interface DocumentViewerContextValue {
  openDocument: (document: DocumentViewerProps['document']) => void;
  closeDocument: () => void;
}

const DocumentViewerContext = createContext<DocumentViewerContextValue | null>(null);

export function DocumentViewerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({
    isOpen: false,
    document: null as DocumentViewerProps['document'] | null,
  });

  const openDocument = (document: DocumentViewerProps['document']) => {
    setState({ isOpen: true, document });
  };

  const closeDocument = () => {
    setState({ isOpen: false, document: state.document });
  };

  return (
    <DocumentViewerContext.Provider value={{ openDocument, closeDocument }}>
      {children}
      {state.document && (
        <DocumentViewer
          isOpen={state.isOpen}
          onClose={closeDocument}
          document={state.document}
        />
      )}
    </DocumentViewerContext.Provider>
  );
}

export function useDocumentViewer() {
  const context = useContext(DocumentViewerContext);
  if (!context) {
    throw new Error('useDocumentViewer must be used within DocumentViewerProvider');
  }
  return context;
}
```

Usage with context:

```tsx
// In your app layout
function ChatPage() {
  return (
    <DocumentViewerProvider>
      <ChatInterface />
    </DocumentViewerProvider>
  );
}

// In any child component
function SomeComponent() {
  const { openDocument } = useDocumentViewer();

  return (
    <button onClick={() => openDocument({
      id: 'doc-1',
      type: 'PDF',
      title: 'Document',
      url: '/document.pdf',
    })}>
      View Document
    </button>
  );
}
```

---

## Common Use Cases

### 1. Email Invoice Extraction

```tsx
const invoiceDocument = {
  id: extraction.id,
  type: 'INVOICE' as const,
  title: `Invoice #${extraction.invoiceNumber}`,
  data: {
    number: extraction.invoiceNumber,
    date: extraction.invoiceDate,
    total: extraction.total,
    from: extraction.vendor,
    items: extraction.lineItems,
    // ... other extracted data
  },
  url: extraction.attachmentUrl, // Original PDF if available
};

openDocument(invoiceDocument);
```

### 2. Bank Transaction Receipt

```tsx
const receiptDocument = {
  id: transaction.id,
  type: 'IMAGE' as const,
  title: `Receipt - ${transaction.description}`,
  url: transaction.receiptImageUrl,
};

openDocument(receiptDocument);
```

### 3. Expense Report

```tsx
const expenseDocument = {
  id: expense.id,
  type: 'EXPENSE' as const,
  title: `Expense - ${expense.description}`,
  data: {
    date: expense.date,
    total: expense.amount,
    category: expense.category,
    notes: expense.notes,
  },
  url: expense.receiptUrl,
};

openDocument(expenseDocument);
```

### 4. Bill Payment

```tsx
const billDocument = {
  id: bill.id,
  type: 'BILL' as const,
  title: `${bill.vendor} - ${bill.month}`,
  data: {
    number: bill.billNumber,
    status: bill.isPaid ? 'Paid' : 'Due',
    date: bill.billDate,
    dueDate: bill.dueDate,
    from: { name: bill.vendor },
    items: bill.lineItems,
    total: bill.total,
    amountDue: bill.amountDue,
  },
};

openDocument(billDocument);
```

---

## Message Format Examples

### Extend Message Interface

```tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    // Document reference
    document?: {
      id: string;
      type: 'PDF' | 'IMAGE' | 'INVOICE' | 'BILL' | 'EXPENSE';
      title: string;
      url?: string;
      data?: any;
    };
    // Other metadata
    actionIntent?: ActionIntent;
    // ...
  };
}
```

### Example Messages

```tsx
// Invoice found in email
{
  role: 'assistant',
  content: 'I found invoice #INV-2024-123 from Acme Corp for $1,250.00',
  metadata: {
    document: {
      id: 'inv-123',
      type: 'INVOICE',
      title: 'Invoice #INV-2024-123',
      data: { /* invoice data */ },
    },
  },
}

// Transaction with receipt
{
  role: 'assistant',
  content: 'Here\'s your transaction at Starbucks for $4.75',
  metadata: {
    document: {
      id: 'txn-456',
      type: 'IMAGE',
      title: 'Receipt - Starbucks',
      url: '/receipts/starbucks-12-07.jpg',
    },
  },
}
```

---

## API Integration

### Backend: Return Document Metadata

```typescript
// API response format
interface ChatResponse {
  message: string;
  document?: {
    id: string;
    type: string;
    title: string;
    url?: string;
    data?: any;
  };
}

// Example endpoint
app.post('/api/v1/chatbot/message', async (req, res) => {
  const { message } = req.body;

  // Process message...
  if (messageContainsInvoiceRequest) {
    const invoice = await getInvoice(invoiceId);

    return res.json({
      message: `Here's invoice #${invoice.number}`,
      document: {
        id: invoice.id,
        type: 'INVOICE',
        title: `Invoice #${invoice.number}`,
        data: formatInvoiceData(invoice),
        url: invoice.pdfUrl,
      },
    });
  }
});
```

### Frontend: Handle Response

```tsx
async function sendMessage(content: string) {
  const response = await fetch('/api/v1/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({ message: content }),
  });

  const data = await response.json();

  setMessages((prev) => [...prev, {
    id: generateId(),
    role: 'assistant',
    content: data.message,
    metadata: {
      document: data.document,
    },
  }]);
}
```

---

## Styling Customization

### Override Panel Width

```tsx
<DocumentViewer
  isOpen={isOpen}
  onClose={onClose}
  document={document}
  // Custom width via className (you'd need to modify the component)
/>
```

### Custom Theme

The component uses Tailwind CSS variables from your theme. Customize in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      // These affect the DocumentViewer
      background: '...',
      foreground: '...',
      muted: '...',
      border: '...',
    },
  },
}
```

---

## Testing

### Unit Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentViewer } from '@/components/chat';

describe('DocumentViewer', () => {
  it('opens and displays document title', () => {
    const mockDocument = {
      id: 'test-1',
      type: 'PDF' as const,
      title: 'Test Document',
      url: 'https://example.com/test.pdf',
    };

    render(
      <DocumentViewer
        isOpen={true}
        onClose={() => {}}
        document={mockDocument}
      />
    );

    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();

    render(
      <DocumentViewer
        isOpen={true}
        onClose={onClose}
        document={{ id: '1', type: 'PDF', title: 'Test', url: '/test.pdf' }}
      />
    );

    const backdrop = screen.getByRole('button', { name: /close/i });
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });
});
```

---

## Troubleshooting

### Document not opening

1. Check `isOpen` prop is true
2. Verify `document` object is not null
3. Check console for errors
4. Verify URL is accessible (CORS)

### Animations not smooth

1. Ensure Framer Motion is installed
2. Check browser performance
3. Reduce motion in accessibility settings may affect animations

### PDF not displaying

1. Verify URL returns a valid PDF
2. Check browser PDF viewer settings
3. Test in incognito mode (extensions may block)

---

## Next Steps

1. **Add to ChatInterface**: Integrate DocumentViewer into main chat interface
2. **Update API**: Ensure backend returns document metadata in responses
3. **Test Integration**: Test with real invoices, bills, and receipts
4. **User Feedback**: Gather feedback on UX and performance
5. **Analytics**: Track document viewer usage metrics

---

## Support

For questions or issues:
- See `DOCUMENT_VIEWER_README.md` for API documentation
- Check `DocumentViewer.example.tsx` for usage examples
- Review `DOCUMENT_VIEWER_SUMMARY.md` for implementation details
