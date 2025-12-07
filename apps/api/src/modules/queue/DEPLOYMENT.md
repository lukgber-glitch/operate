# Queue Monitor Deployment Guide

Quick guide to deploy the Bull Board Queue Monitor to production.

## Pre-Deployment Checklist

- [x] Dependencies installed (`@bull-board/*` packages)
- [x] Queue module created and integrated
- [x] Authentication middleware configured
- [x] Environment variables added to `.env.example`

## Deployment Steps

### 1. Update Environment Variables

Add to your production `.env` file on the server:

```bash
# SSH into server
ssh cloudways

# Edit environment file
cd ~/applications/eagqdkxvzv/public_html/apps/api
nano .env
```

Add these lines:

```env
# Queue Monitoring
QUEUE_ADMIN_KEY=<generate-secure-key-here>
BULL_BOARD_ENABLED=true
QUEUE_METRICS_ENABLED=true
QUEUE_FAILURE_THRESHOLD=100
```

Generate a secure admin key:
```bash
openssl rand -base64 32
```

### 2. Build and Deploy

```bash
# On local machine
cd /c/Users/grube/op/operate-fresh

# Install dependencies
pnpm install

# Build API
cd apps/api
pnpm run build

# Create deployment package
tar -czf queue-monitor-update.tar.gz \
  dist/modules/queue/ \
  package.json

# Upload to server
scp queue-monitor-update.tar.gz cloudways:~/applications/eagqdkxvzv/public_html/apps/api/
```

### 3. Deploy on Server

```bash
# SSH into server
ssh cloudways

# Navigate to API directory
cd ~/applications/eagqdkxvzv/public_html/apps/api

# Extract update
tar -xzf queue-monitor-update.tar.gz

# Install new dependencies
npm install @bull-board/api @bull-board/express @bull-board/nestjs

# Restart API
pm2 restart operate-api --update-env

# Check logs
pm2 logs operate-api --lines 50
```

### 4. Verify Deployment

#### Check API Health
```bash
curl https://operate.guru/api/v1/health
```

#### Test Queue Health Endpoint (with admin key)
```bash
curl -H "X-Queue-Admin-Key: your-key-here" \
  https://operate.guru/admin/queues/health
```

#### Access Bull Board Dashboard
```
https://operate.guru/admin/queues
```

Login with:
- Header: `X-Queue-Admin-Key: your-key-here`
- OR JWT Bearer token with ADMIN/OWNER role

### 5. Configure Nginx (Optional but Recommended)

Add IP whitelisting for queue dashboard:

```bash
# SSH to server
ssh cloudways

# Edit nginx config
sudo nano /etc/nginx/sites-available/operate.guru
```

Add this location block:

```nginx
# Queue monitoring (IP restricted)
location /admin/queues {
    # Allow your office IP
    allow 203.0.113.0/24;

    # Allow VPN IP range
    allow 10.0.0.0/8;

    # Deny all others
    deny all;

    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Post-Deployment Testing

### 1. Test Queue Health API

```bash
# Get all queue health
curl -H "X-Queue-Admin-Key: your-key" \
  https://operate.guru/admin/queues/health

# Get specific queue stats
curl -H "X-Queue-Admin-Key: your-key" \
  https://operate.guru/admin/queues/email-sync/stats

# List all queues
curl -H "X-Queue-Admin-Key: your-key" \
  https://operate.guru/admin/queues/list
```

### 2. Test Queue Management

```bash
# Retry failed jobs
curl -X POST -H "X-Queue-Admin-Key: your-key" \
  https://operate.guru/admin/queues/email-sync/retry-failed

# Clean old completed jobs (older than 1 hour)
curl -X POST -H "X-Queue-Admin-Key: your-key" \
  "https://operate.guru/admin/queues/email-sync/clean?status=completed&age=3600000"

# Pause a queue
curl -X POST -H "X-Queue-Admin-Key: your-key" \
  https://operate.guru/admin/queues/email-sync/pause

# Resume a queue
curl -X POST -H "X-Queue-Admin-Key: your-key" \
  https://operate.guru/admin/queues/email-sync/resume
