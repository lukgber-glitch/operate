# Row-Level Security (RLS) Testing Guide

## Overview

This document describes the testing strategy for Row-Level Security (RLS) in the Operate/CoachOS database package.

## Test Coverage

### Unit Tests (`src/rls.test.ts`)

The RLS test suite covers the following areas:

#### 1. RLS Helper Functions
- ✅ Setting tenant context
- ✅ Clearing tenant context
- ✅ Getting current tenant context
- ✅ Enabling RLS bypass
- ✅ Disabling RLS bypass
- ✅ Checking bypass status
- ✅ Context restoration with `withTenantContext`
- ✅ Bypass restoration with `withRlsBypass`

#### 2. Tenant Isolation for Membership Table
- ✅ Only returns memberships for current organization
- ✅ Context switching between organizations
- ✅ Blocks access without tenant context
- ✅ Allows access with bypass enabled
- ✅ Prevents cross-tenant access via `findUnique`

#### 3. Tenant Isolation for AuditLog Table
- ✅ Only returns audit logs for current organization
- ✅ Context switching between organizations
- ✅ Blocks access without tenant context
- ✅ Allows access with bypass enabled

#### 4. Write Operations
- ✅ Creating records for current organization
- ✅ Blocks updates to other organizations' data
- ✅ Blocks deletes to other organizations' data

#### 5. Transaction Support
- ✅ Preserves tenant context within transactions
- ✅ Multiple operations in single transaction

#### 6. Non-Tenant Tables
- ✅ User table accessible without tenant context
- ✅ Organisation table accessible without tenant context

#### 7. Edge Cases
- ✅ Rapid context switching
- ✅ Nested `withTenantContext` calls
- ✅ Context with bypass enabled
- ✅ Error handling and context restoration

## Running Tests

### Prerequisites

1. **Database Setup**: Ensure PostgreSQL is running and accessible
2. **Environment Variables**: Set `DATABASE_URL` in `.env` file
3. **Migrations**: Apply all migrations including RLS policies

```bash
# Set up environment
cp .env.example .env
# Edit .env and set DATABASE_URL

# Apply migrations
npm run db:migrate:deploy
```

### Running the Test Suite

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode (development)
npm test -- --watch

# Run specific test file
npm test -- rls.test.ts

# Run with verbose output
npm test -- --verbose
```

### Expected Output

When all tests pass, you should see output similar to:

```
PASS  src/rls.test.ts
  RLS Helper Functions
    Tenant Context Management
      ✓ should set tenant context
      ✓ should clear tenant context
      ✓ should get null when no context is set
      ✓ should update tenant context
    RLS Bypass Management
      ✓ should enable RLS bypass
      ✓ should disable RLS bypass
      ✓ should return false when bypass not set
    withTenantContext
      ✓ should execute callback with tenant context
      ✓ should restore previous context after callback
      ✓ should restore null context if none was set
      ✓ should restore context even if callback throws
      ✓ should return callback result
    withRlsBypass
      ✓ should execute callback with bypass enabled
      ✓ should restore bypass state after callback
      ✓ should preserve bypass if already enabled
      ✓ should restore bypass state even if callback throws
      ✓ should return callback result
    Edge Cases
      ✓ should handle rapid context switching
      ✓ should handle nested withTenantContext calls
      ✓ should handle context with bypass enabled
  RLS Tenant Isolation
    Membership Isolation
      ✓ should only return memberships for current org
      ✓ should switch context between orgs
      ✓ should block access without tenant context
      ✓ should allow access with bypass enabled
      ✓ should prevent cross-tenant access via findUnique
    AuditLog Isolation
      ✓ should only return audit logs for current org
      ✓ should switch context between orgs for audit logs
      ✓ should block audit log access without context
      ✓ should allow audit log access with bypass
    Write Operations
      ✓ should only allow creating memberships for current org
      ✓ should block updates to other orgs data
      ✓ should block deletes to other orgs data
    Transaction Support
      ✓ should preserve tenant context in transactions
    Non-Tenant Tables
      ✓ should allow access to User table without tenant context
      ✓ should allow access to Organisation table without tenant context

Test Suites: 1 passed, 1 total
Tests:       33 passed, 33 total
```

## Manual Testing

### 1. Test RLS Policies in SQL

Connect to your database and run these queries:

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('Membership', 'AuditLog');

-- Expected: Both tables should have rowsecurity = true

-- View active policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('Membership', 'AuditLog');

-- Expected: Should show membership_tenant_isolation and auditlog_tenant_isolation policies
```

### 2. Test Tenant Context

```sql
-- Set tenant context
SELECT set_config('app.current_org_id', 'your-org-uuid-here', true);

-- Query memberships (should only see current org's data)
SELECT * FROM "Membership";

-- Clear context
SELECT set_config('app.current_org_id', NULL, true);

-- Query memberships (should see no data - blocked by RLS)
SELECT * FROM "Membership";
```

### 3. Test RLS Bypass

