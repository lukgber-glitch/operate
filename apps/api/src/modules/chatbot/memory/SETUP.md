# Memory System Setup Guide

Complete guide to setting up the conversation memory system in Operate/CoachOS.

## Prerequisites

- ✅ NestJS backend running
- ✅ PostgreSQL database configured
- ✅ Redis server running
- ✅ Prisma ORM set up
- ✅ Anthropic API key for Claude

## Setup Steps

### 1. Update Prisma Schema

Add the memory models to your Prisma schema:

**Location**: `packages/database/prisma/schema.prisma`

**Insert after** the `MessageActionLog` model (around line 2763):

```prisma
// ============================================================================
// CONVERSATION MEMORY
// ============================================================================

enum MemoryType {
  PREFERENCE
  FACT
  INSTRUCTION
  CONTEXT
}

/// Stores important memories extracted from conversations
model ConversationMemory {
  id             String     @id @default(uuid())
  userId         String
  organizationId String
  type           MemoryType
  content        String     @db.Text
  confidence     Float      @default(1.0)
  source         String     @default("extracted") // extracted, user, system
  conversationId String?    // Optional, for conversation-specific memories
  metadata       Json?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  expiresAt DateTime? // Optional expiration date

  // Relations
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organisation Organisation @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([organizationId])
  @@index([type])
  @@index([conversationId])
  @@index([expiresAt])
  @@map("conversation_memories")
}

/// Stores summaries of old conversation messages
model ConversationSummary {
  id               String   @id @default(uuid())
  conversationId   String   @unique
  summary          String   @db.Text
  messagesIncluded Int // Number of messages summarized
  tokensUsed       Int

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@map("conversation_summaries")
}
```

**Alternative**: Copy from `schema-memory-additions.prisma` file.

### 2. Run Prisma Migration

```bash
cd packages/database

# Format the schema
npx prisma format

# Create migration
npx prisma migrate dev --name add-conversation-memory

# Generate Prisma client
npx prisma generate
```

### 3. Verify Redis Configuration

Ensure Redis is configured in your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 4. Verify Anthropic API Key

Ensure your Claude API key is configured:

```env
# Anthropic Configuration
ANTHROPIC_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### 5. Update Chatbot Module

The chatbot module has already been updated to include the MemoryModule.

Verify `apps/api/src/modules/chatbot/chatbot.module.ts` includes:

```typescript
import { MemoryModule } from './memory/memory.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
    MemoryModule,
    // ... other imports
  ],
  // ...
})
```

### 6. Integrate with Chat Service (Optional)

To integrate memory with your existing chat service:

**Option A**: Update existing ChatService

```typescript
import { ConversationMemoryService } from './memory';

@Injectable()
export class ChatService {
  constructor(
    private readonly memoryService: ConversationMemoryService,
    // ... other services
  ) {}

  async sendMessage(data: SendMessageDto) {
    // Load conversation context
    const context = await this.memoryService.getConversationContext(
      data.conversationId,
    );

    // Build messages with context
    const messages = this.buildMessagesWithContext(context);

    // Call Claude
    const response = await this.claudeService.sendMessage(messages);

    // Extract memories async (don't await)
    this.memoryService.extractAndStoreMemories(
      data.conversationId,
      [userMessage, assistantMessage],
    );

    return response;
  }
}
```

**Option B**: Use the example integration

See `memory/integration-example.ts` for a complete example.

### 7. Test the Setup

Create a test conversation to verify everything works:

```bash
# Start the API
cd apps/api
npm run dev

# Test conversation creation
curl -X POST http://localhost:3000/api/chatbot/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "orgId": "test-org-id",
    "title": "Test Conversation"
  }'

# Send a message
curl -X POST http://localhost:3000/api/chatbot/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conversation-id",
    "content": "Hello! I prefer detailed explanations and my company uses SKR04."
  }'
```

### 8. Verify Memory Extraction

After a few messages, check if memories are being extracted:

```sql
-- Check extracted memories
SELECT * FROM conversation_memories
WHERE "userId" = 'your-user-id'
ORDER BY "createdAt" DESC;

-- Check conversation summaries
SELECT * FROM conversation_summaries
ORDER BY "createdAt" DESC;
```

### 9. Monitor Redis Cache

Check if caching is working:

```bash
# Connect to Redis
redis-cli

# Check cached keys
KEYS chatbot:memory:*

# Check a specific key
GET chatbot:memory:context:your-conversation-id

