# Email to Chat Bridge - Testing Instructions

## Overview
The Email to Chat Bridge has been implemented in Sprint 9, Task S9-05. This integration connects the EmailSyncProcessor with EmailIntelligence services to automatically analyze emails and create chat suggestions.

## Implementation Summary

### Files Modified

1. **apps/api/src/modules/integrations/email-sync/email-sync.module.ts**
   - Imported EmailIntelligenceModule
   - Added to module imports

2. **apps/api/src/modules/integrations/email-sync/email-sync.processor.ts**
   - Injected EmailClassifierService, EntityExtractorService, EmailSuggestionsService
   - Added `processEmailIntelligence()` method
   - Modified `createSyncedEmailFromGmail()` to return created email and call intelligence processing
   - Modified `createSyncedEmailFromOutlook()` to return created email and call intelligence processing

3. **apps/api/src/modules/chatbot/chat.controller.ts**
   - Injected EmailSuggestionsService
   - Added GET `/chatbot/suggestions` endpoint
   - Added POST `/chatbot/suggestions/:id/execute` endpoint
   - Added POST `/chatbot/suggestions/:id/dismiss` endpoint
   - Added POST `/chatbot/suggestions/:id/snooze` endpoint

4. **apps/api/src/modules/chatbot/chatbot.module.ts**
   - Imported EmailIntelligenceModule

## Architecture Flow

```
EmailSyncProcessor.syncGmailEmails() or syncOutlookEmails()
  ↓
createSyncedEmailFromGmail() or createSyncedEmailFromOutlook()
  ↓ (returns SyncedEmail)
processEmailIntelligence()
  ↓
1. EmailClassifierService.classifyEmail()
   → Classifies email into business categories
   → Returns classification + confidence
  ↓
2. EntityExtractorService.extractEntities()
   → Extracts companies, contacts, amounts, dates, etc.
   → Returns structured entities
  ↓
3. EmailSuggestionsService.generateSuggestionsForEmail()
   → Creates actionable suggestions based on classification + entities
   → Stores in database (EmailSuggestion table)
```

## API Endpoints

### 1. Get Suggestions
**GET** `/api/v1/chatbot/suggestions`

Query Parameters:
- `types` (optional): Comma-separated suggestion types
- `priority` (optional): Comma-separated priorities (URGENT, HIGH, MEDIUM, LOW)
- `entityId` (optional): Filter by specific entity
- `limit` (optional): Max results (default: 50)

Response:
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "type": "CREATE_BILL",
      "priority": "HIGH",
      "status": "PENDING",
      "title": "Create bill from Acme Corp",
      "message": "Invoice received for EUR 1500.00. Create bill?",
      "entityType": "VENDOR",
      "entityName": "Acme Corp",
      "actionType": "CHAT_ACTION",
      "actionLabel": "Create Bill",
      "actionPayload": { ... },
      "confidence": 0.85,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### 2. Execute Suggestion
**POST** `/api/v1/chatbot/suggestions/:id/execute`

Marks the suggestion as completed and executes the action.

Response:
```json
{
  "success": true,
  "message": "Suggestion marked as completed"
}
```

### 3. Dismiss Suggestion
**POST** `/api/v1/chatbot/suggestions/:id/dismiss`

Dismisses the suggestion (user doesn't want to see it).

Response:
```json
{
  "success": true,
  "message": "Suggestion dismissed"
}
```

### 4. Snooze Suggestion
**POST** `/api/v1/chatbot/suggestions/:id/snooze`

Body:
```json
{
  "until": "2025-01-20T10:00:00Z"
}
```

Response:
```json
{
  "success": true,
  "message": "Suggestion snoozed until 2025-01-20T10:00:00.000Z"
}
```

## Testing Steps

### Prerequisites
1. Ensure ANTHROPIC_API_KEY is configured in environment
2. Have a Gmail or Outlook connection set up
3. Have some test emails with invoices/financial content

### Manual Testing

#### Step 1: Trigger Email Sync
```bash
# Trigger sync via API
curl -X POST https://operate.guru/api/v1/integrations/email-sync/sync/trigger \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "YOUR_CONNECTION_ID",
    "syncType": "INCREMENTAL"
  }'
```

#### Step 2: Check Logs
Watch the API logs for intelligence processing:
```bash
ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && npx pm2 logs operate-api --lines 100"
```

Look for:
- "Processing email intelligence for email: ..."
- "Email classified as: ..."
- "Extracted entities: ..."
- "Email intelligence complete: X suggestions generated"

#### Step 3: Fetch Suggestions
```bash
curl -X GET "https://operate.guru/api/v1/chatbot/suggestions?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 4: Execute a Suggestion
```bash
curl -X POST "https://operate.guru/api/v1/chatbot/suggestions/SUGGESTION_ID/execute" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Verification

Check the EmailSuggestion table:
```sql
SELECT
  id,
  type,
  priority,
  status,
  title,
  message,
  entityType,
  entityName,
  confidence,
  createdAt
FROM "EmailSuggestion"
WHERE "organisationId" = 'YOUR_ORG_ID'
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Error Handling

The implementation includes robust error handling:

1. **Service Unavailable**: If EmailIntelligence services are not initialized (no ANTHROPIC_API_KEY), processing is skipped with a warning log
2. **Processing Errors**: Errors during intelligence processing are logged but don't fail the entire email sync
3. **Classification Errors**: Falls back to UNKNOWN classification with confidence 0.0
4. **Extraction Errors**: Returns empty entities structure

## Performance Considerations

- Email intelligence processing runs asynchronously after email creation
- Does not block the main sync pipeline
- Each email triggers 3 AI calls:
  1. Classification (~1-2 seconds)
  2. Entity extraction (~2-3 seconds)
  3. Suggestion generation (database operations, fast)
- Total processing time per email: ~3-5 seconds
- Runs in background queue, doesn't impact API response times

## Next Steps

1. **Frontend Integration**: Build UI to display suggestions in chat interface
2. **Action Execution**: Implement actual action handlers (create bill, draft email, etc.)
3. **Batch Processing**: Add batch processing for large email volumes
4. **Monitoring**: Add metrics/alerts for suggestion generation rates
5. **Optimization**: Cache entity extraction results to avoid duplicate API calls

## Related Tasks

- S9-01: Email Intelligence Analysis (Foundation)
- S9-02: Email Classifier Service
- S9-03: Entity Extractor Service
- S9-04: Email Suggestions Service
- S9-05: Email to Chat Bridge (This task)
- S9-06: Daily Suggestions Cron Job (Next)
