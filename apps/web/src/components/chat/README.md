# Chat Interface Components

Comprehensive AI assistant chat interface for Operate/CoachOS with competitor parity to sevDesk/FreeFinance chat assistants.

## Components

### ChatBubble
Floating action button that triggers the chat interface.
- Fixed position in bottom-right corner
- Smooth rotation animation
- Keyboard accessible

### ChatContainer
Main chat interface with responsive design.
- Sheet (drawer) on mobile
- Fixed modal panel on desktop
- Minimized/maximized states
- Auto-scroll to latest message

### ChatHeader
Header component with controls.
- Online/offline status indicator
- Expand/minimize toggle
- New conversation button
- Close button

### ChatInput
Multi-line text input with advanced features.
- Auto-expanding textarea (max 200px)
- Enter to send, Shift+Enter for new line
- Character counter (2000 char limit)
- Attachment button (images, PDFs, docs)
- Voice input placeholder (future)

### ChatMessage
Individual message display with rich formatting.
- User vs AI styling
- Markdown-like formatting (bold, italic, code blocks)
- Status indicators (sending, sent, error)
- Timestamp display
- Error state with retry option

### LoadingMessage
Typing indicator with animated dots.

## Usage

```tsx
import { ChatBubble } from '@/components/chat';

export default function Layout() {
  return (
    <>
      {/* Your app content */}
      <ChatBubble />
    </>
  );
}
```

## Features

- **Responsive Design**: Mobile-first with drawer on mobile, modal on desktop
- **Dark Mode Support**: Follows system/user preference
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Animations**: Smooth transitions with Tailwind CSS
- **Message Formatting**: Bold, italic, inline code, code blocks
- **Error Handling**: Retry failed messages
- **Loading States**: Typing indicators and message status
- **Internationalization**: RTL support with logical properties

## API Integration

The chat connects to `/api/v1/chatbot/quick-ask` endpoint:

```typescript
POST /api/v1/chatbot/quick-ask
Content-Type: application/json

{
  "content": "User message here"
}

Response:
{
  "content": "AI assistant response"
}
```

## Types

See `@/types/chat.ts` for all TypeScript interfaces:
- `ChatMessage`
- `ChatConversation`
- `MessageMetadata`
- `Attachment`

## Customization

The components use the existing design system:
- Colors: `primary`, `muted`, `destructive`, etc.
- Spacing: Following Tailwind utilities
- Animations: Using `tailwindcss-animate`

## Future Enhancements

- [ ] Voice input functionality
- [ ] File upload to backend
- [ ] Conversation history persistence
- [ ] Multiple conversation threads
- [ ] Rich markdown rendering (tables, lists)
- [ ] Syntax highlighting for code blocks
- [ ] Export conversation
- [ ] Share conversation link
