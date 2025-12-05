# Chat File Upload Feature

## Overview

The ChatInput component now supports file attachments with drag-and-drop functionality, perfect for uploading invoices, receipts, and business documents.

## Features

### Core Functionality
- ✅ **Drag-and-drop** file upload
- ✅ **Click-to-browse** file selection
- ✅ **Multiple file attachments** (configurable limit)
- ✅ **File type validation** (PDF, images, Excel, CSV)
- ✅ **File size validation** (configurable max size)
- ✅ **Preview attached files** before sending
- ✅ **Remove attachments** before sending
- ✅ **File type icons** (PDF, image, Excel, CSV)
- ✅ **Image thumbnails** for image attachments
- ✅ **Error handling** with user-friendly messages
- ✅ **Visual feedback** during drag operations

### Supported File Types

| Type | Extensions | Icon |
|------|-----------|------|
| PDF | `.pdf` | FileText |
| Images | `.jpg`, `.jpeg`, `.png`, `.webp` | Image |
| Excel | `.xls`, `.xlsx` | FileSpreadsheet |
| CSV | `.csv` | FileSpreadsheet |

## Components

### 1. ChatInput
Enhanced chat input with file upload support.

**Location:** `apps/web/src/components/chat/ChatInput.tsx`

**Props:**
```typescript
interface ChatInputProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
  onAttachment?: (file: File) => void;  // Legacy callback
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  showAttachment?: boolean;
  showVoice?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  maxFiles?: number;          // Default: 5
  maxFileSizeMB?: number;     // Default: 10
}
```

**Usage:**
```tsx
import { ChatInput } from '@/components/chat/ChatInput';

function MyChat() {
  const handleSend = (message: string, files?: AttachedFile[]) => {
    console.log('Message:', message);
    console.log('Files:', files);
  };

  return (
    <ChatInput
      onSend={handleSend}
      maxFiles={5}
      maxFileSizeMB={10}
    />
  );
}
```

### 2. AttachmentPreview
Displays attached files with preview and remove functionality.

**Location:** `apps/web/src/components/chat/AttachmentPreview.tsx`

**Props:**
```typescript
interface AttachmentPreviewProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
  className?: string;
}
```

**Features:**
- File type-specific icons
- Image thumbnails (10x10 preview)
- File name and size display
- Remove button per file
- Color-coded by file type

### 3. AttachmentCounter
Small badge showing attachment count.

**Props:**
```typescript
interface AttachmentCounterProps {
  count: number;
  className?: string;
}
```

## Hooks

### useFileUpload

Custom hook for managing file uploads.

**Location:** `apps/web/src/hooks/use-file-upload.ts`

**API:**
```typescript
const {
  attachedFiles,    // Array<AttachedFile>
  addFiles,         // (files: FileList | File[]) => void
  removeFile,       // (id: string) => void
  clearFiles,       // () => void
  isValidFile,      // (file: File) => boolean
  error,            // string | null
  clearError,       // () => void
} = useFileUpload({
  maxFiles: 5,
  maxSizeInMB: 10,
  acceptedTypes: ['image/*', 'application/pdf', ...]
});
```

**AttachedFile Type:**
```typescript
interface AttachedFile {
  id: string;
  file: File;
  preview?: string;  // Base64 data URL for images
  type: 'pdf' | 'image' | 'excel' | 'csv' | 'other';
}
```

## Usage Examples

### Basic Usage
```tsx
import { ChatInput } from '@/components/chat/ChatInput';

function InvoiceChat() {
  const handleSend = (message: string, files?: AttachedFile[]) => {
    // Send to API
    console.log('Message:', message);
    console.log('Attached files:', files);
  };

  return (
    <ChatInput
      onSend={handleSend}
      placeholder="Upload invoice or ask a question..."
    />
  );
}
```

### With File Upload API
```tsx
const handleSend = async (message: string, files?: AttachedFile[]) => {
  // Upload files first
  const uploadedFileIds = [];

  if (files && files.length > 0) {
    for (const attachedFile of files) {
      const formData = new FormData();
      formData.append('file', attachedFile.file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      uploadedFileIds.push(data.fileId);
    }
  }

  // Send message with file references
  await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: message,
      fileIds: uploadedFileIds,
    }),
  });
};
```

### Custom Configuration
```tsx
<ChatInput
  onSend={handleSend}
  maxFiles={10}           // Allow up to 10 files
  maxFileSizeMB={15}      // Max 15MB per file
  showAttachment={true}
  showVoice={true}
/>
```

## Drag & Drop Behavior

### Visual States

1. **Normal State**
   - Paperclip icon in input bar
   - Hint text: "Drag & drop files or click 📎 to attach"

2. **Drag Enter**
   - Background changes to accent color
   - Border highlights in primary color
   - Overlay shows upload icon and instructions

3. **Files Attached**
   - Attachment previews appear above input
   - Paperclip icon changes to primary color
   - Counter badge shows number of files

