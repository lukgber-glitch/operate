# E2E Tests - Operate Web

This directory contains end-to-end tests for the Operate business automation application using Playwright.

## Overview

The E2E test suite covers:

- **Authentication**: Login, logout, registration, password reset
- **Invoices**: Create, edit, send, PDF generation
- **Banking**: Account overview, transactions, categorization
- **Tax Filing**: ELSTER wizard, VAT returns, tax calendar
- **AI Chat**: Message sending, business queries, action triggers

## Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm playwright:install
```

### Run Tests

```bash
# Run all tests
pnpm test:e2e

# Run with UI mode (recommended for development)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run with debugger
pnpm test:e2e:debug

# Run specific browser
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit

# Run mobile tests
pnpm test:e2e:mobile

# View test report
pnpm test:e2e:report
```

### Run Specific Test Files

```bash
# Run auth tests only
pnpm test:e2e auth.spec.ts

# Run invoice tests
pnpm test:e2e invoices.spec.ts

# Run with grep pattern
pnpm test:e2e --grep "should login"
```

## Test Structure

```
e2e/
├── fixtures.ts          # Shared test fixtures and helpers
├── auth.spec.ts         # Authentication tests
├── invoices.spec.ts     # Invoice management tests
├── banking.spec.ts      # Banking and transaction tests
├── tax.spec.ts          # Tax filing tests
└── chat.spec.ts         # AI chat tests
```

## Configuration

Test configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `TEST_BASE_URL`)
- **Timeout**: 60 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit, Mobile
- **Screenshots**: On failure only
- **Videos**: Retained on failure

## Environment Variables

Create `.env.test` file:

```env
TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@operate.guru
TEST_USER_PASSWORD=TestPassword123!
```

## Test Fixtures

### authenticatedPage

Automatically logs in before test:

```typescript
test('should view dashboard', async ({ authenticatedPage }) => {
  const page = authenticatedPage;
  await page.goto('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### testUser

Provides test user credentials:

```typescript
test('should login', async ({ page, testUser }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.click('button[type="submit"]');
});
```

## Helper Functions

### waitForToast

```typescript
await waitForToast(page, 'success');
```

### fillForm

```typescript
await fillForm(page, {
  customerName: 'Test GmbH',
  customerEmail: 'test@example.com',
});
```

### selectOption

```typescript
await selectOption(page, '[data-testid="category-select"]', 'office_supplies');
```

### waitForLoadingComplete

```typescript
await waitForLoadingComplete(page);
```

## Best Practices

### 1. Use data-testid Attributes

```tsx
<button data-testid="create-invoice">Create Invoice</button>
```

```typescript
await page.click('[data-testid="create-invoice"]');
```

### 2. Wait for Network Idle

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Use Locators

```typescript
const submitButton = page.locator('button[type="submit"]');
await submitButton.click();
```

### 4. Handle Timeouts

```typescript
await page.waitForSelector('[data-testid="result"]', { timeout: 30000 });
```

### 5. Take Screenshots for Debugging

```typescript
await page.screenshot({ path: 'debug.png', fullPage: true });
```

## CI/CD Integration

Tests run automatically on:

- Pull requests to `main` or `master`
- Pushes to `main` or `master`
- Manual workflow dispatch

See `.github/workflows/e2e.yml` for configuration.

## Debugging

### UI Mode (Recommended)

```bash
pnpm test:e2e:ui
```

Benefits:
- Time travel debugging
- Watch mode
- Pick locators
- View trace

### Debug Mode

```bash
pnpm test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### View Trace

```bash
# Run test with trace
pnpm test:e2e --trace on

# Open trace viewer
npx playwright show-trace trace.zip
```

## Troubleshooting

### Tests Failing Locally

1. Ensure dev server is running: `pnpm dev`
2. Check database is seeded with test data
3. Verify environment variables are set
4. Clear browser state: `rm -rf test-results`

### Flaky Tests

1. Add explicit waits: `waitForLoadState('networkidle')`
2. Increase timeouts for slow operations
3. Use `waitForSelector` with visibility check
4. Avoid hardcoded delays with `waitForTimeout`

### Screenshots Not Captured

1. Check `playwright.config.ts` has `screenshot: 'only-on-failure'`
2. Ensure test fails (screenshots only on failure)
3. Check `test-results` directory

## Writing New Tests

### 1. Create Test File

```typescript
// e2e/feature.spec.ts
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/feature');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### 2. Add test-id Attributes

```tsx
// In your component
<div data-testid="feature-container">
  <button data-testid="submit-button">Submit</button>
</div>
```

### 3. Run Test

```bash
pnpm test:e2e feature.spec.ts
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)
