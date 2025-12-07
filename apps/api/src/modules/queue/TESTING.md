# Queue Monitor Testing Guide

Comprehensive testing guide for the Bull Board Queue Monitor.

## Local Testing

### Prerequisites

1. **Start Redis**
```bash
# On Windows with WSL
wsl -e sudo service redis-server start

# On macOS
brew services start redis

# Or via Docker
docker run -d -p 6379:6379 redis:alpine
```

2. **Set Environment Variables**

Create `.env.local` in `apps/api/`:
```env
QUEUE_ADMIN_KEY=test-admin-key-12345
BULL_BOARD_ENABLED=true
QUEUE_METRICS_ENABLED=true
QUEUE_FAILURE_THRESHOLD=100
```

3. **Start API in Development Mode**
```bash
cd apps/api
pnpm run dev
```

### Manual Testing

#### Test 1: Access Bull Board Dashboard

**URL:** `http://localhost:3000/admin/queues`

**Expected:**
- Should show authentication required error (401)

**Add Authentication:**

Option A - Using Browser Extension (ModHeader):
1. Install ModHeader extension
2. Add header: `X-Queue-Admin-Key: test-admin-key-12345`
3. Refresh page
4. Should see Bull Board dashboard

Option B - Using curl:
```bash
curl -H "X-Queue-Admin-Key: test-admin-key-12345" \
  http://localhost:3000/admin/queues
```

#### Test 2: Queue Health API

```bash
# Get all queue health
curl -H "X-Queue-Admin-Key: test-admin-key-12345" \
  http://localhost:3000/admin/queues/health

# Expected response:
# [
#   {
#     "name": "email-sync",
#     "waiting": 0,
#     "active": 0,
#     "completed": 0,
#     "failed": 0,
#     "delayed": 0,
#     "isPaused": false,
#     "paused": false
#   },
#   ...
# ]
```

#### Test 3: Queue Statistics

```bash
# Get stats for specific queue
curl -H "X-Queue-Admin-Key: test-admin-key-12345" \
  http://localhost:3000/admin/queues/email-sync/stats
```

#### Test 4: List All Queues

```bash
curl -H "X-Queue-Admin-Key: test-admin-key-12345" \
  http://localhost:3000/admin/queues/list

# Expected:
# {
#   "queues": [
#     "email-sync",
#     "bank-import",
#     "invoice-extraction",
#     ...
#   ]
# }
```

#### Test 5: Queue Management Operations

```bash
# Clean completed jobs
curl -X POST -H "X-Queue-Admin-Key: test-admin-key-12345" \
  "http://localhost:3000/admin/queues/email-sync/clean?status=completed&age=3600000"

# Pause queue
curl -X POST -H "X-Queue-Admin-Key: test-admin-key-12345" \
  http://localhost:3000/admin/queues/email-sync/pause

# Resume queue
curl -X POST -H "X-Queue-Admin-Key: test-admin-key-12345" \
  http://localhost:3000/admin/queues/email-sync/resume

# Retry failed jobs
curl -X POST -H "X-Queue-Admin-KEY: test-admin-key-12345" \
  http://localhost:3000/admin/queues/email-sync/retry-failed
```

#### Test 6: JWT Authentication

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Use JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/admin/queues/health
```

#### Test 7: Metrics Logging

Watch application logs for metrics (every 5 minutes):

```bash
# In development
tail -f apps/api/logs/application.log | grep queue_metrics

# Or check console output
```

Expected log format:
```json
{
  "type": "queue_metrics",
  "queue": "email-sync",
  "waiting": 0,
  "active": 0,
  "completed": 5,
  "failed": 0,
  "delayed": 0,
  "isPaused": false,
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

### Create Test Jobs

To properly test the queue monitor, create some test jobs:

#### Test Job Script

Create `test-queue.ts` in `apps/api/src/`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';

async function createTestJobs() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const emailQueue = app.get<Queue>(getQueueToken('email-sync'));

  // Add successful jobs
  for (let i = 0; i < 10; i++) {
    await emailQueue.add('test-job', {
      test: true,
      iteration: i,
    });
  }

  console.log('Added 10 test jobs to email-sync queue');

  await app.close();
}

