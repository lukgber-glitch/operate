# Email-Based Suggestions Service

## Overview

The Email-Based Suggestions Service (S3-06) generates actionable suggestions based on email analysis and relationship health tracking. It helps users proactively manage customer and vendor relationships by identifying follow-ups, opportunities, and risks.

## Files Created

### 1. Types Definition
**Location**: `types/email-suggestions.types.ts`

Defines all TypeScript types for the email suggestions system:
- `EmailSuggestionType` - 12 different suggestion types
- `EmailSuggestionPriority` - LOW, MEDIUM, HIGH, URGENT
- `EmailSuggestionStatus` - Lifecycle states
- `EmailSuggestion` - Main suggestion structure
- Helper types for input/output

### 2. Service Implementation
**Location**: `email-suggestions.service.ts`

Main service with the following capabilities:

#### Core Methods
```typescript
// Generate suggestions from email analysis
generateSuggestionsForEmail(email, classification, entities, orgId): Promise<EmailSuggestion[]>

// Generate daily suggestions (dormant contacts, overdue items)
generateDailySuggestions(orgId): Promise<EmailSuggestion[]>

// Get suggestions with filtering
getSuggestionsForOrg(orgId, options?): Promise<EmailSuggestion[]>

// Manage suggestion lifecycle
dismissSuggestion(suggestionId, userId): Promise<void>
completeSuggestion(suggestionId, userId): Promise<void>
snoozeSuggestion(suggestionId, userId, until): Promise<void>

// Integrate with relationship tracking
generateSuggestionsFromRelationship(input): Promise<EmailSuggestion[]>
```

### 3. Database Schema
**Location**: `packages/database/prisma/schema.prisma`

Added the following to Prisma schema:
- 5 new enums for email suggestions
- `EmailSuggestion` model with comprehensive tracking fields
- Indexes for performance

### 4. Module Export
**Location**: `email-intelligence.module.ts`

Updated to export `EmailSuggestionsService` for use in other modules.

## Suggestion Types

### Follow-up Suggestions
1. **FOLLOW_UP_QUOTE** - Quote sent X days ago, no response
2. **FOLLOW_UP_INVOICE** - Invoice overdue, send reminder
3. **FOLLOW_UP_INQUIRY** - Customer inquiry needs response

### Re-engagement Suggestions
4. **REENGAGE_DORMANT** - No contact in 60+ days
5. **REENGAGE_PAST_CUSTOMER** - Past customer could return

### Opportunity Suggestions
6. **UPSELL_OPPORTUNITY** - Based on purchase patterns
7. **NEW_CONTACT_DETECTED** - New person at existing company

### Warning Suggestions
8. **RELATIONSHIP_DECLINING** - Response times increasing, sentiment negative
9. **PAYMENT_PATTERN_CHANGE** - Started paying late

### Action Suggestions
10. **CREATE_INVOICE** - Work completed, create invoice
11. **CREATE_BILL** - Received invoice, create bill
12. **UPDATE_CONTACT** - New phone/email detected

## Priority Assignment

Suggestions are automatically prioritized:

- **URGENT**: Invoice significantly overdue, payment pattern changes
- **HIGH**: Quote follow-ups, relationship declining, invoice/bill creation
- **MEDIUM**: Dormant contacts, new contacts, re-engagement
- **LOW**: Update contact info, upsell opportunities

## Expiration Management

Suggestions automatically expire based on type:
- Follow-up invoice: 7 days
- Follow-up inquiry: 14 days
- Follow-up quote: 30 days
- Create invoice/bill: 14 days
- Relationship warnings: 30 days
- Re-engagement: 60-90 days

## Integration Points

### Email Classification Integration
Automatically generates suggestions based on:
- `INVOICE_RECEIVED` → CREATE_BILL
- `QUOTE_REQUEST` → FOLLOW_UP_INQUIRY
- `CUSTOMER_INQUIRY` → FOLLOW_UP_INQUIRY
- `SUPPORT_REQUEST` → FOLLOW_UP_INQUIRY

### Entity Extraction Integration
Detects new contacts from email signatures and suggests adding them.

### Relationship Tracker Integration
Generates suggestions based on:
- Days since last contact
- Response time changes
- Sentiment trends
- Payment behavior changes
- Health score

## Deduplication

The service automatically prevents duplicate suggestions by checking:
- Organisation ID
- Suggestion type
- Entity ID and type
- Current status (PENDING, VIEWED, SNOOZED)

## Usage Example

```typescript
import { EmailSuggestionsService } from './email-suggestions.service';

// After classifying and extracting entities from email
const suggestions = await emailSuggestionsService.generateSuggestionsForEmail(
  email,
  classificationResult,
  extractedEntities,
  orgId
);

// Get all active suggestions for org
const activeSuggestions = await emailSuggestionsService.getSuggestionsForOrg(orgId, {
  types: [EmailSuggestionType.FOLLOW_UP_INVOICE],
  priority: [EmailSuggestionPriority.HIGH, EmailSuggestionPriority.URGENT],
  limit: 10
});

// User dismisses a suggestion
await emailSuggestionsService.dismissSuggestion(suggestionId, userId);

// Generate daily proactive suggestions
const dailySuggestions = await emailSuggestionsService.generateDailySuggestions(orgId);
```

## Database Migration Required

To use this service, run the following migration:

```bash
cd packages/database
npx prisma migrate dev --name add_email_suggestions
```

This will create the `email_suggestions` table with all necessary fields and indexes.

## Next Steps

1. **Run Migration**: Create the database tables
2. **Integration**: Wire up to email processing pipeline
3. **Testing**: Test with real email data
4. **Frontend**: Build UI to display and interact with suggestions
5. **Relationship Tracking**: Complete integration when RelationshipTrackerService metrics are available

## Notes

- The service is designed to work with the existing `Suggestion` model for backward compatibility
- Deduplication ensures users don't see the same suggestion multiple times
- Suggestions expire automatically to avoid clutter
- All suggestions include action payloads for frontend integration
- Confidence scores help prioritize AI-generated suggestions
