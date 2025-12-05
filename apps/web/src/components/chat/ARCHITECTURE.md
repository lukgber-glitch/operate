# Chat Interface Architecture

## Component Hierarchy

```
ChatBubble (Entry Point)
└── ChatContainer (Main UI)
    ├── ChatHeader
    │   ├── Status Indicator
    │   ├── Title
    │   └── Action Buttons
    │       ├── New Conversation
    │       ├── Expand/Minimize
    │       └── Close
    ├── ScrollArea (Messages)
    │   ├── ChatMessage (User)
    │   ├── ChatMessage (Assistant)
    │   ├── ChatMessage (...)
    │   └── LoadingMessage
    └── ChatInput
        ├── Attachment Button
        ├── Voice Button (placeholder)
        ├── Textarea (auto-expanding)
        └── Send Button
```

## Data Flow

```
User Input → ChatInput
    ↓
handleSend()
    ↓
POST /api/v1/chatbot/quick-ask
    ↓
Response → ChatMessage (Assistant)
    ↓
ScrollArea auto-scrolls
```

## State Management

### ChatContainer State
- `messages: ChatMessage[]` - All messages in conversation
- `isExpanded: boolean` - Minimize/maximize state
- `isLoading: boolean` - API call in progress

### Message States
- `sending` - User message being sent
- `sent` - User message delivered
- `error` - Failed to send
- `received` - Assistant response

## Responsive Behavior

### Mobile (< 768px)
- Sheet component (bottom drawer)
- Full height (90vh)
- No expand/minimize toggle

### Desktop (≥ 768px)
- Fixed positioned panel
- Default: 420px × 600px (bottom-right)
- Expanded: 700px × 85vh (responsive)

## Styling Approach

### Colors
- User messages: `bg-primary` + `text-primary-foreground`
- AI messages: `bg-muted`
- Error state: `border-destructive`

### Animations
- Fade in: `animate-in fade-in-50`
- Slide in: `slide-in-from-bottom-2`
- Typing dots: `animate-bounce` with staggered delays
- Rotation: `rotate-90` on bubble toggle

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader announcements
- Focus management

## Integration Points

### API Endpoints
- `POST /api/v1/chatbot/quick-ask` - Single question
- `POST /api/v1/chatbot/conversations` - New conversation (future)
- `GET /api/v1/chatbot/conversations` - History (future)

### Hooks
- `useChat()` - Chat state management (existing)
- Custom hooks can be integrated

### Type Definitions
- `@/types/chat` - All TypeScript interfaces
- Aligned with backend schemas

## Performance Optimizations

1. **Auto-scroll**: Only on message changes
2. **Memoization**: Message content formatting
3. **Lazy rendering**: Messages list (future: virtual scroll)
4. **Debouncing**: Character counter updates

## Security Considerations

1. **XSS Prevention**: Using `dangerouslySetInnerHTML` with sanitized content
2. **File uploads**: MIME type validation
3. **Rate limiting**: Backend implementation needed
4. **Content filtering**: Backend responsibility

## Future Enhancements

### Phase 2
- Conversation persistence
- Message search
- Export/share conversations
- Conversation threads

### Phase 3
- Voice input/output
- File preview in chat
- Real-time streaming responses
- Multi-user support

### Phase 4
- Rich markdown (tables, lists)
- Syntax highlighting
- Interactive elements (buttons, forms)
- Plugin system
