# TenantGuard Integration Test Plan

## Security Fix S1-02: Tenant Isolation Enforcement

### Overview
The TenantGuard middleware has been implemented to prevent cross-tenant data access vulnerabilities. This document outlines manual and automated testing procedures.

### Implementation Summary

**Files Created:**
- `apps/api/src/common/guards/tenant.guard.ts` - Main guard implementation
- `apps/api/src/common/decorators/skip-tenant.decorator.ts` - Decorator to bypass tenant checks
- `apps/api/src/common/guards/index.ts` - Guard exports
- `apps/api/src/common/decorators/index.ts` - Decorator exports

**Files Modified:**
- `apps/api/src/app.module.ts` - Registered TenantGuard as global APP_GUARD

### Test Scenarios

#### Test 1: Public Routes (Should Allow)
**Setup:**
- Route decorated with `@Public()`
- No authentication required

**Test:**
```bash
curl -X GET http://localhost:3000/api/health
```

**Expected Result:**
- ✅ Status: 200 OK
- ✅ No authentication required
- ✅ TenantGuard bypassed

---

#### Test 2: Authenticated User with Valid orgId (Should Allow)
**Setup:**
- User authenticated via JWT
- JWT contains orgId: "org1"
- No organizationId in request params/body/query

**Test:**
```bash
# 1. Login to get access token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. Use token to access protected route
curl -X GET http://localhost:3000/api/v1/invoices \
  -H "Authorization: Bearer <access_token>"
```

**Expected Result:**
- ✅ Status: 200 OK
- ✅ User can access their organization's data
- ✅ Request object has `req.orgId` injected

**Validation:**
- Check server logs for: `TenantGuard: Access granted for <email> to org <orgId>`

---

#### Test 3: Cross-Tenant Access via Query Parameter (Should Block)
**Setup:**
- User authenticated with orgId: "org1"
- Request includes query parameter: `?organizationId=org2`

**Test:**
```bash
curl -X GET "http://localhost:3000/api/v1/invoices?organizationId=org2" \
  -H "Authorization: Bearer <access_token>"
```

**Expected Result:**
- ❌ Status: 403 Forbidden
- ❌ Error message: "Cross-tenant access denied. You can only access data from your own organization."

**Validation:**
- Check server logs for: `TenantGuard: Cross-tenant access attempt by <email> - User org: org1, Requested org (query): org2`

---

#### Test 4: Cross-Tenant Access via Body (Should Block)
**Setup:**
- User authenticated with orgId: "org1"
- POST request with body: `{"organizationId":"org2"}`

**Test:**
```bash
curl -X POST http://localhost:3000/api/v1/invoices \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"org2","amount":100}'
```

**Expected Result:**
- ❌ Status: 403 Forbidden
- ❌ Error message: "Cross-tenant access denied. You can only access data from your own organization."

**Validation:**
- Check server logs for: `TenantGuard: Cross-tenant access attempt by <email> - User org: org1, Requested org (body): org2`

---

#### Test 5: Cross-Tenant Access via URL Params (Should Block)
**Setup:**
- User authenticated with orgId: "org1"
- URL contains param: `/organizations/org2/invoices`

**Test:**
```bash
curl -X GET http://localhost:3000/api/v1/organizations/org2/invoices \
  -H "Authorization: Bearer <access_token>"
```

**Expected Result:**
- ❌ Status: 403 Forbidden
- ❌ Error message: "Cross-tenant access denied. You can only access data from your own organization."

**Validation:**
- Check server logs for: `TenantGuard: Cross-tenant access attempt by <email> - User org: org1, Requested org (params): org2`

---

#### Test 6: User Without organizationId in Token (Should Block)
**Setup:**
- User authenticated but JWT missing orgId field
- This can happen if user hasn't completed onboarding

**Test:**
```bash
# Requires manual JWT token creation without orgId field
curl -X GET http://localhost:3000/api/v1/invoices \
  -H "Authorization: Bearer <token_without_orgId>"
```

**Expected Result:**
- ❌ Status: 403 Forbidden
- ❌ Error message: "Organization context required. Please ensure you are logged in to an organization."

**Validation:**
- Check server logs for: `TenantGuard: User <email> has no organizationId in token`

---

#### Test 7: Admin Route with @SkipTenant() (Should Allow)
**Setup:**
- Route decorated with `@SkipTenant()` and `@RequireRole(Role.SUPER_ADMIN)`
- User is SUPER_ADMIN with orgId: "org1"
- Request accesses data across all organizations