createTestJobs().catch(console.error);
```

Run it:
```bash
ts-node apps/api/src/test-queue.ts
```

#### Simulate Failed Jobs

```typescript
// In test-queue.ts
await emailQueue.add('failing-job', {
  shouldFail: true,
}, {
  attempts: 1, // Don't retry
});
```

Then create a processor that fails:
```typescript
@Processor('email-sync')
export class TestProcessor {
  @Process('failing-job')
  async handleFailingJob(job: Job) {
    throw new Error('Intentional test failure');
  }
}
```

### Integration Testing

#### Jest Test Suite

Create `queue-health.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { QueueHealthController } from './queue-health.controller';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

describe('QueueHealthController', () => {
  let controller: QueueHealthController;
  let mockQueue: Partial<Queue>;

  beforeEach(async () => {
    mockQueue = {
      getWaitingCount: jest.fn().mockResolvedValue(5),
      getActiveCount: jest.fn().mockResolvedValue(2),
      getCompletedCount: jest.fn().mockResolvedValue(100),
      getFailedCount: jest.fn().mockResolvedValue(3),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      isPaused: jest.fn().mockResolvedValue(false),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      clean: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueHealthController],
      providers: [
        {
          provide: getQueueToken('email-sync'),
          useValue: mockQueue,
        },
        // Add other queues...
      ],
    }).compile();

    controller = module.get<QueueHealthController>(QueueHealthController);
  });

  it('should return queue health', async () => {
    const health = await controller.getQueueHealth();

    expect(health).toBeDefined();
    expect(health.length).toBeGreaterThan(0);
    expect(health[0]).toHaveProperty('name');
    expect(health[0]).toHaveProperty('waiting');
    expect(health[0]).toHaveProperty('active');
  });

  it('should pause a queue', async () => {
    const result = await controller.pauseQueue('email-sync');

    expect(result).toEqual({ paused: true });
    expect(mockQueue.pause).toHaveBeenCalled();
  });

  it('should resume a queue', async () => {
    const result = await controller.resumeQueue('email-sync');

    expect(result).toEqual({ resumed: true });
    expect(mockQueue.resume).toHaveBeenCalled();
  });
});
```

Run tests:
```bash
cd apps/api
pnpm test queue-health.controller.spec.ts
```

## Production Testing

### Smoke Tests

After deployment, run these smoke tests:

```bash
# Set your production admin key
ADMIN_KEY="your-production-key"
BASE_URL="https://operate.guru"

# Test 1: Health check
curl -H "X-Queue-Admin-Key: $ADMIN_KEY" \
  "$BASE_URL/admin/queues/health"

# Test 2: List queues
curl -H "X-Queue-Admin-Key: $ADMIN_KEY" \
  "$BASE_URL/admin/queues/list"

# Test 3: Queue stats
curl -H "X-Queue-Admin-Key: $ADMIN_KEY" \
  "$BASE_URL/admin/queues/email-sync/stats"

# Test 4: Dashboard access
curl -I -H "X-Queue-Admin-Key: $ADMIN_KEY" \
  "$BASE_URL/admin/queues"
```

### Load Testing

Test queue performance under load:

```bash
# Install artillery (load testing tool)
npm install -g artillery

# Create test-queue.yml
cat > test-queue.yml <<EOF
config:
  target: "https://operate.guru"
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      X-Queue-Admin-Key: "your-key"
scenarios:
  - flow:
      - get:
          url: "/admin/queues/health"
      - get:
          url: "/admin/queues/list"
EOF

# Run load test
artillery run test-queue.yml
```

### Monitoring Validation

1. **Check Metrics Collection**
```bash
ssh cloudways
pm2 logs operate-api --lines 200 | grep queue_metrics
```

2. **Verify Alerts**

Create conditions that trigger alerts:
- Add 101+ failing jobs to trigger failure alert
- Pause queue with waiting jobs

Check logs for alert messages.

3. **Dashboard Functionality**

Test in production Bull Board:
- View all queues
- Click on individual jobs
- Retry failed jobs
- Clean completed jobs
- Pause/resume queues

## Performance Testing

### Redis Performance

```bash
# Connect to Redis
redis-cli

