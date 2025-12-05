# Message Actions Feature

## Overview

The Message Actions feature adds interactive action buttons to assistant messages in the chat interface. These buttons provide quick access to common operations and contextual actions based on message content.

## Components

### MessageActions Component

Located at: `apps/web/src/components/chat/MessageActions.tsx`

**Features:**
- Hover-reveal on desktop (opacity transition)
- Always visible on tap/focus for mobile and keyboard navigation
- Accessible tooltips for all buttons
- Copy-to-clipboard with visual feedback
- Contextual action detection

**Default Actions:**
1. **Copy** - Copy message text to clipboard (with check icon feedback)
2. **Regenerate** - Request a new AI response
3. **Bookmark** - Save important messages

**Contextual Actions:**
These appear automatically based on message content:
- **Create Invoice** - When message mentions "invoice", "rechnung", or "faktur"
- **View Document** - When message references documents, files, or PDFs
- **Export** - When message mentions export, download, CSV, or reports

## Usage

### Basic Implementation

```tsx
import { ChatMessage, ActionType } from '@/components/chat';

function MyChat() {
  const handleAction = (messageId: string, action: ActionType) => {
    switch (action) {
      case 'copy':
        // Handled automatically by MessageActions
        break;
      case 'regenerate':
        // Re-send previous user message
        break;
      case 'create-invoice':
        // Navigate to invoice creation
        break;
      // ... other actions
    }
  };

  return (
    <ChatMessage
      message={message}
      onAction={handleAction}
    />
  );
}
```

### Custom Contextual Actions

```tsx
import { detectContextualActions, MessageActions } from '@/components/chat';

// Detect actions from message content
const contextualActions = detectContextualActions(message.content);

// Or provide custom actions
const customActions = [
  {
    type: 'custom-action',
    label: 'My Custom Action',
    icon: MyIcon,
    enabled: true,
  },
];

<MessageActions
  messageId={message.id}
  content={message.content}
  onAction={handleAction}
  contextualActions={customActions}
/>
```

## Action Types

```typescript
type ActionType =
  | 'copy'           // Copy to clipboard
  | 'regenerate'     // Regenerate response
  | 'create-invoice' // Create invoice from context
  | 'view-document'  // Open document viewer
  | 'export'         // Export data (PDF/CSV)
  | 'bookmark';      // Bookmark message
```

## Styling

Action buttons are hidden by default and revealed on hover/focus:
- Desktop: `group-hover:opacity-100`
- Mobile/Keyboard: `focus-within:opacity-100`
- Smooth transitions with 200ms duration

## Accessibility

- Proper ARIA labels on all buttons
- Keyboard navigation support
- Focus states show actions
- Tooltips with descriptive text
- Role="toolbar" for screen readers

## Integration with ChatContainer

The `ChatContainer` component includes a `handleMessageAction` function that processes all action types:

```typescript
const handleMessageAction = async (messageId: string, action: ActionType) => {
  switch (action) {
    case 'regenerate':
      // Find previous user message and resend
      break;
    case 'create-invoice':
      // Navigate to invoice creation with context
      break;
    case 'bookmark':
      // Save to bookmarks
      break;
    // ... other actions
  }
};
```

## Future Enhancements

- Backend API integration for bookmark storage
- Export to PDF/CSV functionality
- Document viewer modal
- Smart invoice pre-filling from message context
- More contextual actions based on AI analysis
- Action history and analytics

## Keywords for Detection

**Invoice Actions:**
- invoice, rechnung, faktur

**Document Actions:**
- document, file, attachment, pdf

**Export Actions:**
- export, download, csv, report

## Icons Used

- Copy: `Copy` → `Check` (after copy)
- Regenerate: `RefreshCw` (rotates on hover)
- Bookmark: `Bookmark`
- Create Invoice: `Receipt`
- View Document: `FolderOpen`
- Export: `Download`
