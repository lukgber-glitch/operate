# TODO: Implement DELETE Conversation Endpoint

**Status**: ⚠️ **PENDING IMPLEMENTATION**
**Required For**: ChatHistory component to fully delete conversations
**Priority**: Medium
**Estimated Time**: 15-30 minutes

---

## What's Needed

The ChatHistory component on the frontend can delete conversations locally, but the backend DELETE endpoint is missing. This needs to be implemented for full CRUD support.

---

## Implementation Steps

### 1. Add Repository Method

**File**: `apps/api/src/modules/chatbot/chatbot.repository.ts`

Add this method:

```typescript
/**
 * Delete a conversation and all its messages
 */
async deleteConversation(id: string, userId: string): Promise<boolean> {
  const conversation = await this.prisma.conversation.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!conversation) {
    return false;
  }

  // Delete all messages first (if cascade delete is not enabled)
  await this.prisma.conversationMessage.deleteMany({
    where: {
      conversationId: id,
    },
  });

  // Delete the conversation
  await this.prisma.conversation.delete({
    where: {
      id,
    },
  });

  return true;
}
```

**Alternative (if you have CASCADE DELETE in Prisma schema):**

```typescript
async deleteConversation(id: string, userId: string): Promise<boolean> {
  const conversation = await this.prisma.conversation.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!conversation) {
    return false;
  }

  // Messages will be deleted automatically via CASCADE
  await this.prisma.conversation.delete({
    where: {
      id,
    },
  });

  return true;
}
```

---

### 2. Add Service Method

**File**: `apps/api/src/modules/chatbot/chatbot.service.ts`

Add this method:

```typescript
/**
 * Delete a conversation (with ownership check)
 */
async deleteConversation(id: string, userId: string): Promise<boolean> {
  return this.repository.deleteConversation(id, userId);
}
```

---

### 3. Add Controller Endpoint

**File**: `apps/api/src/modules/chatbot/chatbot.controller.ts`

Add this method to the `ChatbotController` class:

```typescript
@Delete('conversations/:id')
@ApiOperation({ summary: 'Delete a conversation' })
@ApiParam({ name: 'id', type: String, description: 'Conversation ID to delete' })
@ApiResponse({
  status: 200,
  description: 'Conversation deleted successfully',
  schema: {
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Conversation deleted successfully' },
    },
  },
})
@ApiResponse({
  status: 404,
  description: 'Conversation not found or unauthorized',
})
async deleteConversation(
  @CurrentUser() user: { id: string },
  @Param('id') id: string,
) {
  this.logger.log(`User ${user.id} deleting conversation ${id}`);

  const deleted = await this.chatbotService.deleteConversation(id, user.id);

  if (!deleted) {
    throw new NotFoundException('Conversation not found or you do not have permission to delete it');
  }

  return {
    success: true,
    message: 'Conversation deleted successfully',
  };
}
```

**Don't forget the imports at the top:**

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,  // ← ADD THIS
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
```

---

### 4. Verify Prisma Schema (Optional)

**File**: `packages/database/prisma/schema.prisma`

Check if you have CASCADE DELETE configured:

```prisma
model Conversation {
  id           String                @id @default(cuid())
  userId       String
  orgId        String
  title        String
  contextType  String?
  createdAt    DateTime              @default(now())
  lastMessageAt DateTime?

  // CASCADE DELETE: When conversation is deleted, delete all messages
  messages     ConversationMessage[] @relation(onDelete: Cascade)

  user         User                  @relation(fields: [userId], references: [id])
  org          Organization          @relation(fields: [orgId], references: [id])

  @@index([userId])
  @@index([orgId])
}

model ConversationMessage {
  id             String       @id @default(cuid())
  conversationId String
  role           String       // "USER" or "ASSISTANT"
  content        String       @db.Text
  attachments    String[]
  metadata       Json?
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
}
```

If `onDelete: Cascade` is configured, the repository method can be simpler (see Alternative above).

---

## Testing

### Manual Testing with cURL

```bash
# Get auth token first
TOKEN="your_jwt_token_here"

