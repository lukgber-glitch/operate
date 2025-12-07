# Migration Instructions - Usage Tracking System

## Prerequisites

- Database connection configured (`.env` file with `DATABASE_URL`)
- Node.js and pnpm installed
- Access to production/staging database

## Steps to Deploy

### 1. Backup Database (Production Only)

```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Generate Migration

```bash
cd packages/database

# Generate migration
npx prisma migrate dev --name add_usage_tracking_features
```

This will:
- Add new `UsageFeature` enum values
- Create `SubscriptionTier` table
- Add `subscriptionTier` field to `Organisation` table

### 3. Apply Migration

#### Development
```bash
npx prisma migrate dev
```

#### Production
```bash
npx prisma migrate deploy
```

### 4. Seed Subscription Tiers

```bash
npx prisma db seed
```

This will create 4 subscription tiers:
- Free ($0/month)
- Starter ($29/month)
- Pro ($79/month)
- Business ($149/month)

### 5. Update Existing Organizations (Optional)

If you have existing organizations, they will default to "free" tier. To set specific tiers:

```sql
-- Update all orgs to free tier (default behavior)
UPDATE organisations SET subscription_tier = 'free' WHERE subscription_tier IS NULL;

-- Or set specific orgs to different tiers
UPDATE organisations SET subscription_tier = 'pro' WHERE slug = 'acme';
UPDATE organisations SET subscription_tier = 'business' WHERE slug = 'enterprise-corp';
```

### 6. Verify Migration

```bash
# Check tables created
npx prisma studio

# Or using psql
psql $DATABASE_URL
\dt subscription_tiers
\d+ organisations
```

### 7. Build and Deploy Backend

```bash
# Build
cd apps/api
pnpm build

# Deploy
# (Your deployment process here - PM2, Docker, etc.)
```

### 8. Verify API Endpoints

```bash
# Get limits for an org
curl -X GET http://localhost:3000/api/v1/usage/{orgId}/limits \
  -H "Authorization: Bearer {token}"

# Check specific feature
curl -X GET http://localhost:3000/api/v1/usage/{orgId}/check/AI_MESSAGES \
  -H "Authorization: Bearer {token}"
```

## Rollback Plan

If something goes wrong:

### 1. Restore Database Backup

```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### 2. Or Revert Migration

```bash
cd packages/database

# Check migration history
npx prisma migrate status

# Revert last migration
npx prisma migrate resolve --rolled-back add_usage_tracking_features
```

## Post-Deployment Checklist

- [ ] Database migration applied successfully
- [ ] Subscription tiers seeded
- [ ] All organizations have a `subscriptionTier` value
- [ ] API endpoints responding correctly
- [ ] AI messages being tracked in chat
- [ ] Usage limits enforcing correctly
- [ ] No errors in application logs

## Monitoring

After deployment, monitor:

1. **Usage Event Creation**
   ```sql
   SELECT COUNT(*) FROM usage_events
   WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

2. **Subscription Tier Distribution**
   ```sql
   SELECT subscription_tier, COUNT(*)
   FROM organisations
   GROUP BY subscription_tier;
   ```

3. **API Response Times**
   - Check `/api/v1/usage/*` endpoint performance
   - Ensure usage tracking doesn't slow down chat responses

4. **Error Logs**
   - Watch for "Failed to track usage" warnings
   - Monitor limit enforcement errors

## Troubleshooting

### Migration Fails

**Error: `enum VatReturnStatus already exists`**
- This is already fixed in the schema
- If you see it, remove duplicate enum at line 7245

**Error: `DATABASE_URL not found`**
- Ensure `.env` file exists in `packages/database/`
- Or set environment variable: `export DATABASE_URL="postgresql://..."`

### Seed Fails

**Error: `SubscriptionTier already exists`**
- Safe to ignore - upsert will update existing records
- Or delete and re-seed:
  ```sql
  DELETE FROM subscription_tiers;
  ```

### Usage Not Tracking

1. Check UsageModule is imported in ChatbotModule
2. Verify UsageMeteringService is injected into ChatService
3. Check logs for tracking errors
4. Ensure Bull queues are running (Redis connection)

## Production Considerations

### High Traffic

For high-traffic deployments:

1. **Use Queue for Tracking**
   - Already implemented via Bull
   - Ensure Redis is properly scaled

2. **Database Indexes**
   - Already added via Prisma
   - Monitor query performance

3. **Caching**
   - Consider caching tier limits (rarely change)
   - Cache current usage for 1-5 minutes

### Zero-Downtime Deployment

1. Deploy backend with new code (backwards compatible)
2. Run migration during low-traffic period
3. Seed subscription tiers
4. Restart application
5. Monitor for 15 minutes
6. Roll back if issues

## Support

If you encounter issues:

1. Check logs: `pm2 logs operate-api`
2. Review migration status: `npx prisma migrate status`
3. Verify database state: `npx prisma studio`
4. Contact backend team with error logs

---

**Migration prepared by**: FORGE (Backend Agent)
**Date**: 2025-12-07
**Version**: 1.0.0