### Error Handling

The component displays user-friendly error messages for:
- File size exceeds limit
- File type not supported
- Maximum number of files exceeded

Error messages appear above the input with a dismiss button.

## File Type Detection

The hook automatically detects file types based on:
1. MIME type (`file.type`)
2. File extension fallback

Supported types:
- `image/*` → Type: `image`
- `application/pdf` → Type: `pdf`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` → Type: `excel`
- `text/csv` → Type: `csv`

## Styling

### Color Coding

Attachment chips are color-coded by file type:
- **PDF**: Red (`bg-red-100 text-red-700`)
- **Image**: Blue (`bg-blue-100 text-blue-700`)
- **Excel**: Green (`bg-green-100 text-green-700`)
- **CSV**: Purple (`bg-purple-100 text-purple-700`)
- **Other**: Gray (`bg-gray-100 text-gray-700`)

### Customization

You can customize colors by modifying `AttachmentPreview.tsx`:

```tsx
const getFileTypeColor = (type: AttachedFile['type']): string => {
  switch (type) {
    case 'pdf':
      return 'bg-red-100 text-red-700 border-red-200';
    // ... customize other types
  }
};
```

## Backend Integration

### Expected API Endpoints

1. **File Upload Endpoint**
   ```
   POST /api/upload
   Content-Type: multipart/form-data

   Body: FormData with 'file' field

   Response:
   {
     "fileId": "uuid",
     "fileName": "invoice.pdf",
     "fileSize": 123456,
     "mimeType": "application/pdf",
     "url": "https://..."
   }
   ```

2. **Message Send Endpoint**
   ```
   POST /api/chat/messages
   Content-Type: application/json

   Body:
   {
     "content": "Please review this invoice",
     "fileIds": ["uuid1", "uuid2"]
   }

   Response:
   {
     "messageId": "uuid",
     "content": "...",
     "attachments": [...]
   }
   ```

### Recommended Flow

1. User attaches files and types message
2. User clicks send
3. Frontend uploads files to storage (S3, Cloudinary, etc.)
4. Frontend sends message with file IDs/URLs
5. Backend processes message and file references
6. Backend may trigger AI processing (OCR, invoice extraction, etc.)

## Testing

### Manual Testing Checklist

- [ ] Drag and drop single file
- [ ] Drag and drop multiple files
- [ ] Click to browse and select files
- [ ] Upload PDF file
- [ ] Upload image file (verify thumbnail)
- [ ] Upload Excel/CSV file
- [ ] Try to upload unsupported file type (should show error)
- [ ] Try to upload file exceeding size limit (should show error)
- [ ] Try to upload more than max files (should show error)
- [ ] Remove attached file before sending
- [ ] Send message with attachments
- [ ] Send message without attachments
- [ ] Send attachments without message

### Integration Testing

```typescript
// Example Jest test
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

test('handles file upload', async () => {
  const handleSend = jest.fn();
  render(<ChatInput onSend={handleSend} />);

  const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
  const input = screen.getByLabelText('File upload input');

  fireEvent.change(input, { target: { files: [file] } });

  // Verify preview appears
  expect(screen.getByText('invoice.pdf')).toBeInTheDocument();

  // Send message
  const sendButton = screen.getByLabelText('Send message');
  fireEvent.click(sendButton);

  expect(handleSend).toHaveBeenCalledWith(
    expect.any(String),
    expect.arrayContaining([
      expect.objectContaining({ file })
    ])
  );
});
```

## Future Enhancements

Potential improvements for future sprints:

- [ ] Progress bars for large file uploads
- [ ] Compress images before upload
- [ ] Camera capture for mobile receipts
- [ ] File preview modal/lightbox
- [ ] Bulk file operations
- [ ] Paste images from clipboard
- [ ] Automatic file classification (AI)
- [ ] Extract data from uploaded invoices (OCR)

## Migration Guide

### For Existing Chat Components

If you're upgrading from the old ChatInput:

**Before:**
```tsx
<ChatInput
  onSend={handleSend}
  onAttachment={handleSingleFile}  // Legacy
/>
```

**After:**
```tsx
<ChatInput
  onSend={(message, files) => {
    handleSend(message);
    if (files?.[0]) handleSingleFile(files[0].file);
  }}
/>
```

The `onAttachment` prop is still supported for backwards compatibility but is deprecated.

## Troubleshooting

### Files not accepting
- Check `accept` attribute in file input
- Verify MIME types in `useFileUpload` hook

### Preview not showing
- Ensure FileReader is supported
- Check image file size (very large images may fail)

### Drag-and-drop not working
- Verify all drag event handlers are attached
- Check `isDragging` state is updating correctly

### Files not clearing after send
- Ensure `clearFiles()` is called in `handleSend`
- Check for errors in file upload hook

## Support

For questions or issues:
- Check examples in `ChatInput.example.tsx`
- Review hook implementation in `use-file-upload.ts`
- Test component in Storybook (if available)