# Create a test conversation
curl -X POST http://localhost:3000/api/v1/chatbot/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Conversation"}'

# Note the returned ID, e.g., "clxy1234567890abcdef"

# Delete the conversation
curl -X DELETE http://localhost:3000/api/v1/chatbot/conversations/clxy1234567890abcdef \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "success": true,
#   "message": "Conversation deleted successfully"
# }

# Verify it's deleted
curl -X GET http://localhost:3000/api/v1/chatbot/conversations \
  -H "Authorization: Bearer $TOKEN"

# The deleted conversation should NOT appear in the list
```

### Unit Test (Optional)

**File**: `apps/api/src/modules/chatbot/chatbot.controller.spec.ts`

```typescript
describe('deleteConversation', () => {
  it('should delete a conversation successfully', async () => {
    const userId = 'user-123';
    const conversationId = 'conv-123';

    jest.spyOn(chatbotService, 'deleteConversation').mockResolvedValue(true);

    const result = await controller.deleteConversation(
      { id: userId, orgId: 'org-123' },
      conversationId
    );

    expect(result).toEqual({
      success: true,
      message: 'Conversation deleted successfully',
    });
  });

  it('should throw NotFoundException if conversation not found', async () => {
    const userId = 'user-123';
    const conversationId = 'conv-999';

    jest.spyOn(chatbotService, 'deleteConversation').mockResolvedValue(false);

    await expect(
      controller.deleteConversation(
        { id: userId, orgId: 'org-123' },
        conversationId
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should not delete conversations from other users', async () => {
    const userId = 'user-123';
    const conversationId = 'conv-456'; // Belongs to user-789

    jest.spyOn(chatbotService, 'deleteConversation').mockResolvedValue(false);

    await expect(
      controller.deleteConversation(
        { id: userId, orgId: 'org-123' },
        conversationId
      )
    ).rejects.toThrow(NotFoundException);
  });
});
```

---

## Security Considerations

✅ **Ownership Check**: The `deleteConversation` method checks `userId` to ensure users can only delete their own conversations.

✅ **Soft Delete Option** (Future): Consider adding a `deletedAt` field instead of hard delete:

```prisma
model Conversation {
  // ... other fields
  deletedAt DateTime?
}
```

Then update the repository to:

```typescript
async deleteConversation(id: string, userId: string): Promise<boolean> {
  const conversation = await this.prisma.conversation.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!conversation) return false;

  await this.prisma.conversation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
}
```

---

## After Implementation

Once implemented, update the frontend integration guide:

**File**: `apps/web/src/components/chat/CHAT_HISTORY_INTEGRATION.md`

Change:

```diff
- ❌ **DELETE /api/v1/chatbot/conversations/:id** (Not yet implemented)
+ ✅ **DELETE /api/v1/chatbot/conversations/:id**
```

---

## Checklist

- [ ] Add `deleteConversation` method to `chatbot.repository.ts`
- [ ] Add `deleteConversation` method to `chatbot.service.ts`
- [ ] Add `@Delete` endpoint to `chatbot.controller.ts`
- [ ] Add `Delete` import from `@nestjs/common`
- [ ] Test with cURL or Postman
- [ ] (Optional) Add unit tests
- [ ] (Optional) Verify Prisma CASCADE DELETE
- [ ] Update frontend integration docs
- [ ] Deploy to production

---

## Questions?

If you need help implementing this:

1. Check existing CRUD endpoints in `chatbot.controller.ts` for reference
2. Look at how `getConversation` checks ownership (line 78-86)
3. Follow the same pattern as other DELETE endpoints in the codebase

---

**Priority**: Medium (frontend has fallback, but full functionality requires this)
**Estimated Time**: 15-30 minutes
**Difficulty**: Easy (standard CRUD operation)

**Created**: 2024-12-07
**Created By**: PRISM (Frontend Agent)
**Related Task**: S10-03 - Create Chat History Dropdown Component
