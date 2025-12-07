# DocumentViewer Component

## Overview

The `DocumentViewer` is a slide-out panel component that allows users to preview documents without leaving the chat interface. It supports multiple document types including PDFs, images, and formatted invoice/bill views.

## Features

- **Split-View Design**: Slides out from the right side of the screen
- **Multiple Document Types**:
  - PDF documents with iframe preview
  - Images with zoom capability
  - Formatted invoice/bill views with structured layout
- **Rich Functionality**:
  - Zoom controls (50% - 200%)
  - Download document
  - Print document
  - Share via Web Share API
  - Open in new tab
- **Smooth Animations**:
  - Panel slides in from right using Framer Motion
  - Backdrop dims the main content
  - Content fades in after panel animation
- **Responsive Design**:
  - Full-screen on mobile devices
  - Side panel (600-800px) on desktop
- **Accessibility**:
  - Keyboard support (ESC to close)
  - ARIA labels and semantic HTML
  - Prevents body scroll when open

## Installation

The component is already integrated into the chat components. Import it from the chat components barrel:

```tsx
import { DocumentViewer } from '@/components/chat';
```

## Usage

### Basic Example

```tsx
import { DocumentViewer } from '@/components/chat';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [document, setDocument] = useState(null);

  const handleOpenDocument = () => {
    setDocument({
      id: 'doc-1',
      type: 'PDF',
      title: 'Annual Report 2024',
      url: 'https://example.com/report.pdf',
    });
    setIsOpen(true);
  };

  return (
    <>
      <button onClick={handleOpenDocument}>View Document</button>

      {document && (
        <DocumentViewer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          document={document}
        />
      )}
    </>
  );
}
```

### PDF Document

```tsx
const pdfDocument = {
  id: 'pdf-1',
  type: 'PDF',
  title: 'Company Presentation',
  url: 'https://example.com/presentation.pdf',
};

<DocumentViewer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  document={pdfDocument}
/>
```

### Image Document

```tsx
const imageDocument = {
  id: 'img-1',
  type: 'IMAGE',
  title: 'Receipt Scan',
  url: 'https://example.com/receipt.jpg',
};

<DocumentViewer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  document={imageDocument}
/>
```

### Formatted Invoice

```tsx
const invoiceDocument = {
  id: 'inv-1',
  type: 'INVOICE',
  title: 'Invoice #INV-2024-001',
  data: {
    number: 'INV-2024-001',
    status: 'Paid',
    date: '2024-12-01',
    dueDate: '2024-12-15',
    from: {
      name: 'Your Company',
      address: '123 Main St',
      email: 'billing@company.com',
      phone: '+1 555-1234',
    },
    to: {
      name: 'Client Name',
      address: '456 Client Ave',
      email: 'client@example.com',
    },
    items: [
      {
        description: 'Web Development',
        quantity: 1,
        price: 5000,
        total: 5000,
      },
      {
        description: 'Monthly Support',
        quantity: 12,
        price: 200,
        total: 2400,
      },
    ],
    subtotal: 7400,
    tax: 666,
    total: 8066,
    amountPaid: 8066,
    amountDue: 0,
    notes: 'Thank you for your business!',
  },
};

<DocumentViewer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  document={invoiceDocument}
/>
```

### Formatted Bill

```tsx
const billDocument = {
  id: 'bill-1',
  type: 'BILL',
  title: 'AWS Services - November 2024',
  data: {
    number: 'AWS-NOV-2024',
    status: 'Due',
    date: '2024-11-30',
    dueDate: '2024-12-15',
    from: {
      name: 'Amazon Web Services',
    },
    items: [
      {
        description: 'EC2 Instances',
        quantity: 3,
        price: 42.34,
        total: 127.02,
      },
      // ... more items
    ],
    subtotal: 205.84,
    total: 205.84,
    amountDue: 205.84,
  },
};

<DocumentViewer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  document={billDocument}
/>
```

## Props API

### DocumentViewerProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls whether the viewer is visible |
| `onClose` | `() => void` | Yes | Callback when viewer is closed |
| `document` | `Document` | Yes | Document object to display |

### Document Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the document |
| `type` | `'PDF' \| 'IMAGE' \| 'INVOICE' \| 'BILL' \| 'EXPENSE'` | Yes | Type of document |
| `title` | `string` | Yes | Display title for the document |
| `url` | `string` | Conditional | URL to the document file (required for PDF/IMAGE) |
| `data` | `any` | Conditional | Structured data (required for INVOICE/BILL/EXPENSE) |

### Invoice/Bill Data Structure