# Check cache TTL
TTL chatbot:memory:user:your-user-id
```

## Configuration

### Default Configuration

The system uses default configuration from `memory.types.ts`:

```typescript
export const DEFAULT_SLIDING_WINDOW_CONFIG = {
  recentMessageCount: 10,        // Keep last 10 messages in full
  maxTokens: 8000,               // Max tokens for conversation context
  summaryTriggerCount: 15,       // Create summary after 15 messages
};
```

### Custom Configuration

You can customize the configuration per conversation:

```typescript
const context = await memoryService.getConversationContext(conversationId, {
  recentMessageCount: 15,        // Keep more messages
  maxTokens: 10000,              // Allow more tokens
  summaryTriggerCount: 20,       // Summarize less frequently
});
```

## Monitoring

### Key Metrics to Monitor

1. **Token Usage**: Check `totalTokensUsed` in context
2. **Memory Extraction Rate**: Monitor how often memories are extracted
3. **Summary Creation**: Track when summaries are created
4. **Cache Hit Rate**: Monitor Redis cache performance

### Logging

The system logs important events:

```
[ConversationMemoryService] Extracted 3 memories from conversation abc-123
[SlidingWindowService] Optimizing context: current 9500 tokens, target 8000
[ConversationMemoryService] Creating summary for conversation abc-123
```

## Troubleshooting

### Problem: Migration Fails

**Solution**:
1. Check Prisma schema syntax
2. Ensure no duplicate model names
3. Run `npx prisma validate`

### Problem: Memory Service Not Available

**Solution**:
1. Check MemoryModule is imported in ChatbotModule
2. Verify all dependencies (DatabaseModule, CacheModule) are imported
3. Check for circular dependencies

### Problem: Redis Connection Errors

**Solution**:
1. Verify Redis is running: `redis-cli ping`
2. Check Redis configuration in .env
3. Verify network connectivity

### Problem: No Memories Being Extracted

**Solution**:
1. Check Anthropic API key is valid
2. Verify conversations have meaningful content
3. Check Claude API response in logs
4. Ensure async extraction is being called

### Problem: Context Too Large

**Solution**:
1. Reduce `recentMessageCount` in config
2. Force summarization: `await memoryService.summarizeOldMessages(conversationId)`
3. Clear old memories: `await memoryService.clearConversationMemory(conversationId)`

## Performance Optimization

### 1. Redis Tuning

```bash
# Increase max memory (in redis.conf)
maxmemory 2gb
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000
```

### 2. Database Indexing

The schema already includes necessary indexes, but you can add more:

```sql
-- Add index for memory search
CREATE INDEX idx_conversation_memories_content
ON conversation_memories USING gin(to_tsvector('english', content));

-- Add index for summary search
CREATE INDEX idx_conversation_summaries_summary
ON conversation_summaries USING gin(to_tsvector('english', summary));
```

### 3. Batch Operations

For bulk memory extraction:

```typescript
// Extract memories from multiple conversations
const conversations = await getRecentConversations();
await Promise.all(
  conversations.map(conv =>
    memoryService.extractAndStoreMemories(conv.id, conv.messages)
  )
);
```

## Security Considerations

### 1. API Key Protection

Never expose Anthropic API key:
- Store in environment variables
- Use secret management (AWS Secrets Manager, etc.)
- Rotate keys regularly

### 2. Memory Access Control

Ensure users can only access their own memories:

```typescript
// Always verify ownership
const conversation = await prisma.conversation.findUnique({
  where: { id: conversationId },
});

if (conversation.userId !== requestUserId) {
  throw new ForbiddenException('Access denied');
}
```

### 3. GDPR Compliance

Support right to be forgotten:

```typescript
// Clear all user data
async deleteUserData(userId: string) {
  // Delete memories
  await prisma.conversationMemory.deleteMany({
    where: { userId },
  });

  // Delete summaries
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    select: { id: true },
  });

  await prisma.conversationSummary.deleteMany({
    where: {
      conversationId: { in: conversations.map(c => c.id) },
    },
  });

  // Clear cache
  await cache.invalidateUserCaches(userId);
}
```

## Next Steps

1. ✅ Complete setup steps above
2. ✅ Test with real conversations
3. ✅ Monitor performance and token usage
4. ✅ Integrate with existing ChatService
5. ✅ Add monitoring/alerting
6. ✅ Document for team

## Support

For issues or questions:
1. Check [README.md](./README.md) for documentation
2. Review [integration-example.ts](./integration-example.ts)
3. Check logs for errors
4. Contact the AI/ML team (ORACLE agent)

## Changelog

### v1.0.0 (2025-12-03)
- Initial implementation
- Sliding window context management
- Memory extraction with Claude
- Redis caching layer
- Token estimation
- GDPR compliance support
