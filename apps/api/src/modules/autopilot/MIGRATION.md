# Database Migration Instructions

## Overview

The AI Autopilot Mode requires new database tables. This document explains how to create them.

## Migration Steps

### 1. Generate Migration

From the `packages/database` directory:

```bash
cd packages/database
pnpm exec prisma migrate dev --name add_autopilot_mode
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your database
- Regenerate Prisma Client

### 2. Verify Migration

Check that the migration was created:

```bash
ls prisma/migrations/
```

You should see a new directory like `20231214_add_autopilot_mode/`

### 3. Apply to Production

When deploying to production:

```bash
cd packages/database
pnpm exec prisma migrate deploy
```

## Tables Created

The migration creates three new tables:

### `autopilot_config`
- Stores configuration for each organization
- One row per organization (1:1 relationship)

### `autopilot_actions`
- Stores individual autopilot actions
- Many rows per organization
- Tracks pending, approved, executed, rejected, failed actions

### `autopilot_summaries`
- Daily summaries of autopilot activity
- One row per organization per day
- Aggregates metrics and time saved

## Enums Added

### `AutopilotActionType`
- CATEGORIZE_TRANSACTION
- CREATE_INVOICE
- SEND_REMINDER
- RECONCILE_TRANSACTION
- EXTRACT_RECEIPT
- PAY_BILL
- FILE_EXPENSE
- CREATE_CLIENT
- MATCH_PAYMENT

### `AutopilotActionStatus`
- PENDING
- APPROVED
- EXECUTED
- REJECTED
- FAILED

## Rollback

If you need to rollback the migration:

```bash
cd packages/database
pnpm exec prisma migrate resolve --rolled-back add_autopilot_mode
```

Then manually drop the tables:

```sql
DROP TABLE IF EXISTS autopilot_summaries;
DROP TABLE IF EXISTS autopilot_actions;
DROP TABLE IF EXISTS autopilot_config;
DROP TYPE IF EXISTS "AutopilotActionType";
DROP TYPE IF EXISTS "AutopilotActionStatus";
```

## Testing

After migration, verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'autopilot%';
```

Should return:
- autopilot_actions
- autopilot_config
- autopilot_summaries

## Development vs Production

### Development
Use `prisma migrate dev` - includes database reset and seeding

### Production
Use `prisma migrate deploy` - only applies pending migrations

## Common Issues

### Issue: "Database is not empty"
**Solution**: Use `--create-only` flag, then review and apply manually:

```bash
pnpm exec prisma migrate dev --name add_autopilot_mode --create-only
pnpm exec prisma migrate deploy
```

### Issue: "Migration already applied"
**Solution**: Mark as resolved:

```bash
pnpm exec prisma migrate resolve --applied add_autopilot_mode
```

### Issue: Prisma Client not updated
**Solution**: Regenerate client:

```bash
pnpm exec prisma generate
```

## Verification Queries

After migration, test the schema:

```sql
-- Check AutopilotConfig table
SELECT * FROM autopilot_config LIMIT 1;

-- Check AutopilotAction table
SELECT * FROM autopilot_actions LIMIT 1;

-- Check AutopilotSummary table
SELECT * FROM autopilot_summaries LIMIT 1;

-- Check enums
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'AutopilotActionType'::regtype;

SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'AutopilotActionStatus'::regtype;
```

## Next Steps

After migration is complete:

1. Restart API server
2. Test endpoints with Swagger UI at `/api/docs`
3. Create test autopilot config
4. Verify cron jobs are running
