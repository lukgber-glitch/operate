# Queue Monitor - Quick Start Guide

Get the Bull Board Queue Monitor running in 5 minutes.

## 1. Environment Setup (1 minute)

Add to `.env`:
```env
QUEUE_ADMIN_KEY=your-secure-key-here
BULL_BOARD_ENABLED=true
QUEUE_METRICS_ENABLED=true
QUEUE_FAILURE_THRESHOLD=100
```

Generate secure key:
```bash
openssl rand -base64 32
```

## 2. Install Dependencies (1 minute)

```bash
cd apps/api
pnpm install
```

Dependencies automatically installed:
- `@bull-board/api`
- `@bull-board/express`
- `@bull-board/nestjs`

## 3. Start Development Server (1 minute)

```bash
pnpm run dev
```

## 4. Access Dashboard (1 minute)

### Browser Access

1. Install [ModHeader](https://chrome.google.com/webstore/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj) Chrome extension
2. Add request header:
   - Name: `X-Queue-Admin-Key`
   - Value: `your-secure-key-here`
3. Navigate to: `http://localhost:3000/admin/queues`

### CLI Access

```bash
curl -H "X-Queue-Admin-Key: your-secure-key-here" \
  http://localhost:3000/admin/queues/health
```

## 5. Verify Everything Works (1 minute)

### Check Queue Health
```bash
curl -H "X-Queue-Admin-Key: your-secure-key-here" \
  http://localhost:3000/admin/queues/health
```

Expected response:
```json
[
  {
    "name": "email-sync",
    "waiting": 0,
    "active": 0,
    "completed": 0,
    "failed": 0,
    "delayed": 0,
    "isPaused": false
  }
]
```

### List All Queues
```bash
curl -H "X-Queue-Admin-Key: your-secure-key-here" \
  http://localhost:3000/admin/queues/list
```

## Production Deployment

### Option 1: Manual Deployment

```bash
# Build
cd apps/api
pnpm run build

# Deploy to server
scp -r dist/ cloudways:~/applications/eagqdkxvzv/public_html/apps/api/

# SSH to server
ssh cloudways
cd ~/applications/eagqdkxvzv/public_html/apps/api

# Update .env with production admin key
nano .env

# Restart
pm2 restart operate-api
```

### Option 2: Git Deployment

```bash
# On server
ssh cloudways
cd ~/applications/eagqdkxvzv/public_html

# Pull latest
git pull origin master

# Install dependencies
cd apps/api
npm install

# Build
npm run build

# Restart
pm2 restart operate-api
```

## Access in Production

```bash
# Set your production key
export ADMIN_KEY="your-production-key"

# Test health endpoint
curl -H "X-Queue-Admin-Key: $ADMIN_KEY" \
  https://operate.guru/admin/queues/health

# Access dashboard
open https://operate.guru/admin/queues
# (Remember to add X-Queue-Admin-Key header)
```

## Common Operations

### Clean Old Jobs
```bash
curl -X POST -H "X-Queue-Admin-Key: $ADMIN_KEY" \
  "http://localhost:3000/admin/queues/email-sync/clean?status=completed&age=3600000"
```

### Retry Failed Jobs
```bash
curl -X POST -H "X-Queue-Admin-Key: $ADMIN_KEY" \
  http://localhost:3000/admin/queues/email-sync/retry-failed
```

### Pause Queue
```bash
curl -X POST -H "X-Queue-Admin-Key: $ADMIN_KEY" \
  http://localhost:3000/admin/queues/email-sync/pause
```

### Resume Queue
```bash
curl -X POST -H "X-Queue-Admin-Key: $ADMIN_KEY" \
  http://localhost:3000/admin/queues/email-sync/resume
```

## Monitored Queues (29 Total)

### Email & Documents (4)
- email-sync
- attachment-processing
- invoice-extraction
- receipt-extraction

### Banking (3)
- bank-import
- truelayer-sync
- truelayer-balance

### Finance (3)
- payment-reminders
- bill-reminders
- recurring-invoices

### Tax & Compliance (3)
- deadline-check
- deadline-reminder
- retention-check

### Reporting (3)
- scheduled-reports
- export-scheduler
- mrr-snapshot

### Subscription (5)
- subscription-usage-tracking
- usage-aggregation
- usage-stripe-report
- dunning-retry
- dunning-escalate

### Utility (4)
- exchange-rate-refresh
- search-indexing
- client-insights
- xero-sync

## Features

### Bull Board Dashboard
- ✅ Visual queue monitoring
- ✅ Job details and logs
- ✅ Retry/remove individual jobs
- ✅ Real-time updates
- ✅ Job timeline

### REST API
- ✅ Queue health metrics
- ✅ Queue statistics
- ✅ Bulk retry failed jobs
- ✅ Clean old jobs
- ✅ Pause/resume queues

### Automated Monitoring
- ✅ Metrics logged every 5 minutes
- ✅ Alerts for high failure rates
- ✅ Alerts for paused queues
- ✅ Alerts for stalled jobs

## Troubleshooting

### Can't Access Dashboard

**Problem:** Getting 401 Unauthorized

**Solution:**
1. Check `QUEUE_ADMIN_KEY` is set in `.env`
2. Verify header name is exactly `X-Queue-Admin-Key`
3. Ensure value matches `.env` value

### Queues Not Showing

**Problem:** Bull Board shows no queues

**Solution:**
1. Verify queues are registered in `queue.module.ts`
2. Check queues have been used (have jobs)
3. Restart API: `pm2 restart operate-api`

### Metrics Not Logging

**Problem:** No metrics in logs

**Solution:**
1. Set `QUEUE_METRICS_ENABLED=true` in `.env`
2. Wait 5 minutes (metrics run on schedule)
3. Check logs: `pm2 logs operate-api | grep queue_metrics`

## Next Steps

1. **Read Full Documentation**
   - `README.md` - Complete feature documentation
   - `DEPLOYMENT.md` - Production deployment guide
   - `TESTING.md` - Testing strategies

2. **Configure Monitoring**
   - Set up Grafana dashboards
   - Configure alerts
   - Set up log aggregation

3. **Optimize Queues**
   - Review job retention policies
   - Adjust concurrency settings
   - Configure rate limits

4. **Security Hardening**
   - Rotate admin keys regularly
   - Add IP whitelisting
   - Set up VPN access

## Support

- **Documentation**: See `README.md` for complete guide
- **Testing**: See `TESTING.md` for test procedures
- **Deployment**: See `DEPLOYMENT.md` for production setup

## Summary

You now have:
- ✅ Bull Board dashboard at `/admin/queues`
- ✅ REST API at `/admin/queues/*`
- ✅ Automated metrics collection
- ✅ 29 queues monitored
- ✅ Secure authentication
- ✅ Complete documentation

**Dashboard:** `http://localhost:3000/admin/queues`
**API:** `http://localhost:3000/admin/queues/health`
**Auth:** `X-Queue-Admin-Key: your-secure-key-here`

Happy queue monitoring! 🚀
