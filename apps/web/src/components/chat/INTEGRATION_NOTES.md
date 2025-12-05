# File Upload Integration Notes

## Task: W37-T6 - Create message input with attachments

**Status:** ✅ Complete

## Files Created

### 1. Core Hook
**`apps/web/src/hooks/use-file-upload.ts`**
- File upload state management
- Drag-and-drop support
- File validation (type, size)
- Preview generation for images
- Error handling

### 2. Preview Component
**`apps/web/src/components/chat/AttachmentPreview.tsx`**
- Display attached files
- File type icons (PDF, Image, Excel, CSV)
- Image thumbnails
- Remove functionality
- Color-coded by type

### 3. Enhanced ChatInput
**`apps/web/src/components/chat/ChatInput.tsx`**
- Integrated file upload
- Drag-and-drop zone
- Multiple file support
- Visual feedback
- Backwards compatible

### 4. Documentation
- **`FILE_UPLOAD_README.md`** - Comprehensive feature documentation
- **`ChatInput.example.tsx`** - Usage examples

## Key Features Implemented

✅ Drag-and-drop file upload
✅ Click-to-browse file selection
✅ Multiple file attachment (configurable, default 5)
✅ File type validation (PDF, images, Excel, CSV)
✅ File size validation (configurable, default 10MB)
✅ Preview attached files with thumbnails
✅ Remove attachment before sending
✅ File type icons with color coding
✅ Error messages with dismiss
✅ Visual drag-over feedback

## API Changes

### Updated ChatInput Props

```typescript
// OLD
onSend: (message: string) => void;

// NEW (backwards compatible)
onSend: (message: string, files?: AttachedFile[]) => void;

// NEW PROPS
maxFiles?: number;        // Default: 5
maxFileSizeMB?: number;   // Default: 10
```

### AttachedFile Interface

```typescript
interface AttachedFile {
  id: string;              // Unique identifier
  file: File;              // Native File object
  preview?: string;        // Base64 image preview (for images)
  type: 'pdf' | 'image' | 'excel' | 'csv' | 'other';
}
```

## Backend Requirements

To fully integrate this feature, backend needs:

### 1. File Upload Endpoint
```
POST /api/upload
Content-Type: multipart/form-data

Request:
- file: File (binary)

Response:
{
  "fileId": "uuid",
  "fileName": "invoice.pdf",
  "fileSize": 123456,
  "mimeType": "application/pdf",
  "url": "https://storage.example.com/files/uuid"
}
```

### 2. Updated Chat Message Endpoint
```
POST /api/chatbot/conversations/:id/messages
Content-Type: application/json

Request:
{
  "content": "Please review this invoice",
  "fileIds": ["uuid1", "uuid2"]  // NEW: Array of file IDs
}

Response:
{
  "userMessage": {
    "id": "msg-uuid",
    "content": "...",
    "attachments": [...]  // NEW: Populated file metadata
  },
  "assistantMessage": {
    "id": "msg-uuid",
    "content": "..."
  }
}
```

### 3. Database Schema Updates

Add to Message model:
```typescript
interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  attachments?: MessageAttachment[];  // NEW
}

interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  createdAt: Date;
}
```

## Usage in Chat Interface

Update your chat handler to support files:

```typescript
// apps/web/src/components/chat/ChatInterface.tsx

const handleSend = async (message: string, files?: AttachedFile[]) => {
  try {
    // 1. Upload files if present
    const fileIds: string[] = [];
    if (files && files.length > 0) {
      for (const attachedFile of files) {
        const formData = new FormData();
        formData.append('file', attachedFile.file);

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        fileIds.push(uploadRes.data.fileId);
      }
    }

    // 2. Send message with file IDs
    const response = await api.post(
      `/chatbot/conversations/${conversationId}/messages`,
      {
        content: message,
        fileIds,  // Include uploaded file IDs
      }
    );

    // 3. Update UI with response
    setMessages(prev => [...prev, response.data.userMessage, response.data.assistantMessage]);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

return (
  <ChatInput
    onSend={handleSend}
    maxFiles={5}
    maxFileSizeMB={10}
  />
);
```

## Testing Checklist

### Frontend
- [x] Component renders correctly
- [x] File type icons display
- [x] Image previews generate
- [x] Drag-and-drop works
- [x] Click to browse works
- [x] Multiple file selection works
- [x] File validation (type, size)
- [x] Error messages display
- [x] Remove file works
- [x] Files clear after send
- [ ] Integration with ChatInterface

### Backend (To Do)
- [ ] File upload endpoint
- [ ] File storage (S3/Cloudinary)
- [ ] Message attachment handling
- [ ] Database schema migration
- [ ] File URL generation
- [ ] File type validation
- [ ] File size limits
- [ ] Virus scanning (optional)
- [ ] OCR for receipts (optional)
- [ ] Invoice data extraction (optional)

## File Storage Recommendations

### Option 1: AWS S3
```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

async function uploadFile(file: Express.Multer.File) {
  const params = {
    Bucket: 'operate-attachments',
    Key: `${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}
```

### Option 2: Cloudinary
```typescript
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

async function uploadFile(file: Express.Multer.File) {
  const result = await cloudinary.v2.uploader.upload(file.path, {
    resource_type: 'auto',
    folder: 'operate/chat-attachments',
  });

  return result.secure_url;
}
```

## Security Considerations

1. **File Type Validation**
   - Validate MIME type server-side
   - Check file magic numbers (not just extension)
   - Whitelist allowed types

2. **File Size Limits**
   - Enforce max size (10MB default)
   - Consider user tier limits

3. **Virus Scanning**
   - Scan uploads with ClamAV or similar
   - Quarantine suspicious files

4. **Access Control**
   - Generate signed URLs for private files
   - Check user permissions before serving

5. **Rate Limiting**
   - Limit uploads per user/minute
   - Prevent abuse

## Future Enhancements

1. **Image Processing**
   - Compress large images
   - Generate thumbnails
   - Extract EXIF data

2. **OCR Integration**
   - Auto-extract text from receipts
   - Parse invoice data
   - Pre-fill expense forms

3. **AI Processing**
   - Classify document types
   - Extract entities (dates, amounts, vendors)
   - Suggest categories

4. **Bulk Operations**
   - Multi-select files
   - Batch upload
   - Zip folder uploads

5. **Mobile Optimizations**
   - Camera capture
   - Photo library access
   - Compress before upload

## Performance Notes

- Image previews are generated client-side using FileReader
- Large images may take time to preview
- Files are held in memory until send
- Consider streaming for large files
- Implement upload progress indicators for files > 1MB

## Accessibility

- File input has aria-label
- Drag zone provides visual feedback
- Error messages are announced (aria-live)
- Keyboard navigation supported
- Focus management after actions

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- FileReader API required for previews
- Drag-and-drop API required
- Falls back to click-to-browse if drag not supported

## Migration Path

For existing chat components:

1. Update `onSend` handler signature
2. Add file upload logic
3. Update backend to handle file IDs
4. Test with existing conversations
5. Deploy frontend first (backwards compatible)
6. Deploy backend with file support
7. Announce feature to users

## Support

Questions? Check:
- `FILE_UPLOAD_README.md` for detailed docs
- `ChatInput.example.tsx` for code examples
- `use-file-upload.ts` for hook implementation
