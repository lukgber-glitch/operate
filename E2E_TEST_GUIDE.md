# E2E Test Suite Guide - Operate

Comprehensive end-to-end testing guide for the Operate business automation platform.

## Overview

The E2E test suite provides comprehensive coverage of critical user flows:

### Web Tests (Playwright)
- **Authentication**: Login, logout, OAuth, session management
- **Invoices**: Create, edit, send, PDF generation, payment tracking
- **Banking**: Account connection, transaction sync, categorization
- **Tax Filing**: ELSTER wizard, VAT returns, tax calendar
- **AI Chat**: Natural language queries, action triggers, business insights

### API Tests (Jest + Supertest)
- **Authentication API**: Login, register, token management
- **Invoice API**: CRUD operations, calculations, PDF generation
- **Banking API**: Account management, transaction processing, reconciliation

## Quick Start

### 1. Installation

```bash
# Install all dependencies
pnpm install

# Install Playwright browsers
cd apps/web
pnpm playwright:install
```

### 2. Setup Test Environment

Create `.env.test` in project root:

```env
# Database
DATABASE_URL=postgresql://operate:operate_test@localhost:5432/operate_test

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=test-jwt-secret-for-e2e
NEXTAUTH_SECRET=test-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Test User
TEST_USER_EMAIL=test@operate.guru
TEST_USER_PASSWORD=TestPassword123!

# Test Base URL
TEST_BASE_URL=http://localhost:3000

# Mock External Services (optional)
MOCK_EXTERNAL_SERVICES=true
```

### 3. Setup Test Database

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
cd packages/database
pnpm prisma migrate deploy

# Seed test data
pnpm prisma db seed
```

### 4. Run Tests

```bash
# Web E2E tests
cd apps/web
pnpm test:e2e

# API E2E tests
cd apps/api
pnpm test:e2e

# All tests from root
pnpm test:e2e
```

## Web E2E Tests (Playwright)

### Location
`apps/web/e2e/`

### Test Files

| File | Coverage | Test Count |
|------|----------|------------|
| `auth.spec.ts` | Authentication flows | 15+ tests |
| `invoices.spec.ts` | Invoice management | 20+ tests |
| `banking.spec.ts` | Banking operations | 18+ tests |
| `tax.spec.ts` | Tax filing | 16+ tests |
| `chat.spec.ts` | AI chat interface | 14+ tests |
| `fixtures.ts` | Shared test utilities | N/A |

### Running Web Tests

```bash
cd apps/web

# All tests
pnpm test:e2e

# UI mode (recommended for development)
pnpm test:e2e:ui

# Specific browser
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit

# Mobile tests
pnpm test:e2e:mobile

# Debug mode
pnpm test:e2e:debug

# Specific test file
pnpm test:e2e auth.spec.ts