# Check queue keys
KEYS *bull*

# Check memory usage
INFO memory

# Check queue sizes
LLEN bull:email-sync:wait
LLEN bull:email-sync:active
LLEN bull:email-sync:completed
LLEN bull:email-sync:failed
```

### API Response Times

Use Apache Bench:
```bash
# Test health endpoint
ab -n 100 -c 10 \
  -H "X-Queue-Admin-Key: test-key" \
  http://localhost:3000/admin/queues/health

# Expected: < 100ms average response time
```

## Security Testing

### Authentication Tests

```bash
# Test 1: No authentication (should fail)
curl -I http://localhost:3000/admin/queues/health
# Expected: 401 Unauthorized

# Test 2: Wrong admin key (should fail)
curl -I -H "X-Queue-Admin-Key: wrong-key" \
  http://localhost:3000/admin/queues/health
# Expected: 401 Unauthorized

# Test 3: Invalid JWT (should fail)
curl -I -H "Authorization: Bearer invalid-token" \
  http://localhost:3000/admin/queues/health
# Expected: 401 Unauthorized

# Test 4: Valid admin key (should succeed)
curl -I -H "X-Queue-Admin-Key: test-admin-key-12345" \
  http://localhost:3000/admin/queues/health
# Expected: 200 OK
```

### Authorization Tests

```bash
# Test with regular user JWT (should fail)
# Login as regular user
USER_TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.access_token')

# Try to access queue health
curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:3000/admin/queues/health
# Expected: 403 Forbidden (or 401 if role check in JWT validation)
```

## Troubleshooting Tests

### Issue: Queue Not Found

```bash
# List all registered queues
curl -H "X-Queue-Admin-Key: test-key" \
  http://localhost:3000/admin/queues/list

# Try to access non-existent queue
curl -H "X-Queue-Admin-Key: test-key" \
  http://localhost:3000/admin/queues/non-existent/stats
# Expected: 404 Not Found
```

### Issue: Redis Connection

```bash
# Check Redis connectivity
redis-cli ping
# Expected: PONG

# Check API can connect to Redis
curl http://localhost:3000/api/v1/health
```

### Issue: High Memory Usage

```bash
# Check Redis memory
redis-cli INFO memory | grep used_memory_human

# Clean old jobs
curl -X POST -H "X-Queue-Admin-Key: test-key" \
  "http://localhost:3000/admin/queues/email-sync/clean?age=3600000"
```

## Test Checklist

Before marking as complete:

- [ ] Dependencies installed successfully
- [ ] All TypeScript files compile without errors
- [ ] Bull Board dashboard accessible
- [ ] Authentication working (admin key)
- [ ] Authentication working (JWT)
- [ ] Queue health API returns data
- [ ] Queue list API works
- [ ] Queue stats API works
- [ ] Pause queue works
- [ ] Resume queue works
- [ ] Clean jobs works
- [ ] Retry failed jobs works
- [ ] Metrics logging every 5 minutes
- [ ] Alerts triggered for high failures
- [ ] All queues visible in dashboard
- [ ] Individual job details viewable
- [ ] Environment variables documented
- [ ] README documentation complete
- [ ] Deployment guide complete

## Continuous Testing

Add to CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Test Queue Monitor
  run: |
    npm run test -- queue-health.controller.spec.ts
    npm run test -- queue-metrics.service.spec.ts
```

## Success Criteria

The queue monitor is working correctly if:

1. ✅ Bull Board dashboard loads and shows all queues
2. ✅ Authentication prevents unauthorized access
3. ✅ All REST API endpoints respond correctly
4. ✅ Metrics are logged every 5 minutes
5. ✅ Alerts trigger for failure thresholds
6. ✅ Queue management operations work (pause/resume/clean/retry)
7. ✅ Performance is acceptable (< 100ms for health endpoint)
8. ✅ No memory leaks or Redis connection issues

## Support

If tests fail:
1. Check application logs: `pm2 logs operate-api`
2. Check Redis: `redis-cli ping`
3. Verify environment variables
4. Review authentication configuration
5. Check queue registrations in modules
