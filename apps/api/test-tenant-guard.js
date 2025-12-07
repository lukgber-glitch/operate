/**
 * TenantGuard Integration Test
 *
 * This script tests the TenantGuard middleware to ensure proper tenant isolation
 *
 * Prerequisites:
 * - API server must be running (npm run dev)
 * - Test users must exist in the database
 *
 * Usage:
 * node test-tenant-guard.js
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE = process.env.API_URL || 'http://localhost:3000/api/v1';
const USE_HTTPS = API_BASE.startsWith('https');

// Test credentials (replace with actual test users)
const TEST_USER_ORG1 = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!@#'
};

// Utility: Parse JWT without dependencies
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse JWT:', err.message);
    return null;
  }
}

// Utility: Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test runner
async function runTests() {
  console.log('🔐 TenantGuard Security Test Suite\n');
  console.log(`API Base: ${API_BASE}\n`);
  console.log('═'.repeat(60));

  let passed = 0;
  let failed = 0;
  let token = null;
  let userOrgId = null;

  try {
    // Test 1: Login
    console.log('\n📝 Test 1: User Login');
    console.log('─'.repeat(60));
    try {
      const loginRes = await makeRequest(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: TEST_USER_ORG1
      });

      if (loginRes.status === 200 && loginRes.data.accessToken) {
        token = loginRes.data.accessToken;
        const payload = parseJwt(token);
        userOrgId = payload?.orgId;

        console.log(`✅ PASS: Login successful`);
        console.log(`   User Email: ${payload?.email}`);
        console.log(`   Organization ID: ${userOrgId || 'NOT SET'}`);
        passed++;
      } else {
        console.log(`❌ FAIL: Login failed`);
        console.log(`   Status: ${loginRes.status}`);
        console.log(`   Response:`, loginRes.data);
        failed++;
        return; // Cannot continue without token
      }
    } catch (err) {
      console.log(`❌ FAIL: Login error - ${err.message}`);
      failed++;
      return;
    }

    // Test 2: Access own organization's data (should succeed)
    console.log('\n📝 Test 2: Access Own Organization Data');
    console.log('─'.repeat(60));
    try {
      const res = await makeRequest(`${API_BASE}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 200 || res.status === 404) {
        console.log(`✅ PASS: Access to own organization data allowed`);
        console.log(`   Status: ${res.status}`);
        passed++;
      } else if (res.status === 403) {
        console.log(`❌ FAIL: Access to own organization data denied`);
        console.log(`   This suggests TenantGuard is misconfigured`);
        failed++;
      } else {
        console.log(`⚠️  WARN: Unexpected response - ${res.status}`);
        console.log(`   Response:`, res.data);
      }
    } catch (err) {
      console.log(`❌ FAIL: Request error - ${err.message}`);
      failed++;
    }

    // Test 3: Cross-tenant access via query parameter (should fail with 403)
    console.log('\n📝 Test 3: Cross-Tenant Access (Query Parameter)');
    console.log('─'.repeat(60));
    try {
      const fakeOrgId = 'fake-org-id-12345';
      const res = await makeRequest(`${API_BASE}/invoices?organizationId=${fakeOrgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 403) {
        console.log(`✅ PASS: Cross-tenant access blocked`);
        console.log(`   Error: ${res.data.message}`);
        passed++;
      } else {
        console.log(`❌ FAIL: Cross-tenant access NOT blocked`);
        console.log(`   Status: ${res.status}`);
        console.log(`   SECURITY ISSUE: TenantGuard not working!`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ FAIL: Request error - ${err.message}`);
      failed++;
    }

    // Test 4: Cross-tenant access via request body (should fail with 403)
    console.log('\n📝 Test 4: Cross-Tenant Access (Request Body)');
    console.log('─'.repeat(60));
    try {
      const fakeOrgId = 'fake-org-id-67890';
      const res = await makeRequest(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          organizationId: fakeOrgId,
          amount: 1000,
          description: 'Test invoice'
        }
      });

      if (res.status === 403) {
        console.log(`✅ PASS: Cross-tenant write blocked`);
        console.log(`   Error: ${res.data.message}`);
        passed++;
      } else {
        console.log(`❌ FAIL: Cross-tenant write NOT blocked`);
        console.log(`   Status: ${res.status}`);
        console.log(`   SECURITY ISSUE: TenantGuard not working!`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ FAIL: Request error - ${err.message}`);
      failed++;
    }

    // Test 5: Access with matching organizationId (should succeed)
    if (userOrgId) {
      console.log('\n📝 Test 5: Access With Matching Organization ID');
      console.log('─'.repeat(60));
      try {
        const res = await makeRequest(`${API_BASE}/invoices?organizationId=${userOrgId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 200 || res.status === 404) {
          console.log(`✅ PASS: Access allowed with matching orgId`);
          console.log(`   Status: ${res.status}`);
          passed++;
        } else if (res.status === 403) {
          console.log(`❌ FAIL: Access denied even with matching orgId`);
          console.log(`   This suggests TenantGuard is too strict`);
          failed++;
        } else {
          console.log(`⚠️  WARN: Unexpected response - ${res.status}`);
        }
      } catch (err) {
        console.log(`❌ FAIL: Request error - ${err.message}`);
        failed++;
      }
    }

    // Test 6: Public route (should succeed without token)
    console.log('\n📝 Test 6: Public Route Access');
    console.log('─'.repeat(60));
    try {
      const res = await makeRequest(`${API_BASE.replace('/v1', '')}/health`);

      if (res.status === 200) {
        console.log(`✅ PASS: Public route accessible`);
        console.log(`   Status: ${res.status}`);
        passed++;
      } else {
        console.log(`❌ FAIL: Public route not accessible`);
        console.log(`   Status: ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ FAIL: Request error - ${err.message}`);
      failed++;
    }

  } catch (err) {
    console.error('\n❌ Test suite error:', err);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Summary');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total:  ${passed + failed}`);
  console.log(`🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! TenantGuard is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the TenantGuard implementation.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