# Specific test
pnpm test:e2e --grep "should login"
```

### Test Fixtures

#### authenticatedPage
Pre-authenticated browser page:

```typescript
test('should view dashboard', async ({ authenticatedPage }) => {
  const page = authenticatedPage;
  await page.goto('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

#### testUser
Test user credentials:

```typescript
test('should login', async ({ page, testUser }) => {
  await page.fill('[name="email"]', testUser.email);
  await page.fill('[name="password"]', testUser.password);
});
```

### Helper Functions

```typescript
// Wait for toast notification
await waitForToast(page, 'success');

// Fill form fields
await fillForm(page, { customerName: 'Test', customerEmail: 'test@example.com' });

// Select dropdown option
await selectOption(page, '[data-testid="category"]', 'office_supplies');

// Wait for loading to complete
await waitForLoadingComplete(page);

// Wait for API response
await waitForApiResponse(page, '/api/invoices');
```

## API E2E Tests (Jest)

### Location
`apps/api/test/integration/`

### Test Files

| File | Coverage | Test Count |
|------|----------|------------|
| `auth.e2e-spec.ts` | Authentication API | 15+ tests |
| `invoices.e2e-spec.ts` | Invoice API | 18+ tests |
| `banking.e2e-spec.ts` | Banking API | 20+ tests |

### Running API Tests

```bash
cd apps/api

# All E2E tests
pnpm test:e2e

# With coverage
pnpm test:e2e --coverage

# Specific file
pnpm test:e2e auth.e2e-spec

# Watch mode
pnpm test:e2e --watch
```

### API Test Structure

```typescript
describe('Resource API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Setup app and authenticate
  });

  afterAll(async () => {
    await app.close();
  });

  it('/resource (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/resource')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

File: `.github/workflows/e2e.yml`

Runs on:
- Push to `main`/`master`
- Pull requests
- Manual dispatch

### Workflow Jobs

1. **e2e-web**: Playwright tests across browsers
2. **e2e-api**: API integration tests
3. **merge-reports**: Combine test results
4. **notify**: Notify on failures

### Test Artifacts

Automatically uploaded on failure:
- Playwright HTML report
- Screenshots
- Videos
- Test results (JUnit XML)

### Viewing CI Results

1. Go to GitHub Actions tab
2. Select E2E Tests workflow
3. Click on specific run
4. Download artifacts from summary

## Test Data Management

### Creating Test Data

```typescript
// In test file
const testInvoice = await createTestInvoice({
  customerId: 'test-customer',
  items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
});
```

### Cleanup

```typescript
// Cleanup after test
afterEach(async () => {
  await cleanupTestData();
});
```

### Database Seeding

```bash
# Seed test database
cd packages/database
pnpm prisma db seed -- --environment=test
```

## Best Practices

### 1. Use Data-TestId Attributes

```tsx
// Component
<button data-testid="create-invoice">Create</button>

// Test
await page.click('[data-testid="create-invoice"]');
```

### 2. Wait for Network Idle

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Handle Async Operations

```typescript
await page.waitForSelector('[data-testid="result"]');
await expect(page.locator('[data-testid="result"]')).toBeVisible();
```

### 4. Avoid Hardcoded Waits

```typescript
// Bad
await page.waitForTimeout(5000);

// Good
await page.waitForSelector('[data-testid="loaded"]');
```

### 5. Test User Flows, Not Implementation

```typescript
// Good - tests user flow
test('should create invoice', async ({ authenticatedPage }) => {
  await page.goto('/invoices');
  await page.click('[data-testid="create-invoice"]');
  await fillForm(page, { customerName: 'Test' });
  await page.click('[data-testid="save"]');
  await expect(page.locator('.toast-success')).toBeVisible();
});

// Bad - tests implementation details
test('should call createInvoice API', async () => {
  // Testing API call directly
});
```

### 6. Keep Tests Independent

```typescript
// Each test should be able to run independently
test('test 1', async ({ authenticatedPage }) => {
  // Create own test data
  // Don't rely on other tests
});

test('test 2', async ({ authenticatedPage }) => {
  // Independent from test 1
});
```

## Debugging

### Playwright UI Mode

```bash
pnpm test:e2e:ui
```

Features:
- Time travel debugging
- Step through tests
- Pick locators
- View trace
- Watch mode

### Playwright Inspector

```bash
pnpm test:e2e:debug
```

Opens debugger with:
- Step through execution
- Pause on failure
- Console access

### Screenshots

Automatically captured on failure:

```bash
# View screenshots
ls test-results/*/screenshots/
```

Manual screenshots:

```typescript
await page.screenshot({ path: 'debug.png', fullPage: true });
```

### Traces

```bash
# Run with trace
pnpm test:e2e --trace on

# View trace
npx playwright show-trace trace.zip
```

### API Test Debugging

```bash
# Run with verbose output
DEBUG=supertest pnpm test:e2e

# Single test
pnpm test:e2e -t "should login"
```

## Troubleshooting

### Tests Failing Locally

**Issue**: Tests pass in CI but fail locally

**Solutions**:
1. Ensure services are running: `docker-compose up -d`
2. Check environment variables: `cat .env.test`
3. Verify database is seeded: `pnpm prisma db seed`
4. Clear browser cache: `rm -rf test-results`

### Flaky Tests

**Issue**: Tests pass/fail intermittently

**Solutions**:
1. Add explicit waits: `waitForLoadState('networkidle')`
2. Increase timeouts for slow operations
3. Use retry logic for flaky selectors
4. Check for race conditions

### Timeout Errors

**Issue**: Tests timeout waiting for elements

**Solutions**:
1. Increase timeout: `{ timeout: 30000 }`
2. Check element selector is correct
3. Verify element becomes visible
4. Check network requests complete

### Authentication Issues

**Issue**: Tests fail with authentication errors

**Solutions**:
1. Verify test user exists in database
2. Check credentials in `.env.test`
3. Ensure JWT secret matches
4. Clear cookies: `await context.clearCookies()`

## Performance

### Test Execution Time

- Web E2E: ~15-20 minutes (all browsers)
- API E2E: ~5-10 minutes
- Total: ~25-30 minutes

### Optimization Tips

1. Run tests in parallel (default in Playwright)
2. Use `--workers` flag to control parallelism
3. Skip slow tests in development: `.only` / `.skip`
4. Use fixtures for expensive setup
5. Mock external services

## Reporting

### HTML Report

```bash
# Generate and open report
pnpm test:e2e:report
```

### JUnit XML

Generated automatically at: `test-results/junit.xml`

### Coverage Report

```bash
# API tests with coverage
cd apps/api
pnpm test:e2e --coverage

# View coverage
open coverage/e2e/lcov-report/index.html
```

## Adding New Tests

### 1. Create Test File

```typescript
// apps/web/e2e/feature.spec.ts
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/feature');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### 2. Add Data-TestId Attributes

```tsx
// In component
<div data-testid="feature-container">
  <button data-testid="action-button">Action</button>
</div>
```

### 3. Run New Test

```bash
pnpm test:e2e feature.spec.ts
```

### 4. Update Documentation

Add test coverage to this guide.

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Guide](https://github.com/visionmedia/supertest)

## Support

For issues or questions:
1. Check troubleshooting section
2. Review test logs
3. Check CI/CD workflow logs
4. Create issue with test output