```sql
-- Enable bypass
SELECT set_config('app.bypass_rls', 'true', true);

-- Query memberships (should see all organizations' data)
SELECT * FROM "Membership";

-- Disable bypass
SELECT set_config('app.bypass_rls', 'false', true);

-- Query memberships (should see no data without context)
SELECT * FROM "Membership";
```

## Integration Testing

### Testing with NestJS Application

When testing RLS with your NestJS API:

1. **Request Middleware**: Ensure tenant context is set in request middleware
2. **Service Tests**: Mock tenant context in service-level tests
3. **E2E Tests**: Test full request lifecycle with proper authentication

Example E2E test:

```typescript
describe('Membership API (e2e)', () => {
  it('should only return memberships for authenticated user org', async () => {
    // Login as user from org1
    const token = await loginUser('user1@org1.com', 'password');

    const response = await request(app.getHttpServer())
      .get('/api/memberships')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Should only see org1's memberships
    expect(response.body.every(m => m.orgId === 'org1-uuid')).toBe(true);
  });

  it('should block access without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/memberships')
      .expect(401);
  });
});
```

## Performance Testing

### Benchmarking RLS Impact

Test the performance impact of RLS policies:

```typescript
import { performance } from 'perf_hooks';

async function benchmarkRls() {
  const iterations = 1000;

  // Benchmark WITH RLS context
  await setTenantContext(prisma, 'org-test-uuid');
  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    await prisma.membership.findMany();
  }
  const withRlsTime = performance.now() - start1;

  // Benchmark WITH bypass (baseline)
  await enableRlsBypass(prisma);
  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    await prisma.membership.findMany();
  }
  const withoutRlsTime = performance.now() - start2;

  console.log(`With RLS: ${withRlsTime}ms`);
  console.log(`With Bypass: ${withoutRlsTime}ms`);
  console.log(`Overhead: ${((withRlsTime / withoutRlsTime - 1) * 100).toFixed(2)}%`);
}
```

Expected overhead: < 5% (RLS is implemented at database level, very efficient)

## Security Testing

### 1. Cross-Tenant Access Prevention

Test that users cannot access other organizations' data:

```typescript
it('should prevent cross-tenant data access', async () => {
  // User1 from Org1 tries to access Org2's membership
  await setTenantContext(prisma, org1Id);

  // Get a membership ID from Org2
  let org2MembershipId: string;
  await withRlsBypass(prisma, async () => {
    const membership = await prisma.membership.findFirst({
      where: { orgId: org2Id },
    });
    org2MembershipId = membership!.id;
  });

  // Try to access it from Org1 context
  const result = await prisma.membership.findUnique({
    where: { id: org2MembershipId },
  });

  // Should return null (blocked by RLS)
  expect(result).toBeNull();
});
```

### 2. Bypass Authorization

Test that bypass mode is properly controlled:

```typescript
it('should require authorization for bypass mode', async () => {
  // In production, bypass should only be available to system roles
  // This should be tested at application level

  // Example: Service method that checks permissions
  async function getAdminStats(user: User) {
    if (user.role !== 'SYSTEM_ADMIN') {
      throw new ForbiddenException('Bypass not allowed');
    }

    return await withRlsBypass(prisma, async () => {
      return {
        totalOrgs: await prisma.organisation.count(),
        totalMembers: await prisma.membership.count(),
      };
    });
  }
});
```

## Continuous Integration

### CI/CD Pipeline Configuration

Add RLS tests to your CI pipeline:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: operate_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Apply migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/operate_test
        run: |
          cd packages/database
          npx prisma migrate deploy

      - name: Run RLS tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/operate_test
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Troubleshooting Test Failures

### Common Issues

1. **Connection Errors**
   - Verify `DATABASE_URL` is set correctly
   - Ensure PostgreSQL is running
   - Check network connectivity

2. **Migration Errors**
   - Run `npm run db:migrate:deploy` before tests
   - Ensure database user has necessary permissions

3. **RLS Not Working**
   - Verify policies are created: Check `pg_policies` view
   - Ensure RLS is enabled: Check `pg_tables.rowsecurity`
   - Check PostgreSQL version (RLS requires 9.5+)

4. **Flaky Tests**
   - Ensure proper cleanup in `afterAll` hooks
   - Use unique test data identifiers
   - Increase test timeout if needed

5. **Context Not Persisting**
   - Remember context is transaction-scoped
   - Use `SET LOCAL` (already done in helper functions)
   - Check that middleware is registered

## Test Data Management

### Setup and Teardown

The test suite follows these practices:

1. **beforeAll**: Create test organizations, users, and initial data
2. **beforeEach**: Clear tenant context and bypass settings
3. **afterEach**: Clean up any test-specific data
4. **afterAll**: Remove all test data

### Isolation

Each test is isolated to prevent interference:
- Context is cleared before each test
- Bypass is disabled before each test
- Unique identifiers for test data

## Coverage Goals

Target coverage metrics:

- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: > 95%
- **Statement Coverage**: > 90%

Run coverage report:
```bash
npm test -- --coverage
```

## References

- [Jest Documentation](https://jestjs.io/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
