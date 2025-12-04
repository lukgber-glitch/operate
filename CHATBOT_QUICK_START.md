# Chatbot Quick Start Guide

## Setup

### 1. Environment Variables

Add to your `.env` file:

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...your-api-key...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=4096
ANTHROPIC_TEMPERATURE=0.7
```

### 2. Verify Installation

The chatbot module is already registered in `app.module.ts`. No additional configuration needed.

### 3. Database

The Conversation and Message models were created in W30-T2. Ensure your database is migrated:

```bash
pnpm prisma migrate dev
```

---

## API Usage

### Authentication

All endpoints require JWT authentication:

```bash
Authorization: Bearer <your-jwt-token>
```

### Base URL

```
http://localhost:3000/chatbot
```

---

## Example Requests

### 1. Create a Conversation

```bash
curl -X POST http://localhost:3000/chatbot/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Invoice Help",
    "contextType": "invoice",
    "pageContext": "/invoices/new"
  }'
```

Response:
```json
{
  "id": "conv_abc123",
  "orgId": "org_xyz",
  "userId": "user_123",
  "title": "Invoice Help",
  "status": "ACTIVE",
  "contextType": "invoice",
  "messageCount": 0,
  "createdAt": "2025-12-03T20:00:00Z"
}
```

### 2. Send a Message

```bash
curl -X POST http://localhost:3000/chatbot/conversations/conv_abc123/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "How do I create an invoice for a new customer?"
  }'
```

Response:
```json
[
  {
    "id": "msg_001",
    "role": "USER",
    "content": "How do I create an invoice for a new customer?",
    "createdAt": "2025-12-03T20:01:00Z"
  },
  {
    "id": "msg_002",
    "role": "ASSISTANT",
    "content": "To create an invoice in Operate:\n\n1. Navigate to **Invoicing** in the main menu\n2. Click **+ New Invoice** in the top right\n3. Fill in the required fields...",
    "model": "claude-3-5-sonnet-20241022",
    "tokenCount": 256,
    "createdAt": "2025-12-03T20:01:02Z"
  }
]
```

### 3. Quick Ask (No Persistence)

For one-off questions without creating a conversation:

```bash
curl -X POST http://localhost:3000/chatbot/quick-ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the VAT rate in Germany?",
    "context": "tax"
  }'
```

Response:
```json
{
  "answer": "The standard VAT rate in Germany is 19%. There is also a reduced rate of 7% for certain goods and services...",
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "input": 48,
    "output": 127
  }
}
```

### 4. List Conversations

```bash
curl -X GET "http://localhost:3000/chatbot/conversations?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get Conversation with Messages

```bash
curl -X GET http://localhost:3000/chatbot/conversations/conv_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Archive Conversation

```bash
curl -X POST http://localhost:3000/chatbot/conversations/conv_abc123/archive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Delete Conversation

```bash
curl -X DELETE http://localhost:3000/chatbot/conversations/conv_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Rate Limiting

- **Limit**: 50 messages per hour per user
- **Scope**: Applies to all message-sending endpoints
- **Response**: HTTP 429 Too Many Requests when exceeded

---

## Context-Aware Prompts

The AI assistant provides context-specific guidance based on `contextType`:

| Context | Focus Area |
|---------|------------|
| `invoice` | Invoice creation, editing, sending |
| `expense` | Expense categorization, deductions |
| `tax` | Tax calculations, filing, compliance |
| `payroll` | Employee management, salary calculations |
| `general` | All platform features |

---

## Testing Tips

### 1. Test with Postman

Import the OpenAPI/Swagger spec from:
```
http://localhost:3000/api-docs
```

### 2. Test Rate Limiting

Send 51 messages within an hour to trigger rate limit.

### 3. Test Context Switching

Create conversations with different `contextType` values and compare responses.

### 4. Test Ownership

Try accessing another user's conversation ID (should return 403).

---

## Monitoring

### Logs

The chatbot logs all interactions:

```
[ChatService] Creating conversation for user user_123 in org org_xyz
[ChatService] AI response generated for conversation conv_abc123
[ClaudeService] Sending 5 messages to Claude
[ClaudeService] Received response: 256 tokens
```

### Token Usage

Track token consumption in message records:
- `tokenCount` field includes input + output tokens
- Use for billing and quota management

---

## Troubleshooting

### Error: "ANTHROPIC_API_KEY not configured"

**Solution**: Add the API key to your `.env` file and restart the server.

### Error: "Failed to get response from AI assistant"

**Possible Causes**:
- Invalid API key
- Rate limit exceeded on Anthropic side
- Network connectivity issues

**Solution**: Check logs for detailed error messages.

### Error: 403 Forbidden

**Cause**: Trying to access a conversation that belongs to another user.

**Solution**: Ensure you're using the correct conversation ID for the authenticated user.

---

## AI Assistant Capabilities

The chatbot can help with:

- **Invoicing**: Create, edit, send invoices, recurring invoices, credit notes
- **Expenses**: Categorize expenses, tax deductions, receipt scanning
- **Tax**: VAT rates, filing preparation, deduction eligibility
- **Payroll**: Employee onboarding, salary calculations, leave management
- **Integrations**: Bank connections, Xero, QuickBooks setup
- **Reports**: Generate financial reports, custom analytics
- **General**: Platform navigation, feature explanations, troubleshooting

---

## Next Steps

1. Test the API endpoints using Postman or curl
2. Implement frontend chat UI
3. Add streaming support for real-time responses (future)
4. Enable action execution (create invoices from chat, etc.)
5. Add analytics dashboard for chat insights

---

## Support

For issues or questions:
- Check the logs in `apps/api/src/modules/chatbot/`
- Review Prisma database records in `Conversation` and `Message` tables
- Verify environment variables are correctly set
- Ensure JWT authentication is working

**Status**: Ready for testing! 🚀
