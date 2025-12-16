# Test Authentication for E2E Testing

This feature allows automated tests to bypass the Google OAuth flow for faster and more reliable E2E testing.

## Security

- **Only available in development/test environments** - Completely disabled when `NODE_ENV=production`
- **Requires secret key** - Must match `TEST_AUTH_SECRET` environment variable
- **All attempts are logged** - Security monitoring for unauthorized access attempts

## Setup

1. Add `TEST_AUTH_SECRET` to your `.env` file:

```bash
# .env (development/test only)
TEST_AUTH_SECRET=your-secure-test-secret-here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

2. **CRITICAL**: Do NOT set this in production environments!

## Usage in E2E Tests

### JavaScript/TypeScript Example

```javascript
// Before running protected route tests
const response = await fetch('http://localhost:3001/api/v1/auth/test-login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    testSecret: process.env.TEST_AUTH_SECRET
  }),
  credentials: 'include' // Important: Include cookies
});

const data = await response.json();

// Cookies are automatically set (access_token, refresh_token, onboarding_complete)
// Now you can access protected routes
```

### Playwright Example

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Authenticate before each test
  await page.goto('http://localhost:3000');

  const response = await page.request.post('http://localhost:3001/api/v1/auth/test-login', {
    data: {
      email: 'test@example.com',
      testSecret: process.env.TEST_AUTH_SECRET
    }
  });

  expect(response.ok()).toBeTruthy();

  // Store cookies in browser context
  const cookies = await response.headersArray();
  // Cookies are automatically handled by Playwright
});

test('should access protected route', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  // Should not redirect to /onboarding
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
});
```

### Cypress Example

```javascript
// cypress/support/commands.js
Cypress.Commands.add('testLogin', (email = 'test@example.com') => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3001/api/v1/auth/test-login',
    body: {
      email,
      testSecret: Cypress.env('TEST_AUTH_SECRET')
    }
  });
});

// In your test
describe('Protected Routes', () => {
  beforeEach(() => {
    cy.testLogin();
  });

  it('should access dashboard', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });
});
```

## API Endpoint

**POST** `/api/v1/auth/test-login`

### Request Body

```json
{
  "email": "test@example.com",
  "testSecret": "your-secret-from-env"
}
```

### Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "requiresMfa": false,
  "message": "Test login successful"
}
```

### Response Headers

Sets HTTP-only cookies:
- `access_token` - JWT access token (15 min expiry)
- `refresh_token` - JWT refresh token (7 day expiry)
- `onboarding_complete=true` - Allows access to protected routes

### Error Responses

**401 Unauthorized** - Invalid secret or production environment:
```json
{
  "statusCode": 401,
  "message": "Invalid test secret"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "statusCode": 429,
  "message": "Too many requests"
}
```

## User Creation

The test login endpoint will:
1. **Find existing user** by email if one exists
2. **Create new user** if not found, with:
   - Email from request
   - First name: "Test"
   - Last name: "User"
   - Auto-created organization (owner role)
   - Onboarding marked as complete

This means you can use any email address, and a test user will be created on-demand.

## Rate Limiting

- **10 requests per minute** per IP address
- This is more lenient than normal auth endpoints (5/min) to support test suites

## Logs

All test authentication attempts are logged:

```
[AuthService] WARN TEST AUTH: Creating test session for test@example.com in development environment
[AuthService] LOG Creating test user: test@example.com
[AuthService] LOG Test user created: usr_123 with organisation: org_456
[AuthService] LOG Test session created for user: usr_123
```

Production attempts are blocked and logged as errors:
```
[AuthService] ERROR TEST AUTH ATTEMPTED IN PRODUCTION - BLOCKED
```

## Cleanup

Test users are regular users in the database. To clean up after tests:

```sql
-- Delete test users (be careful!)
DELETE FROM "User" WHERE email LIKE '%@example.com';
```

Or use a dedicated test database that's reset between test runs.