**Test:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/organizations \
  -H "Authorization: Bearer <super_admin_token>"
```

**Expected Result:**
- ✅ Status: 200 OK
- ✅ Returns data from all organizations
- ✅ TenantGuard check skipped

**Validation:**
- Check server logs for: `Skipping tenant check for admin route`

---

#### Test 8: Matching organizationId in Request (Should Allow)
**Setup:**
- User authenticated with orgId: "org1"
- Request includes `?organizationId=org1` (matches user's org)

**Test:**
```bash
curl -X GET "http://localhost:3000/api/v1/invoices?organizationId=org1" \
  -H "Authorization: Bearer <access_token>"
```

**Expected Result:**
- ✅ Status: 200 OK
- ✅ User can access their own organization's data
- ✅ No cross-tenant violation

---

### Automated Test Script

```javascript
// test-tenant-guard.js
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function runTests() {
  console.log('🔐 TenantGuard Integration Tests\n');

  // Test 1: Login as user in org1
  console.log('Test 1: Login as user in org1');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'user@org1.com',
    password: 'password123'
  });
  const token1 = loginRes.data.accessToken;
  const orgId1 = parseJwt(token1).orgId;
  console.log(`✅ Logged in. User orgId: ${orgId1}\n`);

  // Test 2: Access own organization's data (should succeed)
  console.log('Test 2: Access own organization data');
  try {
    const res = await axios.get(`${API_BASE}/invoices`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log(`✅ Status: ${res.status} - Access granted to own org data\n`);
  } catch (err) {
    console.error(`❌ Failed: ${err.response?.data?.message}\n`);
  }

  // Test 3: Try to access another org's data via query (should fail)
  console.log('Test 3: Cross-tenant access via query parameter');
  try {
    await axios.get(`${API_BASE}/invoices?organizationId=org2`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.error('❌ SECURITY ISSUE: Cross-tenant access allowed!\n');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log(`✅ Blocked: ${err.response.data.message}\n`);
    } else {
      console.error(`❌ Unexpected error: ${err.message}\n`);
    }
  }

  // Test 4: Try to create resource in another org via body (should fail)
  console.log('Test 4: Cross-tenant access via request body');
  try {
    await axios.post(`${API_BASE}/invoices`, {
      organizationId: 'org2',
      amount: 1000
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.error('❌ SECURITY ISSUE: Cross-tenant write allowed!\n');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log(`✅ Blocked: ${err.response.data.message}\n`);
    } else {
      console.error(`❌ Unexpected error: ${err.message}\n`);
    }
  }

  // Test 5: Access with matching orgId in query (should succeed)
  console.log('Test 5: Access with matching organizationId in query');
  try {
    const res = await axios.get(`${API_BASE}/invoices?organizationId=${orgId1}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log(`✅ Status: ${res.status} - Access granted with matching orgId\n`);
  } catch (err) {
    console.error(`❌ Failed: ${err.response?.data?.message}\n`);
  }

  console.log('🎉 All tests completed!');
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

runTests().catch(console.error);
```

---

### Security Checklist

- [ ] TenantGuard registered as global APP_GUARD
- [ ] Public routes bypass tenant check
- [ ] Authenticated users must have orgId in JWT
- [ ] Cross-tenant access blocked in query parameters
- [ ] Cross-tenant access blocked in request body
- [ ] Cross-tenant access blocked in URL parameters
- [ ] Admin routes can use @SkipTenant() with proper authorization
- [ ] Request object has orgId injected for service layer
- [ ] All access attempts logged for security auditing

---

### Production Deployment Notes

1. **Guard Order**: TenantGuard runs AFTER JwtAuthGuard (authentication must happen first)
2. **Logging**: All cross-tenant access attempts are logged with WARN level
3. **Performance**: Guard is lightweight - only validates organizationId strings
4. **Database Queries**: Services should STILL filter by orgId (defense in depth)
5. **Monitoring**: Set up alerts for repeated cross-tenant access attempts

---

### Next Steps

1. ✅ Deploy TenantGuard to production
2. ⏳ Monitor logs for cross-tenant access attempts
3. ⏳ Update all service layer methods to use `req.orgId`
4. ⏳ Add database-level Row Level Security (RLS) policies
5. ⏳ Conduct penetration testing focused on multi-tenancy
