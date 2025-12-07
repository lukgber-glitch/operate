# Sentry Deployment Checklist

This guide walks through deploying Sentry error tracking to production for the Operate application.

## Pre-Deployment

### 1. Create Sentry Account & Projects

- [ ] Sign up at [sentry.io](https://sentry.io)
- [ ] Create organization: `operate`
- [ ] Create project: `operate-api` (Platform: Node.js)
- [ ] Create project: `operate-web` (Platform: Next.js)
- [ ] Note down both DSN URLs from Settings → Client Keys

### 2. Create Auth Token

- [ ] Go to Settings → Auth Tokens
- [ ] Create new token with scopes:
  - `project:read`
  - `project:write`
  - `project:releases`
  - `org:read`
- [ ] Save token securely (won't be shown again)

### 3. Configure Environment Variables

#### Production API (.env)
```env
SENTRY_DSN=https://YOUR_PUBLIC_KEY@o0.ingest.sentry.io/PROJECT_ID
SENTRY_ORG=operate
SENTRY_PROJECT_API=operate-api
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN
```

#### Production Web (.env)
```env
SENTRY_DSN=https://YOUR_PUBLIC_KEY@o0.ingest.sentry.io/PROJECT_ID
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_PUBLIC_KEY@o0.ingest.sentry.io/PROJECT_ID
SENTRY_ORG=operate
SENTRY_PROJECT_WEB=operate-web
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN
```

#### Cloudways Server

Add environment variables via Cloudways control panel or SSH:

```bash
# SSH into server
ssh cloudways

# Navigate to API directory
cd ~/applications/eagqdkxvzv/public_html/apps/api

# Edit .env
nano .env

# Add Sentry variables
SENTRY_DSN=https://YOUR_PUBLIC_KEY@o0.ingest.sentry.io/PROJECT_ID
SENTRY_ORG=operate
SENTRY_PROJECT_API=operate-api
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN

# Save and exit (Ctrl+X, Y, Enter)

# Restart API
pm2 restart operate-api --update-env
```

### 4. Test in Staging

Before deploying to production, test in staging:

- [ ] Deploy to staging environment
- [ ] Trigger test error: `curl https://staging.operate.guru/api/v1/test/sentry-error`
- [ ] Verify error appears in Sentry dashboard
- [ ] Check source maps are working (stack trace shows original code)
- [ ] Verify user context is attached
- [ ] Check performance transaction appears

## Deployment Steps

### 1. Build Applications

#### API
```bash
cd apps/api
pnpm build

# Build output should show Sentry initialization
# Look for: "Sentry initialized for environment: production"
```

#### Web
```bash
cd apps/web
pnpm build

# Should see Sentry source map upload
# Look for: "Uploading source maps to Sentry"
```

### 2. Deploy to Production

#### Via Cloudways

```bash
# Compress build
tar -czf api-production.tar.gz -C apps/api/dist .

# Upload to server
scp api-production.tar.gz cloudways:~/

# SSH into server
ssh cloudways

# Extract and deploy
cd ~/applications/eagqdkxvzv/public_html/apps/api
tar -xzf ~/api-production.tar.gz
npm install --production

# Set environment variables (if not done in step 3)
nano .env

# Restart with environment update
pm2 restart operate-api --update-env

# Check logs
pm2 logs operate-api --lines 100
```

### 3. Verify Deployment

#### Test Error Tracking
```bash
# Trigger test error
curl https://operate.guru/api/v1/health

# Should trigger an error if route doesn't exist
curl https://operate.guru/api/v1/nonexistent

# Check Sentry dashboard for error
```

#### Test Performance Monitoring
```bash
# Make legitimate request
curl https://operate.guru/api/v1/health

# Check Sentry Performance dashboard for transaction
```

#### Verify User Context
```bash
# Login and make authenticated request
# Error should include user context in Sentry
```

### 4. Create Release

Tag the release in Sentry to track which errors belong to which version:

```bash
# Get version from package.json
VERSION=$(node -p "require('./apps/api/package.json').version")

# Create release
sentry-cli releases new -p operate-api operate-api@$VERSION

# Associate commits
sentry-cli releases set-commits --auto operate-api@$VERSION

# Finalize release
sentry-cli releases finalize operate-api@$VERSION

# Deploy notification
sentry-cli releases deploys operate-api@$VERSION new -e production
```

## Post-Deployment

### 1. Configure Alerts

See [SENTRY_ALERT_RULES.md](./SENTRY_ALERT_RULES.md) for detailed alert configuration.

#### Quick Setup (Critical Alerts Only)

1. **Payment Processing Errors**
   - Go to Alerts → Create Alert
   - Type: Issue Alert
   - Condition: `event.tags.route contains "stripe"`
   - Action: Send Slack notification to #payments-critical

2. **Database Errors**
   - Condition: `event.exception.type contains "DatabaseError"`
   - Action: Send Slack notification to #infrastructure-critical

3. **High Error Rate**
   - Type: Metric Alert
   - Condition: Error rate > 5% in 15 minutes
   - Action: Send Slack notification to #engineering

### 2. Integrate with Communication Tools

#### Slack Integration

1. Go to Settings → Integrations → Slack
2. Click "Add to Slack"
3. Authorize Operate workspace
4. Configure channels:
   - `#alerts-critical` - Critical production errors
   - `#alerts-production` - All production errors
   - `#engineering` - Performance alerts

#### PagerDuty Integration (Optional)

1. Go to Settings → Integrations → PagerDuty
2. Add integration key from PagerDuty
3. Create service: "Operate Production"
4. Configure critical alerts to trigger PagerDuty

### 3. Set Up Performance Budgets

1. Go to Performance → Settings
2. Set thresholds:
   - **Fast**: < 1s
   - **Okay**: < 3s
   - **Slow**: > 5s
3. Enable alerts for slow endpoints

### 4. Configure Data Retention

1. Go to Settings → Data & Privacy
2. Set retention period (default: 90 days)
3. Enable data scrubbing for:
   - Credit card numbers
   - Social security numbers
   - Auth tokens
   - API keys

### 5. Set Up User Feedback

Enable user feedback dialog:

```typescript
// Already configured in error-boundary.tsx
Sentry.showReportDialog({ eventId: this.state.eventId });
```

Users can now report errors directly from the error page.

## Monitoring

### Daily Tasks

- [ ] Check Sentry dashboard for new errors
- [ ] Review performance metrics
- [ ] Triage new issues (assign, set priority)

### Weekly Tasks

- [ ] Review alert effectiveness
- [ ] Check for recurring errors
- [ ] Update error fingerprinting rules
- [ ] Review performance trends

### Monthly Tasks

- [ ] Audit ignored errors
- [ ] Review and update alert thresholds
- [ ] Check Sentry quota usage
- [ ] Review integration health

## Rollback Plan

If Sentry causes issues:

### 1. Disable Sentry

```bash
# SSH into server
ssh cloudways

# Edit .env
cd ~/applications/eagqdkxvzv/public_html/apps/api
nano .env

# Comment out or remove
# SENTRY_DSN=...

# Restart
pm2 restart operate-api --update-env
```

### 2. Emergency Disable in Code

If you can't access the server:

```typescript
// apps/api/src/modules/sentry/sentry.module.ts
// Add early return
useFactory: (configService: ConfigService) => {
  // EMERGENCY DISABLE
  return null;

  // ... rest of code
}
```

Redeploy this change to disable Sentry immediately.

## Troubleshooting

### Issue: Errors Not Appearing

**Solution:**
1. Check DSN is correct: `echo $SENTRY_DSN`
2. Check network connectivity: `curl -I https://sentry.io`
3. Check Sentry initialization logs: `pm2 logs operate-api | grep -i sentry`
4. Verify environment: `console.log(process.env.NODE_ENV)`

### Issue: Too Many Errors

**Solution:**
1. Add filters in `sentry-exception.filter.ts`
2. Lower sample rates in `sentry.module.ts`
3. Set quotas in Sentry project settings
4. Use fingerprinting to group similar errors

### Issue: Source Maps Not Working

**Solution:**
1. Check auth token: `echo $SENTRY_AUTH_TOKEN`
2. Verify token permissions in Sentry settings
3. Check build logs for upload errors
4. Manually upload: `sentry-cli sourcemaps upload ./dist`

### Issue: Performance Impact

**Solution:**
1. Lower trace sample rate: `tracesSampleRate: 0.05` (5%)
2. Disable profiling: Comment out `nodeProfilingIntegration()`
3. Reduce breadcrumb retention
4. Use async error sending

### Issue: Privacy Concerns

**Solution:**
1. Review data scrubbing rules
2. Add custom scrubbing in `sentry-exception.filter.ts`
3. Enable user opt-out:
```typescript
if (user.optOutErrorTracking) {
  Sentry.setUser(null);
  return;
}
```

## Cost Management

### Monitor Usage

1. Go to Settings → Subscription
2. Check current usage vs. quota
3. Review breakdown by project

### Optimize Costs

If approaching quota limits:

1. **Reduce Error Volume**
   - Fix recurring errors
   - Filter out non-actionable errors
   - Use better error fingerprinting

2. **Reduce Transaction Volume**
   - Lower `tracesSampleRate`
   - Sample only critical endpoints
   - Disable slow endpoint tracking

3. **Reduce Replay Volume**
   - Lower `replaysSessionSampleRate`
   - Only capture on errors
   - Limit replay duration

4. **Set Rate Limits**
   - Per error type
   - Per user
   - Per endpoint

## Success Metrics

Track these metrics to measure Sentry value:

- **MTTR** (Mean Time To Resolution): How quickly errors are fixed
- **Error Rate**: Percentage of requests that error
- **Alert Accuracy**: % of alerts that are actionable
- **User Impact**: Users affected by errors
- **Performance**: P95 response time trends

## Support

- Sentry Docs: https://docs.sentry.io
- Sentry Support: support@sentry.io
- Operate Internal: #engineering Slack channel

## Appendix

### Useful Sentry CLI Commands

```bash
# Install CLI
npm install -g @sentry/cli

# Configure
sentry-cli login

# Create release
sentry-cli releases new <version>

# Upload source maps
sentry-cli sourcemaps upload --release <version> ./dist

# List releases
sentry-cli releases list

# Delete test releases
sentry-cli releases delete <version>
```

### Environment-Specific Configurations

#### Development
```env
SENTRY_DSN=  # Empty - disabled
```

#### Staging
```env
SENTRY_DSN=<staging-dsn>
# Higher sample rates for testing
tracesSampleRate: 0.5
```

#### Production
```env
SENTRY_DSN=<production-dsn>
# Lower sample rates for performance
tracesSampleRate: 0.1
```
