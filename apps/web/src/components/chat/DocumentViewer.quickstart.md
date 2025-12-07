# DocumentViewer - Quick Start

## 1-Minute Setup

### Import
```tsx
import { DocumentViewer } from '@/components/chat';
```

### Add State
```tsx
const [doc, setDoc] = useState(null);
const [isOpen, setIsOpen] = useState(false);
```

### Render
```tsx
{doc && (
  <DocumentViewer
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    document={doc}
  />
)}
```

### Open Document
```tsx
setDoc({
  id: 'doc-1',
  type: 'PDF',  // or 'IMAGE', 'INVOICE', 'BILL', 'EXPENSE'
  title: 'My Document',
  url: '/document.pdf',  // for PDF/IMAGE
  // OR
  data: { /* invoice/bill data */ },  // for INVOICE/BILL/EXPENSE
});
setIsOpen(true);
```

## Document Types

### PDF
```tsx
{ id: '1', type: 'PDF', title: 'Report', url: '/report.pdf' }
```

### Image
```tsx
{ id: '2', type: 'IMAGE', title: 'Receipt', url: '/receipt.jpg' }
```

### Invoice/Bill
```tsx
{
  id: '3',
  type: 'INVOICE',
  title: 'Invoice #123',
  data: {
    number: '123',
    total: 1500,
    items: [{ description: 'Service', price: 1500, quantity: 1 }],
  }
}
```

## Features

- ✅ Slide-out from right
- ✅ Zoom controls (PDF/Image)
- ✅ Download/Print/Share
- ✅ Responsive (mobile full-screen)
- ✅ ESC to close
- ✅ Smooth animations

## Full Docs

- `DOCUMENT_VIEWER_README.md` - Complete API docs
- `DOCUMENT_VIEWER_INTEGRATION_GUIDE.md` - Integration examples
- `DocumentViewer.example.tsx` - Working examples
