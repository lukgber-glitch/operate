# Sentry Quick Start Guide

Get Sentry error tracking up and running in 5 minutes.

## Step 1: Create Sentry Account (2 minutes)

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free account
3. Create organization: `operate`
4. Create two projects:
   - **operate-api** (Platform: Node.js)
   - **operate-web** (Platform: Next.js)

## Step 2: Get Your DSN (1 minute)

For each project:
1. Go to Settings → Client Keys (DSN)
2. Copy the DSN URL (looks like: `https://xxx@o0.ingest.sentry.io/xxx`)

## Step 3: Create Auth Token (1 minute)

1. Go to Settings → Auth Tokens
2. Click "Create New Token"
3. Name: `Operate Deployment`
4. Scopes:
   - ✅ `project:read`
   - ✅ `project:write`
   - ✅ `project:releases`
   - ✅ `org:read`
5. Save token securely

## Step 4: Configure Environment Variables (1 minute)

### Development

Create `apps/api/.env.local`:
```env
SENTRY_DSN=https://YOUR_API_DSN@o0.ingest.sentry.io/xxx
SENTRY_ORG=operate
SENTRY_PROJECT_API=operate-api
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN
```

Create `apps/web/.env.local`:
```env
SENTRY_DSN=https://YOUR_WEB_DSN@o0.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_WEB_DSN@o0.ingest.sentry.io/xxx
SENTRY_ORG=operate
SENTRY_PROJECT_WEB=operate-web
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN
```

### Production (Cloudways)

SSH into server:
```bash
ssh cloudways
cd ~/applications/eagqdkxvzv/public_html/apps/api
nano .env
```

Add to `.env`:
```env
SENTRY_DSN=https://YOUR_API_DSN@o0.ingest.sentry.io/xxx
SENTRY_ORG=operate
SENTRY_PROJECT_API=operate-api
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN
```

Restart API:
```bash
pm2 restart operate-api --update-env
```

## Step 5: Test Integration (30 seconds)

### Test API

```bash
# Development
curl http://localhost:3001/api/v1/health/sentry-test

# Production
curl https://operate.guru/api/v1/health/sentry-test
```

### Test Web

Add this button to any page:
```tsx
<button onClick={() => {
  throw new Error('Test Sentry Integration');
}}>
  Test Sentry
</button>
```

## Step 6: Verify in Sentry Dashboard

1. Go to [sentry.io/organizations/operate](https://sentry.io/organizations/operate)
2. Click on your project (operate-api or operate-web)
3. You should see the test error appear within seconds

## What's Next?

### Set Up Alerts (Recommended)

1. Go to Alerts → Create Alert Rule
2. Create these critical alerts:
   - **Payment Errors**: Any error with route containing "stripe"
   - **Database Errors**: Any error with type "DatabaseError"
   - **High Error Rate**: Error rate > 5% in 15 minutes

See [SENTRY_ALERT_RULES.md](./SENTRY_ALERT_RULES.md) for complete alert setup.

### Integrate Slack (Optional, 5 minutes)

1. Go to Settings → Integrations → Slack
2. Click "Add to Slack"
3. Authorize Operate workspace
4. Configure alert channels:
   - `#alerts-critical` - Critical errors
   - `#alerts-production` - All production errors

### Monitor Performance (Optional)

1. Go to Performance tab in Sentry
2. Set thresholds:
   - Fast: < 1s
   - Okay: < 3s
   - Slow: > 5s
3. Enable alerts for slow endpoints

## Troubleshooting

### "Errors not appearing in Sentry"

1. Check DSN is correct: `echo $SENTRY_DSN`
2. Check logs: `pm2 logs operate-api | grep -i sentry`
3. Verify environment: Should see "Sentry initialized for environment: production"

### "Too many errors"

Lower sample rate in `apps/api/src/modules/sentry/sentry.module.ts`:
```typescript
tracesSampleRate: 0.05, // 5% instead of 10%
```

### "Source maps not working"

1. Verify auth token has correct permissions
2. Check build logs for upload errors
3. Ensure `SENTRY_AUTH_TOKEN` is set

## Cost Optimization

Sentry free tier includes:
- 5,000 errors/month
- 10,000 transactions/month
- 1 GB attachments

Current configuration is optimized for free tier:
- ✅ 10% transaction sampling
- ✅ 4xx errors filtered out
- ✅ 10% session replay sampling

To reduce usage further:
1. Lower sample rates
2. Add more error filters
3. Disable performance monitoring in staging

## Support

- **Documentation**: See README.md in this directory
- **Sentry Docs**: https://docs.sentry.io
- **Issues**: Create GitHub issue or ask in #engineering Slack

## Summary

You now have:
- ✅ Automatic error tracking
- ✅ Performance monitoring
- ✅ User context tracking
- ✅ Test endpoints for verification

**Total Setup Time**: 5-10 minutes
**Monthly Cost**: Free (up to 5k errors)
**Maintenance**: Review weekly, adjust alerts as needed