```typescript
interface InvoiceData {
  number?: string;           // Invoice/bill number
  status?: string;           // Status (e.g., "Paid", "Due", "Draft")
  date?: string;             // Issue date
  dueDate?: string;          // Due date
  paymentTerms?: string;     // Payment terms (e.g., "Net 15")

  // Party information
  from?: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  to?: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
  };

  // Line items
  items?: Array<{
    description: string;
    notes?: string;
    quantity?: number;
    price?: number;
    total?: number;
  }>;

  // Totals
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  amountPaid?: number;
  amountDue?: number;

  // Additional
  notes?: string;
}
```

## Integration with Chat

### In Chat Messages

```tsx
import { DocumentViewer } from '@/components/chat';

function ChatMessage({ message }) {
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    document: null,
  });

  // Detect if message contains document reference
  const hasDocument = message.metadata?.documentId;

  return (
    <div>
      <p>{message.content}</p>

      {hasDocument && (
        <button onClick={() => setViewerState({
          isOpen: true,
          document: {
            id: message.metadata.documentId,
            type: message.metadata.documentType,
            title: message.metadata.documentTitle,
            url: message.metadata.documentUrl,
            data: message.metadata.documentData,
          }
        })}>
          View Document
        </button>
      )}

      {viewerState.document && (
        <DocumentViewer
          isOpen={viewerState.isOpen}
          onClose={() => setViewerState({ isOpen: false, document: null })}
          document={viewerState.document}
        />
      )}
    </div>
  );
}
```

### Action Buttons in Assistant Response

```tsx
// In your chat assistant response handler
function AssistantMessage({ content }) {
  return (
    <div>
      <p>I found your invoice. Would you like to review it?</p>
      <Button onClick={() => openDocumentViewer({
        id: 'inv-123',
        type: 'INVOICE',
        title: 'Invoice #INV-123',
        data: invoiceData,
      })}>
        View Invoice
      </Button>
    </div>
  );
}
```

## Features Detail

### Zoom Controls

- Available for PDF and IMAGE types
- Range: 50% - 200%
- 10% increments
- Disabled buttons at min/max zoom
- Displays current zoom percentage

### Download

- Creates download link with appropriate filename
- Works for all document types with URL
- Filename format: `{title}.{extension}`

### Print

- Opens document URL in new window and triggers print dialog
- Only available for documents with URL
- Uses browser's native print functionality

### Share

- Uses Web Share API if available (mobile devices)
- Falls back to clipboard copy on desktop
- Shares document title and URL

### Open in New Tab

- Opens document in new browser tab
- Useful for full-screen viewing or external tools
- Available for all documents with URL

## Styling

The component uses Tailwind CSS and follows the application's design system:

- Colors from theme variables (background, foreground, muted, etc.)
- Responsive breakpoints (md, lg)
- Dark mode support via CSS variables
- Consistent spacing and typography

## Animations

Powered by Framer Motion:

```tsx
// Panel slides in from right
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}

// Backdrop fades in
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Content fades in (delayed)
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 0.2 }}
```

## Accessibility

- Semantic HTML elements
- ARIA labels on buttons
- Keyboard support (ESC to close)
- Focus management
- Screen reader friendly
- Prevents body scroll when open

## Browser Support

- Modern browsers with ES6+ support
- Web Share API (progressive enhancement)
- iframe support for PDFs
- CSS transforms for zoom

## Performance Considerations

- Lazy loading of document content
- Proper cleanup of object URLs
- AnimatePresence for smooth unmounting
- Prevents body scroll to maintain context

## Troubleshooting

### PDF not displaying

- Ensure the URL is accessible and CORS-enabled
- Check browser's PDF viewer settings
- Verify the URL returns a valid PDF

### Share button not working

- Web Share API requires HTTPS
- Falls back to clipboard on desktop
- May require user interaction

### Zoom not working

- Check that document type is PDF or IMAGE
- Verify zoom controls are not disabled
- Ensure zoom value is within range

## Examples

See `DocumentViewer.example.tsx` for complete working examples.

## Related Components

- `InvoiceDocumentViewer`: Legacy invoice-specific viewer
- `ChatPanel`: Chat interface where DocumentViewer is used
- `ActionResultCard`: Displays action results that may link to documents

## Future Enhancements

- [ ] Support for more document types (Excel, Word, etc.)
- [ ] Thumbnail preview in chat before opening
- [ ] Document annotation capabilities
- [ ] Multi-document viewer (gallery mode)
- [ ] Document comparison view
- [ ] Full-text search within documents
- [ ] Document download progress indicator
- [ ] Custom PDF viewer with more controls
