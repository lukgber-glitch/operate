# Database Migration Instructions - Email Suggestions

## Overview

This migration adds the Email Suggestions feature to support AI-generated actionable suggestions based on email analysis and relationship health.

## What's Being Added

### New Enums
1. `EmailSuggestionType` - 12 suggestion types (follow-ups, re-engagement, opportunities, warnings, actions)
2. `EmailSuggestionPriority` - LOW, MEDIUM, HIGH, URGENT
3. `EmailSuggestionStatus` - PENDING, VIEWED, COMPLETED, DISMISSED, SNOOZED, EXPIRED
4. `EmailSuggestionEntityType` - CUSTOMER, VENDOR, CONTACT, INVOICE, BILL, EMAIL
5. `EmailSuggestionActionType` - NAVIGATE, CHAT_ACTION, API_CALL, OPEN_MODAL

### New Table
- `email_suggestions` - Stores AI-generated suggestions with:
  - Suggestion details (type, priority, status, title, message)
  - Entity relationships (entityId, entityType, entityName)
  - Source email tracking (sourceEmailId, sourceEmailSubject)
  - Action payloads for frontend integration
  - Lifecycle tracking (created, expired, dismissed, completed, snoozed)
  - AI metadata (confidence score, context data)

## Migration Steps

### Step 1: Generate Migration

```bash
cd packages/database
npx prisma migrate dev --name add_email_suggestions
```

This will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your local database
3. Regenerate the Prisma Client

### Step 2: Verify Migration

Check that the migration was created successfully:

```bash
# List migrations
ls prisma/migrations/

# Check last migration
ls prisma/migrations/ | tail -1
```

You should see a new folder like: `20250106XXXXXX_add_email_suggestions/`

### Step 3: Test Locally

```bash
# Check if table exists
npx prisma studio
# Navigate to EmailSuggestion model in the UI
```

### Step 4: Deploy to Production (When Ready)

```bash
# On production server
cd packages/database
npx prisma migrate deploy
```

## Rollback (If Needed)

If you need to rollback this migration:

```bash
cd packages/database
npx prisma migrate resolve --rolled-back [MIGRATION_NAME]
```

Then manually drop the table:

```sql
-- In your database client
DROP TABLE IF EXISTS email_suggestions;
DROP TYPE IF EXISTS "EmailSuggestionType";
DROP TYPE IF EXISTS "EmailSuggestionPriority";
DROP TYPE IF EXISTS "EmailSuggestionStatus";
DROP TYPE IF EXISTS "EmailSuggestionEntityType";
DROP TYPE IF EXISTS "EmailSuggestionActionType";
```

## Indexes Created

The migration includes the following indexes for optimal performance:

```sql
CREATE INDEX ON email_suggestions(organisationId);
CREATE INDEX ON email_suggestions(type);
CREATE INDEX ON email_suggestions(priority);
CREATE INDEX ON email_suggestions(status);
CREATE INDEX ON email_suggestions(entityId);
CREATE INDEX ON email_suggestions(entityType);
CREATE INDEX ON email_suggestions(createdAt);
CREATE INDEX ON email_suggestions(expiresAt);
```

## Estimated Migration Time

- **Small DB** (<1000 records): <1 second
- **Medium DB** (1K-10K records): <5 seconds
- **Large DB** (>10K records): <10 seconds

This is a new table with no data migration, so it should be very fast.

## After Migration

Once the migration is complete:

1. **Restart API Server** to load new Prisma types
2. **Test Service** with sample email data
3. **Monitor Logs** for any errors
4. **Verify Suggestions** are being created correctly

## Verification Queries

After migration, you can verify with these SQL queries:

```sql
-- Check table exists
SELECT * FROM information_schema.tables WHERE table_name = 'email_suggestions';

-- Check enum types
SELECT * FROM pg_type WHERE typname LIKE '%suggestion%';

-- Count suggestions (should be 0 initially)
SELECT COUNT(*) FROM email_suggestions;

-- Test insert
INSERT INTO email_suggestions (
  id,
  "organisationId",
  type,
  priority,
  status,
  title,
  message,
  "createdAt"
) VALUES (
  gen_random_uuid(),
  'test-org-id',
  'FOLLOW_UP_INVOICE',
  'HIGH',
  'PENDING',
  'Test Suggestion',
  'This is a test suggestion',
  NOW()
);

-- Verify and cleanup
SELECT * FROM email_suggestions WHERE title = 'Test Suggestion';
DELETE FROM email_suggestions WHERE title = 'Test Suggestion';
```

## Notes

- This migration is **non-breaking** - it only adds new tables/enums
- No existing data is modified
- Safe to run in production with zero downtime
- The table starts empty and is populated by the EmailSuggestionsService as emails are processed

## Support

If you encounter issues during migration:
1. Check Prisma logs: `npx prisma migrate status`
2. Review migration file in `prisma/migrations/`
3. Ensure database user has CREATE TABLE permissions
4. Check PostgreSQL version compatibility (requires PostgreSQL 12+)
