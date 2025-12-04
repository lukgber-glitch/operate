# Chatbot Module

AI-powered chatbot assistant using Claude API for the Operate platform.

## Overview

This module provides conversational AI capabilities for helping users with:
- Financial questions and tax compliance
- HR management queries
- Business operations assistance
- Integration troubleshooting
- Context-aware suggestions

## Features

- **Conversation Management**: Create and manage chat conversations with context
- **Message History**: Persistent message storage with full conversation history
- **Claude Integration**: Uses Anthropic's Claude API for AI responses
- **Quick Ask**: One-off questions without conversation context
- **AI Suggestions**: Context-aware actionable suggestions for users

## API Endpoints

### Conversations

- `POST /chatbot/conversations` - Create a new conversation
- `GET /chatbot/conversations` - List user conversations (paginated)
- `GET /chatbot/conversations/:id` - Get conversation with full message history
- `POST /chatbot/conversations/:id/messages` - Send a message in a conversation

### Quick Actions

- `POST /chatbot/quick-ask` - Ask a quick question without conversation context
- `GET /chatbot/suggestions` - Get AI-generated suggestions based on context

## Configuration

Required environment variables:

```env
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022  # Optional, defaults to this
```

## Database Models

### Conversation
- Stores conversation metadata
- Links to user and organization
- Tracks conversation status and context type

### Message
- Stores individual messages in conversations
- Supports USER, ASSISTANT, and SYSTEM roles
- Tracks AI metadata (model, tokens, etc.)

## Usage Example

```typescript
// Create a conversation
const conversation = await chatbotService.createConversation({
  userId: user.id,
  orgId: user.orgId,
  title: 'Tax Questions',
  context: 'tax'
});

// Send a message
const response = await chatbotService.sendMessage({
  conversationId: conversation.id,
  userId: user.id,
  orgId: user.orgId,
  content: 'What tax deductions are available for home office?'
});

// Quick ask (no conversation)
const answer = await chatbotService.quickAsk({
  userId: user.id,
  orgId: user.orgId,
  content: 'What is the VAT rate in Germany?'
});
```

## System Prompt

The chatbot uses a specialized system prompt that:
- Identifies as "Operate Assistant"
- Focuses on German/Austrian tax law
- Provides HR and business operations guidance
- Recommends professional consultation when unsure
- Formats responses for readability

## Security

- All endpoints protected with JWT authentication
- User can only access their own conversations
- Organization-scoped data access

## Future Enhancements

- [ ] Streaming responses for real-time chat
- [ ] File attachment support
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Custom system prompts per organization
- [ ] Integration with other modules for context