```

### 3. Check Metrics Logging

```bash
# View logs on server
ssh cloudways
pm2 logs operate-api --lines 100 | grep "queue_metrics"
```

You should see metrics logged every 5 minutes:
```json
{
  "type": "queue_metrics",
  "queue": "email-sync",
  "waiting": 5,
  "active": 2,
  "completed": 1234,
  "failed": 3,
  "delayed": 0,
  "isPaused": false,
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

### 4. Test Bull Board UI

1. Open browser to: `https://operate.guru/admin/queues`
2. Authenticate (add `X-Queue-Admin-Key` header or use admin JWT)
3. Verify you can see all queues
4. Test queue operations:
   - View job details
   - Retry failed jobs
   - Clean old jobs
   - Pause/resume queues

## Monitoring Setup

### CloudWatch Logs (AWS)

If using AWS CloudWatch, create log filters:

```bash
# High failure rate alert
[type=queue_alert, level=warning, queue, message, failed > 100]
```

### Grafana Dashboard

Import the queue metrics into Grafana:

1. Configure Loki to ingest PM2 logs
2. Create dashboard with panels for:
   - Queue job counts (line chart)
   - Failure rates (bar chart)
   - Active jobs (gauge)
   - Queue status (table)

### Email Alerts

Configure PM2 to send alerts:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Troubleshooting

### Issue: Bull Board not accessible

**Check:**
1. Is API running? `pm2 list`
2. Are dependencies installed? `npm ls @bull-board/api`
3. Check nginx config and reload
4. Check firewall rules

**Solution:**
```bash
# Restart API
pm2 restart operate-api

# Check logs
pm2 logs operate-api --err
```

### Issue: Authentication failing

**Check:**
1. Is `QUEUE_ADMIN_KEY` set in `.env`?
2. Is header name correct? `X-Queue-Admin-Key`
3. For JWT: Does user have ADMIN/OWNER role?

**Solution:**
```bash
# Verify environment variable
ssh cloudways
cd ~/applications/eagqdkxvzv/public_html/apps/api
grep QUEUE_ADMIN_KEY .env
```

### Issue: Queues not showing in dashboard

**Check:**
1. Are queues registered in `queue.module.ts`?
2. Are queues in `queue-board.module.ts`?
3. Do queues have jobs?

**Solution:**
Review queue configuration and ensure queues are being used.

### Issue: High memory usage

**Cause:** Too many completed jobs in Redis

**Solution:**
Clean old jobs regularly:
```bash
# Clean all queues
for queue in email-sync bank-import invoice-extraction; do
  curl -X POST -H "X-Queue-Admin-Key: your-key" \
    "https://operate.guru/admin/queues/$queue/clean?age=3600000"
done
```

Or configure automatic cleanup in queue options:
```typescript
removeOnComplete: {
  age: 3600,
  count: 100,
}
```

## Rollback Plan

If deployment fails:

```bash
# SSH to server
ssh cloudways
cd ~/applications/eagqdkxvzv/public_html/apps/api

# Restore previous version
git checkout HEAD~1

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart operate-api
```

## Security Recommendations

1. **Use Strong Admin Key**
   - Minimum 32 characters
   - Generated with cryptographic random
   - Rotated periodically

2. **IP Whitelisting**
   - Only allow from office/VPN IPs
   - Configure in Nginx

3. **HTTPS Only**
   - Ensure SSL certificate is valid
   - Force HTTPS redirects

4. **Rate Limiting**
   - Already configured in app.module.ts
   - Monitor for abuse

5. **Regular Audits**
   - Review access logs
   - Monitor for suspicious activity
   - Update dependencies regularly

## Maintenance

### Weekly Tasks
- Review queue health metrics
- Clean old completed/failed jobs
- Check for high failure rates
- Review alerts

### Monthly Tasks
- Rotate admin keys
- Review and optimize queue configurations
- Update dependencies
- Performance tuning

## Support Contacts

- **DevOps**: Check PM2 logs and server status
- **Backend**: Review queue configurations
- **Security**: Audit access and keys

## Additional Resources

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Bull Board Documentation](https://github.com/felixmosh/bull-board)
- [Redis Best Practices](https://redis.io/topics/memory-optimization)
- [NestJS Bull Module](https://docs.nestjs.com/techniques/queues)
